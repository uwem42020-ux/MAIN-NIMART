// src/app/layout.tsx
import '@/styles/globals.css';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Providers } from '@/components/Providers';
import { MobileBottomNav } from '@/components/common/MobileBottomNav'; // ← import

export const metadata = {
  title: "Nimart - Nigeria's Trusted Service Marketplace",
  description: 'Connect with verified professionals across Nigeria. Book trusted services for home, auto, beauty, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileBottomNav /> {/* ← add here */}
        </Providers>
      </body>
    </html>
  );
}