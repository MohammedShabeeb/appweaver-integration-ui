"use client";

import { useFlowStore } from "@/store/useFlowStore";

export default function TopNav() {
  const { isSidebarOpen, toggleSidebar } = useFlowStore();

  return (
    <nav className="topnav">
      <div className="topnav-brand">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="topnav-logo"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <span className="topnav-title">Next UI</span>
      </div>

      <div className="topnav-actions">
        <button
          type="button"
          className={`topnav-btn ${isSidebarOpen ? "topnav-btn-active" : ""}`}
          onClick={toggleSidebar}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="topnav-btn-icon"
          >
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          Components
        </button>
      </div>
    </nav>
  );
}
