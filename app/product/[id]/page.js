// Product details page. A dynamic route: /product/tee, /product/hoodie, ...
// This is a SERVER component (no 'use client'), so it runs on the server.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductViewer from '@/components/ProductViewer';
import { PRODUCTS } from '@/lib/data';

// Tells Next.js which product pages to build ahead of time.
export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ id: product.id }));
}

// Gives every product page its own browser-tab title.
export function generateMetadata({ params }) {
  const product = PRODUCTS.find((p) => p.id === params.id);
  return { title: product ? `${product.name} | LPU’26 Merch` : 'Product not found' };
}

export default function ProductPage({ params }) {
  const product = PRODUCTS.find((p) => p.id === params.id);
  if (!product) notFound(); // shows app/not-found.jsx

  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id);

  return (
    <main className="dash">
      <Link href="/">← Back to shop</Link>

      {/* The interactive part (colour switcher, customize button) is a client component. */}
      <ProductViewer product={product} />

      {related.length > 0 && (
        <section>
          <h2>More {product.category.toLowerCase()}</h2>
          <div className="row wrap">
            {related.map((p) => (
              <Link key={p.id} className="chip" href={`/product/${p.id}`}>{p.name}</Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
