export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Loading page" className="mx-auto min-h-[60dvh] w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <span className="sr-only">Loading page...</span>
      <div className="h-4 w-32 animate-pulse rounded-full bg-acid/15" />
      <div className="mt-5 h-10 max-w-xl animate-pulse rounded-xl bg-white/[0.06]" />
      <div className="mt-4 h-5 max-w-2xl animate-pulse rounded-lg bg-white/[0.04]" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
        ))}
      </div>
    </main>
  );
}
