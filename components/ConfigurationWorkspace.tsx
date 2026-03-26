"use client";

import { useMemo, useState } from "react";

import {
  useFlowStore,
  type CreatedBean,
  type CreatedDataSource,
  type CreatedSecurityConfig,
  type SecuritySubsection,
} from "@/store/useFlowStore";

type BeanEditorState = {
  name: string;
  className: string;
  constructorArgs: string[] | string;
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

type SecurityEditorState = {
  fileName: string;
  content: string;
};

function createBeanEditorState(): BeanEditorState {
  return {
    name: "",
    className: "",
    constructorArgs: ["", ""],
  };
}

function createBeanEditorFromItem(bean: CreatedBean): BeanEditorState {
  return {
    name: bean.name,
    className: bean.className,
    constructorArgs:
      bean.constructorArgs.length > 0
        ? bean.constructorArgs.map((arg) =>
            typeof arg === "string" ? arg : JSON.stringify(arg),
          )
        : ["", ""],
  };
}

function createDataSourceEditorState(): DataSourceEditorState {
  return {
    key: "",
    driver: "",
    username: "",
    password: "",
    maxPool: "",
    minPool: "",
    url: "",
    packageToScan: "",
    l2CacheProvider: "",
    strategy: '{\n  "name": ""\n}',
  };
}

function createDataSourceEditorFromItem(dataSource: CreatedDataSource): DataSourceEditorState {
  return {
    key: dataSource.key,
    driver: dataSource.driver,
    username: dataSource.username,
    password: dataSource.password,
    maxPool: String(dataSource.maxPool),
    minPool: String(dataSource.minPool),
    url: dataSource.url,
    packageToScan: dataSource.packageToScan,
    l2CacheProvider: dataSource.l2CacheProvider,
    strategy: JSON.stringify(dataSource.strategy, null, 2),
  };
}

const SECURITY_DEFAULTS: Record<
  SecuritySubsection,
  { fileName: string; content: string }
> = {
  auth: {
    fileName: "apikey.json",
    content: '{\n  "type": "apikey",\n  "header": "X-API-Key",\n  "value": ""\n}',
  },
  authorize: {
    fileName: "policy.json",
    content: '{\n  "type": "policy",\n  "effect": "allow",\n  "resource": "*",\n  "actions": []\n}',
  },
};

function createSecurityEditorState(subsection: SecuritySubsection): SecurityEditorState {
  const defaults = SECURITY_DEFAULTS[subsection];

  return {
    fileName: defaults.fileName,
    content: defaults.content,
  };
}

function createSecurityEditorFromItem(item: CreatedSecurityConfig): SecurityEditorState {
  return {
    fileName: item.fileName,
    content: item.content,
  };
}

const pageStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: "18px 20px 22px",
  overflow: "hidden",
};

const panelStyle: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid rgba(71, 85, 105, 0.32)",
  background: "linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(15, 23, 42, 0.82))",
  boxShadow: "0 24px 46px rgba(2, 6, 23, 0.22)",
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(71, 85, 105, 0.45)",
  background: "rgba(15, 23, 42, 0.72)",
  padding: "12px 14px",
  fontSize: 14,
  color: "#e2e8f0",
  fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
  outline: "none",
};

const listItemMetaStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: "#94a3b8",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  lineHeight: 1.55,
};

const iconButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 999,
  border: "1px solid rgba(96, 165, 250, 0.28)",
  background: "rgba(30, 41, 59, 0.74)",
  color: "#dbeafe",
  cursor: "pointer",
  flexShrink: 0,
};

const deleteIconButtonStyle: React.CSSProperties = {
  ...iconButtonStyle,
  width: 26,
  height: 26,
  borderRadius: 9,
  border: "1px solid rgba(252, 165, 165, 0.34)",
  background: "linear-gradient(180deg, rgba(185, 28, 28, 0.96), rgba(153, 27, 27, 0.9))",
  color: "#fee2e2",
  boxShadow: "0 6px 14px rgba(127, 29, 29, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
};

const workspaceGridStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 340px)",
  gap: 20,
  alignItems: "stretch",
  overflow: "hidden",
};

const workspacePanelStyle: React.CSSProperties = {
  ...panelStyle,
  padding: 20,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

function parseConstructorArgValue(value: string): unknown {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed;
  }

  if (
    trimmed === "true" ||
    trimmed === "false" ||
    trimmed === "null" ||
    /^-?\d+(\.\d+)?$/.test(trimmed) ||
    ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]")))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
}

function normalizeConstructorArgs(value: BeanEditorState["constructorArgs"]): string[] {
  if (Array.isArray(value)) {
    return value.length > 0 ? value : ["", ""];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.length > 0
          ? parsed.map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
          : ["", ""];
      }
    } catch {
      return value.trim().length > 0 ? [value] : ["", ""];
    }

    return value.trim().length > 0 ? [value] : ["", ""];
  }

  return ["", ""];
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>
        {title}
      </h2>
      <p style={{ margin: 0, color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>{subtitle}</p>
    </div>
  );
}

function BeansWorkspace() {
  const { beans, addBean, updateBean, removeBean } = useFlowStore();
  const [selectedBeanId, setSelectedBeanId] = useState<string | null>(null);
  const [editor, setEditor] = useState<BeanEditorState>(() => createBeanEditorState());
  const [error, setError] = useState<string | null>(null);
  const constructorArgs = normalizeConstructorArgs(editor.constructorArgs);

  const selectedBean = beans.find((bean) => bean.id === selectedBeanId) ?? null;

  const handleCreate = () => {
    try {
      const nextConstructorArgs = constructorArgs.map((arg) => parseConstructorArgValue(arg));

      const result = addBean({
        name: editor.name,
        className: editor.className,
        constructorArgs: nextConstructorArgs,
      });

      if (!result.ok) {
        setError(result.reason);
        return;
      }

      setError(null);
    } catch {
      setError("The constructor arguments could not be converted.");
    }
  };

  const handleUpdate = () => {
    if (!selectedBeanId) {
      setError("Select a bean from the list to edit it.");
      return;
    }

    try {
      const nextConstructorArgs = constructorArgs.map((arg) => parseConstructorArgValue(arg));

      const result = updateBean(selectedBeanId, {
        name: editor.name,
        className: editor.className,
        constructorArgs: nextConstructorArgs,
      });

      if (!result.ok) {
        setError(result.reason);
        return;
      }

      setError(null);
    } catch {
      setError("The constructor arguments could not be converted.");
    }
  };

  const handleDelete = (beanId: string) => {
    removeBean(beanId);

    if (selectedBeanId === beanId) {
      setSelectedBeanId(null);
      setEditor(createBeanEditorState());
      setError(null);
    }
  };

  return (
    <>
      <div style={workspaceGridStyle}>
        <section style={workspacePanelStyle}>
          <SectionTitle
            title={selectedBean ? "Edit Bean" : "Create Bean"}
            subtitle="Enter bean values manually, then save a new bean or update the selected one."
          />
          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              flex: 1,
              minHeight: 0,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Name
              </span>
              <input
                value={editor.name}
                onChange={(event) => setEditor((current) => ({ ...current, name: event.target.value }))}
                style={fieldStyle}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Class Name
              </span>
              <input
                value={editor.className}
                onChange={(event) => setEditor((current) => ({ ...current, className: event.target.value }))}
                style={fieldStyle}
              />
            </label>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Constructor Args
                </span>
                <button
                  type="button"
                  aria-label="Add constructor argument"
                  onClick={() =>
                    setEditor((current) => ({
                      ...current,
                      constructorArgs: [...normalizeConstructorArgs(current.constructorArgs), ""],
                    }))
                  }
                  style={iconButtonStyle}
                >
                  +
                </button>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {constructorArgs.map((arg, index) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <input
                      value={arg}
                      placeholder={`Argument ${index + 1}`}
                      onChange={(event) =>
                        setEditor((current) => ({
                          ...current,
                          constructorArgs: normalizeConstructorArgs(current.constructorArgs).map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item,
                          ),
                        }))
                      }
                      style={fieldStyle}
                    />
                    <button
                      type="button"
                      aria-label={`Remove argument ${index + 1}`}
                      onClick={() =>
                        setEditor((current) => ({
                          ...current,
                          constructorArgs:
                            normalizeConstructorArgs(current.constructorArgs).length > 1
                              ? normalizeConstructorArgs(current.constructorArgs).filter((_, itemIndex) => itemIndex !== index)
                              : [""],
                        }))
                      }
                      style={{ ...iconButtonStyle, width: 32, height: 32, borderRadius: 10 }}
                    >
                      -
                    </button>
                  </div>
                ))}
              </div>
              <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 12, lineHeight: 1.55 }}>
                Enter plain text for string arguments. If an argument looks like valid JSON such as
                `123`, `true`, `{}` or `[]`, it will be converted before saving.
              </p>
            </div>

            {error ? <p style={{ margin: 0, color: "#fca5a5", fontSize: 13 }}>{error}</p> : null}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: "auto", paddingTop: 8 }}>
              <button type="button" onClick={handleCreate} style={primaryButtonStyle}>
                Create Bean
              </button>
              <button type="button" onClick={handleUpdate} style={secondaryButtonStyle}>
                Edit Bean
              </button>
            </div>
          </div>
        </section>

        <section style={workspacePanelStyle}>
          <SectionTitle
            title="List Beans"
            subtitle="Select an existing bean to edit it, or enter a new bean manually."
          />
          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              paddingRight: 6,
            }}
          >
            {beans.length > 0 ? (
              beans.map((bean) => (
                <div
                  key={bean.id}
                  style={{
                    position: "relative",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBeanId(bean.id);
                      setEditor(createBeanEditorFromItem(bean));
                      setError(null);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      borderRadius: 16,
                      border:
                        bean.id === selectedBeanId
                          ? "1px solid rgba(96, 165, 250, 0.5)"
                          : "1px solid rgba(71, 85, 105, 0.3)",
                      background:
                        bean.id === selectedBeanId
                          ? "rgba(30, 64, 175, 0.18)"
                          : "rgba(15, 23, 42, 0.65)",
                      padding: "12px 46px 12px 16px",
                      color: "#e2e8f0",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>{bean.name}</div>
                    <div style={listItemMetaStyle}>{bean.className}</div>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${bean.name}`}
                    onClick={() => handleDelete(bean.id)}
                    style={{
                      ...deleteIconButtonStyle,
                      position: "absolute",
                      top: "50%",
                      right: 12,
                      transform: "translateY(-50%)",
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: 14, height: 14 }}
                    >
                      <path d="M9 3.75h6a1 1 0 0 1 1 1V6H8V4.75a1 1 0 0 1 1-1Z" />
                      <path d="M4.75 6h14.5" />
                      <path d="M6.75 6.75 7.6 19a2 2 0 0 0 2 1.86h4.8a2 2 0 0 0 2-1.86l.85-12.25" />
                      <path d="M10 10.25v6.5" />
                      <path d="M14 10.25v6.5" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <div
                style={{
                  borderRadius: 16,
                  border: "1px dashed rgba(71, 85, 105, 0.45)",
                  padding: "18px 16px",
                  color: "#64748b",
                  textAlign: "center",
                }}
              >
                No beans created yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function DatasourcesWorkspace() {
  const { dataSources, addDataSource, updateDataSource, removeDataSource } = useFlowStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<DataSourceEditorState>(() => createDataSourceEditorState());
  const [error, setError] = useState<string | null>(null);

  const selectedItem = dataSources.find((item) => item.id === selectedId) ?? null;

  const parseEditor = () => {
    const strategy = JSON.parse(editor.strategy);

    if (!strategy || typeof strategy !== "object" || Array.isArray(strategy)) {
      throw new Error("`strategy` must be a JSON object.");
    }

    const maxPool = Number(editor.maxPool);
    const minPool = Number(editor.minPool);

    if (!Number.isFinite(maxPool) || !Number.isFinite(minPool)) {
      throw new Error("`maxPool` and `minPool` must be valid numbers.");
    }

    return {
      key: editor.key,
      driver: editor.driver,
      username: editor.username,
      password: editor.password,
      maxPool,
      minPool,
      url: editor.url,
      packageToScan: editor.packageToScan,
      l2CacheProvider: editor.l2CacheProvider,
      strategy: strategy as CreatedDataSource["strategy"],
    };
  };

  const runAction = (
    action: (payload: Omit<CreatedDataSource, "id">) => { ok: true } | { ok: false; reason: string },
  ) => {
    try {
      const result = action(parseEditor());

      if (!result.ok) {
        setError(result.reason);
        return;
      }

      setError(null);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "The datasource fields are invalid.");
    }
  };

  const handleDelete = (dataSourceId: string) => {
    removeDataSource(dataSourceId);

    if (selectedId === dataSourceId) {
      setSelectedId(null);
      setEditor(createDataSourceEditorState());
      setError(null);
    }
  };

  return (
    <>
      <div style={workspaceGridStyle}>
        <section style={workspacePanelStyle}>
          <SectionTitle
            title={selectedItem ? "Edit Datasource" : "Create Datasource"}
            subtitle="Create and manage datasource definitions outside the workflow canvas."
          />
          <div
            style={{
              marginTop: 18,
              display: "grid",
              gap: 14,
              flex: 1,
              minHeight: 0,
              alignContent: "start",
              overflow: "auto",
              paddingRight: 6,
            }}
          >
            {(
              [
                ["Key", "key"],
                ["Driver", "driver"],
                ["Username", "username"],
                ["Password", "password"],
                ["URL", "url"],
                ["Package To Scan", "packageToScan"],
                ["L2 Cache Provider", "l2CacheProvider"],
              ] as const
            ).map(([label, key]) => (
              <label key={key} style={{ display: "grid", gap: 6 }}>
                <span style={fieldLabelStyle}>{label}</span>
                <input
                  value={editor[key]}
                  onChange={(event) =>
                    setEditor((current) => ({ ...current, [key]: event.target.value }))
                  }
                  style={fieldStyle}
                />
              </label>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
              {(["maxPool", "minPool"] as const).map((key) => (
                <label key={key} style={{ display: "grid", gap: 6 }}>
                  <span style={fieldLabelStyle}>{key}</span>
                  <input
                    value={editor[key]}
                    onChange={(event) =>
                      setEditor((current) => ({ ...current, [key]: event.target.value }))
                    }
                    style={fieldStyle}
                  />
                </label>
              ))}
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={fieldLabelStyle}>Strategy</span>
              <textarea
                value={editor.strategy}
                onChange={(event) => setEditor((current) => ({ ...current, strategy: event.target.value }))}
                style={{ ...fieldStyle, minHeight: 140, resize: "vertical", fontFamily: "monospace" }}
              />
            </label>

            {error ? <p style={{ margin: 0, color: "#fca5a5", fontSize: 13 }}>{error}</p> : null}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button type="button" onClick={() => runAction(addDataSource)} style={primaryButtonStyle}>
                Create Datasource
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedId) {
                    setError("Select a datasource from the list to edit it.");
                    return;
                  }

                  runAction((payload) => updateDataSource(selectedId, payload));
                }}
                style={secondaryButtonStyle}
              >
                Edit Datasource
              </button>
            </div>
          </div>
        </section>

        <section style={workspacePanelStyle}>
          <SectionTitle title="List Datasources" subtitle="Select a datasource to edit it, or enter a new one manually." />
          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              paddingRight: 6,
            }}
          >
            {dataSources.length > 0 ? (
              dataSources.map((item) => (
                <div
                  key={item.id}
                  style={{
                    position: "relative",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(item.id);
                      setEditor(createDataSourceEditorFromItem(item));
                      setError(null);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      borderRadius: 16,
                      border:
                        item.id === selectedId
                          ? "1px solid rgba(96, 165, 250, 0.5)"
                          : "1px solid rgba(71, 85, 105, 0.3)",
                      background:
                        item.id === selectedId
                          ? "rgba(30, 64, 175, 0.18)"
                          : "rgba(15, 23, 42, 0.65)",
                      padding: "12px 46px 12px 16px",
                      color: "#e2e8f0",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>{item.key}</div>
                    <div style={listItemMetaStyle}>{item.url}</div>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${item.key}`}
                    onClick={() => handleDelete(item.id)}
                    style={{
                      ...deleteIconButtonStyle,
                      position: "absolute",
                      top: "50%",
                      right: 12,
                      transform: "translateY(-50%)",
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: 14, height: 14 }}
                    >
                      <path d="M9 3.75h6a1 1 0 0 1 1 1V6H8V4.75a1 1 0 0 1 1-1Z" />
                      <path d="M4.75 6h14.5" />
                      <path d="M6.75 6.75 7.6 19a2 2 0 0 0 2 1.86h4.8a2 2 0 0 0 2-1.86l.85-12.25" />
                      <path d="M10 10.25v6.5" />
                      <path d="M14 10.25v6.5" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <div
                style={{
                  borderRadius: 16,
                  border: "1px dashed rgba(71, 85, 105, 0.45)",
                  padding: "18px 16px",
                  color: "#64748b",
                  textAlign: "center",
                }}
              >
                No datasources created yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function SecurityWorkspace() {
  const {
    selectedSecuritySubsection,
    selectSecuritySubsection,
    securityConfigs,
    addSecurityConfig,
    updateSecurityConfig,
    removeSecurityConfig,
  } = useFlowStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<SecurityEditorState>(() =>
    createSecurityEditorState(selectedSecuritySubsection),
  );
  const [error, setError] = useState<string | null>(null);
  const filteredConfigs = securityConfigs.filter(
    (item) => item.subsection === selectedSecuritySubsection,
  );
  const selectedItem = filteredConfigs.find((item) => item.id === selectedId) ?? null;

  const handleSubsectionChange = (section: SecuritySubsection) => {
    selectSecuritySubsection(section);
    setSelectedId(null);
    setEditor(createSecurityEditorState(section));
    setError(null);
  };

  const runAction = (
    action: (
      payload: Omit<CreatedSecurityConfig, "id">,
    ) => { ok: true } | { ok: false; reason: string },
  ) => {
    try {
      JSON.parse(editor.content);
    } catch {
      setError("Security config content must be valid JSON.");
      return;
    }

    const result = action({
      subsection: selectedSecuritySubsection,
      fileName: editor.fileName,
      content: editor.content,
    });

    if (!result.ok) {
      setError(result.reason);
      return;
    }

    setError(null);
  };

  const handleDelete = (configId: string) => {
    removeSecurityConfig(configId);

    if (selectedId === configId) {
      setSelectedId(null);
      setEditor(createSecurityEditorState(selectedSecuritySubsection));
      setError(null);
    }
  };

  return (
    <>
      <div style={workspaceGridStyle}>
        <section style={workspacePanelStyle}>
          <SectionTitle
            title={selectedItem ? "Edit Security Config" : "Create Security Config"}
            subtitle="Manage auth and authorize JSON files for security configuration."
          />
          <div
            style={{
              marginTop: 18,
              display: "grid",
              gap: 14,
              flex: 1,
              minHeight: 0,
              alignContent: "start",
              overflow: "auto",
              paddingRight: 6,
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {(["auth", "authorize"] as const).map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => handleSubsectionChange(section)}
                  style={{
                    ...securitySubsectionButtonStyle,
                    background:
                      selectedSecuritySubsection === section
                        ? "rgba(37, 99, 235, 0.2)"
                        : securitySubsectionButtonStyle.background,
                    border:
                      selectedSecuritySubsection === section
                        ? "1px solid rgba(96, 165, 250, 0.45)"
                        : securitySubsectionButtonStyle.border,
                    color:
                      selectedSecuritySubsection === section ? "#dbeafe" : "#cbd5e1",
                  }}
                >
                  {section}
                </button>
              ))}
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={fieldLabelStyle}>File</span>
              <input
                value={editor.fileName}
                onChange={(event) =>
                  setEditor((current) => ({ ...current, fileName: event.target.value }))
                }
                placeholder={selectedSecuritySubsection === "auth" ? "apikey.json" : "policy.json"}
                style={fieldStyle}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={fieldLabelStyle}>JSON Content</span>
              <textarea
                value={editor.content}
                onChange={(event) =>
                  setEditor((current) => ({ ...current, content: event.target.value }))
                }
                style={{ ...fieldStyle, minHeight: 220, resize: "vertical", fontFamily: "monospace" }}
              />
            </label>

            {error ? <p style={{ margin: 0, color: "#fca5a5", fontSize: 13 }}>{error}</p> : null}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button type="button" onClick={() => runAction(addSecurityConfig)} style={primaryButtonStyle}>
                Create Security Config
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedId) {
                    setError("Select a security config from the list to edit it.");
                    return;
                  }

                  runAction((payload) => updateSecurityConfig(selectedId, payload));
                }}
                style={secondaryButtonStyle}
              >
                Edit Security Config
              </button>
            </div>
          </div>
        </section>

        <section style={workspacePanelStyle}>
          <SectionTitle
            title="List Security Configs"
            subtitle="Auth and authorize files are grouped by subsection, like a config tree."
          />
          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              paddingRight: 6,
            }}
          >
            {(["auth", "authorize"] as const).map((section) => {
              const sectionItems = securityConfigs.filter((item) => item.subsection === section);

              return (
                <div key={section} style={{ display: "grid", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleSubsectionChange(section)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: selectedSecuritySubsection === section ? "#e2e8f0" : "#cbd5e1",
                      padding: 0,
                      textAlign: "left",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      textTransform: "lowercase",
                    }}
                  >
                    {section}
                  </button>
                  {sectionItems.length > 0 ? (
                    sectionItems.map((item) => (
                      <div key={item.id} style={{ position: "relative", marginLeft: 12 }}>
                        <button
                          type="button"
                          onClick={() => {
                            selectSecuritySubsection(item.subsection);
                            setSelectedId(item.id);
                            setEditor(createSecurityEditorFromItem(item));
                            setError(null);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            borderRadius: 16,
                            border:
                              item.id === selectedId
                                ? "1px solid rgba(96, 165, 250, 0.5)"
                                : "1px solid rgba(71, 85, 105, 0.3)",
                            background:
                              item.id === selectedId
                                ? "rgba(30, 64, 175, 0.18)"
                                : "rgba(15, 23, 42, 0.65)",
                            padding: "12px 46px 12px 16px",
                            color: "#e2e8f0",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>
                            {item.fileName}
                          </div>
                          <div style={listItemMetaStyle}>{item.subsection}</div>
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${item.fileName}`}
                          onClick={() => handleDelete(item.id)}
                          style={{
                            ...deleteIconButtonStyle,
                            position: "absolute",
                            top: "50%",
                            right: 12,
                            transform: "translateY(-50%)",
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ width: 14, height: 14 }}
                          >
                            <path d="M9 3.75h6a1 1 0 0 1 1 1V6H8V4.75a1 1 0 0 1 1-1Z" />
                            <path d="M4.75 6h14.5" />
                            <path d="M6.75 6.75 7.6 19a2 2 0 0 0 2 1.86h4.8a2 2 0 0 0 2-1.86l.85-12.25" />
                            <path d="M10 10.25v6.5" />
                            <path d="M14 10.25v6.5" />
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        marginLeft: 12,
                        borderRadius: 14,
                        border: "1px dashed rgba(71, 85, 105, 0.4)",
                        padding: "14px 16px",
                        color: "#64748b",
                        fontSize: 12,
                      }}
                    >
                      No {section} configs created yet.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  color: "#cbd5e1",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "#eff6ff",
  padding: "12px 16px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(96, 165, 250, 0.28)",
  borderRadius: 12,
  background: "rgba(30, 41, 59, 0.74)",
  color: "#dbeafe",
  padding: "12px 16px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const securitySubsectionButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(71, 85, 105, 0.4)",
  borderRadius: 12,
  background: "rgba(15, 23, 42, 0.58)",
  color: "#cbd5e1",
  padding: "10px 14px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  textTransform: "lowercase",
};

export default function ConfigurationWorkspace() {
  const { openSidebar, selectedConfigSection } = useFlowStore();
  const pageMeta = useMemo(
    () =>
      selectedConfigSection === "beans"
        ? {
            title: "Bean Configuration"
          }
        : selectedConfigSection === "datasources"
          ? {
            title: "Datasource Configuration"
          }
          : {
            title: "Security Configuration"
          },
    [selectedConfigSection],
  );

  return (
    <div style={pageStyle}>
      <section
        style={{
          ...panelStyle,
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#60a5fa", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Configuration Workspace
          </span>
          <h1 style={{ margin: 0, color: "#f8fafc", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>
            {pageMeta.title}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => openSidebar("components")}
          style={{
            ...secondaryButtonStyle,
            padding: "10px 14px",
            fontSize: 12,
          }}
        >
          Back To Builder
        </button>
      </section>

      {selectedConfigSection === "beans" ? (
        <BeansWorkspace />
      ) : selectedConfigSection === "datasources" ? (
        <DatasourcesWorkspace />
      ) : (
        <SecurityWorkspace />
      )}
    </div>
  );
}
