import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  RefreshCw,
  FileX,
  CloudUpload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportJob {
  id: string;
  company_id: string;
  filename: string;
  file_path: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'processing':
      return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default' as const;
    case 'processing':
      return 'secondary' as const;
    case 'failed':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
};

export const CsvUpload = () => {
  const { selectedCompany } = useApp();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const { toast } = useToast();

  // Fetch import jobs for the selected company
  const fetchImportJobs = useCallback(async () => {
    if (!selectedCompany) return;

    setIsLoadingJobs(true);
    try {
      // This would normally query the import_jobs table
      // For now, we'll simulate with mock data
      const mockJobs: ImportJob[] = [
        {
          id: '1',
          company_id: selectedCompany.id,
          filename: 'sales_data_q1.csv',
          file_path: `uploads/${selectedCompany.id}/sales_data_q1.csv`,
          status: 'completed',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '2',
          company_id: selectedCompany.id,
          filename: 'sales_data_q2.csv',
          file_path: `uploads/${selectedCompany.id}/sales_data_q2.csv`,
          status: 'processing',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ];

      setImportJobs(mockJobs);
    } catch (error) {
      console.error('Error fetching import jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load upload history.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingJobs(false);
    }
  }, [selectedCompany, toast]);

  // Poll for job status updates every 5 seconds
  useEffect(() => {
    if (!selectedCompany) return;

    fetchImportJobs();
    const interval = setInterval(fetchImportJobs, 5000);

    return () => clearInterval(interval);
  }, [selectedCompany, fetchImportJobs]);

  // File validation
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      return 'Please select a CSV file.';
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return 'File size must be less than 50MB.';
    }

    return null;
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!selectedCompany) {
      toast({
        title: 'Error',
        description: 'Please select a company first.',
        variant: 'destructive',
      });
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // Generate unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${timestamp}_${file.name}`;
      const filePath = `uploads/${selectedCompany.id}/${filename}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) {
        throw error;
      }

      setUploadProgress(100);

      // Create import job record
      const newJob: ImportJob = {
        id: Date.now().toString(),
        company_id: selectedCompany.id,
        filename: file.name,
        file_path: filePath,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add to local state immediately
      setImportJobs(prev => [newJob, ...prev]);

      setUploadSuccess(true);
      toast({
        title: 'Upload successful!',
        description: `${file.name} has been uploaded and queued for processing.`,
      });

      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploadSuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Upload failed. Please try again.');
      toast({
        title: 'Upload failed',
        description: error.message || 'An error occurred during upload.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles[0]);
    }
  }, [selectedCompany]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: isUploading || !selectedCompany,
  });

  if (!selectedCompany) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Sales Data</h1>
          <p className="text-gray-600 mt-2">Upload CSV files for analysis</p>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a company first before uploading sales data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Sales Data</h1>
        <p className="text-gray-600 mt-2">
          Upload CSV files containing sales data for <span className="font-medium text-blue-600">{selectedCompany.name}</span>
        </p>
      </div>

      {/* Upload Zone */}
      <Card className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`
              relative cursor-pointer rounded-lg p-8 text-center transition-all duration-200
              ${isDragActive && !isDragReject ? 'bg-blue-50 border-blue-300' : ''}
              ${isDragReject ? 'bg-red-50 border-red-300' : ''}
              ${isUploading ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              {isUploading ? (
                <div className="p-4 bg-blue-100 rounded-full">
                  <CloudUpload className="h-8 w-8 text-blue-600 animate-bounce" />
                </div>
              ) : isDragReject ? (
                <div className="p-4 bg-red-100 rounded-full">
                  <FileX className="h-8 w-8 text-red-600" />
                </div>
              ) : (
                <div className="p-4 bg-gray-100 rounded-full hover:bg-blue-100 transition-colors">
                  <Upload className="h-8 w-8 text-gray-600 hover:text-blue-600 transition-colors" />
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isUploading ? 'Uploading...' : 
                   isDragActive ? 'Drop your CSV file here' : 
                   'Upload CSV File'}
                </h3>
                <p className="text-gray-500">
                  {isDragReject ? 'Please select a valid CSV file' :
                   isUploading ? 'Please wait while your file is being uploaded' :
                   'Drag and drop your CSV file here, or click to browse'}
                </p>
              </div>

              {!isUploading && (
                <Button variant="outline" className="mt-4">
                  <FileText className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Success Message */}
            {uploadSuccess && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Upload completed successfully!</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* File Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-blue-600" />
            File Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Format Requirements:</h4>
              <ul className="space-y-1">
                <li>• File must be in CSV format (.csv)</li>
                <li>• Maximum file size: 50MB</li>
                <li>• UTF-8 encoding recommended</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Expected Columns:</h4>
              <ul className="space-y-1">
                <li>• Date (YYYY-MM-DD format)</li>
                <li>• Amount (numeric values)</li>
                <li>• Customer (text)</li>
                <li>• Product/Service (text)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upload History</CardTitle>
            <CardDescription>
              Track the status of your uploaded files for {selectedCompany.name}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchImportJobs}
            disabled={isLoadingJobs}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingJobs ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {importJobs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads yet</h3>
              <p className="text-gray-500">
                Upload your first CSV file to see it appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-gray-500" />
                        {job.filename}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(job.status)}>
                        <div className="flex items-center">
                          {getStatusIcon(job.status)}
                          <span className="ml-1 capitalize">{job.status}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(job.created_at).toLocaleDateString()} at{' '}
                      {new Date(job.created_at).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      {new Date(job.updated_at).toLocaleDateString()} at{' '}
                      {new Date(job.updated_at).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};