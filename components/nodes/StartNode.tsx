import { FromIcon } from "../node-icons";
import FlowNodeCard from "./FlowNodeCard";
import { getBuiltInNodeCardMeta } from "./nodeCardMeta";

export default function FromNode({ selected }: { selected?: boolean }) {
  const meta = getBuiltInNodeCardMeta("start");

  if (!meta) {
    return null;
  }

  return (
    <FlowNodeCard
      title="From"
      description={meta.description}
      accentColor={meta.accentColor}
      Icon={FromIcon}
      selected={selected}
      targetHandles={false}
    />
  );
}
