import {
  builtInComponentMap,
  componentGroups,
  isBuiltInComponent,
} from "@/config/componentCatalog";
import type { CustomComponentDefinition } from "@/store/useFlowStore";

const defaultDescriptions: Record<string, string> = {
  start: "Entry point for your workflow.",
  http: "Call an HTTP endpoint from the flow.",
  delay: "Pause execution before the next step runs.",
  container: "Open a nested canvas for grouped flow logic.",
  switch: "Route to different branches based on conditions.",
};

function toTag(label?: string | null) {
  return label?.trim() ? label.trim() : null;
}

export function getBuiltInNodeCardMeta(componentKey: string) {
  if (!isBuiltInComponent(componentKey)) {
    return null;
  }

  const definition = builtInComponentMap[componentKey];
  const group = componentGroups.find((item) => item.id === definition.defaultGroup);
  const bottomTags = [
    toTag(definition.defaultGroup),
    toTag(componentKey),
    "single-connector",
  ].filter((value): value is string => Boolean(value));

  return {
    accentColor: definition.color,
    subtitle: componentKey,
    description: defaultDescriptions[componentKey],
    topTags: [group?.label ?? "Component", "Stable"],
    bottomTags,
  };
}

export function getCustomNodeCardMeta(
  componentKey: string | undefined,
  customComponents: CustomComponentDefinition[],
  componentGroupAssignments: Record<string, string>,
) {
  const customComponent = componentKey
    ? customComponents.find((item) => item.key === componentKey)
    : null;

  if (!customComponent) {
    return null;
  }

  const groupId = componentGroupAssignments[customComponent.key];
  const group = componentGroups.find((item) => item.id === groupId);
  const bottomTags = [
    toTag(groupId),
    toTag(customComponent.key),
    "single-connector",
  ].filter((value): value is string => Boolean(value));

  return {
    accentColor: customComponent.color,
    subtitle: customComponent.key,
    description: customComponent.description || "Reusable custom component.",
    topTags: [group?.label ?? "Custom", "Custom"],
    bottomTags,
  };
}
