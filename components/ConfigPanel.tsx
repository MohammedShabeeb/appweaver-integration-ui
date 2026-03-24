"use client";

import { useFlowStore } from "@/store/useFlowStore";
import { ConnectorIcon, SwitchIcon, nodeTypeMeta } from "./node-icons";

const panelStyle: React.CSSProperties = {
  position: "absolute",
  right: 16,
  top: 16,
  zIndex: 20,
  width: 288,
  borderRadius: 12,
  border: "1px solid rgba(71, 85, 105, 0.5)",
  background: "rgba(15, 23, 42, 0.95)",
  backdropFilter: "blur(16px)",
  padding: 16,
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 8,
  border: "1px solid rgba(71, 85, 105, 0.5)",
  background: "rgba(30, 41, 59, 0.8)",
  padding: "8px 12px",
  fontSize: 13,
  color: "#e2e8f0",
  fontFamily: "'Inter', sans-serif",
  outline: "none",
};

const deleteBtnStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 8,
  border: "none",
  background: "rgba(220, 38, 38, 0.7)",
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 500,
  color: "#fff",
  cursor: "pointer",
  fontFamily: "'Inter', sans-serif",
};

const addBtnStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 8,
  border: "1px dashed rgba(244, 114, 182, 0.4)",
  background: "rgba(244, 114, 182, 0.08)",
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 500,
  color: "#f9a8d4",
  cursor: "pointer",
  fontFamily: "'Inter', sans-serif",
};

const smallRemoveBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  borderRadius: 999,
  border: "1px solid rgba(248, 113, 113, 0.22)",
  background: "rgba(127, 29, 29, 0.8)",
  fontSize: 11,
  color: "#fecaca",
  cursor: "pointer",
  flexShrink: 0,
};

export default function ConfigPanel() {
  const {
    selectedNode,
    selectedEdge,
    updateNodeData,
    deleteEdge,
    addSwitchCase,
    removeSwitchCase,
    updateEdgeData,
  } = useFlowStore();

  if (!selectedNode && !selectedEdge) {
    return null;
  }

  // Condition edge selected — show condition label editor
  if (selectedEdge && selectedEdge.type === "condition") {
    const conditionLabel =
      (selectedEdge.data as { conditionLabel?: string } | undefined)
        ?.conditionLabel ?? "";

    return (
      <div style={panelStyle}>
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            color: "#e2e8f0",
            marginBottom: 12,
            fontSize: 14,
          }}
        >
          <SwitchIcon style={{ width: 16, height: 16, color: "#f472b6" }} />
          Condition
        </h2>
        <label>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#cbd5e1",
              marginBottom: 4,
              display: "block",
            }}
          >
            Condition label
          </span>
          <input
            value={conditionLabel}
            placeholder="e.g. status === 200"
            style={inputStyle}
            onChange={(e) =>
              updateEdgeData(selectedEdge.id, {
                conditionLabel: e.target.value,
              })
            }
          />
        </label>
        <p
          style={{
            fontSize: 11,
            color: "#64748b",
            marginTop: 8,
          }}
        >
          {selectedEdge.source} → {selectedEdge.target}
        </p>
        <button
          type="button"
          style={{ ...deleteBtnStyle, marginTop: 12 }}
          onClick={() => deleteEdge(selectedEdge.id)}
        >
          Delete connector
        </button>
      </div>
    );
  }

  // Regular edge selected
  if (selectedEdge) {
    return (
      <div style={panelStyle}>
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            color: "#e2e8f0",
            marginBottom: 12,
            fontSize: 14,
          }}
        >
          <ConnectorIcon style={{ width: 16, height: 16, color: "#818cf8" }} />
          Connector
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
          {selectedEdge.source} → {selectedEdge.target}
        </p>
        <button
          type="button"
          style={deleteBtnStyle}
          onClick={() => deleteEdge(selectedEdge.id)}
        >
          Delete connector
        </button>
      </div>
    );
  }

  if (!selectedNode) {
    return null;
  }

  const type = selectedNode.type;
  const nodeMeta =
    type && type in nodeTypeMeta
      ? nodeTypeMeta[type as keyof typeof nodeTypeMeta]
      : null;

  return (
    <div style={panelStyle}>
      <h2
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontWeight: 700,
          color: "#e2e8f0",
          marginBottom: 12,
          fontSize: 14,
        }}
      >
        {nodeMeta ? (
          <nodeMeta.Icon style={{ width: 16, height: 16, color: "#818cf8" }} />
        ) : null}
        {nodeMeta ? nodeMeta.label : type} Config
      </h2>

      {type === "http" && (
        <input
          placeholder="URL"
          style={inputStyle}
          onChange={(e) =>
            updateNodeData(selectedNode.id, {
              config: { url: e.target.value },
            })
          }
        />
      )}

      {type === "delay" && (
        <input
          type="number"
          placeholder="Milliseconds"
          style={inputStyle}
          onChange={(e) =>
            updateNodeData(selectedNode.id, {
              config: { ms: Number(e.target.value) },
            })
          }
        />
      )}

      {type === "container" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#cbd5e1",
                marginBottom: 4,
                display: "block",
              }}
            >
              Container name
            </span>
            <input
              value={selectedNode.data.label || ""}
              placeholder="Container name"
              style={inputStyle}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  label: e.target.value,
                })
              }
            />
          </label>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>
            Double-click this container on the canvas to open its nested
            workflow.
          </p>
        </div>
      )}

      {type === "switch" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#cbd5e1",
                marginBottom: 4,
                display: "block",
              }}
            >
              Switch name
            </span>
            <input
              value={selectedNode.data.label || ""}
              placeholder="Switch"
              style={inputStyle}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  label: e.target.value,
                })
              }
            />
          </label>

          <div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#cbd5e1",
                marginBottom: 8,
                display: "block",
              }}
            >
              Cases
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(
                (
                  selectedNode.data.config as {
                    cases?: { label: string }[];
                  }
                )?.cases ?? []
              ).map((c: { label: string }, index: number) => (
                <div
                  key={index}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#f472b6",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: "#cbd5e1",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {c.label}
                  </span>
                  {index > 0 && (
                    <button
                      type="button"
                      style={smallRemoveBtnStyle}
                      onClick={() =>
                        removeSwitchCase(selectedNode.id, index)
                      }
                      title="Remove case"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            style={addBtnStyle}
            onClick={() => addSwitchCase(selectedNode.id)}
          >
            + Add Case
          </button>

          <p style={{ fontSize: 11, color: "#64748b" }}>
            Connect each case handle to a target block. Select a condition
            connector to edit its label.
          </p>
        </div>
      )}

      {type === "custom" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#cbd5e1",
                marginBottom: 4,
                display: "block",
              }}
            >
              Component name
            </span>
            <input
              value={selectedNode.data.label || ""}
              placeholder="Component name"
              style={inputStyle}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  label: e.target.value,
                })
              }
            />
          </label>
          <label>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#cbd5e1",
                marginBottom: 4,
                display: "block",
              }}
            >
              Description
            </span>
            <input
              value={String(selectedNode.data.description || "")}
              placeholder="Short description"
              style={inputStyle}
              onChange={(e) =>
                updateNodeData(selectedNode.id, {
                  description: e.target.value,
                })
              }
            />
          </label>
        </div>
      )}
    </div>
  );
}

