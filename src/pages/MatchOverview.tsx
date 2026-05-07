import { Link, useParams } from "react-router";
import { ClipboardList, Trophy, StickyNote } from "lucide-react";
import { useStore } from "../store/useStore";
import * as Callup from "../domain/callup";
import * as Stats from "../domain/stats";

export default function MatchOverview() {
  const { matchId } = useParams<{ matchId: string }>();
  const { matches, players, callups, events } = useStore();

  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;

  const sum = Callup.summary(callups, match.id);
  const stats = Stats.forMatch(players, events, match.id);
  const top = stats.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Link
        to="./callup"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <div className="flex items-center gap-2 text-brand">
          <ClipboardList size={18} />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Callup</h2>
        </div>
        {sum.total === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            No callup yet. <span className="font-medium text-brand">Create one →</span>
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-slate-700">
              {sum.available} available · {sum.pending} pending · {sum.unavailable} unavailable
            </p>
            <p className="mt-2 text-sm font-medium text-brand">View callup →</p>
          </>
        )}
      </Link>

      <Link
        to="./stats"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <div className="flex items-center gap-2 text-brand">
          <Trophy size={18} />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Top scorers this match</h2>
        </div>
        {top.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No stats yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {top.map((s, idx) => (
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
      </Link>

      {match.notes && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 text-slate-500">
            <StickyNote size={18} />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Notes</h2>
          </div>
          <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{match.notes}</p>
        </div>
      )}
    </div>
  );
}
