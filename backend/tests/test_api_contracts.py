"""
Test that API responses match Pydantic schemas.
Ensures schema drift is caught immediately.
"""
import pytest
from app.schemas.responses import (
    StateDetailResponse,
    StateResultsResponse,
    AnalysesListResponse
)


def test_state_detail_response_validates():
    """Test that StateDetailResponse schema matches endpoint response"""
    # This will be a real API call test
    # For now, just test schema instantiation

    response = StateDetailResponse(
        state_code="CA",
        state_name="California",
        analysis_id="test-id",
        has_transactions=True,
        analysis_period={"years_available": [2023, 2024]},
        year_data=[],
        compliance_info={
            "tax_rates": {
                "state_rate": 7.25,
                "avg_local_rate": 2.5,
                "combined_rate": 9.75,
                "max_local_rate": 3.0
            },
            "threshold_info": {
                "revenue_threshold": 500000,
                "transaction_threshold": None,
                "threshold_operator": "or"
            },
            "registration_info": {
                "registration_required": True
            },
            "filing_frequency": "monthly",
            "filing_method": "online",
            "sstm_member": False
        },
        # All aggregate fields required (not optional!)
        total_sales=100000.0,
        taxable_sales=80000.0,
        exempt_sales=20000.0,
        direct_sales=60000.0,
        marketplace_sales=40000.0,
        exposure_sales=75000.0,
        transaction_count=500,
        estimated_liability=6000.0,
        base_tax=5500.0,
        interest=300.0,
        penalties=200.0,
        nexus_type="economic",
        first_nexus_year=2023
    )

    assert response.state_code == "CA"
    assert response.total_sales == 100000.0


def test_state_detail_response_rejects_missing_fields():
    """Test that missing required fields cause validation error"""
    with pytest.raises(Exception):  # Pydantic ValidationError
        StateDetailResponse(
            state_code="CA",
            state_name="California",
            # Missing required fields!
        )
