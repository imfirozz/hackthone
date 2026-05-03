import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import DashboardLayout from "./dashboard/DashboardLayout";
import { navItems, aiShortcuts } from "./dashboard/data";
import { companyLogos } from "./companyLogos";

const TYPES = [
  {
    title: "Mock Interviews",
    subtitle: "Full-stack simulated interviews",
    description: "Practice end-to-end mock interviews across frontend, backend, system design, DSA, and more. Includes company-specific FAANG rounds.",
    path: "/mock",
    icon: <img src="https://img.icons8.com/fluency/96/goal.png" alt="Mock" className="w-10 h-10 object-contain drop-shadow-sm" />,
    tags: ["Frontend","Backend","System Design","DSA","Product"],
    color: "from-blue-500 to-indigo-600",
    glow: "shadow-blue-500/20",
    border: "hover:border-blue-300",
    count: "14 modules",
  },
  {
    title: "Technical Interviews",
    subtitle: "Language & framework deep dives",
    description: "Language-specific and framework-focused technical rounds — JavaScript, Python, Java, SQL, Cloud, ML and company technical rounds.",
    path: "/technical",
    icon: <img src="https://img.icons8.com/fluency/96/monitor.png" alt="Technical" className="w-10 h-10 object-contain drop-shadow-sm" />,
    tags: ["JavaScript","Python","Java","Cloud","ML","React"],
    color: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
    border: "hover:border-emerald-300",
    count: "15 modules",
  },
  {
    title: "HR Interviews",
    subtitle: "Behavioral & culture-fit rounds",
    description: "Master behavioral questions, salary negotiation, leadership stories, and company culture rounds for Amazon, Google, Meta, Microsoft and more.",
    path: "/hr-interview",
    icon: <img src="https://img.icons8.com/fluency/96/handshake.png" alt="HR" className="w-10 h-10 object-contain drop-shadow-sm" />,
    tags: ["Behavioral","Leadership","Negotiation","Culture Fit","STAR Method"],
    color: "from-rose-500 to-pink-600",
    glow: "shadow-rose-500/20",
    border: "hover:border-rose-300",
    count: "15 modules",
  },
];

const COMPANY_LOGOS = [
  { name: "Google", logo: companyLogos.google },
  { name: "Amazon", logo: companyLogos.amazon },
  { name: "Meta", logo: companyLogos.meta },
  { name: "Microsoft", logo: companyLogos.microsoft },
  { name: "Netflix", logo: companyLogos.netflix },
  { name: "Apple", logo: companyLogos.apple },
  { name: "Uber", logo: companyLogos.uber },
  { name: "Flipkart", logo: companyLogos.flipkart },
  { name: "Meesho", logo: companyLogos.meesho },
];

export default function InterviewsHub() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  useEffect(() => { 
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0,0);
    setTimeout(() => { document.documentElement.style.scrollBehavior = 'smooth'; }, 0);
    const t = setTimeout(() => setVisible(true), 60); 
    return () => clearTimeout(t); 
  }, []);

  return (
    <DashboardLayout projectName="AIX" projectSubtitle="Interview AI" navItems={navItems} activeNav="Interviews" setActiveNav={() => {}} aiShortcuts={aiShortcuts}>
      <div className="transition-all duration-500 ease-out" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}>

        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Interviews</h1>
          <p className="mt-2 text-slate-300 text-lg">Choose an interview track and start practising with AI — from skill-based rounds to company-specific simulations.</p>
        </div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
          {TYPES.map((type, idx) => (
            <button key={type.path} onClick={() => navigate(type.path)} className={`liquid-glass-card group text-left rounded-[32px] overflow-hidden ${type.border} transition-all duration-500 hover:-translate-y-2`}
              style={{ opacity: visible?1:0, transform: visible?"translateY(0)":"translateY(28px)", transitionDelay:`${idx*100}ms`, transitionDuration:"500ms" }}>
              <div className="p-7">
                <div className={`liquid-glass-chip w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${type.glow}`}>
                  {type.icon}
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{type.subtitle}</p>
                <h2 className="text-2xl font-extrabold text-white mb-3">{type.title}</h2>
                <p className="text-sm text-slate-300 leading-relaxed mb-5">{type.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {type.tags.map((tag) => (
                    <span key={tag} className="liquid-glass-chip text-[10px] font-bold text-slate-200 px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{type.count}</span>
                  <span className={`flex items-center gap-2 text-sm font-bold bg-gradient-to-r ${type.color} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                    Explore
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      style={{ stroke: "url(#g)" }}>
                      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#6366f1"/></linearGradient></defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Company logos banner */}
        <div className="liquid-glass-card rounded-3xl px-8 py-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center mb-5">Company-Specific Rounds Available For</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {COMPANY_LOGOS.map((co) => (
              <div key={co.name} className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                <img src={co.logo} alt={co.name} className="w-8 h-8 object-contain rounded-lg" onError={(e) => { e.target.style.display='none'; }} />
                <span className="text-[10px] font-bold text-slate-300">{co.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
