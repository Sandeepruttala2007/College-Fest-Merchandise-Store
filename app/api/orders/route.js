// POST /api/orders
// Builds the order on the server. Prices, coupon and delivery fee are worked out here,
// so changing numbers in the browser cannot change what the shopper is charged.
import { NextResponse } from 'next/server';
import {
  PRODUCTS, DELIVERY_OPTIONS, PAYMENT_METHODS, ORDER_STATUSES, MAX_QUANTITY, getUnitPrice, getDeliveryFee, checkCoupon,
} from '@/lib/data';

const fail = (message) => NextResponse.json({ error: message }, { status: 400 });

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail('Invalid request.');
  }
  const { items, couponCode, deliveryId, customer } = body;

  // 1) Check what was sent
  if (!Array.isArray(items) || items.length === 0) return fail('Your cart is empty.');
  if (!customer?.name || !customer?.email || !customer?.roll) return fail('Missing customer details.');
  if (!PAYMENT_METHODS.includes(customer.payment)) return fail('Choose a valid payment method.');

  // 2) Check every item and price it
  const lines = [];
  for (const item of items) {
    const product = PRODUCTS.find((p) => p.id === item.productId);
    const quantity = Number(item.quantity);
    const raw = item.choices || {};
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return fail('One of the items is invalid.');
    if (!(raw.color in product.colors) || !product.sizes.includes(raw.size)) return fail(`Invalid colour or size for ${product.name}.`);

    const choices = {
      color: raw.color,
      size: raw.size,
      printName: String(raw.printName || '').slice(0, 12),
      printNumber: String(raw.printNumber || '').replace(/\D/g, '').slice(0, 2),
    };
    lines.push({ product, choices, quantity, unitPrice: getUnitPrice(product, choices) });
  }

  // 3) Totals
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const coupon = couponCode ? checkCoupon(couponCode, subtotal) : null;
  const discount = coupon?.valid ? coupon.discount : 0;
  const delivery = DELIVERY_OPTIONS.find((option) => option.id === deliveryId) || DELIVERY_OPTIONS[0];
  const afterDiscount = Math.max(0, subtotal - discount);
  const deliveryFee = getDeliveryFee(delivery, afterDiscount);
  const total = afterDiscount + deliveryFee;
  const now = new Date().toISOString();

  // 4) The finished order
  const order = {
    id: 'LP' + Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).slice(2, 4).toUpperCase(),
    date: now,
    customer: { name: customer.name, email: customer.email, roll: customer.roll, payment: customer.payment },
    userEmail: customer.email,
    note: String(customer.note || '').slice(0, 200),
    pickupCode: String(Math.floor(1000 + Math.random() * 9000)), // the shopper tells this to the volunteer
    items: lines.map((line) => ({
      productName: line.product.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      ...line.choices,
    })),
    subtotal,
    discount,
    coupon: discount > 0 ? couponCode : '',
    deliveryFee,
    delivery: delivery.label,
    total,
    status: ORDER_STATUSES[0],
    paymentStatus: customer.payment === 'UPI' ? 'Pending' : 'Pay at desk',
    upiRef: '',
    history: [{ status: ORDER_STATUSES[0], at: now }],
  };
  return NextResponse.json(order, { status: 201 });
}
