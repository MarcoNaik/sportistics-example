import { useState } from "react";
import { NavLink } from "react-router";
import { Plus, Pencil, Trash2, Users, Dumbbell } from "lucide-react";
import { useStore } from "../store/useStore";
import type { Player } from "../domain/types";
import * as PlayerDomain from "../domain/player";
import PlayerCard from "../components/PlayerCard";
import Modal from "../components/Modal";
import Empty from "../components/Empty";

const statuses: Array<{ value: Player["status"]; label: string }> = [
  { value: "active", label: "Active" },
  { value: "injured", label: "Injured" },
  { value: "inactive", label: "Inactive" },
];

type FormState = {
  number: string;
  name: string;
  position: PlayerDomain.PlayerPosition;
  category: PlayerDomain.PlayerCategory;
  status: NonNullable<Player["status"]>;
  phone: string;
  guardianName: string;
  guardianPhone: string;
};

const emptyForm: FormState = {
  number: "",
  name: "",
  position: PlayerDomain.POSITIONS[0],
  category: PlayerDomain.CATEGORIES[0],
  status: "active",
  phone: "",
  guardianName: "",
  guardianPhone: "",
};

export default function Roster() {
  const { players, addPlayer, updatePlayer, removePlayer } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const isSub18 = PlayerDomain.isYouth({ category: form.category });

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (player: Player) => {
    setEditing(player);
    setForm({
      number: player.number,
      name: player.name,
      position: player.position,
      category: player.category ?? PlayerDomain.CATEGORIES[0],
      status: player.status ?? "active",
      phone: player.phone ?? "",
      guardianName: player.guardianName ?? "",
      guardianPhone: player.guardianPhone ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        updatePlayer(editing.id, { ...form });
      } else {
        addPlayer({ ...form });
      }
      setOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    if (confirm(`Delete ${editing.name}?`)) {
      removePlayer(editing.id);
      setOpen(false);
    }
  };

  const sorted = [...players].sort((a, b) => Number(a.number) - Number(b.number));

  return (
    <section>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Roster</h1>
          <p className="mt-1 text-slate-600">Manage your players.</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add player</span>
        </button>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        <NavLink
          to="/training"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <Dumbbell className="size-4" />
          Training loads
        </NavLink>
      </div>

      {sorted.length === 0 ? (
        <Empty
          icon={<Users size={36} />}
          label="No players yet. Add your first one."
          cta={
            <button
              type="button"
              onClick={openNew}
              className="min-h-11 rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Add player
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {sorted.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              right={
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-1.5 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  aria-label="Edit"
                >
                  <Pencil size={16} />
                </button>
              }
            />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit player" : "New player"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Number</span>
              <input
                required
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              />
            </label>
            <label className="col-span-2 block">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Position</span>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value as PlayerDomain.PlayerPosition })}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                {PlayerDomain.POSITIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as PlayerDomain.PlayerCategory })}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                {PlayerDomain.CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as NonNullable<Player["status"]> })}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {!isSub18 && (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Phone</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              />
            </label>
          )}

          {isSub18 && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Guardian</span>
                <input
                  required
                  value={form.guardianName}
                  onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Guardian phone</span>
                <input
                  required
                  type="tel"
                  value={form.guardianPhone}
                  onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                />
              </label>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            {editing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600 transition-colors duration-200 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
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
                className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                Cancel
              </button>
              <button type="submit" className="min-h-11 rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                Save
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </section>
  );
}
