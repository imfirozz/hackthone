import React from "react";
import { motion } from "framer-motion";

const variantContent = {
  workspace: {
    badge: "Live Practice Feed",
    leftLabel: "Sessions Today",
    leftValue: "124",
    rightLabel: "Avg Score",
    rightValue: "87%",
  },
  register: {
    badge: "Onboarding Activity",
    leftLabel: "New Profiles",
    leftValue: "42",
    rightLabel: "Completion",
    rightValue: "91%",
  },
  security: {
    badge: "Security Monitor",
    leftLabel: "Verified Logins",
    leftValue: "2.1k",
    rightLabel: "Safe Sessions",
    rightValue: "99.8%",
  },
};

function AnimatedBars() {
  return (
    <div className="mt-4 flex h-16 items-end gap-2">
      {[0, 1, 2, 3, 4, 5].map((item, index) => (
        <motion.span
          key={item}
          className="origin-bottom rounded-full bg-white/85"
          style={{ width: "10px", height: "100%" }}
          animate={{ scaleY: [0.35, 1, 0.45, 0.8] }}
          transition={{
            duration: 1.4,
            delay: index * 0.1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value, delay }) {
  return (
    <motion.div
      className="rounded-xl border border-white/25 bg-white/10 px-3 py-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-100/90">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </motion.div>
  );
}

function AuthWorkspaceVisual({ variant = "workspace" }) {
  const content = variantContent[variant] || variantContent.workspace;

  return (
    <motion.div
      className="relative mt-8 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute right-3 top-3 h-10 w-10 rounded-full bg-white/20 blur-lg"
        animate={{ y: [-2, 6, -2], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-indigo-100">{content.badge}</p>
        <motion.span
          className="h-2.5 w-2.5 rounded-full bg-emerald-300"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <AnimatedBars />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard label={content.leftLabel} value={content.leftValue} delay={0.1} />
        <StatCard label={content.rightLabel} value={content.rightValue} delay={0.2} />
      </div>
    </motion.div>
  );
}

export default AuthWorkspaceVisual;
