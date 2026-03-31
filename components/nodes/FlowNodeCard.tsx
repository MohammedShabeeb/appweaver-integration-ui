import type { CSSProperties, ReactNode, SVGProps } from "react";
import { Handle, Position } from "reactflow";

type IconProps = SVGProps<SVGSVGElement>;

type FlowNodeCardProps = {
  id?: string;
  title: string;
  description?: string;
  accentColor: string;
  Icon: (props: IconProps) => ReactNode;
  selected?: boolean;
  onDelete?: (id: string) => void;
  sourceHandles?: boolean;
  targetHandles?: boolean;
};

const deleteBtnStyle: CSSProperties = {
  position: "absolute",
  right: 8,
  top: 8,
  zIndex: 10,
  display: "inline-flex",
  height: 20,
  width: 20,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  border: "1px solid rgba(248, 113, 113, 0.22)",
  background: "rgba(127, 29, 29, 0.92)",
  fontSize: 12,
  lineHeight: 1,
  color: "#fecaca",
  cursor: "pointer",
  boxShadow: "0 10px 18px rgba(2, 6, 23, 0.24)",
  fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
};

function buildCardStyle(accentColor: string, selected?: boolean): CSSProperties {
  return {
    position: "relative",
    width: 220,
    minHeight: 132,
    padding: "14px 14px 12px",
    borderRadius: 18,
    border: `1px solid ${selected ? `${accentColor}8a` : "rgba(255, 255, 255, 0.12)"}`,
    background:
      "radial-gradient(circle at top left, rgba(255,255,255,0.06), rgba(255,255,255,0) 34%), linear-gradient(180deg, rgba(10, 15, 28, 0.98), rgba(15, 23, 42, 0.98))",
    color: "#f8fafc",
    boxShadow: selected
      ? `0 0 0 1px ${accentColor}28, 0 18px 40px rgba(2, 6, 23, 0.38), 0 0 28px ${accentColor}24`
      : "0 18px 40px rgba(2, 6, 23, 0.24)",
    backdropFilter: "blur(14px)",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  };
}

export default function FlowNodeCard({
  id,
  title,
  description,
  accentColor,
  Icon,
  selected,
  onDelete,
  sourceHandles = true,
  targetHandles = true,
}: FlowNodeCardProps) {
  return (
    <div style={buildCardStyle(accentColor, selected)}>
      {selected && id && onDelete ? (
        <button
          type="button"
          aria-label={`Delete ${title}`}
          style={deleteBtnStyle}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(id);
          }}
        >
          x
        </button>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingRight: selected ? 22 : 0,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            height: 34,
            width: 34,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            background: accentColor,
            color: "#fff",
            boxShadow: `0 12px 28px ${accentColor}55`,
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: 18, height: 18 }} />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.28,
            letterSpacing: "-0.02em",
            color: "#f8fafc",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            fontFamily: "var(--font-display), var(--font-body), Arial, Helvetica, sans-serif",
          }}
          title={title}
        >
          {title}
        </div>
      </div>

      {description ? (
        <div
          style={{
            marginTop: 14,
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.65,
            color: "rgba(226, 232, 240, 0.82)",
            maxWidth: "100%",
            overflowWrap: "anywhere",
            letterSpacing: "-0.01em",
            fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
          }}
        >
          {description}
        </div>
      ) : null}

      {targetHandles ? (
        <>
          <Handle id="target-top" type="target" position={Position.Top} className="flow-handle" />
          <Handle id="target-left" type="target" position={Position.Left} className="flow-handle" />
        </>
      ) : null}
      {sourceHandles ? (
        <>
          <Handle id="source-bottom" type="source" position={Position.Bottom} className="flow-handle" />
          <Handle id="source-right" type="source" position={Position.Right} className="flow-handle" />
        </>
      ) : null}
    </div>
  );
}
