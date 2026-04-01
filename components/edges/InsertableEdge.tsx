"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "reactflow";
import { useFlowStore } from "@/store/useFlowStore";

export default function InsertableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const insertNodeOnEdge = useFlowStore((state) => state.insertNodeOnEdge);

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
          stroke: selected ? "var(--workflow-accent)" : "#94a3b8",
          strokeWidth: selected ? 2.5 : 2,
        }}
      />
      {selected ? (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-auto absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <div
              style={{
                display: "flex",
                minWidth: 112,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                border: "1px dashed rgba(203, 213, 225, 0.95)",
                background: "rgba(255, 255, 255, 0.96)",
                backdropFilter: "blur(16px)",
                padding: "8px 12px",
                fontSize: 12,
                color: "#64748b",
                boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)",
              }}
              onClick={(event) => event.stopPropagation()}
              onDragOver={(event) => {
                const rawComponent = event.dataTransfer.getData("application/reactflow-component");
                const fallbackType = event.dataTransfer.getData("application/reactflow");
                let componentKey = fallbackType;

                if (rawComponent) {
                  try {
                    componentKey =
                      (JSON.parse(rawComponent) as { componentKey?: string }).componentKey ?? "";
                  } catch {
                    componentKey = "";
                  }
                }

                if (!componentKey || componentKey === "start") {
                  return;
                }

                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();

                const rawComponent = event.dataTransfer.getData("application/reactflow-component");
                const fallbackType = event.dataTransfer.getData("application/reactflow");
                let componentKey = fallbackType;

                if (rawComponent) {
                  try {
                    componentKey =
                      (JSON.parse(rawComponent) as { componentKey?: string }).componentKey ?? "";
                  } catch {
                    componentKey = "";
                  }
                }

                if (componentKey && componentKey !== "start") {
                  insertNodeOnEdge(id, componentKey);
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    display: "flex",
                    height: 24,
                    width: 24,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    border: "1px solid rgba(203, 213, 225, 0.95)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >+</span>
                <span>Drag step here</span>
              </div>
            </div>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
