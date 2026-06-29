import type { CollectionExportInput } from "@/lib/export/export-collection-markdown";

export function exportCollectionJson(collection: CollectionExportInput) {
  return JSON.stringify(collection, null, 2);
}
