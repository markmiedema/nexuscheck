# Analysis Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete analysis management system allowing users to list, view, and delete their previous sales tax nexus analyses.

**Architecture:** Full-stack feature using existing Supabase database, FastAPI backend endpoints, and Next.js 14 frontend with App Router. Backend provides RESTful API for CRUD operations filtered by authenticated user. Frontend uses shadcn/ui Table components for professional data display.

**Tech Stack:** FastAPI (Python 3.11), Supabase (PostgreSQL), Next.js 14 (TypeScript), shadcn/ui, Tailwind CSS

---

## Task 1: Backend - Implement Soft Delete Endpoint

**Files:**
- Modify: `backend/app/api/v1/analyses.py:187-191`
- Test: `backend/tests/test_analyses_api.py` (new file)

### Step 1: Write the failing test

**Create:** `backend/tests/test_analyses_api.py`

```python
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
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response

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
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response

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
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response

    # Act
    response = client.delete(f'/api/v1/analyses/{analysis_id}')

    # Assert
    assert response.status_code == 404  # Not found because filtered by user_id
```

### Step 2: Run test to verify it fails

**Run:**
```bash
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\backend"
pytest tests/test_analyses_api.py::test_delete_analysis_soft_delete -v
```

**Expected:** FAIL with "endpoint not implemented" or similar error

### Step 3: Implement the DELETE endpoint

**Modify:** `backend/app/api/v1/analyses.py:187-229`

Replace the TODO stub (lines 187-191) with:

```python
@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    user_id: str = Depends(require_auth)
) -> dict:
    """
    Soft delete an analysis (sets deleted_at timestamp).

    Only the owner can delete their analysis.
    Hard deletion happens after 30 days via scheduled job.

    Args:
        analysis_id: UUID of the analysis to delete
        user_id: Current authenticated user ID

    Returns:
        Confirmation message with deleted analysis ID

    Raises:
        HTTPException 404: Analysis not found or user doesn't own it
    """
    try:
        # Soft delete: Set deleted_at timestamp
        # Filter by both analysis_id AND user_id for security
        result = supabase.table('analyses')\
            .update({'deleted_at': datetime.now().isoformat()})\
            .eq('id', analysis_id)\
            .eq('user_id', user_id)\
            .is_('deleted_at', 'null')\
            .execute()

        # Check if analysis was found and deleted
        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Analysis {analysis_id} not found or already deleted"
            )

        return {
            "message": "Analysis deleted successfully",
            "id": analysis_id,
            "deleted_at": result.data[0]['deleted_at']
        }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to delete analysis: {str(e)}")
```

### Step 4: Run tests to verify they pass

**Run:**
```bash
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\backend"
pytest tests/test_analyses_api.py -v
```

**Expected:** All 3 tests PASS

### Step 5: Commit

```bash
git add backend/tests/test_analyses_api.py backend/app/api/v1/analyses.py
git commit -m "feat: implement soft delete for analyses

- Add DELETE /api/v1/analyses/{id} endpoint
- Soft delete using deleted_at timestamp
- Security: Only owner can delete their analysis
- Add comprehensive tests for delete functionality"
```

---

## Task 2: Backend - Add Pagination and Search to List Endpoint

**Files:**
- Modify: `backend/app/api/v1/analyses.py:19-46`
- Test: `backend/tests/test_analyses_api.py`

### Step 1: Write the failing test

**Add to:** `backend/tests/test_analyses_api.py`

```python
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
```

### Step 2: Run test to verify it fails

**Run:**
```bash
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\backend"
pytest tests/test_analyses_api.py::test_list_analyses_with_pagination -v
```

**Expected:** FAIL - endpoint doesn't accept limit/offset params

### Step 3: Enhance the list endpoint

**Modify:** `backend/app/api/v1/analyses.py:19-46`

Replace the existing list_analyses function with:

```python
@router.get("")
async def list_analyses(
    user_id: str = Depends(require_auth),
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    status: Optional[str] = None
) -> dict:
    """
    List all analyses for the current user.

    Supports pagination, search, and filtering.

    Args:
        user_id: Current authenticated user ID
        limit: Max number of analyses to return (default: 50)
        offset: Number of analyses to skip (default: 0)
        search: Optional search term for client company name
        status: Optional filter by status (draft, processing, complete, error)

    Returns:
        Paginated list of analyses with metadata
    """
    try:
        # Build query
        query = supabase.table('analyses')\
            .select('*', count='exact')\
            .eq('user_id', user_id)\
            .is_('deleted_at', 'null')  # Exclude soft-deleted

        # Apply search filter if provided
        if search:
            query = query.ilike('client_company_name', f'%{search}%')

        # Apply status filter if provided
        if status:
            query = query.eq('status', status)

        # Apply ordering and pagination
        result = query.order('created_at', desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()

        return {
            "total_count": result.count,
            "limit": limit,
            "offset": offset,
            "analyses": result.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analyses: {str(e)}")
```

**Add import at top of file:**
```python
from typing import Optional
```

### Step 4: Run tests to verify they pass

**Run:**
```bash
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\backend"
pytest tests/test_analyses_api.py::test_list_analyses_with_pagination -v
pytest tests/test_analyses_api.py::test_list_analyses_with_search -v
```

**Expected:** Both tests PASS

### Step 5: Commit

```bash
git add backend/app/api/v1/analyses.py backend/tests/test_analyses_api.py
git commit -m "feat: add pagination and search to analyses list

- Add limit and offset params for pagination
- Add search param for filtering by client name
- Add status filter
- Exclude soft-deleted analyses
- Add comprehensive tests"
```

---

## Task 3: Frontend - Create Analyses List Page Component

**Files:**
- Create: `frontend/app/analyses/page.tsx`
- Create: `frontend/lib/api/analyses.ts` (if not exists, or add to existing)

### Step 1: Create API client function

**Create/Modify:** `frontend/lib/api/analyses.ts`

```typescript
import apiClient from './client'

export interface Analysis {
  id: string
  user_id: string
  client_company_name: string
  industry?: string
  business_type: string
  analysis_period_start: string
  analysis_period_end: string
  status: 'draft' | 'processing' | 'complete' | 'error'
  total_liability?: number
  states_with_nexus?: number
  created_at: string
  updated_at: string
}

export interface AnalysesListResponse {
  total_count: number
  limit: number
  offset: number
  analyses: Analysis[]
}

export async function listAnalyses(params?: {
  limit?: number
  offset?: number
  search?: string
  status?: string
}): Promise<AnalysesListResponse> {
  const response = await apiClient.get('/analyses', { params })
  return response.data
}

export async function deleteAnalysis(analysisId: string): Promise<void> {
  await apiClient.delete(`/analyses/${analysisId}`)
}
```

### Step 2: Create the analyses list page

**Create:** `frontend/app/analyses/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { listAnalyses, deleteAnalysis, type Analysis } from '@/lib/api/analyses'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Eye,
  Trash2,
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react'

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-500', icon: Loader2 },
  complete: { label: 'Complete', color: 'bg-green-500', icon: CheckCircle },
  error: { label: 'Error', color: 'bg-red-500', icon: AlertCircle },
}

export default function AnalysesPage() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [limit] = useState(50)
  const [offset] = useState(0)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  useEffect(() => {
    loadAnalyses()
  }, [searchTerm])

  async function loadAnalyses() {
    try {
      setLoading(true)
      const data = await listAnalyses({
        limit,
        offset,
        search: searchTerm || undefined,
      })
      setAnalyses(data.analyses)
      setTotalCount(data.total_count)
    } catch (error) {
      console.error('Failed to load analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(analysisId: string, clientName: string) {
    if (!confirm(`Are you sure you want to delete the analysis for "${clientName}"?`)) {
      return
    }

    try {
      setDeleteLoading(analysisId)
      await deleteAnalysis(analysisId)
      await loadAnalyses() // Reload list
    } catch (error) {
      console.error('Failed to delete analysis:', error)
      alert('Failed to delete analysis. Please try again.')
    } finally {
      setDeleteLoading(null)
    }
  }

  function handleView(analysisId: string) {
    router.push(`/analysis/${analysisId}/results`)
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatCurrency(amount?: number): string {
    if (!amount) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Analysis History</CardTitle>
              <CardDescription>
                View and manage your previous sales tax nexus analyses
              </CardDescription>
            </div>
            <Button onClick={() => router.push('/analysis/new')}>
              <FileText className="mr-2 h-4 w-4" />
              New Analysis
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mt-4 flex items-center gap-2 max-w-md">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            // Loading skeletons
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : analyses.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No analyses found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? 'No analyses match your search.'
                  : 'Get started by creating your first analysis.'}
              </p>
              {!searchTerm && (
                <Button className="mt-4" onClick={() => router.push('/analysis/new')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Analysis
                </Button>
              )}
            </div>
          ) : (
            // Analyses table
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">States with Nexus</TableHead>
                    <TableHead className="text-right">Est. Liability</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.map((analysis) => {
                    const statusConfig = STATUS_CONFIG[analysis.status]
                    const StatusIcon = statusConfig.icon

                    return (
                      <TableRow key={analysis.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {analysis.client_company_name}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(analysis.analysis_period_start)} —{' '}
                          {formatDate(analysis.analysis_period_end)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig.color} text-white`}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {analysis.states_with_nexus ?? '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(analysis.total_liability)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-gray-600">
                          {formatDate(analysis.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(analysis.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDelete(analysis.id, analysis.client_company_name)
                              }
                              disabled={deleteLoading === analysis.id}
                            >
                              {deleteLoading === analysis.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination info */}
              <div className="mt-4 text-sm text-gray-500">
                Showing {analyses.length} of {totalCount} analyses
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 3: Test the page in browser

**Run:**
```bash
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\frontend"
npm run dev
```

**Navigate to:** `http://localhost:3000/analyses`

**Expected:**
- Page loads without errors
- Shows loading skeletons initially
- Shows empty state if no analyses
- Shows table with analyses if data exists

### Step 4: Commit

```bash
git add frontend/app/analyses/page.tsx frontend/lib/api/analyses.ts
git commit -m "feat: create analyses list page

- Add full-featured analyses list UI
- Implement search by client name
- Add status badges with icons
- Add view and delete actions
- Responsive table layout with shadcn/ui
- Empty state for new users"
```

---

## Task 4: Frontend - Update Dashboard to Link to Analyses Page

**Files:**
- Modify: `frontend/app/dashboard/page.tsx`

### Step 1: Identify the dashboard placeholder

**Read:** `frontend/app/dashboard/page.tsx` around line 105

Current code should show:
```typescript
<h3>Recent Analyses</h3>
<p>View your previous analyses (coming soon)</p>
```

### Step 2: Replace placeholder with real link

**Modify:** `frontend/app/dashboard/page.tsx`

Find the placeholder section and replace with:

```typescript
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

// Inside component:
const router = useRouter()

// Replace placeholder with:
<div className="space-y-4">
  <h3 className="text-lg font-semibold">Recent Analyses</h3>
  <Button
    onClick={() => router.push('/analyses')}
    variant="outline"
    className="w-full"
  >
    <FileText className="mr-2 h-4 w-4" />
    View All Analyses
  </Button>
</div>
```

### Step 3: Test navigation

**Run:** `npm run dev`

**Navigate to:** `http://localhost:3000/dashboard`

**Expected:**
- "View All Analyses" button appears
- Clicking button navigates to `/analyses`
- Navigation works smoothly

### Step 4: Commit

```bash
git add frontend/app/dashboard/page.tsx
git commit -m "feat: link dashboard to analyses page

- Replace placeholder with working link
- Add button to view all analyses
- Improve dashboard UX"
```

---

## Task 5: Frontend - Verify View Analysis Works with Saved Analyses

**Files:**
- Test: `frontend/app/analysis/[id]/results/page.tsx`
- Potentially modify if bugs found

### Step 1: Manual test with saved analysis

**Run:** `npm run dev`

**Test Sequence:**
1. Navigate to `/analyses`
2. Click "View" (eye icon) on any complete analysis
3. Verify results page loads correctly
4. Check that all data displays:
   - Client name
   - Analysis period
   - States with nexus
   - Liability summary
5. Navigate to state details
6. Navigate back to analyses list

**Expected:** All navigation and data display works correctly

### Step 2: Check for dynamic route issues

If errors occur, check:

**File:** `frontend/app/analysis/[id]/results/page.tsx`

Ensure it's using the `[id]` param correctly:

```typescript
import { useParams } from 'next/navigation'

export default function ResultsPage() {
  const params = useParams()
  const analysisId = params.id as string

  // Use analysisId to fetch data
}
```

### Step 3: Fix any bugs found

If bugs are discovered:
1. Document the issue
2. Write a fix
3. Test the fix
4. Commit with descriptive message

### Step 4: Commit (if changes made)

```bash
git add [modified files]
git commit -m "fix: ensure saved analyses display correctly

- Fix [specific issue]
- Improve [specific component]"
```

---

## Task 6: Frontend - Add Delete Confirmation Dialog (Optional Enhancement)

**Files:**
- Create: `frontend/components/analyses/DeleteConfirmationDialog.tsx`
- Modify: `frontend/app/analyses/page.tsx`

### Step 1: Create reusable delete dialog component

**Create:** `frontend/components/analyses/DeleteConfirmationDialog.tsx`

```typescript
'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  clientName: string
  loading?: boolean
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  clientName,
  loading = false,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Analysis?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete the analysis for{' '}
              <span className="font-semibold">{clientName}</span>?
            </p>
            <p className="text-sm text-gray-500">
              This will move the analysis to trash. You'll have 30 days to recover it
              before permanent deletion.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Deleting...' : 'Delete Analysis'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### Step 2: Install AlertDialog component if needed

**Run:**
```bash
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\frontend"
npx shadcn@latest add alert-dialog
```

**Expected:** AlertDialog component added to `components/ui/`

### Step 3: Update analyses page to use dialog

**Modify:** `frontend/app/analyses/page.tsx`

Add to imports:
```typescript
import { DeleteConfirmationDialog } from '@/components/analyses/DeleteConfirmationDialog'
```

Add state for dialog:
```typescript
const [deleteDialog, setDeleteDialog] = useState<{
  open: boolean
  analysisId: string
  clientName: string
} | null>(null)
```

Replace the `handleDelete` function:
```typescript
function handleDeleteClick(analysisId: string, clientName: string) {
  setDeleteDialog({ open: true, analysisId, clientName })
}

async function handleDeleteConfirm() {
  if (!deleteDialog) return

  try {
    setDeleteLoading(deleteDialog.analysisId)
    await deleteAnalysis(deleteDialog.analysisId)
    setDeleteDialog(null)
    await loadAnalyses() // Reload list
  } catch (error) {
    console.error('Failed to delete analysis:', error)
    alert('Failed to delete analysis. Please try again.')
  } finally {
    setDeleteLoading(null)
  }
}
```

Update the delete button:
```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleDeleteClick(analysis.id, analysis.client_company_name)}
  disabled={deleteLoading === analysis.id}
>
  {deleteLoading === analysis.id ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <Trash2 className="h-4 w-4 text-red-600" />
  )}
</Button>
```

Add the dialog component before the closing `</div>`:
```typescript
{deleteDialog && (
  <DeleteConfirmationDialog
    open={deleteDialog.open}
    onOpenChange={(open) => !open && setDeleteDialog(null)}
    onConfirm={handleDeleteConfirm}
    clientName={deleteDialog.clientName}
    loading={deleteLoading === deleteDialog.analysisId}
  />
)}
```

### Step 4: Test the dialog

**Run:** `npm run dev`

**Test:**
1. Navigate to `/analyses`
2. Click delete (trash icon) on any analysis
3. Verify dialog appears with correct client name
4. Click "Cancel" - dialog closes, analysis not deleted
5. Click delete again
6. Click "Delete Analysis" - analysis deleted, list updates

**Expected:** Professional delete confirmation with 30-day recovery notice

### Step 5: Commit

```bash
git add frontend/components/analyses/DeleteConfirmationDialog.tsx frontend/app/analyses/page.tsx
git commit -m "feat: add professional delete confirmation dialog

- Create reusable DeleteConfirmationDialog component
- Add 30-day recovery notice
- Improve delete UX with proper confirmation
- Use shadcn/ui AlertDialog"
```

---

## Task 7: Integration Testing

**Files:**
- Create: `backend/tests/test_analyses_integration.py`

### Step 1: Write end-to-end integration test

**Create:** `backend/tests/test_analyses_integration.py`

```python
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
```

### Step 2: Document manual testing checklist

**Create:** `docs/testing/analysis-management-checklist.md`

```markdown
# Analysis Management - Manual Testing Checklist

## Pre-Testing Setup
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Logged in as test user
- [ ] At least 2-3 test analyses exist in database

## Test Cases

### 1. List Analyses
- [ ] Navigate to `/analyses`
- [ ] Verify analyses load and display
- [ ] Check all columns show data:
  - [ ] Client name
  - [ ] Analysis period
  - [ ] Status badge with icon
  - [ ] States with nexus count
  - [ ] Estimated liability (formatted as currency)
  - [ ] Created date
- [ ] Verify "New Analysis" button appears

### 2. Search Functionality
- [ ] Enter client name in search box
- [ ] Verify results filter as you type
- [ ] Clear search - all results return
- [ ] Search for non-existent client - shows empty state

### 3. View Analysis
- [ ] Click "View" (eye icon) on complete analysis
- [ ] Verify redirects to `/analysis/{id}/results`
- [ ] Verify all results data displays correctly
- [ ] Navigate to state details page
- [ ] Use browser back button to return to list
- [ ] Verify list still shows correct data

### 4. Delete Analysis
- [ ] Click "Delete" (trash icon) on any analysis
- [ ] Verify confirmation dialog appears
- [ ] Click "Cancel" - dialog closes, analysis remains
- [ ] Click "Delete" again
- [ ] Click "Delete Analysis" button
- [ ] Verify analysis removed from list
- [ ] Verify total count decrements

### 5. Empty States
- [ ] Create new test user with no analyses
- [ ] Navigate to `/analyses`
- [ ] Verify empty state shows:
  - [ ] Icon
  - [ ] "No analyses found" message
  - [ ] "Create Analysis" button
- [ ] Click "Create Analysis" - redirects to `/analysis/new`

### 6. Dashboard Integration
- [ ] Navigate to `/dashboard`
- [ ] Verify "View All Analyses" button appears
- [ ] Click button - redirects to `/analyses`

## Post-Testing Cleanup
- [ ] Delete test analyses created during testing
- [ ] Log out test user
```

### Step 3: Run manual tests

Follow the checklist created in Step 2.

**Expected:** All test cases pass

### Step 4: Commit testing documentation

```bash
git add docs/testing/analysis-management-checklist.md backend/tests/test_analyses_integration.py
git commit -m "test: add integration tests and manual testing checklist

- Add end-to-end integration test
- Create comprehensive manual testing checklist
- Document all test scenarios for Analysis Management"
```

---

## Task 8: Update Sprint Plan Documentation

**Files:**
- Modify: `_05-development/SPRINT_PLAN_BETA_TO_PILOT.md`
- Modify: `_05-development/CURRENT_STATUS_2025-11-05.md`
- Modify: `00-START-HERE.md`

### Step 1: Mark Sprint 1A complete

**Modify:** `_05-development/SPRINT_PLAN_BETA_TO_PILOT.md`

Find Sprint 1A section (around line 30) and update:

```markdown
### Sprint 1A: Analysis Management ✅ COMPLETE
**Estimated:** 8-12 hours | **Actual Hours:** [INSERT ACTUAL TIME]
**Priority:** P0 (Blocker)
**Completed:** 2025-11-07

**What Was Built:**
1. **Backend Enhancements:**
   - DELETE /analyses/{id} endpoint with soft delete
   - Enhanced GET /analyses with pagination (limit/offset)
   - Search by client name (ilike query)
   - Status filtering
   - Comprehensive test coverage (6 tests)

2. **Frontend Features:**
   - Full analyses list page at /analyses
   - Search by client name
   - Status badges with icons
   - View and delete actions
   - Delete confirmation dialog
   - Empty state for new users
   - Dashboard integration

3. **Testing:**
   - 6 backend unit tests (all passing)
   - 1 integration test
   - Manual testing checklist documented

**Acceptance Criteria:**
- [x] User can see list of all their previous analyses
- [x] User can click to view any past analysis
- [x] All data displays correctly for past analyses
- [x] User can navigate to state details from past analyses
- [x] User can delete analyses with confirmation
```

### Step 2: Update completion log

**Modify:** `_05-development/SPRINT_PLAN_BETA_TO_PILOT.md`

Find "Sprint Completion Log" section (around line 384) and add:

```markdown
### Completed Sprints

#### Sprint 1A: Analysis Management ✅
**Completed:** 2025-11-07
**Actual Time:** [INSERT HOURS] hours (estimated: 8-12 hours)
**Status:** All acceptance criteria met

**Key Achievements:**
- Full CRUD operations for analyses
- Professional UI with search and filtering
- Comprehensive test coverage
- Delete confirmation with 30-day recovery notice

**Lessons Learned:**
- shadcn/ui components worked great for rapid UI development
- Supabase filtering with .is_('deleted_at', 'null') prevents soft-deleted items
- AlertDialog component required separate installation

**Next:** Sprint 1B - PDF Generation
```

### Step 3: Update current status document

**Modify:** `_05-development/CURRENT_STATUS_2025-11-05.md`

Move "Analysis Management" from missing to working section.

### Step 4: Update START-HERE

**Modify:** `00-START-HERE.md`

Update "Current Work" section to reflect Sprint 1A completion.

### Step 5: Commit documentation updates

```bash
git add _05-development/SPRINT_PLAN_BETA_TO_PILOT.md _05-development/CURRENT_STATUS_2025-11-05.md 00-START-HERE.md
git commit -m "docs: mark Sprint 1A complete

- Update sprint plan with completion status
- Document actual hours and lessons learned
- Update current status document
- Update START-HERE with latest progress"
```

---

## COMPLETION CHECKLIST

After completing all tasks, verify:

### Backend
- [x] DELETE /analyses/{id} endpoint implemented
- [x] Soft delete using deleted_at timestamp
- [x] GET /analyses enhanced with pagination
- [x] Search by client name works
- [x] Status filtering works
- [x] Tests written and passing (6 unit tests)
- [x] Integration test documented

### Frontend
- [x] Analyses list page created at /analyses
- [x] Table displays all required columns
- [x] Search functionality works
- [x] Status badges show with correct colors/icons
- [x] View button navigates to results page
- [x] Delete button shows confirmation dialog
- [x] Empty state displays for new users
- [x] Dashboard links to analyses page
- [x] All navigation works smoothly

### Testing
- [x] Backend unit tests pass
- [x] Manual testing checklist completed
- [x] Integration test documented
- [x] No console errors in browser
- [x] All features work as expected

### Documentation
- [x] Sprint 1A marked complete
- [x] Actual hours documented
- [x] Lessons learned captured
- [x] Current status updated
- [x] START-HERE updated

---

## ESTIMATED TOTAL TIME

**Backend:** 3-4 hours
- Task 1: DELETE endpoint (1-1.5 hours)
- Task 2: Pagination/search (1-1.5 hours)
- Task 7: Integration testing (0.5-1 hour)

**Frontend:** 4-6 hours
- Task 3: Analyses list page (2-3 hours)
- Task 4: Dashboard link (0.5 hour)
- Task 5: View analysis verification (0.5 hour)
- Task 6: Delete confirmation dialog (1-1.5 hours)

**Documentation:** 1 hour
- Task 8: Update docs (1 hour)

**TOTAL: 8-11 hours** (within original estimate of 8-12 hours)

---

## NEXT STEPS

After Sprint 1A completion:

1. **Sprint 1B: PDF Generation** (12-16 hours)
   - Choose PDF library (WeasyPrint recommended)
   - Design report template
   - Implement PDF generation service
   - Add export button to results page

2. **Sprint 1C: Auto-Detect Date Range** (2-3 hours)
   - Scan uploaded CSV for date range
   - Auto-populate analysis period
   - Allow user override

**Week 1 Complete:** Beta-ready tool functional for real client work! 🎉
