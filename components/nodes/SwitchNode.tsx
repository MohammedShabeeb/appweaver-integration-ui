"use client";

import { Handle, Position } from "reactflow";
import { SwitchIcon } from "../node-icons";
import { useFlowStore } from "@/store/useFlowStore";
import FlowNodeCard from "./FlowNodeCard";
import { getBuiltInNodeCardMeta } from "./nodeCardMeta";

type SwitchCase = { label: string };

export default function SwitchNode({
  id,
  data,
  selected,
}: {
  id: string;
  data: {
    label?: string;
    config?: { cases?: SwitchCase[] };
  };
  selected?: boolean;
}) {
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const meta = getBuiltInNodeCardMeta("switch");
  const cases: SwitchCase[] = data?.config?.cases ?? [{ label: "default" }];

  if (!meta) {
    return null;
  }

  return (
    <div style={{ position: "relative" }}>
      <FlowNodeCard
        id={id}
        title={data?.label || "Switch"}
        subtitle={meta.subtitle}
        description={`${cases.length} branch${cases.length !== 1 ? "es" : ""}`}
        topTags={meta.topTags}
        bottomTags={[...meta.bottomTags, "multi-output"]}
        accentColor={meta.accentColor}
        Icon={SwitchIcon}
        selected={selected}
        onDelete={deleteNode}
        sourceHandles={false}
      />
      {/* Dynamic source handles — one per case */}
      {cases.map((c, index) => {
        const total = cases.length;
        const spacing = 160 / (total + 1);
        const offset = spacing * (index + 1);

        return (
          <Handle
            key={`source-case-${index}`}
            id={`source-case-${index}`}
            type="source"
            position={Position.Bottom}
            className="flow-handle"
            style={{
              left: offset,
              background: "#f472b6",
              width: 8,
              height: 8,
              border: "2px solid #1e1e22",
            }}
            title={c.label}
          />
        );
      })}
      {/* Right-side source handle for convenience */}
      <Handle
        id="source-right"
        type="source"
        position={Position.Right}
        className="flow-handle"
        style={{ display: "none" }}
      />
    </div>
  );
}
