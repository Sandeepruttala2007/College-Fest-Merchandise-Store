'use client';
// Shown when something crashes while a page is rendering. Error pages must be client components.
export default function Error({ error, reset }) {
  return (
    <main className="dash">
      <div className="empty">
        <h2>Something went wrong</h2>
        <p>{error.message || 'Please try again.'}</p>
        <button className="btn" onClick={() => reset()}>Try again</button>
      </div>
    </main>
  );
}
