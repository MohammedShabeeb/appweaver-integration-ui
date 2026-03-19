import { ActionIcon } from "../node-icons";
import { useFlowStore } from "@/store/useFlowStore";
import FlowNodeCard from "./FlowNodeCard";
import { getCustomNodeCardMeta } from "./nodeCardMeta";

export default function CustomNode({
  id,
  data,
  selected,
}: {
  id: string;
  data: {
    label?: string;
    description?: string;
    accentColor?: string;
    componentKey?: string;
  };
  selected?: boolean;
}) {
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const customComponents = useFlowStore((state) => state.customComponents);
  const componentGroupAssignments = useFlowStore((state) => state.componentGroupAssignments);
  const meta =
    getCustomNodeCardMeta(data?.componentKey, customComponents, componentGroupAssignments) ?? {
      accentColor: data?.accentColor || "#94a3b8",
      subtitle: data?.componentKey || "custom",
      description: data?.description || "JSON-defined component",
      topTags: ["Custom", "Custom"],
      bottomTags: ["custom", data?.componentKey || "component"],
    };

  return (
    <FlowNodeCard
      id={id}
      title={data?.label || "Custom Component"}
      subtitle={meta.subtitle}
      description={data?.description || meta.description}
      topTags={meta.topTags}
      bottomTags={meta.bottomTags}
      accentColor={meta.accentColor}
      Icon={ActionIcon}
      selected={selected}
      onDelete={deleteNode}
    />
  );
}
