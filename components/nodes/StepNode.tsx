import { useFlowStore } from "@/store/useFlowStore";
import { isBuiltInComponent, type BuiltInComponentType } from "@/config/componentCatalog";
import type { NodeProps } from "reactflow";
import { nodeTypeMeta } from "../node-icons";
import FlowNodeCard from "./FlowNodeCard";
import { getBuiltInNodeCardMeta } from "./nodeCardMeta";

type StepNodeType = Exclude<BuiltInComponentType, "start">;

type StepNodeData = {
  label?: string;
  config?: Record<string, unknown>;
};

type StepNodeProps = NodeProps<StepNodeData>;

function isStepNodeType(type: string | undefined): type is StepNodeType {
  return Boolean(type && type !== "start" && isBuiltInComponent(type));
}

function getNodeDescription(type: StepNodeType, config?: Record<string, unknown>) {
  if (type === "process") {
    return `ref: ${String(config?.ref ?? "processorRef")}`;
  }

  return `clazz: ${String(config?.clazz ?? "java.util.Map")}`;
}

export default function StepNode({ id, type, data, selected }: StepNodeProps) {
  const deleteNode = useFlowStore((state) => state.deleteNode);

  if (!isStepNodeType(type)) {
    return null;
  }

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
