"""API endpoints for state worklist and action tracking."""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.auth import require_organization
from app.schemas.state_worklist import (
    StateAssessmentCreate,
    StateAssessmentUpdate,
    StateAssessmentResponse,
    StateActionCreate,
    StateActionUpdate,
    StateActionResponse,
    StateActionTaskCreate,
    StateActionTaskUpdate,
    StateActionTaskResponse,
    StateWorklistItem,
    StateWorklistSummary,
    StateWorklistResponse,
    ACTION_TASK_TEMPLATES,
)

router = APIRouter(prefix="/clients/{client_id}/states", tags=["state-worklist"])


# --- State Assessments ---

@router.get("", response_model=StateWorklistResponse)
async def get_state_worklist(
    client_id: UUID,
    nexus_status: Optional[str] = None,
    action_status: Optional[str] = None,
    auth: tuple = Depends(require_organization),
):
    """
    Get state worklist for a client with optional filtering.
    Returns combined assessment + action view for the worklist table.
    """
    supabase, org_id = auth

    # Build query for assessments with optional action join
    query = supabase.table("state_assessments").select(
        "*, state_actions(*)"
    ).eq("client_id", str(client_id)).eq("organization_id", str(org_id))

    if nexus_status:
        query = query.eq("nexus_status", nexus_status)

    response = query.order("state").execute()
    assessments = response.data or []

    # Transform to worklist items
    items: List[StateWorklistItem] = []
    summary = StateWorklistSummary()

    for assessment in assessments:
        actions = assessment.get("state_actions", [])
        current_action = actions[0] if actions else None

        # Get task counts if action exists
        tasks_total = 0
        tasks_complete = 0
        if current_action:
            task_response = supabase.table("state_action_tasks").select(
                "status"
            ).eq("state_action_id", current_action["id"]).execute()
            tasks = task_response.data or []
            tasks_total = len(tasks)
            tasks_complete = len([t for t in tasks if t["status"] == "complete"])

        # Apply action_status filter if provided
        if action_status:
            if current_action and current_action.get("action_status") != action_status:
                continue
            if not current_action and action_status != "none":
                continue

        item = StateWorklistItem(
            id=assessment["id"],
            state=assessment["state"],
            nexus_status=assessment["nexus_status"],
            nexus_type=assessment.get("nexus_type"),
            nexus_reasons=assessment.get("nexus_reasons", []),
            estimated_liability=assessment.get("estimated_liability"),
            threshold_percentage=assessment.get("threshold_percentage"),
            first_exposure_date=assessment.get("first_exposure_date"),
            action_id=current_action["id"] if current_action else None,
            action_type=current_action.get("action_type") if current_action else None,
            action_status=current_action.get("action_status") if current_action else None,
            target_date=current_action.get("target_date") if current_action else None,
            blocked_reason=current_action.get("blocked_reason") if current_action else None,
            tasks_total=tasks_total,
            tasks_complete=tasks_complete,
        )
        items.append(item)

        # Update summary
        summary.total_states += 1
        if assessment["nexus_status"] == "has_nexus":
            summary.states_with_nexus += 1
        elif assessment["nexus_status"] == "approaching":
            summary.states_approaching += 1
        elif assessment["nexus_status"] == "no_nexus":
            summary.states_no_nexus += 1
        elif assessment["nexus_status"] == "unknown":
            summary.states_unknown += 1

        if assessment.get("estimated_liability"):
            summary.total_estimated_liability += assessment["estimated_liability"]

        if current_action:
            action_stat = current_action.get("action_status", "not_started")
            if action_stat == "not_started":
                summary.actions_not_started += 1
            elif action_stat == "in_progress":
                summary.actions_in_progress += 1
            elif action_stat == "blocked":
                summary.actions_blocked += 1
            elif action_stat == "complete":
                summary.actions_complete += 1

    return StateWorklistResponse(items=items, summary=summary)


@router.post("", response_model=StateAssessmentResponse)
async def create_state_assessment(
    client_id: UUID,
    data: StateAssessmentCreate,
    auth: tuple = Depends(require_organization),
):
    """Create a new state assessment for a client."""
    supabase, org_id = auth

    # Verify client_id matches
    if data.client_id != client_id:
        raise HTTPException(status_code=400, detail="Client ID mismatch")

    # Check for existing assessment for this state
    existing = supabase.table("state_assessments").select("id").eq(
        "client_id", str(client_id)
    ).eq("state", data.state).maybe_single().execute()

    if existing.data:
        raise HTTPException(
            status_code=400,
            detail=f"Assessment already exists for state {data.state}"
        )

    insert_data = data.model_dump()
    insert_data["client_id"] = str(client_id)
    insert_data["organization_id"] = str(org_id)
    if data.engagement_id:
        insert_data["engagement_id"] = str(data.engagement_id)
    if data.analysis_id:
        insert_data["analysis_id"] = str(data.analysis_id)

    response = supabase.table("state_assessments").insert(insert_data).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create state assessment")

    return response.data[0]


@router.get("/{state}", response_model=StateAssessmentResponse)
async def get_state_assessment(
    client_id: UUID,
    state: str,
    auth: tuple = Depends(require_organization),
):
    """Get a specific state assessment with its current action and tasks."""
    supabase, org_id = auth

    response = supabase.table("state_assessments").select(
        "*, state_actions(*, state_action_tasks(*))"
    ).eq("client_id", str(client_id)).eq(
        "organization_id", str(org_id)
    ).eq("state", state.upper()).maybe_single().execute()

    if not response.data:
        raise HTTPException(status_code=404, detail=f"No assessment found for state {state}")

    assessment = response.data
    actions = assessment.pop("state_actions", [])

    # Attach current action with tasks
    if actions:
        current_action = actions[0]
        tasks = current_action.pop("state_action_tasks", [])
        current_action["tasks"] = tasks
        assessment["current_action"] = current_action

    return assessment


@router.patch("/{state}", response_model=StateAssessmentResponse)
async def update_state_assessment(
    client_id: UUID,
    state: str,
    data: StateAssessmentUpdate,
    auth: tuple = Depends(require_organization),
):
    """Update a state assessment."""
    supabase, org_id = auth

    # Get existing assessment
    existing = supabase.table("state_assessments").select("id").eq(
        "client_id", str(client_id)
    ).eq("organization_id", str(org_id)).eq(
        "state", state.upper()
    ).maybe_single().execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail=f"No assessment found for state {state}")

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    response = supabase.table("state_assessments").update(
        update_data
    ).eq("id", existing.data["id"]).execute()

    return response.data[0]


@router.delete("/{state}")
async def delete_state_assessment(
    client_id: UUID,
    state: str,
    auth: tuple = Depends(require_organization),
):
    """Delete a state assessment and its related actions/tasks."""
    supabase, org_id = auth

    # Get existing assessment
    existing = supabase.table("state_assessments").select("id").eq(
        "client_id", str(client_id)
    ).eq("organization_id", str(org_id)).eq(
        "state", state.upper()
    ).maybe_single().execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail=f"No assessment found for state {state}")

    # Delete (cascades to actions and tasks)
    supabase.table("state_assessments").delete().eq("id", existing.data["id"]).execute()

    return {"status": "deleted"}


# --- State Actions ---

@router.post("/{state}/actions", response_model=StateActionResponse)
async def create_state_action(
    client_id: UUID,
    state: str,
    data: StateActionCreate,
    auto_create_tasks: bool = True,
    auth: tuple = Depends(require_organization),
):
    """
    Create an action for a state assessment.
    Optionally auto-creates default task checklist based on action type.
    """
    supabase, org_id = auth

    # Get assessment
    assessment = supabase.table("state_assessments").select("id").eq(
        "client_id", str(client_id)
    ).eq("organization_id", str(org_id)).eq(
        "state", state.upper()
    ).maybe_single().execute()

    if not assessment.data:
        raise HTTPException(status_code=404, detail=f"No assessment found for state {state}")

    assessment_id = assessment.data["id"]

    # Verify assessment_id matches
    if str(data.state_assessment_id) != assessment_id:
        data.state_assessment_id = UUID(assessment_id)

    # Create action
    insert_data = data.model_dump()
    insert_data["state_assessment_id"] = assessment_id
    insert_data["organization_id"] = str(org_id)

    response = supabase.table("state_actions").insert(insert_data).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create state action")

    action = response.data[0]

    # Auto-create tasks from template
    if auto_create_tasks and data.action_type in ACTION_TASK_TEMPLATES:
        templates = ACTION_TASK_TEMPLATES[data.action_type]
        tasks_to_insert = [
            {
                "state_action_id": action["id"],
                "title": t.title,
                "description": t.description,
                "sort_order": t.sort_order,
            }
            for t in templates
        ]
        if tasks_to_insert:
            supabase.table("state_action_tasks").insert(tasks_to_insert).execute()

    # Fetch with tasks
    full_response = supabase.table("state_actions").select(
        "*, state_action_tasks(*)"
    ).eq("id", action["id"]).single().execute()

    result = full_response.data
    result["tasks"] = result.pop("state_action_tasks", [])

    return result


@router.patch("/{state}/actions/{action_id}", response_model=StateActionResponse)
async def update_state_action(
    client_id: UUID,
    state: str,
    action_id: UUID,
    data: StateActionUpdate,
    auth: tuple = Depends(require_organization),
):
    """Update a state action."""
    supabase, org_id = auth

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Mark completed_at if status changed to complete
    if update_data.get("action_status") == "complete":
        update_data["completed_at"] = datetime.utcnow().isoformat()

    response = supabase.table("state_actions").update(
        update_data
    ).eq("id", str(action_id)).eq("organization_id", str(org_id)).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Action not found")

    # Fetch with tasks
    full_response = supabase.table("state_actions").select(
        "*, state_action_tasks(*)"
    ).eq("id", str(action_id)).single().execute()

    result = full_response.data
    result["tasks"] = result.pop("state_action_tasks", [])

    return result


@router.delete("/{state}/actions/{action_id}")
async def delete_state_action(
    client_id: UUID,
    state: str,
    action_id: UUID,
    auth: tuple = Depends(require_organization),
):
    """Delete a state action and its tasks."""
    supabase, org_id = auth

    supabase.table("state_actions").delete().eq(
        "id", str(action_id)
    ).eq("organization_id", str(org_id)).execute()

    return {"status": "deleted"}


# --- State Action Tasks ---

@router.post("/{state}/actions/{action_id}/tasks", response_model=StateActionTaskResponse)
async def create_action_task(
    client_id: UUID,
    state: str,
    action_id: UUID,
    data: StateActionTaskCreate,
    auth: tuple = Depends(require_organization),
):
    """Create a task for an action."""
    supabase, org_id = auth

    insert_data = data.model_dump()
    insert_data["state_action_id"] = str(action_id)

    response = supabase.table("state_action_tasks").insert(insert_data).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create task")

    return response.data[0]


@router.patch("/{state}/actions/{action_id}/tasks/{task_id}", response_model=StateActionTaskResponse)
async def update_action_task(
    client_id: UUID,
    state: str,
    action_id: UUID,
    task_id: UUID,
    data: StateActionTaskUpdate,
    auth: tuple = Depends(require_organization),
):
    """Update an action task."""
    supabase, org_id = auth

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Mark completed_at if status changed to complete
    if update_data.get("status") == "complete":
        update_data["completed_at"] = datetime.utcnow().isoformat()

    response = supabase.table("state_action_tasks").update(
        update_data
    ).eq("id", str(task_id)).eq("state_action_id", str(action_id)).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Task not found")

    return response.data[0]


@router.delete("/{state}/actions/{action_id}/tasks/{task_id}")
async def delete_action_task(
    client_id: UUID,
    state: str,
    action_id: UUID,
    task_id: UUID,
    auth: tuple = Depends(require_organization),
):
    """Delete an action task."""
    supabase, org_id = auth

    supabase.table("state_action_tasks").delete().eq(
        "id", str(task_id)
    ).eq("state_action_id", str(action_id)).execute()

    return {"status": "deleted"}


# --- Bulk Operations ---

@router.post("/import-from-analysis")
async def import_assessments_from_analysis(
    client_id: UUID,
    analysis_id: UUID,
    auth: tuple = Depends(require_organization),
):
    """
    Import state assessments from a completed nexus analysis.
    Creates assessments based on state_results from the analysis.
    """
    supabase, org_id = auth

    # Get analysis results
    results_response = supabase.table("state_results").select(
        "state, has_nexus, physical_nexus, economic_nexus, total_sales, estimated_total_liability, "
        "threshold_percentage, first_nexus_date"
    ).eq("analysis_id", str(analysis_id)).execute()

    results = results_response.data or []

    if not results:
        raise HTTPException(status_code=404, detail="No state results found for analysis")

    # Get existing assessments for this client
    existing_response = supabase.table("state_assessments").select(
        "state"
    ).eq("client_id", str(client_id)).execute()

    existing_states = {a["state"] for a in (existing_response.data or [])}

    # Create assessments for states not already tracked
    assessments_to_create = []
    for result in results:
        if result["state"] in existing_states:
            continue

        # Determine nexus status
        nexus_status = "unknown"
        if result.get("has_nexus"):
            nexus_status = "has_nexus"
        elif result.get("threshold_percentage") and result["threshold_percentage"] >= 75:
            nexus_status = "approaching"
        elif result.get("total_sales", 0) == 0:
            nexus_status = "no_nexus"

        # Determine nexus type
        nexus_type = None
        if result.get("physical_nexus") and result.get("economic_nexus"):
            nexus_type = "both"
        elif result.get("physical_nexus"):
            nexus_type = "physical"
        elif result.get("economic_nexus"):
            nexus_type = "economic"

        assessments_to_create.append({
            "client_id": str(client_id),
            "analysis_id": str(analysis_id),
            "organization_id": str(org_id),
            "state": result["state"],
            "nexus_status": nexus_status,
            "nexus_type": nexus_type,
            "total_sales": result.get("total_sales"),
            "estimated_liability": result.get("estimated_total_liability"),
            "threshold_percentage": result.get("threshold_percentage"),
            "first_exposure_date": result.get("first_nexus_date"),
            "assessed_at": datetime.utcnow().isoformat(),
        })

    if assessments_to_create:
        supabase.table("state_assessments").insert(assessments_to_create).execute()

    return {
        "imported": len(assessments_to_create),
        "skipped": len(existing_states),
        "total_states": len(results),
    }
