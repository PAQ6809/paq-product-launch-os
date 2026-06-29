import type { HelpRelatedLink } from "@/lib/help/provider";

export function HelpRelatedLinks({ links }: { links: HelpRelatedLink[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 grid gap-2">
      <p className="text-xs font-semibold text-graphite/55">相關頁面</p>
      {links.map((link) => (
        <a
          key={`${link.href}-${link.label}`}
          href={link.href}
          className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-teal-500 hover:text-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          <span className="block break-words">{link.label}</span>
          {link.description ? (
            <span className="mt-1 block break-words font-normal leading-5 text-graphite/65">
              {link.description}
            </span>
          ) : null}
        </a>
      ))}
    </div>
  );
}
