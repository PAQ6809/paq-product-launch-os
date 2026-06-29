import type { ProductAnalysisTemplate } from "@/lib/report-builder/types";

export const productAnalysisTemplate: ProductAnalysisTemplate = {
  id: "product-analysis-v1",
  title: "Professional Product Launch Analysis Report",
  sections: [
    { id: "cover", title: "Cover", items: ["Report title", "Product name", "Prepared for", "Generated at", "Confidentiality notice"] },
    { id: "executive-summary", title: "Executive Summary", items: ["Product overview", "Core positioning", "Top 3 recommendations", "Key risks"] },
    { id: "product-profile", title: "Product Profile", items: ["Category", "Features", "Cost", "Target price", "Sales channels", "Lifecycle status"] },
    { id: "market-positioning", title: "Market Positioning", items: ["Positioning statement", "Target audience", "Pain points", "Differentiators"] },
    { id: "competitive-analysis", title: "Competitive Analysis", items: ["Competitor summary", "Price comparison", "Positioning gap", "Recommended angle"] },
    { id: "pricing-strategy", title: "Pricing Strategy", items: ["Suggested price", "Margin notes", "Promotion strategy", "Bundle opportunity"] },
    { id: "packaging-strategy", title: "Packaging Strategy", items: ["Packaging brief", "Front copy", "Back copy", "Material / visual direction", "Compliance notes"] },
    { id: "listing-copy", title: "Listing Copy", items: ["Product title", "Short description", "Long description", "SEO keywords", "Platform notes"] },
    { id: "marketing-assets", title: "Marketing Assets", items: ["Social posts", "Video scripts", "Launch checklist", "First month plan"] },
    { id: "customer-communication", title: "Customer Communication", items: ["FAQ", "Customer service scripts", "Objection handling"] },
    { id: "risk-and-compliance", title: "Risk and Compliance Notes", items: ["Legal risk notes", "Platform policy notes", "AI content review reminder"] },
    { id: "next-actions", title: "Next Actions", items: ["Priority tasks", "Owner placeholder", "Due date placeholder"] },
    { id: "appendix", title: "Appendix", items: ["AI provider metadata", "Validation status", "Reviewer notes", "Export metadata"] }
  ]
};
