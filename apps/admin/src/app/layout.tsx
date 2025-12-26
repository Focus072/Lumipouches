import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lumi Admin',
  description: 'Admin dashboard for Lumi Commerce',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

