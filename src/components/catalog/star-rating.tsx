export function StarRating({
  rating,
  className = "",
}: {
  rating: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-accent-500 ${className}`}
      role="img"
      aria-label={`${rating.toFixed(1)} / 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
          <defs>
            <linearGradient id={`star-${i}-${rating}`}>
              <stop
                offset={`${Math.round(Math.min(Math.max(rating - (i - 1), 0), 1) * 100)}%`}
                stopColor="currentColor"
              />
              <stop offset="0%" stopColor="#d8d4c8" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#star-${i}-${rating})`}
            d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z"
          />
        </svg>
      ))}
    </span>
  );
}
