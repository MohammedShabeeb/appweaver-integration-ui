import { ContainerIcon } from "../node-icons";
import { useFlowStore } from "@/store/useFlowStore";
import FlowNodeCard from "./FlowNodeCard";
import { getBuiltInNodeCardMeta } from "./nodeCardMeta";

export default function ContainerNode({
  id,
  data,
  selected,
}: {
  id: string;
  data: { label?: string };
  selected?: boolean;
}) {
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const meta = getBuiltInNodeCardMeta("container");

  if (!meta) {
    return null;
  }

  return (
    <FlowNodeCard
      id={id}
      title={data?.label || "Container"}
      subtitle={meta.subtitle}
      description="Double-click to open nested canvas."
      topTags={meta.topTags}
      bottomTags={[...meta.bottomTags, "nested-canvas"]}
      accentColor={meta.accentColor}
      Icon={ContainerIcon}
      selected={selected}
      onDelete={deleteNode}
    />
  );
}
