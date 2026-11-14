# LPU’26 College Fest Merchandise Store

An online store where students customize and order official college fest merchandise, pay by UPI and track their order. Organizers manage every order and verify payments from an admin dashboard.

Built with **Next.js 14 (App Router)** and **React 18** for the course **INT257 – Next.js**.

- **Live demo:** [add your Vercel link here]
- **Repository:** [add your GitHub link here]

---

## Features

**Shopping**
- Product catalogue with category filter, search, sorting and "New" / "Bestseller" badges
- Product page for every item (`/product/tee`, `/product/hoodie`, ...) with a colour switcher, details and a size guide
- Customizer with live preview: colour, size, printed name and number, quantity

**Cart and checkout**
- Cart drawer with product pictures, quantity controls (max 10 per item), remove and clear cart
- Coupon codes with minimum-spend rules and a progress bar toward the next coupon
- Collect at the fest desk (free) or hostel delivery (free above the amount set in `lib/data.js`)
- Note for the print shop
- Prices are calculated again on the server (`POST /api/orders`), so they cannot be changed in the browser

**UPI payment**
- QR code, "Any UPI app" / GPay / PhonePe / Paytm buttons, and copy buttons for the UPI ID and amount
- Shopper enters the 12-digit UPI reference (UTR); duplicate references are rejected
- Admin verifies or rejects the payment, and the shopper's page updates by itself

**Accounts**
- Sign up, log in and reset password with live validation, show/hide password and a strength meter
- Short lock after 5 wrong passwords
- Profile page to edit details and see your own orders

**Order tracking**
- Timeline with the time of every status change, progress bar and estimated ready date
- Handover code shown to the shopper; the dashboard asks for it before an order can be marked *Collected*
- Cancel an order while it is still *Placed* and unpaid
- Print receipt

**Admin dashboard** (`/dashboard`, admin accounts only)
- Order value, payments received, payments waiting to be verified, best seller
- Search by order ID, name or roll number; filter by order status and payment status
- Update statuses, verify or reject UPI payments, flag orders unpaid for over 24 hours
- Download all shown orders as a CSV file

**Interface**
- Responsive layout, animated hero section, scrolling offers strip, hover effects
- Theme colours in one place (CSS variables), reduced-motion support

---

## Tech stack

| Technology | Used for |
|---|---|
| Next.js 14 (App Router) | Routing, layouts, server components, API routes, middleware |
| React 18 | Components, hooks, Context |
| JavaScript (JSX) | All application code |
| CSS (global stylesheet, CSS variables, media queries) | Styling and animations |
| qrcode.react | UPI payment QR code |
| Web Crypto API | Hashing passwords |
| Browser localStorage | Saving cart, accounts and orders |

---

## Next.js concepts used

| Concept | Where |
|---|---|
| App Router, file-based routing | every folder in `app/` |
| Dynamic route, `generateStaticParams`, `generateMetadata` | `app/product/[id]/page.jsx` |
| Server components and client components | product page (server), `components/ProductViewer.jsx` (client) |
| Shared layout | `app/layout.jsx` |
| Route handlers (API routes) | `app/api/products`, `app/api/products/[id]`, `app/api/orders` |
| Middleware | `middleware.js` (redirects `/profile` and `/dashboard` to `/login`) |
| `loading.jsx`, `error.jsx`, `not-found.jsx` | `app/` |
| `next/link`, `useRouter`, `usePathname` | Header, login, profile |
| `next/font`, metadata | `app/layout.jsx` |
| React Context and hooks | `components/StoreProvider.jsx` |

---

## Getting started

You need **Node.js 18.17 or newer**.

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
npm install
npm run dev
```

Open http://localhost:3000.

Other commands:

```bash
npm run build   # production build (run this before deploying)
npm start       # run the production build
```

### Settings to change first

Open `lib/data.js` and set:

| Setting | What it is |
|---|---|
| `UPI_ID`, `UPI_NAME` | Where payments go. Use a test UPI ID for demos. |
| `ADMIN_EMAILS` | Accounts with these emails can open the dashboard |
| `PRODUCTS`, `COUPONS` | What you sell and the discount codes |
| `PRINT_FEE`, `FREE_DELIVERY_ABOVE`, `DELIVERY_OPTIONS` | Prices and delivery rules |

To change the colours, edit the variables at the top of `app/globals.css` (`--header`, `--hero-1`, `--hero-2`, `--hero-3`, `--paper`).

### Test accounts

- **Shopper:** sign up on `/login` with any email, roll number (6 to 12 letters or digits) and a password of 6+ characters.
- **Admin:** sign up with an email listed in `ADMIN_EMAILS` (default `admin@college.edu`), then open `/dashboard`.
- **Coupons:** `FEST10`, `FRESHER15` (orders above ₹999), `HOSTEL200` (orders above ₹1,500).

---

## Routes

| Route | Who can use it | Purpose |
|---|---|---|
| `/` | Everyone | Browse, search and customize products |
| `/product/[id]` | Everyone | Product details |
| `/login` | Everyone | Log in, sign up, reset password |
| `/profile` | Logged-in users | Edit details, view orders, pay pending UPI orders |
| `/track` | Everyone | Track an order |
| `/dashboard` | Admins only | Manage orders and verify payments |

### API

| Method and path | Description |
|---|---|
| `GET /api/products` | All products (`?category=Clothing` to filter) |
| `GET /api/products/[id]` | One product, or 404 |
| `POST /api/orders` | Checks the cart and builds the order with server-side prices |

---

## Project structure

```
├── app/
│   ├── layout.jsx             Root layout (header, cart drawer, provider)
│   ├── page.jsx               Shop home page
│   ├── globals.css            All styling and theme colours
│   ├── loading.jsx            Loading state
│   ├── error.jsx              Error page
│   ├── not-found.jsx          404 page
│   ├── product/[id]/page.jsx  Product details
│   ├── login/page.jsx         Log in, sign up, reset password
│   ├── profile/page.jsx       Profile and personal orders
│   ├── track/page.jsx         Order tracking
│   ├── dashboard/page.jsx     Admin dashboard
│   └── api/                   Route handlers (products, orders)
├── components/
│   ├── StoreProvider.jsx      Global state: cart, coupon, users, orders
│   ├── Header.jsx             Navigation bar
│   ├── Customizer.jsx         Customization popup
│   ├── ProductViewer.jsx      Product page content (client component)
│   ├── Preview.jsx            SVG product drawing
│   ├── Cart.jsx               Cart drawer and checkout
│   └── UpiPayment.jsx         UPI payment steps
├── lib/data.js                Products, coupons, settings, helper functions
├── middleware.js              Protects /profile and /dashboard
├── jsconfig.json              "@/" import alias
└── package.json
```

---

## Deploy on Vercel

1. Push the project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "LPU’26 merch store"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, choose **Add New Project**, select the repository and press **Deploy**.
3. Open the deployed link and test sign up, ordering and the dashboard before sharing it.

---

## Known limitations

- Accounts, carts and orders are saved in each browser (localStorage), so different devices do not share data. A hosted database behind the API routes is the next step.
- Login and the admin check run in the browser, so this is demo-level security. A real deployment needs server-side sessions (for example NextAuth).
- UPI payments are confirmed by an admin checking the reference number. A payment gateway such as Razorpay would verify payments automatically.
- If `npm install` warns that Next.js 14.2.15 is vulnerable, delete `package-lock.json` and `node_modules` and install again so the latest 14.x is used.

---

## Screenshots

<!-- Add screenshots to docs/screenshots/ and link them here, for example:
![Home page](docs/screenshots/home.png)
-->

Add pictures of: home page, customizer, cart, UPI payment, login, profile, tracking page, admin dashboard, mobile view.

---

## Team

| Name | Registration No. | Contribution |
|---|---|---|
| [Name 1] | [Reg. No.] | [What this member built] |
| [Name 2] | [Reg. No.] | [What this member built] |
| [Name 3] | [Reg. No.] | [What this member built] |

**Course:** INT257 – Next.js, Lovely Professional University
