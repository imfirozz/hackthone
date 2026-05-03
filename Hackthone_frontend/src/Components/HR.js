import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./dashboard/DashboardLayout";
import { navItems, aiShortcuts } from "./dashboard/data";
import { companyLogos } from "./companyLogos";
import { buildInterviewConfig } from "../utils/interviewSessionConfig";

const SKILL_INTERVIEWS = [
  { id:1, title:"Tell Me About Yourself", description:"Craft a compelling 2-minute pitch covering background, skills and goals.", category:"Self Introduction", isPremium:false, duration:"20 mins", difficulty:"Beginner", questions:8, skills:["Storytelling","Self-Awareness","Confidence","Clarity","Personal Branding"], topics:["Career Narrative","Key Achievements","Elevator Pitch","Goal Alignment"], prerequisites:["No prerequisites"], tc:["1 free session/day","AI tone & clarity analysis","Transcript generated","No re-attempt in 24h"], icon: <img src="https://img.icons8.com/fluency/96/user-male-circle--v1.png" alt="Self Introduction" className="w-12 h-12 object-contain drop-shadow-sm" /> },
  { id:2, title:"Strengths & Weaknesses", description:"Frame positives and turn weaknesses into growth stories honestly.", category:"Self Assessment", isPremium:false, duration:"25 mins", difficulty:"Beginner", questions:10, skills:["Self-Reflection","Honesty","Growth Mindset","Framing","Impact Articulation"], topics:["Strength Framing","Weakness Handling","Self-Awareness","Improvement Stories"], prerequisites:["No prerequisites"], tc:["1 free session/day","AI confidence scoring","Feedback report 7 days","Auto-submit at expiry"], icon: <img src="https://img.icons8.com/fluency/96/star--v1.png" alt="Strengths and Weaknesses" className="w-12 h-12 object-contain drop-shadow-sm" /> },
  { id:3, title:"Conflict Resolution", description:"Master STAR-method answers for handling workplace conflicts.", category:"Behavioral", isPremium:false, duration:"30 mins", difficulty:"Intermediate", questions:10, skills:["Empathy","Active Listening","Negotiation","Calmness","Problem Solving"], topics:["STAR Method","Active Listening","Mediation","Team Dynamics"], prerequisites:["Basic STAR knowledge"], tc:["1 free session/day","AI feedback included","Transcript saved 7 days","No time extension"], icon: <img src="https://img.icons8.com/fluency/96/handshake.png" alt="Conflict Resolution" className="w-12 h-12 object-contain drop-shadow-sm" /> },
  { id:4, title:"Leadership & Ownership", description:"Demonstrate ownership, initiative, and results-driven leadership.", category:"Leadership", isPremium:true, duration:"40 mins", difficulty:"Intermediate", questions:12, skills:["Decision Making","Accountability","Vision","Delegation","Influencing"], topics:["Leadership Principles","Driving Results","Cross-team Collaboration","Ownership Stories"], prerequisites:["1+ year experience recommended"], tc:["Premium required","Unlimited sessions","Coach tips included","Session saved 30 days","Refund in 3 days"], icon: <img src="https://img.icons8.com/fluency/96/trophy.png" alt="Leadership" className="w-12 h-12 object-contain drop-shadow-sm" /> },
  { id:5, title:"Why This Company?", description:"Research-backed answers showing genuine enthusiasm and cultural alignment.", category:"Company Fit", isPremium:false, duration:"20 mins", difficulty:"Beginner", questions:8, skills:["Research Skills","Cultural Alignment","Enthusiasm","Role Relevance","Career Vision"], topics:["Company Research","Cultural Fit","Mission & Values","Role Relevance"], prerequisites:["Basic company research"], tc:["1 free session/day","AI feedback included","Results saved 7 days","Auto-submit at expiry"], icon: <img src="https://img.icons8.com/fluency/96/company.png" alt="Company Fit" className="w-12 h-12 object-contain drop-shadow-sm" /> },
  { id:6, title:"Salary Negotiation", description:"Confidently negotiate offers with data-driven anchoring and scripts.", category:"Negotiation", isPremium:true, duration:"35 mins", difficulty:"Intermediate–Advanced", questions:10, skills:["Anchoring","Market Research","Persuasion","Professionalism","Counter-offer"], topics:["Anchoring Technique","Counter Offer","Benefits Negotiation","Salary Benchmarks"], prerequisites:["1 job offer experience helpful"], tc:["Premium required","Unlimited sessions","Salary benchmarks included","Session saved 30 days","Refund in 3 days"], icon: <img src="https://img.icons8.com/fluency/96/money-bag.png" alt="Negotiation" className="w-12 h-12 object-contain drop-shadow-sm" /> },
  { id:7, title:"Career Goals & Ambitions", description:"Articulate 1-year, 5-year goals that align with company direction.", category:"Career Planning", isPremium:false, duration:"25 mins", difficulty:"Beginner–Intermediate", questions:10, skills:["Goal Setting","Strategic Thinking","Role Alignment","Vision","Self-Motivation"], topics:["Short-term Goals","Long-term Vision","Role Roadmap","Skill Development"], prerequisites:["No prerequisites"], tc:["1 free session/day","AI feedback included","Score report 7 days","No re-attempt in 24h"], icon: <img src="https://img.icons8.com/fluency/96/bullseye.png" alt="Goals" className="w-12 h-12 object-contain drop-shadow-sm" /> },
  { id:8, title:"Pressure & Stress Handling", description:"Demonstrate resilience and composure under tight deadlines.", category:"Behavioral", isPremium:true, duration:"30 mins", difficulty:"Intermediate", questions:10, skills:["Resilience","Time Management","Prioritization","Coping Strategies","Stakeholder Comms"], topics:["Prioritization Under Pressure","Resilience Stories","Coping Mechanisms","Stakeholder Comms"], prerequisites:["Basic STAR knowledge"], tc:["Premium required","Unlimited sessions","Tone analysis included","Session saved 30 days","Refund in 3 days"], icon: <img src="https://img.icons8.com/fluency/96/high-voltage.png" alt="Pressure Handling" className="w-12 h-12 object-contain drop-shadow-sm" /> },
  { id:9, title:"Teamwork & Collaboration", description:"Prove your ability to work cross-functionally and contribute to team success.", category:"Behavioral", isPremium:false, duration:"30 mins", difficulty:"Beginner–Intermediate", questions:10, skills:["Collaboration","Shared Ownership","Feedback Giving","Adaptability","Remote Teamwork"], topics:["Cross-team Collaboration","Shared Ownership","Feedback Culture","Remote Work"], prerequisites:["No prerequisites"], tc:["1 free session/day","AI feedback included","Transcript saved 7 days","Auto-submit at expiry"], icon: <img src="https://img.icons8.com/fluency/96/group.png" alt="Teamwork" className="w-12 h-12 object-contain drop-shadow-sm" /> },
];

const COMPANY_INTERVIEWS = [
  { id:101, title:"Amazon", logo:companyLogos.amazon, description:"Deep dive into all 14 Amazon Leadership Principles with STAR-method HR scenarios.", duration:"60 mins", difficulty:"Intermediate–Advanced", questions:12, skills:["14 Leadership Principles","STAR Storytelling","Ownership","Customer Obsession","Delivering Results"], topics:["Customer Obsession","Ownership","Invent & Simplify","Bar Raiser Behavioural","Earn Trust"], prerequisites:["Amazon LP knowledge","STAR method basics"], tc:["Premium required","Unlimited sessions","Amazon LP question bank","Session saved 30 days","Refund in 3 days"], emoji:"📦", color:"from-orange-500 to-amber-400" },
  { id:102, title:"Google", logo:companyLogos.google, description:"Googleyness, culture fit and leadership HR rounds aligned to Google's People Ops standards.", duration:"50 mins", difficulty:"Intermediate", questions:10, skills:["Googleyness","Intellectual Humility","Collaboration","Comfort with Ambiguity","Leadership"], topics:["Googleyness & Leadership","Culture Fit","Behavioural STAR","Intellectual Curiosity","Team Contribution"], prerequisites:["STAR method knowledge","Basic Google culture awareness"], tc:["Premium required","Unlimited sessions","Google-format HR questions","Session saved 30 days","Refund in 3 days"], emoji:"🌐", color:"from-blue-500 to-green-400" },
  { id:103, title:"Meta (Facebook)", logo:companyLogos.meta, description:"Meta's culture-forward HR rounds — move fast, be bold, build social value.", duration:"50 mins", difficulty:"Intermediate", questions:10, skills:["Move Fast","Be Bold","Culture Contribution","Impact Focus","Transparency"], topics:["Meta Core Values","Behavioural STAR","Culture Fit","Impact Stories","Feedback Culture"], prerequisites:["STAR method basics","Meta culture awareness"], tc:["Premium required","Unlimited sessions","Meta HR question bank","Session saved 30 days","Refund in 3 days"], emoji:"👤", color:"from-blue-600 to-indigo-500" },
  { id:104, title:"Microsoft", logo:companyLogos.microsoft, description:"Growth mindset, inclusion & diversity, and Microsoft culture behavioural rounds.", duration:"50 mins", difficulty:"Intermediate", questions:10, skills:["Growth Mindset","Inclusive Leadership","Empathy","Culture Add","Collaboration"], topics:["Growth Mindset Stories","Inclusion & Diversity","Culture Add","STAR Behavioural","Cross-team Collaboration"], prerequisites:["STAR method knowledge","Basic Microsoft culture awareness"], tc:["Premium required","Unlimited sessions","Microsoft HR question bank","Session saved 30 days","Refund in 3 days"], emoji:"🪟", color:"from-cyan-500 to-blue-500" },
  { id:105, title:"Netflix", logo:companyLogos.netflix, description:"Netflix Keeper Test mindset, high performance culture and radical candour scenarios.", duration:"55 mins", difficulty:"Advanced", questions:10, skills:["Keeper Test Mindset","Radical Candour","High Performance","Freedom & Responsibility","Impact Orientation"], topics:["Keeper Test Scenarios","Radical Candour","Netflix Values","High Performance Culture","Freedom & Responsibility"], prerequisites:["5+ years experience preferred","Leadership exposure"], tc:["Premium required","Unlimited sessions","Netflix culture HR questions","Session saved 30 days","Refund in 3 days"], emoji:"🎬", color:"from-red-600 to-rose-500" },
  { id:106, title:"Apple", logo:companyLogos.apple, description:"Apple values, attention to detail culture and people-first hiring philosophy.", duration:"50 mins", difficulty:"Intermediate", questions:10, skills:["Attention to Detail","Collaboration","Creativity","Commitment to Excellence","Apple Values"], topics:["Apple Core Values","Culture Fit Stories","Collaboration Stories","Excellence Standards","Creativity & Innovation"], prerequisites:["Apple product knowledge helpful","STAR method basics"], tc:["Premium required","Unlimited sessions","Apple culture HR questions","Session saved 30 days","Refund in 3 days"], emoji:"🍎", color:"from-slate-500 to-slate-700" },
];

function CardPopout({ item, isCompany, onSelect }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm rounded-3xl" />
      <div className="relative bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl m-2 p-5 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out max-h-[88%] overflow-y-auto">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-extrabold text-white">{item.title}{isCompany?" HR Interview":""}</h3>
          <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300">{item.difficulty}</span>
        </div>
        <div className="flex gap-2 mb-4">
          {[["Duration",item.duration],["Questions",item.questions],["Plan",isCompany||item.isPremium?"⭐ Pro":"✅ Free"]].map(([l,v])=>(
            <div key={l} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-center">
              <p className="text-[9px] font-semibold text-slate-400 uppercase">{l}</p>
              <p className="text-sm font-black text-white mt-0.5">{v}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Key Skills</p>
        <div className="flex flex-wrap gap-1.5 mb-3">{item.skills.map((s)=><span key={s} className="bg-blue-500/20 text-blue-300 border border-blue-500/20 text-[10px] font-semibold px-2.5 py-1 rounded-full">{s}</span>)}</div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Topics</p>
        <div className="flex flex-wrap gap-1.5 mb-3">{item.topics.map((t)=><span key={t} className="bg-white/8 text-slate-300 border border-white/10 text-[10px] font-semibold px-2.5 py-1 rounded-full">{t}</span>)}</div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">T&amp;C</p>
        <ul className="space-y-1 mb-4">{item.tc.map((tc)=>(<li key={tc} className="flex items-start gap-2 text-[11px] text-slate-300"><svg className="w-3 h-3 mt-0.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>{tc}</li>))}</ul>
        <button onClick={()=>onSelect(item)} className="w-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold py-3 rounded-2xl text-sm transition-all">
          {isCompany||item.isPremium?"🔓 Unlock Now":"▶ Start Interview"}
        </button>
      </div>
    </div>
  );
}

export default function HR() {
  const [filter, setFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  useEffect(()=>{ const t=setTimeout(()=>setVisible(true),50); return()=>clearTimeout(t); },[]);

  const handleSelect = (item, isCompany) => {
    if ((isCompany || item.isPremium)) { setSelected(item); return; }
    navigate("/session", {
      state: {
        interview: buildInterviewConfig({
          mode: "hr",
          item,
          isCompanyRound: isCompany,
        }),
      },
    });
  };

  const categories = ["All",...new Set(SKILL_INTERVIEWS.map((i)=>i.category))];
  const skillCards = SKILL_INTERVIEWS.filter((i)=>{
    const plan = filter==="All"||filter==="🏢 Company" ? filter!=="🏢 Company" : (filter==="Free"?!i.isPremium:i.isPremium);
    const cat = catFilter==="All"||i.category===catFilter;
    return plan && cat;
  });
  const showCompany = filter==="All"||filter==="🏢 Company";

  return (
    <DashboardLayout projectName="AIX" projectSubtitle="Interview AI" navItems={navItems} activeNav="Interviews" setActiveNav={()=>{}} aiShortcuts={aiShortcuts}>
      <div className="transition-all duration-500 ease-out" style={{opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(24px)"}}>
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button onClick={()=>navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white mb-3 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>Back
            </button>
            <h1 className="text-3xl font-bold text-white tracking-tight">HR Interviews</h1>
            <p className="mt-2 text-slate-300">Hover any card for skills, topics & terms. Click to open session.</p>
          </div>
          <div className="liquid-glass-chip inline-flex p-1 rounded-xl flex-wrap gap-1">
            {["All","Free","Premium","🏢 Company"].map((tab)=>(
              <button key={tab} onClick={()=>setFilter(tab)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter===tab?"bg-white/14 text-white shadow-sm":"text-slate-300 hover:text-white"}`}>{tab}</button>
            ))}
          </div>
        </div>

        {filter!=="🏢 Company" && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat)=>(
              <button key={cat} onClick={()=>setCatFilter(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${catFilter===cat?"bg-white/14 text-white border-white/16":"liquid-glass-chip text-slate-300 border-white/10"}`}>{cat}</button>
            ))}
          </div>
        )}

        {skillCards.length>0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-4">
            {skillCards.map((item,idx)=>(
              <div key={item.id} className="liquid-glass-card group relative flex flex-col rounded-4xl overflow-hidden hover:border-blue-300/40 transition-all duration-500 hover:-translate-y-2"
                style={{opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(32px)",transitionDelay:`${idx*60}ms`,transitionDuration:"500ms",transitionTimingFunction:"cubic-bezier(0.16,1,0.3,1)"}}>
                <CardPopout item={item} isCompany={false} onSelect={(i)=>handleSelect(i,false)}/>
                {item.isPremium?(<div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-linear-to-r from-amber-400 to-orange-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-sm">⭐ Premium</div>):(<div className="absolute top-4 right-4 z-10 bg-emerald-100 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-emerald-700">Free</div>)}
                <div className="p-7 flex-1">
                  <div className="text-4xl mb-5">{item.icon}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{item.category}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">{item.description}</p>
                  <div className="flex flex-wrap gap-1.5">{item.skills.slice(0,3).map((s)=><span key={s} className="liquid-glass-chip text-[10px] font-bold text-cyan-100 px-2.5 py-1 rounded-full">{s}</span>)}</div>
                </div>
                <div className="p-5 border-t border-white/10 bg-white/4 flex items-center justify-between">
                  <span className="text-slate-300 text-sm font-medium flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>{item.duration}</span>
                  <button onClick={()=>handleSelect(item,false)} className="liquid-glass-button px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                    {item.isPremium?"Unlock Now":"Start Now"}<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCompany && (
          <div className="mt-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/10"/>
              <div className="liquid-glass-chip flex items-center gap-2 px-4 py-2 rounded-full">
                <span>🏢</span><span className="text-sm font-black text-amber-300 uppercase tracking-wider">Company HR Rounds</span>
                
              </div>
              <div className="flex-1 h-px bg-white/10"/>
            </div>
            <p className="text-sm text-slate-300 text-center mb-8">Company-specific HR interview simulations based on real hiring culture & values.</p>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {COMPANY_INTERVIEWS.map((item,idx)=>(
                <div key={item.id} className="liquid-glass-card group relative flex flex-col rounded-4xl overflow-hidden hover:border-amber-300/40 transition-all duration-500 hover:-translate-y-2"
                  style={{opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(32px)",transitionDelay:`${idx*60}ms`,transitionDuration:"500ms"}}>
                  <CardPopout item={item} isCompany={true} onSelect={(i)=>handleSelect(i,true)}/>
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-linear-to-r from-amber-400 to-orange-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-sm">⭐ Premium</div>
                  <div className="p-7 flex-1">
                    <div className="liquid-glass-chip w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                      {item.logo ? <img src={item.logo} alt={item.title} className="w-10 h-10 object-contain" onError={(e)=>{e.target.replaceWith(Object.assign(document.createElement('span'),{textContent:item.emoji||'🏢',className:'text-3xl'}))}} /> : <span className="text-3xl">{item.emoji}</span>}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title} HR Interview</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-3">{item.description}</p>
                    <div className="flex flex-wrap gap-1.5">{item.skills.slice(0,3).map((s)=><span key={s} className="liquid-glass-chip text-[10px] font-bold text-slate-200 px-2.5 py-1 rounded-full">{s}</span>)}</div>
                  </div>
                  <div className="p-5 border-t border-white/10 bg-white/4 flex items-center justify-between">
                    <span className="text-slate-300 text-sm font-medium flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>{item.duration}</span>
                    <button onClick={()=>handleSelect(item,true)} className="liquid-glass-button px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                      Unlock Now<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
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
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{selected.category||"Company"}</p>
                  <h2 className="text-2xl font-extrabold text-white">{selected.title}{selected.emoji?" HR Interview":""}</h2>
                </div>
                <button onClick={()=>setSelected(null)} className="text-slate-400 hover:text-white p-1 transition">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="flex gap-3 mt-4">
                {[["Duration",selected.duration],["Questions",selected.questions],["Difficulty",selected.difficulty]].map(([l,v])=>(
                  <div key={l} className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">{l}</p>
                    <p className="text-sm font-black text-white mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-7">
              <p className="text-slate-200 text-sm leading-relaxed mb-5">{selected.description}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Key Skills</p>
              <div className="flex flex-wrap gap-1.5 mb-5">{selected.skills.map((s)=><span key={s} className="liquid-glass-chip text-cyan-100 text-xs font-semibold px-3 py-1 rounded-full">{s}</span>)}</div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Topics</p>
              <div className="flex flex-wrap gap-1.5 mb-5">{selected.topics.map((t)=><span key={t} className="liquid-glass-chip text-slate-200 text-xs font-semibold px-3 py-1 rounded-full">{t}</span>)}</div>
              <div className="flex gap-3">
                <button onClick={()=>setSelected(null)} className="liquid-glass-chip flex-1 py-3 rounded-2xl text-slate-100 font-bold text-sm transition-all">Cancel</button>
                <button onClick={()=>{ if (!selected.isPremium&&!selected.emoji) { setSelected(null); navigate("/session", { state: { interview: buildInterviewConfig({ mode: "hr", item: selected, isCompanyRound: false }) } }); } }} className="liquid-glass-button flex-1 py-3 rounded-2xl text-white font-bold text-sm transition-all">
                  {selected.isPremium||selected.emoji?"🔓 Unlock & Start":"▶ Begin Session"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
