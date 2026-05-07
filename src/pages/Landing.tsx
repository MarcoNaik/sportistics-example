import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <main className="min-h-screen text-slate-900">
      <section className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 py-20 text-center sm:py-28">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand">
          For coaches and clubs
        </span>
        <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          Sportistics
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-700">
          The ops center for your volleyball team.
        </p>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          Roster, callups, training loads, and stats — all in one place.
        </p>
        <Link
          to="/dashboard"
          className="mt-10 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Open dashboard
          <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}
