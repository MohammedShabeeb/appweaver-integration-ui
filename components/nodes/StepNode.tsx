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
  choiceBranchCanvasIds?: Record<string, string>;
};

type StepNodeProps = NodeProps<StepNodeData>;

function isStepNodeType(type: string | undefined): type is StepNodeType {
  return Boolean(type && type !== "start" && isBuiltInComponent(type));
}

function normalizeChoiceWhenBranches(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function getChoiceBranchStepCount(
  canvases: Record<string, { nodes?: Array<{ type?: string }> }>,
  branchCanvasIds: Record<string, string> | undefined,
  branchKey: string,
  fallbackSteps: unknown,
) {
  const canvasId = branchCanvasIds?.[branchKey];
  const canvas = canvasId ? canvases[canvasId] : undefined;

  if (canvas) {
    return canvas.nodes?.filter((node) => node.type !== "start").length ?? 0;
  }

  return Array.isArray(fallbackSteps) ? fallbackSteps.length : 0;
}

function ChoiceBranchSummary({ data }: { data?: StepNodeData }) {
  const canvases = useFlowStore((state) => state.canvases);
  const branches = normalizeChoiceWhenBranches(data?.config?.when);
  const branchCanvasIds = data?.choiceBranchCanvasIds;
  const otherwiseStepCount = getChoiceBranchStepCount(
    canvases,
    branchCanvasIds,
    "otherwise",
    data?.config?.otherwise,
  );
  const totalStepCount =
    branches.reduce(
      (count, branch, index) =>
        count +
        getChoiceBranchStepCount(canvases, branchCanvasIds, `when-${index}`, branch.steps),
      0,
    ) + otherwiseStepCount;
  const summary =
    branches.length === 1
      ? `1 when branch${otherwiseStepCount > 0 ? ", otherwise" : ""}`
      : `${branches.length} when branches${otherwiseStepCount > 0 ? ", otherwise" : ""}`;

  return (
    <div
      title={`${summary}. ${totalStepCount} branch steps.`}
      style={{
        display: "inline-flex",
        maxWidth: "100%",
        borderRadius: 999,
        border: "1px solid rgba(148, 163, 184, 0.24)",
        background: "rgba(15, 23, 42, 0.46)",
        padding: "4px 8px",
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1.35,
        color: "rgba(226, 232, 240, 0.80)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
      }}
    >
      {summary} | {totalStepCount} steps
    </div>
  );
}

export default function StepNode({ id, type, data, selected }: StepNodeProps) {
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const customComponents = useFlowStore((state) => state.customComponents);
  const isNestedCanvas = useFlowStore((state) => {
    const activeWorkflow = state.workflows[state.activeWorkflowId];

    return Boolean(activeWorkflow && activeWorkflow.currentCanvasId !== activeWorkflow.rootCanvasId);
  });
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
        disabled={data?.config?.disabled === true}
        nested={isNestedCanvas}
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
      disabled={data?.config?.disabled === true}
      nested={isNestedCanvas}
      onDelete={deleteNode}
    >
      {type === "choice" ? <ChoiceBranchSummary data={data} /> : null}
    </FlowNodeCard>
  );
}
