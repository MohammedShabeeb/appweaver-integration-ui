"use client";

import { useFlowStore } from "@/store/useFlowStore";
import { ConnectorIcon, nodeTypeMeta } from "./node-icons";

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

export default function ConfigPanel() {
  const { selectedNode, selectedEdge, updateNodeData, deleteEdge } =
    useFlowStore();

  if (!selectedNode && !selectedEdge) {
    return null;
  }

  if (selectedEdge) {
    return (
      <div style={panelStyle}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#e2e8f0", marginBottom: 12, fontSize: 14 }}>
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
      <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#e2e8f0", marginBottom: 12, fontSize: 14 }}>
        {nodeMeta ? <nodeMeta.Icon style={{ width: 16, height: 16, color: "#818cf8" }} /> : null}
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
            <span style={{ fontSize: 13, fontWeight: 500, color: "#cbd5e1", marginBottom: 4, display: "block" }}>
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
            Double-click this container on the canvas to open its nested workflow.
          </p>
        </div>
      )}
    </div>
  );
}
