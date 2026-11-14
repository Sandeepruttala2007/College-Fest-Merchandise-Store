'use client';
// Home page: hero banner, category filter, sorting and the product grid.
import { useState } from 'react';
import Link from 'next/link';
import Preview from '@/components/Preview';
import Customizer from '@/components/Customizer';
import { PRODUCTS, COUPONS, formatPrice } from '@/lib/data';

const CATEGORIES = ['All', ...new Set(PRODUCTS.map((product) => product.category))];

export default function HomePage() {
  // The product being customized right now (null = popup closed).
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [search, setSearch] = useState('');

  // Filter by category, then sort. "featured" keeps the order from lib/data.js.
  const visibleProducts = PRODUCTS
    .filter((product) => category === 'All' || product.category === category)
    .filter((product) => (product.name + ' ' + product.description).toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'low') return a.price - b.price;
      if (sortBy === 'high') return b.price - a.price;
      return 0;
    });

  return (
    <main>
      <section className="hero">
        <div>
          <h1>Wear the fest before it starts.</h1>
          <p>Official LPU’26 merch, printed with your name and number. Orders close two days before the opening night.</p>
          <p className="codes">Use {Object.keys(COUPONS).join(', ')} at checkout.</p>
        </div>
        <div className="hero-art">
          <Preview productId="tee" color="#FFB800" printName="YOUR NAME" printNumber="26" />
        </div>
      </section>

      {/* scrolling strip between the hero and the shop */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1, 2, 3].map((i) => (
            <span key={i}>★ PRINT YOUR NAME &amp; NUMBER ★ USE FEST10 FOR 10% OFF ★ FREE PICKUP AT THE FEST DESK ★ LIMITED STOCK</span>
          ))}
        </div>
      </div>

      <div className="toolbar shop-bar">
        <div className="row wrap">
          {CATEGORIES.map((name) => (
            <button key={name} className="chip" aria-pressed={category === name} onClick={() => setCategory(name)}>
              {name}
            </button>
          ))}
        </div>
        <input aria-label="Search products" placeholder="Search merch" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Sort products" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="featured">Featured</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>

      <section className="grid" aria-label="Products">
        {visibleProducts.map((product, index) => {
          const colorList = Object.values(product.colors);
          return (
            <article key={product.id} className="card" style={{ '--tilt': index % 2 ? '1deg' : '-1deg' }}>
              {product.badge && <span className="badge">{product.badge}</span>}
              {/* "33" at the end makes the colour see-through */}
              <div className="art" style={{ background: colorList[colorList.length - 1] + '33' }}>
                <Preview productId={product.id} color={colorList[0]} />
              </div>
              <h3><Link href={`/product/${product.id}`}>{product.name}</Link></h3>
              <p className="muted">{product.description}</p>
              <div className="foot">
                <b>from {formatPrice(product.price)}</b>
                <button className="btn sm" onClick={() => setSelectedProduct(product)}>Customize</button>
              </div>
            </article>
          );
        })}
      </section>

      {visibleProducts.length === 0 && (
        <div className="empty shop-empty">
          <h2>No products found</h2>
          <p>Try another word or category.</p>
        </div>
      )}

      {selectedProduct && (
        <Customizer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </main>
  );
}
