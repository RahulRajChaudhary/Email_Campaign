'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Trash2,
  Eye,
  Calendar,
  Users,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';

interface UploadItem {
  id: string;
  name: string;
  originalName: string;
  columns: string[];
  rowCount: number;
  uploadedAt: string;
  lastUsedAt: string | null;
  data?: Record<string, string>[];
}

export default function UploadsPage() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUpload, setPreviewUpload] = useState<UploadItem | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      const res = await fetch('/api/uploads');
      const data = await res.json();
      if (data.success) {
        setUploads(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setUploads([data.data, ...uploads]);
        toast({
          title: 'Upload Successful',
          description: `${data.data.rowCount} contacts imported from ${file.name}`,
        });
      } else {
        toast({
          title: 'Upload Failed',
          description: data.error || 'Failed to upload file',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to upload:', error);
      toast({
        title: 'Upload Failed',
        description: 'An error occurred while uploading',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const deleteUpload = async (id: string) => {
    try {
      const res = await fetch(`/api/uploads?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setUploads(uploads.filter((u) => u.id !== id));
        toast({
          title: 'Deleted',
          description: 'Upload has been removed.',
        });
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete upload',
        variant: 'destructive',
      });
    }
  };

  const openPreview = async (upload: UploadItem) => {
    setPreviewLoading(true);
    setPreviewUpload(upload);

    try {
      const res = await fetch(`/api/uploads?id=${upload.id}`);
      const data = await res.json();
      if (data.success) {
        setPreviewUpload(data.data);
      }
    } catch (error) {
      console.error('Failed to load preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Contact Lists</h1>
        <p className="text-muted-foreground">
          Upload Excel or CSV files with your email contacts
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-12 text-center transition-colors
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary/50'}
            `}
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {uploading ? (
              <div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <p className="text-lg font-medium mb-1">
                  Drag & drop your file here
                </p>
                <p className="text-muted-foreground mb-4">
                  or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports Excel (.xlsx, .xls) and CSV files
                </p>
                <p className="text-sm text-muted-foreground">
                  File must contain an &quot;email&quot; column
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploads List */}
      {uploads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSpreadsheet className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No uploads yet</h3>
            <p className="text-muted-foreground text-center">
              Upload an Excel or CSV file to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {uploads.map((upload) => (
            <Card key={upload.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{upload.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {upload.rowCount} contacts
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(upload.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {upload.columns.slice(0, 5).map((col) => (
                        <Badge key={col} variant="secondary" className="text-xs">
                          {col}
                        </Badge>
                      ))}
                      {upload.columns.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{upload.columns.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPreview(upload)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Upload</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{upload.name}&quot;? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteUpload(upload.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewUpload} onOpenChange={() => setPreviewUpload(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewUpload?.name}</span>
              <Badge variant="secondary">
                {previewUpload?.rowCount} contacts
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : previewUpload?.data ? (
            <ScrollArea className="h-[500px]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr>
                      <th className="text-left p-2 border-b font-medium">#</th>
                      {previewUpload.columns.map((col) => (
                        <th key={col} className="text-left p-2 border-b font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewUpload.data.slice(0, 100).map((row, i) => (
                      <tr key={i} className="hover:bg-muted/50">
                        <td className="p-2 border-b text-muted-foreground">{i + 1}</td>
                        {previewUpload.columns.map((col) => (
                          <td key={col} className="p-2 border-b truncate max-w-[200px]">
                            {row[col] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewUpload.data.length > 100 && (
                  <p className="text-center text-muted-foreground py-4">
                    Showing first 100 of {previewUpload.data.length} rows
                  </p>
                )}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              No data to display
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
