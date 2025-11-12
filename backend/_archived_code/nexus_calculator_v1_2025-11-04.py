"""
Nexus Calculation Engine

Determines economic nexus status and estimates tax liability for each state.
"""

import logging
from typing import Dict, List, Tuple
from decimal import Decimal
import pandas as pd
from datetime import datetime

logger = logging.getLogger(__name__)


class NexusCalculator:
    """
    Core business logic for nexus determination and tax liability calculation.
    """

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def calculate_nexus_for_analysis(self, analysis_id: str) -> Dict:
        """
        Main calculation method - determines nexus for all states.

        Returns summary with total states analyzed, states with nexus, etc.
        """
        try:
            logger.info(f"Starting nexus calculation for analysis {analysis_id}")

            # Step 1: Aggregate transactions by state
            state_aggregates = self._aggregate_transactions_by_state(analysis_id)

            if not state_aggregates:
                raise ValueError("No transactions found for analysis")

            # Step 2: Get economic nexus thresholds for all states
            thresholds = self._get_economic_nexus_thresholds()

            # Step 3: Get tax rates for all states
            tax_rates = self._get_tax_rates()

            # Step 4: Get marketplace facilitator rules
            mf_rules = self._get_marketplace_facilitator_rules()

            # Step 5: Determine nexus for each state
            results = []
            total_liability = Decimal('0.00')
            states_with_nexus = 0
            states_approaching = 0

            for state_code, aggregates in state_aggregates.items():
                result = self._determine_state_nexus(
                    state_code=state_code,
                    total_sales=aggregates['total_sales'],
                    transaction_count=aggregates['transaction_count'],
                    direct_sales=aggregates['direct_sales'],
                    marketplace_sales=aggregates['marketplace_sales'],
                    threshold=thresholds.get(state_code),
                    tax_rate=tax_rates.get(state_code),
                    mf_rules=mf_rules.get(state_code)
                )

                results.append(result)

                if result['nexus_type'] in ['economic', 'physical', 'both']:
                    states_with_nexus += 1
                    total_liability += Decimal(str(result['estimated_liability']))

                if result.get('approaching_threshold', False):
                    states_approaching += 1

            # After existing state processing loop...

            # Get list of states that had transactions
            states_with_transactions = set([result['state'] for result in results])

            # Get ALL state codes
            all_state_codes = self._get_all_state_codes()

            # For states WITHOUT transactions, create default entries
            for state_code in all_state_codes:
                if state_code not in states_with_transactions:
                    # Fetch threshold for this state
                    threshold_info = thresholds.get(state_code)
                    if not threshold_info:
                        logger.warning(
                            f"No threshold data found for state {state_code}, using defaults. "
                            f"This may indicate incomplete reference data."
                        )
                        threshold_info = {
                            'revenue_threshold': 100000,
                            'transaction_threshold': 200,
                            'threshold_operator': 'or'  # lowercase to match comparison logic
                        }

                    # Create entry with $0 sales
                    results.append({
                        'analysis_id': analysis_id,
                        'state': state_code,
                        'total_sales': 0,
                        'direct_sales': 0,
                        'marketplace_sales': 0,
                        'transaction_count': 0,
                        'nexus_type': 'none',
                        'estimated_liability': 0,
                        'approaching_threshold': False,
                        'threshold': threshold_info.get('revenue_threshold') or 100000,  # Handle None
                        'nexus_date': None,
                        'base_tax': 0.0,
                        'interest': 0.0,
                        'penalties': 0.0
                    })

            logger.info(f"Prepared results for {len(results)} states (all states included)")

            # Step 5: Save results to database
            self._save_results_to_database(analysis_id, results)

            # Step 6: Update analysis status and summary
            self._update_analysis_summary(
                analysis_id=analysis_id,
                total_liability=float(total_liability),
                states_with_nexus=states_with_nexus
            )

            logger.info(f"Calculation complete for analysis {analysis_id}: {states_with_nexus} states with nexus")

            return {
                "total_states_analyzed": len(results),
                "states_with_nexus": states_with_nexus,
                "states_approaching_threshold": states_approaching,
                "total_estimated_liability": float(total_liability),
                "status": "complete"
            }

        except Exception as e:
            logger.error(f"Error calculating nexus for analysis {analysis_id}: {str(e)}")
            raise

    def _aggregate_transactions_by_state(self, analysis_id: str) -> Dict:
        """
        Aggregate all transactions by state.

        Returns dict with state_code as key and aggregates as value.
        """
        try:
            # Get all transactions
            result = self.supabase.table('sales_transactions') \
                .select('*') \
                .eq('analysis_id', analysis_id) \
                .execute()

            if not result.data:
                return {}

            # Convert to DataFrame for easy aggregation
            df = pd.DataFrame(result.data)

            # Aggregate by state
            aggregates = {}
            for state_code in df['customer_state'].unique():
                state_df = df[df['customer_state'] == state_code]

                # Calculate totals
                total_sales = float(state_df['sales_amount'].sum())
                transaction_count = len(state_df)

                # Split by sales channel
                direct_sales = float(state_df[state_df['sales_channel'] == 'direct']['sales_amount'].sum())
                marketplace_sales = float(state_df[state_df['sales_channel'] == 'marketplace']['sales_amount'].sum())

                aggregates[state_code] = {
                    'total_sales': total_sales,
                    'transaction_count': transaction_count,
                    'direct_sales': direct_sales,
                    'marketplace_sales': marketplace_sales
                }

            return aggregates

        except Exception as e:
            logger.error(f"Error aggregating transactions: {str(e)}")
            raise

    def _get_economic_nexus_thresholds(self) -> Dict:
        """
        Get current economic nexus thresholds for all states.

        Returns dict with state_code as key and threshold data as value.
        """
        try:
            # Get current thresholds (where effective_to IS NULL)
            result = self.supabase.table('economic_nexus_thresholds') \
                .select('*') \
                .is_('effective_to', 'null') \
                .execute()

            thresholds = {}
            for row in result.data:
                thresholds[row['state']] = {
                    'threshold_type': row['threshold_type'],
                    'revenue_threshold': float(row['revenue_threshold']) if row['revenue_threshold'] else None,
                    'transaction_threshold': row['transaction_threshold'],
                    'threshold_operator': row['threshold_operator']
                }

            return thresholds

        except Exception as e:
            logger.error(f"Error fetching nexus thresholds: {str(e)}")
            raise

    def _get_tax_rates(self) -> Dict:
        """
        Get tax rates for all states.

        Returns dict with state_code as key and rate data as value.
        """
        try:
            result = self.supabase.table('tax_rates') \
                .select('*') \
                .execute()

            rates = {}
            for row in result.data:
                # Use combined rate (state + avg local)
                combined_rate = float(row['state_rate']) + float(row['avg_local_rate'] or 0)
                rates[row['state']] = {
                    'state_rate': float(row['state_rate']),
                    'avg_local_rate': float(row['avg_local_rate'] or 0),
                    'combined_rate': combined_rate
                }

            return rates

        except Exception as e:
            logger.error(f"Error fetching tax rates: {str(e)}")
            raise

    def _get_marketplace_facilitator_rules(self) -> Dict:
        """
        Get current marketplace facilitator rules for all states.

        Returns dict with state_code as key and rule data as value.
        """
        try:
            result = self.supabase.table('marketplace_facilitator_rules') \
                .select('*') \
                .is_('effective_to', 'null') \
                .execute()

            rules = {}
            for row in result.data:
                rules[row['state']] = {
                    'has_mf_law': row['has_mf_law'],
                    'count_toward_threshold': row['count_toward_threshold'],
                    'exclude_from_liability': row['exclude_from_liability']
                }

            return rules

        except Exception as e:
            logger.error(f"Error fetching marketplace facilitator rules: {str(e)}")
            raise

    def _get_all_state_codes(self) -> List[str]:
        """
        Fetch all state codes from the states table.
        Returns list of 52+ state codes (50 states + DC + territories).
        """
        try:
            response = self.supabase.table('states').select('code').execute()
            return [state['code'] for state in response.data]
        except Exception as e:
            logger.error(f"Failed to fetch all state codes: {str(e)}")
            raise

    def _determine_state_nexus(
        self,
        state_code: str,
        total_sales: float,
        transaction_count: int,
        direct_sales: float,
        marketplace_sales: float,
        threshold: Dict,
        tax_rate: Dict,
        mf_rules: Dict = None
    ) -> Dict:
        """
        Determine if nexus exists in this state and calculate liability.

        Returns result dict for this state.
        """
        has_nexus = False
        nexus_type = 'none'
        approaching_threshold = False

        if threshold:
            # Check revenue threshold
            revenue_meets = False
            transaction_meets = False

            if threshold['revenue_threshold']:
                revenue_meets = total_sales >= threshold['revenue_threshold']
                # Check if approaching (within 90% of threshold)
                if not revenue_meets and total_sales >= (threshold['revenue_threshold'] * 0.9):
                    approaching_threshold = True

            if threshold['transaction_threshold']:
                transaction_meets = transaction_count >= threshold['transaction_threshold']

            # Apply operator logic
            if threshold['threshold_operator'] == 'or':
                has_nexus = revenue_meets or transaction_meets
            elif threshold['threshold_operator'] == 'and':
                has_nexus = revenue_meets and transaction_meets

            if has_nexus:
                nexus_type = 'economic'

        # Calculate estimated liability if nexus exists
        estimated_liability = 0.0
        base_tax = 0.0
        taxable_sales = 0.0

        if has_nexus and tax_rate:
            # Determine which sales are taxable based on marketplace facilitator rules
            if mf_rules and mf_rules.get('exclude_from_liability'):
                # Exclude marketplace sales - marketplace collects tax on those
                taxable_sales = direct_sales
            else:
                # No MF law or all sales are taxable
                taxable_sales = total_sales

            # Tax rates are stored as decimals in database (0.0825 for 8.25%)
            # DO NOT divide by 100 - that would make liability 100x too low!
            combined_rate = tax_rate['combined_rate']
            base_tax = taxable_sales * combined_rate
            estimated_liability = base_tax  # For MVP, no interest/penalties yet

        return {
            'state': state_code,
            'nexus_type': nexus_type,
            'nexus_date': datetime.utcnow().date().isoformat() if has_nexus else None,
            'total_sales': total_sales,
            'direct_sales': direct_sales,
            'marketplace_sales': marketplace_sales,
            'taxable_sales': taxable_sales,
            'transaction_count': transaction_count,
            'estimated_liability': estimated_liability,
            'base_tax': base_tax,
            'interest': 0.0,  # TODO: Calculate interest based on time period
            'penalties': 0.0,  # TODO: Calculate penalties if applicable
            'approaching_threshold': approaching_threshold,
            'threshold': threshold.get('revenue_threshold', 100000) if threshold else 100000
        }

    def _save_results_to_database(self, analysis_id: str, results: List[Dict]):
        """
        Save state results to database.
        """
        try:
            # Prepare data for insertion
            state_results = []
            for result in results:
                state_results.append({
                    'analysis_id': analysis_id,
                    'state': result['state'],
                    'nexus_type': result['nexus_type'],
                    'nexus_date': result['nexus_date'],
                    'total_sales': result['total_sales'],
                    'direct_sales': result['direct_sales'],
                    'marketplace_sales': result['marketplace_sales'],
                    'taxable_sales': result.get('taxable_sales', result['total_sales']),
                    'transaction_count': result.get('transaction_count', 0),
                    'estimated_liability': result['estimated_liability'],
                    'base_tax': result['base_tax'],
                    'interest': result['interest'],
                    'penalties': result['penalties'],
                    'approaching_threshold': result.get('approaching_threshold', False),
                    'threshold': result.get('threshold', 100000)
                })

            # Delete existing results (in case of re-calculation)
            self.supabase.table('state_results').delete().eq('analysis_id', analysis_id).execute()

            # Insert new results in batches
            batch_size = 50
            for i in range(0, len(state_results), batch_size):
                batch = state_results[i:i + batch_size]
                self.supabase.table('state_results').insert(batch).execute()

            logger.info(f"Saved {len(state_results)} state results for analysis {analysis_id}")

        except Exception as e:
            logger.error(f"Error saving results to database: {str(e)}")
            raise

    def _update_analysis_summary(self, analysis_id: str, total_liability: float, states_with_nexus: int):
        """
        Update analysis table with summary information.
        """
        try:
            self.supabase.table('analyses').update({
                'status': 'complete',
                'total_liability': total_liability,
                'states_with_nexus': states_with_nexus,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('id', analysis_id).execute()

        except Exception as e:
            logger.error(f"Error updating analysis summary: {str(e)}")
            raise
