import { Link } from "react-router";
import { Calendar, Users, Trophy, Activity } from "lucide-react";
import { useStore } from "../store/useStore";
import * as Stats from "../domain/stats";
import * as Callup from "../domain/callup";
import StatCard from "../components/StatCard";

function formatMatchDate(date: string, time: string): string {
  const d = new Date(`${date}T${time || "00:00"}`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }) + (time ? ` · ${time}` : "");
}

export default function Dashboard() {
  const { clubName, players, matches, callups, events } = useStore();

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = matches
    .filter((m) => m.status !== "finished" && m.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const next = upcoming[0];

  const pendingCallups = callups
    .map((c) => ({ match: matches.find((m) => m.id === c.matchId), sum: Callup.summary(callups, c.matchId) }))
    .filter(({ match, sum }) => !!match && match.status !== "finished" && (sum.hasPending || sum.total === 0))
    .map(({ match, sum }) => ({ match: match!, pending: sum.pending }));

  const topScorers = Stats.topScorers(players, events, 5);

  const activeCount = players.filter((p) => p.status !== "inactive").length;
  const liveCount = matches.filter((m) => m.status === "live").length;

  return (
    <section>
      <header className="mb-8">
        <p className="text-sm font-medium text-brand">{clubName}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Home</h1>
        <p className="mt-1 text-slate-600">A quick look at your team.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Players" value={activeCount} icon={<Users size={18} />} />
        <StatCard label="Upcoming matches" value={upcoming.length} icon={<Calendar size={18} />} />
        <StatCard label="Live now" value={liveCount} icon={<Activity size={18} />} />
        <StatCard label="Events logged" value={events.length} icon={<Trophy size={18} />} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Next match
          </h2>
          {next ? (
            <Link
              to={`/matches/${next.id}/callup`}
              className="mt-3 block cursor-pointer rounded-xl border border-slate-100 bg-brand-50 p-4 transition-colors duration-200 hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <p className="text-xs font-medium text-brand">{next.competition}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">vs {next.opponent}</p>
              <p className="mt-1 text-sm text-slate-600">{formatMatchDate(next.date, next.time)}</p>
              <p className="text-sm text-slate-600">{next.location}</p>
            </Link>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No scheduled matches.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Pending callups
          </h2>
          {pendingCallups.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">All confirmed.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {pendingCallups.slice(0, 4).map(({ match, pending }) => (
                <li key={match.id}>
                  <Link
                    to={`/matches/${match.id}/callup`}
                    className="flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">vs {match.opponent}</p>
                      <p className="text-xs text-slate-500">{formatMatchDate(match.date, match.time)}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {pending} pending
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Top scorers
          </h2>
          {topScorers.every((s) => s.points === 0) ? (
            <p className="mt-3 text-sm text-slate-500">No points logged yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {topScorers.map((s, idx) => (
                <li key={s.playerId} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400 w-4">{idx + 1}</span>
                    <span className="text-sm text-slate-900">{s.playerName}</span>
                  </div>
                  <span className="text-sm font-semibold text-brand">{s.points}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </section>
  );
}
