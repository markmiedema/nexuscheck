"""
Report Generator Service

Generates professional PDF reports for nexus analysis results.
Uses WeasyPrint for PDF generation and Jinja2 for templating.

Features:
- Modular template system (cover, executive summary, action items, state details, appendix)
- Auto VDA calculation for all nexus states
- Priority categorization (Register Now / Consider VDA / Monitor)
- Dynamic narrative generation
"""

import logging
import re
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
from collections import defaultdict

logger = logging.getLogger(__name__)

# Template directory
TEMPLATE_DIR = Path(__file__).parent.parent / "templates"

# Lazy imports to avoid loading WeasyPrint at module import time
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


# State name lookup
STATE_NAMES = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
}


class ReportGeneratorV2:
    """
    Generates nexus analysis PDF reports with modular templates.

    Report sections:
    1. Cover Page - Professional branding
    2. Executive Summary - Big numbers, narrative, overview
    3. Action Items - Register Now / Consider VDA / Monitor
    4. State Details - One page per nexus/approaching state
    5. Appendix - Complete state list, methodology, disclaimers
    """

    # Approaching threshold percentage
    APPROACHING_THRESHOLD = 70

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def generate_report(
        self,
        analysis_id: str,
        options: Optional[Dict] = None
    ) -> bytes:
        """
        Generate a complete PDF report for an analysis.

        Args:
            analysis_id: The analysis to generate report for
            options: Optional configuration:
                - include_state_details: bool (default True)
                - preparer_name: str
                - preparer_firm: str

        Returns:
            PDF content as bytes
        """
        from weasyprint import HTML

        options = options or {}
        logger.info(f"Generating report for analysis {analysis_id}")

        # Gather all report data
        report_data = self._gather_report_data(analysis_id)

        # Add preparer info if provided
        report_data['preparer_name'] = options.get('preparer_name')
        report_data['preparer_firm'] = options.get('preparer_firm')

        env = _get_jinja_env()
        font_config = _get_font_config()

        # Generate HTML for each section
        html_sections = []

        # 1. Cover page
        html_sections.append(self._render_template(env, 'report/cover.html', report_data))

        # 2. Executive summary
        html_sections.append(self._render_template(env, 'report/executive_summary.html', report_data))

        # 3. Action items
        html_sections.append(self._render_template(env, 'report/action_items.html', report_data))

        # 4. State details (for nexus and approaching states only)
        if options.get('include_state_details', True):
            for state_data in report_data['state_details']:
                html_sections.append(self._render_template(env, 'report/state_detail.html', state_data))

        # 5. Appendix
        html_sections.append(self._render_template(env, 'report/appendix.html', report_data))

        # Combine all sections
        combined_html = self._combine_html_sections(html_sections)

        # Generate PDF
        pdf = HTML(string=combined_html, base_url=str(TEMPLATE_DIR)).write_pdf(font_config=font_config)

        logger.info(f"Report generated successfully for analysis {analysis_id}, size: {len(pdf)} bytes")
        return pdf

    def _gather_report_data(self, analysis_id: str) -> Dict[str, Any]:
        """Gather all data needed for the report from database."""
        # Get analysis details
        analysis = self._get_analysis(analysis_id)

        # Get state results
        state_results = self._get_state_results(analysis_id)

        # Calculate VDA for all nexus states automatically
        vda_results = self._calculate_vda_for_all_nexus_states(analysis_id, state_results)

        # Categorize states by priority
        categorized = self._categorize_states(state_results, vda_results)

        # Generate narrative
        narrative = self._generate_narrative(analysis, state_results, vda_results)

        # Calculate totals
        totals = self._calculate_totals(state_results, vda_results)

        # Build report data structure
        return {
            # Cover page
            'client_name': analysis.get('client_company_name', 'Unknown Company'),
            'period_start': analysis.get('analysis_period_start'),
            'period_end': analysis.get('analysis_period_end'),
            'report_date': datetime.now().strftime('%B %d, %Y'),

            # Executive summary
            'states_with_nexus': totals['states_with_nexus'],
            'total_exposure': totals['total_liability'],
            'vda_savings': totals['total_vda_savings'],
            'narrative': narrative,
            'total_states_analyzed': totals['total_states_analyzed'],
            'states_with_activity': totals['states_with_activity'],
            'states_approaching': totals['states_approaching'],
            'total_sales': totals['total_sales'],
            'taxable_sales': totals['taxable_sales'],
            'total_liability': totals['total_liability'],
            'interest_and_penalties': totals['interest_and_penalties'],
            'top_states': categorized['top_states'],

            # Action items
            'register_now': categorized['register_now'],
            'consider_vda': categorized['consider_vda'],
            'monitor': categorized['monitor'],
            'total_vda_savings': totals['total_vda_savings'],

            # State details (only nexus and approaching states)
            'state_details': self._build_state_details(state_results, vda_results, categorized),

            # Appendix
            'all_states': self._build_all_states_summary(state_results),
            'total_transactions': analysis.get('total_transactions', 0),
        }

    def _get_analysis(self, analysis_id: str) -> Dict:
        """Get analysis details from database."""
        result = self.supabase.table('analyses') \
            .select('*') \
            .eq('id', analysis_id) \
            .execute()

        if not result.data:
            raise ValueError(f"Analysis {analysis_id} not found")

        return result.data[0]

    def _get_state_results(self, analysis_id: str) -> List[Dict]:
        """Get state results from database."""
        result = self.supabase.table('state_results') \
            .select('*') \
            .eq('analysis_id', analysis_id) \
            .execute()

        return result.data or []

    def _calculate_vda_for_all_nexus_states(
        self,
        analysis_id: str,
        state_results: List[Dict]
    ) -> Dict[str, Dict]:
        """Calculate VDA savings for all states with nexus automatically."""
        from app.services.vda_calculator import VDACalculator

        vda_calc = VDACalculator(self.supabase)

        # Find states with nexus
        aggregates = self._aggregate_by_state(state_results)
        nexus_states = [
            state_code for state_code, data in aggregates.items()
            if data.get('nexus_status') == 'has_nexus'
        ]

        if not nexus_states:
            return {}

        try:
            vda_result = vda_calc.calculate_vda_scenario(analysis_id, nexus_states)
            return {
                s['state_code']: s
                for s in vda_result.get('state_breakdown', [])
            }
        except Exception as e:
            logger.warning(f"VDA calculation failed: {e}")
            return {}

    def _aggregate_by_state(self, state_results: List[Dict]) -> Dict[str, Dict]:
        """Aggregate multi-year state results into single state summaries."""
        aggregates = defaultdict(lambda: {
            'total_sales': 0,
            'taxable_sales': 0,
            'exempt_sales': 0,
            'direct_sales': 0,
            'marketplace_sales': 0,
            'base_tax': 0,
            'interest': 0,
            'penalties': 0,
            'estimated_liability': 0,
            'nexus_status': 'no_nexus',
            'nexus_type': None,
            'threshold': 100000,
            'threshold_percent': 0,
            'year_data': [],
        })

        for result in state_results:
            state = result['state']
            agg = aggregates[state]

            # Sum numeric fields
            agg['total_sales'] += float(result.get('total_sales', 0) or 0)
            agg['taxable_sales'] += float(result.get('taxable_sales', 0) or 0)
            agg['exempt_sales'] += float(result.get('exempt_sales', 0) or 0)
            agg['direct_sales'] += float(result.get('direct_sales', 0) or 0)
            agg['marketplace_sales'] += float(result.get('marketplace_sales', 0) or 0)
            agg['base_tax'] += float(result.get('base_tax', 0) or 0)
            agg['interest'] += float(result.get('interest', 0) or 0)
            agg['penalties'] += float(result.get('penalties', 0) or 0)
            agg['estimated_liability'] += float(result.get('estimated_liability', 0) or 0)

            # Determine nexus status from nexus_type field
            # nexus_type in ['economic', 'physical', 'both'] means has nexus
            nexus_type = result.get('nexus_type')
            if nexus_type in ['economic', 'physical', 'both']:
                agg['nexus_status'] = 'has_nexus'
                agg['nexus_type'] = nexus_type
            elif result.get('has_nexus') or result.get('nexus_status') == 'has_nexus':
                agg['nexus_status'] = 'has_nexus'
            elif (result.get('nexus_status') == 'approaching' or
                  float(result.get('threshold_percent', 0) or 0) >= self.APPROACHING_THRESHOLD):
                if agg['nexus_status'] != 'has_nexus':
                    agg['nexus_status'] = 'approaching'

            # Take nexus type if not already set
            if nexus_type and not agg['nexus_type']:
                agg['nexus_type'] = nexus_type

            # Threshold info
            if result.get('revenue_threshold') or result.get('threshold'):
                agg['threshold'] = float(result.get('revenue_threshold') or result.get('threshold') or 100000)
            if result.get('threshold_percent'):
                agg['threshold_percent'] = max(agg['threshold_percent'], float(result['threshold_percent']))

            agg['year_data'].append(result)

        return dict(aggregates)

    def _categorize_states(
        self,
        state_results: List[Dict],
        vda_results: Dict[str, Dict]
    ) -> Dict[str, List[Dict]]:
        """Categorize states into action groups."""
        register_now = []
        consider_vda = []
        monitor = []
        top_states = []

        state_aggregates = self._aggregate_by_state(state_results)

        for state_code, data in state_aggregates.items():
            state_name = STATE_NAMES.get(state_code, state_code)

            if data['nexus_status'] == 'has_nexus':
                state_info = {
                    'state_code': state_code,
                    'state_name': state_name,
                    'nexus_type': data.get('nexus_type', 'economic'),
                    'total_sales': data['total_sales'],
                    'taxable_sales': data['taxable_sales'],
                    'estimated_liability': data['estimated_liability'],
                    'filing_frequency': 'Monthly',
                }
                register_now.append(state_info)
                top_states.append(state_info)

                # Check for VDA savings
                vda = vda_results.get(state_code)
                if vda and vda.get('savings', 0) > 0:
                    consider_vda.append({
                        'state_code': state_code,
                        'state_name': state_name,
                        'before_vda': vda['before_vda'],
                        'with_vda': vda['with_vda'],
                        'savings': vda['savings'],
                    })

            elif data['nexus_status'] == 'approaching':
                monitor.append({
                    'state_code': state_code,
                    'state_name': state_name,
                    'current_sales': data['total_sales'],
                    'threshold': data.get('threshold', 100000),
                    'threshold_percent': data.get('threshold_percent', 0),
                })

        # Sort
        register_now.sort(key=lambda x: x['estimated_liability'], reverse=True)
        top_states.sort(key=lambda x: x['estimated_liability'], reverse=True)
        consider_vda.sort(key=lambda x: x['savings'], reverse=True)
        monitor.sort(key=lambda x: x['threshold_percent'], reverse=True)

        return {
            'register_now': register_now,
            'consider_vda': consider_vda,
            'monitor': monitor,
            'top_states': top_states[:5],
        }

    def _generate_narrative(
        self,
        analysis: Dict,
        state_results: List[Dict],
        vda_results: Dict[str, Dict]
    ) -> str:
        """Generate the bottom line narrative for executive summary."""
        aggregates = self._aggregate_by_state(state_results)

        nexus_states = [s for s, d in aggregates.items() if d['nexus_status'] == 'has_nexus']
        approaching_states = [s for s, d in aggregates.items() if d['nexus_status'] == 'approaching']

        total_liability = sum(d['estimated_liability'] for d in aggregates.values())
        total_vda_savings = sum(v.get('savings', 0) for v in vda_results.values())

        company_name = analysis.get('client_company_name', 'Your company')

        if len(nexus_states) == 0 and len(approaching_states) == 0:
            return (
                f"Good news! {company_name} has not established economic nexus in any new states "
                "based on the sales data analyzed. Continue monitoring sales thresholds as "
                "your business grows."
            )
        elif len(nexus_states) == 0:
            states_text = self._format_state_list(approaching_states)
            return (
                f"Good news - {company_name} has not yet created nexus in any new states. "
                f"However, you're approaching thresholds in {states_text}. "
                "Consider proactive registration planning."
            )
        elif total_vda_savings > 0:
            approaching_text = f" and is approaching thresholds in {len(approaching_states)} more" if approaching_states else ""
            return (
                f"{company_name} has established economic nexus in {len(nexus_states)} "
                f"state{'s' if len(nexus_states) > 1 else ''}{approaching_text}. "
                f"Total estimated exposure is ${total_liability:,.0f}, but you could save approximately "
                f"${total_vda_savings:,.0f} through voluntary disclosure agreements."
            )
        else:
            approaching_text = f" and is approaching thresholds in {len(approaching_states)} more" if approaching_states else ""
            return (
                f"{company_name} has established economic nexus in {len(nexus_states)} "
                f"state{'s' if len(nexus_states) > 1 else ''}{approaching_text}. "
                f"Total estimated exposure is ${total_liability:,.0f}. Immediate registration "
                "is recommended to avoid additional penalties and interest."
            )

    def _format_state_list(self, state_codes: List[str]) -> str:
        """Format a list of state codes as readable text."""
        state_names = [STATE_NAMES.get(s, s) for s in state_codes[:3]]
        if len(state_codes) > 3:
            return f"{', '.join(state_names[:-1])}, {state_names[-1]}, and {len(state_codes) - 3} more"
        elif len(state_codes) == 2:
            return f"{state_names[0]} and {state_names[1]}"
        elif len(state_codes) == 1:
            return state_names[0]
        return ', '.join(state_names)

    def _calculate_totals(
        self,
        state_results: List[Dict],
        vda_results: Dict[str, Dict]
    ) -> Dict[str, Any]:
        """Calculate summary totals for the report."""
        aggregates = self._aggregate_by_state(state_results)

        states_with_nexus = sum(1 for d in aggregates.values() if d['nexus_status'] == 'has_nexus')
        states_approaching = sum(1 for d in aggregates.values() if d['nexus_status'] == 'approaching')

        return {
            'total_states_analyzed': 50,
            'states_with_activity': len(aggregates),
            'states_with_nexus': states_with_nexus,
            'states_approaching': states_approaching,
            'total_sales': sum(d['total_sales'] for d in aggregates.values()),
            'taxable_sales': sum(d['taxable_sales'] for d in aggregates.values()),
            'total_liability': sum(d['estimated_liability'] for d in aggregates.values()),
            'base_tax': sum(d['base_tax'] for d in aggregates.values()),
            'interest': sum(d['interest'] for d in aggregates.values()),
            'penalties': sum(d['penalties'] for d in aggregates.values()),
            'interest_and_penalties': sum(d['interest'] + d['penalties'] for d in aggregates.values()),
            'total_vda_savings': sum(v.get('savings', 0) for v in vda_results.values()),
        }

    def _build_state_details(
        self,
        state_results: List[Dict],
        vda_results: Dict[str, Dict],
        categorized: Dict[str, List]
    ) -> List[Dict]:
        """Build detailed data for each state page."""
        details = []
        aggregates = self._aggregate_by_state(state_results)

        # Include states with nexus or approaching
        include_states = set()
        for item in categorized['register_now']:
            include_states.add(item['state_code'])
        for item in categorized['monitor']:
            include_states.add(item['state_code'])

        for state_code in include_states:
            data = aggregates.get(state_code, {})
            vda = vda_results.get(state_code, {})

            detail = {
                'state_code': state_code,
                'state_name': STATE_NAMES.get(state_code, state_code),
                'nexus_status': data.get('nexus_status', 'no_nexus'),
                'nexus_type': data.get('nexus_type', 'economic'),
                'total_sales': data.get('total_sales', 0),
                'direct_sales': data.get('direct_sales', 0),
                'marketplace_sales': data.get('marketplace_sales', 0),
                'taxable_sales': data.get('taxable_sales', 0),
                'exempt_sales': data.get('exempt_sales', 0),
                'base_tax': data.get('base_tax', 0),
                'interest': data.get('interest', 0),
                'penalties': data.get('penalties', 0),
                'estimated_liability': data.get('estimated_liability', 0),
                'threshold': data.get('threshold', 100000),
                'threshold_percent': data.get('threshold_percent', 0),
                'amount_until_nexus': max(0, data.get('threshold', 100000) - data.get('total_sales', 0)),
                'transaction_threshold': None,
                'threshold_operator': 'OR',
                'first_nexus_year': None,
                'state_rate': 0,
                'avg_local_rate': 0,
                'combined_rate': 0,
                'filing_frequency': 'Monthly',
                'registration_fee': None,
                'year_data': self._format_year_data(data.get('year_data', [])),
                'vda_savings': vda.get('savings', 0),
                'before_vda': vda.get('before_vda', 0),
                'with_vda': vda.get('with_vda', 0),
            }
            details.append(detail)

        details.sort(key=lambda x: x['estimated_liability'], reverse=True)
        return details

    def _format_year_data(self, year_data: List[Dict]) -> List[Dict]:
        """Format year data for state detail template."""
        formatted = []
        for row in year_data:
            formatted.append({
                'year': row.get('year'),
                'total_sales': float(row.get('total_sales', 0) or 0),
                'taxable_sales': float(row.get('taxable_sales', 0) or 0),
                'base_tax': float(row.get('base_tax', 0) or 0),
                'interest': float(row.get('interest', 0) or 0),
                'penalties': float(row.get('penalties', 0) or 0),
                'estimated_liability': float(row.get('estimated_liability', 0) or 0),
            })
        return sorted(formatted, key=lambda x: x['year'] if x['year'] else 0)

    def _build_all_states_summary(self, state_results: List[Dict]) -> List[Dict]:
        """Build summary list of all states for appendix."""
        aggregates = self._aggregate_by_state(state_results)

        summaries = []
        for state_code, data in aggregates.items():
            summaries.append({
                'state_code': state_code,
                'state_name': STATE_NAMES.get(state_code, state_code),
                'nexus_status': data['nexus_status'],
                'total_sales': data['total_sales'],
                'threshold': data.get('threshold', 100000),
                'threshold_percent': data.get('threshold_percent', 0),
                'estimated_liability': data['estimated_liability'],
            })

        status_order = {'has_nexus': 0, 'approaching': 1, 'no_nexus': 2}
        summaries.sort(key=lambda x: (status_order.get(x['nexus_status'], 3), -x['total_sales']))
        return summaries

    def _render_template(self, env, template_name: str, context: Dict) -> str:
        """Render a Jinja2 template with the given context."""
        template = env.get_template(template_name)
        return template.render(**context)

    def _combine_html_sections(self, sections: List[str]) -> str:
        """Combine multiple HTML section renders into a single document."""
        # Get base template
        env = _get_jinja_env()
        base_template = env.get_template('report/base.html')
        base_html = base_template.render(title='Nexus Analysis Report')

        # Extract content from each section
        body_contents = []
        for section in sections:
            match = re.search(r'<body[^>]*>(.*?)</body>', section, re.DOTALL)
            if match:
                body_contents.append(match.group(1).strip())
            else:
                body_contents.append(section)

        # Combine
        combined_body = '\n'.join(body_contents)
        final_html = re.sub(
            r'(<body[^>]*>).*?(</body>)',
            rf'\1\n{combined_body}\n\2',
            base_html,
            flags=re.DOTALL
        )

        return final_html


# Keep the old class for backwards compatibility
class ReportGenerator:
    """Legacy report generator - redirects to V2"""

    def __init__(self):
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
        """Generate report using legacy single-template approach."""
        try:
            from weasyprint import HTML

            env = _get_jinja_env()
            font_config = _get_font_config()

            template = env.get_template("report_template.html")
            generated_date = datetime.now().strftime("%B %d, %Y at %I:%M %p")

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
        """Generate a single-state detailed PDF report."""
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


# Singleton instances
_report_generator: Optional[ReportGenerator] = None
_report_generator_v2: Optional[ReportGeneratorV2] = None


def get_report_generator() -> ReportGenerator:
    """Get or create the legacy report generator singleton"""
    global _report_generator
    if _report_generator is None:
        _report_generator = ReportGenerator()
    return _report_generator


def get_report_generator_v2(supabase_client) -> ReportGeneratorV2:
    """Get or create the V2 report generator"""
    global _report_generator_v2
    if _report_generator_v2 is None:
        _report_generator_v2 = ReportGeneratorV2(supabase_client)
    return _report_generator_v2
