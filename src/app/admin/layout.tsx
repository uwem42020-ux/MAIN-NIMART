// src/app/admin/layout.tsx
import { AdminRoute } from '@/components/common/AdminRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminRoute>{children}</AdminRoute>;
}