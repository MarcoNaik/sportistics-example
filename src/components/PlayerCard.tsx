import clsx from "clsx";
import type { Player } from "../domain/types";
import * as PlayerDomain from "../domain/player";

const statusLabel: Record<NonNullable<Player["status"]>, string> = {
  active: "Active",
  injured: "Injured",
  inactive: "Inactive",
};

const statusClass: Record<NonNullable<Player["status"]>, string> = {
  active: "bg-emerald-100 text-emerald-800",
  injured: "bg-rose-100 text-rose-800",
  inactive: "bg-slate-100 text-slate-700",
};

type Props = {
  player: Player;
  right?: React.ReactNode;
  onClick?: () => void;
};

export default function PlayerCard({ player, right, onClick }: Props) {
  const status = player.status ?? "active";
  const isSub18 = PlayerDomain.isYouth(player);

  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-start gap-3",
        onClick && "cursor-pointer hover:border-brand transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white font-semibold">
        {player.number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900 truncate">{player.name}</h3>
          <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium", statusClass[status])}>
            {statusLabel[status]}
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          {player.position}
          {player.category ? ` · ${player.category}` : ""}
        </p>
        {isSub18 && player.guardianName && (
          <p className="text-xs text-slate-500 mt-1">
            Guardian: {player.guardianName}
            {player.guardianPhone ? ` · ${player.guardianPhone}` : ""}
          </p>
        )}
        {player.phone && !isSub18 && (
          <p className="text-xs text-slate-500 mt-1">Phone: {player.phone}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
