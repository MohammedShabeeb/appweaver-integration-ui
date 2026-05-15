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

const fieldHintStyle: React.CSSProperties = {
  marginBottom: 8,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  borderRadius: 999,
  border: "1px solid rgba(var(--workflow-accent-rgb), 0.18)",
  background: "var(--workflow-accent-soft)",
  padding: "4px 8px",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.02em",
  color: "var(--workflow-accent)",
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
  const selectedClazzValue = String(config.clazz ?? "java.util.Map");
  const selectedClazzOption =
    JAVA_CLASS_OPTIONS.find((option) => option.value === selectedClazzValue) ?? JAVA_CLASS_OPTIONS[0];
  const selectedUnmarshalType = String(config.name ?? "json");
  const panelDescription = customComponent
    ? customComponent.description || "Configure this custom component from its template fields."
    :
    type === "marshal"
      ? "Convert the body into JSON using the selected Java class."
      : type === "setBody"
        ? "Set the exchange body from an expression or constant data."
      : type === "setHeader"
        ? "Set an exchange header from an expression or constant value."
        : type === "validate"
          ? "Validate the JSON payload with backend validation rules."
        : type === "unmarshal"
          ? "Read JSON, CSV, or XML payloads into the exchange body."
        : type === "log"
          ? "Write a message through the backend LogHandler."
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
              <span style={labelStyle}>Data format library</span>
              <input
                value={String(config.library ?? "Jackson")}
                placeholder="Jackson"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { library: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Example: `Jackson`.</p>
            </label>
            <label>
              <span style={labelStyle}>Target class</span>
              <div style={fieldHintStyle}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: 12, height: 12 }}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
                Select from dropdown
              </div>
              <p style={{ ...helperTextStyle, marginTop: 0, marginBottom: 8 }}>
                Current selection: <strong>{selectedClazzOption.label}</strong>
                {" · "}
                <span style={{ color: "#475569" }}>{selectedClazzOption.value}</span>
              </p>
              <div style={selectWrapStyle}>
                <select
                  value={selectedClazzValue}
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
                Pick the Java class for the `clazz` attribute. The shorter label is shown first,
                followed by the full class name.
              </p>
              <p style={{ ...helperTextStyle, marginTop: 2 }}>
                {selectedClazzOption.hint}
              </p>
            </label>
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
              <p style={helperTextStyle}>
                This value is saved as the `ref` attribute, for example
                `multiChatProcessor`.
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
