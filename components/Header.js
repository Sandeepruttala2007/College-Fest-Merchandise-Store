'use client';
// Top bar: logo, page links and the cart button.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from './StoreProvider';

export default function Header() {
  const { itemCount, setIsCartOpen, currentUser } = useStore();
  const currentPath = usePathname();

  // Marks the link of the page we are on (the CSS underlines it).
  const current = (path) => (currentPath === path ? 'page' : undefined);

  return (
    <header className="top">
      <Link href="/" className="logo">LPU’26 merch</Link>
      <nav>
        <Link href="/" aria-current={current('/')}>Shop</Link>
        <Link href="/track" aria-current={current('/track')}>Track</Link>
        {currentUser?.isAdmin && <Link href="/dashboard" aria-current={current('/dashboard')}>Orders</Link>}
        {currentUser ? (
          <Link href="/profile" aria-current={current('/profile')}>{currentUser.name.split(' ')[0]}</Link>
        ) : (
          <Link href="/login" aria-current={current('/login')}>Log in</Link>
        )}
        <button className="btn sm" onClick={() => setIsCartOpen(true)}>
          Cart ({itemCount})
        </button>
      </nav>
    </header>
  );
}
