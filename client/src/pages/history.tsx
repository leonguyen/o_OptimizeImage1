import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Image, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Trash2,
  ArrowUp,
  ArrowDown,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Compression {
  id: string;
  filename: string;
  originalSize: number;
  compressedSize: number | null;
  savingsPercent: number | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

type SortField = 'createdAt' | 'filename' | 'originalSize' | 'savingsPercent';
type SortDirection = 'asc' | 'desc';

export default function History() {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: compressions, isLoading } = useQuery<Compression[]>({
    queryKey: ["/api/compressions"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/compressions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compressions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Compression Deleted",
        description: "Compression record has been removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete compression",
        variant: "destructive",
      });
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedCompressions = compressions ? [...compressions].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'createdAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  }) : [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle },
      processing: { color: "bg-amber-500/10 text-amber-400", icon: Loader2 },
      failed: { color: "bg-destructive/10 text-destructive", icon: AlertCircle },
      pending: { color: "bg-muted text-muted-foreground", icon: null },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={cn("inline-flex items-center", config.color)}>
        {Icon && <Icon size={12} className={cn("mr-1", status === "processing" && "animate-spin")} />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div>
          <h2 className="text-2xl font-semibold" data-testid="page-title">Compression History</h2>
          <p className="text-muted-foreground">View and manage all your image compression records</p>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 animate-pulse">
                        <div className="w-10 h-10 bg-muted rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-48 bg-muted rounded"></div>
                          <div className="h-3 w-32 bg-muted rounded"></div>
                        </div>
                        <div className="h-6 w-20 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : sortedCompressions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th 
                          className="text-left p-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                          onClick={() => handleSort('filename')}
                          data-testid="sort-filename"
                        >
                          <div className="flex items-center space-x-1">
                            <span>File</span>
                            <SortIcon field="filename" />
                          </div>
                        </th>
                        <th 
                          className="text-left p-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                          onClick={() => handleSort('originalSize')}
                          data-testid="sort-original-size"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Original Size</span>
                            <SortIcon field="originalSize" />
                          </div>
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Compressed Size</th>
                        <th 
                          className="text-left p-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                          onClick={() => handleSort('savingsPercent')}
                          data-testid="sort-savings"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Savings</span>
                            <SortIcon field="savingsPercent" />
                          </div>
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                        <th 
                          className="text-left p-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                          onClick={() => handleSort('createdAt')}
                          data-testid="sort-date"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Date</span>
                            <SortIcon field="createdAt" />
                          </div>
                        </th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCompressions.map((compression) => (
                        <tr key={compression.id} className="border-b border-border hover:bg-muted/50" data-testid={`compression-row-${compression.id}`}>
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Image className="text-muted-foreground" size={20} />
                              </div>
                              <div>
                                <p className="font-medium">{compression.filename}</p>
                                {compression.errorMessage && (
                                  <p className="text-xs text-destructive">{compression.errorMessage}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {formatFileSize(compression.originalSize)}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {compression.compressedSize ? formatFileSize(compression.compressedSize) : "-"}
                          </td>
                          <td className="p-4">
                            {compression.savingsPercent ? (
                              <span className="text-emerald-400 font-medium">
                                {Math.round(compression.savingsPercent)}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            {getStatusBadge(compression.status)}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            <div>
                              <p>{formatDate(compression.createdAt)}</p>
                              {compression.completedAt && compression.completedAt !== compression.createdAt && (
                                <p className="text-xs">Completed: {formatDate(compression.completedAt)}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {compression.status === 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-foreground"
                                  data-testid={`button-download-${compression.id}`}
                                >
                                  <Download size={16} />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMutation.mutate(compression.id)}
                                disabled={deleteMutation.isPending}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                data-testid={`button-delete-${compression.id}`}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Image className="mx-auto h-16 w-16 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No compressions yet</h3>
                  <p className="mt-2 text-muted-foreground">
                    Start compressing images to see your history here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
