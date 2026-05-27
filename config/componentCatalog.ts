import componentCatalogJson from "./component-catalog.json";

export type ComponentGroupId =
  | "transform"
  | "metadata"
  | "logic"
  | "connectors"
  | "processing"
  | "batchParallel"
  | "reliability"
  | "timingObservability";
export type BuiltInComponentType =
  | "start"
  | "marshal"
  | "unmarshal"
  | "setBody"
  | "setHeader"
  | "setProperty"
  | "setContext"
  | "globalOption"
  | "convertBodyTo"
  | "transform"
  | "filter"
  | "dynamicroute"
  | "validate"
  | "process"
  | "bean"
  | "upload"
  | "download"
  | "enrich"
  | "dbCrud"
  | "aggregation"
  | "delay"
  | "log";
export type ComponentType = string;

export type ComponentGroupDefinition = {
  id: ComponentGroupId;
  label: string;
  description: string;
};

export type MavenDependencyDefinition = {
  groupId: string;
  artifactId: string;
  version: string;
};

export type ComponentDefinition = {
  type: BuiltInComponentType;
  defaultGroup: ComponentGroupId;
  singleEndpointOnly: boolean;
  color: string;
  bgClass: string;
  dependencies: MavenDependencyDefinition[];
};

type ComponentCatalog = {
  groups: ComponentGroupDefinition[];
  components: ComponentDefinition[];
};

export const componentCatalog = componentCatalogJson as ComponentCatalog;
export const componentGroups = componentCatalog.groups;
export const componentDefinitions = componentCatalog.components;
export const visibleComponentDefinitions = componentDefinitions;
export const builtInComponentKeys = componentDefinitions.map((component) => component.type);
export const builtInComponentMap = Object.fromEntries(
  componentDefinitions.map((component) => [component.type, component]),
) as Record<BuiltInComponentType, ComponentDefinition>;

export function getComponentDependencies(type: BuiltInComponentType): MavenDependencyDefinition[] {
  return builtInComponentMap[type].dependencies;
}

export function isBuiltInComponent(type: string): type is BuiltInComponentType {
  return builtInComponentKeys.includes(type as BuiltInComponentType);
}
