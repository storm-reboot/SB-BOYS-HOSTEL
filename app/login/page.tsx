'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/feed');
    } catch {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-safe">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#7B2FBE]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm space-y-8 fade-in-up">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#7B2FBE] items-center justify-center shadow-2xl shadow-orange-500/30">
            <BookOpen size={28} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold gradient-text">Hostel Chronicles</h1>
            <p className="text-[#A09AB8] text-sm mt-1">Welcome back, resident</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-medium text-[#A09AB8]">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-[#0F0A1E]/50 border border-[#2D2547] rounded-xl px-4 py-3 text-sm text-[#F0EBF8] placeholder-[#6B6485] focus:border-[#FF6B35]/60 focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-medium text-[#A09AB8]">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#0F0A1E]/50 border border-[#2D2547] rounded-xl px-4 py-3 pr-12 text-sm text-[#F0EBF8] placeholder-[#6B6485] focus:border-[#FF6B35]/60 focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6485] hover:text-[#A09AB8] transition-colors p-1"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            id="login-submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#7B2FBE] text-white font-semibold text-sm shadow-lg hover:shadow-[0_0_25px_rgba(255,107,53,0.4)] transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-[#A09AB8]">
          New resident?{' '}
          <Link href="/signup" className="text-[#FF6B35] font-medium hover:text-[#FF8C61] transition-colors">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
