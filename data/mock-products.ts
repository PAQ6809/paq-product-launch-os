import { sampleProducts } from "@/data/sample-products";

export const mockProducts = sampleProducts;

export function getProductById(id: string) {
  return mockProducts.find((product) => product.id === id) ?? mockProducts[0];
}
