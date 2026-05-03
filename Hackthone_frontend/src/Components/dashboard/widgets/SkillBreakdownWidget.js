import { StatsIcon } from "../Icons";

export default function SkillBreakdownWidget({ skillMetrics = [] }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm xl:col-span-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[24px] font-bold text-slate-900">Skill Breakdown</h2>
          <p className="mt-1 text-sm text-slate-400">
            Metric bars pulled from the active session
          </p>
        </div>
        <StatsIcon className="h-6 w-6 text-indigo-500" />
      </div>

      <div className="mt-6 space-y-5">
        {skillMetrics.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="mt-1 text-xs text-slate-400">{item.note}</p>
              </div>
              <p className="text-sm font-bold text-slate-900">{item.value}%</p>
            </div>

            <div className="mt-3 h-3 rounded-full bg-slate-100">
              <div
                className={`h-3 rounded-full ${item.tone}`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
