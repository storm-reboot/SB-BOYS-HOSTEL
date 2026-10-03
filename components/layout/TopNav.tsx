'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, PlusSquare, User, LogOut, BookOpen, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/lib/auth';

export default function TopNav() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) return null;

  const navLinks = [
    { href: '/feed', icon: Home, label: 'Feed' },
    { href: '/search', icon: Search, label: 'Explore' },
    { href: '/upload', icon: PlusSquare, label: 'Share Memory' },
    { href: `/profile/${user.uid}`, icon: User, label: 'My Profile' },
  ];

  return (
    <header className="desktop-only fixed top-0 left-0 right-0 z-50 glass safe-top">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#7B2FBE] flex items-center justify-center shadow-lg group-hover:shadow-[0_0_20px_rgba(255,107,53,0.4)] transition-all duration-300">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl gradient-text">Hostel Chronicles</span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/feed' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FF6B35]/20 text-[#FF6B35] shadow-[0_0_12px_rgba(255,107,53,0.2)]'
                    : 'text-[#A09AB8] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + Sign Out */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-[#F0EBF8]">{profile?.displayName || user.displayName}</p>
            <p className="text-xs text-[#A09AB8]">
              {profile?.batch ? `Batch ${profile.batch}` : ''} {profile?.room ? `· Room ${profile.room}` : ''}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#7B2FBE] flex items-center justify-center text-sm font-bold text-white uppercase">
            {(profile?.displayName || user.displayName || 'U')[0]}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[#6B6485] hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
