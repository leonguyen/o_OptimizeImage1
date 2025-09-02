import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiKeyModal } from "@/components/api-key-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Key, Trash2, Eye, EyeOff, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiKey {
  id: string;
  key: string;
  description: string | null;
  monthlyLimit: number;
  currentUsage: number;
  isActive: boolean;
  createdAt: string;
  lastUsed: string | null;
}

export default function ApiKeys() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "API Key Deleted",
        description: "API key has been removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      });
    },
  });

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (visibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getKeyStatus = (currentUsage: number, monthlyLimit: number, isActive: boolean) => {
    if (!isActive) return { icon: XCircle, color: "bg-muted text-muted-foreground", text: "Inactive" };
    
    const percentage = (currentUsage / monthlyLimit) * 100;
    if (percentage >= 100) return { icon: XCircle, color: "bg-destructive/10 text-destructive", text: "Exhausted" };
    if (percentage >= 80) return { icon: AlertCircle, color: "bg-amber-500/10 text-amber-400", text: "Warning" };
    return { icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-400", text: "Active" };
  };

  const maskKey = (key: string) => {
    return key.substring(0, 8) + "..." + key.substring(key.length - 4);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold" data-testid="page-title">API Keys</h2>
            <p className="text-muted-foreground">Manage your TinyPNG API keys and monitor usage</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} data-testid="button-add-key">
            <Plus size={16} className="mr-2" />
            Add API Key
          </Button>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 w-48 bg-muted rounded"></div>
                      <div className="h-4 w-full bg-muted rounded"></div>
                      <div className="h-4 w-3/4 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : apiKeys && apiKeys.length > 0 ? (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => {
                const status = getKeyStatus(apiKey.currentUsage, apiKey.monthlyLimit, apiKey.isActive);
                const StatusIcon = status.icon;
                const isVisible = visibleKeys.has(apiKey.id);
                const usagePercentage = (apiKey.currentUsage / apiKey.monthlyLimit) * 100;

                return (
                  <Card key={apiKey.id} data-testid={`api-key-card-${apiKey.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Key className="text-primary" size={20} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold">
                                  {apiKey.description || "Unnamed API Key"}
                                </h3>
                                <Badge className={cn("inline-flex items-center", status.color)}>
                                  <StatusIcon size={12} className="mr-1" />
                                  {status.text}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                                  {isVisible ? apiKey.key : maskKey(apiKey.key)}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleKeyVisibility(apiKey.id)}
                                  data-testid={`button-toggle-visibility-${apiKey.id}`}
                                >
                                  {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Usage This Month</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="font-semibold">{apiKey.currentUsage} / {apiKey.monthlyLimit}</span>
                                <div className="flex-1 h-2 bg-border rounded-full">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      usagePercentage >= 100 ? "bg-destructive" :
                                      usagePercentage >= 80 ? "bg-amber-500" : "bg-emerald-500"
                                    )}
                                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {Math.round(usagePercentage)}%
                                </span>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm text-muted-foreground">Created</p>
                              <p className="font-medium">{formatDate(apiKey.createdAt)}</p>
                            </div>

                            <div>
                              <p className="text-sm text-muted-foreground">Last Used</p>
                              <p className="font-medium">
                                {apiKey.lastUsed ? formatDate(apiKey.lastUsed) : "Never"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(apiKey.id)}
                            disabled={deleteMutation.isPending}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            data-testid={`button-delete-${apiKey.id}`}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Key className="mx-auto h-16 w-16 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No API keys</h3>
                <p className="mt-2 text-muted-foreground">
                  Add your first TinyPNG API key to start compressing images.
                </p>
                <Button className="mt-4" onClick={() => setIsModalOpen(true)} data-testid="button-add-first-key">
                  <Plus size={16} className="mr-2" />
                  Add API Key
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ApiKeyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
