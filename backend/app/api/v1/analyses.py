"""Analysis endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import Optional
from collections import defaultdict
from app.core.auth import require_auth
from app.core.supabase import get_supabase
from app.schemas.analysis import AnalysisCreate
from app.services.nexus_calculator_v2 import NexusCalculatorV2
from app.services.column_detector import ColumnDetector
import logging
import uuid
from datetime import datetime
import pandas as pd
import io

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("")
async def list_analyses(
    user_id: str = Depends(require_auth),
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    status_filter: Optional[str] = None
) -> dict:
    """
    List all analyses for the current user.

    Supports pagination, search, and filtering.

    Args:
        user_id: Current authenticated user ID
        limit: Max number of analyses to return (default: 50)
        offset: Number of analyses to skip (default: 0)
        search: Optional search term for client company name
        status_filter: Optional filter by status (draft, processing, complete, error)

    Returns:
        Paginated list of analyses with metadata
    """
    supabase = get_supabase()

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
        if status_filter:
            query = query.eq('status', status_filter)

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
        logger.error(f"Error listing analyses: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch analyses: {str(e)}"
        )


@router.get("/{analysis_id}")
async def get_analysis(
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Get analysis details by ID.
    """
    try:
        supabase = get_supabase()

        # Get analysis
        analysis_result = supabase.table('analyses').select('*').eq('id', analysis_id).eq('user_id', user_id).execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )

        analysis = analysis_result.data[0]

        # Get transaction stats if available
        transactions_result = supabase.table('sales_transactions') \
            .select('customer_state') \
            .eq('analysis_id', analysis_id) \
            .execute()

        total_transactions = len(transactions_result.data) if transactions_result.data else 0
        unique_states = len(set(t['customer_state'] for t in transactions_result.data)) if transactions_result.data else 0

        # Add computed fields
        analysis['total_transactions'] = total_transactions
        analysis['unique_states'] = unique_states

        return analysis

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analysis: {str(e)}"
        )


@router.post("", response_model=dict)
async def create_analysis(
    analysis_data: AnalysisCreate,
    user_id: str = Depends(require_auth)
):
    """
    Create a new analysis project.

    Request body should contain:
    - company_name: Company name (1-200 characters)
    - period_start: Analysis start date
    - period_end: Analysis end date (must be after start date)
    - business_type: Type of business (product_sales, digital_products, or mixed)
    - known_registrations: List of known state registrations (optional)
    - notes: Internal notes (optional)
    """
    supabase = get_supabase()

    try:
        # Ensure user exists in users table (Supabase auth creates users in auth.users only)
        # We need a corresponding record in our users table for foreign key constraint
        try:
            existing_user = supabase.table('users').select('id').eq('id', user_id).execute()

            if not existing_user.data:
                # Create minimal user record (email can be updated later via profile)
                supabase.table('users').upsert({
                    "id": user_id,
                    "email": f"{user_id}@temp.com",  # Placeholder, will be updated
                    "created_at": datetime.utcnow().isoformat()
                }, on_conflict="id").execute()
                logger.info(f"Created user record for {user_id}")
        except Exception as user_err:
            logger.warning(f"Could not create/check user record: {user_err}")

        # Generate unique analysis ID
        analysis_id = str(uuid.uuid4())

        # Prepare analysis data for database (matching actual schema)
        analysis_record = {
            "id": analysis_id,
            "user_id": user_id,
            "client_company_name": analysis_data.company_name,
            # Use .isoformat() only if date exists, otherwise None (will be auto-detected from CSV)
            "analysis_period_start": analysis_data.period_start.isoformat() if analysis_data.period_start else None,
            "analysis_period_end": analysis_data.period_end.isoformat() if analysis_data.period_end else None,
            "business_type": analysis_data.business_type.value,
            "retention_policy": analysis_data.retention_period.value,
            "status": "draft",  # Initial status
        }

        # Insert analysis into database
        result = supabase.table('analyses').insert(analysis_record).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create analysis"
            )

        # TODO: Insert known registrations when physical_nexus table schema is finalized
        # For now, we'll skip saving known registrations

        logger.info(f"Created analysis {analysis_id} for user {user_id}")

        return {
            "id": analysis_id,
            "status": "setup",
            "message": "Analysis created successfully"
        }

    except ValueError as e:
        logger.error(f"Validation error creating analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create analysis: {str(e)}"
        )


@router.patch("/{analysis_id}")
async def update_analysis(analysis_id: str, user_id: str = Depends(require_auth)):
    """Update analysis metadata"""
    # TODO: Implement
    return {"message": "Update analysis endpoint - to be implemented"}


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
    supabase = get_supabase()

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


@router.post("/{analysis_id}/upload")
async def upload_transactions(
    analysis_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(require_auth)
):
    """
    Upload and process transaction data CSV file.

    Accepts CSV, XLS, or XLSX files up to 50MB.
    Parses the data and stores transactions in the database.
    """
    supabase = get_supabase()

    try:
        # Verify analysis exists and belongs to user
        analysis_result = supabase.table('analyses').select('*').eq('id', analysis_id).eq('user_id', user_id).execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found or access denied"
            )

        # Validate file type
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No filename provided"
            )

        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['csv', 'xlsx', 'xls']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: .{file_extension}. Only CSV, XLS, and XLSX files are accepted."
            )

        # Read file content
        content = await file.read()

        # Validate file size (50MB max)
        max_size = 50 * 1024 * 1024  # 50MB in bytes
        if len(content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large ({len(content) / 1024 / 1024:.1f} MB). Maximum size is 50 MB."
            )

        # Parse file based on type
        try:
            if file_extension == 'csv':
                df = pd.read_csv(io.BytesIO(content))
            else:  # xlsx or xls
                df = pd.read_excel(io.BytesIO(content))
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse file: {str(e)}"
            )

        # Auto-detect column mappings (including optional columns like revenue_stream, is_taxable, exempt_amount)
        column_detector = ColumnDetector(list(df.columns))
        detection_result = column_detector.detect_mappings()
        sample_values = column_detector.get_sample_values(df, max_samples=5)

        # Separate required and optional columns
        required_columns = ['transaction_date', 'customer_state', 'revenue_amount', 'sales_channel']
        optional_columns = ['revenue_stream', 'is_taxable', 'exempt_amount']

        detected_required = {k: v for k, v in detection_result['mappings'].items() if k in required_columns}
        detected_optional = {k: v for k, v in detection_result['mappings'].items() if k in optional_columns}

        # Clean and prepare data (only if we have required mappings)
        if detected_required:
            detected_cols = list(detected_required.values())
            df = df.dropna(subset=detected_cols)  # Remove rows with missing required data

        # AUTO-DETECT DATE RANGE (only if we detected a date column)
        detected_start = None
        detected_end = None
        auto_populated = False

        if detection_result['mappings'].get('transaction_date'):
            date_col = detection_result['mappings']['transaction_date']
            try:
                # Parse dates to datetime for min/max detection
                date_series = pd.to_datetime(df[date_col], errors='coerce')

                # Filter out any NaT (Not a Time) values
                valid_dates = date_series.dropna()

                if len(valid_dates) > 0:
                    detected_start = valid_dates.min().strftime('%Y-%m-%d')
                    detected_end = valid_dates.max().strftime('%Y-%m-%d')

                    # Check if analysis already has dates set
                    # If not, auto-populate with detected dates
                    if not analysis_result.data[0].get('analysis_period_start'):
                        logger.info(f"Auto-detected date range for analysis {analysis_id}: {detected_start} to {detected_end}")

                        # Update analysis with detected date range
                        update_result = supabase.table('analyses')\
                            .update({
                                'analysis_period_start': detected_start,
                                'analysis_period_end': detected_end
                            })\
                            .eq('id', analysis_id)\
                            .eq('user_id', user_id)\
                            .execute()

                        if update_result.data:
                            auto_populated = True
                            logger.info(f"Successfully auto-populated dates for analysis {analysis_id}")
                        else:
                            logger.warning(f"Failed to update analysis {analysis_id} with detected dates")
                    else:
                        # Dates were manually set - log that we're keeping them
                        logger.info(f"Analysis {analysis_id} already has dates set, keeping manual dates")

            except Exception as e:
                logger.error(f"Error detecting date range: {str(e)}")
                # Don't fail the upload if date detection fails
                detected_start = None
                detected_end = None

        # Store raw CSV content in Supabase Storage for later processing
        # We'll process and insert transactions after user confirms mappings
        storage_path = f"uploads/{user_id}/{analysis_id}/raw_data.csv"

        try:
            # Try to remove existing file first (in case of re-upload)
            try:
                supabase.storage.from_('analysis-uploads').remove([storage_path])
                logger.info(f"Removed existing file at {storage_path}")
            except:
                pass  # File doesn't exist, that's fine

            # Upload new file
            upload_result = supabase.storage.from_('analysis-uploads').upload(
                storage_path,
                content,
                file_options={"content-type": file.content_type or "text/csv"}
            )
            logger.info(f"Stored raw CSV for analysis {analysis_id} at {storage_path}: {upload_result}")
        except Exception as e:
            logger.error(f"Failed to store file in storage: {str(e)}")
            # This is now a critical error - we need the file in storage for the new workflow
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to store file in storage. Please ensure the 'analysis-uploads' bucket exists and is accessible: {str(e)}"
            )

        # Calculate data summary from raw DataFrame (only if all required detected)
        summary = None
        if detection_result['all_required_detected']:
            date_col = detection_result['mappings']['transaction_date']
            state_col = detection_result['mappings']['customer_state']

            # Parse dates
            date_series = pd.to_datetime(df[date_col], errors='coerce')
            valid_dates = date_series.dropna()

            if len(valid_dates) > 0:
                summary = {
                    "total_rows": len(df),
                    "unique_states": df[state_col].nunique(),
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
                "summary": summary,
                # Highlight which columns are required vs optional
                "required_detected": detected_required,
                "optional_detected": detected_optional
            },
            "all_required_detected": len(detected_required) == len(required_columns),
            "optional_columns_found": len(detected_optional),
            "columns_detected": list(df.columns),
            # Keep date detection for compatibility
            "date_range_detected": {
                "start": detected_start,
                "end": detected_end,
                "auto_populated": auto_populated
            } if detected_start else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file for analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process file: {str(e)}"
        )


@router.post("/{analysis_id}/preview-normalization")
async def preview_normalization(
    analysis_id: str,
    request_body: dict,
    user_id: str = Depends(require_auth)
):
    """
    Preview normalization transformations before saving.

    Shows users what the data will look like after normalization,
    including validation errors/warnings and transformation list.

    Body:
        {
            "column_mappings": {
                "transaction_date": {"source_column": "date"},
                "customer_state": {"source_column": "state"},
                "revenue_amount": {"source_column": "amount"},
                "sales_channel": {"source_column": "channel"},
                "revenue_stream": {"source_column": "product_type"},  // optional
                "is_taxable": {"source_column": "taxable"},  // optional
                "exempt_amount": {"source_column": "exempt"}  // optional
            }
        }

    Returns:
        {
            "preview_data": [sample rows after normalization],
            "transformations": [list of transformations applied],
            "validation": {errors, warnings, valid_rows, etc.},
            "summary": {row counts, column counts, etc.}
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

        # Extract column_mappings from request body
        column_mappings = request_body.get('column_mappings', {})

        # Build simplified mapping dict for normalize_data method
        mappings = {}
        for field_name, config in column_mappings.items():
            source_col = config.get('source_column')
            if source_col:
                mappings[field_name] = source_col

        # Initialize column detector and apply normalization
        detector = ColumnDetector(list(df.columns))

        # Apply all normalizations
        normalization_result = detector.normalize_data(df, mappings)
        normalized_df = normalization_result['df']
        transformations = normalization_result['transformations']
        warnings_list = normalization_result['warnings']

        # Validate normalized data
        validation_result = detector.validate_normalized_data(normalized_df)

        # Get preview sample (first 10 rows)
        preview_rows = min(10, len(normalized_df))
        preview_data = normalized_df.head(preview_rows).to_dict('records')

        # Convert any datetime/Timestamp objects to strings for JSON
        for row in preview_data:
            for key, val in row.items():
                if pd.isna(val):
                    row[key] = None
                elif isinstance(val, (pd.Timestamp, datetime)):
                    row[key] = str(val)

        return {
            "preview_data": preview_data,
            "transformations": transformations,
            "validation": validation_result,
            "warnings": warnings_list,
            "summary": {
                "total_rows": len(df),
                "valid_rows": validation_result['valid_rows'],
                "invalid_rows": len(df) - validation_result['valid_rows'],
                "columns_mapped": len(mappings),
                "preview_rows_shown": preview_rows
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error previewing normalization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to preview normalization: {str(e)}"
        )


@router.post("/{analysis_id}/validate-and-save")
async def validate_and_save_mappings(
    analysis_id: str,
    request_body: dict,
    user_id: str = Depends(require_auth)
):
    """
    Validate column mappings and save transactions to database.

    This endpoint is called after user confirms mappings (either from confirmation dialog
    or from full mapping page).

    Body:
        {
            "column_mappings": {
                "transaction_date": {"source_column": "date", "date_format": "YYYY-MM-DD"},
                "customer_state": {"source_column": "state"},
                "revenue_amount": {"source_column": "amount"},
                "sales_channel": {"source_column": "channel", "value_mappings": {...}}
            }
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

        # Extract column_mappings from request body
        column_mappings = request_body.get('column_mappings', {})

        # Build simplified mapping dict for normalize_data method
        mappings = {}
        for field_name, config in column_mappings.items():
            source_col = config.get('source_column')
            if source_col:
                mappings[field_name] = source_col

        # Validate required mappings exist
        required_fields = ['transaction_date', 'customer_state', 'revenue_amount', 'sales_channel']
        for field in required_fields:
            if field not in mappings:
                raise HTTPException(
                    status_code=400,
                    detail=f"{field} mapping required"
                )

        # Initialize column detector and apply normalization
        detector = ColumnDetector(list(df.columns))

        # Apply all normalizations (dates, states, channels, revenue streams, exempt sales)
        normalization_result = detector.normalize_data(df, mappings)
        normalized_df = normalization_result['df']

        # Validate normalized data
        validation_result = detector.validate_normalized_data(normalized_df)

        # If validation has errors, return them to user
        if not validation_result['valid']:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Data validation failed",
                    "errors": validation_result['errors'],
                    "warnings": validation_result['warnings']
                }
            )

        # Clean data - remove rows with null required fields
        required_cols = ['transaction_date', 'customer_state', 'revenue_amount', 'sales_channel']
        normalized_df = normalized_df.dropna(subset=required_cols)

        if len(normalized_df) == 0:
            raise HTTPException(
                status_code=400,
                detail="No valid transactions after normalization and validation"
            )

        # Prepare transactions for insertion
        transactions = []
        for _, row in normalized_df.iterrows():
            transaction = {
                "analysis_id": analysis_id,
                "transaction_date": row['transaction_date'],
                "customer_state": str(row['customer_state']).strip().upper(),
                "sales_amount": float(row['revenue_amount']),
                "sales_channel": str(row['sales_channel']).strip().lower(),
                "transaction_count": 1,
                "tax_collected": None,
                # New columns for Days 6-8
                "revenue_stream": str(row['revenue_stream']) if 'revenue_stream' in row and pd.notna(row['revenue_stream']) else None,
                "is_taxable": bool(row['is_taxable']) if 'is_taxable' in row and pd.notna(row['is_taxable']) else True,
                "taxable_amount": float(row['taxable_amount']) if 'taxable_amount' in row and pd.notna(row['taxable_amount']) else float(row['revenue_amount']),
                "exempt_amount": float(row['exempt_amount_calc']) if 'exempt_amount_calc' in row and pd.notna(row['exempt_amount_calc']) else 0.0,
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


@router.get("/{analysis_id}/columns")
async def get_column_info(
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Get column information and sample data from uploaded transactions.
    Used for the data mapping screen.
    """
    try:
        supabase = get_supabase()

        # Verify analysis exists and belongs to user
        analysis_result = supabase.table('analyses').select('*').eq('id', analysis_id).eq('user_id', user_id).execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )

        # Try to get data from stored CSV file first (new workflow)
        storage_path = f"uploads/{user_id}/{analysis_id}/raw_data.csv"
        df = None

        try:
            # Try to download raw CSV from storage
            file_data = supabase.storage.from_('analysis-uploads').download(storage_path)
            df = pd.read_csv(io.BytesIO(file_data))
            logger.info(f"Loaded column info from stored CSV for analysis {analysis_id}")
        except Exception as e:
            logger.info(f"No stored CSV found, trying sales_transactions table: {str(e)}")
            # Fallback to old workflow - check sales_transactions table
            transactions_result = supabase.table('sales_transactions') \
                .select('*') \
                .eq('analysis_id', analysis_id) \
                .limit(100) \
                .execute()

            if not transactions_result.data or len(transactions_result.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No transaction data found. Please upload data first."
                )

            # Convert to DataFrame for analysis
            df = pd.DataFrame(transactions_result.data)

        # Analyze columns - use all columns from CSV
        total_rows = len(df)
        data_columns = list(df.columns)

        columns_info = []
        for col in data_columns:
            # Get sample values (non-null, unique)
            sample_values = df[col].dropna().unique()[:10].tolist()
            # Convert to strings
            sample_values = [str(val) for val in sample_values]

            # Infer data type
            dtype = 'string'
            if col == 'transaction_date':
                dtype = 'date'
            elif col in ['sales_amount']:
                dtype = 'number'

            columns_info.append({
                "name": col,
                "sample_values": sample_values,
                "data_type": dtype
            })

        # Create data summary from the DataFrame
        summary = {
            "total_rows": total_rows,
            "estimated_time": f"{max(30, min(120, total_rows // 100))}-{max(30, min(120, total_rows // 100)) + 15} seconds"
        }

        # Try to add date range and unique states if columns exist
        # Use auto-detection to find the right columns
        detector = ColumnDetector(list(df.columns))
        detected = detector.detect_mappings()

        if detected.get('mappings'):
            if 'transaction_date' in detected['mappings']:
                date_col = detected['mappings']['transaction_date']
                try:
                    date_series = pd.to_datetime(df[date_col], errors='coerce').dropna()
                    if len(date_series) > 0:
                        summary["date_range"] = {
                            "start": date_series.min().strftime('%Y-%m-%d'),
                            "end": date_series.max().strftime('%Y-%m-%d')
                        }
                except:
                    pass

            if 'customer_state' in detected['mappings']:
                state_col = detected['mappings']['customer_state']
                try:
                    summary["unique_states"] = df[state_col].nunique()
                except:
                    pass

        return {
            "columns": columns_info,
            "summary": summary
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting column info for analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get column information: {str(e)}"
        )


@router.post("/{analysis_id}/validate")
async def validate_data(
    analysis_id: str,
    request: dict,
    user_id: str = Depends(require_auth)
):
    """
    Validate transaction data with column mappings.
    Checks for data quality issues before processing.
    """
    try:
        supabase = get_supabase()

        # Verify analysis exists and belongs to user
        analysis_result = supabase.table('analyses').select('*').eq('id', analysis_id).eq('user_id', user_id).execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )

        # Get all transactions
        transactions_result = supabase.table('sales_transactions') \
            .select('*') \
            .eq('analysis_id', analysis_id) \
            .execute()

        if not transactions_result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No transaction data found"
            )

        df = pd.DataFrame(transactions_result.data)
        column_mappings = request.get('column_mappings', {})

        # Validation errors
        errors = []
        warnings = []
        valid_rows = 0
        invalid_rows = 0

        # Valid state codes (50 states + DC + territories)
        valid_states = {
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
            'DC', 'PR', 'VI', 'GU', 'AS', 'MP'
        }

        # Valid sales channels
        valid_channels = {'marketplace', 'direct', 'other'}

        # Validate each row
        for idx, row in df.iterrows():
            row_number = idx + 1  # 1-indexed for user display
            row_errors = []

            # Validate transaction_date
            try:
                date_val = pd.to_datetime(row['transaction_date'])
                if date_val > pd.Timestamp.now():
                    row_errors.append({
                        "row": row_number,
                        "column": "transaction_date",
                        "value": str(row['transaction_date']),
                        "message": "Future date detected",
                        "severity": "warning"
                    })
            except Exception:
                row_errors.append({
                    "row": row_number,
                    "column": "transaction_date",
                    "value": str(row['transaction_date']),
                    "message": "Invalid date format",
                    "severity": "error"
                })

            # Validate customer_state
            state_code = str(row['customer_state']).strip().upper()
            if state_code not in valid_states:
                row_errors.append({
                    "row": row_number,
                    "column": "customer_state",
                    "value": state_code,
                    "message": f"Invalid state code. Must be one of: {', '.join(sorted(list(valid_states)[:10]))}...",
                    "severity": "error"
                })

            # Validate sales_amount
            try:
                amount = float(row['sales_amount'])
                if amount < 0:
                    row_errors.append({
                        "row": row_number,
                        "column": "sales_amount",
                        "value": str(amount),
                        "message": "Negative amount detected",
                        "severity": "error"
                    })
                elif amount == 0:
                    row_errors.append({
                        "row": row_number,
                        "column": "sales_amount",
                        "value": str(amount),
                        "message": "Zero amount detected",
                        "severity": "warning"
                    })
            except Exception:
                row_errors.append({
                    "row": row_number,
                    "column": "sales_amount",
                    "value": str(row['sales_amount']),
                    "message": "Invalid numeric value",
                    "severity": "error"
                })

            # Validate sales_channel
            channel = str(row['sales_channel']).strip().lower()
            if channel not in valid_channels:
                # Check if it's a known marketplace name that can be mapped
                marketplace_names = ['amazon', 'ebay', 'etsy', 'walmart', 'shopify']
                if channel in marketplace_names:
                    warnings.append({
                        "row": row_number,
                        "column": "sales_channel",
                        "value": channel,
                        "message": f"Will be mapped to 'marketplace'",
                        "severity": "info"
                    })
                else:
                    row_errors.append({
                        "row": row_number,
                        "column": "sales_channel",
                        "value": channel,
                        "message": f"Invalid sales channel. Must be one of: {', '.join(valid_channels)}",
                        "severity": "warning"
                    })

            # Count valid/invalid rows
            error_count = len([e for e in row_errors if e['severity'] == 'error'])
            if error_count > 0:
                invalid_rows += 1
                errors.extend(row_errors)
            else:
                valid_rows += 1
                warnings.extend([e for e in row_errors if e['severity'] in ['warning', 'info']])

        # Determine validation status
        validation_status = "passed" if invalid_rows == 0 else "failed"
        ready_to_process = invalid_rows == 0

        # Update analysis status to 'processing' when validation passes
        # Valid statuses: 'draft', 'processing', 'complete', 'error'
        if ready_to_process:
            supabase.table('analyses').update({
                "status": "processing",
                "updated_at": datetime.utcnow().isoformat()
            }).eq('id', analysis_id).execute()

        return {
            "validation_id": analysis_id,  # Using analysis_id as validation_id for simplicity
            "status": validation_status,
            "valid_rows": valid_rows,
            "invalid_rows": invalid_rows,
            "errors": errors[:50],  # Limit to first 50 errors
            "warnings": warnings[:20],  # Limit to first 20 warnings
            "ready_to_process": ready_to_process
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating data for analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate data: {str(e)}"
        )


@router.post("/{analysis_id}/calculate")
async def calculate_nexus(
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Run nexus calculation engine for this analysis.

    Determines economic nexus status and calculates estimated tax liability
    for each state based on uploaded transaction data.
    """
    try:
        supabase = get_supabase()

        # Verify analysis exists and belongs to user
        analysis_result = supabase.table('analyses').select('*').eq('id', analysis_id).eq('user_id', user_id).execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )

        analysis = analysis_result.data[0]

        # Check if there are transactions to analyze
        transactions_result = supabase.table('sales_transactions') \
            .select('id') \
            .eq('analysis_id', analysis_id) \
            .limit(1) \
            .execute()

        if not transactions_result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No transaction data found. Please upload data first."
            )

        # Initialize calculator and run calculation
        calculator = NexusCalculatorV2(supabase)
        result = calculator.calculate_nexus_for_analysis(analysis_id)

        logger.info(f"Nexus calculation completed for analysis {analysis_id}")

        return {
            "message": "Nexus calculation completed successfully",
            "analysis_id": analysis_id,
            "summary": result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating nexus for analysis {analysis_id}: {str(e)}")

        # Update analysis status to error
        try:
            supabase.table('analyses').update({
                "status": "error",
                "error_message": str(e),
                "last_error_at": datetime.utcnow().isoformat()
            }).eq('id', analysis_id).execute()
        except:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate nexus: {str(e)}"
        )


@router.post("/{analysis_id}/recalculate")
async def recalculate_analysis(
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Recalculate analysis results after configuration changes.

    This endpoint re-runs the nexus calculator with the current data and
    configuration (including physical nexus settings). Use this endpoint
    after:
    - Adding/updating/deleting physical nexus configurations
    - Changing VDA settings
    - Modifying any other analysis parameters

    ENHANCEMENT: Enables real-time result updates without page refresh
    when physical nexus or other configurations change.

    Returns:
        Summary of recalculation with states updated count
    """
    try:
        supabase = get_supabase()

        # Verify analysis exists and belongs to user
        analysis_result = supabase.table('analyses').select('*').eq('id', analysis_id).eq('user_id', user_id).execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )

        analysis = analysis_result.data[0]

        # Check if there are transactions to analyze
        transactions_result = supabase.table('sales_transactions') \
            .select('id') \
            .eq('analysis_id', analysis_id) \
            .limit(1) \
            .execute()

        if not transactions_result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No transaction data found. Cannot recalculate without data."
            )

        # Initialize calculator and run recalculation
        # Note: This uses the same calculation logic as initial calculation
        # but the calculator will pick up any updated physical nexus configs
        calculator = NexusCalculatorV2(supabase)
        result = calculator.calculate_nexus_for_analysis(analysis_id)

        logger.info(f"Analysis recalculated for {analysis_id} (triggered after config change)")

        return {
            "message": "Analysis recalculated successfully",
            "analysis_id": analysis_id,
            "states_updated": result.get('states_calculated', 0) if isinstance(result, dict) else 0,
            "timestamp": datetime.utcnow().isoformat(),
            "summary": result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recalculating analysis {analysis_id}: {str(e)}")

        # Update analysis status to error
        try:
            supabase.table('analyses').update({
                "status": "error",
                "error_message": str(e),
                "last_error_at": datetime.utcnow().isoformat()
            }).eq('id', analysis_id).execute()
        except:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to recalculate analysis: {str(e)}"
        )


@router.get("/{analysis_id}/results/summary")
async def get_results_summary(
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Get results summary for dashboard display.

    Returns high-level summary with states with nexus, total liability,
    top states, and approaching threshold information.
    """
    try:
        supabase = get_supabase()

        # Verify analysis exists and belongs to user
        analysis_result = supabase.table('analyses').select('*').eq('id', analysis_id).eq('user_id', user_id).execute()

        if not analysis_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )

        analysis = analysis_result.data[0]

        # Get state results
        results_query = supabase.table('state_results') \
            .select('*') \
            .eq('analysis_id', analysis_id) \
            .execute()

        if not results_query.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No results found. Please run calculation first."
            )

        state_results = results_query.data

        # Get state names for formatting
        states_query = supabase.table('states').select('code,name').execute()
        state_names = {s['code']: s['name'] for s in states_query.data}

        # Group by state (V2 supports multi-year)
        states_grouped = defaultdict(list)
        for result in state_results:
            states_grouped[result['state']].append(result)

        # Calculate summary statistics by aggregating across states
        total_states_analyzed = len(states_grouped)
        total_liability = 0
        total_revenue = 0
        states_with_nexus_set = set()
        states_no_nexus_set = set()
        physical_nexus_set = set()
        economic_nexus_set = set()
        both_nexus_set = set()

        # Aggregate per state
        state_aggregates = []
        for state_code, year_results in states_grouped.items():
            # Sum across all years for this state
            state_total_sales = sum(float(r.get('total_sales', 0)) for r in year_results)
            state_total_liability = sum(float(r.get('estimated_liability', 0)) for r in year_results)

            total_revenue += state_total_sales
            total_liability += state_total_liability

            # Check if state has nexus in ANY year
            has_nexus_any_year = any(r.get('nexus_type') in ['economic', 'physical', 'both'] for r in year_results)

            if has_nexus_any_year:
                states_with_nexus_set.add(state_code)

                # Determine primary nexus type (use latest year)
                latest_year_result = sorted(year_results, key=lambda x: x.get('year', 0))[-1]
                nexus_type = latest_year_result.get('nexus_type', 'none')

                if nexus_type == 'physical':
                    physical_nexus_set.add(state_code)
                elif nexus_type == 'economic':
                    economic_nexus_set.add(state_code)
                elif nexus_type == 'both':
                    both_nexus_set.add(state_code)
            else:
                states_no_nexus_set.add(state_code)

            # Store aggregate for top states calculation
            if state_total_liability > 0:
                state_aggregates.append({
                    'state': state_code,
                    'state_name': state_names.get(state_code, state_code),
                    'estimated_liability': state_total_liability,
                    'total_sales': state_total_sales,
                    'nexus_type': latest_year_result.get('nexus_type', 'none') if has_nexus_any_year else 'none'
                })

        # Get top states by liability (already aggregated)
        top_states_formatted = sorted(state_aggregates, key=lambda x: x['estimated_liability'], reverse=True)[:5]

        states_with_nexus = len(states_with_nexus_set)
        states_no_nexus = len(states_no_nexus_set)
        physical_count = len(physical_nexus_set)
        economic_only_count = len(economic_nexus_set)
        both_count = len(both_nexus_set)

        return {
            "analysis_id": analysis_id,
            "company_name": analysis['client_company_name'],
            "period_start": analysis['analysis_period_start'],
            "period_end": analysis['analysis_period_end'],
            "status": analysis['status'],
            "completed_at": analysis['updated_at'],
            "summary": {
                "total_states_analyzed": total_states_analyzed,
                "states_with_nexus": states_with_nexus,
                "states_approaching_threshold": 0,  # TODO: Calculate from state_results
                "states_no_nexus": states_no_nexus,
                "total_estimated_liability": total_liability,
                "total_revenue": total_revenue,
                "confidence_level": "high",
                "manual_review_required": 0
            },
            "nexus_breakdown": {
                "physical_nexus": physical_count,
                "economic_nexus": economic_only_count,
                "no_nexus": states_no_nexus,
                "both": both_count
            },
            "top_states_by_liability": top_states_formatted,
            "approaching_threshold": []  # TODO: Calculate states approaching threshold
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting results summary for analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get results summary: {str(e)}"
        )


@router.get("/{analysis_id}/results/states")
async def get_state_results(
    analysis_id: str,
    user_id: str = Depends(require_auth)
):
    """
    Get complete state-by-state results for table display.
    Returns all 50+ states including those with $0 sales.

    Used by Screen 5 (State Table) to show comprehensive list
    of all states with nexus determination, revenue, and liability.
    """
    supabase = get_supabase()

    try:
        # 1. Verify analysis exists and belongs to user
        analysis_response = supabase.table('analyses').select('*').eq(
            'id', analysis_id
        ).eq(
            'user_id', user_id
        ).execute()

        if not analysis_response.data:
            raise HTTPException(
                status_code=404,
                detail="Analysis not found or does not belong to current user"
            )

        # 2. Fetch all state results for this analysis
        state_results_response = supabase.table('state_results').select(
            '*'
        ).eq(
            'analysis_id', analysis_id
        ).execute()

        if not state_results_response.data:
            raise HTTPException(
                status_code=404,
                detail="No calculation results found. Please run calculation first."
            )

        # 3. Fetch state names from states table
        states_response = supabase.table('states').select(
            'code, name'
        ).execute()

        state_names = {
            s['code']: s['name']
            for s in states_response.data
        }

        # 4. Check which states are registered (from physical_nexus table)
        physical_nexus_response = supabase.table('physical_nexus').select(
            'state_code'
        ).eq(
            'analysis_id', analysis_id
        ).execute()

        registered_states = {
            pn['state_code']
            for pn in physical_nexus_response.data
        }

        # 5. Group results by state (V2 supports multi-year)
        states_grouped = defaultdict(list)

        for result in state_results_response.data:
            states_grouped[result['state']].append(result)

        # 6. Format response for each state with year_data
        formatted_states = []

        for state_code, year_results in states_grouped.items():
            # Sort by year
            year_results_sorted = sorted(year_results, key=lambda x: x.get('year', 0))

            # Aggregate totals across all years
            total_sales_all_years = sum(float(r.get('total_sales', 0)) for r in year_results)
            total_liability_all_years = sum(float(r.get('estimated_liability', 0)) for r in year_results)
            direct_sales_all_years = sum(float(r.get('direct_sales', 0)) for r in year_results)
            marketplace_sales_all_years = sum(float(r.get('marketplace_sales', 0)) for r in year_results)
            exempt_sales_all_years = sum(float(r.get('exempt_sales', 0)) for r in year_results)
            taxable_sales_all_years = sum(float(r.get('taxable_sales', 0)) for r in year_results)

            # Use the most recent year's data for threshold and nexus status
            latest_year_result = year_results_sorted[-1]

            threshold = latest_year_result.get('threshold', 0)
            if threshold > 0:
                threshold_percent = round((total_sales_all_years / threshold) * 100, 1)
            else:
                threshold_percent = 0

            # Determine overall nexus status (has nexus if ANY year has nexus)
            has_nexus_any_year = any(r.get('nexus_type') in ['physical', 'economic', 'both'] for r in year_results)
            approaching_any_year = any(r.get('approaching_threshold', False) for r in year_results)

            if has_nexus_any_year:
                nexus_status = 'has_nexus'
                nexus_type = latest_year_result.get('nexus_type', 'none')
            elif approaching_any_year:
                nexus_status = 'approaching'
                nexus_type = 'none'
            else:
                nexus_status = 'no_nexus'
                nexus_type = 'none'

            # Build year_data array with V2 fields
            year_data = []
            for yr in year_results_sorted:
                year_data.append({
                    'year': yr.get('year'),
                    'nexus_type': yr.get('nexus_type', 'none'),
                    'nexus_date': yr.get('nexus_date'),
                    'obligation_start_date': yr.get('obligation_start_date'),
                    'first_nexus_year': yr.get('first_nexus_year'),
                    'total_sales': float(yr.get('total_sales', 0)),
                    'exempt_sales': float(yr.get('exempt_sales', 0)),
                    'taxable_sales': float(yr.get('taxable_sales', 0)),
                    'exposure_sales': float(yr.get('exposure_sales', 0)),
                    'direct_sales': float(yr.get('direct_sales', 0)),
                    'marketplace_sales': float(yr.get('marketplace_sales', 0)),
                    'estimated_liability': float(yr.get('estimated_liability', 0)),
                    'base_tax': float(yr.get('base_tax', 0))
                })

            # Build state object with year_data
            formatted_states.append({
                'state_code': state_code,
                'state_name': state_names.get(state_code, state_code),
                'nexus_status': nexus_status,
                'nexus_type': nexus_type,
                'total_sales': total_sales_all_years,
                'exempt_sales': exempt_sales_all_years,
                'taxable_sales': taxable_sales_all_years,
                'direct_sales': direct_sales_all_years,
                'marketplace_sales': marketplace_sales_all_years,
                'threshold': float(threshold),
                'threshold_percent': threshold_percent,
                'estimated_liability': total_liability_all_years,
                'confidence_level': 'high',  # TODO: Implement confidence scoring
                'registration_status': (
                    'registered' if state_code in registered_states
                    else 'not_registered'
                ),
                'year_data': year_data  # New: per-year breakdown
            })

        return {
            'analysis_id': analysis_id,
            'total_states': len(formatted_states),
            'states': formatted_states
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch state results: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch state results: {str(e)}"
        )


@router.get("/{analysis_id}/states/{state_code}")
async def get_state_detail(
    analysis_id: str,
    state_code: str,
    user_id: str = Depends(require_auth)
):
    """
    Get detailed analysis for a specific state.

    Includes:
    - Transaction details
    - Year-by-year aggregates
    - Threshold status
    - Compliance information
    """
    supabase = get_supabase()

    try:
        # Verify analysis belongs to user
        analysis_result = supabase.table('analyses').select('*').eq(
            'id', analysis_id
        ).eq('user_id', user_id).execute()

        if not analysis_result.data:
            raise HTTPException(status_code=404, detail="Analysis not found")

        # Get state name and URLs
        state_result = supabase.table('states').select(
            'code, name, registration_url, state_tax_website'
        ).eq('code', state_code).execute()

        if not state_result.data:
            raise HTTPException(status_code=404, detail="Invalid state code")

        state_data = state_result.data[0]
        state_name = state_data['name']
        registration_url = state_data.get('registration_url')
        state_tax_website = state_data.get('state_tax_website')

        # Get V2 calculated results for this state
        state_results_query = supabase.table('state_results').select(
            '*'
        ).eq('analysis_id', analysis_id).eq(
            'state', state_code
        ).order('year').execute()

        # Get all transactions for transaction list display
        transactions_result = supabase.table('sales_transactions').select(
            'transaction_id, transaction_date, sales_amount, sales_channel, taxable_amount, exempt_amount, is_taxable'
        ).eq('analysis_id', analysis_id).eq(
            'customer_state', state_code
        ).order('transaction_date').execute()

        transactions = transactions_result.data
        state_year_results = state_results_query.data

        if not state_year_results:
            # State has no transactions - still need to return compliance info
            # Get threshold information
            threshold_result = supabase.table('economic_nexus_thresholds').select(
                'revenue_threshold, transaction_threshold, threshold_operator'
            ).eq('state', state_code).is_('effective_to', 'null').execute()

            threshold_info = None
            if threshold_result.data:
                threshold_info = threshold_result.data[0]

            # Get tax rates
            tax_rate_result = supabase.table('tax_rates').select(
                'state_rate, avg_local_rate, combined_avg_rate'
            ).eq('state', state_code).execute()

            compliance_info = {
                'tax_rates': {
                    'state_rate': 0,
                    'avg_local_rate': 0,
                    'combined_rate': 0
                },
                'threshold_info': {},
                'registration_info': {
                    'registration_fee': 0,
                    'filing_frequencies': ['Monthly', 'Quarterly', 'Annual'],
                    'registration_url': registration_url,
                    'dor_website': state_tax_website
                }
            }

            if tax_rate_result.data:
                # Rates are stored as decimals (0.0825 for 8.25%)
                # Convert to percentages for display by multiplying by 100
                state_rate = float(tax_rate_result.data[0]['state_rate']) * 100
                avg_local_rate = float(tax_rate_result.data[0].get('avg_local_rate', 0)) * 100
                combined_rate = float(tax_rate_result.data[0].get('combined_avg_rate', 0)) * 100

                compliance_info['tax_rates'] = {
                    'state_rate': round(state_rate, 2),
                    'avg_local_rate': round(avg_local_rate, 2),
                    'combined_rate': round(combined_rate, 2)
                }

            if threshold_info:
                compliance_info['threshold_info'] = {
                    'revenue_threshold': threshold_info.get('revenue_threshold'),
                    'transaction_threshold': threshold_info.get('transaction_threshold'),
                    'threshold_operator': threshold_info.get('threshold_operator')
                }

            return {
                "state_code": state_code,
                "state_name": state_name,
                "analysis_id": analysis_id,
                "has_transactions": False,
                "analysis_period": {
                    "years_available": []
                },
                "year_data": [],
                "compliance_info": compliance_info
            }

        # Use V2 calculated results from state_results table
        # Get threshold and tax rate info for compliance section
        threshold_result = supabase.table('economic_nexus_thresholds').select(
            'revenue_threshold, transaction_threshold, threshold_operator'
        ).eq('state', state_code).is_('effective_to', 'null').execute()

        threshold_info = threshold_result.data[0] if threshold_result.data else None

        tax_rate_result = supabase.table('tax_rates').select(
            'state_rate, avg_local_rate, combined_avg_rate'
        ).eq('state', state_code).execute()

        # Build year_data from V2 calculated results
        year_data = []
        years_available = []

        for year_result in state_year_results:
            year = year_result['year']
            years_available.append(year)

            # Determine nexus_status from V2 nexus_type
            nexus_type = year_result.get('nexus_type', 'none')
            nexus_status = 'has_nexus' if nexus_type in ['economic', 'physical', 'both'] else 'none'

            # Get transactions for this year for transaction list
            year_transactions = [
                tx for tx in transactions
                if pd.to_datetime(tx['transaction_date']).year == year
            ]

            # Build transactions list with running total
            running_total = 0
            transactions_list = []
            for tx in year_transactions:
                running_total += tx['sales_amount']
                tx_date = pd.to_datetime(tx['transaction_date'])
                transactions_list.append({
                    'transaction_id': tx['transaction_id'],
                    'transaction_date': tx['transaction_date'],
                    'sales_amount': tx['sales_amount'],
                    'taxable_amount': tx.get('taxable_amount', 0),
                    'exempt_amount': tx.get('exempt_amount', 0),
                    'is_taxable': tx.get('is_taxable', True),
                    'sales_channel': tx['sales_channel'],
                    'year': year,
                    'month': tx_date.to_period('M').strftime('%Y-%m'),
                    'running_total': running_total
                })

            # Build monthly aggregates from transactions
            monthly_sales = []
            for month_num in range(1, 13):
                month_str = f"{year}-{month_num:02d}"
                month_txns = [tx for tx in year_transactions if pd.to_datetime(tx['transaction_date']).month == month_num]
                monthly_sales.append({
                    'month': month_str,
                    'sales': sum(tx['sales_amount'] for tx in month_txns),
                    'transaction_count': len(month_txns)
                })

            # Calculate threshold metrics
            total_sales = float(year_result.get('total_sales', 0))
            revenue_threshold = threshold_info.get('revenue_threshold') if threshold_info else None

            threshold_data = {
                'revenue_threshold': revenue_threshold,
                'transaction_threshold': threshold_info.get('transaction_threshold') if threshold_info else None,
                'threshold_operator': threshold_info.get('threshold_operator', 'or') if threshold_info else 'or',
                'percentage_of_threshold': round((total_sales / revenue_threshold) * 100, 1) if revenue_threshold and revenue_threshold > 0 else 0,
                'amount_until_nexus': max(0, revenue_threshold - total_sales) if revenue_threshold else 0,
                'amount_over_nexus': max(0, total_sales - revenue_threshold) if revenue_threshold and total_sales > revenue_threshold else None,
                'approaching': year_result.get('approaching_threshold', False)
            }

            year_data.append({
                'year': year,
                'nexus_status': nexus_status,
                'nexus_type': nexus_type,  # Include nexus type for color-coded badges
                'summary': {
                    'total_sales': total_sales,
                    'transaction_count': len(year_transactions),
                    'direct_sales': float(year_result.get('direct_sales', 0)),
                    'marketplace_sales': float(year_result.get('marketplace_sales', 0)),
                    'taxable_sales': float(year_result.get('taxable_sales', 0)),
                    'exposure_sales': float(year_result.get('exposure_sales', 0)),
                    'estimated_liability': float(year_result.get('estimated_liability', 0)),
                    'base_tax': float(year_result.get('base_tax', 0)),
                    'interest': float(year_result.get('interest', 0)),
                    'penalties': float(year_result.get('penalties', 0)),
                    # Calculation metadata for transparency
                    'interest_rate': float(year_result.get('interest_rate', 0)) * 100 if year_result.get('interest_rate') else None,  # Convert to percentage
                    'interest_method': year_result.get('interest_method'),
                    'days_outstanding': year_result.get('days_outstanding'),
                    'penalty_rate': float(year_result.get('penalty_rate', 0)) * 100 if year_result.get('penalty_rate') else None  # Convert to percentage
                },
                'threshold_info': threshold_data,
                'monthly_sales': monthly_sales,
                'transactions': transactions_list
            })

        # Build compliance info
        compliance_info = {
            'tax_rates': {
                'state_rate': 0,
                'avg_local_rate': 0,
                'combined_rate': 0
            },
            'threshold_info': {},
            'registration_info': {
                'registration_fee': 0,
                'filing_frequencies': ['Monthly', 'Quarterly', 'Annual'],
                'registration_url': registration_url,
                'dor_website': state_tax_website
            }
        }

        if tax_rate_result.data:
            # Rates are stored as decimals (0.0825 for 8.25%)
            # Convert to percentages for display by multiplying by 100
            state_rate = float(tax_rate_result.data[0]['state_rate']) * 100
            avg_local_rate = float(tax_rate_result.data[0].get('avg_local_rate', 0)) * 100
            combined_rate = float(tax_rate_result.data[0].get('combined_avg_rate', 0)) * 100

            compliance_info['tax_rates'] = {
                'state_rate': round(state_rate, 2),
                'avg_local_rate': round(avg_local_rate, 2),
                'combined_rate': round(combined_rate, 2)
            }

        if threshold_info:
            compliance_info['threshold_info'] = {
                'revenue_threshold': threshold_info.get('revenue_threshold'),
                'transaction_threshold': threshold_info.get('transaction_threshold'),
                'threshold_operator': threshold_info.get('threshold_operator')
            }

        # Calculate aggregate totals across all years
        total_sales_all_years = sum(yr['summary']['total_sales'] for yr in year_data)
        total_liability_all_years = sum(yr['summary']['estimated_liability'] for yr in year_data)

        # Determine if nexus exists in any year
        has_nexus_any_year = any(yr['nexus_status'] == 'has_nexus' for yr in year_data)

        # Determine aggregate nexus type by combining all years
        aggregate_nexus_type = 'none'
        if has_nexus_any_year and year_data:
            has_physical = any(yr.get('nexus_type') in ['physical', 'both'] for yr in year_data)
            has_economic = any(yr.get('nexus_type') in ['economic', 'both'] for yr in year_data)

            if has_physical and has_economic:
                aggregate_nexus_type = 'both'
            elif has_physical:
                aggregate_nexus_type = 'physical'
            elif has_economic:
                aggregate_nexus_type = 'economic'
            else:
                aggregate_nexus_type = 'none'

        # Find first nexus year from V2 results
        first_nexus_year = None
        for yr in sorted(year_data, key=lambda x: x['year']):
            if yr['nexus_status'] == 'has_nexus':
                # Check if this year has first_nexus_year set (from V2)
                first_year = state_year_results[year_data.index(yr)].get('first_nexus_year')
                if first_year:
                    first_nexus_year = first_year
                    break

        # Debug logging to check nexus_type values
        logger.info(f"State detail API response for {state_code}:")
        logger.info(f"  Aggregate nexus_type: {aggregate_nexus_type}")
        if year_data:
            for yr in year_data:
                logger.info(f"  Year {yr['year']}: nexus_type={yr.get('nexus_type')}, nexus_status={yr.get('nexus_status')}")

        return {
            'state_code': state_code,
            'state_name': state_name,
            'analysis_id': analysis_id,
            'has_transactions': True,
            'analysis_period': {
                'years_available': years_available
            },
            'year_data': year_data,
            'compliance_info': compliance_info,
            # Aggregate totals for "All Years" view
            'total_sales': total_sales_all_years,
            'estimated_liability': total_liability_all_years,
            'nexus_type': aggregate_nexus_type,  # Use latest year's nexus type
            'first_nexus_year': first_nexus_year
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching state detail: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch state detail: {str(e)}"
        )
