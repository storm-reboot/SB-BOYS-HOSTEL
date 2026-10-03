'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TopNav from '@/components/layout/TopNav';
import BottomNav from '@/components/layout/BottomNav';
import FeedTimeline from '@/components/feed/FeedTimeline';
import { PlusSquare, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function FeedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="text-[#FF6B35] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <TopNav />
      <BottomNav />

      <main className="max-w-lg mx-auto px-4 pb-28 pt-6 md:pt-24 md:pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <BookOpen size={18} className="text-[#FF6B35]" />
              <h1 className="font-display text-xl font-bold text-[#F0EBF8]">Memories</h1>
            </div>
            <p className="text-xs text-[#6B6485]">SB Boys Hostel — relive the moments</p>
          </div>
          <Link
            href="/upload"
            id="feed-upload-btn"
            className="touch-target w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#7B2FBE] flex items-center justify-center shadow-lg hover:shadow-[0_0_20px_rgba(255,107,53,0.5)] transition-all duration-300"
          >
            <PlusSquare size={20} className="text-white" />
          </Link>
        </div>

        <FeedTimeline />
      </main>
    </div>
  );
}
