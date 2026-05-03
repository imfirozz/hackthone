import { SparkIcon } from "../Icons";

export default function StrengthsAnalysisWidget({ candidateRecords = [] }) {
  // Aggregate average scores per tag/skill from all candidate records
  const tagScores = {};
  candidateRecords.forEach((record) => {
    record.focusTags.forEach((tag) => {
      if (!tagScores[tag]) tagScores[tag] = { total: 0, count: 0 };
      tagScores[tag].total += record.score;
      tagScores[tag].count += 1;
    });
  });

  const sortedTags = Object.entries(tagScores)
    .map(([tag, data]) => ({ tag, score: data.total / data.count }))
    .sort((a, b) => b.score - a.score);

  const strengths = sortedTags.slice(0, 3);
  const weaknesses = sortedTags.slice(-2).reverse();

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm xl:col-span-6 flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-[24px] font-bold text-slate-900">Strengths & Analysis</h2>
          <p className="mt-1 text-sm text-slate-400">
            AI-driven breakdown of technical competencies
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
          <SparkIcon className="h-6 w-6 text-emerald-600" />
        </div>
      </div>

      <div className="mt-6 flex-1 grid gap-6 sm:grid-cols-2">
        <div className="rounded-[24px] bg-emerald-50/50 p-5 border border-emerald-100/50">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-4">
            Top Strengths
          </p>
          <div className="space-y-3">
            {strengths.length > 0 ? (
              strengths.map((item) => (
                <div key={item.tag} className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl shadow-sm border border-emerald-100">
                  <span className="text-[13px] font-bold text-slate-800">{item.tag}</span>
                  <span className="text-[11px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">{Math.round(item.score)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Not enough data.</p>
            )}
          </div>
        </div>

        <div className="rounded-[24px] bg-rose-50/50 p-5 border border-rose-100/50">
          <p className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-4">
            Areas to Improve
          </p>
          <div className="space-y-3">
            {weaknesses.length > 0 ? (
              weaknesses.map((item) => (
                <div key={item.tag} className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl shadow-sm border border-rose-100">
                  <span className="text-[13px] font-bold text-slate-800">{item.tag}</span>
                  <span className="text-[11px] font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">{Math.round(item.score)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Not enough data.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
