import pytest
from datetime import date
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_analysis_management_flow():
    """
    End-to-end test of analysis management:
    1. Create an analysis
    2. List analyses (should include new one)
    3. Get specific analysis
    4. Delete analysis
    5. List analyses (should not include deleted one)
    """
    # Note: This test requires actual Supabase connection
    # Skip if running in CI without database
    pytest.skip("Requires live database connection")

    # 1. Create analysis
    create_response = client.post('/api/v1/analyses', json={
        'company_name': 'Test Integration Corp',
        'period_start': '2024-01-01',
        'period_end': '2024-12-31',
        'business_type': 'product_sales',
        'retention_period': '90_days'
    })
    assert create_response.status_code == 200
    analysis_id = create_response.json()['analysis_id']

    # 2. List analyses
    list_response = client.get('/api/v1/analyses')
    assert list_response.status_code == 200
    analyses = list_response.json()['analyses']
    assert any(a['id'] == analysis_id for a in analyses)

    # 3. Get specific analysis
    get_response = client.get(f'/api/v1/analyses/{analysis_id}')
    assert get_response.status_code == 200
    assert get_response.json()['client_company_name'] == 'Test Integration Corp'

    # 4. Delete analysis
    delete_response = client.delete(f'/api/v1/analyses/{analysis_id}')
    assert delete_response.status_code == 200

    # 5. List analyses again (should not include deleted)
    list_response_after = client.get('/api/v1/analyses')
    assert list_response_after.status_code == 200
    analyses_after = list_response_after.json()['analyses']
    assert not any(a['id'] == analysis_id for a in analyses_after)
