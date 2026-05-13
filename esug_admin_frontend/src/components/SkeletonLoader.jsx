export default function SkeletonLoader({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-5 bg-surface-hover rounded-xl animate-pulse"
          style={{ width: `${85 - (i % 3) * 15}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-surface-hover" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-hover rounded-xl w-2/3" />
          <div className="h-3 bg-surface-hover rounded-xl w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-surface-hover rounded-xl" />
        <div className="h-3 bg-surface-hover rounded-xl w-4/5" />
      </div>
    </div>
  );
}

export function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-surface-border animate-pulse">
      <div className="w-8 h-6 bg-surface-hover rounded-lg" />
      <div className="w-12 h-12 rounded-2xl bg-surface-hover" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-surface-hover rounded-xl w-1/3" />
        <div className="h-3 bg-surface-hover rounded-xl w-1/2" />
      </div>
      <div className="h-6 w-16 bg-surface-hover rounded-full" />
    </div>
  );
}
