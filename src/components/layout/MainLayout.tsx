// src/components/layout/MainLayout.tsx
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { MobileBottomNav } from '../common/MobileBottomNav';
import { ScrollToTop } from '../common/ScrollToTop';
import { InstallPrompt } from '../common/InstallPrompt';
import { ChatWidget } from '../common/ChatWidget';
import { ReactNode } from 'react';

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      <InstallPrompt />
      <ChatWidget />
    </div>
  );
}