'use client';
import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TopNav from '@/components/layout/TopNav';
import BottomNav from '@/components/layout/BottomNav';
import ProfileGrid from '@/components/profile/ProfileGrid';
import { Loader2 } from 'lucide-react';

interface ProfilePageProps {
  params: Promise<{ uid: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { uid } = use(params);
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
        <ProfileGrid uid={uid} />
      </main>
    </div>
  );
}
