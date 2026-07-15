// src/app/provider/messages/[threadId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { MessageThread } from '@/components/chat/MessageThread';

export default function ProviderMessageThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();

  if (!threadId) return null;

  return <MessageThread threadId={threadId} />;
}