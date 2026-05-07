import { Link, NavLink, Outlet, useParams } from "react-router";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import clsx from "clsx";
import { useStore } from "../store/useStore";
import * as Stats from "../domain/stats";
import type { ClubMatch } from "../domain/types";

const statusLabel: Record<ClubMatch["status"], string> = {
  scheduled: "Upcoming",
  live: "Live",
  finished: "Finished",
};

const statusBadge: Record<ClubMatch["status"], string> = {
  scheduled: "bg-brand-50 text-brand",
  live: "bg-red-100 text-red-700",
  finished: "bg-slate-100 text-slate-600",
};

const tabs = [
  { to: ".", label: "Overview", end: true },
  { to: "callup", label: "Callup", end: false },
  { to: "live", label: "Live", end: false },
  { to: "stats", label: "Stats", end: false },
];

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const { matches, events } = useStore();

  const match = matches.find((m) => m.id === matchId);

  if (!match) {
    return (
      <section>
        <p className="text-slate-600">Match not found.</p>
        <Link to="/matches" className="mt-4 inline-flex items-center gap-1 text-sm text-brand rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
          <ArrowLeft size={14} /> Back to matches
        </Link>
      </section>
    );
  }

  const score = Stats.scoreForMatch(events, match.id);
  const showScore = match.status === "live" || match.status === "finished" || score.home > 0 || score.away > 0;

  return (
    <section>
      <Link to="/matches" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
        <ArrowLeft size={14} /> Matches
      </Link>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={clsx(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  statusBadge[match.status],
                )}
              >
                {match.status === "live" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
                {statusLabel[match.status]}
              </span>
              {match.competition && (
                <span className="text-xs font-medium text-slate-500">{match.competition}</span>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">vs {match.opponent}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Calendar size={14} />
                {match.date} · {match.time}
              </span>
              {match.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} />
                  {match.location}
                </span>
              )}
            </div>
          </div>

          {showScore && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-4 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Home</p>
                  <p className="text-3xl font-bold text-brand">{score.home}</p>
                </div>
                <span className="text-slate-400 font-semibold">-</span>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Away</p>
                  <p className="text-3xl font-bold text-slate-700">{score.away}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex gap-6 border-b border-slate-200 overflow-x-auto">
        {tabs.map((t) => (
          <NavLink
            key={t.label}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              clsx(
                "pb-3 pt-2 text-sm font-medium whitespace-nowrap border-b-2 min-h-11 inline-flex items-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                isActive
                  ? "border-brand text-brand"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <div className="mt-6">
        <Outlet />
      </div>
    </section>
  );
}
