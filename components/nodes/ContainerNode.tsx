import { Handle, Position } from "reactflow";
import { ContainerIcon } from "../node-icons";
import { useFlowStore } from "@/store/useFlowStore";

const borderDefault = "1px solid rgba(192, 132, 252, 0.25)";
const borderSelected = "1px solid rgba(192, 132, 252, 0.5)";
const accentBorder = "3px solid #c084fc";

const baseStyle: React.CSSProperties = {
  position: "relative",
  borderRadius: 10,
  padding: "12px 16px",
  background: "rgba(30, 41, 59, 0.85)",
  borderTop: borderDefault,
  borderRight: borderDefault,
  borderBottom: borderDefault,
  borderLeft: accentBorder,
  color: "#e2e8f0",
  fontFamily: "'Inter', sans-serif",
  minWidth: 160,
  backdropFilter: "blur(8px)",
  transition: "box-shadow 0.2s, border-color 0.2s",
};

const selectedStyle: React.CSSProperties = {
  ...baseStyle,
  borderTop: borderSelected,
  borderRight: borderSelected,
  borderBottom: borderSelected,
  borderLeft: accentBorder,
  boxShadow: "0 0 16px rgba(192, 132, 252, 0.15), 0 4px 12px rgba(0,0,0,0.2)",
};

const deleteBtnStyle: React.CSSProperties = {
  position: "absolute",
  right: -8,
  top: -8,
  zIndex: 10,
  display: "flex",
  height: 20,
  width: 20,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  borderTop: "none",
  borderRight: "none",
  borderBottom: "none",
  borderLeft: "none",
  background: "rgba(239, 68, 68, 0.85)",
  fontSize: 10,
  fontWeight: 700,
  color: "#fff",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
};

export default function ContainerNode({
  id,
  data,
  selected,
}: {
  id: string;
  data: { label?: string };
  selected?: boolean;
}) {
  const deleteNode = useFlowStore((state) => state.deleteNode);

  return (
    <div style={selected ? selectedStyle : baseStyle}>
      {selected ? (
        <button
          type="button"
          style={deleteBtnStyle}
          onClick={(event) => {
            event.stopPropagation();
            deleteNode(id);
          }}
        >
          ×
        </button>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ContainerIcon style={{ width: 15, height: 15, color: "#c084fc" }} />
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>{data?.label || "Container"}</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: "#64748b" }}>
        Double-click to open nested canvas
      </div>

      <Handle id="target-top" type="target" position={Position.Top} className="flow-handle" />
      <Handle id="target-left" type="target" position={Position.Left} className="flow-handle" />
      <Handle id="source-bottom" type="source" position={Position.Bottom} className="flow-handle" />
      <Handle id="source-right" type="source" position={Position.Right} className="flow-handle" />
    </div>
  );
}
