"""
Exemption Management API
Allows users to mark transactions as exempt and manage exemption history
"""
from typing import Optional
from datetime import datetime
from decimal import Decimal
from uuid import UUID
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel

from ...core.auth import get_current_user
from ...core.supabase import get_supabase_client
from ...schemas.exemption import (
    ExemptionReason,
    ExemptionAuditAction,
    ExemptionUpdate,
    BulkExemptionUpdate,
    ExemptionResponse,
    BulkExemptionResponse,
    ExemptionRemoveResponse,
    ExemptionAuditEntry,
    ExemptionAuditResponse,
    ExemptionSummaryByReason,
    ExemptionSummaryResponse,
    SaveExemptionsRequest,
    SaveExemptionsResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/{analysis_id}/exemptions", tags=["exemptions"])


# =============================================================================
# Helper Functions
# =============================================================================

def get_reason_display(reason: str, reason_other: Optional[str] = None) -> str:
    """Get human-readable display name for exemption reason"""
    displays = {
        "resale_certificate": "Resale Certificate",
        "government_nonprofit": "Government/Nonprofit",
        "product_exempt": "Product Exempt in State",
        "manufacturing_exemption": "Manufacturing Exemption",
        "agricultural_exemption": "Agricultural Exemption",
        "other": f"Other: {reason_other}" if reason_other else "Other",
    }
    return displays.get(reason, reason)


async def verify_analysis_ownership(supabase, analysis_id: str, user_id: str) -> dict:
    """Verify user owns the analysis and return analysis data"""
    result = supabase.table("analyses").select("*").eq("id", analysis_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found or you don't have access"
        )
    return result.data[0]


async def get_transaction(supabase, analysis_id: str, transaction_id: str) -> dict:
    """Get a single transaction"""
    result = supabase.table("sales_transactions").select("*").eq("analysis_id", analysis_id).eq("transaction_id", transaction_id).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found"
        )
    return result.data[0]


async def log_exemption_change(
    supabase,
    analysis_id: str,
    transaction_id: str,
    action: ExemptionAuditAction,
    user_id: str,
    before: Optional[dict] = None,
    after: Optional[dict] = None,
):
    """Log an exemption change to the audit table"""
    entry = {
        "analysis_id": analysis_id,
        "transaction_id": transaction_id,
        "action": action.value,
        "changed_by": user_id,
        "changed_at": datetime.utcnow().isoformat(),
    }

    if before:
        entry["exempt_amount_before"] = float(before.get("exempt_amount", 0)) if before.get("exempt_amount") else None
        entry["reason_before"] = before.get("exemption_reason")
        entry["reason_other_before"] = before.get("exemption_reason_other")
        entry["note_before"] = before.get("exemption_note")

    if after:
        entry["exempt_amount_after"] = float(after.get("exempt_amount", 0)) if after.get("exempt_amount") else None
        entry["reason_after"] = after.get("exemption_reason")
        entry["reason_other_after"] = after.get("exemption_reason_other")
        entry["note_after"] = after.get("exemption_note")

    supabase.table("exemption_audit_log").insert(entry).execute()


# =============================================================================
# API Endpoints
# =============================================================================

@router.patch(
    "/transactions/{transaction_id}",
    response_model=ExemptionResponse,
    summary="Mark transaction as exempt",
    description="Mark a single transaction as exempt with reason and optional notes"
)
async def update_transaction_exemption(
    analysis_id: str,
    transaction_id: str,
    exemption: ExemptionUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Mark a single transaction as exempt"""
    supabase = get_supabase_client()
    user_id = current_user["id"]

    # Verify ownership
    await verify_analysis_ownership(supabase, analysis_id, user_id)

    # Get current transaction state (for audit log)
    current = await get_transaction(supabase, analysis_id, transaction_id)

    # Validate exempt_amount doesn't exceed sales_amount
    if exemption.exempt_amount > Decimal(str(current["sales_amount"])):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Exempt amount ({exemption.exempt_amount}) cannot exceed sales amount ({current['sales_amount']})"
        )

    # Prepare update data
    update_data = {
        "exempt_amount": float(exemption.exempt_amount),
        "taxable_amount": float(Decimal(str(current["sales_amount"])) - exemption.exempt_amount),
        "is_taxable": exemption.exempt_amount < Decimal(str(current["sales_amount"])),
        "exemption_reason": exemption.reason.value,
        "exemption_reason_other": exemption.reason_other if exemption.reason == ExemptionReason.OTHER else None,
        "exemption_note": exemption.note,
        "exemption_marked_at": datetime.utcnow().isoformat(),
        "exemption_marked_by": user_id,
    }

    # Determine action type
    was_exempt = current.get("exempt_amount", 0) > 0
    action = ExemptionAuditAction.UPDATED if was_exempt else ExemptionAuditAction.CREATED

    # Update transaction
    supabase.table("sales_transactions").update(update_data).eq("analysis_id", analysis_id).eq("transaction_id", transaction_id).execute()

    # Log the change
    await log_exemption_change(
        supabase, analysis_id, transaction_id, action, user_id,
        before=current,
        after={**current, **update_data}
    )

    logger.info(f"[EXEMPTION] User {user_id} marked transaction {transaction_id} as exempt (${exemption.exempt_amount})")

    return ExemptionResponse(
        success=True,
        transaction_id=transaction_id,
        exempt_amount=exemption.exempt_amount,
        reason=exemption.reason.value,
        reason_other=exemption.reason_other,
        note=exemption.note,
        marked_at=datetime.utcnow(),
    )


@router.delete(
    "/transactions/{transaction_id}",
    response_model=ExemptionRemoveResponse,
    summary="Remove exemption from transaction",
    description="Remove exemption status and make transaction fully taxable again"
)
async def remove_transaction_exemption(
    analysis_id: str,
    transaction_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Remove exemption from a transaction"""
    supabase = get_supabase_client()
    user_id = current_user["id"]

    # Verify ownership
    await verify_analysis_ownership(supabase, analysis_id, user_id)

    # Get current transaction state
    current = await get_transaction(supabase, analysis_id, transaction_id)

    previous_exempt = Decimal(str(current.get("exempt_amount", 0)))
    if previous_exempt == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction is not currently marked as exempt"
        )

    # Update to remove exemption
    update_data = {
        "exempt_amount": 0,
        "taxable_amount": float(current["sales_amount"]),
        "is_taxable": True,
        "exemption_reason": None,
        "exemption_reason_other": None,
        "exemption_note": None,
        "exemption_marked_at": None,
        "exemption_marked_by": None,
    }

    supabase.table("sales_transactions").update(update_data).eq("analysis_id", analysis_id).eq("transaction_id", transaction_id).execute()

    # Log the change
    await log_exemption_change(
        supabase, analysis_id, transaction_id, ExemptionAuditAction.REMOVED, user_id,
        before=current,
        after=None
    )

    logger.info(f"[EXEMPTION] User {user_id} removed exemption from transaction {transaction_id}")

    return ExemptionRemoveResponse(
        success=True,
        transaction_id=transaction_id,
        previous_exempt_amount=previous_exempt,
    )


@router.patch(
    "/bulk",
    response_model=BulkExemptionResponse,
    summary="Bulk mark transactions as exempt",
    description="Mark multiple transactions as exempt with the same reason"
)
async def bulk_update_exemptions(
    analysis_id: str,
    bulk_update: BulkExemptionUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Mark multiple transactions as exempt"""
    supabase = get_supabase_client()
    user_id = current_user["id"]

    # Verify ownership
    await verify_analysis_ownership(supabase, analysis_id, user_id)

    updated_count = 0
    failed_count = 0
    failed_ids = []

    for txn_id in bulk_update.transaction_ids:
        try:
            # Get current transaction
            result = supabase.table("sales_transactions").select("*").eq("analysis_id", analysis_id).eq("transaction_id", txn_id).execute()

            if not result.data:
                failed_ids.append(txn_id)
                failed_count += 1
                continue

            current = result.data[0]

            # Calculate exempt amount
            if bulk_update.exempt_full_amount:
                exempt_amount = Decimal(str(current["sales_amount"]))
            else:
                exempt_amount = min(bulk_update.exempt_amount, Decimal(str(current["sales_amount"])))

            # Prepare update
            update_data = {
                "exempt_amount": float(exempt_amount),
                "taxable_amount": float(Decimal(str(current["sales_amount"])) - exempt_amount),
                "is_taxable": exempt_amount < Decimal(str(current["sales_amount"])),
                "exemption_reason": bulk_update.reason.value,
                "exemption_reason_other": bulk_update.reason_other if bulk_update.reason == ExemptionReason.OTHER else None,
                "exemption_note": bulk_update.note,
                "exemption_marked_at": datetime.utcnow().isoformat(),
                "exemption_marked_by": user_id,
            }

            # Determine action
            was_exempt = current.get("exempt_amount", 0) > 0
            action = ExemptionAuditAction.UPDATED if was_exempt else ExemptionAuditAction.CREATED

            # Update
            supabase.table("sales_transactions").update(update_data).eq("analysis_id", analysis_id).eq("transaction_id", txn_id).execute()

            # Log
            await log_exemption_change(
                supabase, analysis_id, txn_id, action, user_id,
                before=current,
                after={**current, **update_data}
            )

            updated_count += 1

        except Exception as e:
            logger.error(f"[EXEMPTION] Failed to update transaction {txn_id}: {e}")
            failed_ids.append(txn_id)
            failed_count += 1

    logger.info(f"[EXEMPTION] Bulk update: {updated_count} succeeded, {failed_count} failed")

    return BulkExemptionResponse(
        success=failed_count == 0,
        updated_count=updated_count,
        failed_count=failed_count,
        failed_ids=failed_ids,
    )


@router.get(
    "/summary",
    response_model=ExemptionSummaryResponse,
    summary="Get exemption summary",
    description="Get summary of all exemptions for the analysis"
)
async def get_exemption_summary(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get summary of exemptions by reason"""
    supabase = get_supabase_client()
    user_id = current_user["id"]

    # Verify ownership
    await verify_analysis_ownership(supabase, analysis_id, user_id)

    # Get all exempt transactions
    result = supabase.table("sales_transactions").select(
        "exempt_amount, exemption_reason, exemption_reason_other"
    ).eq("analysis_id", analysis_id).gt("exempt_amount", 0).execute()

    transactions = result.data or []

    # Calculate totals
    total_amount = Decimal("0")
    by_reason = {}

    for txn in transactions:
        amount = Decimal(str(txn["exempt_amount"]))
        total_amount += amount

        reason = txn.get("exemption_reason") or "unspecified"
        reason_other = txn.get("exemption_reason_other")

        if reason not in by_reason:
            by_reason[reason] = {
                "reason": reason,
                "reason_display": get_reason_display(reason, reason_other),
                "amount": Decimal("0"),
                "count": 0,
            }

        by_reason[reason]["amount"] += amount
        by_reason[reason]["count"] += 1

    # Convert to response format
    by_reason_list = [
        ExemptionSummaryByReason(
            reason=data["reason"],
            reason_display=data["reason_display"],
            amount=data["amount"],
            count=data["count"],
        )
        for data in sorted(by_reason.values(), key=lambda x: x["amount"], reverse=True)
    ]

    return ExemptionSummaryResponse(
        analysis_id=analysis_id,
        total_exempt_amount=total_amount,
        exempt_transaction_count=len(transactions),
        by_reason=by_reason_list,
    )


@router.get(
    "/audit",
    response_model=ExemptionAuditResponse,
    summary="Get exemption audit history",
    description="Get full audit history of exemption changes"
)
async def get_exemption_audit(
    analysis_id: str,
    transaction_id: Optional[str] = Query(None, description="Filter by specific transaction"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """Get audit history for exemption changes"""
    supabase = get_supabase_client()
    user_id = current_user["id"]

    # Verify ownership
    await verify_analysis_ownership(supabase, analysis_id, user_id)

    # Build query
    query = supabase.table("exemption_audit_log").select("*", count="exact").eq("analysis_id", analysis_id)

    if transaction_id:
        query = query.eq("transaction_id", transaction_id)

    query = query.order("changed_at", desc=True).range(offset, offset + limit - 1)
    result = query.execute()

    entries = [
        ExemptionAuditEntry(
            id=str(entry["id"]),
            transaction_id=entry["transaction_id"],
            action=ExemptionAuditAction(entry["action"]),
            exempt_amount_before=Decimal(str(entry["exempt_amount_before"])) if entry.get("exempt_amount_before") else None,
            exempt_amount_after=Decimal(str(entry["exempt_amount_after"])) if entry.get("exempt_amount_after") else None,
            reason_before=entry.get("reason_before"),
            reason_after=entry.get("reason_after"),
            reason_other_before=entry.get("reason_other_before"),
            reason_other_after=entry.get("reason_other_after"),
            note_before=entry.get("note_before"),
            note_after=entry.get("note_after"),
            changed_by=str(entry["changed_by"]) if entry.get("changed_by") else None,
            changed_at=entry["changed_at"],
        )
        for entry in (result.data or [])
    ]

    return ExemptionAuditResponse(
        analysis_id=analysis_id,
        transaction_id=transaction_id,
        entries=entries,
        total_count=result.count or 0,
    )


@router.post(
    "/save-and-recalculate",
    response_model=SaveExemptionsResponse,
    summary="Save exemption changes and recalculate",
    description="Save pending exemption changes and optionally trigger liability recalculation"
)
async def save_exemptions_and_recalculate(
    analysis_id: str,
    request: SaveExemptionsRequest,
    current_user: dict = Depends(get_current_user),
):
    """Save batch of exemption changes and trigger recalculation"""
    supabase = get_supabase_client()
    user_id = current_user["id"]

    # Verify ownership
    await verify_analysis_ownership(supabase, analysis_id, user_id)

    saved_count = 0

    for change in request.changes:
        try:
            if change.action == ExemptionAuditAction.REMOVED:
                # Remove exemption
                result = supabase.table("sales_transactions").select("*").eq("analysis_id", analysis_id).eq("transaction_id", change.transaction_id).execute()

                if result.data:
                    current = result.data[0]
                    update_data = {
                        "exempt_amount": 0,
                        "taxable_amount": float(current["sales_amount"]),
                        "is_taxable": True,
                        "exemption_reason": None,
                        "exemption_reason_other": None,
                        "exemption_note": None,
                        "exemption_marked_at": None,
                        "exemption_marked_by": None,
                    }
                    supabase.table("sales_transactions").update(update_data).eq("analysis_id", analysis_id).eq("transaction_id", change.transaction_id).execute()

                    await log_exemption_change(
                        supabase, analysis_id, change.transaction_id, ExemptionAuditAction.REMOVED, user_id,
                        before=current, after=None
                    )
                    saved_count += 1
            else:
                # Create or update exemption
                result = supabase.table("sales_transactions").select("*").eq("analysis_id", analysis_id).eq("transaction_id", change.transaction_id).execute()

                if result.data:
                    current = result.data[0]
                    was_exempt = current.get("exempt_amount", 0) > 0
                    action = ExemptionAuditAction.UPDATED if was_exempt else ExemptionAuditAction.CREATED

                    update_data = {
                        "exempt_amount": float(change.exempt_amount),
                        "taxable_amount": float(Decimal(str(current["sales_amount"])) - change.exempt_amount),
                        "is_taxable": change.exempt_amount < Decimal(str(current["sales_amount"])),
                        "exemption_reason": change.reason,
                        "exemption_reason_other": change.reason_other,
                        "exemption_note": change.note,
                        "exemption_marked_at": datetime.utcnow().isoformat(),
                        "exemption_marked_by": user_id,
                    }

                    supabase.table("sales_transactions").update(update_data).eq("analysis_id", analysis_id).eq("transaction_id", change.transaction_id).execute()

                    await log_exemption_change(
                        supabase, analysis_id, change.transaction_id, action, user_id,
                        before=current, after={**current, **update_data}
                    )
                    saved_count += 1

        except Exception as e:
            logger.error(f"[EXEMPTION] Failed to save change for {change.transaction_id}: {e}")

    # Trigger recalculation if requested
    recalculation_status = None
    if request.trigger_recalculation and saved_count > 0:
        try:
            # Import here to avoid circular imports
            from ...services.nexus_calculator_v2 import NexusCalculatorV2

            calculator = NexusCalculatorV2(supabase)
            await calculator.calculate_nexus_for_analysis(analysis_id)
            recalculation_status = "completed"
            logger.info(f"[EXEMPTION] Recalculation completed for analysis {analysis_id}")
        except Exception as e:
            logger.error(f"[EXEMPTION] Recalculation failed: {e}")
            recalculation_status = "failed"

    return SaveExemptionsResponse(
        success=True,
        saved_count=saved_count,
        recalculation_triggered=request.trigger_recalculation and saved_count > 0,
        recalculation_status=recalculation_status,
    )
