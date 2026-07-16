// src/components/layout/DashboardLayout.tsx
import { Header } from '../common/Header';
import { MobileBottomNav } from '../common/MobileBottomNav';
import { ReactNode } from 'react';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}