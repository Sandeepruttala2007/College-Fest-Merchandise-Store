// products, coupons and price helpers.
// want to sell something else? edit PRODUCTS / COUPONS below.

// Everything we sell. `price` is the base price in rupees.
export const PRODUCTS = [
  {
    id: 'tee',
    category: 'Clothing',
    name: 'Fest Tee',
    price: 499,
    badge: 'Bestseller',
    description: '240 GSM cotton, screen-printed.',
    features: ['240 GSM combed cotton', 'Screen print that survives the wash', 'Unisex regular fit'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: { Cobalt: '#2B3BFF', Marigold: '#FFB800', Ink: '#14152B', Chalk: '#F1EFE8' },
  },
  {
    id: 'hoodie',
    category: 'Clothing',
    name: 'Night Show Hoodie',
    price: 1199,
    badge: 'New',
    description: 'Heavy fleece for the concert nights.',
    features: ['Heavy fleece, soft inside', 'Front pocket and drawstring hood', 'Print on the chest'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: { Ink: '#14152B', Pink: '#FF5C93', Cobalt: '#2B3BFF' },
  },
  {
    id: 'tote',
    category: 'Accessories',
    name: 'Canvas Tote',
    price: 299,
    description: 'Fits a laptop and a stack of flyers.',
    features: ['Thick canvas', 'Fits a 15 inch laptop', 'Reinforced handles'],
    sizes: ['One size'],
    colors: { Chalk: '#F1EFE8', Marigold: '#FFB800', Pink: '#FF5C93' },
  },
  {
    id: 'cap',
    category: 'Accessories',
    name: 'Crew Cap',
    price: 349,
    description: 'Adjustable strap, embroidered feel.',
    features: ['Cotton twill', 'Adjustable strap', 'One size fits most'],
    sizes: ['One size'],
    colors: { Ink: '#14152B', Marigold: '#FFB800', Cobalt: '#2B3BFF' },
  },
  {
    id: 'mug',
    category: 'Accessories',
    name: 'Midnight Mug',
    price: 249,
    description: 'For the 3 a.m. rehearsal chai.',
    features: ['350 ml ceramic', 'Dishwasher safe', 'Print on one side'],
    sizes: ['350 ml'],
    colors: { Chalk: '#F1EFE8', Cobalt: '#2B3BFF', Pink: '#FF5C93' },
  },
  {
    id: 'bottle',
    category: 'Accessories',
    name: 'Steel Bottle',
    price: 399,
    badge: 'New',
    description: 'Keeps water cold through the whole show.',
    features: ['750 ml stainless steel', 'Leak-proof lid', 'Print on the front'],
    sizes: ['750 ml'],
    colors: { Ink: '#14152B', Chalk: '#F1EFE8', Marigold: '#FFB800' },
  },
];

// Chest measurement for each clothing size (shown on the product page).
export const SIZE_GUIDE = { S: '36 in', M: '38 in', L: '40 in', XL: '42 in' };

// How shoppers can pay. Shown in the checkout form and saved on the order.
export const PAYMENT_METHODS = ['UPI', 'Pay at fest desk'];

// Coupon codes. Use `percentOff` OR `flatOff`.
// `minimumSpend` is optional: the cart subtotal must reach it.
export const COUPONS = {
  FEST10:    { percentOff: 10, description: '10% off any order' },
  FRESHER15: { percentOff: 15, minimumSpend: 999,  description: '15% off orders above ₹999' },
  HOSTEL200: { flatOff: 200,   minimumSpend: 1500, description: '₹200 off orders above ₹1,500' },
};

// Extra charge when the customer adds a name or number to the print.
export const PRINT_FEE = 99;

// Most of one item a shopper can add to a single order line.
export const MAX_QUANTITY = 10;

// Hostel delivery is free once the order (after any coupon) reaches this amount.
export const FREE_DELIVERY_ABOVE = 1000;

// An unpaid UPI order is flagged on the dashboard after this many hours.
export const PAYMENT_DEADLINE_HOURS = 24;

// Extra status an order can end in (it is not one of the normal steps).
export const CANCELLED = 'Cancelled';

// The steps an order goes through. The dashboard uses this list.
export const ORDER_STATUSES = ['Placed', 'Printing', 'Ready for pickup', 'Collected'];

// What the shopper sees on the tracking page for each status.
export const STATUS_MESSAGES = {
  Placed: 'We’ve got your order and will start printing soon.',
  Printing: 'Your merch is being printed.',
  'Ready for pickup': 'It’s ready! Bring your roll number to the fest desk (or wait for hostel delivery).',
  Collected: 'Handed over. Enjoy the fest!',
  Cancelled: 'This order was cancelled.',
};

// How the order reaches the shopper. `fee` is added to the total.
export const DELIVERY_OPTIONS = [
  { id: 'pickup', label: 'Collect at fest desk', fee: 0 },
  { id: 'hostel', label: 'Deliver to hostel', fee: 40 },
];

// Delivery fee for an option, after the free-delivery rule.
export function getDeliveryFee(option, amountAfterDiscount) {
  if (option.fee > 0 && amountAfterDiscount >= FREE_DELIVERY_ABOVE) return 0;
  return option.fee;
}

// 1499 -> "₹1,499"
export function formatPrice(amount) {
  return '₹' + amount.toLocaleString('en-IN');
}

// Price of ONE item after customization.
export function getUnitPrice(product, choices) {
  const hasPrint = Boolean(choices.printName || choices.printNumber);
  return product.price + (hasPrint ? PRINT_FEE : 0);
}

// Checks a coupon against the cart subtotal.
// Returns { valid: true, discount: 60 } or { valid: false, message: '...' }.
export function checkCoupon(code, subtotal) {
  const coupon = COUPONS[code];

  if (!coupon) {
    return { valid: false, message: 'Coupon not found.' };
  }
  if (coupon.minimumSpend && subtotal < coupon.minimumSpend) {
    const shortBy = coupon.minimumSpend - subtotal;
    return { valid: false, message: `Add ${formatPrice(shortBy)} more to use ${code}.` };
  }

  const discount = coupon.percentOff
    ? Math.round((subtotal * coupon.percentOff) / 100)
    : coupon.flatOff;
  return { valid: true, discount };
}

// ---- UPI payment settings: CHANGE THESE to your fest's real details ----
export const UPI_ID = 'name-1@ptyes';
export const UPI_NAME = 'RUTTALA PHANINDRA SANDEEP';

// Accounts with these emails can open the order dashboard.
export const ADMIN_EMAILS = ['admin@college.edu'];
