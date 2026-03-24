"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "reactflow";

export default function ConditionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const conditionLabel: string =
    (data as { conditionLabel?: string } | undefined)?.conditionLabel || "";

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? "#f472b6" : "#94a3b8",
          strokeWidth: selected ? 2.5 : 2,
        }}
      />
      {conditionLabel ? (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-auto absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                border: selected
                  ? "1px solid rgba(244, 114, 182, 0.6)"
                  : "1px solid rgba(71, 85, 105, 0.5)",
                background: selected
                  ? "rgba(244, 114, 182, 0.12)"
                  : "rgba(15, 23, 42, 0.92)",
                backdropFilter: "blur(16px)",
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 600,
                color: selected ? "#f9a8d4" : "#cbd5e1",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
                whiteSpace: "nowrap",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "-0.01em",
                cursor: "pointer",
              }}
            >
              {conditionLabel}
            </div>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
