"use client";

import { useRef, type ChangeEvent } from "react";

import { useFlowStore } from "@/store/useFlowStore";

export default function TopNav() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    exportWorkflow,
    importWorkflow,
    isSidebarOpen,
    openSidebar,
    sidebarView,
  } = useFlowStore();

  const handleSaveWorkflow = () => {
    const workflow = exportWorkflow();
    const safeName =
      workflow.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "workflow";
    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeName}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      const imported = importWorkflow(parsed, file.name.replace(/\.json$/i, ""));

      if (!imported) {
        window.alert("The selected JSON file is not a valid workflow export.");
      } else {
        openSidebar("workflows");
      }
    } catch {
      window.alert("The selected file could not be imported.");
    } finally {
      event.target.value = "";
    }
  };

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
          className={`topnav-btn ${isSidebarOpen && sidebarView === "workflows" ? "topnav-btn-active" : ""}`}
          onClick={() => openSidebar("workflows")}
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
            <rect x="3" y="4" width="18" height="4" rx="1.5" />
            <rect x="3" y="10" width="18" height="4" rx="1.5" />
            <rect x="3" y="16" width="18" height="4" rx="1.5" />
          </svg>
        </button>
        <button
          type="button"
          className={`topnav-btn ${isSidebarOpen && sidebarView === "components" ? "topnav-btn-active" : ""}`}
          onClick={() => openSidebar("components")}
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
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={handleImportChange}
        />
        <button
          type="button"
          className="topnav-btn"
          onClick={() => fileInputRef.current?.click()}
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
            <path d="M12 21V9" />
            <path d="m17 14-5-5-5 5" />
            <path d="M5 3h14" />
          </svg>
        </button>
        <button
          type="button"
          className="topnav-btn"
          onClick={handleSaveWorkflow}
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
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
