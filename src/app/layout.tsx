import type { Metadata } from 'next';
import './globals.css';
import ToastProvider from '@/components/ui/toast';
import ConfirmProvider from '@/components/ui/confirm';
import AuthProvider from '@/components/auth-provider';

export const metadata: Metadata = {
  title: 'AI Health Analyzer — Futuristic AI Health Companion',
  description: 'AI Health Analyzer — The most advanced AI-powered health analysis platform. Upload lab reports, get instant health insights, personalized diet plans, and 24/7 AI health assistance.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ConfirmProvider>
            <ToastProvider>{children}</ToastProvider>
          </ConfirmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}