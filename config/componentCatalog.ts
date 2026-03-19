import componentCatalogJson from "./component-catalog.json";

export type ComponentGroupId = "branchable" | "unbranchable";
export type ComponentType = "start" | "http" | "delay" | "container" | "action";

type ComponentGroupDefinition = {
  id: ComponentGroupId;
  label: string;
  description: string;
};

type ComponentDefinition = {
  type: ComponentType;
  defaultGroup: ComponentGroupId;
  color: string;
  bgClass: string;
};

type ComponentCatalog = {
  groups: ComponentGroupDefinition[];
  components: ComponentDefinition[];
};

export const componentCatalog = componentCatalogJson as ComponentCatalog;
export const componentGroups = componentCatalog.groups;
export const componentDefinitions = componentCatalog.components;

export function createDefaultComponentAssignments(): Record<ComponentType, ComponentGroupId> {
  return componentDefinitions.reduce(
    (assignments, component) => ({
      ...assignments,
      [component.type]: component.defaultGroup,
    }),
    {} as Record<ComponentType, ComponentGroupId>,
  );
}

export function isBranchableGroup(groupId: ComponentGroupId) {
  return groupId === "branchable";
}
