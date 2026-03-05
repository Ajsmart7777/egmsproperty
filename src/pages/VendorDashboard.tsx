import { useNavigate } from "react-router-dom";
import { useVendorRequests } from "@/hooks/useVendorRequests";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInDays, differenceInHours } from "date-fns";
import {
  Droplet,
  Zap,
  Wind,
  Wrench,
  Paintbrush,
  Bug,
  Home,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Target,
  Timer,
  Award,
  BarChart3,
} from "lucide-react";
import { useMemo } from "react";

const issueTypeIcons: Record<string, typeof Droplet> = {
  plumbing: Droplet,
  electrical: Zap,
  hvac: Wind,
  appliance: Wrench,
  painting: Paintbrush,
  pest_control: Bug,
  other: Home,
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-[hsl(var(--status-pending))]/10 text-[hsl(var(--status-pending))]",
  high: "bg-destructive/10 text-destructive",
};

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-[hsl(var(--status-pending))]/10 text-[hsl(var(--status-pending))]",
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-secondary/10 text-secondary",
    icon: AlertCircle,
  },
  completed: {
    label: "Completed",
    color: "bg-primary/10 text-primary",
    icon: CheckCircle,
  },
};

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { requests, loading, isVendor, updateRequestStatus } = useVendorRequests();

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const inProgress = requests.filter((r) => r.status === "in_progress").length;
    const completed = requests.filter((r) => r.status === "completed").length;
    
    // Completion rate
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Average completion time (for completed requests)
    const completedRequests = requests.filter((r) => r.status === "completed");
    let avgCompletionTime = 0;
    if (completedRequests.length > 0) {
      const totalHours = completedRequests.reduce((sum, r) => {
        const created = new Date(r.created_at);
        const updated = new Date(r.updated_at);
        return sum + differenceInHours(updated, created);
      }, 0);
      avgCompletionTime = Math.round(totalHours / completedRequests.length);
    }
    
    // Priority breakdown
    const highPriority = requests.filter((r) => r.priority === "high" && r.status !== "completed").length;
    
    // This month's stats
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const completedThisMonth = requests.filter(
      (r) => r.status === "completed" && new Date(r.updated_at) >= thisMonth
    ).length;
    
    // Requests by issue type
    const byIssueType = requests.reduce((acc, r) => {
      const type = r.issue_type.toLowerCase();
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total,
      pending,
      inProgress,
      completed,
      completionRate,
      avgCompletionTime,
      highPriority,
      completedThisMonth,
      byIssueType,
      activeRequests: pending + inProgress,
    };
  }, [requests]);

  const activeRequests = useMemo(
    () => requests.filter((r) => r.status !== "completed"),
    [requests]
  );

  const completedRequests = useMemo(
    () => requests.filter((r) => r.status === "completed"),
    [requests]
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!isVendor) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have vendor access to this dashboard.
            </p>
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getIssueIcon = (issueType: string) => {
    const normalizedType = issueType.toLowerCase().replace(/\s+/g, "_");
    const Icon = issueTypeIcons[normalizedType] || Home;
    return <Icon className="h-4 w-4" />;
  };

  const formatCompletionTime = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const RequestCard = ({ request }: { request: typeof requests[0] }) => {
    const statusInfo = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
    const StatusIcon = statusInfo.icon;
    const daysSinceCreated = differenceInDays(new Date(), new Date(request.created_at));

    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(`/request/${request.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-muted">
                  {getIssueIcon(request.issue_type)}
                </div>
                <h3 className="font-medium truncate">{request.title}</h3>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {request.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{request.building}</span>
                <span>•</span>
                <span>Unit {request.apartment}</span>
                <span>•</span>
                <span>{format(new Date(request.created_at), "MMM d, yyyy")}</span>
                {daysSinceCreated > 0 && request.status !== "completed" && (
                  <>
                    <span>•</span>
                    <span className={daysSinceCreated > 3 ? "text-destructive" : ""}>
                      {daysSinceCreated}d ago
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge className={statusInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
              <Badge variant="outline" className={priorityColors[request.priority]}>
                {request.priority}
              </Badge>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
            {request.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateRequestStatus(request.id, "in_progress")}
              >
                Start Work
              </Button>
            )}
            {request.status === "in_progress" && (
              <Button
                size="sm"
                onClick={() => updateRequestStatus(request.id, "completed")}
              >
                Mark Complete
              </Button>
            )}
            {request.status === "completed" && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Completed {format(new Date(request.updated_at), "MMM d")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
          <p className="text-muted-foreground">Your performance and assigned requests</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.completionRate}%</div>
                <div className="text-xs text-muted-foreground">Completion Rate</div>
              </div>
            </div>
            <Progress value={stats.completionRate} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Timer className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {stats.avgCompletionTime > 0 ? formatCompletionTime(stats.avgCompletionTime) : "—"}
                </div>
                <div className="text-xs text-muted-foreground">Avg. Resolution</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--status-pending))]/10">
                <TrendingUp className="h-5 w-5 text-[hsl(var(--status-pending))]" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.completedThisMonth}</div>
                <div className="text-xs text-muted-foreground">Completed This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Award className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.highPriority}</div>
                <div className="text-xs text-muted-foreground">High Priority Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-[hsl(var(--status-pending))]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-[hsl(var(--status-pending))]">
                {stats.pending}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <Clock className="h-8 w-8 text-[hsl(var(--status-pending))]/30" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-secondary">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <AlertCircle className="h-8 w-8 text-secondary/30" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <CheckCircle className="h-8 w-8 text-primary/30" />
          </CardContent>
        </Card>
      </div>

      {/* Requests Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Clock className="h-4 w-4" />
            Active ({stats.activeRequests})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({stats.completed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">
                  You don't have any active requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            activeRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Completed Requests</h3>
                <p className="text-muted-foreground">
                  You haven't completed any requests yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            completedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorDashboard;
