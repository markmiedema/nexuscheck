import pytest
from datetime import datetime, date
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch, MagicMock

client = TestClient(app)

@pytest.fixture
def mock_auth():
    """Mock authentication to return a test user ID"""
    with patch('app.core.auth.require_auth') as mock:
        mock.return_value = 'test-user-123'
        yield mock

@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    with patch('app.api.v1.analyses.supabase') as mock:
        yield mock

def test_delete_analysis_soft_delete(mock_auth, mock_supabase):
    """Test that deleting an analysis performs soft delete (sets deleted_at)"""
    # Arrange
    analysis_id = 'analysis-456'

    # Mock Supabase update response
    mock_response = MagicMock()
    mock_response.data = [{
        'id': analysis_id,
        'deleted_at': '2025-11-07T10:30:00Z'
    }]
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.is_.return_value.execute.return_value = mock_response

    # Act
    response = client.delete(f'/api/v1/analyses/{analysis_id}')

    # Assert
    assert response.status_code == 200
    assert response.json()['message'] == 'Analysis deleted successfully'
    assert response.json()['id'] == analysis_id

    # Verify Supabase was called correctly
    mock_supabase.table.assert_called_with('analyses')
    # Should update deleted_at, not hard delete

def test_delete_analysis_not_found(mock_auth, mock_supabase):
    """Test deleting non-existent analysis returns 404"""
    # Arrange
    analysis_id = 'non-existent-id'

    # Mock Supabase returning empty data
    mock_response = MagicMock()
    mock_response.data = []
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.is_.return_value.execute.return_value = mock_response

    # Act
    response = client.delete(f'/api/v1/analyses/{analysis_id}')

    # Assert
    assert response.status_code == 404
    assert 'not found' in response.json()['detail'].lower()

def test_delete_analysis_unauthorized_user(mock_auth, mock_supabase):
    """Test that user cannot delete another user's analysis"""
    # Arrange
    analysis_id = 'analysis-456'

    # Mock Supabase returning empty data (no match for user_id)
    mock_response = MagicMock()
    mock_response.data = []
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.is_.return_value.execute.return_value = mock_response

    # Act
    response = client.delete(f'/api/v1/analyses/{analysis_id}')

    # Assert
    assert response.status_code == 404  # Not found because filtered by user_id

def test_list_analyses_with_pagination(mock_auth, mock_supabase):
    """Test that list endpoint supports limit and offset"""
    # Arrange
    mock_response = MagicMock()
    mock_response.data = [
        {'id': 'analysis-1', 'client_company_name': 'ACME Corp'},
        {'id': 'analysis-2', 'client_company_name': 'TechFlow LLC'}
    ]
    mock_response.count = 25  # Total count

    mock_supabase.table.return_value.select.return_value.eq.return_value.is_.return_value.order.return_value.range.return_value.execute.return_value = mock_response

    # Act
    response = client.get('/api/v1/analyses?limit=2&offset=0')

    # Assert
    assert response.status_code == 200
    assert len(response.json()['analyses']) == 2
    assert response.json()['total_count'] == 25
    assert response.json()['limit'] == 2
    assert response.json()['offset'] == 0

def test_list_analyses_with_search(mock_auth, mock_supabase):
    """Test that list endpoint supports search by client name"""
    # Arrange
    mock_response = MagicMock()
    mock_response.data = [
        {'id': 'analysis-1', 'client_company_name': 'ACME Corp'}
    ]
    mock_response.count = 1

    mock_supabase.table.return_value.select.return_value.eq.return_value.ilike.return_value.is_.return_value.order.return_value.range.return_value.execute.return_value = mock_response

    # Act
    response = client.get('/api/v1/analyses?search=ACME')

    # Assert
    assert response.status_code == 200
    assert len(response.json()['analyses']) == 1
    assert 'ACME' in response.json()['analyses'][0]['client_company_name']
