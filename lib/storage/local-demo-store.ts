import { sampleProducts } from "@/data/sample-products";
import type { NewProductDraft, Product } from "@/types";

const STORAGE_KEY = "paq-product-launch-os:v0.2:products";
const STORAGE_VERSION = 2;
const FALLBACK_IMAGE_URL = "/hero-workspace.png";

type StoredProductState = {
  version: number;
  products: Product[];
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") {
    return false;
  }

  const product = value as Partial<Product>;
  return Boolean(
    product.id &&
      product.name &&
      product.category &&
      Array.isArray(product.salesPlatforms) &&
      product.lifecycleStatus
  );
}

function mergeWithDemoProducts(products: Product[]) {
  const byId = new Map<string, Product>();

  sampleProducts.forEach((product) => byId.set(product.id, product));
  products.forEach((product) => byId.set(product.id, product));

  return Array.from(byId.values());
}

function readRawProducts(): Product[] {
  if (!canUseLocalStorage()) {
    return sampleProducts;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return sampleProducts;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredProductState>;
    const products = Array.isArray(parsed.products) ? parsed.products.filter(isProduct) : [];

    return products.length > 0 ? mergeWithDemoProducts(products) : sampleProducts;
  } catch {
    return sampleProducts;
  }
}

export function saveDemoProducts(products: Product[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  const state: StoredProductState = {
    version: STORAGE_VERSION,
    products: mergeWithDemoProducts(products)
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadDemoProducts() {
  const products = mergeWithDemoProducts(readRawProducts());
  saveDemoProducts(products);
  return products;
}

export function findDemoProduct(id: string) {
  return loadDemoProducts().find((product) => product.id === id) ?? null;
}

export function upsertDemoProduct(product: Product) {
  const current = loadDemoProducts();
  const next = current.some((item) => item.id === product.id)
    ? current.map((item) => (item.id === product.id ? product : item))
    : [product, ...current];

  saveDemoProducts(next);
  return next;
}

export function parseMoney(value: string) {
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseSalesChannels(value: string) {
  return value
    .split(/[,，、\n]/)
    .map((channel) => channel.trim())
    .filter(Boolean);
}

function createProductId(productName: string) {
  const asciiSlug = productName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return asciiSlug || `demo-product-${Date.now()}`;
}

export function createProductFromDraft(draft: NewProductDraft): Product {
  const name = draft.name.trim() || "未命名商品";
  const cost = parseMoney(draft.cost);
  const expectedPrice = parseMoney(draft.expectedPrice);

  return {
    id: createProductId(name),
    name,
    category: draft.category,
    features: draft.features.trim() || "請補上商品功能與特色",
    cost,
    expectedPrice,
    targetAudience: draft.targetAudience.trim() || "請補上目標客群",
    brandStyle: draft.brandStyle.trim() || "乾淨、可信任、容易理解",
    salesPlatforms: parseSalesChannels(draft.salesChannels),
    lifecycleStatus: "positioning",
    imageUrl: FALLBACK_IMAGE_URL,
    createdAt: new Date().toISOString(),
    latestReportTitle: `${name} 商品上市企劃書`,
    pendingReviewCount: 19
  };
}
