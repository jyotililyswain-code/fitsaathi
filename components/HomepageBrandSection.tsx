import Link from "next/link";

export function HomepageBrandSection() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      aria-labelledby="about-fitsaathi"
    >
      <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 sm:p-8 lg:p-10">
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">
          The official platform
        </p>
        <h2
          id="about-fitsaathi"
          className="mt-3 text-3xl font-black text-white sm:text-4xl"
        >
          About FitSaathi
        </h2>
        <div className="mt-5 max-w-5xl space-y-4 leading-8 text-zinc-300">
          <p>
            FitSaathi is the official fitness and sports discovery platform at
            thefitsaathi.com. It brings together public information about home
            fitness coaches, personal trainers, yoga instructors, martial arts
            teachers, dojos, gyms and sports training services across India.
            People looking for training can browse public profiles, review
            listed specialties and locations, and compare the information
            providers choose to share before deciding whom to contact or book.
          </p>
          <p>
            Customers can use FitSaathi to{" "}
            <Link href="/find-coach" className="text-acid hover:underline">
              find fitness coaches
            </Link>{" "}
            and{" "}
            <Link href="/dojos" className="text-acid hover:underline">
              explore dojos, gyms and martial arts academies
            </Link>
            . Coaches can create a profile through the{" "}
            <Link
              href="/become-a-coach"
              className="text-acid hover:underline"
            >
              coach registration flow
            </Link>
            , while dojo and gym operators can submit their organisation
            through the{" "}
            <Link href="/register-dojo" className="text-acid hover:underline">
              dojo and gym registration flow
            </Link>
            . Profiles become discoverable according to the platform&apos;s real
            approval and account-status rules; private identity documents,
            booking details and account information are not shown in public
            search content.
          </p>
          <p>
            FitSaathi supports individual fitness goals as well as yoga, sports
            and martial-arts discovery without claiming that a particular
            provider or result is guaranteed. Visitors can{" "}
            <Link href="/about" className="text-acid hover:underline">
              learn more about FitSaathi
            </Link>
            , read the{" "}
            <Link href="/faq" className="text-acid hover:underline">
              FitSaathi FAQs
            </Link>
            , or{" "}
            <Link href="/contact" className="text-acid hover:underline">
              contact FitSaathi support
            </Link>{" "}
            for help with accounts, registrations, bookings and marketplace
            questions.
          </p>
        </div>
      </div>
    </section>
  );
}
