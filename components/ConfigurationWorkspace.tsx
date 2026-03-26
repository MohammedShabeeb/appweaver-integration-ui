"use client";

import { useMemo, useState } from "react";

import { useFlowStore, type CreatedBean, type CreatedDataSource } from "@/store/useFlowStore";

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

function createBeanEditorState(): BeanEditorState {
  return {
    name: "",
    className: "",
    constructorArgs: [""],
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
        : [""],
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

const pageStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 24,
  padding: "28px 28px 32px",
  overflow: "auto",
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

function parseConstructorArgValue(value: string): unknown {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (
    trimmed === "true" ||
    trimmed === "false" ||
    trimmed === "null" ||
    /^-?\d+(\.\d+)?$/.test(trimmed) ||
    ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"')))
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
    return value.length > 0 ? value : [""];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.length > 0
          ? parsed.map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
          : [""];
      }
    } catch {
      return value.trim().length > 0 ? [value] : [""];
    }

    return value.trim().length > 0 ? [value] : [""];
  }

  return [""];
}

function ActionBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        borderRadius: 999,
        border: "1px solid rgba(96, 165, 250, 0.22)",
        background: "rgba(30, 41, 59, 0.7)",
        padding: "8px 12px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "#cbd5e1",
      }}
    >
      {label}
    </span>
  );
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

  const handleDelete = () => {
    if (!selectedBeanId) {
      setError("Select a bean from the list to delete it.");
      return;
    }

    removeBean(selectedBeanId);
    setSelectedBeanId(null);
    setEditor(createBeanEditorState());
    setError(null);
  };

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <ActionBadge label="Create Bean" />
        <ActionBadge label="Edit Bean" />
        <ActionBadge label="Delete Bean" />
        <ActionBadge label="List Beans" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 340px) minmax(0, 1fr)",
          gap: 20,
        }}
      >
        <section style={{ ...panelStyle, padding: 20 }}>
          <SectionTitle
            title="List Beans"
            subtitle="Select an existing bean to edit it, or enter a new bean manually."
          />
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            {beans.length > 0 ? (
              beans.map((bean) => (
                <button
                  key={bean.id}
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
                    padding: "14px 16px",
                    color: "#e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>{bean.name}</div>
                  <div style={listItemMetaStyle}>{bean.className}</div>
                </button>
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

        <section style={{ ...panelStyle, padding: 20 }}>
          <SectionTitle
            title={selectedBean ? "Edit Bean" : "Create Bean"}
            subtitle="Enter bean values manually, then save a new bean or update the selected one."
          />
          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
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
                  <div key={`${index}-${arg}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                      style={iconButtonStyle}
                    >
                      -
                    </button>
                  </div>
                ))}
              </div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 12, lineHeight: 1.55 }}>
                Enter plain text for string arguments. If an argument looks like valid JSON such as
                `123`, `true`, `{}` or `[]`, it will be converted before saving.
              </p>
            </div>

            {error ? <p style={{ margin: 0, color: "#fca5a5", fontSize: 13 }}>{error}</p> : null}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button type="button" onClick={handleCreate} style={primaryButtonStyle}>
                Create Bean
              </button>
              <button type="button" onClick={handleUpdate} style={secondaryButtonStyle}>
                Edit Bean
              </button>
              <button type="button" onClick={handleDelete} style={dangerButtonStyle}>
                Delete Bean
              </button>
            </div>
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

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <ActionBadge label="Create Datasource" />
        <ActionBadge label="Edit Datasource" />
        <ActionBadge label="Delete Datasource" />
        <ActionBadge label="List Datasources" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 340px) minmax(0, 1fr)",
          gap: 20,
        }}
      >
        <section style={{ ...panelStyle, padding: 20 }}>
          <SectionTitle title="List Datasources" subtitle="Select a datasource to edit it, or enter a new one manually." />
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            {dataSources.length > 0 ? (
              dataSources.map((item) => (
                <button
                  key={item.id}
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
                    padding: "14px 16px",
                    color: "#e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>{item.key}</div>
                  <div style={listItemMetaStyle}>{item.url}</div>
                </button>
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

        <section style={{ ...panelStyle, padding: 20 }}>
          <SectionTitle
            title={selectedItem ? "Edit Datasource" : "Create Datasource"}
            subtitle="Create and manage datasource definitions outside the workflow canvas."
          />
          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
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
              <button
                type="button"
                onClick={() => {
                  if (!selectedId) {
                    setError("Select a datasource from the list to delete it.");
                    return;
                  }

                  removeDataSource(selectedId);
                  setSelectedId(null);
                  setEditor(createDataSourceEditorState());
                  setError(null);
                }}
                style={dangerButtonStyle}
              >
                Delete Datasource
              </button>
            </div>
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

const dangerButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.25)",
  borderRadius: 12,
  background: "rgba(127, 29, 29, 0.78)",
  color: "#fee2e2",
  padding: "12px 16px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

export default function ConfigurationWorkspace() {
  const { openSidebar, selectedConfigSection } = useFlowStore();
  const pageMeta = useMemo(
    () =>
      selectedConfigSection === "beans"
        ? {
            title: "Bean Configuration",
            subtitle:
              "Beans now open in their own workspace so configuration work stays separate from the route canvas.",
          }
        : {
            title: "Datasource Configuration",
            subtitle:
              "Datasource definitions now live in their own workspace instead of sharing the workflow canvas.",
          },
    [selectedConfigSection],
  );

  return (
    <div style={pageStyle}>
      <section
        style={{
          ...panelStyle,
          padding: 24,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <span style={{ color: "#60a5fa", fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Configuration Workspace
          </span>
          <h1 style={{ margin: 0, color: "#f8fafc", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
            {pageMeta.title}
          </h1>
          <p style={{ margin: 0, maxWidth: 760, color: "#94a3b8", fontSize: 15, lineHeight: 1.7 }}>
            {pageMeta.subtitle}
          </p>
        </div>
        <button type="button" onClick={() => openSidebar("components")} style={secondaryButtonStyle}>
          Back To Builder
        </button>
      </section>

      {selectedConfigSection === "beans" ? <BeansWorkspace /> : <DatasourcesWorkspace />}
    </div>
  );
}
