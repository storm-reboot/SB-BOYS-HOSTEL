'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, BookOpen, Play, Send, MoreHorizontal, Trash2, X } from 'lucide-react';
import { Memory, Comment, toggleLike, addComment, getComments, deleteMemory } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';

interface MemoryCardProps {
  memory: Memory;
  onUpdate?: () => void;
  onDelete?: (id: string) => void;
}

function timeAgo(seconds: number): string {
  const diff = Date.now() / 1000 - seconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(seconds * 1000).toLocaleDateString();
}

export default function MemoryCard({ memory, onUpdate, onDelete }: MemoryCardProps) {
  const { user } = useAuth();
  const isOwner = user?.uid === memory.uid;

  const [liked, setLiked] = useState(user ? memory.likes.includes(user.uid) : false);
  const [likeCount, setLikeCount] = useState(memory.likes.length);
  const [commentsCount, setCommentsCount] = useState(memory.commentsCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => (newLiked ? c + 1 : c - 1));
    await toggleLike(memory.id, user.uid, liked);
  };

  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      const fetched = await getComments(memory.id);
      setComments(fetched);
      setLoadingComments(false);
    }
    setShowComments((v) => !v);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    setSubmittingComment(true);
    await addComment(memory.id, user.uid, user.displayName || 'Anonymous', commentText.trim());
    setComments((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        memId: memory.id,
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        text: commentText.trim(),
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      },
    ]);
    setCommentsCount((c) => c + 1);
    setCommentText('');
    setSubmittingComment(false);
    onUpdate?.();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteMemory(memory.id, memory.url);
    setDeleted(true);
    setShowDeleteConfirm(false);
    onDelete?.(memory.id);
  };

  const avatarLetter = memory.displayName?.[0]?.toUpperCase() || '?';

  if (deleted) return null;

  return (
    <article className="glass rounded-2xl overflow-hidden fade-in-up mb-4 group relative">
      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 rounded-2xl">
          <div className="text-center px-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto">
              <Trash2 size={24} className="text-red-400" />
            </div>
            <div>
              <p className="text-[#F0EBF8] font-semibold text-sm">Delete this memory?</p>
              <p className="text-[#6B6485] text-xs mt-1">This cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-[#2D2547] text-sm text-[#A09AB8] hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-400 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#7B2FBE] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {avatarLetter}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#F0EBF8] text-sm truncate">{memory.displayName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {memory.room && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF6B35]/20 text-[#FF8C61] font-medium">
                Room {memory.room}
              </span>
            )}
            {memory.batch && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7B2FBE]/20 text-[#9B59D0] font-medium">
                Batch {memory.batch}
              </span>
            )}
            <span className="text-[10px] text-[#6B6485]">
              {memory.createdAt ? timeAgo(memory.createdAt.seconds) : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {memory.type === 'story' && (
            <div className="flex items-center gap-1 text-[#A09AB8]">
              <BookOpen size={14} />
              <span className="text-xs">Story</span>
            </div>
          )}
          {/* 3-dot menu for owner */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#6B6485] hover:text-[#A09AB8] hover:bg-white/5 transition-all"
                aria-label="Options"
              >
                <MoreHorizontal size={16} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-9 z-10 w-36 glass rounded-xl shadow-xl border border-[#2D2547] overflow-hidden">
                  <button
                    onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#6B6485] hover:bg-white/5 transition-colors"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      {memory.type === 'photo' && memory.url && !imageError && (
        <div className="relative w-full aspect-square bg-[#1A1430] overflow-hidden">
          <Image
            src={memory.url}
            alt={memory.caption}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 600px"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {memory.type === 'video' && memory.url && (
        <div className="relative w-full aspect-video bg-black overflow-hidden">
          <video
            src={memory.url}
            controls
            className="w-full h-full object-cover"
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
              <Play size={24} className="text-white ml-1" />
            </div>
          </div>
        </div>
      )}

      {memory.type === 'story' && (
        <div className="px-4 py-3">
          <div
            className="relative p-4 rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(123,47,190,0.08) 100%)',
              border: '1px solid rgba(255,107,53,0.1)',
            }}
          >
            <p className="text-[#F0EBF8] leading-relaxed text-sm font-display italic">
              &ldquo;{memory.caption}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Caption (for media) */}
      {memory.type !== 'story' && memory.caption && (
        <div className="px-4 pt-2">
          <p className="text-sm text-[#A09AB8] leading-relaxed">
            <span className="text-[#F0EBF8] font-medium">{memory.displayName} </span>
            {memory.caption}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-3">
        <button
          onClick={handleLike}
          className={`touch-target flex items-center gap-1.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            liked
              ? 'text-red-400'
              : 'text-[#6B6485] hover:text-red-400 hover:bg-red-400/10'
          }`}
          aria-label="Like"
        >
          <Heart
            size={18}
            fill={liked ? 'currentColor' : 'none'}
            className={liked ? 'drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]' : ''}
          />
          <span>{likeCount}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="touch-target flex items-center gap-1.5 px-3 rounded-xl text-sm font-medium text-[#6B6485] hover:text-[#A09AB8] hover:bg-white/5 transition-all duration-200"
          aria-label="Comments"
        >
          <MessageCircle size={18} />
          <span>{commentsCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-[#2D2547] px-4 py-3 space-y-2">
          {loadingComments ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-8 shimmer rounded-lg" />
              ))}
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-2 items-start">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#7B2FBE] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {c.displayName[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold text-[#F0EBF8]">{c.displayName} </span>
                  <span className="text-xs text-[#A09AB8]">{c.text}</span>
                </div>
              </div>
            ))
          )}

          {user && (
            <form onSubmit={handleAddComment} className="flex gap-2 mt-3">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 bg-[#2D2547]/50 text-[#F0EBF8] placeholder-[#6B6485] text-xs px-3 py-2 rounded-xl border border-[#2D2547] focus:border-[#FF6B35]/50 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="touch-target w-9 h-9 rounded-xl bg-[#FF6B35] text-white flex items-center justify-center disabled:opacity-50 transition-opacity"
              >
                <Send size={14} />
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
