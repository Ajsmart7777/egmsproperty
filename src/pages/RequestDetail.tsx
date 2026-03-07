import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MobileHeader from "@/components/ui/MobileHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import ImageUpload from "@/components/ui/ImageUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  Droplets,
  Zap,
  Sparkles,
  Building2,
  MoreHorizontal,
  Calendar,
  Send,
  Clock,
  MessageSquare,
  CheckCircle2,
  User,
  Wrench,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRequestDetails } from "@/hooks/useMaintenanceRequests";
import { useImageUpload } from "@/hooks/useImageUpload";
import { format } from "date-fns";
import { mapErrorToUserMessage } from "@/lib/errorHandler";

type Status = "pending" | "in-progress" | "completed";
type IssueType = "plumbing" | "electrical" | "cleaning" | "structural" | "others";

const issueIcons = {
  plumbing: Droplets,
  electrical: Zap,
  cleaning: Sparkles,
  structural: Building2,
  others: MoreHorizontal,
};

const issueColors = {
  plumbing: "bg-blue-100 text-blue-600",
  electrical: "bg-amber-100 text-amber-600",
  cleaning: "bg-brand-accent/20 text-brand-accent",
  structural: "bg-brand-light text-brand-primary",
  others: "bg-muted text-muted-foreground",
};

const priorityLabels = {
  low: { label: "Low Priority", color: "text-brand-secondary" },
  medium: { label: "Medium Priority", color: "text-brand-accent" },
  high: { label: "High Priority", color: "text-destructive" },
};

const updateIcons: Record<string, typeof Clock> = {
  created: Clock,
  assigned: User,
  "in-progress": Wrench,
  comment: MessageSquare,
  completed: CheckCircle2,
};

const normalizeText = (value?: string | null) => value?.trim().toLowerCase() || "";

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { request, comments, updates, loading, addComment } = useRequestDetails(id);
  const { uploadImages } = useImageUpload();

  const [newComment, setNewComment] = useState("");
  const [commentImages, setCommentImages] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "updates">("details");

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const formatTimestamp = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  const getCommentRoleLabel = (commenterRole?: string | null) => {
    if (commenterRole === "admin") return "Admin";
    if (commenterRole === "vendor") return "Vendor";
    return "Tenant";
  };

  const getCommentRoleBadgeClass = (commenterRole?: string | null) => {
    if (commenterRole === "admin") return "bg-primary/10 text-primary";
    if (commenterRole === "vendor") return "bg-amber-100 text-amber-700";
    return "bg-muted text-muted-foreground";
  };

  const handleSendComment = async () => {
    if (!newComment.trim() && commentImages.length === 0) return;

    setSending(true);
    try {
      let imageUrls: string[] = [];

      if (commentImages.length > 0) {
        imageUrls = await uploadImages(commentImages);
      }

      await addComment(newComment, imageUrls);
      setNewComment("");
      setCommentImages([]);
      toast.success("Comment added successfully");
    } catch (error: unknown) {
      toast.error(mapErrorToUserMessage(error, "Failed to add comment"));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background">
        <MobileHeader title="Request Details" onBack={() => navigate("/my-requests")} />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background">
        <MobileHeader title="Request Details" onBack={() => navigate("/my-requests")} />
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <p className="text-muted-foreground">Request not found</p>
          <button
            onClick={() => navigate("/my-requests")}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Back to My Requests
          </button>
        </div>
      </div>
    );
  }

  const Icon = issueIcons[request.issue_type as IssueType] || MoreHorizontal;
  const priority =
    priorityLabels[request.priority as keyof typeof priorityLabels] || priorityLabels.medium;
  const issueColor = issueColors[request.issue_type as IssueType] || issueColors.others;

  return (
    <div
      className={cn(
        "min-h-screen w-full max-w-full overflow-x-hidden bg-background md:pb-8",
        activeTab === "comments" ? "pb-44" : "pb-24"
      )}
    >
      <MobileHeader title="Request Details" onBack={() => navigate("/my-requests")} />

      <div className="w-full max-w-full overflow-x-hidden bg-card px-4 sm:px-6 lg:px-8 py-3 shadow-soft">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 min-w-0">
          <StatusBadge status={request.status as Status} />
          {request.assigned_to && (
            <span className="hidden sm:block text-sm text-muted-foreground text-right break-words">
              Assigned to:{" "}
              <span className="font-medium text-foreground">{request.assigned_to}</span>
            </span>
          )}
        </div>
      </div>

      <div className="sticky top-[72px] z-40 w-full max-w-full overflow-x-hidden bg-background border-b border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex min-w-0">
          {(["details", "comments", "updates"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 min-w-0 py-3 text-sm font-medium capitalize transition-colors relative",
                activeTab === tab
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="block truncate">{tab}</span>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="max-w-4xl mx-auto min-w-0">
          {activeTab === "details" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start gap-4 min-w-0">
                <div
                  className={cn(
                    "flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl",
                    issueColor
                  )}
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground break-words">
                    {request.title}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm min-w-0">
                    <span className="capitalize text-muted-foreground break-words">
                      {request.issue_type}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className={priority.color}>{priority.label}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-card p-4 shadow-soft sm:col-span-2 min-w-0 overflow-hidden">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed break-words">
                    {request.description}
                  </p>
                </div>

                <div className="rounded-xl bg-card p-4 shadow-soft min-w-0 overflow-hidden">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Location</h3>
                  <div className="flex items-center gap-3 text-sm min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light shrink-0">
                      <Building2 className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground break-words">{request.building}</p>
                      <p className="text-muted-foreground break-words">{request.apartment}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-card p-4 shadow-soft min-w-0 overflow-hidden">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Submitted</h3>
                  <div className="flex items-center gap-3 text-sm min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground break-words">
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {request.images && request.images.length > 0 && (
                <div className="rounded-xl bg-card p-4 shadow-soft min-w-0 overflow-hidden">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 shrink-0" />
                    Attached Images
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {request.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Attachment ${index + 1}`}
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg object-cover shadow-soft cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(img, "_blank")}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-4 w-full max-w-full">
              {comments.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No comments yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Be the first to add a comment
                  </p>
                </div>
              ) : (
                comments.map((comment, index) => {
                  const isCurrentUser =
                    normalizeText(comment.author_email) === normalizeText(user?.email);

                  const displayName = isCurrentUser
                    ? `${comment.author} (You)`
                    : comment.author;

                  const roleLabel = getCommentRoleLabel(comment.commenter_role);
                  const roleBadgeClass = getCommentRoleBadgeClass(comment.commenter_role);

                  return (
                    <div
                      key={comment.id}
                      className={cn(
                        "rounded-xl p-4 animate-fade-in w-full max-w-full overflow-hidden",
                        comment.commenter_role === "admin"
                          ? "bg-brand-light"
                          : comment.commenter_role === "vendor"
                          ? "bg-amber-50"
                          : "bg-card shadow-soft"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                            comment.commenter_role === "admin"
                              ? "bg-primary text-primary-foreground"
                              : comment.commenter_role === "vendor"
                              ? "bg-amber-500 text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {comment.author?.charAt(0)?.toUpperCase() || "U"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-medium text-foreground text-sm break-words">
                              {displayName}
                            </span>

                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full shrink-0",
                                roleBadgeClass
                              )}
                            >
                              {roleLabel}
                            </span>
                          </div>

                          {comment.message && (
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed break-words">
                              {comment.message}
                            </p>
                          )}

                          {comment.images && comment.images.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {comment.images.map((img, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={img}
                                  alt={`Attachment ${imgIndex + 1}`}
                                  className="h-20 w-20 rounded-lg object-cover shadow-soft cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(img, "_blank")}
                                />
                              ))}
                            </div>
                          )}

                          <p className="mt-2 text-xs text-muted-foreground break-words">
                            {formatTimestamp(comment.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "updates" && (
            <div className="relative w-full max-w-full overflow-hidden">
              {updates.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No updates yet</p>
                </div>
              ) : (
                <>
                  <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {updates.map((update, index) => {
                      const UpdateIcon = updateIcons[update.update_type] || Clock;

                      return (
                        <div
                          key={update.id}
                          className="relative flex gap-4 animate-fade-in min-w-0"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full z-10",
                              update.update_type === "completed"
                                ? "bg-status-completed text-primary-foreground"
                                : "bg-card shadow-soft border border-border"
                            )}
                          >
                            <UpdateIcon
                              className={cn(
                                "h-5 w-5",
                                update.update_type === "completed"
                                  ? "text-primary-foreground"
                                  : "text-muted-foreground"
                              )}
                            />
                          </div>

                          <div className="flex-1 pt-1.5 min-w-0">
                            <p className="font-medium text-foreground text-sm break-words">
                              {update.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 break-words">
                              {formatTimestamp(update.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {activeTab === "comments" && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 left-0 md:left-64 right-0 w-full max-w-full overflow-x-hidden bg-card border-t border-border px-4 py-3 sm:px-6 sm:py-4 lg:px-8 shadow-elevated z-50">
          <div className="max-w-4xl mx-auto w-full min-w-0 space-y-2 sm:space-y-3">
            <ImageUpload
              images={commentImages}
              onImagesChange={setCommentImages}
              maxImages={3}
              compact
            />

            <div className="flex gap-2 sm:gap-3 min-w-0">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[44px] sm:min-h-[48px] max-h-[100px] sm:max-h-[120px] rounded-xl border-border bg-muted/50 resize-none text-sm sm:text-base min-w-0"
                rows={1}
                disabled={sending}
              />
              <Button
                onClick={handleSendComment}
                disabled={sending || (!newComment.trim() && commentImages.length === 0)}
                className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-secondary disabled:opacity-50"
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetail;