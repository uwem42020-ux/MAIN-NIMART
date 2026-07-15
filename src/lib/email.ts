import { supabase } from './supabase';

export async function sendEmail(to: string, subject: string, html: string) {
  const { error } = await supabase.functions.invoke('send-email', {
    body: { to, subject, html },
  });
  if (error) console.error('Email failed to send:', error);
}

export async function sendPushNotification(token: string, title: string, body: string) {
  const { error } = await supabase.functions.invoke('send-push-notification', {
    body: { token, title, body },
  });
  if (error) console.error('Push notification failed:', error);
}