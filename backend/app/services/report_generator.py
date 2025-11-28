"""PDF Report Generation Service using WeasyPrint"""
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Optional, TYPE_CHECKING

logger = logging.getLogger(__name__)

# Template directory
TEMPLATE_DIR = Path(__file__).parent.parent / "templates"

# Lazy imports to avoid loading WeasyPrint at module import time
# WeasyPrint has heavy system dependencies that may not be available in all environments
_jinja_env = None
_font_config = None


def _get_jinja_env():
    """Lazily initialize Jinja2 environment"""
    global _jinja_env
    if _jinja_env is None:
        from jinja2 import Environment, FileSystemLoader
        _jinja_env = Environment(
            loader=FileSystemLoader(TEMPLATE_DIR),
            autoescape=True
        )
    return _jinja_env


def _get_font_config():
    """Lazily initialize WeasyPrint font configuration"""
    global _font_config
    if _font_config is None:
        from weasyprint.text.fonts import FontConfiguration
        _font_config = FontConfiguration()
    return _font_config


class ReportGenerator:
    """Generates PDF reports for nexus analysis"""

    def __init__(self):
        # Don't initialize anything heavy in __init__
        # All heavy dependencies are loaded lazily when needed
        pass

    def generate_nexus_report(
        self,
        analysis_id: str,
        company_name: str,
        period_start: Optional[str],
        period_end: Optional[str],
        summary: dict[str, Any],
        nexus_breakdown: dict[str, int],
        states_with_nexus: list[dict[str, Any]],
        states_approaching: list[dict[str, Any]],
        all_states: Optional[list[dict[str, Any]]] = None,
        state_details: Optional[list[dict[str, Any]]] = None,
        include_all_states: bool = True,
        include_state_details: bool = True
    ) -> bytes:
        """
        Generate a comprehensive nexus analysis PDF report.

        Args:
            analysis_id: Unique analysis identifier
            company_name: Client company name
            period_start: Analysis period start date
            period_end: Analysis period end date
            summary: Summary statistics (total_states_analyzed, states_with_nexus, etc.)
            nexus_breakdown: Breakdown by nexus type (physical_nexus, economic_nexus, both, none)
            states_with_nexus: List of states that have established nexus
            states_approaching: List of states approaching threshold
            all_states: Complete list of all states analyzed (optional)
            state_details: Detailed state-by-state analysis (optional)
            include_all_states: Whether to include the full state list
            include_state_details: Whether to include detailed state breakdowns

        Returns:
            PDF file as bytes
        """
        try:
            # Lazy import WeasyPrint only when actually generating a report
            from weasyprint import HTML

            env = _get_jinja_env()
            font_config = _get_font_config()

            template = env.get_template("report_template.html")

            # Format dates for display
            generated_date = datetime.now().strftime("%B %d, %Y at %I:%M %p")

            # Render HTML
            html_content = template.render(
                analysis_id=analysis_id,
                company_name=company_name,
                period_start=period_start,
                period_end=period_end,
                generated_date=generated_date,
                summary=summary,
                nexus_breakdown=nexus_breakdown,
                states_with_nexus=states_with_nexus,
                states_approaching=states_approaching,
                all_states=all_states,
                state_details=state_details,
                include_all_states=include_all_states and all_states,
                include_state_details=include_state_details and state_details
            )

            # Convert to PDF
            html = HTML(string=html_content)
            pdf_bytes = html.write_pdf(font_config=font_config)

            logger.info(f"Generated PDF report for analysis {analysis_id}, size: {len(pdf_bytes)} bytes")
            return pdf_bytes

        except Exception as e:
            logger.error(f"Failed to generate PDF report: {str(e)}")
            raise

    def generate_state_report(
        self,
        analysis_id: str,
        company_name: str,
        state_detail: dict[str, Any],
        period_start: Optional[str] = None,
        period_end: Optional[str] = None
    ) -> bytes:
        """
        Generate a single-state detailed PDF report.

        Args:
            analysis_id: Unique analysis identifier
            company_name: Client company name
            state_detail: Detailed state analysis data
            period_start: Analysis period start date
            period_end: Analysis period end date

        Returns:
            PDF file as bytes
        """
        # Use the same template but with only one state
        return self.generate_nexus_report(
            analysis_id=analysis_id,
            company_name=company_name,
            period_start=period_start,
            period_end=period_end,
            summary={
                "total_states_analyzed": 1,
                "states_with_nexus": 1 if state_detail.get("nexus_status") == "has_nexus" else 0,
                "states_approaching_threshold": 1 if state_detail.get("nexus_status") == "approaching" else 0,
                "total_estimated_liability": state_detail.get("estimated_liability", 0)
            },
            nexus_breakdown={
                "physical_nexus": 1 if state_detail.get("nexus_type") == "physical" else 0,
                "economic_nexus": 1 if state_detail.get("nexus_type") == "economic" else 0,
                "both": 1 if state_detail.get("nexus_type") == "both" else 0,
                "none": 1 if state_detail.get("nexus_type") in (None, "none") else 0
            },
            states_with_nexus=[state_detail] if state_detail.get("nexus_status") == "has_nexus" else [],
            states_approaching=[state_detail] if state_detail.get("nexus_status") == "approaching" else [],
            all_states=None,
            state_details=[state_detail],
            include_all_states=False,
            include_state_details=True
        )


# Singleton instance
_report_generator: Optional[ReportGenerator] = None


def get_report_generator() -> ReportGenerator:
    """Get or create the report generator singleton"""
    global _report_generator
    if _report_generator is None:
        _report_generator = ReportGenerator()
    return _report_generator
