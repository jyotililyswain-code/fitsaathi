import Link from "next/link";

export default function SetupPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm text-acid">Local setup</p>
      <h1 className="mt-2 text-4xl font-bold text-white">PostgreSQL is the application database</h1>
      <p className="mt-4 leading-7 text-zinc-400">All application data is stored through Prisma. Start PostgreSQL, apply migrations, then run both development servers.</p>
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.05] p-6">
        <h2 className="text-xl font-semibold text-white">Development commands</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-ink p-4 text-sm text-zinc-300">npm install{"\n"}npm run db:generate{"\n"}npm run db:migrate{"\n"}npm run dev</pre>
      </section>
      <div className="mt-8 text-sm"><Link href="/" className="text-acid">Home</Link></div>
    </main>
  );
}
