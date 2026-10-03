'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TopNav from '@/components/layout/TopNav';
import BottomNav from '@/components/layout/BottomNav';
import SearchExplore from '@/components/search/SearchExplore';
import { Search, Loader2 } from 'lucide-react';

export default function SearchPage() {
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
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Search size={18} className="text-[#FF6B35]" />
            <h1 className="font-display text-xl font-bold text-[#F0EBF8]">Explore</h1>
          </div>
          <p className="text-xs text-[#6B6485]">Search memories by keyword, room, batch, or type</p>
        </div>

        <SearchExplore />
      </main>
    </div>
  );
}
