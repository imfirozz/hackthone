import { useNavigate } from "react-router-dom";
import { ArrowRightIcon } from "../Icons";

export default function RecommendedMocksWidget({ candidateRecords = [] }) {
  const navigate = useNavigate();

  // Find lowest scoring round
  const roundScores = {};
  candidateRecords.forEach((record) => {
    if (!roundScores[record.round]) roundScores[record.round] = { total: 0, count: 0 };
    roundScores[record.round].total += record.score;
    roundScores[record.round].count += 1;
  });

  const sortedRounds = Object.entries(roundScores)
    .map(([round, data]) => ({ round, score: data.total / data.count }))
    .sort((a, b) => a.score - b.score); // Ascending, lowest first

  const targetRound = sortedRounds[0]?.round || "Technical Interview";

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm xl:col-span-6 flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-[24px] font-bold text-slate-900">Recommended Action</h2>
          <p className="mt-1 text-sm text-slate-400">
            Suggested next steps based on recent scores
          </p>
        </div>
      </div>

      <div className="mt-6 flex-1 flex flex-col items-center justify-center text-center bg-slate-50 rounded-[24px] p-6 border border-slate-100">
        <div className="h-14 w-14 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 mb-2">Schedule a {targetRound}</h3>
        <p className="text-sm text-slate-500 max-w-[280px] mb-6 leading-relaxed">
          Your average score in {targetRound} sessions is lagging behind. We recommend a targeted mock to improve this.
        </p>
        
        <button
          onClick={() => navigate("/interviews")}
          className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          Book AI Mock Interview
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
