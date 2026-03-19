import { HttpIcon } from "../node-icons";
import { useFlowStore } from "@/store/useFlowStore";
import FlowNodeCard from "./FlowNodeCard";
import { getBuiltInNodeCardMeta } from "./nodeCardMeta";

export default function HttpNode({
  id,
  data,
  selected,
}: {
  id: string;
  data: { config?: { url?: string } };
  selected?: boolean;
}) {
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const meta = getBuiltInNodeCardMeta("http");

  if (!meta) {
    return null;
  }

  return (
    <FlowNodeCard
      id={id}
      title="HTTP Request"
      subtitle={meta.subtitle}
      description={data?.config?.url ? String(data.config.url) : meta.description}
      topTags={meta.topTags}
      bottomTags={meta.bottomTags}
      accentColor={meta.accentColor}
      Icon={HttpIcon}
      selected={selected}
      onDelete={deleteNode}
    />
  );
}
