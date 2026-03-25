"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ComponentType as ReactComponentType } from "react";
import { useFlowStore } from "@/store/useFlowStore";
import { componentDefinitions } from "@/config/componentCatalog";
import { nodeTypeMeta } from "./node-icons";

type PendingDeleteWorkflow = {
  id: string;
  name: string;
};

type StepListItem = {
  type: "marshal" | "unmarshal" | "process";
  label: string;
  color: string;
  bgClass?: string;
  Icon: ReactComponentType<{ className?: string; style?: CSSProperties }>;
  description: string;
};

const stepDescriptions: Record<StepListItem["type"], string> = {
  marshal: "Serialize data and choose the `clazz` value from a dropdown.",
  unmarshal: "Deserialize data and choose the `clazz` value from a dropdown.",
  process: "Run a processor bean by entering its `ref` name.",
};

export default function ComponentsSidebar() {
  const {
    deleteWorkflow,
    activeWorkflowId,
    isSidebarOpen,
    openSidebar,
    selectWorkflow,
    sidebarView,
    toggleSidebar,
    workflowOrder,
    workflows,
  } = useFlowStore();
  const [pendingDeleteWorkflow, setPendingDeleteWorkflow] = useState<PendingDeleteWorkflow | null>(
    null,
  );
  const [highlightedTarget, setHighlightedTarget] = useState<string | null>(null);

  const isWorkflowView = sidebarView === "workflows";
  const stepItems = useMemo(
    () =>
      componentDefinitions
        .filter((item) => item.type !== "start")
        .map((item) => ({
          type: item.type as StepListItem["type"],
          label: nodeTypeMeta[item.type].label,
          color: item.color,
          bgClass: item.bgClass,
          Icon: nodeTypeMeta[item.type].Icon,
          description: stepDescriptions[item.type as StepListItem["type"]],
        })),
    [],
  );

  useEffect(() => {
    const handleFocusSearchTarget = (event: Event) => {
      const customEvent = event as CustomEvent<{
        kind: "group" | "component";
        componentKey?: string;
      }>;
      const detail = customEvent.detail;

      if (!detail?.componentKey) {
        return;
      }

      const targetId = `sidebar-component-${detail.componentKey}`;

      window.setTimeout(() => {
        const target = document.getElementById(targetId);

        if (!target) {
          return;
        }

        setHighlightedTarget(targetId);
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => setHighlightedTarget(null), 1600);
      }, 120);
    };

    window.addEventListener("focus-sidebar-search-target", handleFocusSearchTarget as EventListener);
    return () =>
      window.removeEventListener(
        "focus-sidebar-search-target",
        handleFocusSearchTarget as EventListener,
      );
  }, []);

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <>
      <aside className="components-sidebar">
        <div className="sidebar-header">
          <div>
            <h2 className="sidebar-title">{isWorkflowView ? "Workflows" : "Components"}</h2>
            <p className="sidebar-hint">
              {isWorkflowView
                ? "Select a workflow to render it on the canvas"
                : "Drag a route step onto the canvas, then select it to edit its settings"}
            </p>
          </div>
          <button type="button" className="sidebar-close" onClick={toggleSidebar}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sidebar-close-icon"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="sidebar-tabs" role="tablist" aria-label="Sidebar views">
          <button
            type="button"
            className={`sidebar-tab ${!isWorkflowView ? "sidebar-tab-active" : ""}`}
            onClick={() => openSidebar("components")}
            role="tab"
            aria-selected={!isWorkflowView}
          >
            Components
          </button>
          <button
            type="button"
            className={`sidebar-tab ${isWorkflowView ? "sidebar-tab-active" : ""}`}
            onClick={() => openSidebar("workflows")}
            role="tab"
            aria-selected={isWorkflowView}
          >
            Workflows
          </button>
        </div>

        {!isWorkflowView ? (
          <div className="sidebar-items">
            <section className="sidebar-group" aria-labelledby="sidebar-group-processor">
              <div className="sidebar-group-toolbar">
                <div className="sidebar-group-trigger">
                  <span id="sidebar-group-processor" className="sidebar-group-title">
                    Route Steps
                  </span>
                </div>
              </div>
              <div className="sidebar-group-panel">
                <div className="sidebar-group-items sidebar-group-items-compact">
                  {stepItems.map((item) => {
                    const Icon = item.Icon;

                    return (
                      <div
                        key={item.type}
                        id={`sidebar-component-${item.type}`}
                        className={`sidebar-item ${item.bgClass ?? ""} ${
                          highlightedTarget === `sidebar-component-${item.type}`
                            ? "sidebar-search-match"
                            : ""
                        }`.trim()}
                        draggable
                        style={{ padding: "14px 14px", borderRadius: 14, gap: 12 }}
                        onDragStart={(event) => {
                          event.dataTransfer.setData(
                            "application/reactflow-component",
                            JSON.stringify({
                              componentKey: item.type,
                            }),
                          );
                          event.dataTransfer.setData("application/reactflow", item.type);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                      >
                        <div
                          className="sidebar-item-icon"
                          style={{
                            color: item.color,
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            ...(item.bgClass ? {} : { background: `${item.color}1f` }),
                          }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="sidebar-item-info" style={{ gap: 4 }}>
                          <span className="sidebar-item-label" style={{ fontSize: 15, fontWeight: 700 }}>
                            {item.label}
                          </span>
                          <span
                            className="sidebar-item-type"
                            style={{ fontSize: 12, lineHeight: 1.45, color: "#64748b" }}
                          >
                            {item.description}
                          </span>
                        </div>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="sidebar-item-grip"
                        >
                          <circle cx="9" cy="6" r="1" fill="currentColor" />
                          <circle cx="15" cy="6" r="1" fill="currentColor" />
                          <circle cx="9" cy="12" r="1" fill="currentColor" />
                          <circle cx="15" cy="12" r="1" fill="currentColor" />
                          <circle cx="9" cy="18" r="1" fill="currentColor" />
                          <circle cx="15" cy="18" r="1" fill="currentColor" />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="sidebar-items">
            {workflowOrder.map((workflowId) => {
              const workflow = workflows[workflowId];

              if (!workflow) {
                return null;
              }

              const isActive = workflow.id === activeWorkflowId;
              const rootCanvas = workflow.canvases[workflow.rootCanvasId];
              const canvasCount = Object.keys(workflow.canvases).length;
              const rootCanvasName = rootCanvas?.name || "Root";
              const workflowMeta =
                rootCanvasName === workflow.name
                  ? `${canvasCount} canvas${canvasCount === 1 ? "" : "es"}`
                  : `${canvasCount} canvas${canvasCount === 1 ? "" : "es"} | ${rootCanvasName}`;

              return (
                <div
                  key={workflow.id}
                  className={`sidebar-item sidebar-workflow-item ${isActive ? "sidebar-workflow-item-active" : ""}`}
                >
                  <button
                    type="button"
                    className="sidebar-workflow-select"
                    onClick={() => selectWorkflow(workflow.id)}
                  >
                    <div className="sidebar-workflow-main">
                      <div className="sidebar-item-icon sidebar-workflow-icon">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                        >
                          <rect x="3" y="4" width="18" height="4" rx="1.5" />
                          <rect x="3" y="10" width="18" height="4" rx="1.5" />
                          <rect x="3" y="16" width="18" height="4" rx="1.5" />
                        </svg>
                      </div>
                      <div className="sidebar-item-info sidebar-workflow-copy">
                        <div className="sidebar-workflow-header">
                          <span className="sidebar-item-label sidebar-workflow-label">
                            {workflow.name}
                          </span>
                          {isActive ? <span className="sidebar-workflow-badge">Active</span> : null}
                        </div>
                        <span className="sidebar-item-type sidebar-workflow-meta">
                          {workflowMeta}
                        </span>
                      </div>
                    </div>
                  </button>
                  <div className="sidebar-workflow-actions">
                    <button
                      type="button"
                      className="sidebar-workflow-delete"
                      aria-label={`Delete ${workflow.name}`}
                      onClick={() =>
                        setPendingDeleteWorkflow({
                          id: workflow.id,
                          name: workflow.name,
                        })
                      }
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M9 3.75h6a1 1 0 0 1 1 1V6H8V4.75a1 1 0 0 1 1-1Z" />
                        <path d="M4.75 6h14.5" />
                        <path d="M6.75 6.75 7.6 19a2 2 0 0 0 2 1.86h4.8a2 2 0 0 0 2-1.86l.85-12.25" />
                        <path d="M10 10.25v6.5" />
                        <path d="M14 10.25v6.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </aside>

      {pendingDeleteWorkflow ? (
        <div
          className="app-modal-backdrop"
          role="presentation"
          onClick={() => setPendingDeleteWorkflow(null)}
        >
          <div
            className="app-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-workflow-title"
            aria-describedby="delete-workflow-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="app-modal-header">
              <div className="app-modal-icon app-modal-icon-danger">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M9 3.75h6a1 1 0 0 1 1 1V6H8V4.75a1 1 0 0 1 1-1Z" />
                  <path d="M4.75 6h14.5" />
                  <path d="M6.75 6.75 7.6 19a2 2 0 0 0 2 1.86h4.8a2 2 0 0 0 2-1.86l.85-12.25" />
                  <path d="M10 10.25v6.5" />
                  <path d="M14 10.25v6.5" />
                </svg>
              </div>
              <div className="app-modal-copy">
                <h3 id="delete-workflow-title" className="app-modal-title">
                  Delete workflow?
                </h3>
                <p id="delete-workflow-description" className="app-modal-text">
                  <span className="app-modal-strong">{pendingDeleteWorkflow.name}</span> will be
                  removed permanently. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="app-modal-warning">
              <span className="app-modal-warning-label">Permanent action</span>
              <span className="app-modal-warning-text">
                <span className="app-modal-strong">{pendingDeleteWorkflow.name}</span> will be
                deleted from the sidebar and canvas state.
              </span>
            </div>
            <div className="app-modal-actions">
              <button
                type="button"
                className="app-modal-btn app-modal-btn-secondary"
                onClick={() => setPendingDeleteWorkflow(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app-modal-btn app-modal-btn-danger"
                onClick={() => {
                  deleteWorkflow(pendingDeleteWorkflow.id);
                  setPendingDeleteWorkflow(null);
                }}
              >
                Delete Workflow
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
