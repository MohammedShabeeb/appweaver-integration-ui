"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ComponentType as ReactComponentType } from "react";
import { beanCatalog } from "@/config/beanCatalog";
import { dataSourceCatalog } from "@/config/datasourceCatalog";
import { useFlowStore } from "@/store/useFlowStore";
import {
  componentGroups,
  visibleComponentDefinitions,
  type BuiltInComponentType,
  type ComponentGroupId,
} from "@/config/componentCatalog";
import { nodeTypeMeta } from "./node-icons";

type PendingDeleteWorkflow = {
  id: string;
  name: string;
};

type BeanEditorState = {
  name: string;
  className: string;
  constructorArgs: string;
};

type DataSourceEditorState = {
  key: string;
  driver: string;
  username: string;
  password: string;
  maxPool: string;
  minPool: string;
  url: string;
  packageToScan: string;
  l2CacheProvider: string;
  strategy: string;
};

type StepListItem = {
  type: Exclude<BuiltInComponentType, "start">;
  label: string;
  color: string;
  bgClass?: string;
  Icon: ReactComponentType<{ className?: string; style?: CSSProperties }>;
  description: string;
};

type PaletteItem = {
  type: string;
  label: string;
  color: string;
  bgClass?: string;
  Icon: ReactComponentType<{ className?: string; style?: CSSProperties }>;
  description: string;
};

const stepDescriptions: Record<StepListItem["type"], string> = {
  marshal: "Serialize the message body using the backend marshal step.",
  unmarshal: "Read JSON, CSV, or XML into the message body.",
  setBody: "Set the message body from an expression or constant data.",
  setHeader: "Set a message header from an expression or constant value.",
  setProperty: "Set an exchange property from an expression or constant value.",
  setContext: "Set a shared context value from an expression or constant.",
  globalOption: "Set a reusable Camel global option.",
  convertBodyTo: "Convert the message body to a target Java class.",
  transform: "Transform the message body with a simple expression or mapper.",
  filter: "Pass messages that match a rule.",
  routeContainer: "Define a nested child route inside this container.",
  split: "Split the exchange body and run nested steps.",
  dynamicroute: "Choose the next endpoint at runtime.",
  validate: "Reject invalid JSON payloads with MVEL-style rules.",
  process: "Run a processor bean by entering its `ref` name.",
  bean: "Call a registry bean or Java class.",
  to: "Send the exchange to a static Camel endpoint.",
  toD: "Send the exchange to a dynamic Camel endpoint URI.",
  upload: "Upload multipart documents to a configured endpoint.",
  download: "Download content from a configured endpoint.",
  enrich: "Call an endpoint and merge its response.",
  dbCrud: "Run create, read, update, delete, or custom SQL operations against the configured database.",
  smartRouter: "Route to the selected endpoint and optionally transform the request payload first.",
  agent: "Invoke an LLM agent with tools filtered by a shared direct-route tag.",
  workflow: "Design, select, and save BPMN workflows with BPMN.js.",
  aggregation: "Group messages with a strategy.",
  delay: "Pause processing with a constant or simple expression.",
  log: "Write a log message with logger name and level.",
};

const componentGroupByType = Object.fromEntries(
  visibleComponentDefinitions.map((component) => [component.type, component.defaultGroup]),
) as Partial<Record<StepListItem["type"], ComponentGroupId>>;

const initialOpenComponentGroups = Object.fromEntries(
  componentGroups.map((group) => [
    group.id,
    ["transform", "metadata", "reliability", "timingObservability"].includes(group.id),
  ]),
) as Record<ComponentGroupId, boolean>;

function createBeanEditorState(beanName: string): BeanEditorState {
  const template = beanCatalog.find((item) => item.name === beanName) ?? beanCatalog[0];

  return {
    name: template?.name ?? "",
    className: template?.className ?? "",
    constructorArgs: JSON.stringify(template?.constructorArgs ?? [], null, 2),
  };
}

function createDataSourceEditorState(dataSourceKey: string): DataSourceEditorState {
  const template = dataSourceCatalog.find((item) => item.key === dataSourceKey) ?? dataSourceCatalog[0];

  return {
    key: template?.key ?? "",
    driver: template?.driver ?? "",
    username: template?.username ?? "",
    password: template?.password ?? "",
    maxPool: String(template?.maxPool ?? 10),
    minPool: String(template?.minPool ?? 2),
    url: template?.url ?? "",
    packageToScan: template?.packageToScan ?? "",
    l2CacheProvider: template?.l2CacheProvider ?? "",
    strategy: JSON.stringify(template?.strategy ?? { name: "" }, null, 2),
  };
}

export default function ComponentsSidebar() {
  const {
    createWorkflow,
    deleteWorkflow,
    activeWorkflowId,
    addBean,
    addDataSource,
    beans,
    dataSources,
    isSidebarOpen,
    removeDataSource,
    selectedConfigSection,
    selectWorkflow,
    sidebarView,
    toggleSidebar,
    workflowOrder,
    workflows,
    customComponents,
  } = useFlowStore();
  const [pendingDeleteWorkflow, setPendingDeleteWorkflow] = useState<PendingDeleteWorkflow | null>(
    null,
  );
  const [workflowName, setWorkflowName] = useState("");
  const [highlightedTarget, setHighlightedTarget] = useState<string | null>(null);
  const [selectedBeanName, setSelectedBeanName] = useState(beanCatalog[0]?.name ?? "");
  const [beanEditor, setBeanEditor] = useState<BeanEditorState>(() =>
    createBeanEditorState(beanCatalog[0]?.name ?? ""),
  );
  const [beanError, setBeanError] = useState<string | null>(null);
  const [isBeanConfigOpen, setIsBeanConfigOpen] = useState(true);
  const [selectedDataSourceKey, setSelectedDataSourceKey] = useState(dataSourceCatalog[0]?.key ?? "");
  const [dataSourceEditor, setDataSourceEditor] = useState<DataSourceEditorState>(() =>
    createDataSourceEditorState(dataSourceCatalog[0]?.key ?? ""),
  );
  const [dataSourceError, setDataSourceError] = useState<string | null>(null);
  const [isDataSourceConfigOpen, setIsDataSourceConfigOpen] = useState(true);
  const [openComponentGroups, setOpenComponentGroups] = useState<Record<ComponentGroupId | "custom", boolean>>({
    ...initialOpenComponentGroups,
    custom: true,
  });

  const isWorkflowView = sidebarView === "workflows";
  const isConfigsView = sidebarView === "configs";
  const selectedBeanTemplate =
    beanCatalog.find((item) => item.name === selectedBeanName) ?? beanCatalog[0] ?? null;
  const selectedDataSourceTemplate =
    dataSourceCatalog.find((item) => item.key === selectedDataSourceKey) ?? dataSourceCatalog[0] ?? null;
  const stepItems = useMemo<StepListItem[]>(
    () =>
      visibleComponentDefinitions
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
  const customStepItems = useMemo(
    () =>
      customComponents.map((item) => ({
        type: item.type,
        label: item.label,
        color: item.color,
        Icon: nodeTypeMeta.process.Icon,
        description: item.description || item.type,
      })),
    [customComponents],
  );
  const groupedStepItems = useMemo(
    () =>
      componentGroups
        .map((group) => ({
          ...group,
          items: stepItems.filter((item) => componentGroupByType[item.type] === group.id),
        }))
        .filter((group) => group.items.length > 0),
    [stepItems],
  );

  const handleCreateWorkflow = () => {
    createWorkflow(workflowName.trim() || "Workflow");
    setWorkflowName("");
  };

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
      const componentGroupId = componentGroupByType[detail.componentKey as StepListItem["type"]];

      if (componentGroupId) {
        setOpenComponentGroups((current) => ({ ...current, [componentGroupId]: true }));
      } else if (customComponents.some((component) => component.type === detail.componentKey)) {
        setOpenComponentGroups((current) => ({ ...current, custom: true }));
      }

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
  }, [customComponents]);

  if (!isSidebarOpen) {
    return null;
  }

  const handleCreateBean = () => {
    if (!selectedBeanTemplate) {
      return;
    }

    try {
      const constructorArgs = JSON.parse(beanEditor.constructorArgs);

      if (!Array.isArray(constructorArgs)) {
        setBeanError("`constructorArgs` must be a JSON array.");
        return;
      }

      const result = addBean({
        name: beanEditor.name.trim() || selectedBeanTemplate.name,
        className: beanEditor.className.trim() || selectedBeanTemplate.className,
        constructorArgs,
      });

      if (!result.ok) {
        setBeanError(result.reason);
        return;
      }

      setBeanError(null);
    } catch {
      setBeanError("One or more bean fields contain invalid JSON.");
    }
  };

  const handleCreateDataSource = () => {
    if (!selectedDataSourceTemplate) {
      return;
    }

    try {
      const strategy = JSON.parse(dataSourceEditor.strategy);

      if (!strategy || typeof strategy !== "object" || Array.isArray(strategy)) {
        setDataSourceError("`strategy` must be a JSON object.");
        return;
      }

      const maxPool = Number(dataSourceEditor.maxPool);
      const minPool = Number(dataSourceEditor.minPool);

      if (!Number.isFinite(maxPool) || !Number.isFinite(minPool)) {
        setDataSourceError("`maxPool` and `minPool` must be valid numbers.");
        return;
      }

      const result = addDataSource({
        key: dataSourceEditor.key.trim() || selectedDataSourceTemplate.key,
        driver: dataSourceEditor.driver.trim() || selectedDataSourceTemplate.driver,
        username: dataSourceEditor.username,
        password: dataSourceEditor.password,
        maxPool,
        minPool,
        url: dataSourceEditor.url.trim() || selectedDataSourceTemplate.url,
        packageToScan: dataSourceEditor.packageToScan.trim(),
        l2CacheProvider:
          dataSourceEditor.l2CacheProvider.trim() || selectedDataSourceTemplate.l2CacheProvider,
        strategy: strategy as { name: string; schema?: string },
      });

      if (!result.ok) {
        setDataSourceError(result.reason);
        return;
      }

      setDataSourceError(null);
    } catch {
      setDataSourceError("One or more datasource fields contain invalid JSON.");
    }
  };

  const toggleComponentGroup = (groupId: ComponentGroupId | "custom") => {
    setOpenComponentGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  const renderPaletteItem = (item: PaletteItem) => {
    const Icon = item.Icon;

    return (
      <div
        key={item.type}
        id={`sidebar-component-${item.type}`}
        className={`sidebar-item ${item.bgClass ?? ""} ${
          highlightedTarget === `sidebar-component-${item.type}` ? "sidebar-search-match" : ""
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
  };

  return (
    <>
      <aside className="components-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <h2 className="sidebar-title">
              {isWorkflowView ? "Workflows" : isConfigsView ? "Configs" : "Components"}
            </h2>
            <p className="sidebar-hint">
              {isWorkflowView
                ? "Select a workflow to render it on the canvas"
                : isConfigsView
                  ? "Open a configuration section, fill in its fields, and create the item"
                  : "Drag a route step onto the canvas, then select it to edit its settings"}
            </p>
          </div>
          <button type="button" className="sidebar-close" onClick={toggleSidebar}>
            <span className="sidebar-close-label">Close</span>
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

        {!isWorkflowView && !isConfigsView ? (
          <div className="sidebar-items">
            {groupedStepItems.map((group) => {
              const isOpen = openComponentGroups[group.id];

              return (
                <section key={group.id} className="sidebar-group" aria-labelledby={`sidebar-group-${group.id}`}>
                  <div className="sidebar-group-toolbar">
                    <button
                      type="button"
                      className="sidebar-group-trigger"
                      onClick={() => toggleComponentGroup(group.id)}
                      aria-expanded={isOpen}
                      aria-controls={`sidebar-group-panel-${group.id}`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`sidebar-group-chevron ${isOpen ? "sidebar-group-chevron-open" : ""}`}
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                      <span id={`sidebar-group-${group.id}`} className="sidebar-group-title">
                        {group.label}
                      </span>
                      <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 11, fontWeight: 700 }}>
                        {group.items.length}
                      </span>
                    </button>
                  </div>
                  {isOpen ? (
                    <div id={`sidebar-group-panel-${group.id}`} className="sidebar-group-panel">
                      <p className="sidebar-group-description" style={{ paddingInline: 2 }}>
                        {group.description}
                      </p>
                      <div className="sidebar-group-items sidebar-group-items-compact">
                        {group.items.map((item) => renderPaletteItem(item))}
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })}

            {customStepItems.length > 0 ? (
              <section className="sidebar-group" aria-labelledby="sidebar-group-custom">
                <div className="sidebar-group-toolbar">
                  <button
                    type="button"
                    className="sidebar-group-trigger"
                    onClick={() => toggleComponentGroup("custom")}
                    aria-expanded={openComponentGroups.custom}
                    aria-controls="sidebar-group-panel-custom"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`sidebar-group-chevron ${openComponentGroups.custom ? "sidebar-group-chevron-open" : ""}`}
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                    <span id="sidebar-group-custom" className="sidebar-group-title">
                      Custom
                    </span>
                    <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 11, fontWeight: 700 }}>
                      {customStepItems.length}
                    </span>
                  </button>
                </div>
                {openComponentGroups.custom ? (
                  <div id="sidebar-group-panel-custom" className="sidebar-group-panel">
                    <p className="sidebar-group-description" style={{ paddingInline: 2 }}>
                      Components created from local templates.
                    </p>
                    <div className="sidebar-group-items sidebar-group-items-compact">
                      {customStepItems.map((item) => renderPaletteItem(item))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : isConfigsView ? (
          <div className="sidebar-items">
            <section className="sidebar-group" aria-labelledby="sidebar-group-beans">
              <div className="sidebar-group-toolbar">
                <div className="sidebar-group-trigger">
                  <span id="sidebar-group-beans" className="sidebar-group-title">
                    Configurations
                  </span>
                </div>
              </div>
              <div className="sidebar-group-panel">
                <div
                  style={{
                    paddingBottom: 8,
                    paddingInline: 2,
                  }}
                >
                  <span
                    className="sidebar-group-title"
                    style={{ fontSize: 12, letterSpacing: "0.08em", color: "#64748b" }}
                  >
                    {selectedConfigSection === "beans"
                      ? "Beans"
                      : selectedConfigSection === "datasources"
                        ? "Datasources"
                        : selectedConfigSection === "components"
                          ? "Component Builder"
                          : "Use the top menu"}
                  </span>
                </div>
                {selectedConfigSection === "beans" ? (
                  <>
                    <div
                      style={{
                        borderRadius: 14,
                        border: "1px solid rgba(226, 232, 240, 0.95)",
                        background: "rgba(255, 255, 255, 0.98)",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        type="button"
                        className="sidebar-group-trigger"
                        style={{ padding: "16px 16px 14px", borderRadius: 0 }}
                        onClick={() => setIsBeanConfigOpen((current) => !current)}
                        aria-expanded={isBeanConfigOpen}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`sidebar-group-chevron ${isBeanConfigOpen ? "sidebar-group-chevron-open" : ""}`}
                          aria-hidden="true"
                        >
                          <path d="m9 6 6 6-6 6" />
                        </svg>
                        <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                          Bean Setup
                        </span>
                      </button>
                      {isBeanConfigOpen ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                            padding: "4px 16px 16px",
                          }}
                        >
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                              Bean Template
                            </span>
                            <select
                              className="dark-input"
                              value={selectedBeanName}
                              onChange={(event) => {
                                const nextBeanName = event.target.value;
                                setSelectedBeanName(nextBeanName);
                                setBeanEditor(createBeanEditorState(nextBeanName));
                                setBeanError(null);
                              }}
                            >
                              {beanCatalog.map((bean) => (
                                <option key={bean.name} value={bean.name}>
                                  {bean.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          {selectedBeanTemplate ? (
                            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#64748b" }}>
                              Edit the bean using the same fields as the JSON source: `name`,
                              `className`, and `arguments`.
                            </p>
                          ) : null}
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                              name
                            </span>
                            <input
                              className="dark-input"
                              value={beanEditor.name}
                              onChange={(event) =>
                                setBeanEditor((current) => ({ ...current, name: event.target.value }))
                              }
                            />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                              className
                            </span>
                            <input
                              className="dark-input"
                              value={beanEditor.className}
                              onChange={(event) =>
                                setBeanEditor((current) => ({ ...current, className: event.target.value }))
                              }
                            />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                              arguments
                            </span>
                            <textarea
                              className="dark-input"
                              style={{ minHeight: 140, resize: "vertical", fontFamily: "monospace" }}
                              value={beanEditor.constructorArgs}
                              onChange={(event) =>
                                setBeanEditor((current) => ({
                                  ...current,
                                  constructorArgs: event.target.value,
                                }))
                              }
                            />
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                              Enter a JSON array, for example <code>[&quot;@file&quot;, {}]</code>.
                            </span>
                          </label>
                          {beanError ? <p style={{ margin: 0, fontSize: 12, color: "#dc2626" }}>{beanError}</p> : null}
                          <button type="button" className="app-modal-btn app-modal-btn-danger" onClick={handleCreateBean}>
                            Create Bean
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 6 }}>
                      <span className="sidebar-group-title">Created Beans</span>
                      {beans.length > 0 ? (
                        beans.map((bean) => (
                          <div key={bean.id} className="sidebar-item sidebar-workflow-item" style={{ padding: "14px 14px" }}>
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
                                  <path d="M7 21h10" />
                                  <path d="M10 21v-4" />
                                  <path d="M14 21v-4" />
                                  <path d="M8 4h8l3 5-7 9-7-9 3-5Z" />
                                </svg>
                              </div>
                              <div className="sidebar-item-info sidebar-workflow-copy">
                                <span className="sidebar-item-label sidebar-workflow-label">{bean.name}</span>
                                <span className="sidebar-item-type sidebar-workflow-meta">
                                  {bean.className}
                                </span>
                                <span className="sidebar-item-type sidebar-workflow-meta">
                                  {bean.constructorArgs.length} field{bean.constructorArgs.length === 1 ? "" : "s"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="sidebar-group-empty">No beans created yet.</div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        borderRadius: 14,
                        border: "1px solid rgba(226, 232, 240, 0.95)",
                        background: "rgba(255, 255, 255, 0.98)",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        type="button"
                        className="sidebar-group-trigger"
                        style={{ padding: "16px 16px 14px", borderRadius: 0 }}
                        onClick={() => setIsDataSourceConfigOpen((current) => !current)}
                        aria-expanded={isDataSourceConfigOpen}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`sidebar-group-chevron ${isDataSourceConfigOpen ? "sidebar-group-chevron-open" : ""}`}
                          aria-hidden="true"
                        >
                          <path d="m9 6 6 6-6 6" />
                        </svg>
                        <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                          Datasource Setup
                        </span>
                      </button>
                      {isDataSourceConfigOpen ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                            padding: "4px 16px 16px",
                          }}
                        >
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                              Datasource Template
                            </span>
                            <select
                              className="dark-input"
                              value={selectedDataSourceKey}
                              onChange={(event) => {
                                const nextDataSourceKey = event.target.value;
                                setSelectedDataSourceKey(nextDataSourceKey);
                                setDataSourceEditor(createDataSourceEditorState(nextDataSourceKey));
                                setDataSourceError(null);
                              }}
                            >
                              {dataSourceCatalog.map((dataSource) => (
                                <option key={dataSource.key} value={dataSource.key}>
                                  {dataSource.key}
                                </option>
                              ))}
                            </select>
                          </label>
                          {selectedDataSourceTemplate ? (
                            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#94a3b8" }}>
                              Edit the datasource using the same fields as the JSON source,
                              including the nested `strategy` object.
                            </p>
                          ) : null}
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                              key
                            </span>
                            <input
                              className="dark-input"
                              value={dataSourceEditor.key}
                              onChange={(event) =>
                                setDataSourceEditor((current) => ({ ...current, key: event.target.value }))
                              }
                            />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                              driver
                            </span>
                            <input
                              className="dark-input"
                              value={dataSourceEditor.driver}
                              onChange={(event) =>
                                setDataSourceEditor((current) => ({ ...current, driver: event.target.value }))
                              }
                            />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                              username
                            </span>
                            <input
                              className="dark-input"
                              value={dataSourceEditor.username}
                              onChange={(event) =>
                                setDataSourceEditor((current) => ({ ...current, username: event.target.value }))
                              }
                            />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                              password
                            </span>
                            <input
                              className="dark-input"
                              value={dataSourceEditor.password}
                              onChange={(event) =>
                                setDataSourceEditor((current) => ({ ...current, password: event.target.value }))
                              }
                            />
                          </label>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                                maxPool
                              </span>
                              <input
                                className="dark-input"
                                value={dataSourceEditor.maxPool}
                                onChange={(event) =>
                                  setDataSourceEditor((current) => ({ ...current, maxPool: event.target.value }))
                                }
                              />
                            </label>
                            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                                minPool
                              </span>
                              <input
                                className="dark-input"
                                value={dataSourceEditor.minPool}
                                onChange={(event) =>
                                  setDataSourceEditor((current) => ({ ...current, minPool: event.target.value }))
                                }
                              />
                            </label>
                          </div>
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                              url
                            </span>
                            <input
                              className="dark-input"
                              value={dataSourceEditor.url}
                              onChange={(event) =>
                                setDataSourceEditor((current) => ({ ...current, url: event.target.value }))
                              }
                            />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                              packageToScan
                            </span>
                            <input
                              className="dark-input"
                              value={dataSourceEditor.packageToScan}
                              onChange={(event) =>
                                setDataSourceEditor((current) => ({ ...current, packageToScan: event.target.value }))
                              }
                            />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                              l2CacheProvider
                            </span>
                            <input
                              className="dark-input"
                              value={dataSourceEditor.l2CacheProvider}
                              onChange={(event) =>
                                setDataSourceEditor((current) => ({ ...current, l2CacheProvider: event.target.value }))
                              }
                            />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="sidebar-group-title" style={{ fontSize: 12, letterSpacing: "0.02em" }}>
                              strategy
                            </span>
                            <textarea
                              className="dark-input"
                              style={{ minHeight: 120, resize: "vertical", fontFamily: "monospace" }}
                              value={dataSourceEditor.strategy}
                              onChange={(event) =>
                                setDataSourceEditor((current) => ({
                                  ...current,
                                  strategy: event.target.value,
                                }))
                              }
                            />
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                              Enter a JSON object, for example <code>{'{ "name": "DATABASE" }'}</code>.
                            </span>
                          </label>
                          {dataSourceError ? (
                            <p style={{ margin: 0, fontSize: 12, color: "#fca5a5" }}>{dataSourceError}</p>
                          ) : null}
                          <button type="button" className="app-modal-btn app-modal-btn-danger" onClick={handleCreateDataSource}>
                            Create Datasource
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 6 }}>
                      <span className="sidebar-group-title">Created Datasources</span>
                      {dataSources.length > 0 ? (
                        dataSources.map((dataSource) => (
                          <div key={dataSource.id} className="sidebar-item sidebar-workflow-item" style={{ padding: "14px 14px" }}>
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
                                  <ellipse cx="12" cy="5" rx="7" ry="3" />
                                  <path d="M5 5v10c0 1.66 3.13 3 7 3s7-1.34 7-3V5" />
                                  <path d="M5 10c0 1.66 3.13 3 7 3s7-1.34 7-3" />
                                </svg>
                              </div>
                              <div className="sidebar-item-info sidebar-workflow-copy">
                                <span className="sidebar-item-label sidebar-workflow-label">{dataSource.key}</span>
                                <span className="sidebar-item-type sidebar-workflow-meta">
                                  {dataSource.url}
                                </span>
                                <span className="sidebar-item-type sidebar-workflow-meta">
                                  {dataSource.strategy.name}
                                  {dataSource.strategy.schema ? ` | ${dataSource.strategy.schema}` : ""}
                                </span>
                              </div>
                            </div>
                            <div className="sidebar-workflow-actions">
                              <button
                                type="button"
                                className="sidebar-workflow-delete"
                                aria-label={`Delete ${dataSource.key}`}
                                onClick={() => removeDataSource(dataSource.id)}
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
                        ))
                      ) : (
                        <div className="sidebar-group-empty">No datasources created yet.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="sidebar-items">
            <form
              className="sidebar-workflow-create"
              onSubmit={(event) => {
                event.preventDefault();
                handleCreateWorkflow();
              }}
            >
              <label className="sidebar-workflow-create-label" htmlFor="workflow-name-input">
                New Workflow
              </label>
              <div className="sidebar-workflow-create-row">
                <input
                  id="workflow-name-input"
                  className="sidebar-workflow-create-input"
                  value={workflowName}
                  onChange={(event) => setWorkflowName(event.target.value)}
                  placeholder="Workflow name"
                />
                <button type="submit" className="sidebar-workflow-create-button">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  <span className="sr-only">Create workflow</span>
                </button>
              </div>
            </form>
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
