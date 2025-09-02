import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CloudUpload, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadResult {
  id: string;
  filename: string;
  originalSize: number;
  compressedSize?: number;
  savingsPercent?: number;
  status: string;
  error?: string;
}

export default function UploadZone() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await apiRequest('POST', '/api/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      setUploadResults(data.results);
      setFiles([]);
      
      // Invalidate queries to refresh dashboard data
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/compressions'] });
      
      const successCount = data.results.filter((r: UploadResult) => r.status === 'completed').length;
      const failureCount = data.results.length - successCount;
      
      if (successCount > 0) {
        toast({
          title: "Upload Complete",
          description: `${successCount} image(s) compressed successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
      setUploadResults([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setUploadResults([]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const clearResults = () => {
    setUploadResults([]);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragOver 
            ? "border-primary bg-primary/10" 
            : "border-border hover:border-muted-foreground"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="upload-zone"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
          <CloudUpload className="text-primary text-2xl" size={32} />
        </div>
        <h4 className="text-lg font-medium mb-2">Drop images here</h4>
        <p className="text-muted-foreground mb-4">or click to browse files</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          data-testid="file-input"
        />
        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          data-testid="button-browse"
        >
          Browse Files
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Supports PNG, JPG, JPEG up to 5MB each
        </p>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="font-medium">Selected Files ({files.length})</h5>
            <Button 
              onClick={handleUpload} 
              disabled={uploadMutation.isPending}
              data-testid="button-upload-selected"
            >
              {uploadMutation.isPending ? "Compressing..." : "Compress Images"}
            </Button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`selected-file-${index}`}>
                <div className="flex-1">
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                {!uploadMutation.isPending && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadMutation.isPending && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Compressing images...</span>
            <span className="text-sm text-muted-foreground">Please wait</span>
          </div>
          <Progress value={undefined} className="h-2" />
        </div>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="font-medium">Compression Results</h5>
            <Button variant="ghost" size="sm" onClick={clearResults} data-testid="button-clear-results">
              Clear
            </Button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadResults.map((result, index) => (
              <div key={result.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`result-${index}`}>
                <div className="flex items-center space-x-3">
                  {result.status === 'completed' ? (
                    <CheckCircle className="text-emerald-500" size={20} />
                  ) : (
                    <AlertCircle className="text-destructive" size={20} />
                  )}
                  <div>
                    <p className="font-medium text-sm">{result.filename}</p>
                    {result.status === 'completed' ? (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(result.originalSize)} → {formatFileSize(result.compressedSize!)} 
                        <span className="text-emerald-400 ml-2">
                          ({Math.round(result.savingsPercent!)}% saved)
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-destructive">{result.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
