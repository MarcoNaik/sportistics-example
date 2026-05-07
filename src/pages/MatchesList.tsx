import { useState } from "react";
import { Link } from "react-router";
import { Plus, Pencil, Trash2, Calendar, MapPin, ClipboardList } from "lucide-react";
import clsx from "clsx";
import { useStore } from "../store/useStore";
import * as Callup from "../domain/callup";
import type { ClubMatch } from "../domain/types";
import Modal from "../components/Modal";
import Empty from "../components/Empty";

type Filter = "all" | "upcoming" | "needs-callup" | "live" | "finished";

const filters: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "needs-callup", label: "Pending" },
  { value: "live", label: "Live" },
  { value: "finished", label: "Finished" },
];

const statusOptions: Array<{ value: ClubMatch["status"]; label: string }> = [
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "finished", label: "Finished" },
];

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

type FormState = Omit<ClubMatch, "id">;

const todayISO = new Date().toISOString().slice(0, 10);

const emptyForm: FormState = {
  date: todayISO,
  time: "19:00",
  opponent: "",
  location: "",
  competition: "",
  status: "scheduled",
  notes: "",
};

export default function MatchesList() {
  const { matches, callups, addMatch, updateMatch, removeMatch } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClubMatch | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (match: ClubMatch) => {
    setEditing(match);
    setForm({ ...match });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMatch(editing.id, { ...form });
    } else {
      addMatch({ ...form });
    }
    setOpen(false);
  };

  const handleDelete = () => {
    if (!editing) return;
    if (confirm(`Delete match vs ${editing.opponent}?`)) {
      removeMatch(editing.id);
      setOpen(false);
    }
  };

  const sorted = [...matches].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const filtered = sorted.filter((m) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return m.status === "scheduled" && m.date >= todayISO;
    if (filter === "live") return m.status === "live";
    if (filter === "finished") return m.status === "finished";
    if (filter === "needs-callup") {
      const s = Callup.summary(callups, m.id);
      return s.hasPending || s.total === 0;
    }
    return true;
  });

  return (
    <section>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Matches</h1>
          <p className="mt-1 text-slate-600">Upcoming matches and results.</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-900 min-h-11 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New match</span>
        </button>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={clsx(
              "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium min-h-11 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              filter === f.value
                ? "bg-brand text-white focus-visible:ring-offset-1"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:ring-offset-2",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon={<Calendar size={36} />}
          label={
            matches.length === 0
              ? "No matches yet. Schedule your first one."
              : "No matches for this filter."
          }
          cta={
            matches.length === 0 ? (
              <button
                type="button"
                onClick={openNew}
                className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-900 min-h-11 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                New match
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const sum = Callup.summary(callups, m.id);
            const showCallupChip = sum.hasPending || sum.total === 0;
            const callupChipText = sum.total === 0 ? "No callup" : `${sum.pending} pending`;

            return (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:border-brand transition-colors"
              >
                <Link to={`/matches/${m.id}`} className="min-w-0 flex-1 cursor-pointer rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        statusBadge[m.status],
                      )}
                    >
                      {m.status === "live" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                      {statusLabel[m.status]}
                    </span>
                    {m.competition && (
                      <span className="text-xs font-medium text-slate-500">{m.competition}</span>
                    )}
                    {showCallupChip && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <ClipboardList size={12} />
                        {callupChipText}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">vs {m.opponent}</h3>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={14} />
                      {m.date} · {m.time}
                    </span>
                    {m.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={14} />
                        {m.location}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(m);
                    }}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 min-h-11 min-w-11 inline-flex items-center justify-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    aria-label="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit match" : "New match"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Date</span>
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Time</span>
              <input
                required
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Opponent</span>
            <input
              required
              value={form.opponent}
              onChange={(e) => setForm({ ...form, opponent: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Location</span>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Competition</span>
            <input
              value={form.competition}
              onChange={(e) => setForm({ ...form, competition: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ClubMatch["status"] })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center justify-between gap-3 pt-2">
            {editing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 min-h-11 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <Trash2 size={14} />
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50 min-h-11 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-900 min-h-11 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                Save
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </section>
  );
}
