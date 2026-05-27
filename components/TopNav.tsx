"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from "react";

import { AppWeaverApiError, appWeaverApiClient } from "@/lib/appweaverApiClient";
import { useFlowStore } from "@/store/useFlowStore";

const workflowAccent = "#2DB780";
const workflowAccentDark = "#1f8f63";

function getRouteSignature(route: unknown) {
  return JSON.stringify(route);
}

type BackendDirectRoute = ReturnType<typeof useFlowStore.getState>["exportBackendRouteJson"] extends () => infer Route
  ? Route
  : never;

type BackendRoutePublishMode = "create" | "update";

function hasBackendRouteSteps(route: BackendDirectRoute | null) {
  return Boolean(route?.config?.steps && route.config.steps.length > 0);
}

function buildNamedBackendDirectRoute(route: BackendDirectRoute, routeName: string): BackendDirectRoute {
  return {
    ...route,
    name: routeName,
    config: {
      ...route.config,
      routeId: routeName,
    },
  };
}

function isRouteConflict(issue: unknown) {
  if (issue instanceof AppWeaverApiError && issue.status === 409) {
    return true;
  }

  if (!(issue instanceof Error)) {
    return false;
  }

  return /already exists|duplicate|conflict/i.test(issue.message);
}

function isRouteNotFound(issue: unknown) {
  if (issue instanceof AppWeaverApiError && issue.status === 404) {
    return true;
  }

  if (!(issue instanceof Error)) {
    return false;
  }

  return /does not exist|not found|missing/i.test(issue.message);
}

async function saveBackendDirectRoute(
  route: BackendDirectRoute,
  publishedRouteName?: string,
) {
  if (publishedRouteName) {
    const namedRoute = buildNamedBackendDirectRoute(route, publishedRouteName);

    try {
      await appWeaverApiClient.system.directRoutes.update(publishedRouteName, namedRoute);
      return { action: "updated" as const, routeName: publishedRouteName };
    } catch (updateIssue) {
      if (!isRouteNotFound(updateIssue)) {
        throw updateIssue;
      }

      await appWeaverApiClient.system.directRoutes.create(namedRoute);
      return { action: "created" as const, routeName: publishedRouteName, recoveredFromUpdateIssue: updateIssue };
    }
  }

  try {
    await appWeaverApiClient.system.directRoutes.create(route);
    return { action: "created" as const, routeName: route.name };
  } catch (createIssue) {
    if (!isRouteConflict(createIssue)) {
      throw createIssue;
    }

    await appWeaverApiClient.system.directRoutes.update(route.name, route);
    return { action: "updated" as const, routeName: route.name, recoveredFromCreateIssue: createIssue };
  }
}

async function publishBackendDirectRoute(
  route: BackendDirectRoute,
  publishMode: BackendRoutePublishMode,
) {
  if (publishMode === "create") {
    await appWeaverApiClient.system.directRoutes.create(route);
    return { action: "created" as const, routeName: route.name };
  }

  await appWeaverApiClient.system.directRoutes.update(route.name, route);
  return { action: "updated" as const, routeName: route.name };
}

function buildTopNavButtonStyle(isHighlighted: boolean): CSSProperties {
  return {
    background: isHighlighted
      ? workflowAccentDark
      : "linear-gradient(180deg, rgba(233, 248, 242, 0.98), rgba(222, 244, 236, 0.98))",
    color: isHighlighted ? "#ffffff" : workflowAccent,
    borderColor: isHighlighted ? workflowAccentDark : "rgba(45, 183, 128, 0.34)",
    boxShadow: isHighlighted
      ? "0 12px 24px rgba(31, 143, 99, 0.24)"
      : "inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 8px 18px rgba(45, 183, 128, 0.08)",
  };
}

const routePanelStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 10px)",
  right: 0,
  zIndex: 75,
  display: "grid",
  width: "min(320px, calc(100vw - 32px))",
  gap: 12,
  padding: 14,
  border: "1px solid rgba(226, 232, 240, 0.95)",
  borderRadius: 16,
  background: "linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(248, 250, 252, 0.99))",
  boxShadow: "0 18px 44px rgba(15, 23, 42, 0.16)",
};

const routeFieldStyle: CSSProperties = {
  display: "grid",
  gap: 6,
};

const routeLabelStyle: CSSProperties = {
  color: "#334155",
  fontSize: 12,
  lineHeight: "16px",
  fontWeight: 700,
};

const routeInputStyle: CSSProperties = {
  width: "100%",
  minHeight: 42,
  border: "1px solid rgba(203, 213, 225, 0.95)",
  borderRadius: 10,
  background: "#ffffff",
  padding: "9px 12px",
  color: "#0f172a",
  fontSize: 13,
  lineHeight: "18px",
  fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
  outline: "none",
};

const routeErrorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.28)",
  borderRadius: 10,
  background: "rgba(254, 242, 242, 0.98)",
  padding: "9px 10px",
  color: "#b91c1c",
  fontSize: 12,
  lineHeight: "16px",
};

const routeActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const routeActionButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 40,
  minWidth: 0,
  borderRadius: 10,
  padding: "0 12px",
  fontSize: 13,
  lineHeight: "18px",
  fontWeight: 700,
  fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
  cursor: "pointer",
};

export default function TopNav() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    activeWorkflowId,
    exportBackendRouteJson,
    exportWorkflow,
    importWorkflow,
    isSidebarOpen,
    markBackendRoutePublished,
    openConfigSection,
    openSidebar,
    sidebarView,
    toggleSidebar,
    workflows,
  } = useFlowStore();
  const [isConfigMenuOpen, setIsConfigMenuOpen] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [isPublishingRoute, setIsPublishingRoute] = useState(false);
  const [isRoutePublishPanelOpen, setIsRoutePublishPanelOpen] = useState(false);
  const [routePublishName, setRoutePublishName] = useState("");
  const [routePublishError, setRoutePublishError] = useState<string | null>(null);
  const [routeSyncState, setRouteSyncState] = useState<"idle" | "syncing" | "error">("idle");
  const configMenuRef = useRef<HTMLDivElement | null>(null);
  const routePublishPanelRef = useRef<HTMLDivElement | null>(null);
  const activeWorkflow = workflows[activeWorkflowId] ?? null;
  const backendRoutePublication = activeWorkflow?.backendRoutePublication ?? null;
  const backendRoute = useMemo(
    () => (activeWorkflow ? exportBackendRouteJson() : null),
    [activeWorkflow, exportBackendRouteJson],
  );
  const backendRouteSignature = useMemo(
    () => (backendRoute ? getRouteSignature(backendRoute) : ""),
    [backendRoute],
  );
  const routePublishDefaultName = backendRoutePublication?.routeName || backendRoute?.name || "";

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

  useEffect(() => {
    if (!isRoutePublishPanelOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!routePublishPanelRef.current?.contains(event.target as Node)) {
        setIsRoutePublishPanelOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsRoutePublishPanelOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRoutePublishPanelOpen]);

  useEffect(() => {
    if (
      !backendRoute ||
      !backendRoutePublication ||
      !backendRouteSignature ||
      !hasBackendRouteSteps(backendRoute) ||
      backendRoutePublication.lastSyncedSignature === backendRouteSignature
    ) {
      setRouteSyncState("idle");
      return;
    }

    const timeout = window.setTimeout(async () => {
      setRouteSyncState("syncing");

      try {
        const savedRoute = await saveBackendDirectRoute(
          backendRoute,
          backendRoutePublication.routeName,
        );
        markBackendRoutePublished(savedRoute.routeName, backendRouteSignature);
        setRouteSyncState("idle");
      } catch (issue) {
        console.error("Could not update the published backend direct route.", issue);
        setRouteSyncState("error");
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [backendRoute, backendRoutePublication, backendRouteSignature, markBackendRoutePublished]);

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

  const handleSaveBackendRoute = () => {
    const route = exportBackendRouteJson();
    const safeName =
      route.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "route";
    const blob = new Blob([JSON.stringify(route, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeName}.route.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleOpenRoutePublishPanel = () => {
    setRoutePublishName(routePublishDefaultName);
    setRoutePublishError(null);
    setIsRoutePublishPanelOpen((current) => !current);
  };

  const handlePublishBackendRoute = async (publishMode: BackendRoutePublishMode) => {
    const routeName = routePublishName.trim();
    const route = routeName
      ? buildNamedBackendDirectRoute(exportBackendRouteJson(), routeName)
      : exportBackendRouteJson();
    const routeSignature = getRouteSignature(exportBackendRouteJson());

    if (!hasBackendRouteSteps(route)) {
      setRoutePublishError("Add at least one enabled workflow step before saving the backend direct route.");
      return;
    }

    if (!routeName) {
      setRoutePublishError("Route name is required.");
      return;
    }

    setIsPublishingRoute(true);
    setRouteSyncState("syncing");
    setRoutePublishError(null);

    try {
      const savedRoute = await publishBackendDirectRoute(route, publishMode);
      markBackendRoutePublished(savedRoute.routeName, routeSignature);
      setIsRoutePublishPanelOpen(false);
      window.alert(
        savedRoute.action === "created"
          ? `Created direct route "${savedRoute.routeName}" in AppWeaver.`
          : `Updated direct route "${savedRoute.routeName}" in AppWeaver.`,
      );
      setRouteSyncState("idle");
    } catch (issue) {
      setRouteSyncState("error");
      setRoutePublishError(issue instanceof Error ? issue.message : "Could not save the direct route.");
    } finally {
      setIsPublishingRoute(false);
    }
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
              <button
                type="button"
                className="sidebar-group-menu-item"
                onClick={() => {
                  openConfigSection("components");
                  setIsConfigMenuOpen(false);
                }}
              >
                Components
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
            aria-label="Export backend route JSON"
            className="topnav-btn"
            style={buildTopNavButtonStyle(hoveredButton === "backend-route")}
            onClick={handleSaveBackendRoute}
            onMouseEnter={() => setHoveredButton("backend-route")}
            onMouseLeave={() => setHoveredButton((current) => (current === "backend-route" ? null : current))}
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
          <span className="topnav-tooltip">Export backend route JSON</span>
        </div>
        <div className="topnav-action" ref={routePublishPanelRef}>
          <button
            type="button"
            aria-label="Create or update backend direct route"
            className="topnav-btn"
            disabled={isPublishingRoute}
            style={buildTopNavButtonStyle(hoveredButton === "publish-backend-route" || isRoutePublishPanelOpen)}
            onClick={handleOpenRoutePublishPanel}
            onMouseEnter={() => setHoveredButton("publish-backend-route")}
            onMouseLeave={() => setHoveredButton((current) => (current === "publish-backend-route" ? null : current))}
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
              <path d="m7 8 5-5 5 5" />
              <path d="M5 21h14" />
              <path d="M5 17h14" />
            </svg>
          </button>
          <span className={`topnav-tooltip ${isRoutePublishPanelOpen ? "topnav-tooltip-hidden" : ""}`}>
            {isPublishingRoute
              ? backendRoutePublication
                ? "Updating direct route"
                : "Creating direct route"
              : routeSyncState === "syncing"
                ? "Syncing backend route"
                : routeSyncState === "error"
                  ? "Backend route sync failed"
                  : backendRoutePublication
                    ? "Update backend direct route"
                    : "Create backend direct route"}
          </span>
          {isRoutePublishPanelOpen ? (
            <div
              className="topnav-route-panel"
              role="dialog"
              aria-label="Create or update direct route"
              style={routePanelStyle}
            >
              <label className="topnav-route-field" style={routeFieldStyle}>
                <span className="topnav-route-label" style={routeLabelStyle}>
                  Route name
                </span>
                <input
                  value={routePublishName}
                  onChange={(event) => {
                    setRoutePublishName(event.target.value);
                    setRoutePublishError(null);
                  }}
                  className="topnav-route-input"
                  style={routeInputStyle}
                  placeholder="myDirectRoute"
                  disabled={isPublishingRoute}
                />
              </label>
              {routePublishError ? (
                <div className="topnav-route-error" style={routeErrorStyle}>
                  {routePublishError}
                </div>
              ) : null}
              <div className="topnav-route-actions" style={routeActionsStyle}>
                <button
                  type="button"
                  className="topnav-route-action topnav-route-action-secondary"
                  style={{
                    ...routeActionButtonStyle,
                    border: "1px solid rgba(203, 213, 225, 0.95)",
                    background: "#ffffff",
                    color: "#0f172a",
                  }}
                  disabled={isPublishingRoute}
                  onClick={() => void handlePublishBackendRoute("update")}
                >
                  Update
                </button>
                <button
                  type="button"
                  className="topnav-route-action topnav-route-action-primary"
                  style={{
                    ...routeActionButtonStyle,
                    border: "1px solid rgba(45, 183, 128, 0.34)",
                    background: "linear-gradient(180deg, var(--workflow-accent), #1f8f63)",
                    color: "#ffffff",
                    boxShadow: "0 12px 22px rgba(31, 143, 99, 0.22)",
                  }}
                  disabled={isPublishingRoute}
                  onClick={() => void handlePublishBackendRoute("create")}
                >
                  Create
                </button>
              </div>
            </div>
          ) : null}
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
