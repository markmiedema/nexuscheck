"""Results retrieval and state detail endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Optional
from collections import defaultdict
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.auth import require_auth
from app.core.supabase import get_supabase
from app.config import settings
from app.schemas.responses import (
    StateResultsResponse,
    ResultsSummaryResponse,
    StateDetailResponse,
    # Nested models for type-safe construction
    DetailedYearData,
    YearSummary,
    YearThresholdInfo,
    YearTransaction,
    MonthlySales,
    ComplianceInfo,
    TaxRates,
    ThresholdInfo,
    RegistrationInfo,
    PenaltyInfo,
)
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/{analysis_id}/results/summary", response_model=ResultsSummaryResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_results_summary(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Get results summary for dashboard display.

    Returns high-level summary with states with nexus, total liability,
    top states, and approaching threshold information.
    """
    try:
        supabase = get_supabase()

        # Verify analysis exists and belongs to user
        analysis_result = supabase.table('analyses').select('*').eq('id', analysis_id).eq('user_id', user_id).execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )

        analysis = analysis_result.data[0]

        # Get state results
        results_query = supabase.table('state_results') \
            .select('*') \
            .eq('analysis_id', analysis_id) \
            .execute()

        if not results_query.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No results found. Please run calculation first."
            )

        state_results = results_query.data

        # Get state names for formatting
        states_query = supabase.table('states').select('code,name').execute()
        state_names = {s['code']: s['name'] for s in states_query.data}

        # Group by state (V2 supports multi-year)
        states_grouped = defaultdict(list)
        for result in state_results:
            states_grouped[result['state']].append(result)

        # Calculate summary statistics by aggregating across states
        total_states_analyzed = len(states_grouped)
        total_liability = 0
        total_revenue = 0
        states_with_nexus_set = set()
        states_no_nexus_set = set()
        physical_nexus_set = set()
        economic_nexus_set = set()
        both_nexus_set = set()

        # Aggregate per state
        state_aggregates = []
        states_approaching_set = set()  # Track states approaching threshold

        for state_code, year_results in states_grouped.items():
            # Sum across all years for this state
            state_total_sales = sum(float(r.get('total_sales', 0)) for r in year_results)
            state_total_liability = sum(float(r.get('estimated_liability', 0)) for r in year_results)

            total_revenue += state_total_sales
            total_liability += state_total_liability

            # Check if state has nexus in ANY year
            has_nexus_any_year = any(r.get('nexus_type') in ['economic', 'physical', 'both'] for r in year_results)

            # Check if state is approaching threshold in latest year
            latest_year_result = sorted(year_results, key=lambda x: x.get('year', 0))[-1]
            is_approaching = latest_year_result.get('approaching_threshold', False)
            if is_approaching and not has_nexus_any_year:
                states_approaching_set.add(state_code)

            if has_nexus_any_year:
                states_with_nexus_set.add(state_code)

                # Determine primary nexus type (use latest year)
                nexus_type = latest_year_result.get('nexus_type', 'none')

                if nexus_type == 'physical':
                    physical_nexus_set.add(state_code)
                elif nexus_type == 'economic':
                    economic_nexus_set.add(state_code)
                elif nexus_type == 'both':
                    both_nexus_set.add(state_code)
            else:
                states_no_nexus_set.add(state_code)

            # Store aggregate for top states calculation
            if state_total_liability > 0:
                state_aggregates.append({
                    'state': state_code,
                    'state_name': state_names.get(state_code, state_code),
                    'estimated_liability': state_total_liability,
                    'total_sales': state_total_sales,
                    'nexus_type': latest_year_result.get('nexus_type', 'none') if has_nexus_any_year else 'none'
                })

        # Get top states by liability (already aggregated)
        top_states_formatted = sorted(state_aggregates, key=lambda x: x['estimated_liability'], reverse=True)[:5]

        states_with_nexus = len(states_with_nexus_set)
        states_no_nexus = len(states_no_nexus_set)
        states_approaching = len(states_approaching_set)
        physical_count = len(physical_nexus_set)
        economic_only_count = len(economic_nexus_set)
        both_count = len(both_nexus_set)

        # Build detailed list of states approaching threshold
        approaching_states_list = []
        for state_code in states_approaching_set:
            year_results = states_grouped[state_code]
            latest_year = sorted(year_results, key=lambda x: x.get('year', 0))[-1]
            approaching_states_list.append({
                'state': state_code,
                'state_name': state_names.get(state_code, state_code),
                'total_sales': sum(float(r.get('total_sales', 0)) for r in year_results),
                'threshold': latest_year.get('threshold', 0)
            })

        return ResultsSummaryResponse(
            analysis_id=analysis_id,
            company_name=analysis['client_company_name'],
            period_start=analysis['analysis_period_start'],
            period_end=analysis['analysis_period_end'],
            status=analysis['status'],
            completed_at=analysis['updated_at'],
            summary={
                "total_states_analyzed": total_states_analyzed,
                "states_with_nexus": states_with_nexus,
                "states_approaching_threshold": states_approaching,
                "states_no_nexus": states_no_nexus,
                "total_estimated_liability": total_liability,
                "total_revenue": total_revenue,
                "confidence_level": "high",
                "manual_review_required": 0
            },
            nexus_breakdown={
                "physical_nexus": physical_count,
                "economic_nexus": economic_only_count,
                "no_nexus": states_no_nexus,
                "both": both_count
            },
            top_states_by_liability=top_states_formatted,
            approaching_threshold=approaching_states_list
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting results summary for analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get results summary. Please try again."
        )


@router.get("/{analysis_id}/results/states", response_model=StateResultsResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_state_results(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Get complete state-by-state results for table display.
    Returns all 50+ states including those with $0 sales.

    Used by Screen 5 (State Table) to show comprehensive list
    of all states with nexus determination, revenue, and liability.
    """
    supabase = get_supabase()

    try:
        # 1. Verify analysis exists and belongs to user
        analysis_response = supabase.table('analyses').select('*').eq(
            'id', analysis_id
        ).eq(
            'user_id', user_id
        ).execute()

        if not analysis_response.data:
            raise HTTPException(
                status_code=404,
                detail="Analysis not found or does not belong to current user"
            )

        # 2. Fetch all state results for this analysis
        state_results_response = supabase.table('state_results').select(
            '*'
        ).eq(
            'analysis_id', analysis_id
        ).execute()

        if not state_results_response.data:
            raise HTTPException(
                status_code=404,
                detail="No calculation results found. Please run calculation first."
            )

        # 3. Fetch state names from states table
        states_response = supabase.table('states').select(
            'code, name'
        ).execute()

        state_names = {
            s['code']: s['name']
            for s in states_response.data
        }

        # 4. Check which states are registered (from physical_nexus table)
        physical_nexus_response = supabase.table('physical_nexus').select(
            'state_code'
        ).eq(
            'analysis_id', analysis_id
        ).execute()

        registered_states = {
            pn['state_code']
            for pn in physical_nexus_response.data
        }

        # 4b. Fetch threshold operators and transaction thresholds from economic_nexus_thresholds table
        thresholds_response = supabase.table('economic_nexus_thresholds').select(
            'state, threshold_operator, transaction_threshold'
        ).execute()

        threshold_operators = {
            t['state']: t.get('threshold_operator', 'or')
            for t in thresholds_response.data
        }

        transaction_thresholds = {
            t['state']: t.get('transaction_threshold')
            for t in thresholds_response.data
        }

        # 5. Group results by state (V2 supports multi-year)
        states_grouped = defaultdict(list)

        for result in state_results_response.data:
            states_grouped[result['state']].append(result)

        # 6. Format response for each state with year_data
        formatted_states = []

        for state_code, year_results in states_grouped.items():
            # Sort by year
            year_results_sorted = sorted(year_results, key=lambda x: x.get('year', 0))

            # Aggregate totals across all years
            total_sales_all_years = sum(float(r.get('total_sales', 0)) for r in year_results)
            total_liability_all_years = sum(float(r.get('estimated_liability', 0)) for r in year_results)
            direct_sales_all_years = sum(float(r.get('direct_sales', 0)) for r in year_results)
            marketplace_sales_all_years = sum(float(r.get('marketplace_sales', 0)) for r in year_results)
            exempt_sales_all_years = sum(float(r.get('exempt_sales', 0)) for r in year_results)
            taxable_sales_all_years = sum(float(r.get('taxable_sales', 0)) for r in year_results)
            exposure_sales_all_years = sum(float(r.get('exposure_sales', 0)) for r in year_results)
            transaction_count_all_years = sum(int(r.get('transaction_count', 0)) for r in year_results)
            # Aggregate liability breakdown
            base_tax_all_years = sum(float(r.get('base_tax', 0)) for r in year_results)
            interest_all_years = sum(float(r.get('interest', 0)) for r in year_results)
            penalties_all_years = sum(float(r.get('penalties', 0)) for r in year_results)

            # Use the most recent year's data for threshold and nexus status
            latest_year_result = year_results_sorted[-1]

            threshold = latest_year_result.get('threshold', 0)
            if threshold > 0:
                threshold_percent = round((total_sales_all_years / threshold) * 100, 1)
            else:
                threshold_percent = 0

            # Determine overall nexus status (has nexus if ANY year has nexus)
            has_nexus_any_year = any(r.get('nexus_type') in ['physical', 'economic', 'both'] for r in year_results)
            approaching_any_year = any(r.get('approaching_threshold', False) for r in year_results)

            if has_nexus_any_year:
                nexus_status = 'has_nexus'
                nexus_type = latest_year_result.get('nexus_type', 'none')
            elif approaching_any_year:
                nexus_status = 'approaching'
                nexus_type = 'none'
            else:
                nexus_status = 'no_nexus'
                nexus_type = 'none'

            # Build year_data array with V2 fields
            year_data = []
            for yr in year_results_sorted:
                year_data.append({
                    'year': yr.get('year'),
                    'nexus_type': yr.get('nexus_type', 'none'),
                    'nexus_date': yr.get('nexus_date'),
                    'obligation_start_date': yr.get('obligation_start_date'),
                    'first_nexus_year': yr.get('first_nexus_year'),
                    'total_sales': float(yr.get('total_sales', 0)),
                    'exempt_sales': float(yr.get('exempt_sales', 0)),
                    'taxable_sales': float(yr.get('taxable_sales', 0)),
                    'exposure_sales': float(yr.get('exposure_sales', 0)),
                    'direct_sales': float(yr.get('direct_sales', 0)),
                    'marketplace_sales': float(yr.get('marketplace_sales', 0)),
                    'estimated_liability': float(yr.get('estimated_liability', 0)),
                    'base_tax': float(yr.get('base_tax', 0)),
                    'interest': float(yr.get('interest', 0)),
                    'penalties': float(yr.get('penalties', 0)),
                    'penalty_breakdown': yr.get('penalty_breakdown'),  # Detailed penalty breakdown
                    'interest_rate': yr.get('interest_rate'),
                    'interest_method': yr.get('interest_method'),
                    'days_outstanding': yr.get('days_outstanding')
                })

            # Aggregate penalty breakdown across all years
            aggregated_penalty_breakdown = {}
            for yr in year_results:
                pb = yr.get('penalty_breakdown') or {}
                for key, value in pb.items():
                    if value is not None and key != 'total':
                        aggregated_penalty_breakdown[key] = aggregated_penalty_breakdown.get(key, 0) + float(value)
            # Calculate total from components
            if aggregated_penalty_breakdown:
                aggregated_penalty_breakdown['total'] = sum(v for v in aggregated_penalty_breakdown.values())

            # Get interest metadata from most recent year with liability
            latest_with_interest = next(
                (yr for yr in reversed(year_results_sorted) if yr.get('interest', 0) > 0),
                latest_year_result
            )

            # Build state object with year_data
            formatted_states.append({
                'state_code': state_code,
                'state_name': state_names.get(state_code, state_code),
                'nexus_status': nexus_status,
                'nexus_type': nexus_type,
                'total_sales': total_sales_all_years,
                'exempt_sales': exempt_sales_all_years,
                'taxable_sales': taxable_sales_all_years,
                'exposure_sales': exposure_sales_all_years,
                'direct_sales': direct_sales_all_years,
                'marketplace_sales': marketplace_sales_all_years,
                'transaction_count': transaction_count_all_years,
                'threshold': float(threshold),
                'threshold_percent': threshold_percent,
                'threshold_operator': threshold_operators.get(state_code, 'or'),
                'transaction_threshold': transaction_thresholds.get(state_code),
                'estimated_liability': total_liability_all_years,
                'base_tax': base_tax_all_years,
                'interest': interest_all_years,
                'penalties': penalties_all_years,
                'penalty_breakdown': aggregated_penalty_breakdown if aggregated_penalty_breakdown else None,
                'interest_rate': latest_with_interest.get('interest_rate'),
                'interest_method': latest_with_interest.get('interest_method'),
                'days_outstanding': latest_with_interest.get('days_outstanding'),
                'confidence_level': 'high',  # Using V2 calculator with full transaction data
                'registration_status': (
                    'registered' if state_code in registered_states
                    else 'not_registered'
                ),
                'year_data': year_data  # New: per-year breakdown
            })

        return StateResultsResponse(
            analysis_id=analysis_id,
            total_states=len(formatted_states),
            states=formatted_states
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch state results: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch state results. Please try again."
        )


def _parse_transaction_date(date_str: str) -> datetime:
    """Parse a transaction date string from the database to a datetime object."""
    return datetime.fromisoformat(date_str.replace('Z', '+00:00'))


@router.get("/{analysis_id}/states/{state_code}", response_model=StateDetailResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_state_detail(
    request: Request,
    analysis_id: str,
    state_code: str,
    user_id: str = Depends(require_auth)
):
    """
    Get detailed analysis for a specific state.

    Includes:
    - Transaction details
    - Year-by-year aggregates
    - Threshold status
    - Compliance information

    Performance optimizations:
    - Single RPC call combines all 7 queries into 1 database round-trip
    - Monthly aggregation via SQL function instead of Python loops
    - Transaction limit (500) to prevent large payloads
    """
    supabase = get_supabase()

    try:
        # Single RPC call fetches all data (includes ownership check)
        rpc_result = supabase.rpc('get_state_detail_complete', {
            'p_analysis_id': analysis_id,
            'p_state_code': state_code,
            'p_user_id': user_id
        }).execute()

        if not rpc_result.data:
            raise HTTPException(status_code=500, detail="Failed to fetch state detail data")

        data = rpc_result.data

        # Check for access error from RPC function
        if isinstance(data, dict) and data.get('error'):
            if data['error'] == 'not_found':
                raise HTTPException(status_code=404, detail="Analysis not found")
            raise HTTPException(status_code=403, detail=data.get('message', 'Access denied'))

        # Extract data from combined response
        state_info = data.get('state_info')
        state_year_results = data.get('state_results') or []
        transactions = data.get('transactions') or []
        aggregates = data.get('aggregates')
        monthly_aggregates = data.get('monthly_aggregates') or []
        threshold_info = data.get('thresholds')
        tax_rate_data = data.get('tax_rates')

        if not state_info:
            raise HTTPException(status_code=404, detail="Invalid state code")

        state_name = state_info['name']
        registration_url = state_info.get('registration_url')
        state_tax_website = state_info.get('state_tax_website')

        # Debug logging
        logger.debug(f"[STATE DETAIL] {state_code}: Total transactions: {len(transactions)}")

        # Helper function to build tax_rates from query result (used in both paths)
        def build_tax_rates():
            if tax_rate_data:
                state_rate = float(tax_rate_data.get('state_rate', 0)) * 100
                avg_local_rate = float(tax_rate_data.get('avg_local_rate', 0)) * 100
                combined_rate = float(tax_rate_data.get('combined_avg_rate', 0)) * 100
                return TaxRates(
                    state_rate=round(state_rate, 2),
                    avg_local_rate=round(avg_local_rate, 2),
                    combined_rate=round(combined_rate, 2),
                    max_local_rate=0.0
                )
            return TaxRates(state_rate=0.0, avg_local_rate=0.0, combined_rate=0.0, max_local_rate=0.0)

        if not state_year_results:
            # State has no transactions - use already-fetched compliance info
            tax_rates = build_tax_rates()

            threshold_info_model = ThresholdInfo(
                revenue_threshold=threshold_info.get('revenue_threshold') if threshold_info else None,
                transaction_threshold=threshold_info.get('transaction_threshold') if threshold_info else None,
                threshold_operator=threshold_info.get('threshold_operator') if threshold_info else None,
                lookback_period=threshold_info.get('lookback_period') if threshold_info else None
            )

            registration_info = RegistrationInfo(
                registration_required=False,
                registration_fee=0,
                filing_frequencies=['Monthly', 'Quarterly', 'Annual'],
                registration_url=registration_url,
                dor_website=state_tax_website
            )

            compliance_info = ComplianceInfo(
                tax_rates=tax_rates,
                threshold_info=threshold_info_model,
                registration_info=registration_info,
                penalty_info=None,  # No penalty info for states without transactions
                filing_frequency='Monthly',
                filing_method='Online',
                sstm_member=False
            )

            return StateDetailResponse(
                state_code=state_code,
                state_name=state_name,
                analysis_id=analysis_id,
                has_transactions=False,
                analysis_period={'years_available': []},
                year_data=[],
                compliance_info=compliance_info,
                total_sales=0.0,
                taxable_sales=0.0,
                exempt_sales=0.0,
                direct_sales=0.0,
                marketplace_sales=0.0,
                exposure_sales=0.0,
                transaction_count=0,
                estimated_liability=0.0,
                base_tax=0.0,
                interest=0.0,
                penalties=0.0,
                nexus_type='none',
                first_nexus_year=None
            )

        # Validate aggregates result (from combined RPC call)
        if not aggregates:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get aggregated data for {state_code}. Database view returned no results."
            )

        # Build year_data from V2 calculated results (from combined RPC call)
        year_data = []
        years_available = []

        for year_result in state_year_results:
            year = year_result['year']
            years_available.append(year)

            # Determine nexus_status from V2 nexus_type
            nexus_type = year_result.get('nexus_type', 'none')
            nexus_status = 'has_nexus' if nexus_type in ['economic', 'physical', 'both'] else 'none'

            # Get transactions for this year for transaction list
            year_transactions = [
                tx for tx in transactions
                if _parse_transaction_date(tx['transaction_date']).year == year
            ]
            logger.debug(f"[STATE DETAIL] {state_code} year {year}: {len(year_transactions)} transactions")

            # Build transactions list with running total
            running_total = 0
            transactions_list = []
            for tx in year_transactions:
                running_total += tx['sales_amount']
                tx_date = _parse_transaction_date(tx['transaction_date'])
                transactions_list.append({
                    'transaction_id': tx['transaction_id'],
                    'transaction_date': tx['transaction_date'],
                    'sales_amount': tx['sales_amount'],
                    'taxable_amount': tx.get('taxable_amount', 0),
                    'exempt_amount': tx.get('exempt_amount', 0),
                    'is_taxable': tx.get('is_taxable', True),
                    'sales_channel': tx['sales_channel'],
                    'year': year,
                    'month': tx_date.strftime('%Y-%m'),
                    'running_total': running_total
                })

            # Build monthly aggregates from SQL function results (not Python loops)
            # monthly_aggregates contains pre-aggregated data from get_monthly_sales_aggregates()
            year_monthly_data = {m['month_num']: m for m in monthly_aggregates if m['year'] == year}
            monthly_sales = []
            for month_num in range(1, 13):
                month_str = f"{year}-{month_num:02d}"
                month_data = year_monthly_data.get(month_num, {})
                monthly_sales.append({
                    'month': month_str,
                    'sales': float(month_data.get('total_sales', 0)),
                    'transaction_count': int(month_data.get('transaction_count', 0))
                })

            # Calculate threshold metrics
            total_sales = float(year_result.get('total_sales', 0))
            revenue_threshold = threshold_info.get('revenue_threshold') if threshold_info else None

            threshold_data = {
                'revenue_threshold': revenue_threshold,
                'transaction_threshold': threshold_info.get('transaction_threshold') if threshold_info else None,
                'threshold_operator': threshold_info.get('threshold_operator', 'or') if threshold_info else 'or',
                'percentage_of_threshold': round((total_sales / revenue_threshold) * 100, 1) if revenue_threshold and revenue_threshold > 0 else 0,
                'amount_until_nexus': max(0, revenue_threshold - total_sales) if revenue_threshold else 0,
                'amount_over_nexus': max(0, total_sales - revenue_threshold) if revenue_threshold and total_sales > revenue_threshold else None,
                'approaching': year_result.get('approaching_threshold', False)
            }

            # Build Pydantic models for type safety
            year_summary = YearSummary(
                total_sales=total_sales,
                transaction_count=len(year_transactions),
                direct_sales=float(year_result.get('direct_sales', 0)),
                marketplace_sales=float(year_result.get('marketplace_sales', 0)),
                taxable_sales=float(year_result.get('taxable_sales', 0)),
                exposure_sales=float(year_result.get('exposure_sales', 0)),
                exempt_sales=float(year_result.get('exempt_sales', 0)),
                estimated_liability=float(year_result.get('estimated_liability', 0)),
                base_tax=float(year_result.get('base_tax', 0)),
                interest=float(year_result.get('interest', 0)),
                penalties=float(year_result.get('penalties', 0)),
                penalty_breakdown=year_result.get('penalty_breakdown'),  # Detailed penalty breakdown
                # Calculation metadata for transparency
                interest_rate=float(year_result.get('interest_rate', 0)) * 100 if year_result.get('interest_rate') else None,  # Convert to percentage
                interest_method=year_result.get('interest_method'),
                days_outstanding=year_result.get('days_outstanding'),
                penalty_rate=float(year_result.get('penalty_rate', 0)) * 100 if year_result.get('penalty_rate') else None  # Convert to percentage
            )

            year_threshold_info = YearThresholdInfo(**threshold_data)

            monthly_sales_models = [MonthlySales(**ms) for ms in monthly_sales]
            transaction_models = [YearTransaction(**tx) for tx in transactions_list]

            year_data.append(DetailedYearData(
                year=year,
                nexus_status=nexus_status,
                nexus_type=nexus_type,
                nexus_date=year_result.get('nexus_date'),
                obligation_start_date=year_result.get('obligation_start_date'),
                first_nexus_year=year_result.get('first_nexus_year'),
                summary=year_summary,
                threshold_info=year_threshold_info,
                monthly_sales=monthly_sales_models,
                transactions=transaction_models
            ))

        # Build compliance info using helper function and already-fetched data
        tax_rates = build_tax_rates()

        # Threshold info
        threshold_info_model = ThresholdInfo(
            revenue_threshold=threshold_info.get('revenue_threshold') if threshold_info else None,
            transaction_threshold=threshold_info.get('transaction_threshold') if threshold_info else None,
            threshold_operator=threshold_info.get('threshold_operator') if threshold_info else None,
            lookback_period=threshold_info.get('lookback_period') if threshold_info else None
        )

        # Registration info
        registration_info = RegistrationInfo(
            registration_required=False,  # TODO: Source from state registration requirements table
            registration_fee=0,  # TODO: Source from state registration requirements table
            filing_frequencies=['Monthly', 'Quarterly', 'Annual'],  # TODO: Source from state compliance table
            registration_url=registration_url,
            dor_website=state_tax_website
        )

        # Penalty info - fetch from state_penalty_interest_configs
        penalty_info_model = None
        try:
            penalty_config_result = supabase.table('state_penalty_interest_configs') \
                .select('config') \
                .eq('state', state_code) \
                .order('effective_date', desc=True) \
                .limit(1) \
                .execute()

            if penalty_config_result.data:
                config = penalty_config_result.data[0].get('config', {})
                interest_config = config.get('interest', {})
                late_filing = config.get('late_filing')
                late_payment = config.get('late_payment')

                # Build human-readable descriptions
                interest_rate = interest_config.get('annual_rate')
                if interest_rate is None and interest_config.get('monthly_rate'):
                    interest_rate = interest_config.get('monthly_rate') * 12  # Convert monthly to annual
                interest_method = interest_config.get('method', 'simple')
                interest_desc = None
                if interest_rate is not None:
                    rate_pct = round(interest_rate * 100, 1)
                    interest_desc = f"{rate_pct}% annual, {interest_method} interest"

                def format_penalty_rule(rule):
                    if not rule:
                        return None
                    rule_type = rule.get('type')
                    if rule_type == 'flat':
                        rate = round(rule.get('rate', 0) * 100)
                        desc = f"{rate}%"
                        if rule.get('max_rate'):
                            desc += f" (max {round(rule.get('max_rate') * 100)}%)"
                        return desc
                    elif rule_type == 'flat_fee':
                        return f"${rule.get('amount', 0)}"
                    elif rule_type == 'per_period':
                        rate = round(rule.get('rate_per_period', 0) * 100, 1)
                        period = rule.get('period_type', 'month')
                        desc = f"{rate}%/{period}"
                        if rule.get('max_rate'):
                            desc += f" (max {round(rule.get('max_rate') * 100)}%)"
                        return desc
                    elif rule_type == 'tiered':
                        tiers = rule.get('tiers', [])
                        if tiers:
                            first = tiers[0]
                            last = tiers[-1]
                            return f"{round(first.get('rate', 0) * 100)}%-{round(last.get('rate', 0) * 100)}% tiered"
                        return "Tiered"
                    elif rule_type == 'base_plus_per_period':
                        base = round(rule.get('base_rate', 0) * 100)
                        per_period = round(rule.get('rate_per_period', 0) * 100, 1)
                        desc = f"{base}% + {per_period}%/month"
                        if rule.get('max_rate'):
                            desc += f" (max {round(rule.get('max_rate') * 100)}%)"
                        return desc
                    return None

                penalty_info_model = PenaltyInfo(
                    interest_rate=round(interest_rate * 100, 1) if interest_rate else None,
                    interest_method=interest_method,
                    interest_description=interest_desc,
                    late_filing_description=format_penalty_rule(late_filing),
                    late_payment_description=format_penalty_rule(late_payment),
                    notes=config.get('notes')
                )
        except Exception as e:
            logger.warning(f"Failed to fetch penalty config for {state_code}: {e}")

        compliance_info = ComplianceInfo(
            tax_rates=tax_rates,
            threshold_info=threshold_info_model,
            registration_info=registration_info,
            penalty_info=penalty_info_model,
            filing_frequency='Monthly',  # TODO: Source from state compliance table
            filing_method='Online',  # TODO: Source from state compliance table
            sstm_member=False  # TODO: Source from state compliance table
        )

        # Get aggregate totals from combined RPC response
        # Validate that all required columns are present
        agg = aggregates  # Already extracted from RPC response
        required_columns = [
            'total_sales', 'taxable_sales', 'exempt_sales', 'direct_sales',
            'marketplace_sales', 'exposure_sales', 'transaction_count',
            'estimated_liability', 'base_tax', 'interest', 'penalties',
            'nexus_type', 'first_nexus_year'
        ]
        missing_columns = [col for col in required_columns if col not in agg]
        if missing_columns:
            logger.error(f"Database view state_results_aggregated missing columns: {missing_columns}")
            raise HTTPException(
                status_code=500,
                detail=f"Database view missing required columns: {', '.join(missing_columns)}. Please check migrations."
            )

        total_sales_all_years = float(agg.get('total_sales') or 0)
        total_taxable_sales_all_years = float(agg.get('taxable_sales') or 0)
        total_exempt_sales_all_years = float(agg.get('exempt_sales') or 0)
        total_direct_sales_all_years = float(agg.get('direct_sales') or 0)
        total_marketplace_sales_all_years = float(agg.get('marketplace_sales') or 0)
        total_exposure_sales_all_years = float(agg.get('exposure_sales') or 0)
        total_transaction_count_all_years = int(agg.get('transaction_count') or 0)
        total_liability_all_years = float(agg.get('estimated_liability') or 0)
        total_base_tax_all_years = float(agg.get('base_tax') or 0)
        total_interest_all_years = float(agg.get('interest') or 0)
        total_penalties_all_years = float(agg.get('penalties') or 0)
        aggregate_nexus_type = agg.get('nexus_type', 'none')
        first_nexus_year = agg.get('first_nexus_year')

        # Aggregate penalty breakdown across all years
        aggregated_penalty_breakdown = {}
        for yr in state_year_results:
            pb = yr.get('penalty_breakdown') or {}
            for key, value in pb.items():
                if value is not None and key != 'total':
                    aggregated_penalty_breakdown[key] = aggregated_penalty_breakdown.get(key, 0) + float(value)
        # Calculate total from components
        if aggregated_penalty_breakdown:
            aggregated_penalty_breakdown['total'] = sum(v for v in aggregated_penalty_breakdown.values())

        # Get interest metadata from most recent year with liability
        latest_with_interest = next(
            (yr for yr in reversed(state_year_results) if yr.get('interest', 0) > 0),
            state_year_results[-1] if state_year_results else {}
        )

        # Debug logging to check nexus_type values
        logger.debug(f"State detail API response for {state_code}:")
        logger.debug(f"  Aggregate nexus_type: {aggregate_nexus_type}")
        if year_data:
            for yr in year_data:
                logger.debug(f"  Year {yr.year}: nexus_type={yr.nexus_type}, nexus_status={yr.nexus_status}")

        return StateDetailResponse(
            state_code=state_code,
            state_name=state_name,
            analysis_id=analysis_id,
            has_transactions=True,
            analysis_period={'years_available': years_available},
            year_data=year_data,
            compliance_info=compliance_info,
            total_sales=total_sales_all_years,
            taxable_sales=total_taxable_sales_all_years,
            exempt_sales=total_exempt_sales_all_years,
            direct_sales=total_direct_sales_all_years,
            marketplace_sales=total_marketplace_sales_all_years,
            exposure_sales=total_exposure_sales_all_years,
            transaction_count=total_transaction_count_all_years,
            estimated_liability=total_liability_all_years,
            base_tax=total_base_tax_all_years,
            interest=total_interest_all_years,
            penalties=total_penalties_all_years,
            penalty_breakdown=aggregated_penalty_breakdown if aggregated_penalty_breakdown else None,
            interest_rate=float(latest_with_interest.get('interest_rate', 0)) * 100 if latest_with_interest.get('interest_rate') else None,
            interest_method=latest_with_interest.get('interest_method'),
            days_outstanding=latest_with_interest.get('days_outstanding'),
            nexus_type=aggregate_nexus_type,
            first_nexus_year=first_nexus_year
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching state detail: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch state detail. Please try again."
        )
