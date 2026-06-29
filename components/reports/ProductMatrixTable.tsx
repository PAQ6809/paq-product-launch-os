import type { Product } from "@/types";

export function ProductMatrixTable({ products }: { products: Product[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-mist text-xs uppercase text-graphite/65">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Audience</th>
            <th className="px-4 py-3">Lifecycle</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-t border-line">
              <td className="px-4 py-3 font-semibold text-ink">{product.name}</td>
              <td className="px-4 py-3">{product.category}</td>
              <td className="px-4 py-3">NT${product.expectedPrice.toLocaleString("zh-TW")}</td>
              <td className="px-4 py-3">{product.targetAudience}</td>
              <td className="px-4 py-3">{product.lifecycleStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
