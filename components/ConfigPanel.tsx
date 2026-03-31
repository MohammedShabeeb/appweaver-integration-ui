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
  fontFamily: "'Inter', sans-serif",
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
  border: "1px solid rgba(37, 99, 235, 0.18)",
  background: "rgba(239, 246, 255, 1)",
  padding: "4px 8px",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.02em",
  color: "#2563eb",
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
  fontFamily: "'Inter', sans-serif",
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
  border: "1px solid rgba(37, 99, 235, 0.28)",
  background: "#ffffff",
  boxShadow: "inset 0 0 0 1px rgba(37, 99, 235, 0.06), 0 0 0 1px rgba(37, 99, 235, 0.04)",
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
  color: "#2563eb",
  width: 26,
  height: 26,
  padding: 5,
  borderRadius: 999,
  background: "rgba(239, 246, 255, 1)",
  border: "1px solid rgba(37, 99, 235, 0.14)",
};

export default function ConfigPanel() {
  const { selectedNode, selectedEdge, updateNodeData, deleteEdge, deleteNode } = useFlowStore();

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
          <ConnectorIcon style={{ width: 16, height: 16, color: "#2563eb" }} />
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

  if (type === "start") {
    return null;
  }

  const nodeMeta = nodeTypeMeta[type as keyof typeof nodeTypeMeta];
  const config = (selectedNode.data.config as Record<string, unknown> | undefined) ?? {};
  const selectedClazzValue = String(config.clazz ?? "java.util.Map");
  const selectedClazzOption =
    JAVA_CLASS_OPTIONS.find((option) => option.value === selectedClazzValue) ?? JAVA_CLASS_OPTIONS[0];
  const panelDescription =
    type === "marshal"
      ? "Convert the body into JSON using the selected Java class."
      : type === "unmarshal"
        ? "Read incoming JSON into the selected Java class."
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
        {nodeMeta ? <nodeMeta.Icon style={{ width: 16, height: 16, color: "#2563eb" }} /> : null}
        {nodeMeta ? nodeMeta.label : type} Config
      </h2>

      <p style={{ ...helperTextStyle, marginTop: -4, marginBottom: 14 }}>{panelDescription}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          <span style={labelStyle}>Display label</span>
          <input
            value={selectedNode.data.label || ""}
            placeholder={nodeMeta?.label || "Component"}
            style={inputStyle}
            onChange={(event) =>
              updateNodeData(selectedNode.id, {
                label: event.target.value,
              })
            }
          />
          <p style={helperTextStyle}>This is the name shown on the node card in the canvas.</p>
        </label>

        {(type === "marshal" || type === "unmarshal") && (
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

        <button type="button" style={deleteBtnStyle} onClick={() => deleteNode(selectedNode.id)}>
          Delete component
        </button>
      </div>
    </div>
  );
}
