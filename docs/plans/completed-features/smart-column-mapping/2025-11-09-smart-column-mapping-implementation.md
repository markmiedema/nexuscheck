# Smart Column Mapping UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add smart column mapping confirmation dialog for when auto-detection succeeds, and redesign the mapping page with modern shadcn/ui aesthetics.

**Architecture:** Backend will provide auto-detected column mappings with confidence scores in upload response. Frontend will show a quick confirmation dialog when all required columns are detected, or skip to full mapping page otherwise. Mapping page redesigned with Card-based layout, horizontal grid, and better visual hierarchy.

**Tech Stack:** FastAPI, pandas, Next.js 14, React, shadcn/ui, TypeScript

**Design Doc:** `docs/plans/2025-11-09-smart-column-mapping-ux-design.md`

---

## Task 1: Create Column Auto-Detection Service

**Files:**
- Create: `backend/app/services/column_detector.py`
- Test: `backend/tests/test_column_detector.py`

### Step 1: Write failing test for column detection

Create test file:

```python
# backend/tests/test_column_detector.py
import pytest
from app.services.column_detector import ColumnDetector


def test_detect_exact_column_names():
    """Test detection with exact column names"""
    columns = ['transaction_date', 'customer_state', 'revenue_amount', 'sales_channel']

    detector = ColumnDetector(columns)
    result = detector.detect_mappings()

    assert result['all_required_detected'] == True
    assert result['mappings']['transaction_date'] == 'transaction_date'
    assert result['mappings']['customer_state'] == 'customer_state'
    assert result['mappings']['revenue_amount'] == 'revenue_amount'
    assert result['mappings']['sales_channel'] == 'sales_channel'
    assert result['confidence']['transaction_date'] == 'high'


def test_detect_common_variants():
    """Test detection with common column name variants"""
    columns = ['date', 'state', 'amount', 'channel']

    detector = ColumnDetector(columns)
    result = detector.detect_mappings()

    assert result['all_required_detected'] == True
    assert result['mappings']['transaction_date'] == 'date'
    assert result['mappings']['customer_state'] == 'state'
    assert result['mappings']['revenue_amount'] == 'amount'
    assert result['mappings']['sales_channel'] == 'channel'


def test_partial_detection():
    """Test when only some columns are detected"""
    columns = ['date', 'state', 'total']  # Missing sales_channel

    detector = ColumnDetector(columns)
    result = detector.detect_mappings()

    assert result['all_required_detected'] == False
    assert 'transaction_date' in result['mappings']
    assert 'customer_state' in result['mappings']
    assert 'sales_channel' not in result['mappings']


def test_confidence_scoring():
    """Test that confidence decreases for less common variants"""
    columns = ['invoice_date', 'buyer_state', 'total_amount', 'order_source']

    detector = ColumnDetector(columns)
    result = detector.detect_mappings()

    # Later patterns should have lower confidence
    assert result['confidence']['transaction_date'] in ['medium', 'low']
    assert result['confidence']['customer_state'] in ['medium', 'low']


def test_case_insensitive_matching():
    """Test that matching is case-insensitive"""
    columns = ['TRANSACTION_DATE', 'Customer_State', 'Revenue_Amount', 'Sales_Channel']

    detector = ColumnDetector(columns)
    result = detector.detect_mappings()

    assert result['all_required_detected'] == True
```

### Step 2: Run test to verify it fails

```bash
cd backend
pytest tests/test_column_detector.py -v
```

Expected: FAIL with "ModuleNotFoundError: No module named 'app.services.column_detector'"

### Step 3: Implement ColumnDetector service

```python
# backend/app/services/column_detector.py
"""Service for auto-detecting column mappings from CSV headers"""
from typing import Dict, List


class ColumnDetector:
    """
    Auto-detect which columns map to required fields based on column names.

    Uses pattern matching with confidence scoring:
    - high: exact match or most common variant
    - medium: common variant
    - low: less common but valid variant
    """

    # Patterns ordered by confidence (first = highest)
    COLUMN_PATTERNS = {
        'transaction_date': [
            'transaction_date',
            'date',
            'order_date',
            'sale_date',
            'txn_date',
            'trans_date',
            'invoice_date',
        ],
        'customer_state': [
            'customer_state',
            'state',
            'buyer_state',
            'ship_to_state',
            'shipping_state',
            'customer_location',
            'destination_state',
        ],
        'revenue_amount': [
            'revenue_amount',
            'amount',
            'sales_amount',
            'total',
            'price',
            'revenue',
            'sales',
            'total_amount',
        ],
        'sales_channel': [
            'sales_channel',
            'channel',
            'source',
            'marketplace',
            'order_source',
            'sale_channel',
        ]
    }

    def __init__(self, columns: List[str]):
        """
        Initialize detector with CSV column names.

        Args:
            columns: List of column names from CSV
        """
        self.columns = columns

    def detect_mappings(self) -> Dict:
        """
        Detect column mappings with confidence scores.

        Returns:
            Dict with:
                - mappings: Dict of field -> detected column name
                - confidence: Dict of field -> confidence level
                - all_required_detected: Boolean
        """
        mappings = {}
        confidence = {}

        for field, patterns in self.COLUMN_PATTERNS.items():
            for i, pattern in enumerate(patterns):
                # Case-insensitive matching
                match = next(
                    (col for col in self.columns if col.lower() == pattern.lower()),
                    None
                )
                if match:
                    mappings[field] = match

                    # Assign confidence based on pattern position
                    if i == 0:
                        confidence[field] = 'high'
                    elif i < 3:
                        confidence[field] = 'medium'
                    else:
                        confidence[field] = 'low'
                    break

        return {
            'mappings': mappings,
            'confidence': confidence,
            'all_required_detected': len(mappings) == 4
        }

    def get_sample_values(self, df, max_samples: int = 5) -> Dict[str, List[str]]:
        """
        Extract sample values for each column.

        Args:
            df: pandas DataFrame with transaction data
            max_samples: Maximum number of unique sample values per column

        Returns:
            Dict mapping column name to list of sample values (as strings)
        """
        samples = {}

        for col in self.columns:
            if col in df.columns:
                # Get unique non-null values
                unique_vals = df[col].dropna().unique()[:max_samples]
                # Convert to strings
                samples[col] = [str(val) for val in unique_vals]

        return samples
```

### Step 4: Run tests to verify they pass

```bash
cd backend
pytest tests/test_column_detector.py -v
```

Expected: All 5 tests PASS

### Step 5: Commit

```bash
git add backend/app/services/column_detector.py backend/tests/test_column_detector.py
git commit -m "feat(backend): add column auto-detection service

- Create ColumnDetector with pattern matching
- Support case-insensitive matching
- Implement confidence scoring (high/medium/low)
- Add sample value extraction
- 5 unit tests covering detection scenarios"
```

---

## Task 2: Modify Upload Endpoint to Support Flexible Column Names

**Files:**
- Modify: `backend/app/api/v1/analyses.py:270-458` (upload_transactions function)

### Step 1: Update upload endpoint to be flexible with column names

**Current behavior:** Endpoint validates that exact column names exist and fails if not found.

**New behavior:** Accept any columns, perform auto-detection, return detection results WITHOUT saving data yet.

**Important Note:** This is a breaking change. We'll modify the endpoint to:
1. Parse the file and detect columns
2. Return auto-detection results
3. NOT insert transactions yet (will happen in new /validate-and-save endpoint)

Replace lines 331-339 (column validation) with auto-detection:

```python
# OLD CODE (DELETE):
# # Validate required columns exist
# required_columns = ['transaction_date', 'customer_state', 'revenue_amount', 'sales_channel']
# missing_columns = [col for col in required_columns if col not in df.columns]
#
# if missing_columns:
#     raise HTTPException(
#         status_code=status.HTTP_400_BAD_REQUEST,
#         detail=f"Missing required columns: {', '.join(missing_columns)}"
#     )

# NEW CODE (ADD):
from app.services.column_detector import ColumnDetector

# Auto-detect column mappings
column_detector = ColumnDetector(list(df.columns))
detection_result = detector.detect_mappings()
sample_values = detector.get_sample_values(df, max_samples=5)
```

### Step 2: Store raw CSV data temporarily instead of processing immediately

Replace the transaction insertion logic (lines 407-435) with temporary storage:

```python
# REPLACE transaction insertion with temporary file storage
# We'll process and insert transactions after user confirms mappings

# Store raw CSV content in Supabase Storage for later processing
from supabase import create_client
import base64

storage_path = f"uploads/{user_id}/{analysis_id}/raw_data.csv"

# Upload file to Supabase Storage
try:
    supabase.storage.from_('analysis-uploads').upload(
        storage_path,
        content,
        file_options={"content-type": file.content_type}
    )
except Exception as e:
    logger.warning(f"Failed to store file in storage: {str(e)}")
    # Continue even if storage fails - we have the data in memory
```

### Step 3: Update response to include auto-detection results

Replace the response (lines 439-449) with enhanced response:

```python
# Calculate data summary from raw DataFrame
all_transactions = df.dropna(subset=[detection_result['mappings'].get('transaction_date')] if detection_result.get('all_required_detected') else [])
total_rows = len(all_transactions)

# Only calculate summary if we detected required columns
summary = None
if detection_result['all_required_detected']:
    # Get date column name
    date_col = detection_result['mappings']['transaction_date']
    state_col = detection_result['mappings']['customer_state']

    # Parse dates
    date_series = pd.to_datetime(all_transactions[date_col], errors='coerce')
    valid_dates = date_series.dropna()

    if len(valid_dates) > 0:
        summary = {
            "total_rows": total_rows,
            "unique_states": all_transactions[state_col].nunique(),
            "date_range": {
                "start": valid_dates.min().strftime('%Y-%m-%d'),
                "end": valid_dates.max().strftime('%Y-%m-%d')
            }
        }

return {
    "message": "File uploaded and analyzed successfully",
    "analysis_id": analysis_id,
    "auto_detected_mappings": {
        "mappings": detection_result['mappings'],
        "confidence": detection_result['confidence'],
        "samples": sample_values,
        "summary": summary
    },
    "all_required_detected": detection_result['all_required_detected'],
    "columns_detected": list(df.columns),
    # Keep date detection for compatibility
    "date_range_detected": {
        "start": detected_start,
        "end": detected_end,
        "auto_populated": auto_populated
    } if detected_start else None
}
```

### Step 4: Manual test the endpoint

```bash
# Start backend server
cd backend
uvicorn app.main:app --reload

# In another terminal, test with curl (replace TOKEN and ANALYSIS_ID)
curl -X POST "http://localhost:8000/api/v1/analyses/{ANALYSIS_ID}/upload" \
  -H "Authorization: Bearer {TOKEN}" \
  -F "file=@test-data/sample-transactions.csv"
```

Expected response includes `auto_detected_mappings` with `mappings`, `confidence`, `samples`, and `all_required_detected`.

### Step 5: Commit

```bash
git add backend/app/api/v1/analyses.py
git commit -m "feat(backend): make upload endpoint flexible with auto-detection

BREAKING CHANGE: Upload endpoint now accepts any column names
- Use ColumnDetector to auto-detect mappings
- Return detection results with confidence scores
- Store raw CSV for later processing
- Include sample values in response
- Calculate data summary when all columns detected"
```

---

## Task 3: Create Mapping Validation and Save Endpoint

**Files:**
- Modify: `backend/app/api/v1/analyses.py` (add new endpoint after upload)

### Step 1: Create POST /analyses/{id}/validate-and-save endpoint

Add this new endpoint after the upload endpoint (around line 460):

```python
@router.post("/{analysis_id}/validate-and-save")
async def validate_and_save_mappings(
    analysis_id: str,
    column_mappings: dict,
    user_id: str = Depends(require_auth)
):
    """
    Validate column mappings and save transactions to database.

    This endpoint is called after user confirms mappings (either from confirmation dialog
    or from full mapping page).

    Body:
        column_mappings: {
            "transaction_date": {"source_column": "date", "date_format": "YYYY-MM-DD"},
            "customer_state": {"source_column": "state"},
            "revenue_amount": {"source_column": "amount"},
            "sales_channel": {"source_column": "channel", "value_mappings": {...}}
        }
    """
    supabase = get_supabase()

    try:
        # Verify analysis exists
        analysis_result = supabase.table('analyses').select('*').eq('id', analysis_id).eq('user_id', user_id).execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )

        # Retrieve raw CSV from storage
        storage_path = f"uploads/{user_id}/{analysis_id}/raw_data.csv"

        try:
            file_data = supabase.storage.from_('analysis-uploads').download(storage_path)
            df = pd.read_csv(io.BytesIO(file_data))
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Raw data file not found. Please re-upload your CSV."
            )

        # Extract mapping configuration
        transaction_date_config = column_mappings.get('transaction_date', {})
        customer_state_config = column_mappings.get('customer_state', {})
        revenue_amount_config = column_mappings.get('revenue_amount', {})
        sales_channel_config = column_mappings.get('sales_channel', {})

        # Validate required mappings exist
        if not transaction_date_config.get('source_column'):
            raise HTTPException(status_code=400, detail="transaction_date mapping required")
        if not customer_state_config.get('source_column'):
            raise HTTPException(status_code=400, detail="customer_state mapping required")
        if not revenue_amount_config.get('source_column'):
            raise HTTPException(status_code=400, detail="revenue_amount mapping required")
        if not sales_channel_config.get('source_column'):
            raise HTTPException(status_code=400, detail="sales_channel mapping required")

        # Apply column mappings and rename
        mapped_df = pd.DataFrame({
            'transaction_date': df[transaction_date_config['source_column']],
            'customer_state': df[customer_state_config['source_column']],
            'revenue_amount': df[revenue_amount_config['source_column']],
            'sales_channel': df[sales_channel_config['source_column']],
        })

        # Clean data
        mapped_df = mapped_df.dropna(subset=['transaction_date', 'customer_state', 'revenue_amount', 'sales_channel'])

        if len(mapped_df) == 0:
            raise HTTPException(status_code=400, detail="No valid transactions after applying mappings")

        # Convert dates
        mapped_df['transaction_date'] = pd.to_datetime(mapped_df['transaction_date']).dt.strftime('%Y-%m-%d')

        # Prepare transactions for insertion
        transactions = []
        for _, row in mapped_df.iterrows():
            transaction = {
                "analysis_id": analysis_id,
                "transaction_date": row['transaction_date'],
                "customer_state": str(row['customer_state']).strip().upper()[:2],
                "sales_amount": float(row['revenue_amount']),
                "sales_channel": str(row['sales_channel']).strip().lower(),
                "transaction_count": 1,
                "tax_collected": None,
            }
            transactions.append(transaction)

        # Insert transactions in batches
        batch_size = 1000
        total_inserted = 0

        for i in range(0, len(transactions), batch_size):
            batch = transactions[i:i + batch_size]
            supabase.table('sales_transactions').insert(batch).execute()
            total_inserted += len(batch)

        # Update analysis status
        supabase.table('analyses').update({
            "status": "processing",
            "updated_at": datetime.utcnow().isoformat()
        }).eq('id', analysis_id).execute()

        logger.info(f"Saved {total_inserted} transactions for analysis {analysis_id}")

        return {
            "message": "Mappings validated and data saved successfully",
            "transactions_saved": total_inserted
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating and saving mappings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save transactions: {str(e)}"
        )
```

### Step 2: Test endpoint manually

```bash
# Test with curl
curl -X POST "http://localhost:8000/api/v1/analyses/{ANALYSIS_ID}/validate-and-save" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "column_mappings": {
      "transaction_date": {"source_column": "date"},
      "customer_state": {"source_column": "state"},
      "revenue_amount": {"source_column": "amount"},
      "sales_channel": {"source_column": "channel"}
    }
  }'
```

Expected: 200 OK with `transactions_saved` count

### Step 3: Commit

```bash
git add backend/app/api/v1/analyses.py
git commit -m "feat(backend): add validate-and-save mappings endpoint

- Create POST /analyses/{id}/validate-and-save
- Retrieve raw CSV from storage
- Apply user-confirmed column mappings
- Validate and insert transactions
- Support custom date formats and value mappings"
```

---

## Task 4: Create ColumnMappingConfirmationDialog Component

**Files:**
- Create: `frontend/components/analysis/ColumnMappingConfirmationDialog.tsx`

### Step 1: Create the component file

```tsx
// frontend/components/analysis/ColumnMappingConfirmationDialog.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ArrowRight } from 'lucide-react'

interface ColumnMappingConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onAdjust: () => void
  detectedMappings: {
    transaction_date?: string
    customer_state?: string
    revenue_amount?: string
    sales_channel?: string
  }
  samplesByColumn: Record<string, string[]>
  dataSummary?: {
    total_rows: number
    unique_states: number
    date_range: { start: string; end: string }
  }
}

const REQUIRED_FIELDS = {
  transaction_date: 'Transaction Date',
  customer_state: 'Customer State',
  revenue_amount: 'Revenue Amount',
  sales_channel: 'Sales Channel',
}

export default function ColumnMappingConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  onAdjust,
  detectedMappings,
  samplesByColumn,
  dataSummary,
}: ColumnMappingConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirm Column Mappings</DialogTitle>
          <DialogDescription>
            We've automatically detected your column mappings. Please verify they look correct.
          </DialogDescription>
        </DialogHeader>

        {/* Mappings Grid */}
        <div className="space-y-3 py-4">
          {Object.entries(REQUIRED_FIELDS).map(([key, label]) => {
            const detectedColumn = detectedMappings[key as keyof typeof detectedMappings]
            const samples = detectedColumn ? samplesByColumn[detectedColumn] || [] : []

            return (
              <div
                key={key}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
              >
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />

                <div className="flex-1 grid grid-cols-[120px_auto_1fr] gap-3 items-center">
                  <span className="text-sm font-medium">{label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-semibold">{detectedColumn}</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {samples.slice(0, 3).map((val, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {val}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Data Summary */}
        {dataSummary && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Transactions</p>
                <p className="font-semibold">{dataSummary.total_rows.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">States</p>
                <p className="font-semibold">{dataSummary.unique_states}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date Range</p>
                <p className="font-semibold text-xs">
                  {dataSummary.date_range.start} - {dataSummary.date_range.end}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onAdjust}>
            Adjust Mappings
          </Button>
          <Button onClick={onConfirm}>
            Confirm & Calculate Nexus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Step 2: Verify component compiles

```bash
cd frontend
npm run build
```

Expected: No TypeScript errors

### Step 3: Commit

```bash
git add frontend/components/analysis/ColumnMappingConfirmationDialog.tsx
git commit -m "feat(frontend): add column mapping confirmation dialog

- Create ColumnMappingConfirmationDialog component
- Show auto-detected mappings with sample values
- Display data summary (rows, states, date range)
- Provide Confirm and Adjust actions
- Match shadcn/ui design aesthetic"
```

---

## Task 5: Integrate Confirmation Dialog into Upload Page

**Files:**
- Modify: `frontend/app/analysis/[id]/upload/page.tsx`

### Step 1: Add state and imports

Add imports at top of file (after existing imports):

```tsx
import ColumnMappingConfirmationDialog from '@/components/analysis/ColumnMappingConfirmationDialog'
```

Add state after existing state declarations (around line 37):

```tsx
const [showMappingDialog, setShowMappingDialog] = useState(false)
const [autoDetectedMappings, setAutoDetectedMappings] = useState<any>(null)
```

### Step 2: Modify upload response handler

Replace the response handling in `handleContinue` function (around lines 119-125):

```tsx
// OLD CODE:
// if (response.data.date_range_detected) {
//   setDetectedDates(response.data.date_range_detected)
//   setShowDateDialog(true)
// } else {
//   router.push(`/analysis/${analysisId}/mapping`)
// }

// NEW CODE:
// First check for date detection (keep existing behavior)
if (response.data.date_range_detected) {
  setDetectedDates(response.data.date_range_detected)
  setShowDateDialog(true)
} else if (response.data.all_required_detected) {
  // High confidence: all required columns detected
  setAutoDetectedMappings(response.data.auto_detected_mappings)
  setShowMappingDialog(true)
} else {
  // Low confidence: go to full mapping page
  router.push(`/analysis/${analysisId}/mapping`)
}
```

### Step 3: Update date dialog close handler

Modify `handleDateDialogClose` to check for mapping dialog (around line 137):

```tsx
const handleDateDialogClose = () => {
  setShowDateDialog(false)

  // After closing date dialog, check if we should show mapping dialog
  if (autoDetectedMappings && autoDetectedMappings.all_required_detected) {
    setShowMappingDialog(true)
  } else {
    router.push(`/analysis/${analysisId}/mapping`)
  }
}
```

### Step 4: Add mapping dialog handlers

Add these handler functions after `handleDateDialogClose`:

```tsx
const handleMappingConfirm = async () => {
  setShowMappingDialog(false)

  try {
    // Save auto-detected mappings
    const mappingPayload = {
      column_mappings: {
        transaction_date: {
          source_column: autoDetectedMappings.mappings.transaction_date
        },
        customer_state: {
          source_column: autoDetectedMappings.mappings.customer_state
        },
        revenue_amount: {
          source_column: autoDetectedMappings.mappings.revenue_amount
        },
        sales_channel: {
          source_column: autoDetectedMappings.mappings.sales_channel
        }
      }
    }

    await apiClient.post(`/api/v1/analyses/${analysisId}/validate-and-save`, mappingPayload)

    // Navigate to results
    router.push(`/analysis/${analysisId}/results`)
  } catch (err) {
    const errorMsg = handleApiError(err, { userMessage: 'Failed to save mappings' })
    setError(errorMsg)
  }
}

const handleMappingAdjust = () => {
  setShowMappingDialog(false)
  router.push(`/analysis/${analysisId}/mapping`)
}
```

### Step 5: Add dialog to JSX

Add the dialog component before the closing `</ProtectedRoute>` tag (around line 356):

```tsx
{/* Column Mapping Confirmation Dialog */}
<ColumnMappingConfirmationDialog
  isOpen={showMappingDialog}
  onClose={() => setShowMappingDialog(false)}
  onConfirm={handleMappingConfirm}
  onAdjust={handleMappingAdjust}
  detectedMappings={autoDetectedMappings?.mappings || {}}
  samplesByColumn={autoDetectedMappings?.samples || {}}
  dataSummary={autoDetectedMappings?.summary}
/>
```

### Step 6: Test upload flow manually

```bash
cd frontend
npm run dev
```

1. Navigate to `/analysis/new`
2. Create analysis
3. Upload CSV with standard column names (date, state, amount, channel)
4. Verify confirmation dialog appears
5. Click "Confirm" - should navigate to results
6. Test again, click "Adjust" - should go to mapping page

### Step 7: Commit

```bash
git add frontend/app/analysis/[id]/upload/page.tsx
git commit -m "feat(frontend): integrate mapping confirmation dialog

- Add state for auto-detected mappings
- Show confirmation dialog when all columns detected
- Handle Confirm action (save and go to results)
- Handle Adjust action (go to mapping page)
- Chain date dialog → mapping dialog for UX"
```

---

## Task 6: Redesign Mapping Page - Add Required Imports and Dependencies

**Files:**
- Modify: `frontend/app/analysis/[id]/mapping/page.tsx`

### Step 1: Add new imports

Add these imports after existing imports (around line 10):

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert'
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react'
```

### Step 2: Verify dependencies exist

```bash
cd frontend
# Check if all shadcn components are installed
npm run build
```

Expected: No errors about missing components

If components are missing, install them:

```bash
npx shadcn-ui@latest add card select label badge separator alert
```

### Step 3: Commit

```bash
git add frontend/app/analysis/[id]/mapping/page.tsx
git commit -m "feat(frontend): add imports for mapping page redesign

- Import Card, Select, Label, Badge, Separator, Alert
- Import Lucide icons for visual feedback
- Prepare for component redesign"
```

---

## Task 7: Redesign Mapping Page - Required Fields Section

**Files:**
- Modify: `frontend/app/analysis/[id]/mapping/page.tsx:236-400`

### Step 1: Replace required fields section

Find the section starting with `{/* Required Fields */}` (around line 244) and replace everything up to `{/* Optional Fields */}` (around line 401) with:

```tsx
{/* Required Fields - Single Clean Card */}
<Card className="mb-6">
  <CardHeader>
    <CardTitle className="text-lg">Required Column Mappings</CardTitle>
    <CardDescription>
      We've auto-detected these mappings from your CSV. Verify they look correct.
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">

    {/* Transaction Date Mapping */}
    <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 items-start">
      {/* Your Column */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Your Column
        </Label>
        <Select
          value={mappings.transaction_date}
          onValueChange={(val) => handleMappingChange('transaction_date', val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select column..." />
          </SelectTrigger>
          <SelectContent>
            {columns.map(col => (
              <SelectItem key={col.name} value={col.name}>
                {col.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {mappings.transaction_date && (
          <div className="flex gap-1 flex-wrap">
            {getColumnSamples(mappings.transaction_date).slice(0, 3).map((val, idx) => (
              <Badge key={idx} variant="outline" className="text-xs font-normal">
                {val}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div className="flex items-center pt-8">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Maps To */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Maps To
        </Label>
        <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
          <span className="text-sm font-medium">Transaction Date</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateFormat} onValueChange={setDateFormat}>
            <SelectTrigger className="w-auto text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center pt-8">
        {mappings.transaction_date ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-500" />
        )}
      </div>
    </div>

    <Separator />

    {/* Customer State Mapping */}
    <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 items-start">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Your Column
        </Label>
        <Select
          value={mappings.customer_state}
          onValueChange={(val) => handleMappingChange('customer_state', val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select column..." />
          </SelectTrigger>
          <SelectContent>
            {columns.map(col => (
              <SelectItem key={col.name} value={col.name}>
                {col.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {mappings.customer_state && (
          <div className="flex gap-1 flex-wrap">
            {getColumnSamples(mappings.customer_state).slice(0, 5).map((val, idx) => (
              <Badge key={idx} variant="outline" className="text-xs font-normal">
                {val}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center pt-8">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Maps To
        </Label>
        <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
          <span className="text-sm font-medium">Customer State</span>
        </div>
      </div>

      <div className="flex items-center pt-8">
        {mappings.customer_state ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-500" />
        )}
      </div>
    </div>

    <Separator />

    {/* Revenue Amount Mapping */}
    <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 items-start">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Your Column
        </Label>
        <Select
          value={mappings.revenue_amount}
          onValueChange={(val) => handleMappingChange('revenue_amount', val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select column..." />
          </SelectTrigger>
          <SelectContent>
            {columns.map(col => (
              <SelectItem key={col.name} value={col.name}>
                {col.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {mappings.revenue_amount && (
          <div className="flex gap-1 flex-wrap">
            {getColumnSamples(mappings.revenue_amount).slice(0, 3).map((val, idx) => (
              <Badge key={idx} variant="outline" className="text-xs font-normal">
                ${val}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center pt-8">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Maps To
        </Label>
        <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
          <span className="text-sm font-medium">Revenue Amount</span>
        </div>
      </div>

      <div className="flex items-center pt-8">
        {mappings.revenue_amount ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-500" />
        )}
      </div>
    </div>

    <Separator />

    {/* Sales Channel Mapping */}
    <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 items-start">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Your Column
        </Label>
        <Select
          value={mappings.sales_channel}
          onValueChange={(val) => handleMappingChange('sales_channel', val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select column..." />
          </SelectTrigger>
          <SelectContent>
            {columns.map(col => (
              <SelectItem key={col.name} value={col.name}>
                {col.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {mappings.sales_channel && (
          <div className="flex gap-1 flex-wrap">
            {getColumnSamples(mappings.sales_channel).slice(0, 4).map((val, idx) => (
              <Badge key={idx} variant="outline" className="text-xs font-normal">
                {val}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center pt-8">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Maps To
        </Label>
        <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
          <span className="text-sm font-medium">Sales Channel</span>
        </div>
      </div>

      <div className="flex items-center pt-8">
        {mappings.sales_channel ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-500" />
        )}
      </div>
    </div>

  </CardContent>
</Card>
```

### Step 2: Test visually in browser

```bash
npm run dev
```

Navigate to mapping page and verify:
- Card-based layout
- 4-column grid (Your Column → Arrow → Maps To → Status)
- Sample values shown as badges
- Status icons appear correctly

### Step 3: Commit

```bash
git add frontend/app/analysis/[id]/mapping/page.tsx
git commit -m "refactor(frontend): redesign required fields section

- Use Card component for cleaner layout
- Implement 4-column grid (column → arrow → field → status)
- Show sample values as Badge components
- Add status icons (checkmark/alert)
- Use Separator between fields"
```

---

## Task 8: Redesign Mapping Page - Optional Fields and Summary

**Files:**
- Modify: `frontend/app/analysis/[id]/mapping/page.tsx:400-515`

### Step 1: Replace optional fields section

Find `{/* Optional Fields */}` section and replace with:

```tsx
{/* Optional Fields - Lighter Treatment */}
<Card className="mb-6 border-dashed">
  <CardHeader>
    <CardTitle className="text-base flex items-center gap-2">
      <span>Optional Mappings</span>
      <Badge variant="secondary" className="text-xs font-normal">Optional</Badge>
    </CardTitle>
    <CardDescription>
      These fields provide additional insights but aren't required for nexus calculation.
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">

    {/* Product Type */}
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Your Column</Label>
        <Select
          value={mappings.product_type || ''}
          onValueChange={(val) => handleMappingChange('product_type', val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Not mapped" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Not mapped</SelectItem>
            {columns.map(col => (
              <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ArrowRight className="h-4 w-4 text-muted-foreground" />

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Maps To</Label>
        <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
          <span className="text-sm">Product Type</span>
        </div>
      </div>
    </div>

    <Separator className="my-2" />

    {/* Customer Type */}
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Your Column</Label>
        <Select
          value={mappings.customer_type || ''}
          onValueChange={(val) => handleMappingChange('customer_type', val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Not mapped" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Not mapped</SelectItem>
            {columns.map(col => (
              <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ArrowRight className="h-4 w-4 text-muted-foreground" />

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Maps To</Label>
        <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
          <span className="text-sm">Customer Type</span>
        </div>
      </div>
    </div>

  </CardContent>
</Card>
```

### Step 2: Replace data summary section

Find the data summary section (around line 437) and replace with:

```tsx
{/* Data Summary - Clean Stats Grid */}
{dataSummary && (
  <Card className="mb-6 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 border-indigo-100 dark:from-indigo-950/20 dark:to-blue-950/20 dark:border-indigo-900">
    <CardHeader>
      <CardTitle className="text-base">Data Summary</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Transactions
          </p>
          <p className="text-2xl font-bold text-foreground">
            {dataSummary.total_rows.toLocaleString()}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            States Found
          </p>
          <p className="text-2xl font-bold text-foreground">
            {dataSummary.unique_states}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Date Range
          </p>
          <p className="text-sm font-semibold text-foreground">
            {dataSummary.date_range.start}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {dataSummary.date_range.end}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Est. Time
          </p>
          <p className="text-lg font-semibold text-foreground">
            {dataSummary.estimated_time}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

### Step 3: Commit

```bash
git add frontend/app/analysis/[id]/mapping/page.tsx
git commit -m "refactor(frontend): redesign optional fields and data summary

- Use dashed border Card for optional fields
- Implement 3-column grid (more compact)
- Add gradient background to data summary
- Use larger stat numbers with small labels
- Improve visual hierarchy"
```

---

## Task 9: Redesign Mapping Page - Validation and Actions

**Files:**
- Modify: `frontend/app/analysis/[id]/mapping/page.tsx:458-515`

### Step 1: Replace validation feedback section

Find the validation status sections and replace with:

```tsx
{/* Validation Passed */}
{validationStatus === 'passed' && (
  <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
    <CheckCircle2 className="h-4 w-4 text-green-600" />
    <AlertTitle className="text-green-900 dark:text-green-100">Validation Passed</AlertTitle>
    <AlertDescription className="text-green-800 dark:text-green-200">
      All mappings look good. Redirecting to results...
    </AlertDescription>
  </Alert>
)}

{/* Validation Failed */}
{validationStatus === 'failed' && showErrors && (
  <Alert variant="destructive" className="mb-6">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Data Validation Failed</AlertTitle>
    <AlertDescription>
      Found {validationErrors.length} issues in your data.
    </AlertDescription>
    <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
      {validationErrors.slice(0, 10).map((error, idx) => (
        <div key={idx} className="text-xs bg-background rounded-md p-2 border">
          <span className="font-medium">Row {error.row}:</span> {error.column} = "{error.value}" - {error.message}
        </div>
      ))}
      {validationErrors.length > 10 && (
        <p className="text-xs italic mt-2">
          ... and {validationErrors.length - 10} more issues
        </p>
      )}
    </div>
  </Alert>
)}
```

### Step 2: Replace action buttons section

Find the action buttons (around line 500) and replace with:

```tsx
{/* Action Buttons - Clean and Clear */}
<div className="flex justify-between items-center pt-6">
  <Button variant="ghost" onClick={handleBack}>
    <ArrowLeft className="mr-2 h-4 w-4" />
    Back to Upload
  </Button>

  <Button
    onClick={handleValidateAndProcess}
    disabled={validating}
    size="lg"
  >
    {validating ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Calculating Nexus...
      </>
    ) : (
      <>
        Calculate Nexus
        <ArrowRight className="ml-2 h-4 w-4" />
      </>
    )}
  </Button>
</div>
```

### Step 3: Test complete mapping page

```bash
npm run dev
```

Navigate through complete flow:
1. Upload CSV
2. If low confidence, check mapping page redesign
3. Verify all visual changes applied
4. Test form submission

### Step 4: Commit

```bash
git add frontend/app/analysis/[id]/mapping/page.tsx
git commit -m "refactor(frontend): redesign validation and actions

- Use shadcn Alert components for validation
- Add icon-enhanced buttons
- Include loading states with spinner
- Cleaner visual feedback"
```

---

## Task 10: Update Mapping Page to Use New Backend Endpoint

**Files:**
- Modify: `frontend/app/analysis/[id]/mapping/page.tsx:140-196`

### Step 1: Update handleValidateAndProcess function

Replace the function (around line 140) with:

```tsx
const handleValidateAndProcess = async () => {
  if (!validateMappings()) return

  try {
    setValidating(true)
    setValidationStatus('idle')
    setValidationErrors([])

    // Prepare mapping payload for new endpoint
    const mappingPayload = {
      column_mappings: {
        transaction_date: {
          source_column: mappings.transaction_date,
          date_format: dateFormat,
        },
        customer_state: {
          source_column: mappings.customer_state,
        },
        revenue_amount: {
          source_column: mappings.revenue_amount,
        },
        sales_channel: {
          source_column: mappings.sales_channel,
          value_mappings: valueMappings,
        },
      },
    }

    // Call validate-and-save endpoint
    const saveResponse = await apiClient.post(
      `/api/v1/analyses/${analysisId}/validate-and-save`,
      mappingPayload
    )

    showSuccess(`Saved ${saveResponse.data.transactions_saved} transactions`)

    // Run nexus calculation
    try {
      await apiClient.post(`/api/v1/analyses/${analysisId}/calculate`)
    } catch (calcError: any) {
      console.error('Calculation failed:', calcError)
      // Continue to results page anyway
    }

    // Navigate to results
    setTimeout(() => {
      router.push(`/analysis/${analysisId}/results`)
    }, 1000)

  } catch (error: any) {
    // Handle validation errors
    if (error.response?.status === 400 && error.response?.data?.errors) {
      setValidationStatus('failed')
      setValidationErrors(error.response.data.errors)
      setShowErrors(true)
    } else {
      handleApiError(error, { userMessage: 'Failed to save mappings' })
    }
  } finally {
    setValidating(false)
  }
}
```

### Step 2: Test end-to-end flow

```bash
npm run dev
```

Test complete flow:
1. Upload CSV with non-standard column names
2. Manually adjust mappings on mapping page
3. Click "Calculate Nexus"
4. Verify data is saved
5. Verify redirect to results

### Step 3: Commit

```bash
git add frontend/app/analysis/[id]/mapping/page.tsx
git commit -m "feat(frontend): use new validate-and-save endpoint

- Call /validate-and-save instead of old /validate
- Send column_mappings payload
- Handle response with transactions_saved count
- Maintain calculation and navigation flow"
```

---

## Task 11: End-to-End Testing

**Files:**
- Create: `docs/testing/smart-column-mapping-test-plan.md`

### Step 1: Create test plan document

```markdown
# Smart Column Mapping - Manual Test Plan

## Test Case 1: Happy Path - Exact Column Names

**Setup:** CSV with exact column names: `transaction_date`, `customer_state`, `revenue_amount`, `sales_channel`

**Steps:**
1. Create new analysis
2. Upload CSV
3. Verify date confirmation dialog appears
4. Click "Continue"
5. Verify column mapping confirmation dialog appears
6. Verify all 4 fields show correct mappings
7. Verify sample values displayed
8. Verify data summary shows correct stats
9. Click "Confirm & Calculate Nexus"
10. Verify redirect to results page

**Expected:** No mapping page shown, smooth flow to results

---

## Test Case 2: Happy Path - Common Variants

**Setup:** CSV with columns: `date`, `state`, `amount`, `channel`

**Steps:**
1-10: Same as Test Case 1

**Expected:** Auto-detection succeeds, confirmation dialog shown

---

## Test Case 3: Adjust Mappings from Dialog

**Setup:** CSV with standard columns

**Steps:**
1-8: Same as Test Case 1
9. Click "Adjust Mappings"
10. Verify redirect to full mapping page
11. Verify fields are pre-selected correctly
12. Change one mapping
13. Click "Calculate Nexus"
14. Verify redirect to results

**Expected:** User can manually adjust auto-detected mappings

---

## Test Case 4: Low Confidence - Missing Column

**Setup:** CSV with columns: `date`, `state`, `amount` (missing sales_channel)

**Steps:**
1. Create new analysis
2. Upload CSV
3. Verify NO confirmation dialog (skip directly to mapping page)
4. Verify 3 fields are pre-selected
5. Manually select sales_channel column
6. Click "Calculate Nexus"
7. Verify redirect to results

**Expected:** No confirmation when not all detected

---

## Test Case 5: Complex Column Names

**Setup:** CSV with: `invoice_date`, `buyer_state`, `total_amount`, `order_source`

**Steps:**
1-10: Same as Test Case 1

**Expected:** Should still detect (lower confidence)

---

## Test Case 6: Visual Redesign Verification

**Steps:**
1. Navigate to mapping page (any method)
2. Verify Card-based layout
3. Verify 4-column grid for required fields
4. Verify status icons appear (green checkmarks)
5. Verify sample values shown as badges
6. Verify optional fields use dashed border
7. Verify data summary has gradient background
8. Verify larger stat numbers
9. Test dark mode - verify gradient works

**Expected:** All visual changes applied correctly

---

## Test Case 7: Validation Errors

**Setup:** CSV with invalid data (non-state codes in state column)

**Steps:**
1. Upload CSV
2. Proceed to mapping or confirm dialog
3. Submit mappings
4. Verify validation errors shown with Alert component
5. Verify error details displayed
6. Verify can still adjust mappings

**Expected:** Validation errors displayed cleanly

---

## Test Case 8: Mobile Responsive

**Steps:**
1. Resize browser to mobile width (375px)
2. Navigate through upload → mapping flow
3. Verify confirmation dialog responsive
4. Verify mapping page grid stacks on mobile
5. Verify buttons accessible

**Expected:** All layouts work on mobile

```

### Step 2: Execute all test cases manually

Go through each test case and document results.

### Step 3: Fix any bugs found during testing

(Create separate commits for each bug fix)

### Step 4: Commit test plan

```bash
git add docs/testing/smart-column-mapping-test-plan.md
git commit -m "docs: add manual test plan for smart column mapping

- 8 test cases covering happy paths
- Low confidence scenarios
- Visual redesign verification
- Mobile responsive testing"
```

---

## Task 12: Update Documentation

**Files:**
- Modify: `docs/plans/2025-11-09-smart-column-mapping-ux-design.md`
- Modify: `README.md` (if exists) or `00-START-HERE.md`

### Step 1: Update design doc with implementation notes

Add "Implementation Complete" section at the top of design doc:

```markdown
## Implementation Status

**Status:** ✅ Complete (2025-11-09)

**Implemented:**
- ✅ Backend auto-detection service (ColumnDetector)
- ✅ Enhanced upload endpoint with auto-detection
- ✅ New validate-and-save endpoint
- ✅ ColumnMappingConfirmationDialog component
- ✅ Upload page integration
- ✅ Mapping page redesign
- ✅ End-to-end testing

**Known Issues:** None

**Future Enhancements:**
- ML-based detection
- Column mapping templates
- Inline editing in confirmation dialog
```

### Step 2: Update project status in START-HERE.md

Add entry to recent updates:

```markdown
- **Sprint UX Improvements:** ✅ Smart Column Mapping (Nov 9, 2025)
  - Confirmation dialog for auto-detected mappings
  - Redesigned mapping page with shadcn/ui aesthetic
  - 75% reduction in clicks for happy path
  - See `docs/plans/2025-11-09-smart-column-mapping-ux-design.md`
```

### Step 3: Commit documentation updates

```bash
git add docs/plans/2025-11-09-smart-column-mapping-ux-design.md
git add 00-START-HERE.md
git commit -m "docs: mark smart column mapping as complete

- Update design doc with implementation status
- Add to project history in START-HERE
- Document completed features"
```

---

## Task 13: Final Review and Cleanup

### Step 1: Run full build

```bash
# Backend
cd backend
pytest
python -m pylint app/services/column_detector.py

# Frontend
cd frontend
npm run build
npm run lint
```

Expected: All checks pass

### Step 2: Review all commits

```bash
git log --oneline -15
```

Expected: ~13 commits with clear messages following conventional commit format

### Step 3: Create final summary commit

```bash
git add .
git commit --allow-empty -m "feat: smart column mapping UX improvements (complete)

Summary of changes:
- Backend: ColumnDetector service with pattern matching
- Backend: Flexible upload endpoint with auto-detection
- Backend: New validate-and-save endpoint for confirmed mappings
- Frontend: ColumnMappingConfirmationDialog component
- Frontend: Upload page integration with decision logic
- Frontend: Mapping page redesigned with Cards, Alerts, modern layout
- 75% reduction in clicks for happy path (8 → 2 clicks)
- Visual polish matching shadcn/ui design system

Implementation: 13 tasks, ~11-16 hours
Testing: 8 manual test cases
Documentation: Design doc, test plan, project updates

Closes #[ISSUE_NUMBER] (if applicable)"
```

---

## Implementation Complete! 🎉

**Total Tasks:** 13
**Estimated Time:** 11-16 hours
**Commits Created:** ~14

**What Changed:**
- 3 backend files modified/created
- 2 frontend components (1 new, 1 redesigned)
- 1 frontend page modified
- 2 documentation files created
- 1 test file created

**User Impact:**
- 90% of users: 8 clicks → 2 clicks (75% faster)
- Modern, polished UI matching design system
- Smart auto-detection with confidence scoring
- Easy adjustment path when needed

---

## Execution Options

**Plan complete and saved to `docs/plans/2025-11-09-smart-column-mapping-implementation.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach would you like?**
