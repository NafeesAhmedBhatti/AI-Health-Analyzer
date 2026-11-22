import Link from 'next/link';
import { Sparkles, Home, LayoutDashboard } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,194,255,0.25)]">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-[#00C2FF] to-[#7B61FF] bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-xl font-bold text-white mt-2">Page Not Found</h2>
          <p className="text-sm text-gray-400 mt-2">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-sm font-semibold text-white transition"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#00C2FF] text-sm font-semibold text-white shadow-[0_0_20px_rgba(0,194,255,0.25)] transition"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
