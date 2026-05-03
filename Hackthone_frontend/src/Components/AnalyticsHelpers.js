import { useState } from "react";
import { TrendUpIcon, TrendDownIcon } from "./dashboard/Icons";

// ─── Tooltip hover grid ────────────────────────────────────────────────────
export function HoverCard({ children, details }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && details && (
        <div
          className="absolute z-50 bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-72 rounded-2xl bg-slate-900 shadow-2xl p-4 pointer-events-none"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-2 overflow-hidden">
            <div className="w-3 h-3 bg-slate-900 rotate-45 translate-y-[-6px] mx-auto"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            {details.title}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {details.items.map((item) => (
              <div key={item.label}
                className="rounded-xl p-2.5"
                style={{ background: "rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] text-slate-400 mb-0.5">{item.label}</p>
                <p className="text-sm font-bold text-white leading-none">{item.value}</p>
                {item.note && (
                  <p className="text-[10px] mt-0.5" style={{ color: item.noteColor || "#94a3b8" }}>
                    {item.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mini horizontal bar ───────────────────────────────────────────────────
export function MiniBar({ value, max = 100, color, bg = "#f1f5f9", h = 8 }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: h, background: bg }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ─── Sparkline SVG ─────────────────────────────────────────────────────────
export function SparkLine({ points, w = 120, h = 36, color = "#6366f1" }) {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const pts = points.map((v, i) => `${i * step},${h - 2 - ((v - min) / range) * (h - 8)}`).join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  const gid = `sg${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Radial gauge ─────────────────────────────────────────────────────────
export function RadialGauge({ value, size = 72, stroke = 7, color = "#6366f1" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.9s ease" }} />
    </svg>
  );
}

// ─── KPI stat card with hover ─────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, sub, trend, sparkPoints, color, colorBg, hoverDetails }) {
  const isPos = trend >= 0;
  const card = (
    <div className="liquid-glass-card rounded-3xl p-5 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl flex-shrink-0" style={{ background: colorBg }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-1 ${isPos ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {isPos ? <TrendUpIcon className="h-3 w-3" /> : <TrendDownIcon className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-[26px] font-bold tracking-tight text-white leading-none">{value}</p>
        <p className="mt-1 text-sm font-semibold text-slate-300">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
      </div>
      {sparkPoints && sparkPoints.length >= 2 && (
        <SparkLine points={sparkPoints} color={color} />
      )}
    </div>
  );
  if (!hoverDetails) return card;
  return <HoverCard details={hoverDetails}>{card}</HoverCard>;
}

// ─── Section card ─────────────────────────────────────────────────────────
export function Section({ title, sub, badge, children }) {
  return (
    <div className="liquid-glass-card rounded-3xl p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[15px] font-bold text-white">{title}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {badge && (
          <span className="text-xs font-bold bg-indigo-50 text-indigo-600 rounded-full px-3 py-1">{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Vertical bar chart ────────────────────────────────────────────────────
export function VertBar({ value, max, color, label, pct }) {
  const h = max ? (value / max) * 72 : 0;
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span className="text-[11px] font-bold text-slate-600">{pct !== undefined ? `${pct}%` : value}</span>
      <div className="w-full flex flex-col justify-end rounded-lg overflow-hidden" style={{ height: 72, background: "#f1f5f9" }}>
        <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: h, background: color }} />
      </div>
      <span className="text-[10px] text-slate-400 text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Trend line SVG chart ─────────────────────────────────────────────────
export function TrendChart({ weeks, color = "#6366f1" }) {
  if (!weeks || weeks.length < 2) return (
    <div className="h-32 flex items-center justify-center text-xs text-slate-400">Not enough data</div>
  );
  const W = 340, H = 100, PAD = 20;
  const scores = weeks.map(w => w.avg);
  const min = Math.min(...scores) - 5;
  const max = Math.max(...scores) + 5;
  const range = max - min || 1;
  const step = (W - PAD * 2) / (weeks.length - 1);
  const pts = weeks.map((w, i) => ({
    x: PAD + i * step,
    y: H - PAD - ((w.avg - min) / range) * (H - PAD * 2),
    ...w,
  }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = `${PAD},${H - PAD} ${polyline} ${PAD + (weeks.length - 1) * step},${H - PAD}`;
  const gid = "trendGrad";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(tick => {
        const y = H - PAD - ((tick - min) / range) * (H - PAD * 2);
        if (y < PAD || y > H - PAD) return null;
        return <line key={tick} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#f1f5f9" strokeWidth="1" />;
      })}
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={color} />
          <circle cx={p.x} cy={p.y} r="2" fill="white" />
        </g>
      ))}
      {pts.map((p, i) => (
        <text key={`lbl-${i}`} x={p.x} y={H - 4} textAnchor="middle"
          fontSize="8" fill="#94a3b8">{p.label}</text>
      ))}
    </svg>
  );
}
