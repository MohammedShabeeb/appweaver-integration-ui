import componentCatalogJson from "./component-catalog.json";

export type ComponentGroupId = "processor";
export type BuiltInComponentType = "start" | "marshal" | "unmarshal" | "process";
export type ComponentType = string;

type ComponentGroupDefinition = {
  id: ComponentGroupId;
  label: string;
  description: string;
};

export type MavenDependencyDefinition = {
  groupId: string;
  artifactId: string;
  version: string;
};

type ComponentDefinition = {
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
export const builtInComponentKeys = componentDefinitions.map((component) => component.type);
export const builtInComponentMap = Object.fromEntries(
  componentDefinitions.map((component) => [component.type, component]),
) as Record<BuiltInComponentType, ComponentDefinition>;

export function getComponentDependencies(type: BuiltInComponentType): MavenDependencyDefinition[] {
  return builtInComponentMap[type].dependencies;
}

export function createDefaultComponentAssignments(): Record<string, ComponentGroupId> {
  return componentDefinitions.reduce(
    (assignments, component) => ({
      ...assignments,
      [component.type]: component.defaultGroup,
    }),
    {} as Record<string, ComponentGroupId>,
  );
}

export function isBuiltInComponent(type: string): type is BuiltInComponentType {
  return builtInComponentKeys.includes(type as BuiltInComponentType);
}
