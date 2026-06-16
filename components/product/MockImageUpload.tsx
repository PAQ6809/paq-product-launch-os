"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";

export function MockImageUpload() {
  const [fileName, setFileName] = useState("");
  const previewLabel = useMemo(() => fileName || "尚未選擇圖片", [fileName]);

  return (
    <div className="grid gap-3 rounded-md border border-dashed border-line bg-mist p-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-white">
        <Image
          src="/hero-workspace.png"
          alt="商品圖片 mock preview"
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          className="object-cover"
        />
        <div className="absolute bottom-3 left-3 rounded-md bg-white/90 px-3 py-2 text-xs font-semibold text-ink shadow">
          Mock preview
        </div>
      </div>
      <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-teal-500 hover:text-teal-600">
        <ImagePlus size={17} aria-hidden="true" />
        上傳商品圖片
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
        />
      </label>
      <p className="text-xs leading-5 text-graphite/70">
        {previewLabel}。v0.2 先保留前端預覽與 mock image URL，尚未接 Supabase Storage 或 R2。
      </p>
    </div>
  );
}
