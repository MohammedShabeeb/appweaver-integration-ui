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
  componentKey?: string;
  description?: string;
  accentColor?: string;
};

type StepNodeProps = NodeProps<StepNodeData>;

function isStepNodeType(type: string | undefined): type is StepNodeType {
  return Boolean(type && type !== "start" && isBuiltInComponent(type));
}

export default function StepNode({ id, type, data, selected }: StepNodeProps) {
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const customComponents = useFlowStore((state) => state.customComponents);
  const componentKey = data?.componentKey ?? type ?? "";
  const customComponent = customComponents.find((component) => component.type === componentKey) ?? null;

  if (customComponent) {
    return (
      <FlowNodeCard
        id={id}
        title={customComponent.label}
        description={customComponent.description || customComponent.type}
        accentColor={data?.accentColor || customComponent.color}
        Icon={nodeTypeMeta.process.Icon}
        selected={selected}
        onDelete={deleteNode}
      />
    );
  }

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
      title={nodeTypeMeta[type].label}
      description={meta.description}
      accentColor={meta.accentColor}
      Icon={Icon}
      selected={selected}
      onDelete={deleteNode}
    />
  );
}
