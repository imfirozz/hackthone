import { TrophyIcon, TrendUpIcon, TrendDownIcon } from "../Icons";
import { useNavigate } from "react-router-dom";

function getScoreColor(score) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-blue-600";
  if (score >= 55) return "text-amber-600";
  return "text-rose-600";
}

function getRankIcon(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export default function LeaderboardWidget({ leaderboard = [], onMemberSelect }) {
  const navigate = useNavigate();
  const top8 = leaderboard.slice(0, 8);

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Leaderboard</h2>
          <p className="text-[12px] text-slate-400">Top performers</p>
        </div>
        <button
          onClick={() => navigate("/leaderboard")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 transition-all text-[11px] font-bold text-amber-700"
        >
          <TrophyIcon className="h-3.5 w-3.5 text-amber-500" />
          View All
        </button>
      </div>

      {/* Compact Top 3 Podium */}
      {top8.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mt-4 mb-3">
          {[1, 0, 2].map((podiumIdx) => {
            const s = top8[podiumIdx];
            if (!s) return null;
            const isFirst = podiumIdx === 0;
            return (
              <div key={s.name} className={`flex flex-col items-center ${isFirst ? "order-2" : podiumIdx === 1 ? "order-1" : "order-3"}`}>
                <div className={`relative ${isFirst ? "w-12 h-12" : "w-9 h-9"} rounded-full bg-gradient-to-br ${s.avatarClass} flex items-center justify-center text-white font-bold shadow-md ${isFirst ? "text-sm ring-3 ring-amber-300/50" : "text-xs"}`}>
                  {s.initials}
                  <span className={`absolute ${isFirst ? "-bottom-0.5 -right-0.5 text-sm" : "-bottom-0.5 -right-0.5 text-xs"}`}>
                    {getRankIcon(s.rank)}
                  </span>
                </div>
                <p className={`mt-1.5 font-bold text-slate-900 text-center leading-tight ${isFirst ? "text-xs" : "text-[11px]"}`}>
                  {s.name.split(" ")[0]}
                </p>
                <span className={`font-black ${getScoreColor(s.score)} ${isFirst ? "text-sm" : "text-xs"}`}>
                  {s.score}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Compact List — ranks 4-8 */}
      <div className="flex-1 space-y-1 overflow-y-auto max-h-[220px] pr-1" style={{ scrollbarWidth: "thin" }}>
        {top8.slice(3).map((member) => (
          <div
            key={member.name}
            onClick={() => onMemberSelect && onMemberSelect(member.name)}
            className="group flex items-center justify-between rounded-xl px-2.5 py-2 transition-all hover:bg-slate-50 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-black text-slate-500">
                {member.rank}
              </div>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${member.avatarClass} text-[10px] font-bold text-white`}>
                {member.initials}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition">{member.name}</p>
                <p className="text-[10px] text-slate-400">{member.role}</p>
              </div>
            </div>

            <div className="text-right flex items-center gap-2">
              <span className={`text-sm font-black ${getScoreColor(member.score)}`}>{member.score}</span>
              <span className={`text-[10px] font-bold ${member.delta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {member.delta >= 0 ? "+" : ""}{member.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <button
          onClick={() => navigate("/leaderboard")}
          className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <TrophyIcon className="h-3.5 w-3.5" />
          Full Leaderboard
        </button>
      </div>
    </section>
  );
}
