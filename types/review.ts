export type ReportReviewStatus = "draft" | "reviewed" | "approved" | "rejected";

export type ReviewAction = "edit" | "approve" | "reject";

export type ReviewedReportSection = {
  id: string;
  title: string;
  content: string;
  originalContent: string;
  riskLevel: "low" | "medium" | "high";
  reviewStatus: ReportReviewStatus;
  humanEdited: boolean;
  updatedAt?: string;
};

export type ReportAuditLogEntry = {
  id: string;
  actorName: string;
  sectionId: string;
  sectionTitle: string;
  action: ReviewAction;
  createdAt: string;
  originalAIContent: string;
  previousContent: string;
  newContent: string;
  nextStatus: ReportReviewStatus;
};
