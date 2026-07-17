// src/app/auth/signin/page.tsx
import { Metadata } from 'next';
import { SignInClient } from './SignInClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SignIn() {
  return <SignInClient />;
}