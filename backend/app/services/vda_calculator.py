"""
VDA (Voluntary Disclosure Agreement) Calculator

Calculates savings from VDA scenarios where states waive penalties
and sometimes reduce interest rates.

VDA allows businesses to voluntarily report uncollected taxes in exchange for:
- Reduced or waived penalties (most states)
- Limited lookback period (3-4 years vs. unlimited audit)
- No criminal liability
- Reduced interest (some states)
"""

import logging
from typing import Dict, List
from decimal import Decimal

logger = logging.getLogger(__name__)


class VDACalculator:
    """
    Calculate VDA scenarios with penalty/interest waivers.
    """

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def calculate_vda_scenario(
        self,
        analysis_id: str,
        selected_states: List[str]
    ) -> Dict:
        """
        Calculate VDA scenario with selected states.

        Args:
            analysis_id: Analysis to calculate VDA for
            selected_states: List of state codes to include in VDA

        Returns:
            Dict with:
            - total_savings: Total amount saved across all states
            - before_vda: Total liability before VDA
            - with_vda: Total liability with VDA
            - state_breakdown: Per-state savings details
        """
        logger.info(f"Calculating VDA for analysis {analysis_id} with {len(selected_states)} states")

        # Get current state results
        state_results = self._get_state_results(analysis_id)

        if not state_results:
            raise ValueError("No state results found for analysis")

        # Aggregate results by state (sum across all years)
        from collections import defaultdict
        state_aggregates = defaultdict(lambda: {
            'base_tax': Decimal('0.00'),
            'interest': Decimal('0.00'),
            'penalties': Decimal('0.00')
        })

        for result in state_results:
            state_code = result['state']
            state_aggregates[state_code]['base_tax'] += Decimal(str(result.get('base_tax', 0) or 0))
            state_aggregates[state_code]['interest'] += Decimal(str(result.get('interest', 0) or 0))
            state_aggregates[state_code]['penalties'] += Decimal(str(result.get('penalties', 0) or 0))

        # Calculate VDA for each state
        total_savings = Decimal('0.00')
        before_vda_total = Decimal('0.00')
        state_breakdown = []

        for state_code, amounts in state_aggregates.items():
            base_tax = amounts['base_tax']
            interest = amounts['interest']
            penalties = amounts['penalties']

            before_total = base_tax + interest + penalties

            # Skip states with no liability (like Alabama in your case)
            if before_total == 0:
                continue

            before_vda_total += before_total

            # Check if state is in VDA
            if state_code in selected_states:
                # Get VDA rules for state
                vda_rules = self._get_vda_rules(state_code)

                # Calculate waivers
                penalty_waived = penalties if vda_rules.get('penalties_waived', True) else Decimal('0.00')
                interest_waived = interest if vda_rules.get('interest_waived', False) else Decimal('0.00')

                savings = penalty_waived + interest_waived
                total_savings += savings

                after_total = base_tax + (interest - interest_waived) + (penalties - penalty_waived)

                # Update ALL year rows for this state with VDA calculations
                self._update_vda_calculation_all_years(analysis_id, state_code, {
                    'vda_penalty_waived': float(penalty_waived),
                    'vda_interest_waived': float(interest_waived),
                    'vda_total_savings': float(savings)
                })

                state_breakdown.append({
                    'state_code': state_code,
                    'state_name': self._get_state_name(state_code),
                    'before_vda': float(before_total),
                    'with_vda': float(after_total),
                    'savings': float(savings),
                    'penalty_waived': float(penalty_waived),
                    'interest_waived': float(interest_waived),
                    'base_tax': float(base_tax),
                    'interest': float(interest),
                    'penalties': float(penalties)
                })

        with_vda_total = before_vda_total - total_savings

        # Update analyses table
        self._update_analysis_vda(analysis_id, selected_states)

        return {
            'total_savings': float(total_savings),
            'before_vda': float(before_vda_total),
            'with_vda': float(with_vda_total),
            'savings_percentage': float((total_savings / before_vda_total * 100)) if before_vda_total > 0 else 0,
            'state_breakdown': sorted(state_breakdown, key=lambda x: x['savings'], reverse=True)
        }

    def _get_state_results(self, analysis_id: str) -> List[Dict]:
        """Get state results for analysis."""
        response = self.supabase.table('state_results')\
            .select('*')\
            .eq('analysis_id', analysis_id)\
            .execute()

        return response.data

    def _get_vda_rules(self, state_code: str) -> Dict:
        """
        Get VDA rules for a state from vda_programs table.

        Returns:
            Dict with:
            - penalties_waived: Whether penalties are waived (default True)
            - interest_waived: Whether interest is waived (default False)
            - lookback_months: Lookback period in months
        """
        response = self.supabase.table('vda_programs')\
            .select('*')\
            .eq('state_code', state_code)\
            .execute()

        if response.data:
            return {
                'penalties_waived': response.data[0].get('penalties_waived', True),
                'interest_waived': response.data[0].get('interest_waived', False),
                'lookback_months': response.data[0].get('lookback_period_months', 48)
            }

        # Default VDA rules (most common scenario)
        logger.info(f"No VDA rules found for {state_code}, using defaults")
        return {
            'penalties_waived': True,    # Most states waive penalties
            'interest_waived': False,    # Most states do NOT waive interest
            'lookback_months': 48        # 4 years is common
        }

    def _get_state_name(self, state_code: str) -> str:
        """Get full state name from code."""
        state_names = {
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
        return state_names.get(state_code, state_code)

    def _update_vda_calculation_all_years(self, analysis_id: str, state_code: str, vda_data: Dict):
        """Update ALL year rows for this state with VDA calculations."""
        self.supabase.table('state_results')\
            .update(vda_data)\
            .eq('analysis_id', analysis_id)\
            .eq('state', state_code)\
            .execute()

    def _update_analysis_vda(self, analysis_id: str, selected_states: List[str]):
        """Update analyses table with VDA info."""
        self.supabase.table('analyses')\
            .update({
                'vda_enabled': True,
                'vda_selected_states': selected_states
            })\
            .eq('id', analysis_id)\
            .execute()

    def disable_vda(self, analysis_id: str):
        """Disable VDA mode and clear calculations."""
        # Clear VDA settings in analyses
        self.supabase.table('analyses')\
            .update({
                'vda_enabled': False,
                'vda_selected_states': []
            })\
            .eq('id', analysis_id)\
            .execute()

        # Clear VDA calculations from state_results
        self.supabase.table('state_results')\
            .update({
                'vda_penalty_waived': 0,
                'vda_interest_waived': 0,
                'vda_total_savings': 0
            })\
            .eq('analysis_id', analysis_id)\
            .execute()

        logger.info(f"VDA disabled for analysis {analysis_id}")
