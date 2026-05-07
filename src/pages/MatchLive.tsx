import { useParams } from "react-router";
import { useStore } from "../store/useStore";
import * as Stats from "../domain/stats";

export default function MatchLive() {
  const { matchId } = useParams<{ matchId: string }>();
  const { matches, events } = useStore();

  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;

  const matchEvents = events.filter((e) => e.matchId === match.id);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Events</h2>
      {matchEvents.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No events yet.</p>
      ) : (
        <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto">
          {[...matchEvents].reverse().map((e) => (
            <li
              key={e.id}
              className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
            >
              <span className="text-xs font-semibold text-slate-400 w-6">#{e.sequence}</span>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium text-slate-900">{e.playerName ?? "—"}</span>{" "}
                  <span className="text-slate-600">
                    {Stats.actionLabels[e.actionType]} · {Stats.resultLabels[e.result]}
                  </span>
                </p>
                {e.pointFor && (
                  <p className="mt-0.5 text-xs font-medium text-brand">
                    {e.pointFor === "home" ? "Home" : "Away"} point
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
