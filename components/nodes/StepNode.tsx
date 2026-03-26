import { useFlowStore } from "@/store/useFlowStore";
import { nodeTypeMeta } from "../node-icons";
import FlowNodeCard from "./FlowNodeCard";
import { getBuiltInNodeCardMeta } from "./nodeCardMeta";

type StepNodeProps = {
  id: string;
  type: "marshal" | "unmarshal" | "process";
  data: {
    label?: string;
    config?: Record<string, unknown>;
  };
  selected?: boolean;
};

function getNodeDescription(type: StepNodeProps["type"], config?: Record<string, unknown>) {
  if (type === "process") {
    return `ref: ${String(config?.ref ?? "processorRef")}`;
  }

  return `clazz: ${String(config?.clazz ?? "java.util.Map")}`;
}

export default function StepNode({ id, type, data, selected }: StepNodeProps) {
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const meta = getBuiltInNodeCardMeta(type);

  if (!meta) {
    return null;
  }

  const Icon = nodeTypeMeta[type].Icon;

  return (
    <FlowNodeCard
      id={id}
      title={data?.label || nodeTypeMeta[type].label}
      description={getNodeDescription(type, data?.config)}
      accentColor={meta.accentColor}
      Icon={Icon}
      selected={selected}
      onDelete={deleteNode}
    />
  );
}
