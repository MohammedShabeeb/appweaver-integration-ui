"use client";

import {
  useEffect,
  useState,
  type ComponentType as ReactComponentType,
  type CSSProperties,
} from "react";
import { useFlowStore, type CustomComponentDefinition } from "@/store/useFlowStore";
import { ActionIcon, nodeTypeMeta } from "./node-icons";
import {
  componentDefinitions,
  componentGroups,
  type ComponentGroupId,
  isBuiltInComponent,
} from "@/config/componentCatalog";

type PendingDeleteWorkflow = {
  id: string;
  name: string;
};

type PendingDeleteComponent = {
  key: string;
  label: string;
};

type ComponentListItem = {
  type: string;
  label: string;
  color: string;
  bgClass?: string;
  Icon: ReactComponentType<{ className?: string; style?: CSSProperties }>;
  description?: string;
};

const createJsonTemplate = (groupId: ComponentGroupId) =>
  JSON.stringify(
    {
      key:
        groupId === "component"
          ? "ui-widget"
          : groupId === "processor"
            ? "approval-step"
            : groupId === "entity"
              ? "customer-record"
              : "http-source",
      label:
        groupId === "component"
          ? "UI Widget"
          : groupId === "processor"
            ? "Approval Step"
            : groupId === "entity"
              ? "Customer Record"
              : "HTTP Source",
      description:
        groupId === "component"
          ? "Reusable component in the flow."
          : groupId === "processor"
            ? "Processes a message before the next step."
            : groupId === "entity"
              ? "Represents a data-focused entity in the flow."
              : "Reusable Kamelet-style integration block.",
      color:
        groupId === "component"
          ? "#14b8a6"
          : groupId === "processor"
            ? "#22c55e"
            : groupId === "entity"
              ? "#8b5cf6"
              : "#f97316",
      singleEndpointOnly: false,
    },
    null,
    2,
  );

export default function ComponentsSidebar() {
  const {
    deleteWorkflow,
    activeWorkflowId,
    isSidebarOpen,
    openSidebar,
    componentGroupAssignments,
    customComponents,
    addCustomComponent,
    removeCustomComponent,
    selectWorkflow,
    sidebarView,
    toggleSidebar,
    workflowOrder,
    workflows,
  } = useFlowStore();
  const [expandedGroups, setExpandedGroups] = useState<Record<ComponentGroupId, boolean>>({
    component: true,
    processor: true,
    entity: true,
    kamelet: true,
  });
  const [jsonEditorGroup, setJsonEditorGroup] = useState<ComponentGroupId | null>(null);
  const [jsonValue, setJsonValue] = useState(createJsonTemplate("component"));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [highlightedTarget, setHighlightedTarget] = useState<string | null>(null);
  const [pendingDeleteWorkflow, setPendingDeleteWorkflow] = useState<PendingDeleteWorkflow | null>(
    null,
  );
  const [pendingDeleteComponent, setPendingDeleteComponent] =
    useState<PendingDeleteComponent | null>(null);

  const isWorkflowView = sidebarView === "workflows";
  const allComponentItems: ComponentListItem[] = [
    ...componentDefinitions.map((item) => ({
      type: item.type,
      label: nodeTypeMeta[item.type].label,
      color: item.color,
      bgClass: item.bgClass,
      Icon: nodeTypeMeta[item.type].Icon,
    })),
    ...customComponents.map((item) => ({
      type: item.key,
      label: item.label,
      color: item.color,
      Icon: ActionIcon,
      description: item.singleEndpointOnly
        ? `${item.description} | single endpoint`
        : item.description,
    })),
  ];

  const getGroupItems = (groupId: ComponentGroupId) =>
    allComponentItems
      .filter((item) => componentGroupAssignments[item.type] === groupId)
      .sort((left, right) => left.label.localeCompare(right.label));

  const toggleGroup = (groupId: ComponentGroupId) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  const openJsonEditor = (groupId: ComponentGroupId) => {
    setJsonEditorGroup(groupId);
    setJsonValue(createJsonTemplate(groupId));
    setJsonError(null);
  };

  useEffect(() => {
    const handleFocusSearchTarget = (
      event: Event,
    ) => {
      const customEvent = event as CustomEvent<{
        kind: "group" | "component";
        groupId?: ComponentGroupId;
        componentKey?: string;
      }>;
      const detail = customEvent.detail;

      if (!detail) {
        return;
      }

      if (detail.groupId) {
        setExpandedGroups((current) => ({
          ...current,
          [detail.groupId!]: true,
        }));
      }

      const targetId =
        detail.kind === "group"
          ? `sidebar-group-section-${detail.groupId}`
          : `sidebar-component-${detail.componentKey}`;

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

  const handleCreateComponent = () => {
    if (!jsonEditorGroup) {
      return;
    }

    try {
      const parsed = JSON.parse(jsonValue) as Partial<CustomComponentDefinition>;
      const result = addCustomComponent(
        {
          key: String(parsed.key ?? "").trim(),
          label: String(parsed.label ?? "").trim() || "Custom Component",
          description: String(parsed.description ?? "").trim(),
          color: String(parsed.color ?? "").trim() || "#94a3b8",
          singleEndpointOnly: Boolean(parsed.singleEndpointOnly),
        },
        jsonEditorGroup,
      );

      if (!result.ok) {
        setJsonError(result.reason);
        return;
      }

      setJsonEditorGroup(null);
      setJsonError(null);
    } catch {
      setJsonError("Enter valid JSON before creating the component.");
    }
  };

  return (
    <>
      <aside className="components-sidebar">
        <div className="sidebar-header">
          <div>
            <h2 className="sidebar-title">{isWorkflowView ? "Workflows" : "Components"}</h2>
            <p className="sidebar-hint">
              {isWorkflowView
                ? "Select a workflow to render it on the canvas"
                : "Drag a component onto the canvas"}
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
            {componentGroups.map((group) => {
              const isExpanded = expandedGroups[group.id];
              const groupItems = getGroupItems(group.id);

              return (
                <section
                  key={group.id}
                  id={`sidebar-group-section-${group.id}`}
                  className={`sidebar-group ${
                    highlightedTarget === `sidebar-group-section-${group.id}`
                      ? "sidebar-search-match"
                      : ""
                  }`.trim()}
                  aria-labelledby={`sidebar-group-${group.id}`}
                >
                  <div className="sidebar-group-toolbar">
                    <button
                      type="button"
                      className="sidebar-group-trigger"
                      onClick={() => toggleGroup(group.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`sidebar-group-panel-${group.id}`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`sidebar-group-chevron ${isExpanded ? "sidebar-group-chevron-open" : ""}`}
                        aria-hidden="true"
                      >
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                      <span id={`sidebar-group-${group.id}`} className="sidebar-group-title">
                        {group.label}
                      </span>
                    </button>

                    <div className="sidebar-group-actions">
                      <button
                        type="button"
                        className="sidebar-group-add"
                        aria-label={`Add component to ${group.label}`}
                        onClick={() => openJsonEditor(group.id)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="sidebar-group-add-icon"
                        >
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div
                      id={`sidebar-group-panel-${group.id}`}
                      className="sidebar-group-panel"
                    >
                      <div className="sidebar-group-header">
                        <p className="sidebar-group-description">{group.description}</p>
                      </div>

                      {groupItems.length > 0 ? (
                        <div className="sidebar-group-items">
                          {groupItems.map((item) => {
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
                                    ...(item.bgClass
                                      ? {}
                                      : { background: `${item.color}1f` }),
                                  }}
                                >
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="sidebar-item-info">
                                  <span className="sidebar-item-label">{item.label}</span>
                                  <span className="sidebar-item-type">
                                    {isBuiltInComponent(item.type)
                                      ? item.type
                                      : item.description || item.type}
                                  </span>
                                </div>
                                {!isBuiltInComponent(item.type) ? (
                                  <button
                                    type="button"
                                    className="sidebar-component-delete"
                                    aria-label={`Delete ${item.label}`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      event.preventDefault();
                                      setPendingDeleteComponent({
                                        key: item.type,
                                        label: item.label,
                                      });
                                    }}
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
                                ) : null}
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
                      ) : (
                        <div className="sidebar-group-empty">No components in this group yet.</div>
                      )}
                    </div>
                  ) : null}
                </section>
              );
            })}
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
                      <div className="sidebar-item-info">
                        <span className="sidebar-item-label">{workflow.name}</span>
                        <span className="sidebar-item-type">
                          {canvasCount} canvas
                          {canvasCount === 1 ? "" : "es"}
                          {" | "}
                          {rootCanvas?.name || "Root"}
                        </span>
                      </div>
                    </div>
                  </button>
                  <div className="sidebar-workflow-actions">
                    {isActive ? <span className="sidebar-workflow-badge">Active</span> : null}
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

      {jsonEditorGroup ? (
        <div
          className="app-modal-backdrop"
          role="presentation"
          onClick={() => {
            setJsonEditorGroup(null);
            setJsonError(null);
          }}
        >
          <div
            className="app-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-component-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="app-modal-header">
              <div className="app-modal-icon">
                <ActionIcon className="h-5 w-5" />
              </div>
              <div className="app-modal-copy">
                <h3 id="create-component-title" className="app-modal-title">
                  Create Component
                </h3>
                <p className="app-modal-text">
                  Define the new {jsonEditorGroup} component in JSON. It will appear in the
                  sidebar as soon as you create it.
                </p>
              </div>
            </div>
            <textarea
              className="dark-input"
              style={{ minHeight: 220, resize: "vertical", fontFamily: "monospace" }}
              value={jsonValue}
              onChange={(event) => setJsonValue(event.target.value)}
            />
            {jsonError ? <p className="app-modal-warning-text">{jsonError}</p> : null}
            <div className="app-modal-actions">
              <button
                type="button"
                className="app-modal-btn app-modal-btn-secondary"
                onClick={() => {
                  setJsonEditorGroup(null);
                  setJsonError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app-modal-btn app-modal-btn-danger"
                onClick={handleCreateComponent}
              >
                Create Component
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDeleteComponent ? (
        <div
          className="app-modal-backdrop"
          role="presentation"
          onClick={() => setPendingDeleteComponent(null)}
        >
          <div
            className="app-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-component-title"
            aria-describedby="delete-component-description"
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
                <h3 id="delete-component-title" className="app-modal-title">
                  Delete component?
                </h3>
                <p id="delete-component-description" className="app-modal-text">
                  <span className="app-modal-strong">{pendingDeleteComponent.label}</span> will be
                  removed from the sidebar and deleted from canvases where it is used.
                </p>
              </div>
            </div>
            <div className="app-modal-warning">
              <span className="app-modal-warning-label">Permanent action</span>
              <span className="app-modal-warning-text">
                Existing instances of <span className="app-modal-strong">{pendingDeleteComponent.label}</span> will also be removed.
              </span>
            </div>
            <div className="app-modal-actions">
              <button
                type="button"
                className="app-modal-btn app-modal-btn-secondary"
                onClick={() => setPendingDeleteComponent(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app-modal-btn app-modal-btn-danger"
                onClick={() => {
                  removeCustomComponent(pendingDeleteComponent.key);
                  setPendingDeleteComponent(null);
                }}
              >
                Delete Component
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
