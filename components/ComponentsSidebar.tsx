"use client";

import { useState } from "react";
import { useFlowStore } from "@/store/useFlowStore";
import { nodeTypeMeta } from "./node-icons";
import {
  componentDefinitions,
  componentGroups,
  type ComponentGroupId,
  type ComponentType,
} from "@/config/componentCatalog";

type PendingDeleteWorkflow = {
  id: string;
  name: string;
};

export default function ComponentsSidebar() {
  const {
    deleteWorkflow,
    activeWorkflowId,
    isSidebarOpen,
    openSidebar,
    assignComponentToGroup,
    componentGroupAssignments,
    selectWorkflow,
    sidebarView,
    toggleSidebar,
    workflowOrder,
    workflows,
  } = useFlowStore();
  const [expandedGroups, setExpandedGroups] = useState<Record<ComponentGroupId, boolean>>({
    branchable: true,
    unbranchable: true,
  });
  const [menuOpenForGroup, setMenuOpenForGroup] = useState<ComponentGroupId | null>(null);
  const [pendingDeleteWorkflow, setPendingDeleteWorkflow] = useState<PendingDeleteWorkflow | null>(
    null,
  );

  if (!isSidebarOpen) {
    return null;
  }

  const isWorkflowView = sidebarView === "workflows";

  const getGroupItems = (groupId: ComponentGroupId) =>
    componentDefinitions
      .filter((item) => componentGroupAssignments[item.type] === groupId)
      .map((item) => ({
        ...item,
        label: nodeTypeMeta[item.type].label,
      }));

  const getAvailableItems = (groupId: ComponentGroupId) =>
    componentDefinitions
      .filter((item) => componentGroupAssignments[item.type] !== groupId)
      .map((item) => ({
        ...item,
        label: nodeTypeMeta[item.type].label,
      }));

  const toggleGroup = (groupId: ComponentGroupId) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  const addComponentToGroup = (groupId: ComponentGroupId, type: ComponentType) => {
    assignComponentToGroup(type, groupId);
    setMenuOpenForGroup(null);
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
              const availableItems = getAvailableItems(group.id);
              const isMenuOpen = menuOpenForGroup === group.id;

              return (
                <section
                  key={group.id}
                  className="sidebar-group"
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
                        aria-expanded={isMenuOpen}
                        onClick={() =>
                          setMenuOpenForGroup((current) =>
                            current === group.id ? null : group.id,
                          )
                        }
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

                      {isMenuOpen ? (
                        <div className="sidebar-group-menu" role="menu">
                          {availableItems.length > 0 ? (
                            availableItems.map((item) => (
                              <button
                                key={`${group.id}-${item.type}`}
                                type="button"
                                className="sidebar-group-menu-item"
                                onClick={() => addComponentToGroup(group.id, item.type)}
                              >
                                {item.label}
                              </button>
                            ))
                          ) : (
                            <div className="sidebar-group-menu-empty">
                              No more components to add
                            </div>
                          )}
                        </div>
                      ) : null}
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
                            const meta = nodeTypeMeta[item.type];
                            const Icon = meta?.Icon;

                            return (
                              <div
                                key={item.type}
                                className={`sidebar-item ${item.bgClass}`}
                                draggable
                                onDragStart={(event) => {
                                  event.dataTransfer.setData("application/reactflow", item.type);
                                  event.dataTransfer.effectAllowed = "move";
                                }}
                              >
                                <div className="sidebar-item-icon" style={{ color: item.color }}>
                                  {Icon ? <Icon className="h-5 w-5" /> : null}
                                </div>
                                <div className="sidebar-item-info">
                                  <span className="sidebar-item-label">{item.label}</span>
                                  <span className="sidebar-item-type">{item.type}</span>
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
    </>
  );
}
