'use client';
import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, Video, BookOpen, X, Check } from 'lucide-react';
import { uploadFile, createMemory } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

type MemoryType = 'photo' | 'video' | 'story';

export default function UploadPortal() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [memType, setMemType] = useState<MemoryType>('photo');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [room, setRoom] = useState(profile?.room || '');
  const [batch, setBatch] = useState(profile?.batch || '');
  const [storyText, setStoryText] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
    if (f.type.startsWith('video/')) setMemType('video');
    else setMemType('photo');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setError(null);
      setUploading(true);

      let url: string | undefined;
      if (memType !== 'story' && file) {
        url = await uploadFile(file, user.uid, setProgress);
      }

      await createMemory({
        uid: user.uid,
        displayName: profile?.displayName || user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || undefined,
        type: memType,
        url,
        caption: memType === 'story' ? storyText : caption,
        room: room || profile?.room,
        batch: batch || profile?.batch,
      });

      setSuccess(true);
      setTimeout(() => router.push('/feed'), 2000);
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center fade-in-up">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center pulse-glow">
          <Check size={36} className="text-green-400" />
        </div>
        <h2 className="font-display text-2xl gradient-text">Memory Shared!</h2>
        <p className="text-[#A09AB8] text-sm">Redirecting to feed…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type Selector */}
      <div className="flex gap-2 p-1 glass rounded-2xl">
        {([
          { type: 'photo' as MemoryType, icon: ImageIcon, label: 'Photo' },
          { type: 'video' as MemoryType, icon: Video, label: 'Video' },
          { type: 'story' as MemoryType, icon: BookOpen, label: 'Story' },
        ] as const).map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => { setMemType(type); clearFile(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              memType === type
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#7B2FBE] text-white shadow-lg'
                : 'text-[#6B6485] hover:text-[#A09AB8]'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* File Upload (Photo/Video) */}
      {memType !== 'story' && (
        <div>
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
                isDragging
                  ? 'border-[#FF6B35] bg-[#FF6B35]/10 scale-[1.02]'
                  : 'border-[#2D2547] hover:border-[#FF6B35]/50'
              }`}
            >
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center gap-3 py-12 px-6 cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isDragging
                    ? 'bg-[#FF6B35]/30'
                    : 'bg-[#2D2547]'
                }`}>
                  <Upload size={28} className={isDragging ? 'text-[#FF6B35]' : 'text-[#6B6485]'} />
                </div>
                <div className="text-center">
                  <p className="text-[#F0EBF8] text-sm font-medium">
                    Drop your {memType} here
                  </p>
                  <p className="text-[#6B6485] text-xs mt-1">or tap to browse</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#6B6485]">
                  <span className="px-2 py-1 rounded-lg bg-[#2D2547]">
                    {memType === 'photo' ? 'JPG, PNG, WEBP' : 'MP4, MOV, WEBM'}
                  </span>
                  <span>Max 50MB</span>
                </div>
              </label>
              <input
                id="file-upload"
                type="file"
                accept={memType === 'photo' ? 'image/*' : 'video/*'}
                capture={memType === 'photo' ? 'environment' : undefined}
                onChange={handleFileInput}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-[#1A1430]">
              {memType === 'photo' && preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="w-full max-h-64 object-cover" />
              )}
              {memType === 'video' && preview && (
                <video src={preview} controls className="w-full max-h-64" />
              )}
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X size={16} />
              </button>
              <div className="px-4 py-2 text-xs text-[#A09AB8] truncate">{file.name}</div>
            </div>
          )}
        </div>
      )}

      {/* Story Text */}
      {memType === 'story' && (
        <div>
          <label className="block text-xs font-medium text-[#A09AB8] mb-2">Your Story</label>
          <textarea
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            placeholder="Share a memory, an anecdote, or a late-night moment from the hostel…"
            rows={6}
            required
            className="w-full bg-[#1A1430] border border-[#2D2547] rounded-2xl px-4 py-3 text-sm text-[#F0EBF8] placeholder-[#6B6485] focus:border-[#FF6B35]/50 focus:outline-none resize-none transition-colors font-display italic leading-relaxed"
          />
        </div>
      )}

      {/* Caption */}
      {memType !== 'story' && (
        <div>
          <label className="block text-xs font-medium text-[#A09AB8] mb-2">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe this memory…"
            rows={3}
            className="w-full bg-[#1A1430] border border-[#2D2547] rounded-2xl px-4 py-3 text-sm text-[#F0EBF8] placeholder-[#6B6485] focus:border-[#FF6B35]/50 focus:outline-none resize-none transition-colors"
          />
        </div>
      )}

      {/* Tags */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#A09AB8] mb-2">Room No.</label>
          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="e.g. 204"
            className="w-full bg-[#1A1430] border border-[#2D2547] rounded-xl px-3 py-2.5 text-sm text-[#F0EBF8] placeholder-[#6B6485] focus:border-[#FF6B35]/50 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#A09AB8] mb-2">Batch Year</label>
          <input
            type="text"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            placeholder="e.g. 2024"
            className="w-full bg-[#1A1430] border border-[#2D2547] rounded-xl px-3 py-2.5 text-sm text-[#F0EBF8] placeholder-[#6B6485] focus:border-[#FF6B35]/50 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs text-center bg-red-400/10 px-4 py-2 rounded-xl">{error}</p>
      )}

      {/* Progress */}
      {uploading && progress > 0 && progress < 100 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-[#A09AB8]">
            <span>Uploading…</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#2D2547] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-[#7B2FBE] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={uploading || (memType !== 'story' && !file) || (memType === 'story' && !storyText.trim())}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#7B2FBE] text-white font-semibold text-sm shadow-lg hover:shadow-[0_0_30px_rgba(255,107,53,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Sharing…' : '✨ Share Memory'}
      </button>
    </form>
  );
}
