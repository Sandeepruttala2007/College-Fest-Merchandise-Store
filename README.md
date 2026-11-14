# LPU'26 – College Fest Merchandise Store
Next.js 14 + React 18. No backend: data is saved in the browser (localStorage).

    npm install
    npm run dev        # open http://localhost:3000

## Where things live
| File | What it does |
|---|---|
| `lib/data.js` | Products, coupons, print fee, order statuses, price/coupon helpers. **Edit this to change what you sell.** |
| `components/StoreProvider.jsx` | Cart, coupon and order state + saving. Replace `placeOrder` / `changeOrderStatus` with API calls to go live. |
| `components/Customizer.jsx` | Popup to pick colour, size, name, number. |
| `components/Preview.jsx` | The SVG product drawing with printed text. |
| `components/Cart.jsx` | Cart drawer: items, coupon, totals, checkout form. |
| `components/Header.jsx` | Top bar. |
| `app/page.jsx` | Home page (product grid). |
| `app/dashboard/page.jsx` | Order dashboard: search, status filter, CSV download. |
| `app/track/page.jsx` | Order tracking: timeline with times, status message, price breakdown. |
| `app/globals.css` | All styling. |

## Login, UPI and profile
- Set your real UPI ID and the admin email(s) in `lib/data.js` (`UPI_ID`, `UPI_NAME`, `ADMIN_EMAILS`).
- Accounts and orders are stored in the browser. To go live, move them to a backend (e.g. NextAuth + a database).
- UPI flow: shopper pays by QR / UPI app -> enters the 12-digit reference -> admin checks it and clicks "Verify payment".
- Run `npm install` again, a QR code package (`qrcode.react`) was added.

## If a UPI payment fails
- Personal UPI IDs often get blocked when the amount is filled in automatically. Leave "Fill the amount" off and type the amount, or pay manually with the copied UPI ID.
- For one-tap payments that always work, register a merchant UPI ID (Paytm for Business / PhonePe Business) and put it in `lib/data.js`.
- The admin and the shopper must use the same browser until a backend is added (data is stored in the browser).

## Test accounts for the evaluator
- Shopper: sign up on /login with any email, roll number and password.
- Admin: sign up with the email in `ADMIN_EMAILS` (lib/data.js), then open /dashboard.
- For demo payments, put a test UPI ID in `lib/data.js` instead of your personal one.

## Where each Next.js concept is used (useful for the viva)
| Concept | Where |
|---|---|
| App Router, file-based routing | every folder in `app/` |
| Dynamic route + `generateStaticParams` + `generateMetadata` | `app/product/[id]/page.jsx` |
| Server component vs client component | product page (server) and `components/ProductViewer.jsx` (client) |
| Shared layout | `app/layout.jsx` |
| Route handlers (API routes) | `app/api/products`, `app/api/products/[id]`, `app/api/orders` |
| Middleware | `middleware.js` (protects /profile and /dashboard) |
| `loading.jsx`, `error.jsx`, `not-found.jsx` | `app/` |
| `next/link`, `useRouter`, `usePathname` | Header, login, profile |
| `next/font`, metadata | `app/layout.jsx` |
| Context + hooks | `components/StoreProvider.jsx` |

API: `GET /api/products`, `GET /api/products?category=Clothing`, `GET /api/products/tee`, `POST /api/orders`.

## Push to GitHub and deploy on Vercel
    git init
    git add .
    git commit -m "LPU'26 merch store"
    git branch -M main
    git remote add origin https://github.com/<your-username>/<repo-name>.git
    git push -u origin main
Then go to vercel.com, sign in with GitHub, click "Add New Project", pick the repo and press Deploy.

## Latest upgrades
- Cart: clear cart, max 10 per item, note for the print shop, free hostel delivery above the amount set in `lib/data.js`, Escape closes the drawer.
- Products: search box, badges, product page with colour switcher, details and size guide, steel bottle.
- Tracking: handover code (the dashboard asks for it before an order can be marked Collected), cancel order, cancelled state, UPI reference shown.
- Payment: GPay / PhonePe / Paytm buttons, payment filters and "to verify" count on the dashboard, unpaid-over-24-hours flag, CSV includes payment status and UTR.
- Fixed: two open tabs could overwrite each other's saved data in an endless loop.
- If `npm install` warns that Next.js 14.2.15 is vulnerable, delete `package-lock.json` and `node_modules`, then run `npm install` again so the newest 14.x is installed.
