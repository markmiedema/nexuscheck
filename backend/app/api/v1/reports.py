"""Report generation endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import Response
from typing import Optional
from enum import Enum
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.auth import require_auth
from app.core.supabase import get_supabase
from app.config import settings
from app.services.report_generator import get_report_generator
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class ReportType(str, Enum):
    """Available report types"""
    SUMMARY = "summary"          # Executive summary with nexus states
    DETAILED = "detailed"        # Full report with all states and details
    STATE_SPECIFIC = "state"     # Single state detailed report


class GenerateReportRequest(BaseModel):
    """Request body for report generation"""
    report_type: ReportType = ReportType.DETAILED
    state_code: Optional[str] = None  # Required for state-specific reports
    include_all_states: bool = True
    include_state_details: bool = True


class ReportMetadata(BaseModel):
    """Metadata about a generated report"""
    analysis_id: str
    report_type: str
    generated_at: str
    file_size: int


@router.post("/{analysis_id}/reports/generate")
@limiter.limit("10/minute")  # Limit report generation
async def generate_report(
    request: Request,
    analysis_id: str,
    body: GenerateReportRequest,
    user_id: str = Depends(require_auth)
):
    """
    Generate a PDF report for an analysis.

    Returns the PDF file directly for download.

    Args:
        analysis_id: The analysis to generate a report for
        body: Report generation options
            - report_type: "summary", "detailed", or "state"
            - state_code: Required for state-specific reports
            - include_all_states: Include complete state list in detailed report
            - include_state_details: Include year-by-year breakdowns
    """
    supabase = get_supabase()

    try:
        # Verify analysis exists and belongs to user
        analysis_result = supabase.table('analyses') \
            .select('*') \
            .eq('id', analysis_id) \
            .eq('user_id', user_id) \
            .is_('deleted_at', 'null') \
            .execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )

        analysis = analysis_result.data[0]

        # Validate state-specific report
        if body.report_type == ReportType.STATE_SPECIFIC and not body.state_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="state_code is required for state-specific reports"
            )

        # Get state results
        states_result = supabase.table('state_results') \
            .select('*') \
            .eq('analysis_id', analysis_id) \
            .execute()

        if not states_result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No results found. Please run the analysis calculation first."
            )

        # Get state names
        state_codes = list(set(s['state'] for s in states_result.data))
        states_info = supabase.table('states') \
            .select('code, name') \
            .in_('code', state_codes) \
            .execute()

        state_names = {s['code']: s['name'] for s in states_info.data} if states_info.data else {}

        # Process state data
        all_states = []
        states_with_nexus = []
        states_approaching = []
        state_details = []

        # Get year data for each state
        for state in states_result.data:
            state_code = state['state']
            state_name = state_names.get(state_code, state_code)

            # Determine nexus status
            nexus_status = 'no_nexus'
            if state.get('has_nexus'):
                nexus_status = 'has_nexus'
            elif state.get('threshold_percent', 0) >= 80:
                nexus_status = 'approaching'

            state_data = {
                'state_code': state_code,
                'state_name': state_name,
                'nexus_status': nexus_status,
                'nexus_type': state.get('nexus_type', 'none'),
                'total_sales': state.get('total_sales', 0) or 0,
                'direct_sales': state.get('direct_sales', 0) or 0,
                'marketplace_sales': state.get('marketplace_sales', 0) or 0,
                'taxable_sales': state.get('taxable_sales', 0) or 0,
                'exempt_sales': state.get('exempt_sales', 0) or 0,
                'exposure_sales': state.get('exposure_sales', 0) or 0,
                'threshold': state.get('threshold', 0) or 0,
                'threshold_percent': state.get('threshold_percent', 0) or 0,
                'estimated_liability': state.get('estimated_liability', 0) or 0,
                'base_tax': state.get('base_tax', 0) or 0,
                'interest': state.get('interest', 0) or 0,
                'penalties': state.get('penalties', 0) or 0,
                'transaction_count': state.get('transaction_count', 0) or 0,
            }

            all_states.append(state_data)

            if nexus_status == 'has_nexus':
                states_with_nexus.append(state_data)
            elif nexus_status == 'approaching':
                states_approaching.append(state_data)

            # For state-specific report, only include requested state
            if body.report_type == ReportType.STATE_SPECIFIC:
                if state_code != body.state_code:
                    continue

            # Get detailed data for state details
            if body.include_state_details or body.report_type == ReportType.STATE_SPECIFIC:
                # Get year-specific data from the state result
                year_data = state.get('year_data', [])

                # Get compliance info
                compliance_result = supabase.table('states') \
                    .select('*') \
                    .eq('code', state_code) \
                    .execute()

                threshold_result = supabase.table('economic_nexus_thresholds') \
                    .select('*') \
                    .eq('state_code', state_code) \
                    .execute()

                compliance_info = None
                if compliance_result.data:
                    state_info = compliance_result.data[0]
                    threshold_info = threshold_result.data[0] if threshold_result.data else {}

                    compliance_info = {
                        'tax_rates': {
                            'state_rate': state_info.get('state_tax_rate', 0) or 0,
                            'avg_local_rate': state_info.get('avg_local_rate', 0) or 0,
                            'combined_rate': (state_info.get('state_tax_rate', 0) or 0) + (state_info.get('avg_local_rate', 0) or 0),
                            'max_local_rate': state_info.get('max_local_rate', 0) or 0,
                        },
                        'threshold_info': {
                            'revenue_threshold': threshold_info.get('revenue_threshold'),
                            'transaction_threshold': threshold_info.get('transaction_threshold'),
                            'threshold_operator': threshold_info.get('threshold_operator', 'or'),
                        },
                        'filing_frequency': state_info.get('filing_frequency', 'monthly'),
                        'filing_method': state_info.get('filing_method', 'online'),
                        'sstm_member': state_info.get('sstm_member', False),
                        'registration_info': {
                            'registration_required': True,
                            'registration_fee': state_info.get('registration_fee', 0) or 0,
                            'filing_frequencies': [state_info.get('filing_frequency', 'monthly')],
                            'registration_url': state_info.get('registration_url'),
                            'dor_website': state_info.get('dor_website'),
                        }
                    }

                detail_data = {
                    **state_data,
                    'year_data': year_data if year_data else [],
                    'compliance_info': compliance_info
                }
                state_details.append(detail_data)

        # Sort states
        states_with_nexus.sort(key=lambda x: x['estimated_liability'], reverse=True)
        states_approaching.sort(key=lambda x: x['threshold_percent'], reverse=True)
        all_states.sort(key=lambda x: x['total_sales'], reverse=True)
        state_details.sort(key=lambda x: x['estimated_liability'], reverse=True)

        # Calculate summary
        summary = {
            'total_states_analyzed': len(all_states),
            'states_with_nexus': len(states_with_nexus),
            'states_approaching_threshold': len(states_approaching),
            'total_estimated_liability': sum(s['estimated_liability'] for s in states_with_nexus),
            'total_revenue': sum(s['total_sales'] for s in all_states),
        }

        # Calculate nexus breakdown
        nexus_breakdown = {
            'physical_nexus': sum(1 for s in states_with_nexus if s['nexus_type'] == 'physical'),
            'economic_nexus': sum(1 for s in states_with_nexus if s['nexus_type'] == 'economic'),
            'both': sum(1 for s in states_with_nexus if s['nexus_type'] == 'both'),
            'none': sum(1 for s in all_states if s['nexus_status'] == 'no_nexus'),
        }

        # Generate PDF
        report_generator = get_report_generator()

        if body.report_type == ReportType.STATE_SPECIFIC:
            if not state_details:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"State {body.state_code} not found in analysis results"
                )
            pdf_bytes = report_generator.generate_state_report(
                analysis_id=analysis_id,
                company_name=analysis['client_company_name'],
                state_detail=state_details[0],
                period_start=analysis.get('analysis_period_start'),
                period_end=analysis.get('analysis_period_end')
            )
            filename = f"nexus_report_{analysis['client_company_name'].replace(' ', '_')}_{body.state_code}.pdf"
        else:
            pdf_bytes = report_generator.generate_nexus_report(
                analysis_id=analysis_id,
                company_name=analysis['client_company_name'],
                period_start=analysis.get('analysis_period_start'),
                period_end=analysis.get('analysis_period_end'),
                summary=summary,
                nexus_breakdown=nexus_breakdown,
                states_with_nexus=states_with_nexus,
                states_approaching=states_approaching,
                all_states=all_states if body.include_all_states else None,
                state_details=state_details if body.include_state_details else None,
                include_all_states=body.include_all_states,
                include_state_details=body.include_state_details
            )
            report_suffix = "summary" if body.report_type == ReportType.SUMMARY else "detailed"
            filename = f"nexus_report_{analysis['client_company_name'].replace(' ', '_')}_{report_suffix}.pdf"

        # Clean up filename
        filename = "".join(c for c in filename if c.isalnum() or c in ('_', '-', '.'))

        logger.info(f"Generated {body.report_type} report for analysis {analysis_id}")

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes))
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        logger.error(f"Error generating report: {str(e)}\n{error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.get("/{analysis_id}/reports/preview")
@limiter.limit("30/minute")
async def preview_report_data(
    request: Request,
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Get report data preview without generating PDF.

    Useful for previewing what will be in the report.
    """
    supabase = get_supabase()

    try:
        # Verify analysis exists and belongs to user
        analysis_result = supabase.table('analyses') \
            .select('*') \
            .eq('id', analysis_id) \
            .eq('user_id', user_id) \
            .is_('deleted_at', 'null') \
            .execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )

        analysis = analysis_result.data[0]

        # Get state results
        states_result = supabase.table('state_results') \
            .select('*') \
            .eq('analysis_id', analysis_id) \
            .execute()

        if not states_result.data:
            return {
                "analysis_id": analysis_id,
                "company_name": analysis['client_company_name'],
                "has_results": False,
                "message": "No results found. Please run the analysis calculation first."
            }

        # Get state names
        state_codes = list(set(s['state'] for s in states_result.data))
        states_info = supabase.table('states') \
            .select('code, name') \
            .in_('code', state_codes) \
            .execute()

        state_names = {s['code']: s['name'] for s in states_info.data} if states_info.data else {}

        # Process state data
        states_with_nexus = []
        states_approaching = []

        for state in states_result.data:
            state_code = state['state']
            state_name = state_names.get(state_code, state_code)

            nexus_status = 'no_nexus'
            if state.get('has_nexus'):
                nexus_status = 'has_nexus'
            elif state.get('threshold_percent', 0) >= 80:
                nexus_status = 'approaching'

            state_data = {
                'state_code': state_code,
                'state_name': state_name,
                'nexus_status': nexus_status,
                'nexus_type': state.get('nexus_type', 'none'),
                'total_sales': state.get('total_sales', 0) or 0,
                'estimated_liability': state.get('estimated_liability', 0) or 0,
                'threshold_percent': state.get('threshold_percent', 0) or 0,
            }

            if nexus_status == 'has_nexus':
                states_with_nexus.append(state_data)
            elif nexus_status == 'approaching':
                states_approaching.append(state_data)

        # Sort
        states_with_nexus.sort(key=lambda x: x['estimated_liability'], reverse=True)
        states_approaching.sort(key=lambda x: x['threshold_percent'], reverse=True)

        return {
            "analysis_id": analysis_id,
            "company_name": analysis['client_company_name'],
            "period_start": analysis.get('analysis_period_start'),
            "period_end": analysis.get('analysis_period_end'),
            "has_results": True,
            "summary": {
                "total_states_analyzed": len(states_result.data),
                "states_with_nexus": len(states_with_nexus),
                "states_approaching_threshold": len(states_approaching),
                "total_estimated_liability": sum(s['estimated_liability'] for s in states_with_nexus)
            },
            "states_with_nexus": states_with_nexus[:5],  # Top 5
            "states_approaching": states_approaching[:5],  # Top 5
            "available_report_types": [
                {"type": "summary", "description": "Executive summary with nexus states only"},
                {"type": "detailed", "description": "Full report with all states and year-by-year details"},
                {"type": "state", "description": "Single state detailed report (requires state_code)"}
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting report preview: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get report preview"
        )
