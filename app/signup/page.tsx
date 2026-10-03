'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signUp } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    room: '',
    batch: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp(form.email, form.password, form.displayName, form.room, form.batch);
      router.push('/feed');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message.includes('email-already-in-use')
          ? 'This email is already registered.'
          : 'Sign up failed. Please try again.');
      } else {
        setError('Sign up failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#0F0A1E]/50 border border-[#2D2547] rounded-xl px-4 py-3 text-sm text-[#F0EBF8] placeholder-[#6B6485] focus:border-[#FF6B35]/60 focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20 transition-all";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#7B2FBE]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FF6B35]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm space-y-6 fade-in-up">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#7B2FBE] items-center justify-center shadow-2xl shadow-orange-500/30">
            <BookOpen size={28} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold gradient-text">Join the Chronicles</h1>
            <p className="text-[#A09AB8] text-sm mt-1">Create your resident account</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#A09AB8]">Full Name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={set('displayName')}
              placeholder="Your name"
              required
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#A09AB8]">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="your@email.com"
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#A09AB8]">Room No.</label>
              <input
                type="text"
                value={form.room}
                onChange={set('room')}
                placeholder="204"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#A09AB8]">Batch Year</label>
              <input
                type="text"
                value={form.batch}
                onChange={set('batch')}
                placeholder="2024"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#A09AB8]">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Min 6 characters"
                required
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6485] hover:text-[#A09AB8] p-1"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#A09AB8]">Confirm Password</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              placeholder="Repeat password"
              required
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            id="signup-submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#7B2FBE] text-white font-semibold text-sm shadow-lg hover:shadow-[0_0_25px_rgba(255,107,53,0.4)] transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#A09AB8]">
          Already a member?{' '}
          <Link href="/login" className="text-[#FF6B35] font-medium hover:text-[#FF8C61] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
