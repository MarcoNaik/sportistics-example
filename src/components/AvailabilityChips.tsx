import clsx from "clsx";
import type { Availability } from "../domain/types";

const options: Array<{ value: Availability; label: string; activeClass: string }> = [
  { value: "available", label: "Yes", activeClass: "bg-emerald-600 text-white border-emerald-600" },
  { value: "maybe", label: "Maybe", activeClass: "bg-amber-500 text-white border-amber-500" },
  { value: "unavailable", label: "No", activeClass: "bg-rose-600 text-white border-rose-600" },
  { value: "pending", label: "Pending", activeClass: "bg-slate-600 text-white border-slate-600" },
];

type Props = {
  value: Availability | undefined;
  onChange: (value: Availability) => void;
};

export default function AvailabilityChips({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
              active ? opt.activeClass : "border-slate-300 text-slate-600 hover:bg-slate-100",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
