export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm text-acid">About TheFitSaathi</p>
      <h1 className="mt-2 text-4xl font-bold text-white">A trust-first Indian fitness ecosystem</h1>
      <p className="mt-6 leading-8 text-zinc-300">TheFitSaathi connects customers with coaches, instructors, martial arts trainers, and dojos while making reliability visible. The product is designed so public numbers come from real registrations and activity, not marketing placeholders.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {["Trust", "Reliability", "Progression"].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 font-semibold text-white">{item}</div>)}
      </div>
    </main>
  );
}
