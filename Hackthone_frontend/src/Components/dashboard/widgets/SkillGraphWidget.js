import { SparkIcon } from "../Icons";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function SkillGraphWidget({ skillMetrics = [] }) {
  // Format the data for recharts
  const chartData = skillMetrics.map((item) => ({
    subject: item.label,
    A: item.value,
    fullMark: 100,
  }));

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm xl:col-span-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[24px] font-bold text-slate-900">Skill Graph</h2>
          <p className="mt-1 text-sm text-slate-400">
            Generated from the active interview record
          </p>
        </div>
        <SparkIcon className="h-6 w-6 text-sky-600" />
      </div>

      <div className="mt-5 h-80 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="#dbeafe" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Radar
              name="Skills"
              dataKey="A"
              stroke="#0284c7"
              fill="#0ea5e9"
              fillOpacity={0.18}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
