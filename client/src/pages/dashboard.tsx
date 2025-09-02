import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Combine, 
  HardDrive, 
  Key, 
  CheckCircle, 
  ArrowUp, 
  Plus,
  Bell,
  Image,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import UploadZone from "@/components/upload-zone";

interface Stats {
  totalCompressions: number;
  totalSpaceSaved: number;
  activeApiKeys: number;
  successRate: number;
  apiKeyUsage: Array<{
    key: string;
    used: number;
    limit: number;
  }>;
}

interface Compression {
  id: string;
  filename: string;
  originalSize: number;
  compressedSize: number | null;
  savingsPercent: number | null;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: compressions, isLoading: compressionsLoading } = useQuery<Compression[]>({
    queryKey: ["/api/compressions"],
  });

  const recentCompressions = compressions?.slice(0, 5) || [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle },
      processing: { color: "bg-amber-500/10 text-amber-400", icon: Loader2 },
      failed: { color: "bg-destructive/10 text-destructive", icon: null },
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

  const getApiKeyStatus = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return { color: "bg-destructive", status: "bg-destructive" };
    if (percentage >= 80) return { color: "bg-amber-500", status: "bg-amber-500" };
    return { color: "bg-emerald-500", status: "bg-emerald-500" };
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold" data-testid="page-title">Dashboard</h2>
            <p className="text-muted-foreground">Monitor your TinyPNG API usage and manage compression tasks</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
            </Button>
            <Link href="/upload">
              <Button data-testid="button-upload">
                <Plus size={16} className="mr-2" />
                Upload Image
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Compressions</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-compressions">
                    {statsLoading ? "..." : stats?.totalCompressions || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Combine className="text-primary text-lg" size={24} />
                </div>
              </div>
              <p className="text-xs text-emerald-400 mt-2">
                <ArrowUp size={12} className="inline mr-1" />
                Active compression service
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Space Saved</p>
                  <p className="text-2xl font-bold" data-testid="stat-space-saved">
                    {statsLoading ? "..." : `${stats?.totalSpaceSaved || 0} MB`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <HardDrive className="text-emerald-500 text-lg" size={24} />
                </div>
              </div>
              <p className="text-xs text-emerald-400 mt-2">
                <ArrowUp size={12} className="inline mr-1" />
                Optimization efficient
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active API Keys</p>
                  <p className="text-2xl font-bold" data-testid="stat-active-keys">
                    {statsLoading ? "..." : `${stats?.activeApiKeys || 0} / ${stats?.apiKeyUsage?.length || 0}`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Key className="text-amber-500 text-lg" size={24} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                All keys operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold" data-testid="stat-success-rate">
                    {statsLoading ? "..." : `${stats?.successRate || 0}%`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-emerald-500 text-lg" size={24} />
                </div>
              </div>
              <p className="text-xs text-emerald-400 mt-2">
                <ArrowUp size={12} className="inline mr-1" />
                Stable performance
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Key Status */}
          <Card>
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">API Key Status</h3>
                <Link href="/api-keys">
                  <Button variant="ghost" size="sm" className="text-primary" data-testid="link-manage-keys">
                    Manage Keys
                  </Button>
                </Link>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {statsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-muted rounded-full"></div>
                        <div className="space-y-1">
                          <div className="h-4 w-16 bg-muted rounded"></div>
                          <div className="h-3 w-24 bg-muted rounded"></div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="h-4 w-16 bg-muted rounded"></div>
                        <div className="w-20 h-2 bg-muted rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.apiKeyUsage && stats.apiKeyUsage.length > 0 ? (
                stats.apiKeyUsage.map((keyUsage, index) => {
                  const { color, status } = getApiKeyStatus(keyUsage.used, keyUsage.limit);
                  const percentage = (keyUsage.used / keyUsage.limit) * 100;
                  
                  return (
                    <div key={keyUsage.key} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg" data-testid={`api-key-${index}`}>
                      <div className="flex items-center space-x-3">
                        <div className={cn("w-3 h-3 rounded-full", status)}></div>
                        <div>
                          <p className="font-medium">Key #{index + 1}</p>
                          <p className="text-sm text-muted-foreground">
                            {keyUsage.key.substring(0, 8)}...{keyUsage.key.substring(keyUsage.key.length - 4)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{keyUsage.used} / {keyUsage.limit}</p>
                        <div className="w-20 h-2 bg-border rounded-full mt-1">
                          <div 
                            className={cn("h-full rounded-full", color)} 
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Key className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No API keys</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Get started by adding your first API key.</p>
                  <Link href="/api-keys">
                    <Button className="mt-4" data-testid="button-add-first-key">Add API Key</Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Upload Zone */}
          <Card>
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Quick Upload</h3>
            </div>
            <div className="p-6">
              <UploadZone />
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Compressions</h3>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="text-primary" data-testid="link-view-all">
                  View All
                </Button>
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">File</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Original Size</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Compressed Size</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Savings</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {compressionsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
                          <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                        </div>
                      </td>
                      <td className="p-4"><div className="h-4 w-16 bg-muted rounded animate-pulse"></div></td>
                      <td className="p-4"><div className="h-4 w-16 bg-muted rounded animate-pulse"></div></td>
                      <td className="p-4"><div className="h-4 w-12 bg-muted rounded animate-pulse"></div></td>
                      <td className="p-4"><div className="h-6 w-20 bg-muted rounded animate-pulse"></div></td>
                      <td className="p-4"><div className="h-4 w-20 bg-muted rounded animate-pulse"></div></td>
                    </tr>
                  ))
                ) : recentCompressions.length > 0 ? (
                  recentCompressions.map((compression) => (
                    <tr key={compression.id} className="border-b border-border hover:bg-muted/50" data-testid={`compression-row-${compression.id}`}>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                            <Image className="text-muted-foreground" size={16} />
                          </div>
                          <span className="font-medium">{compression.filename}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{formatFileSize(compression.originalSize)}</td>
                      <td className="p-4 text-muted-foreground">
                        {compression.compressedSize ? formatFileSize(compression.compressedSize) : "-"}
                      </td>
                      <td className="p-4">
                        {compression.savingsPercent ? (
                          <span className="text-emerald-400 font-medium">{Math.round(compression.savingsPercent)}%</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">{getStatusBadge(compression.status)}</td>
                      <td className="p-4 text-muted-foreground">{formatTimeAgo(compression.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <Combine className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-semibold">No compressions yet</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Start by uploading your first image.</p>
                      <Link href="/upload">
                        <Button className="mt-4" data-testid="button-start-uploading">Start Uploading</Button>
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
