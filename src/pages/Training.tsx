import { useState } from "react";
import { Plus, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import { useStore } from "../store/useStore";
import type { TrainingLoad, TrainingSession } from "../domain/types";
import * as TrainingDomain from "../domain/training";
import Modal from "../components/Modal";
import Empty from "../components/Empty";

const today = new Date().toISOString().slice(0, 10);

type FormState = Omit<TrainingSession, "id" | "loads">;

const emptyForm: FormState = {
  date: today,
  time: "18:00",
  focus: "",
  location: "",
  notes: "",
};

const numericFields: Array<{ key: keyof TrainingLoad; label: string; max: number; min: number }> = [
  { key: "minutes", label: "Min", max: 240, min: 0 },
  { key: "rpe", label: "RPE", max: 10, min: 0 },
  { key: "fatigue", label: "Fatigue", max: 10, min: 0 },
  { key: "pain", label: "Pain", max: 10, min: 0 },
];

export default function Training() {
  const { trainingSessions, players, addTrainingSession, updateTrainingLoad } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [expanded, setExpanded] = useState<string | null>(
    trainingSessions[0]?.id ?? null,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTrainingSession({ ...form });
    setForm(emptyForm);
    setOpen(false);
  };

  const sortedSessions = [...trainingSessions].sort((a, b) =>
    (b.date + b.time).localeCompare(a.date + a.time),
  );
  const sortedPlayers = [...players].sort((a, b) => Number(a.number) - Number(b.number));

  return (
    <section>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Load</h1>
          <p className="mt-1 text-slate-600">Training sessions and load per player.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New session</span>
        </button>
      </header>

      {sortedSessions.length === 0 ? (
        <Empty
          icon={<Dumbbell size={36} />}
          label="No training sessions yet. Add your first one."
          cta={
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="min-h-11 rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              New session
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((s) => {
            const isOpen = expanded === s.id;
            const present = TrainingDomain.presentCount(s);
            return (
              <div key={s.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  className="flex min-h-11 w-full items-center justify-between p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {s.date} · {s.time}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">{s.focus || "Training"}</h3>
                    <p className="text-sm text-slate-600">
                      {s.location} · {present} present
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {isOpen && (
                  <div className="border-t border-slate-200 p-5 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-medium text-slate-500 uppercase">
                          <th className="pb-2 pr-3">Player</th>
                          <th className="pb-2 pr-3">Pres.</th>
                          {numericFields.map((f) => (
                            <th key={f.key} className="pb-2 pr-3">
                              {f.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedPlayers.map((p) => {
                          const load: TrainingLoad = TrainingDomain.loadFor(trainingSessions, s.id, p.id);
                          return (
                            <tr key={p.id} className={clsx(!load.present && "opacity-60")}>
                              <td className="py-2 pr-3">
                                <span className="font-medium text-slate-900">#{p.number}</span>{" "}
                                <span className="text-slate-700">{p.name}</span>
                              </td>
                              <td className="py-2 pr-3">
                                <input
                                  type="checkbox"
                                  checked={load.present}
                                  onChange={(e) =>
                                    updateTrainingLoad(s.id, p.id, { present: e.target.checked })
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                                />
                              </td>
                              {numericFields.map((f) => (
                                <td key={f.key} className="py-2 pr-3">
                                  <input
                                    type="number"
                                    min={f.min}
                                    max={f.max}
                                    disabled={!load.present}
                                    value={load[f.key] as number}
                                    onChange={(e) =>
                                      updateTrainingLoad(s.id, p.id, {
                                        [f.key]: Number(e.target.value),
                                      })
                                    }
                                    className="min-h-9 w-16 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:bg-slate-50"
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New session">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Date</span>
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Time</span>
              <input
                required
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Focus</span>
            <input
              required
              value={form.focus}
              onChange={(e) => setForm({ ...form, focus: e.target.value })}
              placeholder="Serve and reception"
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Location</span>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button type="submit" className="min-h-11 rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
              Create
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
