import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PlayerProvider } from '@/context/PlayerContext';

export const metadata: Metadata = {
  title: 'LastWave — Next-Gen Music Client',
  description: 'Ad-free YouTube Music client with algorithmic smart playlist generation, synchronized lyrics, and Last.fm scrobbler.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LastWave',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-zinc-950 text-zinc-100 min-h-screen font-sans selection:bg-brand-accent selection:text-zinc-950">
        <PlayerProvider>{children}</PlayerProvider>
      </body>
    </html>
  );
}
