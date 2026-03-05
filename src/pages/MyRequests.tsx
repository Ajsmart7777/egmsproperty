import { useNavigate } from "react-router-dom";
import MobileHeader from "@/components/ui/MobileHeader";
import RequestCard from "@/components/ui/RequestCard";
import { Plus } from "lucide-react";
import { useMaintenanceRequests } from "@/hooks/useMaintenanceRequests";
import { format } from "date-fns";

type Status = "pending" | "in-progress" | "completed";
type IssueType = "plumbing" | "electrical" | "cleaning" | "structural" | "others";

const MyRequests = () => {
  const navigate = useNavigate();
  const { requests, loading } = useMaintenanceRequests();

  const handleNewRequest = () => {
    navigate("/maintenance-request");
  };

  const handleCardClick = (id: string) => {
    navigate(`/request/${id}`);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <MobileHeader title="My Requests" onBack={() => navigate("/")} />
      
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-3 text-sm text-muted-foreground">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No requests yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Submit your first maintenance request to get started
              </p>
              <button
                onClick={handleNewRequest}
                className="text-sm font-medium text-primary hover:underline"
              >
                Create New Request
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {requests.map((request, index) => (
                <div
                  key={request.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <RequestCard
                    title={request.title}
                    description={request.description}
                    issueType={request.issue_type as IssueType}
                    dateSubmitted={formatDate(request.created_at)}
                    status={request.status as Status}
                    onClick={() => handleCardClick(request.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleNewRequest}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated transition-all hover:bg-secondary hover:scale-105 active:scale-95"
        aria-label="New Request"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};

export default MyRequests;
