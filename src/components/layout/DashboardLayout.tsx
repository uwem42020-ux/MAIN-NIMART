// src/components/layout/DashboardLayout.tsx
import { Outlet } from 'react-router-dom';
import { Header } from '../common/Header';
import { MobileBottomNav } from '../common/MobileBottomNav';

export function DashboardLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}