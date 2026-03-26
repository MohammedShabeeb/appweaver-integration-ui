import {
  builtInComponentMap,
  componentGroups,
  isBuiltInComponent,
} from "@/config/componentCatalog";

const defaultDescriptions: Record<string, string> = {
  start: "Entry point for your workflow.",
  marshal: "Serialize the message body with a selected class type.",
  unmarshal: "Deserialize the message body with a selected class type.",
  process: "Invoke a processor bean using its ref value.",
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
    topTags: [group?.label ?? "Component", "Camel"],
    bottomTags,
  };
}
