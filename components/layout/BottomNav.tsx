'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, PlusSquare, User, LogOut, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/lib/auth';

const navItems = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/search', icon: Search, label: 'Explore' },
  { href: '/upload', icon: PlusSquare, label: 'Share' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <nav
      className="mobile-only fixed bottom-0 left-0 right-0 z-50 glass safe-bottom"
      style={{ borderTop: '1px solid rgba(255,107,53,0.15)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const finalHref = href === '/profile' && user ? `/profile/${user.uid}` : href;
          return (
            <Link
              key={href}
              href={finalHref}
              className={`touch-target flex-1 flex flex-col items-center gap-0.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-[#FF6B35]'
                  : 'text-[#6B6485] hover:text-[#A09AB8]'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
                className={isActive ? 'drop-shadow-[0_0_8px_rgba(255,107,53,0.6)]' : ''}
              />
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && (
                <span className="absolute bottom-2 w-1 h-1 rounded-full bg-[#FF6B35]" />
              )}
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="touch-target flex-1 flex flex-col items-center gap-0.5 text-[#6B6485] hover:text-red-400 rounded-xl transition-all duration-200"
        >
          <LogOut size={22} strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Out</span>
        </button>
      </div>
    </nav>
  );
}
