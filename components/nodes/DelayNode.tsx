import { DelayIcon } from "../node-icons";
import { useFlowStore } from "@/store/useFlowStore";
import FlowNodeCard from "./FlowNodeCard";
import { getBuiltInNodeCardMeta } from "./nodeCardMeta";

export default function DelayNode({
  id,
  data,
  selected,
}: {
  id: string;
  data: { config?: { ms?: number } };
  selected?: boolean;
}) {
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const meta = getBuiltInNodeCardMeta("delay");

  if (!meta) {
    return null;
  }

  return (
    <FlowNodeCard
      id={id}
      title="Delay"
      subtitle={meta.subtitle}
      description={`${Number(data?.config?.ms ?? 0)} ms`}
      topTags={meta.topTags}
      bottomTags={meta.bottomTags}
      accentColor={meta.accentColor}
      Icon={DelayIcon}
      selected={selected}
      onDelete={deleteNode}
    />
  );
}
