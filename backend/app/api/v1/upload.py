"""Upload, column detection, mapping, normalization, and validation endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.auth import require_auth
from app.core.supabase import get_supabase
from app.config import settings
from app.schemas.responses import (
    UploadResponse,
    AutoDetectedMappings,
    DateRange,
    ColumnsResponse,
    ValidationResponse,
    NormalizationPreviewResponse,
    ValidateAndSaveResponse,
)
from app.services.column_detector import ColumnDetector
import logging
from datetime import datetime
import pandas as pd
import io

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/{analysis_id}/upload", response_model=UploadResponse)
@limiter.limit(settings.RATE_LIMIT_UPLOAD)
async def upload_transactions(
    request: Request,
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
            logger.error(f"Failed to parse uploaded file: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to parse file. Please ensure it's a valid CSV file."
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
            except Exception as e:
                # File doesn't exist or removal failed - not critical, continue
                logger.debug(f"Could not remove existing file at {storage_path}: {str(e)}")

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
                detail="Failed to store file. Please try again or contact support if the issue persists."
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

        return UploadResponse(
            message="File uploaded and analyzed successfully",
            analysis_id=analysis_id,
            auto_detected_mappings=AutoDetectedMappings(
                mappings=detection_result['mappings'],
                confidence=detection_result['confidence'],
                samples=sample_values,
                summary=summary,
                required_detected=detected_required,
                optional_detected=detected_optional
            ),
            all_required_detected=len(detected_required) == len(required_columns),
            optional_columns_found=len(detected_optional),
            columns_detected=list(df.columns),
            date_range_detected=DateRange(
                start=detected_start,
                end=detected_end,
                auto_populated=auto_populated
            ) if detected_start else None
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file for analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process file. Please ensure your file is formatted correctly and try again."
        )


@router.post("/{analysis_id}/preview-normalization", response_model=NormalizationPreviewResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def preview_normalization(
    request: Request,
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

        # Get channel and state previews for UI
        channel_preview = {}
        state_preview = {}

        if 'sales_channel' in mappings and mappings.get('sales_channel'):
            channel_col = mappings['sales_channel']
            channel_preview = ColumnDetector.get_channel_mapping_preview(df, channel_col)

        if 'customer_state' in mappings and mappings.get('customer_state'):
            state_col = mappings['customer_state']
            state_preview = ColumnDetector.get_state_mapping_preview(df, state_col)

        # Calculate date range for UI
        date_range = {'start': None, 'end': None}
        if 'transaction_date' in normalized_df.columns:
            try:
                dates = pd.to_datetime(normalized_df['transaction_date'].dropna())
                if len(dates) > 0:
                    date_range = {
                        'start': str(dates.min().date()),
                        'end': str(dates.max().date())
                    }
            except Exception:
                pass

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
            },
            "channel_preview": channel_preview,
            "state_preview": state_preview,
            "date_range": date_range
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error previewing normalization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to preview data normalization. Please try again."
        )


@router.post("/{analysis_id}/validate-and-save", response_model=ValidateAndSaveResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def validate_and_save_mappings(
    request: Request,
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

        # Prepare transactions for insertion (vectorized)
        # Build DataFrame with transformed columns to avoid row-by-row iteration
        txn_df = pd.DataFrame(index=normalized_df.index)
        txn_df['analysis_id'] = analysis_id  # Scalar broadcasts to all rows
        txn_df['transaction_date'] = normalized_df['transaction_date'].values
        txn_df['customer_state'] = normalized_df['customer_state'].astype(str).str.strip().str.upper()
        txn_df['sales_amount'] = normalized_df['revenue_amount'].astype(float)
        txn_df['sales_channel'] = normalized_df['sales_channel'].astype(str).str.strip().str.lower()
        txn_df['transaction_count'] = 1  # Scalar broadcasts to all rows
        txn_df['tax_collected'] = None  # Scalar broadcasts to all rows

        # Handle optional columns with defaults
        if 'revenue_stream' in normalized_df.columns:
            # Convert to string where not null, keep None for null values
            txn_df['revenue_stream'] = normalized_df['revenue_stream'].apply(
                lambda x: str(x) if pd.notna(x) else None
            )
        else:
            txn_df['revenue_stream'] = None

        if 'is_taxable' in normalized_df.columns:
            txn_df['is_taxable'] = normalized_df['is_taxable'].fillna(True).astype(bool)
        else:
            txn_df['is_taxable'] = True

        if 'taxable_amount' in normalized_df.columns:
            txn_df['taxable_amount'] = normalized_df['taxable_amount'].fillna(
                normalized_df['revenue_amount']
            ).astype(float)
        else:
            txn_df['taxable_amount'] = normalized_df['revenue_amount'].astype(float)

        if 'exempt_amount_calc' in normalized_df.columns:
            txn_df['exempt_amount'] = normalized_df['exempt_amount_calc'].fillna(0.0).astype(float)
        else:
            txn_df['exempt_amount'] = 0.0

        # Convert to list of dicts in one operation
        transactions = txn_df.to_dict(orient='records')

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

        return ValidateAndSaveResponse(
            message="Mappings validated and data saved successfully",
            transactions_saved=total_inserted
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating and saving mappings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save transaction data. Please verify your data and try again."
        )


@router.get("/{analysis_id}/columns", response_model=ColumnsResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_column_info(
    request: Request,
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
                except Exception as e:
                    logger.debug(f"Could not extract date range from column: {str(e)}")

            if 'customer_state' in detected['mappings']:
                state_col = detected['mappings']['customer_state']
                try:
                    summary["unique_states"] = df[state_col].nunique()
                except Exception as e:
                    logger.debug(f"Could not count unique states: {str(e)}")

        return ColumnsResponse(
            columns=columns_info,
            summary=summary
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting column info for analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get column information. Please try again."
        )


@router.post("/{analysis_id}/validate", response_model=ValidationResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def validate_data(
    request: Request,
    analysis_id: str,
    request_body: dict,
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

        # Convert errors to string messages for schema compatibility
        error_messages = [f"Row {e['row']}, {e['column']}: {e['message']}" for e in errors[:50]]
        warning_messages = [f"Row {w['row']}, {w['column']}: {w['message']}" for w in warnings[:20]]

        return ValidationResponse(
            message=f"Validation {validation_status}: {valid_rows} valid rows, {invalid_rows} invalid rows",
            is_valid=ready_to_process,
            errors=error_messages,
            warnings=warning_messages
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating data for analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate data. Please check your transaction data and try again."
        )
