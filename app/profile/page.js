'use client';
// Profile: edit your details, see your orders and pay pending UPI orders.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/components/StoreProvider';
import UpiPayment from '@/components/UpiPayment';
import { formatPrice } from '@/lib/data';

export default function ProfilePage() {
  const { currentUser, myOrders, updateProfile, logOut, isLoaded } = useStore();
  const router = useRouter();
  const [edits, setEdits] = useState({}); // only the fields the user has changed
  const [saved, setSaved] = useState(false);

  if (!isLoaded) return null;

  if (!currentUser) {
    return (
      <main className="dash">
        <div className="empty">
          <h2>You’re not logged in</h2>
          <Link className="btn" href="/login">Log in or sign up</Link>
        </div>
      </main>
    );
  }

  const values = { name: currentUser.name, roll: currentUser.roll, phone: currentUser.phone || '', ...edits };
  const change = (field) => (event) => { setEdits({ ...edits, [field]: event.target.value }); setSaved(false); };

  function save() {
    updateProfile(values);
    setEdits({});
    setSaved(true);
  }

  function logOutAndLeave() {
    logOut();
    router.push('/');
  }

  return (
    <main className="dash">
      <h1>Your profile</h1>
      {currentUser.isAdmin && <p className="ok">Admin account · <Link href="/dashboard">open order dashboard</Link></p>}

      <div className="form profile-form">
        <label>Name<input value={values.name} onChange={change('name')} /></label>
        <label>Roll number<input value={values.roll} onChange={change('roll')} /></label>
        <label>Phone<input value={values.phone} inputMode="tel" onChange={change('phone')} /></label>
        <label>Email<input value={currentUser.email} disabled /></label>
        <div className="row">
          <button className="btn sm" onClick={save}>Save changes</button>
          <button className="btn sm" onClick={logOutAndLeave}>Log out</button>
          {saved && <span className="ok">Saved</span>}
        </div>
      </div>

      <h2>Your orders</h2>
      {myOrders.length === 0 ? (
        <div className="empty"><p>No orders yet.</p><Link className="btn" href="/">Go to the shop</Link></div>
      ) : (
        myOrders.map((order) => (
          <section key={order.id} className="tablewrap track">
            <div className="track-head">
              <h3>{order.id} · {formatPrice(order.total)}</h3>
              <span className="chip">{order.status}</span>
            </div>
            <p className="muted">
              {new Date(order.date).toLocaleDateString('en-IN')} · {order.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
            </p>
            {order.customer.payment === 'UPI'
              ? <UpiPayment orderId={order.id} />
              : <p className="muted">Pay at the fest desk when you collect it.</p>}
            <Link href="/track">Track this order</Link>
          </section>
        ))
      )}
    </main>
  );
}
