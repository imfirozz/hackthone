import { ChevronDownIcon } from "../Icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function PerformanceWidget({ roundPerformance = [] }) {
  // Map data to match recharts format
  const chartData = roundPerformance.map((item) => ({
    name: item.label,
    Qualified: item.pass,
    "Needs review": item.review,
  }));

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm xl:col-span-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[24px] font-bold text-slate-900">
            Interview Round Performance
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Pass / Review ratios per round
          </p>
        </div>

        <button
          type="button"
          onClick={() => console.log("By Round Filter Clicked")}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
        >
          By round
          <ChevronDownIcon className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      <div className="mt-8 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
            barSize={32}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
            />
            <Bar dataKey="Needs review" stackId="a" fill="#bae6fd" radius={[0, 0, 4, 4]} />
            <Bar dataKey="Qualified" stackId="a" fill="#0284c7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
