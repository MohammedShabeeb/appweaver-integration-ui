"use client";

import { useFlowStore } from "@/store/useFlowStore";
import { ConnectorIcon, nodeTypeMeta } from "./node-icons";

const JAVA_CLASS_OPTIONS = [
  { label: "Map", value: "java.util.Map", hint: "Generic key-value JSON object" },
  { label: "String", value: "java.lang.String", hint: "Plain text payload" },
  {
    label: "JsonNode",
    value: "com.fasterxml.jackson.databind.JsonNode",
    hint: "Jackson tree model",
  },
  { label: "List", value: "java.util.List", hint: "Ordered JSON array" },
] as const;

const LOG_LEVEL_OPTIONS = ["DEBUG", "INFO", "WARN", "ERROR"] as const;
const MARSHAL_TYPE_OPTIONS = [{ label: "JSON", value: "json" }] as const;
const TRANSFORM_TYPE_OPTIONS = [
  { label: "Simple expression", value: "simple" },
  { label: "JSON mapper", value: "mapper" },
] as const;
const PROCESS_MODE_OPTIONS = [
  { label: "Bean reference", value: "ref" },
  { label: "Processor class", value: "clazz" },
] as const;
const UNMARSHAL_TYPE_OPTIONS = [
  { label: "JSON", value: "json" },
  { label: "CSV", value: "csv" },
  { label: "XML", value: "xml" },
] as const;
const UNMARSHAL_LIBRARY_OPTIONS = [
  { label: "Jackson", value: "Jackson" },
  { label: "Custom ObjectMapper", value: "custom" },
  { label: "Default", value: "" },
] as const;

const panelStyle: React.CSSProperties = {
  position: "absolute",
  right: 16,
  top: 16,
  zIndex: 20,
  width: 288,
  maxHeight: "calc(100vh - 32px)",
  overflowY: "auto",
  borderRadius: 16,
  border: "1px solid rgba(226, 232, 240, 0.95)",
  background: "rgba(255, 255, 255, 0.96)",
  backdropFilter: "blur(16px)",
  padding: 16,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid rgba(203, 213, 225, 0.95)",
  background: "#ffffff",
  padding: "8px 12px",
  fontSize: 13,
  color: "#0f172a",
  fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
  outline: "none",
};

const helperTextStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 11,
  lineHeight: 1.45,
  color: "#64748b",
};

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  borderRadius: 10,
  border: "1px solid rgba(226, 232, 240, 0.95)",
  background: "rgba(248, 250, 252, 0.96)",
  padding: 12,
};

const compactSectionStyle: React.CSSProperties = {
  ...sectionStyle,
  gap: 10,
  padding: 10,
};

const deleteBtnStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 8,
  border: "none",
  background: "#dc2626",
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 500,
  color: "#fff",
  cursor: "pointer",
  fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 4,
  display: "block",
};

const selectWrapStyle: React.CSSProperties = {
  position: "relative",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  paddingRight: 42,
  cursor: "pointer",
  minHeight: 44,
  border: "1px solid rgba(var(--workflow-accent-rgb), 0.28)",
  background: "#ffffff",
  boxShadow: "inset 0 0 0 1px rgba(var(--workflow-accent-rgb), 0.06), 0 0 0 1px rgba(var(--workflow-accent-rgb), 0.04)",
  fontWeight: 600,
};

const optionStyle: React.CSSProperties = {
  background: "#ffffff",
  color: "#0f172a",
};

const selectIconStyle: React.CSSProperties = {
  position: "absolute",
  right: 10,
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  color: "var(--workflow-accent)",
  width: 26,
  height: 26,
  padding: 5,
  borderRadius: 999,
  background: "var(--workflow-accent-soft)",
  border: "1px solid rgba(var(--workflow-accent-rgb), 0.14)",
};

function getProperties(config: Record<string, unknown>) {
  const properties = config.properties;
  return properties && typeof properties === "object" && !Array.isArray(properties)
    ? (properties as Record<string, unknown>)
    : {};
}

function getCustomFieldValue(config: Record<string, unknown>, field: { key: string; target?: string }) {
  return field.target === "properties" ? getProperties(config)[field.key] : config[field.key];
}

function buildCustomFieldUpdate(
  config: Record<string, unknown>,
  field: { key: string; target?: string },
  value: unknown,
) {
  if (field.target !== "properties") {
    return { [field.key]: value };
  }

  return {
    properties: {
      ...getProperties(config),
      [field.key]: value,
    },
  };
}

function parseSetBodyDataValue(value: string): unknown {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function parseOptionalJsonValue(value: string): unknown {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function getDelimiterValue(value: string) {
  return value ? value.slice(0, 1) : undefined;
}

function parseValidationRules(value: string) {
  const parsed = JSON.parse(value) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Validation rules must be a JSON array.");
  }

  return parsed
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    .map((item) => ({
      expression: String(item.expression ?? ""),
      ...(typeof item.errorMessage === "string" && item.errorMessage.trim()
        ? { errorMessage: item.errorMessage }
        : {}),
    }))
    .filter((item) => item.expression.trim());
}

function parseTransformMapper(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return {};
  }

  const parsed = JSON.parse(trimmed) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Transform mapper must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

function parseParameters(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return {};
  }

  const parsed = JSON.parse(trimmed) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Parameters must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

export default function ConfigPanel() {
  const { selectedNode, selectedEdge, updateNodeData, deleteEdge, deleteNode, customComponents } = useFlowStore();

  if (!selectedNode && !selectedEdge) {
    return null;
  }

  if (selectedEdge) {
    return (
      <div style={panelStyle}>
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 12,
            fontSize: 14,
          }}
        >
          <ConnectorIcon style={{ width: 16, height: 16, color: "var(--workflow-accent)" }} />
          Connector
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          {selectedEdge.source} to {selectedEdge.target}
        </p>
        <button type="button" style={deleteBtnStyle} onClick={() => deleteEdge(selectedEdge.id)}>
          Delete connector
        </button>
      </div>
    );
  }

  if (!selectedNode) {
    return null;
  }

  const type = selectedNode.type;
  const componentKey = selectedNode.data.componentKey ?? type ?? "";
  const customComponent = customComponents.find((component) => component.type === componentKey) ?? null;

  if (type === "start") {
    return null;
  }

  const nodeMeta = nodeTypeMeta[type as keyof typeof nodeTypeMeta] ?? nodeTypeMeta.process;
  const config = (selectedNode.data.config as Record<string, unknown> | undefined) ?? {};
  const selectedUnmarshalType = String(config.name ?? "json");
  const selectedTransformType = String(config.name ?? "simple");
  const selectedProcessMode = typeof config.clazz === "string" && config.clazz.trim() ? "clazz" : "ref";
  const panelDescription = customComponent
    ? customComponent.description || "Configure this custom component from its template fields."
    :
    type === "marshal"
      ? "Write the exchange body into the selected data format."
      : type === "setBody"
        ? "Set the exchange body from an expression or constant data."
      : type === "setHeader"
        ? "Set an exchange header from an expression or constant value."
        : type === "setProperty"
          ? "Set an exchange property from an expression or constant value."
        : type === "setContext"
          ? "Set a shared context value from an expression or constant."
        : type === "convertBodyTo"
          ? "Convert the exchange body to a target Java class."
        : type === "transform"
          ? "Transform the exchange body with a simple expression or JSON mapper."
        : type === "validate"
          ? "Validate the JSON payload with backend validation rules."
        : type === "unmarshal"
          ? "Read JSON, CSV, or XML payloads into the exchange body."
        : type === "log"
          ? "Write a message through the backend LogHandler."
        : type === "delay"
          ? "Pause route processing with a constant or simple expression."
          : "Run a processor bean by its Spring or Camel reference name.";

  return (
    <div style={panelStyle}>
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 12,
            fontSize: 14,
          }}
        >
        {nodeMeta ? <nodeMeta.Icon style={{ width: 16, height: 16, color: "var(--workflow-accent)" }} /> : null}
        {customComponent ? customComponent.label : nodeMeta ? nodeMeta.label : type} Config
      </h2>

      <p style={{ ...helperTextStyle, marginTop: -4, marginBottom: 14 }}>{panelDescription}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={sectionStyle}>
          <label
            style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}
          >
            <input
              type="checkbox"
              checked={config.disabled !== true}
              onChange={(event) =>
                updateNodeData(selectedNode.id, {
                  config: { disabled: !event.target.checked },
                })
              }
            />
            <span style={{ fontWeight: 700 }}>Enabled in direct route</span>
          </label>
          <p style={helperTextStyle}>
            Disabled components stay on the canvas but are ignored when creating or exporting the backend direct route.
          </p>
        </div>

        {type === "marshal" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Data format</span>
              <div style={selectWrapStyle}>
                <select
                  value={String(config.name ?? "json")}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { name: event.target.value },
                    })
                  }
                >
                  {MARSHAL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={optionStyle}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={selectIconStyle}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <p style={helperTextStyle}>Saved as `name`. The backend currently handles `json` with `camelJackson`.</p>
            </label>
            <label
              style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}
            >
              <input
                type="checkbox"
                checked={Boolean(config.useList)}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { useList: event.target.checked },
                  })
                }
              />
              <span style={{ fontWeight: 700 }}>Marshal list payloads</span>
            </label>
            <p style={helperTextStyle}>Saved as `useList` for the backend `MarshallStep`.</p>
          </div>
        )}

        {type === "unmarshal" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Payload type</span>
              <div style={selectWrapStyle}>
                <select
                  value={String(config.name ?? "json")}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { name: event.target.value },
                    })
                  }
                >
                  {UNMARSHAL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={optionStyle}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={selectIconStyle}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <p style={helperTextStyle}>Saved as `name`: `json`, `csv`, or `xml`.</p>
            </label>

            {selectedUnmarshalType === "json" ? (
              <>
                <label>
                  <span style={labelStyle}>JSON library</span>
                  <div style={selectWrapStyle}>
                    <select
                      value={String(config.library ?? "Jackson")}
                      style={selectStyle}
                      onChange={(event) =>
                        updateNodeData(selectedNode.id, {
                          config: { library: event.target.value },
                        })
                      }
                    >
                      {UNMARSHAL_LIBRARY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} style={optionStyle}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={selectIconStyle}
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                  <p style={helperTextStyle}>Used when payload type is `json`.</p>
                </label>

                <label>
                  <span style={labelStyle}>Target class</span>
                  <div style={selectWrapStyle}>
                    <select
                      value={String(config.clazz ?? "java.util.Map")}
                      style={selectStyle}
                      onChange={(event) =>
                        updateNodeData(selectedNode.id, {
                          config: { clazz: event.target.value },
                        })
                      }
                    >
                      {JAVA_CLASS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} style={optionStyle}>
                          {option.label} - {option.value}
                        </option>
                      ))}
                    </select>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={selectIconStyle}
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                  <p style={helperTextStyle}>Saved as `clazz` for JSON unmarshalling.</p>
                </label>

                <label
                  style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(config.useList)}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, {
                        config: { useList: event.target.checked },
                      })
                    }
                  />
                  <span style={{ fontWeight: 700 }}>Use list for JSON payloads</span>
                </label>
              </>
            ) : null}

            {selectedUnmarshalType === "csv" ? (
              <>
                <label>
                  <span style={labelStyle}>CSV delimiter</span>
                  <input
                    value={String(config.delimiter ?? ",")}
                    placeholder=","
                    maxLength={1}
                    style={inputStyle}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, {
                        config: { delimiter: getDelimiterValue(event.target.value) },
                      })
                    }
                  />
                  <p style={helperTextStyle}>Saved as a single-character `delimiter` for CSV payloads.</p>
                </label>

                <label
                  style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(config.skipHeader)}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, {
                        config: { skipHeader: event.target.checked },
                      })
                    }
                  />
                  <span style={{ fontWeight: 700 }}>Skip CSV header row</span>
                </label>

                <label
                  style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(config.useMap)}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, {
                        config: { useMap: event.target.checked },
                      })
                    }
                  />
                  <span style={{ fontWeight: 700 }}>Use CSV maps</span>
                </label>
              </>
            ) : null}
          </div>
        )}

        {type === "setBody" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Name</span>
              <input
                value={String(config.name ?? "")}
                placeholder="setBody"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { name: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `name` for the backend SetBody step.</p>
            </label>
            <label>
              <span style={labelStyle}>Expression</span>
              <textarea
                value={String(config.expression ?? "")}
                placeholder="${body}"
                style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { expression: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>
                Saved as `expression`. Values containing <code>{"${...}"}</code> or <code>#</code> are evaluated as
                Camel simple expressions.
              </p>
            </label>
            <label>
              <span style={labelStyle}>Data</span>
              <textarea
                value={
                  config.data === undefined
                    ? ""
                    : typeof config.data === "string"
                      ? config.data
                      : JSON.stringify(config.data, null, 2)
                }
                placeholder='{"status":"ok"}'
                style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { data: parseSetBodyDataValue(event.target.value) },
                  })
                }
              />
              <p style={helperTextStyle}>
                Optional constant body. When provided, the backend uses `data` before `expression`.
              </p>
            </label>
          </div>
        )}

        {type === "setHeader" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Header name</span>
              <input
                value={String(config.name ?? "")}
                placeholder="Content-Type"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { name: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `name`, for example `Content-Type`.</p>
            </label>
            <label>
              <span style={labelStyle}>Expression</span>
              <textarea
                value={String(config.expression ?? "")}
                placeholder="application/json"
                style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { expression: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>
                Saved as `expression`. Values containing <code>{"${...}"}</code> or <code>#</code> are evaluated as
                Camel simple expressions; other values are constants.
              </p>
            </label>
          </div>
        )}

        {type === "setProperty" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Property name</span>
              <input
                value={String(config.name ?? "")}
                placeholder="propertyName"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { name: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `name`, for example `originalBody`.</p>
            </label>
            <label>
              <span style={labelStyle}>Expression</span>
              <textarea
                value={String(config.expression ?? "")}
                placeholder="${body}"
                style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { expression: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>
                Saved as `expression`. Values containing <code>{"${...}"}</code> or <code>#</code> are evaluated as
                Camel simple expressions; other values are constants.
              </p>
            </label>
          </div>
        )}

        {type === "setContext" && (
          <div style={compactSectionStyle}>
            <label>
              <span style={labelStyle}>Context name</span>
              <input
                value={String(config.name ?? "")}
                placeholder="contextKey"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { name: event.target.value },
                  })
                }
              />
            </label>
            <label>
              <span style={labelStyle}>Expression</span>
              <textarea
                value={String(config.expression ?? "")}
                placeholder="${body.customerId}"
                style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { expression: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Use <code>{"${...}"}</code> or <code>#</code> for Camel simple expressions.</p>
            </label>
            <label>
              <span style={labelStyle}>Constant value</span>
              <textarea
                value={
                  config.value === undefined
                    ? ""
                    : typeof config.value === "string"
                      ? config.value
                      : JSON.stringify(config.value, null, 2)
                }
                placeholder='{"tenant":"default"}'
                style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { value: parseOptionalJsonValue(event.target.value) },
                  })
                }
              />
              <p style={helperTextStyle}>Used when expression is blank or constant text.</p>
            </label>
          </div>
        )}

        {type === "convertBodyTo" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Target class</span>
              <div style={selectWrapStyle}>
                <select
                  value={String(config.clazz ?? "java.lang.String")}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { clazz: event.target.value },
                    })
                  }
                >
                  {JAVA_CLASS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={optionStyle}>
                      {option.label} - {option.value}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={selectIconStyle}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <p style={helperTextStyle}>
                Saved as `clazz`; the backend resolves it with `Class.forName` before calling `convertBodyTo`.
              </p>
            </label>
          </div>
        )}

        {type === "transform" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Transform type</span>
              <div style={selectWrapStyle}>
                <select
                  value={selectedTransformType}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { name: event.target.value },
                    })
                  }
                >
                  {TRANSFORM_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={optionStyle}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={selectIconStyle}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <p style={helperTextStyle}>Saved as `name`: `simple` or `mapper`.</p>
            </label>

            {selectedTransformType === "simple" ? (
              <label>
                <span style={labelStyle}>Expression</span>
                <textarea
                  value={String(config.expression ?? "")}
                  placeholder="${body}"
                  style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { expression: event.target.value },
                    })
                  }
                />
                <p style={helperTextStyle}>Saved as `expression` and passed to Camel `transform().simple(...)`.</p>
              </label>
            ) : null}

            {selectedTransformType === "mapper" ? (
              <label>
                <span style={labelStyle}>Mapper JSON</span>
                <textarea
                  key={`${selectedNode.id}-transform-mapper`}
                  defaultValue={JSON.stringify(
                    config.mapper && typeof config.mapper === "object" && !Array.isArray(config.mapper)
                      ? config.mapper
                      : {},
                    null,
                    2,
                  )}
                  placeholder='{"targetField":"$.sourceField"}'
                  style={{ ...inputStyle, minHeight: 150, resize: "vertical", fontFamily: "monospace" }}
                  onBlur={(event) => {
                    try {
                      updateNodeData(selectedNode.id, {
                        config: { mapper: parseTransformMapper(event.target.value) },
                      });
                    } catch (issue) {
                      window.alert(issue instanceof Error ? issue.message : "Transform mapper must be valid JSON.");
                    }
                  }}
                />
                <p style={helperTextStyle}>Saved as `mapper` and passed into `JsonExpressionTransformer`.</p>
              </label>
            ) : null}
          </div>
        )}

        {type === "validate" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Validation status code</span>
              <input
                type="number"
                value={String(config.validationStatusCode ?? 400)}
                min={100}
                max={599}
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: {
                      validationStatusCode: Number.isFinite(Number(event.target.value))
                        ? Number(event.target.value)
                        : 400,
                    },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `validationStatusCode` and used when validation fails.</p>
            </label>
            <label>
              <span style={labelStyle}>Rules</span>
              <textarea
                key={`${selectedNode.id}-validation-rules`}
                defaultValue={JSON.stringify(
                  Array.isArray(config.rules)
                    ? config.rules
                    : [
                        {
                          expression: "body != null",
                          errorMessage: "Request body is required",
                        },
                      ],
                  null,
                  2,
                )}
                placeholder='[{"expression":"body != null","errorMessage":"Request body is required"}]'
                style={{ ...inputStyle, minHeight: 150, resize: "vertical", fontFamily: "monospace" }}
                onBlur={(event) => {
                  try {
                    updateNodeData(selectedNode.id, {
                      config: { rules: parseValidationRules(event.target.value) },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Validation rules must be valid JSON.");
                  }
                }}
              />
              <p style={helperTextStyle}>
                Saved as `rules`. Each rule needs an MVEL `expression`; `errorMessage` is optional.
              </p>
            </label>
          </div>
        )}

        {type === "process" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Processor mode</span>
              <div style={selectWrapStyle}>
                <select
                  value={selectedProcessMode}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config:
                        event.target.value === "clazz"
                          ? { clazz: String(config.clazz ?? ""), ref: "" }
                          : { ref: String(config.ref ?? "processorRef"), clazz: "" },
                    })
                  }
                >
                  {PROCESS_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={optionStyle}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={selectIconStyle}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </label>

            {selectedProcessMode === "ref" ? (
              <label>
                <span style={labelStyle}>Processor reference</span>
                <input
                  value={String(config.ref ?? "")}
                  placeholder="llmContextProcessor"
                  style={inputStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { ref: event.target.value },
                    })
                  }
                />
                <p style={helperTextStyle}>Saved as `ref` and executed through `route.bean(ref)`.</p>
              </label>
            ) : (
              <label>
                <span style={labelStyle}>Processor class</span>
                <input
                  value={String(config.clazz ?? "")}
                  placeholder="com.example.MyProcessor"
                  style={inputStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { clazz: event.target.value },
                    })
                  }
                />
                <p style={helperTextStyle}>Saved as `clazz` and instantiated by the backend.</p>
              </label>
            )}

            <label>
              <span style={labelStyle}>Parameters JSON</span>
              <textarea
                key={`${selectedNode.id}-process-parameters`}
                defaultValue={JSON.stringify(
                  config.parameters && typeof config.parameters === "object" && !Array.isArray(config.parameters)
                    ? config.parameters
                    : {},
                  null,
                  2,
                )}
                placeholder='{"tenant":"default"}'
                style={{ ...inputStyle, minHeight: 110, resize: "vertical", fontFamily: "monospace" }}
                onBlur={(event) => {
                  try {
                    updateNodeData(selectedNode.id, {
                      config: { parameters: parseParameters(event.target.value) },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Parameters must be valid JSON.");
                  }
                }}
              />
              <p style={helperTextStyle}>
                For `ref`, these become exchange properties. For `clazz`, they are constructor/config parameters.
              </p>
            </label>
          </div>
        )}

        {type === "log" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Message</span>
              <textarea
                value={String(config.message ?? "")}
                placeholder="Processing exchange ${body}"
                style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { message: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>
                Saved as `message`. Simple expressions such as <code>{"${body}"}</code> are evaluated by the backend.
              </p>
            </label>
            <label>
              <span style={labelStyle}>Logger name</span>
              <input
                value={String(config.name ?? "")}
                placeholder="DEFAULT or AUDIT"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { name: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>
                Saved as `name`. `AUDIT` uses the audit logging path in `LogHandler`.
              </p>
            </label>
            <label>
              <span style={labelStyle}>Log level</span>
              <div style={selectWrapStyle}>
                <select
                  value={String(config.logLevel ?? "INFO")}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { logLevel: event.target.value },
                    })
                  }
                >
                  {LOG_LEVEL_OPTIONS.map((level) => (
                    <option key={level} value={level} style={optionStyle}>
                      {level}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={selectIconStyle}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <p style={helperTextStyle}>Saved as `logLevel`. The backend defaults to `INFO` when omitted.</p>
            </label>
          </div>
        )}

        {type === "delay" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Delay expression</span>
              <textarea
                value={String(config.expression ?? "")}
                placeholder="1000"
                style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { expression: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>
                Saved as `expression`. Values containing <code>{"${...}"}</code> or <code>#</code> are evaluated as
                Camel simple expressions; other values are constants.
              </p>
            </label>
          </div>
        )}

        {customComponent ? (
          <div style={sectionStyle}>
            {customComponent.fields.map((field) => {
              const value = getCustomFieldValue(config, field);
              const helperText = field.helperText
                ? field.helperText
                : field.target === "properties"
                  ? `Saved as properties.${field.key}.`
                  : null;

              if (field.control === "checkbox") {
                return (
                  <label
                    key={field.key}
                    style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) =>
                        updateNodeData(selectedNode.id, {
                          config: buildCustomFieldUpdate(config, field, event.target.checked),
                        })
                      }
                    />
                    <span style={{ fontWeight: 700 }}>{field.label}</span>
                  </label>
                );
              }

              if (field.control === "select") {
                return (
                  <label key={field.key}>
                    <span style={labelStyle}>{field.label}</span>
                    <div style={selectWrapStyle}>
                      <select
                        value={String(value ?? field.options?.[0]?.value ?? "")}
                        style={selectStyle}
                        onChange={(event) =>
                          updateNodeData(selectedNode.id, {
                            config: buildCustomFieldUpdate(config, field, event.target.value),
                          })
                        }
                      >
                        {(field.options ?? []).map((option) => (
                          <option key={option.value} value={option.value} style={optionStyle}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={selectIconStyle}
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                    {helperText ? <p style={helperTextStyle}>{helperText}</p> : null}
                  </label>
                );
              }

              return (
                <label key={field.key}>
                  <span style={labelStyle}>{field.label}</span>
                  {field.control === "textarea" ? (
                    <textarea
                      value={String(value ?? "")}
                      placeholder={field.placeholder}
                      style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                      onChange={(event) =>
                        updateNodeData(selectedNode.id, {
                          config: buildCustomFieldUpdate(config, field, event.target.value),
                        })
                      }
                    />
                  ) : (
                    <input
                      value={String(value ?? "")}
                      placeholder={field.placeholder}
                      style={inputStyle}
                      onChange={(event) =>
                        updateNodeData(selectedNode.id, {
                          config: buildCustomFieldUpdate(config, field, event.target.value),
                        })
                      }
                    />
                  )}
                  {helperText ? <p style={helperTextStyle}>{helperText}</p> : null}
                </label>
              );
            })}
          </div>
        ) : null}

        <button type="button" style={deleteBtnStyle} onClick={() => deleteNode(selectedNode.id)}>
          Delete component
        </button>
      </div>
    </div>
  );
}
