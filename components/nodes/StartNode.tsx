import { Handle, Position } from "reactflow";
import { FromIcon } from "../node-icons";

const borderDefault = "1px solid rgba(52, 211, 153, 0.25)";
const borderSelected = "1px solid rgba(52, 211, 153, 0.5)";
const accentBorder = "3px solid #34d399";

const baseStyle: React.CSSProperties = {
  borderRadius: 10,
  padding: "10px 14px",
  background: "rgba(30, 41, 59, 0.85)",
  borderTop: borderDefault,
  borderRight: borderDefault,
  borderBottom: borderDefault,
  borderLeft: accentBorder,
  color: "#e2e8f0",
  fontFamily: "'Inter', sans-serif",
  minWidth: 100,
  backdropFilter: "blur(8px)",
  transition: "box-shadow 0.2s, border-color 0.2s",
};

const selectedStyle: React.CSSProperties = {
  ...baseStyle,
  borderTop: borderSelected,
  borderRight: borderSelected,
  borderBottom: borderSelected,
  borderLeft: accentBorder,
  boxShadow: "0 0 16px rgba(52, 211, 153, 0.15), 0 4px 12px rgba(0,0,0,0.2)",
};

export default function FromNode({ selected }: { selected?: boolean }) {
  return (
    <div style={selected ? selectedStyle : baseStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <FromIcon style={{ width: 15, height: 15, color: "#34d399" }} />
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>From</span>
      </div>
      <Handle id="source-bottom" type="source" position={Position.Bottom} className="flow-handle" />
      <Handle id="source-right" type="source" position={Position.Right} className="flow-handle" />
    </div>
  );
}
