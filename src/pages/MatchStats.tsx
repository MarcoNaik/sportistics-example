import { useState } from "react";
import { useParams } from "react-router";
import { ArrowDown, ArrowUp } from "lucide-react";
import clsx from "clsx";
import { useStore } from "../store/useStore";
import * as Stats from "../domain/stats";
import type { PlayerStats } from "../domain/types";

type SortKey = "points" | "kills" | "aces" | "blocks" | "digs" | "assists";

const columns: Array<{ key: SortKey; label: string }> = [
  { key: "points", label: "Pts" },
  { key: "kills", label: "Kills" },
  { key: "aces", label: "Aces" },
  { key: "blocks", label: "Blocks" },
  { key: "digs", label: "Digs" },
  { key: "assists", label: "Assists" },
];

export default function MatchStats() {
  const { matchId } = useParams<{ matchId: string }>();
  const { matches, players, events } = useStore();
  const [sortKey, setSortKey] = useState<SortKey>("points");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;

  const stats = Stats.forMatch(players, events, match.id);

  const sorted = [...stats].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return dir === "desc" ? bv - av : av - bv;
  });

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDir(dir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setDir("desc");
    }
  };

  if (stats.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">No stats yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left">
            <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Player</th>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-3 text-xs font-semibold uppercase">
                <button
                  type="button"
                  onClick={() => toggleSort(c.key)}
                  className={clsx(
                    "inline-flex items-center gap-1 min-h-11 transition-colors duration-200 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                    sortKey === c.key ? "text-brand" : "text-slate-500 hover:text-slate-900",
                  )}
                >
                  {c.label}
                  {sortKey === c.key && (dir === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((s: PlayerStats) => (
            <tr key={s.playerId} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{s.playerName}</td>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={clsx(
                    "px-3 py-3 tabular-nums",
                    sortKey === c.key ? "font-semibold text-brand" : "text-slate-700",
                  )}
                >
                  {s[c.key] as number}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
