'use client';
// UPI payment steps for one order:
//   1. shopper pays (scan QR, tap "Open UPI app", or copy the UPI ID)
//   2. shopper types the 12-digit reference number (UTR) from their payment app
//   3. admin checks it on the dashboard and clicks Verify
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from './StoreProvider';
import { UPI_ID, UPI_NAME, CANCELLED, PAYMENT_DEADLINE_HOURS, formatPrice } from '@/lib/data';

export default function UpiPayment({ orderId }) {
  const { orders, submitUpiRef } = useStore();
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [fillAmount, setFillAmount] = useState(false);
  const [copied, setCopied] = useState('');

  // Read the order from the store so this updates by itself when the admin verifies.
  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;
  if (order.status === CANCELLED) return <p className="muted">This order was cancelled, so no payment is needed.</p>;

  if (order.paymentStatus === 'Verified') {
    return <p className="ok">✓ Payment verified. Thank you!</p>;
  }
  if (order.paymentStatus === 'Submitted') {
    return <p className="upi-wait">Reference {order.upiRef} received. Waiting for the fest team to verify your payment.</p>;
  }

  // The link inside the QR. By default it does NOT fill in the amount, because many UPI apps
  // block ready-filled payments to personal UPI IDs. The shopper types the amount instead.
  const baseLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&cu=INR&tn=${order.id}`;
  const upiLink = fillAmount ? `${baseLink}&am=${Number(order.total).toFixed(2)}` : baseLink;

  // The same payment details, opened in a specific app (works on phones).
  const appQuery = upiLink.replace('upi://pay', '');

  function copy(text, label) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 1500);
    }).catch(() => {});
  }

  function submit() {
    setError(submitUpiRef(order.id, reference));
  }

  return (
    <div className="upi">
      {order.paymentNote && <p className="err" role="alert">{order.paymentNote}</p>}

      <p className="upi-amount">Pay {formatPrice(order.total)}</p>
      <p className="muted">Please pay within {PAYMENT_DEADLINE_HOURS} hours to keep your order.</p>
      <p className="muted">Step 1: pay with any UPI app (GPay, PhonePe, Paytm, BHIM…)</p>

      <div className="qr"><QRCodeSVG value={upiLink} size={170} /></div>
      <div className="row wrap">
        <a className="btn sm" href={upiLink}>Any UPI app</a>
        <a className="chip" href={`tez://upi/pay${appQuery}`}>GPay</a>
        <a className="chip" href={`phonepe://pay${appQuery}`}>PhonePe</a>
        <a className="chip" href={`paytmmp://pay${appQuery}`}>Paytm</a>
      </div>
      <p className="muted">These buttons only work on a phone with the app installed.</p>

      <p className="muted">Or pay manually to this UPI ID:</p>
      <div className="row wrap">
        <code>{UPI_ID}</code>
        <button className="chip" onClick={() => copy(UPI_ID, 'id')}>{copied === 'id' ? 'Copied' : 'Copy ID'}</button>
        <button className="chip" onClick={() => copy(String(order.total), 'amount')}>{copied === 'amount' ? 'Copied' : `Copy amount (${order.total})`}</button>
      </div>
      <p className="muted">Payee name: {UPI_NAME}. Put <b>{order.id}</b> in the payment note if your app allows it.</p>

      <label className="radio">
        <input type="checkbox" checked={fillAmount} onChange={(e) => setFillAmount(e.target.checked)} />
        Fill the amount in the QR automatically
      </label>
      <p className="muted">If your app says the payment can’t be made, leave this off and type {formatPrice(order.total)} yourself.</p>

      <p className="muted">Step 2: after paying, enter the 12-digit UTR / reference number shown in your app.</p>
      <input
        aria-label="UPI reference number"
        inputMode="numeric"
        maxLength={12}
        placeholder="12-digit reference (UTR)"
        value={reference}
        onChange={(e) => { setReference(e.target.value.replace(/\D/g, '')); setError(''); }}
      />
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn" disabled={reference.length !== 12} onClick={submit}>I’ve paid</button>
    </div>
  );
}
