import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart';

export const metadata: Metadata = {
  title: 'Lumi',
  description: 'Lumi Commerce Storefront',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}

