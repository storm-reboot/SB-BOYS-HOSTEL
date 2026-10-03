'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getFeedMemories, Memory } from '@/lib/storage';
import MemoryCard from './MemoryCard';
import { Loader2, RefreshCw } from 'lucide-react';
import { DocumentSnapshot } from 'firebase/firestore';

export default function FeedTimeline() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Use a ref so loadMemories doesn't need to re-create on each cursor update
  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  const loadMemories = useCallback(async (reset = false) => {
    try {
      setError(null);
      if (reset) {
        setLoading(true);
        lastDocRef.current = null;
      } else {
        setLoadingMore(true);
      }
      const cursor = reset ? undefined : lastDocRef.current ?? undefined;
      const { memories: newMems, lastDoc: newLast } = await getFeedMemories(10, cursor);
      lastDocRef.current = newLast;
      if (reset) {
        setMemories(newMems);
      } else {
        setMemories((prev) => [...prev, ...newMems]);
      }
      setHasMore(newMems.length === 10);
    } catch (err) {
      console.error(err);
      setError('Unable to load memories. Please check your connection.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadMemories(true);
  }, [loadMemories]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-full shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 shimmer rounded" />
                <div className="h-2 w-20 shimmer rounded" />
              </div>
            </div>
            <div className="w-full aspect-square shimmer" />
            <div className="p-4 space-y-2">
              <div className="h-3 w-full shimmer rounded" />
              <div className="h-3 w-2/3 shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <RefreshCw size={24} className="text-red-400" />
        </div>
        <p className="text-[#A09AB8] text-sm">{error}</p>
        <button
          onClick={() => loadMemories(true)}
          className="px-6 py-2.5 rounded-xl bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#FF8C61] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="text-6xl">📸</div>
        <h3 className="font-display text-xl text-[#F0EBF8]">No memories yet</h3>
        <p className="text-[#A09AB8] text-sm max-w-xs">
          Be the first to share a memory from your hostel days!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {memories.map((mem) => (
          <MemoryCard
            key={mem.id}
            memory={mem}
            onUpdate={() => loadMemories(true)}
            onDelete={(id) => setMemories((prev) => prev.filter((m) => m.id !== id))}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center py-6">
          <button
            onClick={() => loadMemories(false)}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-3 rounded-xl glass text-sm font-medium text-[#A09AB8] hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      {!hasMore && memories.length > 0 && (
        <p className="text-center text-[#6B6485] text-xs py-6">
          You&apos;ve seen all the memories ✨
        </p>
      )}
    </div>
  );
}
