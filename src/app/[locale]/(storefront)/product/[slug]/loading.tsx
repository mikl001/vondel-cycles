export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-hidden>
      <div className="mb-6 h-4 w-64 animate-pulse rounded bg-vondel-100" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-[4/3] animate-pulse rounded-2xl bg-vondel-100" />
        <div className="flex flex-col gap-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-vondel-100" />
          <div className="h-10 w-40 animate-pulse rounded bg-vondel-100" />
          <div className="h-24 animate-pulse rounded bg-vondel-100" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-vondel-100" />
        </div>
      </div>
    </div>
  );
}
