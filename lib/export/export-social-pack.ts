import type { LaunchReport } from "@/types/report";

const legalReminder =
  "社群素材提醒：貼文與短影音腳本需人工審核，不得使用未授權商標、角色、名人肖像、音樂或競品素材；食品、美妝、醫療、保健品不得暗示療效或保證效果。";

export function exportSocialPostPack(report: LaunchReport) {
  return [
    `社群貼文包｜${report.productName}`,
    "",
    "Campaign angle",
    report.positioning,
    "",
    "Core hashtags",
    report.seoKeywords.map((keyword) => `#${keyword.replace(/\s+/g, "")}`).join(" "),
    "",
    "Social posts",
    ...report.socialPosts.flatMap((post, index) => [
      `## Post ${index + 1}｜${post.platform}`,
      post.caption,
      "",
      post.hashtags.join(" "),
      `CTA：${post.cta}`,
      ""
    ]),
    "Short video scripts",
    ...report.videoScripts.flatMap((script, index) => [
      `## Video ${index + 1}｜${script.title}`,
      `Duration：${script.durationSeconds} 秒`,
      `Hook：${script.hook}`,
      "",
      "Scenes",
      ...script.scenes.map((scene) => `- ${scene}`),
      "",
      `CTA：${script.cta}`,
      ""
    ]),
    "First month content plan",
    ...report.firstMonthMarketingPlan.flatMap((item) => [
      `## ${item.week}｜${item.focus}`,
      ...item.actions.map((action) => `- ${action}`),
      `Metric：${item.metric}`,
      ""
    ]),
    "Legal reminder",
    legalReminder,
    ...report.packagingBrief.complianceNotes.map((note) => `- ${note}`)
  ].join("\n");
}
