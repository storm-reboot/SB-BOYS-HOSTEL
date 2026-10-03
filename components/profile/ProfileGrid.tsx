'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getUserMemories, Memory } from '@/lib/storage';
import { getUserProfile, updateUserProfile, UserProfile } from '@/lib/auth';
import { Camera, BookOpen, Play, Grid, Edit2, Check, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface ProfileGridProps {
  uid: string;
}

export default function ProfileGrid({ uid }: ProfileGridProps) {
  const { user } = useAuth();
  const isOwnProfile = user?.uid === uid;

  const [memories, setMemories] = useState<Memory[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'photo' | 'video' | 'story'>('all');

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', room: '', batch: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [mems, profile] = await Promise.all([
        getUserMemories(uid),
        getUserProfile(uid),
      ]);
      setMemories(mems);
      setUserProfile(profile);
      setLoading(false);
    };
    load();
  }, [uid]);

  const startEdit = () => {
    setEditForm({
      displayName: userProfile?.displayName || '',
      room: userProfile?.room || '',
      batch: userProfile?.batch || '',
      bio: userProfile?.bio || '',
    });
    setSaveError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError(null);
  };

  const saveEdit = async () => {
    if (!editForm.displayName.trim()) {
      setSaveError('Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile(uid, {
        displayName: editForm.displayName.trim(),
        room: editForm.room.trim(),
        batch: editForm.batch.trim(),
        bio: editForm.bio.trim(),
      });
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              displayName: editForm.displayName.trim(),
              room: editForm.room.trim(),
              batch: editForm.batch.trim(),
              bio: editForm.bio.trim(),
            }
          : prev
      );
      setEditing(false);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = filter === 'all' ? memories : memories.filter((m) => m.type === filter);
  const photoCount = memories.filter((m) => m.type === 'photo').length;
  const videoCount = memories.filter((m) => m.type === 'video').length;
  const totalLikes = memories.reduce((acc, m) => acc + m.likes.length, 0);

  const inputClass =
    'w-full bg-[#0F0A1E]/60 border border-[#2D2547] rounded-xl px-3 py-2 text-sm text-[#F0EBF8] placeholder-[#6B6485] focus:border-[#FF6B35]/50 focus:outline-none transition-colors';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-36 shimmer rounded" />
              <div className="h-3 w-24 shimmer rounded" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square shimmer rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Profile Header */}
      <div className="glass rounded-2xl p-5 fade-in-up">
        {editing ? (
          /* ── Edit mode ── */
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-[#A09AB8] uppercase tracking-wide">Edit Profile</p>
              <button onClick={cancelEdit} className="text-[#6B6485] hover:text-[#A09AB8] transition-colors">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="text-xs text-[#6B6485] mb-1 block">Display Name</label>
              <input
                id="edit-display-name"
                value={editForm.displayName}
                onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Your name"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#6B6485] mb-1 block">Room No.</label>
                <input
                  id="edit-room"
                  value={editForm.room}
                  onChange={(e) => setEditForm((f) => ({ ...f, room: e.target.value }))}
                  placeholder="e.g. 204"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-[#6B6485] mb-1 block">Batch Year</label>
                <input
                  id="edit-batch"
                  value={editForm.batch}
                  onChange={(e) => setEditForm((f) => ({ ...f, batch: e.target.value }))}
                  placeholder="e.g. 2024"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#6B6485] mb-1 block">Bio</label>
              <textarea
                id="edit-bio"
                value={editForm.bio}
                onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="A little about yourself…"
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            {saveError && (
              <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-xl">{saveError}</p>
            )}

            <button
              id="save-profile-btn"
              onClick={saveEdit}
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#7B2FBE] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        ) : (
          /* ── View mode ── */
          <>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#7B2FBE] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-lg shadow-orange-500/20">
                {(userProfile?.displayName || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-xl font-bold text-[#F0EBF8] truncate">
                    {userProfile?.displayName || 'Resident'}
                  </h2>
                  {isOwnProfile && (
                    <button
                      id="edit-profile-btn"
                      onClick={startEdit}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-[#6B6485] hover:text-[#FF6B35] hover:bg-[#FF6B35]/10 transition-all"
                      title="Edit profile"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {userProfile?.room && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF6B35]/20 text-[#FF8C61]">
                      Room {userProfile.room}
                    </span>
                  )}
                  {userProfile?.batch && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#7B2FBE]/20 text-[#9B59D0]">
                      Batch {userProfile.batch}
                    </span>
                  )}
                </div>
                {userProfile?.bio && (
                  <p className="text-xs text-[#A09AB8] mt-2 leading-relaxed">{userProfile.bio}</p>
                )}
                {userProfile?.email && (
                  <p className="text-xs text-[#6B6485] mt-1 truncate">{userProfile.email}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#2D2547]">
              {[
                { label: 'Total', value: memories.length },
                { label: 'Photos', value: photoCount },
                { label: 'Videos', value: videoCount },
                { label: 'Likes', value: totalLikes },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-xl font-bold gradient-text">{value}</p>
                  <p className="text-[10px] text-[#6B6485] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 glass rounded-2xl">
        {([
          { key: 'all', icon: Grid, label: 'All' },
          { key: 'photo', icon: Camera, label: 'Photos' },
          { key: 'video', icon: Play, label: 'Videos' },
          { key: 'story', icon: BookOpen, label: 'Stories' },
        ] as const).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
              filter === key
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#7B2FBE] text-white'
                : 'text-[#6B6485] hover:text-[#A09AB8]'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center fade-in-up">
          <div className="text-4xl">🏠</div>
          <p className="text-[#A09AB8] text-sm">No {filter === 'all' ? '' : filter + ' '}memories yet</p>
          <Link
            href="/upload"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#7B2FBE] text-white text-sm font-medium"
          >
            Share your first memory
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {filtered.map((mem, idx) => (
            <div
              key={mem.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-[#1A1430] group cursor-pointer fade-in-up"
              style={{ animationDelay: `${idx * 50}ms` }}
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
                <div className="w-full h-full bg-gradient-to-br from-[#7B2FBE]/30 to-[#FF6B35]/30 flex items-center justify-center">
                  <Play size={24} className="text-white" fill="white" />
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FF6B35]/20 to-[#7B2FBE]/20 flex items-center justify-center p-2">
                  <p className="text-[9px] text-[#F0EBF8] text-center font-display italic leading-tight line-clamp-4">
                    &ldquo;{mem.caption}&rdquo;
                  </p>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <div className="flex items-center gap-1 text-white text-xs">
                  ♥ {mem.likes.length}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
