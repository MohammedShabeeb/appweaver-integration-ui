import beanCatalogJson from "./bean-catalog.json";

export type BeanTemplate = {
  name: string;
  className: string;
  constructorArgs: unknown[];
};

export const beanCatalog = beanCatalogJson as BeanTemplate[];
