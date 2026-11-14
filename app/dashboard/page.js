'use client';
// Order dashboard: summary numbers, a status filter and the orders table.
import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/components/StoreProvider';
import { ORDER_STATUSES, CANCELLED, PAYMENT_DEADLINE_HOURS, formatPrice } from '@/lib/data';

export default function DashboardPage() {
  const { orders, isLoaded, changeOrderStatus, currentUser, verifyPayment, rejectPayment } = useStore();
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Only admin accounts (see ADMIN_EMAILS in lib/data.js) can see this page.
  if (isLoaded && !currentUser?.isAdmin) {
    return (
      <main className="dash">
        <div className="empty">
          <h2>Admins only</h2>
          <p>Log in with an admin account to see all orders.</p>
          <Link className="btn" href="/login">Log in</Link>
        </div>
      </main>
    );
  }

  // Filter by status chip, then by the search box (order id, name or roll number).
  const searchText = search.trim().toLowerCase();
  const visibleOrders = orders
    .filter((order) => statusFilter === 'All' || order.status === statusFilter)
    .filter((order) => paymentFilter === 'All' || order.paymentStatus === paymentFilter)
    .filter((order) =>
      !searchText ||
      [order.id, order.customer.name, order.customer.roll].some((field) => field.toLowerCase().includes(searchText))
    );

  // Summary numbers
  const activeOrders = orders.filter((order) => order.status !== CANCELLED); // cancelled orders don't count
  const revenue = activeOrders.reduce((sum, order) => sum + order.total, 0);
  const received = activeOrders
    .filter((order) => order.paymentStatus === 'Verified')
    .reduce((sum, order) => sum + order.total, 0);
  const toVerify = orders.filter((order) => order.paymentStatus === 'Submitted').length;
  const notHandedOver = activeOrders.filter((order) => order.status !== 'Collected').length;

  // Best seller = product with the most units across all orders.
  const unitsByProduct = {};
  orders.forEach((order) =>
    order.items.forEach((item) => {
      unitsByProduct[item.productName] = (unitsByProduct[item.productName] || 0) + item.quantity;
    })
  );
  const bestSeller = Object.entries(unitsByProduct).sort((a, b) => b[1] - a[1])[0];

  // Downloads the orders currently shown as a CSV file (opens in Excel / Sheets).
  function exportCsv() {
    const rows = [['Order', 'Date', 'Name', 'Roll', 'Email', 'Payment', 'Payment status', 'UTR', 'Items', 'Coupon', 'Total', 'Status']];
    visibleOrders.forEach((o) =>
      rows.push([
        o.id, new Date(o.date).toLocaleDateString('en-IN'), o.customer.name, o.customer.roll,
        o.customer.email, o.customer.payment || '', o.paymentStatus || '', o.upiRef || '',
        o.items.map((i) => `${i.quantity}x ${i.productName}`).join('; '), o.coupon, o.total, o.status,
      ])
    );
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'lpu26-orders.csv';
    link.click();
  }

  // Marking an order "Collected" needs the handover code the customer was shown.
  function updateStatus(order, newStatus) {
    if (newStatus === 'Collected' && order.pickupCode) {
      const typed = window.prompt('Enter the 4-digit handover code from the customer:');
      if (typed === null) return; // pressed cancel
      if (typed.trim() !== order.pickupCode) {
        window.alert('Wrong code. The order was not marked as collected.');
        return;
      }
    }
    changeOrderStatus(order.id, newStatus);
  }

  function isOverdue(order) {
    const hoursOld = (Date.now() - new Date(order.date).getTime()) / (60 * 60 * 1000);
    return order.paymentStatus === 'Pending' && order.status !== CANCELLED && hoursOld > PAYMENT_DEADLINE_HOURS;
  }

  return (
    <main className="dash">
      <h1>Order dashboard</h1>

      <div className="stats">
        <div><span>{orders.length}</span>orders</div>
        <div><span>{formatPrice(revenue)}</span>order value</div>
        <div><span>{formatPrice(received)}</span>payments received</div>
        <div><span>{toVerify}</span>to verify</div>
        <div><span>{notHandedOver}</span>still to hand over</div>
        <div><span>{bestSeller ? bestSeller[0] : '–'}</span>best seller</div>
      </div>

      <div className="toolbar">
        <input
          aria-label="Search orders"
          placeholder="Search by order ID, name or roll number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn sm" onClick={exportCsv} disabled={visibleOrders.length === 0}>
          Download CSV
        </button>
      </div>

      <div className="row wrap">
        {['All', ...ORDER_STATUSES, CANCELLED].map((status) => (
          <button key={status} className="chip" aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)}>
            {status}
          </button>
        ))}
      </div>

      <div className="row wrap" style={{ marginTop: '.6rem' }}>
        <span className="muted">Payment:</span>
        {['All', 'Pending', 'Submitted', 'Verified', 'Pay at desk'].map((status) => (
          <button key={status} className="chip" aria-pressed={paymentFilter === status} onClick={() => setPaymentFilter(status)}>
            {status}
          </button>
        ))}
      </div>

      {isLoaded && visibleOrders.length === 0 ? (
        <div className="empty">
          <h2>{orders.length ? `No orders marked “${statusFilter}”` : 'No orders yet'}</h2>
          <p>{orders.length ? 'Pick another status above.' : 'Orders appear here as soon as someone checks out.'}</p>
          {orders.length === 0 && <Link className="btn" href="/">Go to the shop</Link>}
        </div>
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <b>{order.id}</b>
                    <div className="muted">{new Date(order.date).toLocaleDateString('en-IN')}</div>
                  </td>
                  <td>
                    {order.customer.name}
                    <div className="muted">{order.customer.roll}{order.customer.payment && ` · ${order.customer.payment}`}</div>
                    {order.delivery && <div className="muted">{order.delivery}</div>}
                    {order.note && <div className="muted">Note: {order.note}</div>}
                  </td>
                  <td>
                    {order.items.map((item, index) => {
                      const printText = [item.printName, item.printNumber].filter(Boolean).join(' ');
                      return (
                        <div key={index}>
                          {item.quantity}× {item.productName} ({item.color}, {item.size})
                          {printText && <span className="muted"> “{printText}”</span>}
                        </div>
                      );
                    })}
                  </td>
                  <td>
                    {formatPrice(order.total)}
                    {order.coupon && <div className="muted">{order.coupon} −{formatPrice(order.discount)}</div>}
                  </td>
                  <td>
                    <select
                      aria-label={`Status for ${order.id}`}
                      value={order.status}
                      data-status={order.status}
                      onChange={(e) => updateStatus(order, e.target.value)}
                    >
                      {[...ORDER_STATUSES, CANCELLED].map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <div className="muted">{order.paymentStatus}{order.upiRef && ` · ${order.upiRef}`}</div>
                    {isOverdue(order) && <div className="err">Unpaid for over {PAYMENT_DEADLINE_HOURS} hours</div>}
                    {order.paymentStatus === 'Submitted' && (
                      <div className="row wrap">
                        <button className="btn sm" onClick={() => verifyPayment(order.id)}>Verify</button>
                        <button className="btn sm" onClick={() => rejectPayment(order.id)}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
