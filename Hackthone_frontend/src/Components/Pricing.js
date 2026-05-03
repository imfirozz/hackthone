import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";

export default function Pricing() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    setTimeout(() => { document.documentElement.style.scrollBehavior = 'smooth'; }, 0);
  }, []);

  const plans = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for getting started and trying out AIX.",
      features: [
        "1 Free Mock Interview per day",
        "Basic AI Feedback",
        "Standard Question Bank",
        "Email Support",
      ],
      buttonText: "Get Started",
      buttonLink: "/login",
      popular: false,
      color: "from-slate-700 to-slate-800",
      btnColor: "bg-slate-800 hover:bg-slate-700 text-white",
    },
    {
      name: "Pro",
      price: "₹499",
      period: "/month",
      description: "Everything you need to confidently crack any interview.",
      features: [
        "Unlimited Mock Interviews",
        "Advanced AI Feedback & Scoring",
        "Company-specific FAANG Rounds",
        "Voice-to-Voice Interaction",
        "Detailed Performance Analytics",
        "Priority Support",
      ],
      buttonText: "Upgrade to Pro",
      buttonLink: "/login",
      popular: true,
      color: "from-cyan-500 to-blue-600",
      btnColor: "bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-blue-500/30",
    },
    {
      name: "Elite",
      price: "₹1999",
      period: "/month",
      description: "For serious candidates wanting 1-on-1 human coaching.",
      features: [
        "Everything in Pro",
        "1 Human Mock Interview / month",
        "Resume & LinkedIn Review",
        "Salary Negotiation Coaching",
        "Dedicated Career Mentor",
      ],
      buttonText: "Contact Us",
      buttonLink: "/login",
      popular: false,
      color: "from-indigo-600 to-purple-700",
      btnColor: "bg-indigo-600 hover:bg-indigo-500 text-white",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Fixed 3D Glassy Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="liquid-glass-nav flex justify-between items-center rounded-full px-8 py-3 transition-all duration-300">
            <Link to="/" onClick={() => window.scrollTo(0,0)} className="text-3xl font-extrabold tracking-tight text-white hover:opacity-80 transition-opacity">
              AIX
            </Link>

            <nav className="hidden md:flex items-center gap-3">
              {["Home", "Features", "Pricing", "Dashboard", "About"].map((item) => (
                <Link
                  key={item}
                  to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                  onClick={(e) => {
                    if (item === "Features") {
                      e.preventDefault();
                      window.location.hash = "/home";
                      setTimeout(() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }), 150);
                    }
                  }}
                  className="liquid-glass-chip relative rounded-full px-4 py-2 font-medium text-gray-200 transition-all duration-300 hover:text-white hover:shadow-sm hover:scale-105"
                >
                  {item}
                </Link>
              ))}
              <a
                href="#/login"
                className="liquid-glass-button ml-2 rounded-full px-6 py-2.5 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
              >
                Login / SignUp
              </a>
            </nav>

            <button className="liquid-glass-chip md:hidden rounded-lg p-2 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Header */}
      <div className="pt-20 pb-16 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
          Simple, transparent <span className="bg-clip-text text-transparent bg-linear-to-r from-cyan-300 to-blue-400">pricing</span>
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Choose the plan that best fits your interview preparation needs. No hidden fees.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="flex-1 max-w-7xl mx-auto px-6 pb-24 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`liquid-glass-card relative rounded-3xl p-8 flex flex-col h-full transition-transform duration-300 hover:-translate-y-2 ${plan.popular ? 'border-blue-300/40 md:-translate-y-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-linear-to-r from-cyan-500 to-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-300 text-sm h-10">{plan.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                {plan.period && <span className="text-slate-300 font-medium">{plan.period}</span>}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-200 text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.buttonLink}
                className={`w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all duration-300 ${plan.btnColor}`}
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
