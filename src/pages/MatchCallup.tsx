import { useParams } from "react-router";
import { useStore } from "../store/useStore";
import type { Availability } from "../domain/types";
import * as Callup from "../domain/callup";
import AvailabilityChips from "../components/AvailabilityChips";
import PlayerCard from "../components/PlayerCard";

export default function MatchCallup() {
  const { matchId } = useParams<{ matchId: string }>();
  const { matches, players, callups, setAvailability, togglePlayerInCallup } = useStore();

  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;

  const sum = Callup.summary(callups, match.id);
  const sortedPlayers = [...players].sort((a, b) => Number(a.number) - Number(b.number));
  const roster = Callup.rosterFor(callups, match.id, sortedPlayers);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs mb-5">
        <div className="rounded-lg bg-emerald-50 px-3 py-2">
          <p className="font-semibold text-emerald-800">{sum.available}</p>
          <p className="text-emerald-700">Yes</p>
        </div>
        <div className="rounded-lg bg-amber-50 px-3 py-2">
          <p className="font-semibold text-amber-800">{sum.maybe}</p>
          <p className="text-amber-700">Maybe</p>
        </div>
        <div className="rounded-lg bg-rose-50 px-3 py-2">
          <p className="font-semibold text-rose-800">{sum.unavailable}</p>
          <p className="text-rose-700">No</p>
        </div>
        <div className="rounded-lg bg-slate-100 px-3 py-2">
          <p className="font-semibold text-slate-800">{sum.pending}</p>
          <p className="text-slate-600">Pending</p>
        </div>
      </div>

      <div className="space-y-3">
        {roster.map(({ player, availability }) => {
          const inCallup = availability !== undefined;
          return (
            <PlayerCard
              key={player.id}
              player={player}
              right={
                <div className="flex flex-col items-end gap-2">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={inCallup}
                      onChange={() => togglePlayerInCallup(match.id, player.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    />
                    Called up
                  </label>
                  {inCallup && (
                    <AvailabilityChips
                      value={availability}
                      onChange={(v: Availability) => setAvailability(match.id, player.id, v)}
                    />
                  )}
                </div>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
