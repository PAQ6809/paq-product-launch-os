import { Button } from "@/components/ui/Button";

const quickPrompts = [
  "如何建立產品？",
  "報告可以匯出哪些格式？",
  "為什麼我需要登入？",
  "草稿會自動保存嗎？",
  "我的資料安全嗎？",
  "如何建立多產品報告書？"
];

export function HelpQuickPrompts({
  disabled,
  onSelect
}: {
  disabled?: boolean;
  onSelect: (prompt: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {quickPrompts.map((prompt) => (
        <Button
          key={prompt}
          variant="secondary"
          size="sm"
          className="justify-start text-left"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
        >
          {prompt}
        </Button>
      ))}
    </div>
  );
}
