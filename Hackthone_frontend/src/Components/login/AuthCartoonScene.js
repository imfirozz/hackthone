import React from "react";
import { motion } from "framer-motion";

const sceneContent = {
  login: {
    title: "Waiting To Login",
    subtitle: "Your practice desk is ready. Just one click away.",
    bubbleText: "Still waiting...",
    accent: "#93c5fd",
    paper: "#e0f2fe",
  },
  register: {
    title: "Getting Registered",
    subtitle: "Profile setup in progress. Great things ahead.",
    bubbleText: "Almost done!",
    accent: "#fca5a5",
    paper: "#fee2e2",
  },
};

function AuthCartoonScene({ variant = "login" }) {
  const content = sceneContent[variant] || sceneContent.login;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-white/25 bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-sm font-semibold text-white">{content.title}</p>
      <p className="mt-1 text-xs text-indigo-100">{content.subtitle}</p>

      <div className="mt-3 rounded-xl bg-slate-900/20 p-2">
        <svg viewBox="0 0 460 240" role="img" aria-label={content.title} className="h-auto w-full">
          <rect x="0" y="0" width="460" height="240" rx="20" fill="#f8fafc" />
          <rect x="0" y="160" width="460" height="80" fill="#e2e8f0" />

          <ellipse cx="338" cy="188" rx="56" ry="12" fill="#cbd5e1" />
          <rect x="305" y="106" width="100" height="70" rx="6" fill="#334155" />
          <rect x="316" y="116" width="78" height="48" rx="4" fill="#0f172a" />
          <rect x="324" y="122" width="62" height="6" rx="3" fill={content.accent} />
          <rect x="324" y="133" width="42" height="5" rx="2.5" fill="#94a3b8" />
          <rect x="324" y="142" width="34" height="5" rx="2.5" fill="#94a3b8" />

          <rect x="36" y="138" width="220" height="12" rx="6" fill="#94a3b8" />
          <rect x="56" y="148" width="10" height="48" rx="5" fill="#64748b" />
          <rect x="220" y="148" width="10" height="48" rx="5" fill="#64748b" />

          <rect x="248" y="154" width="48" height="12" rx="6" fill="#475569" />
          <rect x="260" y="166" width="8" height="28" rx="4" fill="#475569" />
          <rect x="274" y="166" width="8" height="28" rx="4" fill="#475569" />

          <rect x="78" y="82" width="84" height="52" rx="8" fill="#ffffff" stroke="#cbd5e1" />
          <rect x="86" y="92" width="32" height="34" rx="5" fill={content.paper} />
          <rect x="123" y="95" width="30" height="5" rx="2.5" fill="#94a3b8" />
          <rect x="123" y="104" width="26" height="5" rx="2.5" fill="#94a3b8" />
          <rect x="123" y="113" width="20" height="5" rx="2.5" fill="#94a3b8" />

          <rect x="272" y="40" width="130" height="46" rx="16" fill="#ffffff" stroke="#cbd5e1" />
          <text x="286" y="68" fontSize="16" fill="#334155" fontFamily="Arial, sans-serif">
            {content.bubbleText}
          </text>

          <motion.g
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
          >
            <ellipse cx="184" cy="188" rx="44" ry="10" fill="#cbd5e1" />
            <rect x="150" y="114" width="68" height="46" rx="14" fill="#2563eb" />
            <rect x="146" y="120" width="12" height="28" rx="6" fill="#2563eb" />
            <rect x="210" y="120" width="12" height="28" rx="6" fill="#2563eb" />
            <circle cx="184" cy="98" r="18" fill="#f1c27d" />
            <path d="M166 96c5-16 30-16 35 0v-8c-5-16-30-16-35 0z" fill="#1e293b" />
            <rect x="166" y="160" width="14" height="30" rx="7" fill="#1e3a8a" />
            <rect x="188" y="160" width="14" height="30" rx="7" fill="#1e3a8a" />
            <circle cx="173" cy="191" r="6" fill="#111827" />
            <circle cx="195" cy="191" r="6" fill="#111827" />
          </motion.g>

          <motion.g
            animate={{ rotate: [0, 6, 0] }}
            transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
            style={{ transformOrigin: "194px 130px" }}
          >
            <rect x="188" y="126" width="34" height="8" rx="4" fill="#f1c27d" />
            <circle cx="223" cy="130" r="6" fill="#f1c27d" />
          </motion.g>
        </svg>
      </div>
    </div>
  );
}

export default AuthCartoonScene;
