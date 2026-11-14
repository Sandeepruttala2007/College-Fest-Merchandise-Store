// The page frame shared by every page: header, content, and the cart drawer.
import './globals.css';
import { Bricolage_Grotesque } from 'next/font/google';
import { StoreProvider } from '@/components/StoreProvider';
import Header from '@/components/Header';
import Cart from '@/components/Cart';

const font = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font' });

export const metadata = {
  title: 'LPU’26 Merch Store',
  description: 'Customize and order official college fest merchandise.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.variable}>
        <StoreProvider>
          <Header />
          {children}
          <Cart />
        </StoreProvider>
      </body>
    </html>
  );
}
