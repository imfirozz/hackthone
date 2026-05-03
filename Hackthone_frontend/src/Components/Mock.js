import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./dashboard/DashboardLayout";
import { navItems, aiShortcuts } from "./dashboard/data";
import { companyLogos } from "./companyLogos";
import { buildInterviewConfig } from "../utils/interviewSessionConfig";

const SKILL_INTERVIEWS = [
  { id: 1, title: "Frontend Developer", description: "React, CSS, JS fundamentals and UI performance.", category: "Technical", isPremium: false, duration: "45 mins", difficulty: "Beginner–Intermediate", questions: 12, topics: ["React Hooks", "CSS Flexbox", "JavaScript ES6+", "Browser APIs", "Performance"], prerequisites: ["Basic HTML & CSS", "JavaScript basics"], tc: ["1 free session per day", "AI feedback after completion", "Score saved 7 days", "No time extension"], icon: <img src="https://img.icons8.com/fluency/96/monitor.png" alt="Frontend" className="w-12 h-12 object-contain drop-shadow-sm" /> },
  { id: 2, title: "Backend Developer", description: "Node.js, Databases, API design and backend architecture.", category: "Technical", isPremium: false, duration: "60 mins", difficulty: "Intermediate", questions: 15, topics: ["REST API Design", "Node.js", "SQL & NoSQL", "Auth & JWT", "Caching"], prerequisites: ["Basic programming", "HTTP basics"], tc: ["1 free session per day", "AI feedback included", "Cannot be paused once started", "Score saved 7 days"], icon: <img src="https://img.icons8.com/fluency/96/server.png" alt="Backend" className="w-12 h-12 object-contain drop-shadow-sm" /> },
  { id: 3, title: "System Design", description: "High-level architecture, scalability, and distributed systems.", category: "Architecture", isPremium: true, duration: "90 mins", difficulty: "Advanced", questions: 8, topics: ["Load Balancing", "Microservices", "CAP Theorem", "Message Queues", "DB Sharding"], prerequisites: ["2+ years experience", "Backend fundamentals"], tc: ["Premium required", "Unlimited sessions", "Mentor review add-on", "Session saved 30 days", "Refund in 3 days"], icon: <img src="https://img.icons8.com/fluency/96/network.png" alt="System Design" className="w-12 h-12 object-contain drop-shadow-sm" /> },
  { id: 4, title: "DSA & Algorithms", description: "Leetcode-style questions — trees, graphs, dynamic programming.", category: "Technical", isPremium: true, duration: "60 mins", difficulty: "Intermediate–Advanced", questions: 10, topics: ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming", "Recursion", "Sorting"], prerequisites: ["Basic programming", "Time/Space complexity"], tc: ["Premium required", "Unlimited sessions", "Hints deduct 5 marks", "Leaderboard results", "Refund in 3 days"], icon: <img src="https://img.icons8.com/fluency/96/puzzle.png" alt="DSA" className="w-12 h-12 object-contain drop-shadow-sm" /> },
  { id: 5, title: "Behavioral & HR", description: "Leadership principles, culture fit, and conflict resolution.", category: "Soft Skills", isPremium: false, duration: "30 mins", difficulty: "Beginner", questions: 10, topics: ["STAR Method", "Conflict Resolution", "Leadership", "Culture Fit", "Strengths/Weaknesses"], prerequisites: ["None"], tc: ["1 free session per day", "AI tone analysis", "Transcript available", "No re-attempt in 24h"], icon: <img src="https://img.icons8.com/fluency/96/handshake.png" alt="Behavioral" className="w-12 h-12 object-contain drop-shadow-sm" /> },
  { id: 6, title: "Product Management", description: "Product sense, execution, and strategy interview simulations.", category: "Product", isPremium: true, duration: "60 mins", difficulty: "Intermediate–Advanced", questions: 8, topics: ["Product Sense", "Metrics & Analytics", "Prioritization", "GTM Strategy", "User Research"], prerequisites: ["Business basics", "Product lifecycle"], tc: ["Premium required", "Unlimited sessions", "Case materials included", "PM alumni feedback", "Refund in 3 days"], icon: <img src="https://img.icons8.com/fluency/96/product.png" alt="Product Management" className="w-12 h-12 object-contain drop-shadow-sm" /> },
];

const COMPANY_INTERVIEWS = [
  { id: 7, title: "Google", logo: companyLogos.google, description: "Coding, system design & Googleyness questions modelled on Google's real hiring process.", duration: "90 mins", difficulty: "Advanced", questions: 10, topics: ["Data Structures", "System Design at Scale", "Googleyness & Leadership", "Coding Round", "Behavioural Fit"], prerequisites: ["Strong DSA skills", "System design basics"], tc: ["Premium required", "Unlimited sessions", "Real Google-format questions", "Session saved 30 days", "Refund in 3 days"], emoji: "🌐", color: "from-blue-500 to-green-400" },
  { id: 8, title: "Amazon", logo: companyLogos.amazon, description: "Leadership Principles deep dive + coding rounds exactly like Amazon's Bar Raiser process.", duration: "75 mins", difficulty: "Advanced", questions: 10, topics: ["14 Leadership Principles", "Coding (Medium/Hard)", "System Design", "Bar Raiser", "Ownership"], prerequisites: ["Amazon LP knowledge", "LeetCode medium"], tc: ["Premium required", "Unlimited sessions", "Amazon LP question bank", "Session saved 30 days", "Refund in 3 days"], emoji: "📦", color: "from-orange-500 to-amber-400" },
  { id: 9, title: "Meta (Facebook)", logo: companyLogos.meta, description: "Product sense, coding & behavioural rounds tailored to Meta's unique interview style.", duration: "80 mins", difficulty: "Advanced", questions: 10, topics: ["Product Sense", "Coding Rounds", "Behavioural STAR", "System Design", "Analytical Thinking"], prerequisites: ["LeetCode medium", "Product intuition"], tc: ["Premium required", "Unlimited sessions", "Meta-format questions", "Session saved 30 days", "Refund in 3 days"], emoji: "👤", color: "from-blue-600 to-indigo-500" },
  { id: 10, title: "Apple", logo: companyLogos.apple, description: "Design thinking, technical depth and Apple-culture fit across multiple rounds.", duration: "75 mins", difficulty: "Advanced", questions: 10, topics: ["Design Thinking", "Technical Depth", "Apple Culture Fit", "Coding", "Cross-functional"], prerequisites: ["Strong engineering background", "Apple product knowledge"], tc: ["Premium required", "Unlimited sessions", "Apple-format questions", "Session saved 30 days", "Refund in 3 days"], emoji: "🍎", color: "from-slate-500 to-slate-700" },
  { id: 11, title: "Netflix", logo: companyLogos.netflix, description: "Dream team culture, high performance bar, senior engineering & PM interviews.", duration: "70 mins", difficulty: "Advanced", questions: 8, topics: ["Dream Team Culture", "Senior Engineering", "Keeper Test", "System Design", "Impact at Scale"], prerequisites: ["5+ years preferred", "Senior-level mindset"], tc: ["Premium required", "Unlimited sessions", "Netflix culture questions", "Session saved 30 days", "Refund in 3 days"], emoji: "🎬", color: "from-red-600 to-rose-500" },
  { id: 12, title: "Microsoft", logo: companyLogos.microsoft, description: "Growth mindset, coding depth and Azure/cloud questions for Microsoft's hiring loop.", duration: "75 mins", difficulty: "Advanced", questions: 10, topics: ["Growth Mindset", "Coding (Medium/Hard)", "Azure & Cloud", "System Design", "Culture Add"], prerequisites: ["LeetCode medium", "Basic cloud exposure"], tc: ["Premium required", "Unlimited sessions", "Microsoft-format questions", "Session saved 30 days", "Refund in 3 days"], emoji: "🪟", color: "from-cyan-500 to-blue-500" },
  { id: 13, title: "Uber", logo: companyLogos.uber, description: "Marketplace thinking, data-driven decisions and Uber's engineering culture.", duration: "65 mins", difficulty: "Intermediate–Advanced", questions: 9, topics: ["Marketplace Thinking", "Data-Driven Decisions", "Coding", "System Design", "Uber Values"], prerequisites: ["Backend or PM experience", "Data analysis basics"], tc: ["Premium required", "Unlimited sessions", "Uber-format questions", "Session saved 30 days", "Refund in 3 days"], emoji: "🚗", color: "from-slate-800 to-slate-900" },
  { id: 14, title: "Flipkart / Meesho", logo: companyLogos.flipkart, secondaryLogo: companyLogos.meesho, description: "Indian e-commerce — coding + PM + business case rounds with India-scale context.", duration: "60 mins", difficulty: "Intermediate", questions: 10, topics: ["India-scale Product", "Coding", "Business Case", "Data Analysis", "Culture Fit"], prerequisites: ["Basic DSA", "E-commerce basics"], tc: ["Premium required", "Unlimited sessions", "India-company questions", "Session saved 30 days", "Refund in 3 days"], emoji: "🛒", color: "from-yellow-500 to-orange-400" },
];

function CompanyLogo({ item }) {
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [secondaryFailed, setSecondaryFailed] = useState(false);

  const showPrimary = Boolean(item.logo && !primaryFailed);
  const showSecondary = Boolean(item.secondaryLogo && !secondaryFailed);

  if (!showPrimary && !showSecondary) {
    return <span className="text-3xl">{item.emoji || "🏢"}</span>;
  }

  const compact = showPrimary && showSecondary;

  return (
    <div className={`flex items-center ${compact ? "gap-1.5" : ""}`}>
      {showPrimary && (
        <img
          src={item.logo}
          alt={`${item.title} logo`}
          className={`${compact ? "w-7 h-7" : "w-10 h-10"} object-contain`}
          onError={() => setPrimaryFailed(true)}
        />
      )}
      {showSecondary && (
        <img
          src={item.secondaryLogo}
          alt={`${item.title} secondary logo`}
          className={`${compact ? "w-7 h-7" : "w-10 h-10"} object-contain`}
          onError={() => setSecondaryFailed(true)}
        />
      )}
    </div>
  );
}

export default function Mock() {
  const [filter, setFilter] = useState("All");
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, []);

  const skillCards = SKILL_INTERVIEWS.filter((i) => {
    if (filter === "All" || filter === "🏢 Company") return filter !== "🏢 Company";
    if (filter === "Free") return !i.isPremium;
    if (filter === "Premium") return i.isPremium;
    return true;
  });
  const showCompany = filter === "All" || filter === "🏢 Company";

  const startInterview = (item, isCompany = false) => {
    navigate("/session", {
      state: {
        interview: buildInterviewConfig({
          mode: "mock",
          item,
          isCompanyRound: isCompany,
        }),
      },
    });
  };

  const cardClass = "group relative flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1";

  function CardPopout({ item, isCompany }) {
    const tcList = item.tc || [];
    const topicList = item.topics || [];
    const preList = item.prerequisites || [];
    return (
      <div className="absolute inset-0 z-20 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm rounded-3xl" />
        <div className="relative bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl m-2 p-5 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out max-h-[88%] overflow-y-auto">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-extrabold text-white">{item.title}{isCompany ? " Interview" : ""}</h3>
            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300">{item.difficulty}</span>
          </div>
          <div className="flex gap-2 mb-4">
            {[["Duration", item.duration], ["Questions", item.questions], ["Plan", isCompany || item.isPremium ? "⭐ Pro" : "✅ Free"]].map(([l, v]) => (
              <div key={l} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-center">
                <p className="text-[9px] font-semibold text-slate-400 uppercase">{l}</p>
                <p className="text-sm font-black text-white mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Topics</p>
          <div className="flex flex-wrap gap-1.5 mb-3">{topicList.map((t) => <span key={t} className="bg-white/8 text-slate-300 border border-white/10 text-[10px] font-semibold px-2.5 py-1 rounded-full">{t}</span>)}</div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Prerequisites</p>
          <ul className="space-y-0.5 mb-3">{preList.map((p) => <li key={p} className="text-[11px] text-slate-300 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />{p}</li>)}</ul>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">T&amp;C</p>
          <ul className="space-y-1 mb-4">{tcList.map((tc) => (<li key={tc} className="flex items-start gap-2 text-[11px] text-slate-300"><svg className="w-3 h-3 mt-0.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>{tc}</li>))}</ul>
          <button onClick={() => { if (isCompany || item.isPremium) { setSelected(item); } else { startInterview(item, false); } }} className="w-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold py-3 rounded-2xl text-sm transition-all">
            {isCompany || item.isPremium ? "🔓 Unlock Now" : "▶ Start Mock"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout projectName="AIX" projectSubtitle="Interview AI" navItems={navItems} activeNav="Interviews" setActiveNav={() => {}} aiShortcuts={aiShortcuts}>
      <div className="transition-all duration-500 ease-out" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}>
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Mock Interviews</h1>
            <p className="mt-2 text-slate-300">Hover a card to see full details. Click to open the interview session.</p>
          </div>
          <div className="liquid-glass-chip inline-flex p-1 rounded-xl flex-wrap gap-1">
            {["All", "Free", "Premium", "🏢 Company"].map((tab) => (
              <button key={tab} onClick={() => setFilter(tab)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === tab ? "bg-white/14 text-white shadow-sm" : "text-slate-300 hover:text-white"}`}>{tab}</button>
            ))}
          </div>
        </div>

        {skillCards.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-4">
            {skillCards.map((item, idx) => (
              <div key={item.id} className="liquid-glass-card group relative flex flex-col rounded-4xl overflow-hidden hover:border-blue-300/40 transition-all duration-500 hover:-translate-y-2" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transitionDelay: `${idx * 60}ms`, transitionDuration: "500ms", transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}>
                <CardPopout item={item} isCompany={false} />
                {item.isPremium ? (
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-linear-to-r from-amber-400 to-orange-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-sm">⭐ Premium</div>
                ) : (
                  <div className="absolute top-4 right-4 z-10 bg-emerald-100 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-emerald-700">Free</div>
                )}
                <div className="p-7 flex-1">
                  <div className="text-4xl mb-5">{item.icon}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{item.category}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">{item.description}</p>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${item.difficulty.includes("Beginner") ? "bg-emerald-50 text-emerald-700" : item.difficulty.includes("Advanced") ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{item.difficulty}</span>
                </div>
                <div className="p-5 border-t border-white/10 bg-white/4 flex items-center justify-between">
                  <span className="text-slate-300 text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {item.duration}
                  </span>
                  <button onClick={() => setSelected(item)} className="liquid-glass-button px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                    {item.isPremium ? "Unlock Now" : "Start Mock"}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCompany && (
          <div className="mt-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/10" />
              <div className="liquid-glass-chip flex items-center gap-2 px-4 py-2 rounded-full">
                <span>🏢</span>
                <span className="text-sm font-black text-amber-300 uppercase tracking-wider">Company-Specific</span>

              </div>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {COMPANY_INTERVIEWS.map((item, idx) => (
                <div key={item.id} className="liquid-glass-card group relative flex flex-col rounded-4xl overflow-hidden hover:border-amber-300/40 transition-all duration-500 hover:-translate-y-2"
                  style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transitionDelay: `${idx * 60}ms`, transitionDuration: "500ms" }}>
                  <CardPopout item={item} isCompany={true} />
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-linear-to-r from-amber-400 to-orange-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-sm">⭐ Premium</div>
                  <div className="p-7 flex-1">
                    <div className="liquid-glass-chip w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                      <CompanyLogo item={item} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title} Interview</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-3">{item.description}</p>
                    <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full">{item.difficulty}</span>
                  </div>
                  <div className="p-5 border-t border-white/10 bg-white/4 flex items-center justify-between">
                    <span className="text-slate-300 text-sm font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {item.duration}
                    </span>
                    <button onClick={() => setSelected(item)} className="liquid-glass-button px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                      Unlock Now <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="liquid-glass-modal rounded-3xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 px-7 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{selected.category || "Company"}</p>
                  <h2 className="text-2xl font-extrabold text-white">{selected.title}{selected.emoji ? " Interview" : ""}</h2>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white p-1 transition">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex gap-3 mt-4">
                {[["Duration", selected.duration], ["Questions", selected.questions], ["Difficulty", selected.difficulty]].map(([l, v]) => (
                  <div key={l} className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">{l}</p>
                    <p className="text-sm font-black text-white mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-7">
              <p className="text-slate-200 text-sm leading-relaxed mb-5">{selected.description}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Topics</p>
              <div className="flex flex-wrap gap-1.5 mb-5">{selected.topics.map((t) => <span key={t} className="liquid-glass-chip text-slate-200 text-xs font-semibold px-3 py-1 rounded-full">{t}</span>)}</div>
              <div className="flex gap-3">
                <button onClick={() => setSelected(null)} className="liquid-glass-chip flex-1 py-3 rounded-2xl text-slate-100 font-bold text-sm transition-all">Cancel</button>
                <button onClick={() => { if (!selected.isPremium && !selected.emoji) { setSelected(null); startInterview(selected, false); } }} className="liquid-glass-button flex-1 py-3 rounded-2xl text-white font-bold text-sm transition-all">
                  {selected.isPremium || selected.emoji ? "🔓 Unlock & Start" : "▶ Begin Session"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
