'use client';
export default function Offline() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-5">
      <div className="text-6xl">📡</div>
      <div>
        <h1 className="font-display text-2xl font-bold gradient-text mb-2">You&apos;re Offline</h1>
        <p className="text-[#A09AB8] text-sm max-w-xs">
          Check your connection to view the memory feed. Cached pages are still available.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#7B2FBE] text-white text-sm font-medium"
      >
        Try Again
      </button>
    </div>
  );
}
