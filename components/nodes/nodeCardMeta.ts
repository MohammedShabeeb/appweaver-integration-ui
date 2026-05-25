import {
  builtInComponentMap,
  componentGroups,
  isBuiltInComponent,
} from "@/config/componentCatalog";

const defaultDescriptions: Record<string, string> = {
  start: "Entry point for your workflow.",
  marshal: "Serialize the message body with a selected class type.",
  unmarshal: "Read JSON, CSV, or XML into the message body.",
  setBody: "Replace the message body with an expression or constant value.",
  setHeader: "Set a message header from an expression or constant value.",
  setProperty: "Set an exchange property from an expression or constant value.",
  setContext: "Set a shared context value from an expression or constant.",
  convertBodyTo: "Convert the message body to a target Java class.",
  transform: "Transform the message body with a simple expression or mapper.",
  validate: "Reject invalid payloads with configured validation rules.",
  process: "Invoke a processor bean using its ref value.",
  upload: "Upload multipart documents to a configured endpoint.",
  download: "Download content from a configured endpoint.",
  dbCrud: "Run database CRUD or custom SQL operations.",
  delay: "Pause route processing with a constant or simple expression.",
  log: "Write route details to the configured logger.",
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
