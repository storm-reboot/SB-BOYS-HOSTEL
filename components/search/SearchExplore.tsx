'use client';
import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Search, X, Camera, Video, BookOpen, Grid, Loader2, Heart } from 'lucide-react';
import { searchMemories, Memory } from '@/lib/storage';

type FilterType = 'all' | 'photo' | 'video' | 'story';

const TYPE_TABS = [
  { key: 'all' as FilterType, icon: Grid, label: 'All' },
  { key: 'photo' as FilterType, icon: Camera, label: 'Photos' },
  { key: 'video' as FilterType, icon: Video, label: 'Videos' },
  { key: 'story' as FilterType, icon: BookOpen, label: 'Stories' },
];

export default function SearchExplore() {
  const [keyword, setKeyword] = useState('');
  const [room, setRoom] = useState('');
  const [batch, setBatch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [results, setResults] = useState<Memory[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (kw: string, rm: string, bt: string, tp: FilterType) => {
      // If all filters are empty, clear results
      if (!kw.trim() && !rm.trim() && !bt.trim() && tp === 'all') {
        setResults(null);
        setSearched(false);
        return;
      }
      setSearching(true);
      const res = await searchMemories({
        keyword: kw.trim() || undefined,
        room: rm.trim() || undefined,
        batch: bt.trim() || undefined,
        type: tp !== 'all' ? tp : undefined,
      });
      setResults(res);
      setSearched(true);
      setSearching(false);
    },
    []
  );

  const triggerSearch = (kw = keyword, rm = room, bt = batch, tp = typeFilter) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(kw, rm, bt, tp), 400);
  };

  const clearAll = () => {
    setKeyword('');
    setRoom('');
    setBatch('');
    setTypeFilter('all');
    setResults(null);
    setSearched(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const hasFilters = keyword || room || batch || typeFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Keyword Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6485] pointer-events-none"
        />
        <input
          id="search-keyword"
          type="text"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            triggerSearch(e.target.value, room, batch, typeFilter);
          }}
          placeholder="Search captions, names…"
          className="w-full pl-10 pr-10 py-3 glass rounded-2xl text-sm text-[#F0EBF8] placeholder-[#6B6485] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/40 border border-[#2D2547] focus:border-[#FF6B35]/50 transition-all"
        />
        {keyword && (
          <button
            onClick={() => { setKeyword(''); triggerSearch('', room, batch, typeFilter); }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B6485] hover:text-[#A09AB8]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Room + Batch filters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <input
            id="search-room"
            type="text"
            value={room}
            onChange={(e) => {
              setRoom(e.target.value);
              triggerSearch(keyword, e.target.value, batch, typeFilter);
            }}
            placeholder="Room no."
            className="w-full px-3 py-2.5 glass rounded-xl text-sm text-[#F0EBF8] placeholder-[#6B6485] focus:outline-none border border-[#2D2547] focus:border-[#FF6B35]/50 transition-all"
          />
        </div>
        <div className="relative">
          <input
            id="search-batch"
            type="text"
            value={batch}
            onChange={(e) => {
              setBatch(e.target.value);
              triggerSearch(keyword, room, e.target.value, typeFilter);
            }}
            placeholder="Batch year"
            className="w-full px-3 py-2.5 glass rounded-xl text-sm text-[#F0EBF8] placeholder-[#6B6485] focus:outline-none border border-[#2D2547] focus:border-[#FF6B35]/50 transition-all"
          />
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex gap-1 p-1 glass rounded-2xl">
        {TYPE_TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => {
              setTypeFilter(key);
              triggerSearch(keyword, room, batch, key);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
              typeFilter === key
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#7B2FBE] text-white'
                : 'text-[#6B6485] hover:text-[#A09AB8]'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Clear button */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 text-xs text-[#6B6485] hover:text-[#A09AB8] transition-colors"
        >
          <X size={12} />
          Clear all filters
        </button>
      )}

      {/* Results */}
      {searching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-[#FF6B35] animate-spin" />
        </div>
      )}

      {!searching && searched && results !== null && (
        <>
          <p className="text-xs text-[#6B6485]">
            {results.length === 0 ? 'No memories found' : `${results.length} memor${results.length === 1 ? 'y' : 'ies'} found`}
          </p>

          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="text-5xl">🔍</div>
              <p className="text-[#A09AB8] text-sm">Try different keywords, room, or batch</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {results.map((mem, idx) => (
                <div
                  key={mem.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-[#1A1430] group cursor-pointer fade-in-up"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {mem.type === 'photo' && mem.url ? (
                    <Image
                      src={mem.url}
                      alt={mem.caption}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 768px) 33vw, 200px"
                    />
                  ) : mem.type === 'video' ? (
                    <div className="w-full h-full bg-gradient-to-br from-[#7B2FBE]/30 to-[#FF6B35]/30 flex flex-col items-center justify-center gap-1">
                      <Video size={20} className="text-white" />
                      <span className="text-[9px] text-white/70">Video</span>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FF6B35]/20 to-[#7B2FBE]/20 flex items-center justify-center p-2">
                      <p className="text-[9px] text-[#F0EBF8] text-center font-display italic leading-tight line-clamp-4">
                        &ldquo;{mem.caption}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                    <p className="text-white text-[9px] font-semibold text-center truncate w-full">{mem.displayName}</p>
                    <div className="flex items-center gap-2 text-[9px] text-white/80">
                      <span className="flex items-center gap-0.5">
                        <Heart size={9} fill="currentColor" /> {mem.likes.length}
                      </span>
                      {mem.room && <span>Rm {mem.room}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!searching && !searched && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2D2547] flex items-center justify-center">
            <Search size={28} className="text-[#6B6485]" />
          </div>
          <div>
            <p className="text-[#A09AB8] text-sm font-medium">Find memories</p>
            <p className="text-[#6B6485] text-xs mt-1">Enter a keyword, room number, or batch year above</p>
          </div>
        </div>
      )}
    </div>
  );
}
