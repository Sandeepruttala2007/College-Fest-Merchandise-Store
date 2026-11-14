'use client';
// keeps the cart, coupon and orders in one place.
// any component can get them with: const store = useStore()
// no backend yet, everything is saved in localStorage.
import { createContext, useContext, useEffect, useState } from 'react';
import {
  PRODUCTS, ORDER_STATUSES, DELIVERY_OPTIONS, ADMIN_EMAILS, MAX_QUANTITY, CANCELLED,
  getUnitPrice, getDeliveryFee, checkCoupon,
} from '@/lib/data';

const STORAGE_KEY = 'lpu26-store-v1';
const StoreContext = createContext(null);

export function useStore() {
  return useContext(StoreContext);
}

export function StoreProvider({ children }) {
  // A cart item looks like: { key, productId, choices, quantity }
  const [cartItems, setCartItems] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [orders, setOrders] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryId, setDeliveryId] = useState(DELIVERY_OPTIONS[0].id);
  const [isLoaded, setIsLoaded] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentEmail, setCurrentEmail] = useState(''); // who is logged in

  // 1) When the page first loads, restore saved data.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      setCartItems(saved.cartItems || []);
      setCouponCode(saved.couponCode || '');
      setOrders(saved.orders || []);
      setDeliveryId(saved.deliveryId || DELIVERY_OPTIONS[0].id);
      setUsers(saved.users || []);
      setCurrentEmail(saved.currentEmail || '');
    } catch {
      // Corrupt or blocked storage: just start empty.
    }
    setIsLoaded(true);
  }, []);

  // 2) Whenever something changes, save it (but only after step 1 finished,
  //    otherwise we would overwrite saved data with empty data).
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cartItems, couponCode, orders, deliveryId, users, currentEmail }));
    } catch {}
  }, [cartItems, couponCode, orders, deliveryId, users, currentEmail, isLoaded]);

  // Tells the middleware (middleware.js) whether someone is logged in.
  // Only a demo: real apps use a signed session cookie set by the server.
  useEffect(() => {
    if (!isLoaded) return;
    document.cookie = currentEmail
      ? 'lpu_session=1; path=/; max-age=604800; SameSite=Lax'
      : 'lpu_session=; path=/; max-age=0';
  }, [currentEmail, isLoaded]);

  // Live updates: when another tab changes orders (e.g. the admin verifies a
  // payment), pick the change up straight away. Needs a real backend to work across devices.
  useEffect(() => {
    function onStorage(event) {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      const saved = JSON.parse(event.newValue);
      // Only update when something really changed. Otherwise two open tabs keep
      // overwriting each other's saved data in an endless loop.
      const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      setOrders((current) => (same(current, saved.orders || []) ? current : saved.orders || []));
      setUsers((current) => (same(current, saved.users || []) ? current : saved.users || []));
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ----- Values worked out from the cart -----

  // Add the product details and price to each cart item for easy display.
  // Items whose product no longer exists (removed from the shop) are skipped.
  const cartLines = cartItems.flatMap((item) => {
    const product = PRODUCTS.find((p) => p.id === item.productId);
    if (!product) return [];
    return [{ ...item, product, unitPrice: getUnitPrice(product, item.choices) }];
  });

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const couponResult = couponCode ? checkCoupon(couponCode, subtotal) : null;
  const discount = couponResult?.valid ? couponResult.discount : 0;
  const deliveryOption = DELIVERY_OPTIONS.find((option) => option.id === deliveryId) || DELIVERY_OPTIONS[0];
  const afterDiscount = Math.max(0, subtotal - discount);
  const deliveryFee = cartItems.length > 0 ? getDeliveryFee(deliveryOption, afterDiscount) : 0;
  const total = afterDiscount + deliveryFee;

  // ----- Actions -----

  // Add an item. If the exact same product + choices is already in the
  // cart, increase its quantity instead of adding a second row.
  function addToCart(productId, choices, quantity) {
    const key = [productId, choices.color, choices.size, choices.printName, choices.printNumber].join('|');

    setCartItems((current) => {
      const alreadyThere = current.some((item) => item.key === key);
      if (alreadyThere) {
        return current.map((item) =>
          item.key === key ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + quantity) } : item
        );
      }
      return [...current, { key, productId, choices, quantity: Math.min(MAX_QUANTITY, quantity) }];
    });
    setIsCartOpen(true);
  }

  // Set a new quantity. Going below 1 removes the item.
  function changeQuantity(key, newQuantity) {
    setCartItems((current) =>
      newQuantity < 1
        ? current.filter((item) => item.key !== key)
        : current.map((item) => (item.key === key ? { ...item, quantity: Math.min(MAX_QUANTITY, newQuantity) } : item))
    );
  }

  // Returns an error message, or '' if the code exists.
  // (Minimum-spend problems are shown by the cart using `couponResult`.)
  function applyCoupon(typedCode) {
    const code = typedCode.trim().toUpperCase();
    const result = checkCoupon(code, subtotal);
    if (!result.valid && result.message === 'Coupon not found.') return result.message;
    setCouponCode(code);
    return '';
  }

  function removeCoupon() {
    setCouponCode('');
  }

  // Turns the cart into an order, then empties the cart.
  // Sends the cart to /api/orders. The server works out the prices (so they can't be
  // edited in the browser) and sends back the finished order.
  // Throws an Error with a message to show the shopper if something is wrong.
  async function placeOrder(customer) {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartItems.map(({ productId, choices, quantity }) => ({ productId, choices, quantity })),
        couponCode,
        deliveryId,
        customer,
      }),
    });
    const order = await response.json();
    if (!response.ok) throw new Error(order.error || 'Could not place the order.');

    setOrders((current) => [order, ...current]);
    setCartItems([]);
    setCouponCode('');
    return order;
  }

  function clearCart() {
    setCartItems([]);
    setCouponCode('');
  }

  // A shopper can cancel their own order while it is still "Placed" and not yet paid.
  function cancelOrder(orderId) {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId && order.status === ORDER_STATUSES[0] && order.paymentStatus !== 'Verified'
          ? { ...order, status: CANCELLED, history: [...(order.history || []), { status: CANCELLED, at: new Date().toISOString() }] }
          : order
      )
    );
  }

  function changeOrderStatus(orderId, newStatus) {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus, history: [...(order.history || []), { status: newStatus, at: new Date().toISOString() }] }
          : order
      )
    );
  }

  // ----- Accounts (stored in the browser for now, so this is demo-level security) -----

  async function hashPassword(password) {
    // crypto.subtle only exists on https or localhost. Opening the site from a phone over
    // plain http (like 192.168.x.x:3000) would break login, so use a simple fallback there.
    if (!window.crypto?.subtle) {
      let hash = 5381;
      for (const char of password) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
      return 'simple-' + hash;
    }
    const bytes = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Each of these returns '' on success or an error message to show.
  async function signUp({ name, email, roll, password }) {
    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim() || !roll.trim()) return 'Please fill in your name and roll number.';
    if (!/\S+@\S+\.\S+/.test(cleanEmail)) return 'Enter a valid email.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (users.some((user) => user.email === cleanEmail)) return 'This email already has an account. Try logging in.';

    const passwordHash = await hashPassword(password);
    setUsers((current) => [...current, { name: name.trim(), email: cleanEmail, roll: roll.trim(), phone: '', passwordHash }]);
    setCurrentEmail(cleanEmail);
    return '';
  }

  async function logIn(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email === cleanEmail);
    const passwordHash = await hashPassword(password);
    if (!user || user.passwordHash !== passwordHash) return 'Wrong email or password.';
    setCurrentEmail(cleanEmail);
    return '';
  }

  // Forgot password (demo): the email AND roll number must both match the account.
  async function resetPassword(email, roll, newPassword) {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email === cleanEmail);
    if (!user || user.roll.toLowerCase() !== roll.trim().toLowerCase()) {
      return 'No account matches that email and roll number.';
    }
    if (newPassword.length < 6) return 'Password must be at least 6 characters.';
    const passwordHash = await hashPassword(newPassword);
    setUsers((current) => current.map((u) => (u.email === cleanEmail ? { ...u, passwordHash } : u)));
    return '';
  }

  function logOut() {
    setCurrentEmail('');
    setIsCartOpen(false);
  }

  function updateProfile(changes) {
    setUsers((current) => current.map((user) => (user.email === currentEmail ? { ...user, ...changes } : user)));
  }

  const foundUser = users.find((user) => user.email === currentEmail);
  const currentUser = foundUser ? { ...foundUser, isAdmin: ADMIN_EMAILS.includes(foundUser.email) } : null;
  const myOrders = orders.filter((order) => order.userEmail === currentEmail);

  // ----- UPI payment steps -----

  function updateOrder(orderId, changes) {
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, ...changes } : order)));
  }
  // Shopper pays in their UPI app, then enters the 12-digit reference (UTR).
  // Returns '' if saved, or an error message.
  function submitUpiRef(orderId, upiRef) {
    const usedElsewhere = orders.some((order) => order.id !== orderId && order.upiRef === upiRef);
    if (usedElsewhere) return 'This reference number was already used for another order.';
    updateOrder(orderId, { upiRef, paymentStatus: 'Submitted', paymentNote: '' });
    return '';
  }
  // Admin could not find that payment: send it back so the shopper can re-enter.
  function rejectPayment(orderId) {
    updateOrder(orderId, {
      upiRef: '',
      paymentStatus: 'Pending',
      paymentNote: 'We could not match that reference number. Please check it and enter it again.',
    });
  }
  // Admin checks the UTR in the bank/UPI app, then confirms.
  function verifyPayment(orderId) {
    updateOrder(orderId, { paymentStatus: 'Verified' });
  }

  const value = {
    // cart
    cartLines, itemCount, subtotal, discount, deliveryOption, deliveryFee, setDeliveryId, total,
    isCartOpen, setIsCartOpen, addToCart, changeQuantity, clearCart,
    // coupon
    couponCode, couponResult, applyCoupon, removeCoupon,
    // orders
    orders, myOrders, isLoaded, placeOrder, changeOrderStatus, cancelOrder,
    // accounts
    currentUser, signUp, logIn, logOut, updateProfile, resetPassword,
    // upi
    submitUpiRef, verifyPayment, rejectPayment,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
