import { TrendUpIcon } from "../Icons";
import { formatShortDate } from "../utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function InterviewTrendWidget({
  activeRecordCandidate,
  candidateRecords = [],
}) {
  const chartData = candidateRecords.map((item) => ({
    name: formatShortDate(item.date),
    score: item.score,
  }));

  const firstCandidateScore = candidateRecords[0]?.score || 0;
  const lastCandidateScore =
    candidateRecords[candidateRecords.length - 1]?.score || 0;
  const candidateGrowth = lastCandidateScore - firstCandidateScore;

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm xl:col-span-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[24px] font-bold text-slate-900">Interview Trend</h2>
          <p className="mt-1 text-sm text-slate-400">
            Previous sessions for {activeRecordCandidate}
          </p>
        </div>
        <TrendUpIcon className="h-6 w-6 text-emerald-500" />
      </div>

      <div className="mt-6 rounded-[26px] bg-slate-50 p-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#0284c7"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorScore)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            First
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {firstCandidateScore}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Growth
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${
              candidateGrowth >= 0 ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {candidateGrowth >= 0 ? "+" : ""}
            {candidateGrowth}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Sessions
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {candidateRecords.length}
          </p>
        </div>
      </div>
    </section>
  );
}
