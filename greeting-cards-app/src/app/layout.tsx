import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Groupcard — Digital group greeting cards',
  description:
    'Create a digital group greeting card. Invite friends to add messages and photos, then send it to someone special.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
