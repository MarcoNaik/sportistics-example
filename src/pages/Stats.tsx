import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import clsx from "clsx";
import { useStore } from "../store/useStore";
import { season } from "../domain/stats";
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

export default function Stats() {
  const { players, events } = useStore();
  const [sortKey, setSortKey] = useState<SortKey>("points");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const stats = season(players, events);

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

  const totalPoints = stats.reduce((acc, s) => acc + s.points, 0);
  const totalKills = stats.reduce((acc, s) => acc + s.kills, 0);
  const totalAces = stats.reduce((acc, s) => acc + s.aces, 0);

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Stats</h1>
        <p className="mt-1 text-slate-600">Aggregated season stats.</p>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total points</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalPoints}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Kills</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalKills}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Aces</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalAces}</p>
        </div>
      </div>

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
                      "inline-flex min-h-11 items-center gap-1 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                      sortKey === c.key ? "text-brand" : "text-slate-500 hover:text-slate-900",
                    )}
                  >
                    {c.label}
                    {sortKey === c.key &&
                      (dir === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
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
    </section>
  );
}
