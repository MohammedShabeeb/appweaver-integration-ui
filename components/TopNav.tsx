"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { useFlowStore } from "@/store/useFlowStore";

export default function TopNav() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const workflowMenuRef = useRef<HTMLDivElement | null>(null);
  const [isWorkflowMenuOpen, setIsWorkflowMenuOpen] = useState(false);
  const {
    activeWorkflowId,
    canvases,
    exportWorkflow,
    importWorkflow,
    isSidebarOpen,
    selectWorkflow,
    toggleSidebar,
    workflowOrder,
    workflows,
  } = useFlowStore();

  const activeWorkflow = workflows[activeWorkflowId];
  const activeWorkflowName =
    activeWorkflow?.name || canvases[activeWorkflow?.rootCanvasId ?? ""]?.name || "Workflow";

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!workflowMenuRef.current?.contains(event.target as Node)) {
        setIsWorkflowMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
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
      }
    } catch {
      window.alert("The selected file could not be imported.");
    } finally {
      event.target.value = "";
      setIsWorkflowMenuOpen(false);
    }
  };

  const handleWorkflowSelect = (workflowId: string) => {
    selectWorkflow(workflowId);
    setIsWorkflowMenuOpen(false);
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
        <div className="topnav-workflow-menu" ref={workflowMenuRef}>
          <span className="topnav-select-label">Workflow</span>
          <button
            type="button"
            className={`topnav-select-trigger ${isWorkflowMenuOpen ? "topnav-select-trigger-open" : ""}`}
            onClick={() => setIsWorkflowMenuOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={isWorkflowMenuOpen}
          >
            <span className="topnav-select-value">{activeWorkflowName}</span>
            <span className="topnav-select-count">{workflowOrder.length}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="topnav-select-icon"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {isWorkflowMenuOpen ? (
            <div className="topnav-select-menu" role="listbox">
              {workflowOrder.map((workflowId) => {
                const workflow = workflows[workflowId];

                if (!workflow) {
                  return null;
                }

                const isActive = workflow.id === activeWorkflowId;

                return (
                  <button
                    key={workflow.id}
                    type="button"
                    className={`topnav-select-option ${isActive ? "topnav-select-option-active" : ""}`}
                    onClick={() => handleWorkflowSelect(workflow.id)}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span className="topnav-select-option-title">
                      {workflow.name || canvases[workflow.rootCanvasId]?.name || "Workflow"}
                    </span>
                    <span className="topnav-select-option-meta">
                      {Object.keys(workflow.canvases).length} canvas
                      {Object.keys(workflow.canvases).length === 1 ? "" : "es"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

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
          onClick={handleImportClick}
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
          Import JSON
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
          Save JSON
        </button>
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
