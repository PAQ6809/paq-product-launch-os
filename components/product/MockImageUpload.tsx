"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";

export function MockImageUpload() {
  const t = useTranslations("form");
  const [fileName, setFileName] = useState("");
  const previewLabel = useMemo(() => fileName || t("noImage"), [fileName, t]);

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
      <label htmlFor="product-image" className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-center text-sm font-semibold text-ink transition hover:border-teal-500 hover:text-teal-600 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal-600">
        <ImagePlus size={17} aria-hidden="true" />
        {t("upload")}
        <input
          id="product-image"
          name="productImage"
          type="file"
          accept="image/*"
          className="sr-only"
          aria-describedby="product-image-hint"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
        />
      </label>
      <p id="product-image-hint" className="break-all text-xs leading-5 text-graphite/70">
        {previewLabel}. Demo preview uses a local image URL.
      </p>
    </div>
  );
}
