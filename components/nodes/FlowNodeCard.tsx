import type { CSSProperties, ReactNode, SVGProps } from "react";
import { Handle, Position } from "reactflow";

type IconProps = SVGProps<SVGSVGElement>;

type FlowNodeCardProps = {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  topTags: string[];
  bottomTags: string[];
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
    width: 188,
    minHeight: 116,
    padding: "12px 12px 10px",
    borderRadius: 18,
    border: `1px solid ${selected ? `${accentColor}8a` : "rgba(255, 255, 255, 0.16)"}`,
    background:
      "radial-gradient(circle at top left, rgba(255,255,255,0.05), rgba(255,255,255,0) 34%), linear-gradient(180deg, rgba(23, 23, 26, 0.97), rgba(31, 31, 35, 0.97))",
    color: "#f8fafc",
    boxShadow: selected
      ? `0 0 0 1px ${accentColor}28, 0 18px 40px rgba(2, 6, 23, 0.38), 0 0 28px ${accentColor}24`
      : "0 18px 40px rgba(2, 6, 23, 0.24)",
    backdropFilter: "blur(14px)",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  };
}

function FlowNodeTag({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "accent" }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 20,
        borderRadius: 999,
        padding: "0 8px",
        background: tone === "accent" ? "#b7ef87" : "rgba(88, 89, 97, 0.9)",
        color: tone === "accent" ? "#16210d" : "#f8fafc",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
      }}
    >
      {label}
    </span>
  );
}

export default function FlowNodeCard({
  id,
  title,
  subtitle,
  description,
  topTags,
  bottomTags,
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

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div
          style={{
            display: "inline-flex",
            height: 24,
            width: 24,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 5,
            background: accentColor,
            color: "#fff",
            boxShadow: `0 12px 28px ${accentColor}55`,
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: 14, height: 14 }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 4 }}>
          {topTags.map((tag, index) => (
            <FlowNodeTag
              key={`${tag}-${index}`}
              label={tag}
              tone={index === topTags.length - 1 ? "accent" : "neutral"}
            />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.04em",
            fontFamily: "var(--font-display), var(--font-body), Arial, Helvetica, sans-serif",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              marginTop: 2,
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(248, 250, 252, 0.92)",
              letterSpacing: "0.01em",
              fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
            }}
          >
            ({subtitle})
          </div>
        ) : null}
        {description ? (
          <div
            style={{
              marginTop: 8,
              fontSize: 10,
              lineHeight: 1.4,
              color: "rgba(226, 232, 240, 0.88)",
              maxWidth: 150,
              fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
            }}
          >
            {description}
          </div>
        ) : null}
      </div>

      {bottomTags.length > 0 ? (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {bottomTags.map((tag) => (
            <FlowNodeTag key={tag} label={tag} />
          ))}
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
