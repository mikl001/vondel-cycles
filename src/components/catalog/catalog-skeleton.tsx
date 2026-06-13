/** Lightweight streamed fallback for catalog listings while the RSC fetch
 *  resolves. Pure presentational, no client JS. */
export function CatalogSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-hidden>
      <div className="mb-6 h-8 w-56 animate-pulse rounded bg-vondel-100" />
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className="hidden flex-col gap-4 lg:flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-vondel-100" />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <li
              key={i}
              className="aspect-[3/4] animate-pulse rounded-xl bg-vondel-100"
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
