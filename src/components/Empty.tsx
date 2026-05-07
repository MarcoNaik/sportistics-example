type Props = {
  icon?: React.ReactNode;
  label: string;
  cta?: React.ReactNode;
};

export default function Empty({ icon, label, cta }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      {icon && <div className="mx-auto mb-3 text-slate-400 flex justify-center">{icon}</div>}
      <p className="text-slate-500">{label}</p>
      {cta && <div className="mt-4 flex justify-center">{cta}</div>}
    </div>
  );
}
