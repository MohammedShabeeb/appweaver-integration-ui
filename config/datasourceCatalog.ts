import datasourceCatalogJson from "./datasource-catalog.json";

export type DataSourceStrategy = {
  name: string;
  schema?: string;
};

export type DataSourceTemplate = {
  key: string;
  driver: string;
  username: string;
  password: string;
  maxPool: number;
  minPool: number;
  url: string;
  packageToScan: string;
  l2CacheProvider: string;
  strategy: DataSourceStrategy;
};

type DataSourceCatalogJson = {
  dataSources: Record<string, Omit<DataSourceTemplate, "key">>;
  tenants: Record<string, string>;
  emfPerTenant: boolean;
};

const datasourceCatalog = datasourceCatalogJson as DataSourceCatalogJson;

export const dataSourceCatalog: DataSourceTemplate[] = Object.entries(datasourceCatalog.dataSources).map(
  ([key, value]) => ({
    key,
    ...value,
  }),
);

export const dataSourceTenantDefaults = datasourceCatalog.tenants;
export const dataSourceEmfPerTenantDefault = datasourceCatalog.emfPerTenant;
