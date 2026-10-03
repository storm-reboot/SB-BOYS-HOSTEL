'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/feed' : '/login');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#7B2FBE] flex items-center justify-center shadow-2xl shadow-orange-500/30 pulse-glow">
        <BookOpen size={36} className="text-white" />
      </div>
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold gradient-text">Hostel Chronicles</h1>
        <p className="text-[#A09AB8] text-sm mt-2">Relive your hostel memories</p>
      </div>
      <Loader2 size={20} className="text-[#6B6485] animate-spin" />
    </div>
  );
}
