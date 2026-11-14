'use client';
// The popup where a shopper customizes one product and adds it to the cart.
import { useEffect, useState } from 'react';
import Preview from './Preview';
import { useStore } from './StoreProvider';
import { getUnitPrice, formatPrice, PRINT_FEE } from '@/lib/data';

export default function Customizer({ product, onClose, initialColor }) {
  const { addToCart } = useStore();
  const colorNames = Object.keys(product.colors);

  // What the shopper has picked so far
  const [color, setColor] = useState(initialColor && product.colors[initialColor] ? initialColor : colorNames[0]);
  const [size, setSize] = useState(product.sizes.length > 1 ? product.sizes[1] : product.sizes[0]);
  const [printName, setPrintName] = useState('');
  const [printNumber, setPrintNumber] = useState('');
  const [quantity, setQuantity] = useState(1);

  const choices = { color, size, printName, printNumber };
  const price = getUnitPrice(product, choices) * quantity;

  // Close the popup when Escape is pressed.
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  function handleAdd() {
    addToCart(product.id, choices, quantity);
    onClose();
  }

  return (
    // Clicking the dark background closes the popup; clicking inside does not.
    <div className="scrim" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Customize ${product.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="stage">
          <Preview
            productId={product.id}
            color={product.colors[color]}
            printName={printName}
            printNumber={printNumber}
          />
        </div>

        <div className="controls">
          <h2>{product.name}</h2>
          <p className="muted">
            Pick your colour, then add a name or number. Printing adds {formatPrice(PRINT_FEE)}.
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

          <fieldset>
            <legend>Size</legend>
            <div className="row">
              {product.sizes.map((option) => (
                <button key={option} className="chip" aria-pressed={option === size} onClick={() => setSize(option)}>
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="two">
            <label>
              Name on print
              <input
                value={printName}
                maxLength={12}
                placeholder="Your name"
                onChange={(e) => setPrintName(e.target.value.toUpperCase())}
              />
            </label>
            <label>
              Number
              <input
                value={printNumber}
                inputMode="numeric"
                maxLength={2}
                placeholder="07"
                onChange={(e) => setPrintNumber(e.target.value.replace(/\D/g, ''))} // digits only
              />
            </label>
          </div>

          <div className="buy">
            <div className="qty">
              <button aria-label="Fewer" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
              <span>{quantity}</span>
              <button aria-label="More" onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button className="btn" onClick={handleAdd}>
              Add to cart · {formatPrice(price)}
            </button>
          </div>
        </div>

        <button className="close" aria-label="Close" onClick={onClose}>×</button>
      </div>
    </div>
  );
}
