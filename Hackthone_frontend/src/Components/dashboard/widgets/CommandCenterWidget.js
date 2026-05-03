import { useState } from "react";
import { SparkIcon } from "../Icons";
import { formatShortDate, getOutcomeClass } from "../utils";

export default function CommandCenterWidget({
  activeRecord,
  candidateRecords = [],
}) {
  const [activeTab, setActiveTab] = useState("All");
  const interviewTypes = ["All", "Mock Interview", "HR Interview", "Technical Interview"];

  const recentSessions = [...candidateRecords]
    .filter((record) => activeTab === "All" || record.round === activeTab)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <section className="rounded-[30px] bg-gradient-to-br from-[#0f172a] via-[#1d4ed8] to-[#06b6d4] p-5 text-white shadow-[0_28px_70px_rgba(29,78,216,0.25)] xl:col-span-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-100">AIX Command Center</p>
          <h2 className="mt-2 text-xl font-bold leading-tight">Live Session Tracking</h2>
          <p className="mt-1 text-xs text-sky-100">
            Sessions for {activeRecord?.candidate || "Candidate"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 bg-white/10 p-1 rounded-full border border-white/5">
            {interviewTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                  activeTab === type
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-sky-100 hover:bg-white/20"
                }`}
              >
                {type === "All" ? "All" : type.split(" ")[0]}
              </button>
            ))}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
            <SparkIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {recentSessions.slice(0, 3).map((record) => (
          <div
            key={record.id}
            className={`relative rounded-2xl border ${
              record.id === activeRecord?.id
                ? "border-sky-300 bg-white/20 shadow-lg"
                : "border-white/10 bg-white/10"
            } p-4 transition-all`}
          >
            {record.id === activeRecord?.id && (
              <span className="absolute -top-2 -right-2 flex h-5 px-2 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black uppercase text-slate-900 shadow-md">
                Active
              </span>
            )}
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-black/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {record.role.split(" ")[0]}
              </span>
              <span className="text-[10px] font-medium text-sky-100">
                {formatShortDate(record.date)}
              </span>
            </div>
            
            <h3 className="mt-2 text-sm font-bold text-white">{record.round}</h3>
            
            <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-sky-200">Interviewer</p>
                <p className="mt-0.5 text-[11px] font-medium text-white truncate max-w-[100px]">{record.interviewer}</p>
              </div>
              <span className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-sm font-black shadow-inner ${getOutcomeClass(record.score)}`}>
                {record.score}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {recentSessions.length > 3 && (
        <p className="mt-3 text-center text-[11px] font-medium text-sky-200">
          + {recentSessions.length - 3} more sessions
        </p>
      )}
    </section>
  );
}
