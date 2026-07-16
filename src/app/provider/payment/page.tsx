// src/app/provider/payment/page.tsx
import { Suspense } from 'react';
import ProviderPaymentClient from './ProviderPaymentClient';

export const dynamic = 'force-dynamic';

export default function ProviderPaymentPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>}>
      <ProviderPaymentClient />
    </Suspense>
  );
}