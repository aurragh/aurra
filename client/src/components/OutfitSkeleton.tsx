/** Shimmer skeleton placeholder while an outfit is generating. */
export function OutfitSkeleton() {
  return (
    <div
      className="max-w-lg mx-auto w-full rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.045), rgba(168,85,247,0.025))",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="px-5 pt-5 pb-3 space-y-2">
        <div className="shimmer h-4 rounded-md w-[85%]" />
        <div className="shimmer h-4 rounded-md w-[70%]" />
        <div className="shimmer h-4 rounded-md w-[50%]" />
      </div>
      <div className="shimmer h-64 w-full" />
      <div className="p-4 grid grid-cols-2 gap-2">
        <div className="shimmer h-10 rounded-xl" />
        <div className="shimmer h-10 rounded-xl" />
      </div>
      <style>{`
        .shimmer {
          background: linear-gradient(90deg,
            rgba(255,255,255,0.03) 0%,
            rgba(168,85,247,0.08) 50%,
            rgba(255,255,255,0.03) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
