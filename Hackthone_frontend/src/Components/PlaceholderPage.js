import React from "react";
import DashboardLayout from "./dashboard/DashboardLayout";
import { navItems, aiShortcuts } from "./dashboard/data";

export default function PlaceholderPage({ title, description }) {
  // We use the DashboardLayout to keep the sidebar visible,
  // but just render a placeholder message for this page.
  return (
    <DashboardLayout
      projectName="AIX"
      projectSubtitle="Interview AI"
      navItems={navItems}
      activeNav={title}
      aiShortcuts={aiShortcuts}
    >
      <div className="flex h-[70vh] flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold text-slate-900">{title}</h1>
        <p className="mt-4 text-lg text-slate-500">{description}</p>
        <button 
          onClick={() => window.history.back()}
          className="mt-8 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Go Back
        </button>
      </div>
    </DashboardLayout>
  );
}
