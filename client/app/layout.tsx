import './globals.css';
import Script from 'next/script';
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Edu Center — O‘quv Markazni Boshqarish Tizimi',
  description: 'O‘quv markazlari uchun avtomatlashtirilgan CRM va boshqaruv paneli',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <Script
          src="https://cdn.tailwindcss.com"
          strategy="beforeInteractive"
        />
        <Script id="tailwind-config" strategy="beforeInteractive">
          {`
            tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  colors: {
                    primary: {
                      50: '#eff6ff',
                      100: '#dbeafe',
                      500: '#3b82f6',
                      600: '#2563eb',
                      700: '#1d4ed8',
                      800: '#1e40af'
                    }
                  }
                }
              }
            }
          `}
        </Script>
      </head>
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        {children}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function(err) {
                  console.log('SW registration error: ', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
