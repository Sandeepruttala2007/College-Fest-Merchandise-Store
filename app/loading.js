// Shown while a page is loading.
export default function Loading() {
  return (
    <main className="dash" aria-busy="true">
      <div className="spinner" role="status" aria-label="Loading" />
    </main>
  );
}
