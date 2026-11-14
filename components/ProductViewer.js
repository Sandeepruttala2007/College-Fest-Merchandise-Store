'use client';
// Product page content that reacts to clicks: the picture changes colour when a
// swatch is chosen, and the customize popup opens with that colour already picked.
import { useState } from 'react';
import Preview from './Preview';
import Customizer from './Customizer';
import { PRINT_FEE, SIZE_GUIDE, formatPrice } from '@/lib/data';

export default function ProductViewer({ product }) {
  const colorNames = Object.keys(product.colors);
  const [color, setColor] = useState(colorNames[0]);
  const [open, setOpen] = useState(false);

  return (
    <div className="product-layout">
      <div className="stage">
        <Preview productId={product.id} color={product.colors[color]} />
      </div>

      <div>
        {product.badge && <span className="badge static">{product.badge}</span>}
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <p>
          <b>{formatPrice(product.price)}</b>{' '}
          <span className="muted">+ {formatPrice(PRINT_FEE)} if you add a name or number</span>
        </p>

        <fieldset>
          <legend>Colour: {color}</legend>
          <div className="row">
            {colorNames.map((name) => (
              <button
                key={name}
                className="swatch"
                aria-label={name}
                aria-pressed={name === color}
                style={{ background: product.colors[name] }}
                onClick={() => setColor(name)}
              />
            ))}
          </div>
        </fieldset>

        <h3>Details</h3>
        <ul className="features">
          {product.features.map((feature) => <li key={feature}>{feature}</li>)}
        </ul>
        <p className="muted">Sizes: {product.sizes.join(', ')}</p>

        {product.category === 'Clothing' && (
          <table className="size-table">
            <thead><tr><th>Size</th><th>Chest</th></tr></thead>
            <tbody>
              {Object.entries(SIZE_GUIDE).map(([size, chest]) => (
                <tr key={size}><td>{size}</td><td>{chest}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        <p><button className="btn" onClick={() => setOpen(true)}>Customize and add to cart</button></p>
      </div>

      {open && <Customizer product={product} initialColor={color} onClose={() => setOpen(false)} />}
    </div>
  );
}
