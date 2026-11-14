// Shown for unknown URLs and when a page calls notFound().
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="dash">
      <div className="empty">
        <h2>Page not found</h2>
        <p>That page or product doesn’t exist.</p>
        <Link className="btn" href="/">Back to the shop</Link>
      </div>
    </main>
  );
}
