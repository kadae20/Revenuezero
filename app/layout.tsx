import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RevenueZero - Stop Shipping. Start Selling.',
  description: 'AI-powered revenue intelligence for Micro SaaS founders stuck at $0 revenue.',
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

