'use client';
// "Track my order": shows a timeline with the time of each step,
// a plain-English message, and the full price breakdown.
// Orders are saved in this browser only (no backend yet), so this works
// on the device that placed the order.
import { useState } from 'react';
import { useStore } from '@/components/StoreProvider';
import Preview from '@/components/Preview';
import UpiPayment from '@/components/UpiPayment';
import { PRODUCTS, ORDER_STATUSES, STATUS_MESSAGES, CANCELLED, formatPrice } from '@/lib/data';

function formatTime(isoDate) {
  return new Date(isoDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function TrackPage() {
  const { orders, myOrders, currentUser, cancelOrder } = useStore();
  const [orderId, setOrderId] = useState('');
  const [roll, setRoll] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  // Look the order up from the live list, so status changes show up instantly.
  const order = orders.find((o) => o.id === selectedId);

  function findOrder() {
    const match = orders.find(
      (o) =>
        o.id === orderId.trim().toUpperCase() &&
        o.customer.roll.trim().toLowerCase() === roll.trim().toLowerCase()
    );
    setNotFound(!match);
    setSelectedId(match ? match.id : null);
  }

  function openRecent(id) {
    setNotFound(false);
    setSelectedId(id);
  }

  function copyId() {
    navigator.clipboard?.writeText(order.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  // When did each status happen? Older orders without history fall back to the order date.
  function timeOf(status, index) {
    const entry = (order.history || []).find((h) => h.status === status);
    if (entry) return formatTime(entry.at);
    return index === 0 ? formatTime(order.date) : '';
  }

  const currentStep = order ? ORDER_STATUSES.indexOf(order.status) : -1;
  const progress = order ? Math.round(((currentStep + 1) / ORDER_STATUSES.length) * 100) : 0;

  // Rough estimate: orders are usually ready 3 days after they are placed.
  const readyBy = order
    ? new Date(new Date(order.date).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';

  // Only the owner can cancel, and only before the order is printed or paid.
  const canCancel =
    order && currentUser?.email === order.userEmail && order.status === ORDER_STATUSES[0] && order.paymentStatus !== 'Verified';

  return (
    <main className="dash">
      <h1>Track your order</h1>

      {myOrders.length > 0 && (
        <div className="recent">
          <p className="muted">Orders placed on this device</p>
          <div className="row wrap">
            {myOrders.slice(0, 5).map((o) => (
              <button key={o.id} className="chip" aria-pressed={selectedId === o.id} onClick={() => openRecent(o.id)}>
                {o.id} · {o.status}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="muted">Or look one up with the order ID and roll number.</p>
      <div className="toolbar">
        <input aria-label="Order ID" placeholder="Order ID (e.g. LP4K2X9A)" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
        <input aria-label="Roll number" placeholder="Roll number" value={roll} onChange={(e) => setRoll(e.target.value)} />
        <button className="btn sm" disabled={!orderId.trim() || !roll.trim()} onClick={findOrder}>Find order</button>
      </div>

      {notFound && (
        <div className="empty">
          <h2>No matching order</h2>
          <p>Check the order ID and roll number. Orders placed on another device won’t show up here.</p>
        </div>
      )}

      {order && (
        <section className="tablewrap track" aria-live="polite">
          <div className="track-head">
            <h2>Order {order.id}</h2>
            <div className="row">
              <span className="live">● Live</span>
              <button className="chip" onClick={copyId}>{copied ? 'Copied' : 'Copy ID'}</button>
              <button className="chip" onClick={() => window.print()}>Print receipt</button>
            </div>
          </div>
          <p className="status-msg"><b>{order.status}.</b> {STATUS_MESSAGES[order.status]}</p>
          {order.status !== 'Ready for pickup' && order.status !== 'Collected' && order.status !== CANCELLED && (
            <p className="muted">Estimated ready by {readyBy}</p>
          )}
          {order.pickupCode && order.status !== 'Collected' && order.status !== CANCELLED && (
            <p className="code-box">Handover code <b>{order.pickupCode}</b> <span className="muted">Tell this to the volunteer when you collect.</span></p>
          )}
          <div className="bar" aria-hidden="true"><span style={{ width: progress + '%' }} /></div>

          {order.status !== CANCELLED && (
          <ol className="timeline">
            {ORDER_STATUSES.map((status, index) => (
              <li key={status} data-state={index < currentStep ? 'done' : index === currentStep ? 'current' : 'todo'}>
                <b>{status}</b>
                <span className="muted">{timeOf(status, index) || 'Waiting'}</span>
              </li>
            ))}
          </ol>
          )}

          <h3>What you ordered</h3>
          {order.items.map((item, index) => {
            const product = PRODUCTS.find((p) => p.name === item.productName);
            const printText = [item.printName, item.printNumber].filter(Boolean).join(' ');
            return (
              <div key={index} className="track-item">
                {product && (
                  <div className="thumb">
                    <Preview productId={product.id} color={product.colors[item.color]} printName={item.printName} printNumber={item.printNumber} />
                  </div>
                )}
                <div>
                  <b>{item.quantity}× {item.productName}</b>
                  <div className="muted">{item.color}, {item.size}{printText && ` · prints “${printText}”`}</div>
                </div>
              </div>
            );
          })}

          <dl className="sum">
            <div><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
            {order.discount > 0 && <div><dt>Coupon {order.coupon}</dt><dd>−{formatPrice(order.discount)}</dd></div>}
            {order.deliveryFee > 0 && <div><dt>Delivery</dt><dd>{formatPrice(order.deliveryFee)}</dd></div>}
            <div className="grand"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
          </dl>
          <p className="muted">Delivery: {order.delivery || 'Collect at fest desk'}</p>
          {order.note && <p className="muted">Your note: {order.note}</p>}

          <h3>Payment</h3>
          <p className="muted">{order.customer.payment}{order.paymentStatus ? ` · ${order.paymentStatus}` : ''}</p>
          {order.upiRef && <p className="muted">UPI reference: {order.upiRef}</p>}
          {order.customer.payment === 'UPI' && <UpiPayment orderId={order.id} />}

          {canCancel && (
            <p>
              <button className="btn sm" onClick={() => { if (window.confirm('Cancel this order? This cannot be undone.')) cancelOrder(order.id); }}>
                Cancel order
              </button>
            </p>
          )}
        </section>
      )}
    </main>
  );
}
