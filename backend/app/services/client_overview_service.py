"""
Client Overview Service

Computes the client overview including:
- Current workflow stage
- Next best action recommendations
- Upcoming deadlines
- Blocking items
- States summary

This service aggregates data from multiple sources to provide
a comprehensive view of a client's current status and what
actions should be taken next.
"""

import logging
from typing import Dict, Optional, List, Any, Tuple
from datetime import datetime, date, timedelta
from uuid import UUID

logger = logging.getLogger(__name__)


class ClientOverviewService:
    """
    Service for computing client overview and next best action recommendations.
    """

    # Stage progression order
    STAGES = [
        "intake",
        "data_collection",
        "analysis",
        "recommendations",
        "execution",
        "monitoring",
        "complete"
    ]

    # Default intake items for data requests (external data collection).
    # Note: Discovery profile data (business model, physical presence, registrations)
    # is stored directly in the clients table columns, not in intake_items.
    # intake_items is used only for tracking external data requests with
    # request/receive/validate workflow.
    DEFAULT_INTAKE_ITEMS = [
        {"category": "data_request", "item_key": "sales_data", "label": "Sales Transaction Data", "is_required": True},
        {"category": "data_request", "item_key": "prior_returns", "label": "Prior Tax Returns", "is_required": False},
        {"category": "data_request", "item_key": "exemption_certificates", "label": "Exemption Certificates", "is_required": False},
    ]

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def get_client_overview(
        self,
        client_id: str,
        org_id: str
    ) -> Dict[str, Any]:
        """
        Get comprehensive overview for a client.

        Args:
            client_id: UUID of the client
            org_id: UUID of the organization

        Returns:
            Dictionary containing all overview data
        """
        # Fetch client data
        client = self._get_client(client_id, org_id)
        if not client:
            return None

        # Fetch related data in parallel conceptually
        engagements = self._get_engagements(client_id, org_id)
        analyses = self._get_analyses(client_id, org_id)
        intake_items = self._get_intake_items(client_id, org_id)
        state_assessments = self._get_state_assessments(client_id, org_id)
        deadlines = self._get_deadlines(client_id, org_id)

        # Get active engagement (most recent signed or in-progress)
        active_engagement = self._get_active_engagement(engagements)

        # Compute stage info
        stage_info = self._compute_stage_info(
            client, engagements, analyses, intake_items, state_assessments
        )

        # Compute intake progress
        intake_progress = self._compute_intake_progress(client, intake_items)

        # Compute states summary
        states_summary = self._compute_states_summary(analyses, state_assessments)

        # Compute blocking items
        blocking_items = self._compute_blocking_items(
            client, intake_items, analyses, state_assessments
        )

        # Compute next best action
        next_action, secondary_actions = self._compute_next_actions(
            client=client,
            engagement=active_engagement,
            analyses=analyses,
            intake_items=intake_items,
            intake_progress=intake_progress,
            state_assessments=state_assessments,
            blocking_items=blocking_items
        )

        # Process deadlines
        upcoming_deadlines, overdue_count = self._process_deadlines(deadlines)

        # Get last activity timestamps
        last_activity_at = self._get_last_activity(client, engagements, analyses)
        last_analysis_at = self._get_last_analysis_date(analyses)

        return {
            "client_id": client_id,
            "company_name": client.get("company_name", ""),
            "lifecycle_status": client.get("lifecycle_status", "prospect"),
            "stage_info": stage_info,
            "next_action": next_action,
            "secondary_actions": secondary_actions,
            "upcoming_deadlines": upcoming_deadlines,
            "overdue_count": overdue_count,
            "states_summary": states_summary,
            "blocking_items": blocking_items,
            "is_blocked": len(blocking_items) > 0,
            "active_engagement": self._format_engagement_summary(active_engagement) if active_engagement else None,
            "intake_progress": intake_progress,
            "last_activity_at": last_activity_at,
            "last_analysis_at": last_analysis_at,
        }

    # =========================================================================
    # Data Fetching Methods
    # =========================================================================

    def _get_client(self, client_id: str, org_id: str) -> Optional[Dict]:
        """Fetch client by ID."""
        try:
            result = self.supabase.table('clients')\
                .select('*')\
                .eq('id', client_id)\
                .eq('organization_id', org_id)\
                .maybe_single()\
                .execute()
            return result.data
        except Exception as e:
            logger.error(f"Error fetching client {client_id}: {e}")
            return None

    def _get_engagements(self, client_id: str, org_id: str) -> List[Dict]:
        """Fetch all engagements for a client."""
        try:
            result = self.supabase.table('engagements')\
                .select('*')\
                .eq('client_id', client_id)\
                .eq('organization_id', org_id)\
                .order('created_at', desc=True)\
                .execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching engagements for client {client_id}: {e}")
            return []

    def _get_analyses(self, client_id: str, org_id: str) -> List[Dict]:
        """Fetch all analyses for a client."""
        try:
            result = self.supabase.table('analyses')\
                .select('*')\
                .eq('client_id', client_id)\
                .eq('organization_id', org_id)\
                .is_('deleted_at', 'null')\
                .order('created_at', desc=True)\
                .execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching analyses for client {client_id}: {e}")
            return []

    def _get_intake_items(self, client_id: str, org_id: str) -> List[Dict]:
        """Fetch all intake items for a client."""
        try:
            result = self.supabase.table('intake_items')\
                .select('*')\
                .eq('client_id', client_id)\
                .eq('organization_id', org_id)\
                .order('category')\
                .execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching intake items for client {client_id}: {e}")
            return []

    def _get_state_assessments(self, client_id: str, org_id: str) -> List[Dict]:
        """Fetch all state assessments for a client."""
        try:
            result = self.supabase.table('state_assessments')\
                .select('*, state_actions(*)')\
                .eq('client_id', client_id)\
                .eq('organization_id', org_id)\
                .execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching state assessments for client {client_id}: {e}")
            return []

    def _get_deadlines(self, client_id: str, org_id: str) -> List[Dict]:
        """Fetch all deadlines for a client."""
        try:
            result = self.supabase.table('deadlines')\
                .select('*')\
                .eq('client_id', client_id)\
                .eq('organization_id', org_id)\
                .neq('status', 'complete')\
                .neq('status', 'cancelled')\
                .order('due_date')\
                .execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching deadlines for client {client_id}: {e}")
            return []

    def _get_active_engagement(self, engagements: List[Dict]) -> Optional[Dict]:
        """Get the most relevant active engagement."""
        # Priority: signed and not archived > sent > draft
        for status in ['signed', 'sent', 'draft']:
            for eng in engagements:
                if eng.get('status') == status and eng.get('status') != 'archived':
                    return eng
        return engagements[0] if engagements else None

    # =========================================================================
    # Computation Methods
    # =========================================================================

    def _compute_stage_info(
        self,
        client: Dict,
        engagements: List[Dict],
        analyses: List[Dict],
        intake_items: List[Dict],
        state_assessments: List[Dict]
    ) -> Dict[str, Any]:
        """Compute the current workflow stage and progress."""

        # Determine stage based on available data
        has_discovery = client.get('discovery_completed_at') is not None
        has_channels = bool(client.get('channels'))
        has_intake_data = self._has_required_intake_data(client, intake_items)
        has_sales_data = any(
            item.get('item_key') == 'sales_data' and item.get('status') in ('received', 'validated')
            for item in intake_items
        )
        has_complete_analysis = any(a.get('status') == 'complete' for a in analyses)
        has_presented = any(a.get('presented_at') is not None for a in analyses)

        # Count states with actions in progress or complete
        states_in_execution = sum(
            1 for sa in state_assessments
            if any(
                action.get('action_status') in ('in_progress', 'complete')
                for action in sa.get('state_actions', [])
            )
        )
        states_with_nexus = sum(
            1 for sa in state_assessments
            if sa.get('nexus_status') == 'has_nexus'
        )

        # Determine current stage
        if states_in_execution > 0 and states_in_execution >= states_with_nexus:
            current_stage = "monitoring"
            progress = 100
        elif states_in_execution > 0:
            current_stage = "execution"
            progress = int((states_in_execution / max(states_with_nexus, 1)) * 100)
        elif has_presented:
            current_stage = "execution"
            progress = 10
        elif has_complete_analysis:
            current_stage = "recommendations"
            progress = 50
        elif has_sales_data:
            current_stage = "analysis"
            progress = 25
        elif has_intake_data or has_discovery:
            current_stage = "data_collection"
            progress = 50 if has_intake_data else 25
        else:
            current_stage = "intake"
            # Calculate intake progress
            intake_progress = self._compute_intake_progress(client, intake_items)
            progress = intake_progress.get('completion_percentage', 0)

        # Get completed stages
        stage_index = self.STAGES.index(current_stage)
        stages_completed = self.STAGES[:stage_index]

        return {
            "current_stage": current_stage,
            "stage_progress": min(progress, 100),
            "stage_started_at": None,  # Would need to track this
            "stages_completed": stages_completed
        }

    def _has_required_intake_data(self, client: Dict, intake_items: List[Dict]) -> bool:
        """Check if required intake data is present."""
        # Check from client record (legacy discovery fields)
        has_channels = bool(client.get('channels'))
        has_presence_info = (
            client.get('has_remote_employees') is not None or
            client.get('has_inventory_3pl') is not None
        )

        # Check from intake_items table
        required_received = sum(
            1 for item in intake_items
            if item.get('is_required') and item.get('status') in ('received', 'validated')
        )
        total_required = sum(1 for item in intake_items if item.get('is_required'))

        return (has_channels and has_presence_info) or (total_required > 0 and required_received >= total_required)

    def _compute_intake_progress(self, client: Dict, intake_items: List[Dict]) -> Dict[str, Any]:
        """
        Compute overall intake completion progress.

        Combines:
        1. Discovery profile progress (from client table columns)
        2. Data request progress (from intake_items table)
        """
        missing_required = []

        # --- Discovery Profile Progress (from client table) ---
        discovery_fields = [
            ('channels', 'Sales Channels'),
            ('product_types', 'Product Types'),
        ]
        # Physical presence fields - check if explicitly set (not None)
        presence_fields = [
            ('has_remote_employees', 'Remote Employee Locations'),
            ('has_inventory_3pl', 'Inventory/3PL Locations'),
        ]

        discovery_completed = 0
        discovery_total = len(discovery_fields) + len(presence_fields)

        for field, label in discovery_fields:
            if client.get(field):
                discovery_completed += 1
            else:
                missing_required.append(label)

        for field, label in presence_fields:
            if client.get(field) is not None:
                discovery_completed += 1
            else:
                missing_required.append(label)

        # --- Data Request Progress (from intake_items table) ---
        # Only count data_request category items
        data_request_items = [
            item for item in intake_items
            if item.get('category') == 'data_request'
        ]

        data_requests_completed = sum(
            1 for item in data_request_items
            if item.get('status') in ('received', 'validated', 'not_applicable')
        )
        data_requests_total = len(data_request_items) if data_request_items else len(self.DEFAULT_INTAKE_ITEMS)

        # Add missing required data requests
        for item in data_request_items:
            if item.get('is_required') and item.get('status') not in ('received', 'validated', 'not_applicable'):
                missing_required.append(item.get('label'))

        # If no data_request items exist yet, count sales_data as missing
        if not data_request_items:
            missing_required.append('Sales Transaction Data')

        # --- Combined Progress ---
        total = discovery_total + data_requests_total
        completed = discovery_completed + data_requests_completed

        return {
            "total_items": total,
            "completed_items": completed,
            "completion_percentage": int((completed / total) * 100) if total > 0 else 0,
            "missing_required": missing_required,
            "discovery_complete": discovery_completed == discovery_total,
            "data_requests_complete": data_requests_completed == data_requests_total
        }

    def _compute_states_summary(
        self,
        analyses: List[Dict],
        state_assessments: List[Dict]
    ) -> Dict[str, Any]:
        """Compute summary of state nexus status."""

        # If we have state assessments, use those
        if state_assessments:
            total_with_nexus = sum(
                1 for sa in state_assessments
                if sa.get('nexus_status') == 'has_nexus'
            )
            approaching = sum(
                1 for sa in state_assessments
                if sa.get('nexus_status') == 'approaching'
            )

            # Count states needing action (has nexus but no action or action not started)
            needing_action = 0
            in_progress = 0
            complete = 0
            states_needing_action = []

            for sa in state_assessments:
                if sa.get('nexus_status') != 'has_nexus':
                    continue

                actions = sa.get('state_actions', [])
                if not actions:
                    needing_action += 1
                    states_needing_action.append(sa.get('state'))
                else:
                    latest_action = actions[0] if actions else None
                    if latest_action:
                        status = latest_action.get('action_status')
                        if status == 'not_started':
                            needing_action += 1
                            states_needing_action.append(sa.get('state'))
                        elif status == 'in_progress':
                            in_progress += 1
                        elif status == 'complete':
                            complete += 1

            return {
                "total_with_nexus": total_with_nexus,
                "needing_action": needing_action,
                "approaching_threshold": approaching,
                "in_progress": in_progress,
                "complete": complete,
                "states_needing_action": states_needing_action[:5]  # Limit to 5
            }

        # Fall back to analysis state_results
        if analyses:
            latest = next((a for a in analyses if a.get('status') == 'complete'), None)
            if latest:
                return {
                    "total_with_nexus": latest.get('states_with_nexus', 0),
                    "needing_action": latest.get('states_with_nexus', 0),  # Assume all need action
                    "approaching_threshold": 0,
                    "in_progress": 0,
                    "complete": 0,
                    "states_needing_action": []
                }

        return {
            "total_with_nexus": 0,
            "needing_action": 0,
            "approaching_threshold": 0,
            "in_progress": 0,
            "complete": 0,
            "states_needing_action": []
        }

    def _compute_blocking_items(
        self,
        client: Dict,
        intake_items: List[Dict],
        analyses: List[Dict],
        state_assessments: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Compute items blocking progress."""
        blocking = []

        # Check for missing required intake items
        for item in intake_items:
            if item.get('is_required') and item.get('status') == 'requested':
                # Item was requested but not received - blocking
                blocking.append({
                    "item": f"Missing: {item.get('label')}",
                    "category": "data_request",
                    "since": item.get('requested_at'),
                    "blocking_states": []
                })

        # Check for analyses in error state
        for analysis in analyses:
            if analysis.get('status') == 'error':
                blocking.append({
                    "item": f"Analysis error: {analysis.get('error_message', 'Unknown error')}",
                    "category": "analysis_error",
                    "since": analysis.get('last_error_at'),
                    "blocking_states": []
                })

        # Check for state assessments needing data
        for sa in state_assessments:
            if sa.get('nexus_status') == 'needs_data':
                blocking.append({
                    "item": f"Missing data for {sa.get('state')} assessment",
                    "category": "state_data",
                    "since": None,
                    "blocking_states": [sa.get('state')]
                })

        # Check for blocked state actions
        for sa in state_assessments:
            for action in sa.get('state_actions', []):
                if action.get('action_status') == 'blocked':
                    blocking.append({
                        "item": action.get('blocked_reason', f"{sa.get('state')} action blocked"),
                        "category": "state_action",
                        "since": action.get('blocked_since'),
                        "blocking_states": [sa.get('state')]
                    })

        return blocking

    def _compute_next_actions(
        self,
        client: Dict,
        engagement: Optional[Dict],
        analyses: List[Dict],
        intake_items: List[Dict],
        intake_progress: Dict,
        state_assessments: List[Dict],
        blocking_items: List[Dict]
    ) -> Tuple[Optional[Dict], List[Dict]]:
        """Compute the next best action and secondary actions."""

        actions = []
        client_id = client.get('id')

        # Priority 1: Handle blocking items first
        if blocking_items:
            for blocker in blocking_items[:1]:  # Only first blocker as primary
                if blocker['category'] == 'data_request':
                    actions.append({
                        "action": f"Follow up on {blocker['item'].replace('Missing: ', '')}",
                        "action_type": "data_request",
                        "priority": "high",
                        "target_url": f"/clients/{client_id}?tab=intake",
                        "context": "Waiting on client response",
                        "due_date": None
                    })
                elif blocker['category'] == 'analysis_error':
                    actions.append({
                        "action": "Resolve analysis error",
                        "action_type": "analysis",
                        "priority": "high",
                        "target_url": f"/clients/{client_id}?tab=projects",
                        "context": blocker['item'],
                        "due_date": None
                    })

        # Priority 2: Complete discovery/intake
        if intake_progress.get('completion_percentage', 0) < 100:
            missing = intake_progress.get('missing_required', [])
            if missing:
                actions.append({
                    "action": f"Complete intake: {missing[0]}",
                    "action_type": "discovery",
                    "priority": "high" if not actions else "medium",
                    "target_url": f"/clients/{client_id}?tab=intake",
                    "context": f"{len(missing)} items remaining",
                    "due_date": None
                })

        # Priority 3: Request sales data if not received
        has_sales_data = any(
            item.get('item_key') == 'sales_data' and item.get('status') in ('received', 'validated')
            for item in intake_items
        )
        if not has_sales_data and intake_progress.get('completion_percentage', 0) >= 50:
            actions.append({
                "action": "Request sales transaction data",
                "action_type": "data_request",
                "priority": "high" if not actions else "medium",
                "target_url": f"/clients/{client_id}?tab=intake",
                "context": "Required for nexus analysis",
                "due_date": None
            })

        # Priority 4: Run analysis if we have data but no analysis
        has_complete_analysis = any(a.get('status') == 'complete' for a in analyses)
        if has_sales_data and not has_complete_analysis:
            actions.append({
                "action": "Run nexus analysis",
                "action_type": "analysis",
                "priority": "high" if not actions else "medium",
                "target_url": f"/analysis/new?clientId={client_id}&clientName={client.get('company_name', '')}",
                "context": "Sales data received, ready to analyze",
                "due_date": None
            })

        # Priority 5: Review/present results
        latest_complete = next((a for a in analyses if a.get('status') == 'complete'), None)
        if latest_complete and not latest_complete.get('presented_at'):
            actions.append({
                "action": f"Review results with {client.get('company_name', 'client')}",
                "action_type": "presentation",
                "priority": "high" if not actions else "medium",
                "target_url": f"/analysis/{latest_complete.get('id')}/results",
                "context": f"{latest_complete.get('states_with_nexus', 0)} states with nexus",
                "due_date": None
            })

        # Priority 6: Execute state actions
        states_summary = self._compute_states_summary(analyses, state_assessments)
        if states_summary['needing_action'] > 0:
            actions.append({
                "action": f"Plan remediation for {states_summary['needing_action']} states",
                "action_type": "registration",
                "priority": "medium",
                "target_url": f"/clients/{client_id}?tab=states",
                "context": ", ".join(states_summary['states_needing_action'][:3]),
                "due_date": None
            })

        # Priority 7: Monitor approaching thresholds
        if states_summary['approaching_threshold'] > 0:
            actions.append({
                "action": f"Monitor {states_summary['approaching_threshold']} approaching thresholds",
                "action_type": "monitor",
                "priority": "low",
                "target_url": f"/clients/{client_id}?tab=states",
                "context": "States approaching economic nexus threshold",
                "due_date": None
            })

        # Return primary and secondary actions
        if not actions:
            return None, []

        return actions[0], actions[1:4]  # Primary + up to 3 secondary

    def _process_deadlines(self, deadlines: List[Dict]) -> Tuple[List[Dict], int]:
        """Process deadlines and compute days until each."""
        today = date.today()
        processed = []
        overdue_count = 0

        for dl in deadlines:
            due_date_str = dl.get('due_date')
            if not due_date_str:
                continue

            # Parse date
            if isinstance(due_date_str, str):
                due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00')).date()
            else:
                due_date = due_date_str

            days_until = (due_date - today).days
            is_overdue = days_until < 0

            if is_overdue:
                overdue_count += 1

            processed.append({
                "id": dl.get('id'),
                "title": dl.get('title'),
                "due_date": due_date.isoformat(),
                "deadline_type": dl.get('deadline_type'),
                "state": dl.get('state'),
                "days_until": days_until,
                "is_overdue": is_overdue,
                "client_name": None  # Would need join for this
            })

        # Sort by due date
        processed.sort(key=lambda x: x['due_date'])

        return processed[:10], overdue_count  # Limit to 10 deadlines

    def _format_engagement_summary(self, engagement: Dict) -> Dict[str, Any]:
        """Format engagement for summary display."""
        return {
            "id": engagement.get('id'),
            "title": engagement.get('title'),
            "engagement_type": engagement.get('engagement_type'),
            "stage": engagement.get('stage', 'intake'),
            "status": engagement.get('status'),
            "next_milestone_name": engagement.get('next_milestone_name'),
            "next_milestone_date": engagement.get('next_milestone_date')
        }

    def _get_last_activity(
        self,
        client: Dict,
        engagements: List[Dict],
        analyses: List[Dict]
    ) -> Optional[str]:
        """Get the timestamp of the last activity."""
        timestamps = []

        # Client updated_at
        if client.get('updated_at'):
            timestamps.append(client['updated_at'])

        # Latest engagement
        if engagements:
            timestamps.append(engagements[0].get('updated_at'))

        # Latest analysis
        if analyses:
            timestamps.append(analyses[0].get('updated_at'))

        if not timestamps:
            return None

        # Parse and find latest
        latest = None
        for ts in timestamps:
            if ts:
                if isinstance(ts, str):
                    parsed = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                else:
                    parsed = ts
                if latest is None or parsed > latest:
                    latest = parsed

        return latest.isoformat() if latest else None

    def _get_last_analysis_date(self, analyses: List[Dict]) -> Optional[str]:
        """Get the date of the last completed analysis."""
        for analysis in analyses:
            if analysis.get('status') == 'complete':
                return analysis.get('updated_at')
        return None

    # =========================================================================
    # Intake Item Management
    # =========================================================================

    def initialize_intake_items(
        self,
        client_id: str,
        org_id: str,
        engagement_id: Optional[str] = None
    ) -> List[Dict]:
        """Initialize default intake items for a client."""
        items = []

        for template in self.DEFAULT_INTAKE_ITEMS:
            item = {
                "client_id": client_id,
                "organization_id": org_id,
                "engagement_id": engagement_id,
                "category": template["category"],
                "item_key": template["item_key"],
                "label": template["label"],
                "is_required": template["is_required"],
                "status": "not_requested"
            }
            items.append(item)

        try:
            # Use upsert to avoid duplicates
            result = self.supabase.table('intake_items')\
                .upsert(items, on_conflict='client_id,item_key')\
                .execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error initializing intake items: {e}")
            return []

    def update_intake_item(
        self,
        item_id: str,
        org_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Dict]:
        """Update an intake item."""
        try:
            # Add timestamp updates based on status change
            if 'status' in updates:
                status = updates['status']
                now = datetime.utcnow().isoformat()

                if status == 'requested' and 'requested_at' not in updates:
                    updates['requested_at'] = now
                elif status == 'received' and 'received_at' not in updates:
                    updates['received_at'] = now
                elif status == 'validated' and 'validated_at' not in updates:
                    updates['validated_at'] = now

            result = self.supabase.table('intake_items')\
                .update(updates)\
                .eq('id', item_id)\
                .eq('organization_id', org_id)\
                .execute()

            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating intake item {item_id}: {e}")
            return None
