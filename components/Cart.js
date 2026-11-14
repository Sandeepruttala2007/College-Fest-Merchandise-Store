'use client';
// The cart drawer: items, coupon box, totals and the checkout form.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from './StoreProvider';
import Preview from './Preview';
import UpiPayment from './UpiPayment';
import { COUPONS, PAYMENT_METHODS, DELIVERY_OPTIONS, MAX_QUANTITY, FREE_DELIVERY_ABOVE, getDeliveryFee, formatPrice } from '@/lib/data';

// "ASHA 07" from the shopper's print choices (empty string if none).
function describePrint(choices) {
  return [choices.printName, choices.printNumber].filter(Boolean).join(' ');
}

export default function Cart() {
  const store = useStore();
  const [typedCoupon, setTypedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [payment, setPayment] = useState(PAYMENT_METHODS[0]);
  const [placedOrder, setPlacedOrder] = useState(null); // set after checkout
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [note, setNote] = useState('');

  // Escape closes the drawer.
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') store.setIsCartOpen(false);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [store.setIsCartOpen]);

  if (!store.isCartOpen) return null;

  const couponIsApplied = store.couponCode && store.couponResult?.valid;

  // The closest coupon the shopper has not unlocked yet (used for the nudge bar).
  const lockedCoupon = Object.entries(COUPONS)
    .filter(([, coupon]) => coupon.minimumSpend && coupon.minimumSpend > store.subtotal)
    .sort((a, b) => a[1].minimumSpend - b[1].minimumSpend)[0];

  function closeCart() {
    store.setIsCartOpen(false);
    setPlacedOrder(null);
    setNote('');
  }

  // The logged-in user's details go on the order.
  async function placeNow() {
    const { name, email, roll } = store.currentUser;
    setOrderError('');
    setPlacing(true);
    try {
      setPlacedOrder(await store.placeOrder({ name, email, roll, payment, note }));
    } catch (error) {
      setOrderError(error.message);
    }
    setPlacing(false);
  }

  function tryCoupon(code) {
    setCouponError(store.applyCoupon(code));
  }

  // ----- What to show inside the drawer -----

  let content;

  if (placedOrder) {
    // 1) Order just placed
    content = (
      <div className="done">
        <h2>Order {placedOrder.id} is in.</h2>
        {placedOrder.customer.payment === 'UPI' ? (
          <UpiPayment orderId={placedOrder.id} />
        ) : (
          <p>Pay at the fest desk when you collect it. We’ll print it and update the status.</p>
        )}
        <Link className="btn" href="/track" onClick={closeCart}>Track this order</Link>
      </div>
    );
  } else if (store.cartLines.length === 0) {
    // 2) Nothing in the cart
    content = (
      <div className="done">
        <h2>Your cart is empty</h2>
        <p>Pick a tee or hoodie and make it yours.</p>
        <button className="btn" onClick={closeCart}>Browse merch</button>
      </div>
    );
  } else {
    // 3) Normal cart
    content = (
      <>
        <div className="track-head">
          <h2>Your cart</h2>
          <button className="link" onClick={store.clearCart}>Clear cart</button>
        </div>

        <ul className="lines">
          {store.cartLines.map((line) => (
            <li key={line.key}>
              <div className="thumb">
                <Preview
                  productId={line.productId}
                  color={line.product.colors[line.choices.color]}
                  printName={line.choices.printName}
                  printNumber={line.choices.printNumber}
                />
              </div>
              <div className="info">
                <strong>{line.product.name}</strong>
                <div className="muted">
                  {line.choices.color}, {line.choices.size}
                  {describePrint(line.choices) && ` · prints “${describePrint(line.choices)}”`}
                </div>
                <div className="qty sm">
                  <button aria-label="Fewer" onClick={() => store.changeQuantity(line.key, line.quantity - 1)}>−</button>
                  <span>{line.quantity}</span>
                  <button
                    aria-label="More"
                    disabled={line.quantity >= MAX_QUANTITY}
                    title={line.quantity >= MAX_QUANTITY ? `Maximum ${MAX_QUANTITY} per item` : ''}
                    onClick={() => store.changeQuantity(line.key, line.quantity + 1)}
                  >+</button>
                </div>
                <button className="link remove" onClick={() => store.changeQuantity(line.key, 0)}>Remove</button>
              </div>
              <b>{formatPrice(line.unitPrice * line.quantity)}</b>
            </li>
          ))}
        </ul>

        {lockedCoupon && (
          <div className="nudge">
            Add {formatPrice(lockedCoupon[1].minimumSpend - store.subtotal)} more to unlock {lockedCoupon[0]}: {lockedCoupon[1].description}
            <progress max={lockedCoupon[1].minimumSpend} value={store.subtotal} />
          </div>
        )}

        <div className="coupon">
          {couponIsApplied ? (
            <p className="ok">
              {store.couponCode} applied: {COUPONS[store.couponCode].description}.{' '}
              <button className="link" onClick={store.removeCoupon}>Remove</button>
            </p>
          ) : (
            <>
              <div className="row">
                <input
                  aria-label="Coupon code"
                  placeholder="Coupon code"
                  value={typedCoupon}
                  onChange={(e) => setTypedCoupon(e.target.value)}
                />
                <button className="btn sm" onClick={() => tryCoupon(typedCoupon)}>Apply</button>
              </div>
              {/* Shows "not found", or "add ₹X more" when the minimum isn't reached */}
              <p className="err">{couponError || (store.couponCode && store.couponResult?.message)}</p>
              <div className="row wrap">
                {Object.entries(COUPONS).map(([code, coupon]) => (
                  <button key={code} className="chip" title={coupon.description} onClick={() => tryCoupon(code)}>
                    {code}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <fieldset className="delivery">
          <legend>How do you want it?</legend>
          {DELIVERY_OPTIONS.map((option) => (
            <label key={option.id} className="radio">
              <input
                type="radio"
                name="delivery"
                checked={store.deliveryOption.id === option.id}
                onChange={() => store.setDeliveryId(option.id)}
              />
              {option.label} <span className="muted">{getDeliveryFee(option, store.subtotal - store.discount) ? formatPrice(option.fee) : 'Free'}</span>
            </label>
          ))}
        </fieldset>
        {store.deliveryOption.fee > 0 && store.deliveryFee > 0 && (
          <p className="muted">Add {formatPrice(FREE_DELIVERY_ABOVE - (store.subtotal - store.discount))} more for free hostel delivery.</p>
        )}

        <dl className="sum">
          <div><dt>Subtotal</dt><dd>{formatPrice(store.subtotal)}</dd></div>
          {store.discount > 0 && <div><dt>Coupon</dt><dd>−{formatPrice(store.discount)}</dd></div>}
          {store.deliveryFee > 0 && <div><dt>Hostel delivery</dt><dd>{formatPrice(store.deliveryFee)}</dd></div>}
          <div className="grand"><dt>Total</dt><dd>{formatPrice(store.total)}</dd></div>
        </dl>

        {store.currentUser ? (
          <div className="form">
            <p className="muted">Ordering as <b>{store.currentUser.name}</b> ({store.currentUser.roll})</p>
            <textarea
              aria-label="Note for the print shop"
              placeholder="Note for the print shop (optional)"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <select aria-label="Payment method" value={payment} onChange={(e) => setPayment(e.target.value)}>
              {PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}
            </select>
            {orderError && <p className="err" role="alert">{orderError}</p>}
            <button className="btn" onClick={placeNow} disabled={placing}>
              {placing ? 'Placing order…' : `Place order · ${formatPrice(store.total)}`}
            </button>
          </div>
        ) : (
          <div className="form">
            <p>Log in to place your order. Your cart will be waiting.</p>
            <Link className="btn" href="/login" onClick={closeCart}>Log in or sign up</Link>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="scrim right" onClick={closeCart}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Cart" onClick={(e) => e.stopPropagation()}>
        <button className="close" aria-label="Close cart" onClick={closeCart}>×</button>
        {content}
      </aside>
    </div>
  );
}
