"use client";

import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from "react";

import { useFlowStore } from "@/store/useFlowStore";

const workflowAccent = "#2DB780";
const workflowAccentDark = "#249c6c";

function buildTopNavButtonStyle(isHighlighted: boolean): CSSProperties {
  return {
    background: isHighlighted ? workflowAccentDark : workflowAccent,
    color: "#ffffff",
    borderColor: isHighlighted ? workflowAccentDark : "rgba(45, 183, 128, 0.72)",
    boxShadow: isHighlighted ? "0 10px 20px rgba(36, 156, 108, 0.28)" : "0 8px 16px rgba(45, 183, 128, 0.2)",
  };
}

export default function TopNav() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    exportWorkflow,
    exportPomXml,
    importWorkflow,
    isSidebarOpen,
    openConfigSection,
    openSidebar,
    sidebarView,
    toggleSidebar,
  } = useFlowStore();
  const [isConfigMenuOpen, setIsConfigMenuOpen] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const configMenuRef = useRef<HTMLDivElement | null>(null);

  const handleSidebarToggle = (view: "workflows" | "components" | "configs") => {
    if (isSidebarOpen && sidebarView === view) {
      toggleSidebar();
      return;
    }

    openSidebar(view);
  };

  useEffect(() => {
    if (!isConfigMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!configMenuRef.current?.contains(event.target as Node)) {
        setIsConfigMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isConfigMenuOpen]);

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

  const handleSavePom = () => {
    const pomXml = exportPomXml();
    const blob = new Blob([pomXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "pom.xml";
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
        window.alert(
          "The selected JSON file is not a valid workflow export or supported route definition.",
        );
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
        <div className="topnav-action">
          <button
            type="button"
            aria-label="Open workflows"
            className={`topnav-btn ${isSidebarOpen && sidebarView === "workflows" ? "topnav-btn-active" : ""}`}
            style={buildTopNavButtonStyle(hoveredButton === "workflows" || (isSidebarOpen && sidebarView === "workflows"))}
            onClick={() => handleSidebarToggle("workflows")}
            onMouseEnter={() => setHoveredButton("workflows")}
            onMouseLeave={() => setHoveredButton((current) => (current === "workflows" ? null : current))}
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
          <span className="topnav-tooltip">Open workflows</span>
        </div>
        <div className="topnav-action" ref={configMenuRef}>
          <button
            type="button"
            aria-label="Open configs"
            className={`topnav-btn ${isSidebarOpen && sidebarView === "configs" ? "topnav-btn-active" : ""}`}
            style={buildTopNavButtonStyle(hoveredButton === "configs" || (isSidebarOpen && sidebarView === "configs"))}
            onClick={() => setIsConfigMenuOpen((current) => !current)}
            onMouseEnter={() => setHoveredButton("configs")}
            onMouseLeave={() => setHoveredButton((current) => (current === "configs" ? null : current))}
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
              <path d="M7 21h10" />
              <path d="M10 21v-4" />
              <path d="M14 21v-4" />
              <path d="M8 4h8l3 5-7 9-7-9 3-5Z" />
            </svg>
          </button>
          <span className={`topnav-tooltip ${isConfigMenuOpen ? "topnav-tooltip-hidden" : ""}`}>
            Open configs
          </span>
          {isConfigMenuOpen ? (
            <div className="sidebar-group-menu" style={{ top: "calc(100% + 10px)", left: 0, right: "auto" }}>
              <button
                type="button"
                className="sidebar-group-menu-item"
                onClick={() => {
                  openConfigSection("beans");
                  setIsConfigMenuOpen(false);
                }}
              >
                Beans
              </button>
              <button
                type="button"
                className="sidebar-group-menu-item"
                onClick={() => {
                  openConfigSection("datasources");
                  setIsConfigMenuOpen(false);
                }}
              >
                Datasources
              </button>
              <button
                type="button"
                className="sidebar-group-menu-item"
                onClick={() => {
                  openConfigSection("security");
                  setIsConfigMenuOpen(false);
                }}
              >
                Security
              </button>
              <button
                type="button"
                className="sidebar-group-menu-item"
                onClick={() => {
                  openConfigSection("llms");
                  setIsConfigMenuOpen(false);
                }}
              >
                LLM
              </button>
              <button
                type="button"
                className="sidebar-group-menu-item"
                onClick={() => {
                  openConfigSection("endpoints");
                  setIsConfigMenuOpen(false);
                }}
              >
                Endpoints
              </button>
            </div>
          ) : null}
        </div>
        <div className="topnav-action">
          <button
            type="button"
            aria-label="Open components"
            className={`topnav-btn ${isSidebarOpen && sidebarView === "components" ? "topnav-btn-active" : ""}`}
            style={buildTopNavButtonStyle(hoveredButton === "components" || (isSidebarOpen && sidebarView === "components"))}
            onClick={() => handleSidebarToggle("components")}
            onMouseEnter={() => setHoveredButton("components")}
            onMouseLeave={() => setHoveredButton((current) => (current === "components" ? null : current))}
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
          <span className="topnav-tooltip">Open components</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={handleImportChange}
        />
        <div className="topnav-action">
          <button
            type="button"
            aria-label="Import workflow"
            className="topnav-btn"
            style={buildTopNavButtonStyle(hoveredButton === "import")}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={() => setHoveredButton("import")}
            onMouseLeave={() => setHoveredButton((current) => (current === "import" ? null : current))}
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
          <span className="topnav-tooltip">Import workflow</span>
        </div>
        <div className="topnav-action">
          <button
            type="button"
            aria-label="Export pom.xml"
            className="topnav-btn"
            style={buildTopNavButtonStyle(hoveredButton === "pom")}
            onClick={handleSavePom}
            onMouseEnter={() => setHoveredButton("pom")}
            onMouseLeave={() => setHoveredButton((current) => (current === "pom" ? null : current))}
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
              <path d="M7 3h7l5 5v13H7z" />
              <path d="M14 3v5h5" />
              <path d="M10 13h6" />
              <path d="M10 17h6" />
              <path d="M10 9h1" />
            </svg>
          </button>
          <span className="topnav-tooltip">Export pom.xml</span>
        </div>
        <div className="topnav-action">
          <button
            type="button"
            aria-label="Export workflow"
            className="topnav-btn"
            style={buildTopNavButtonStyle(hoveredButton === "export")}
            onClick={handleSaveWorkflow}
            onMouseEnter={() => setHoveredButton("export")}
            onMouseLeave={() => setHoveredButton((current) => (current === "export" ? null : current))}
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
          <span className="topnav-tooltip">Export workflow</span>
        </div>
      </div>
    </nav>
  );
}
