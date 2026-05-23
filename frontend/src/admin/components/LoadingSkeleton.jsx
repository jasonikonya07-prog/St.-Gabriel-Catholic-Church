function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-soft">
      <div className="h-6 w-48 animate-pulse rounded-full bg-cream" />
      <div className="mt-5 grid gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid gap-3 rounded-xl border border-navy/5 p-4 sm:grid-cols-4">
            <div className="h-4 animate-pulse rounded-full bg-cream" />
            <div className="h-4 animate-pulse rounded-full bg-cream" />
            <div className="h-4 animate-pulse rounded-full bg-cream" />
            <div className="h-4 animate-pulse rounded-full bg-cream" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LoadingSkeleton;
