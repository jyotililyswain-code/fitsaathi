export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="h-8 w-48 animate-pulse rounded-full bg-white/10" />
      <div className="mt-6 h-14 max-w-2xl animate-pulse rounded-2xl bg-white/10" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {["one", "two", "three"].map((item) => (
          <div key={item} className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]" />
        ))}
      </div>
    </main>
  );
}
