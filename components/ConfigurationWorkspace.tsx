"use client";

import { useCallback, useMemo, useState } from "react";
import LlmConfigurationWorkspace from "./LlmConfigurationWorkspace";
import EndpointsConfigurationWorkspace from "./EndpointsConfigurationWorkspace";
import {
  appWeaverApiClient,
  type AppWeaverBeanConfig,
  type AppWeaverDataSourceConfig,
} from "@/lib/appweaverApiClient";

import {
  useFlowStore,
  type CreatedBean,
  type CreatedDataSource,
  type CreatedDataSourceTenant,
  type CreatedSecurityConfig,
  type SecuritySubsection,
} from "@/store/useFlowStore";

type BeanEditorState = {
  name: string;
  className: string;
  constructorArgs: string[] | string;
};

type DataSourceEditorState = {
  key: string;
  driver: string;
  username: string;
  password: string;
  maxPool: string;
  minPool: string;
  url: string;
  packageToScan: string;
  l2CacheProvider: string;
  strategy: string;
};

type SecurityEditorState = {
  fileName: string;
  content: string;
  authTenants: AuthTenantEditorState[];
  authorizePolicy: AuthorizePolicyEditorState;
};

type AuthClientEditorState = {
  id: string;
  name: string;
  secret: string;
  enabled: boolean;
};

type AuthTenantEditorState = {
  id: string;
  name: string;
  keyHeader: string;
  secretHeader: string;
  clients: AuthClientEditorState[];
};

type AuthorizeRuleType = "ROLE" | "OR" | "AND" | "NOT";

type AuthorizeRoleEditorState = {
  id: string;
  name: string;
};

type AuthorizeRuleEditorState = {
  id: string;
  type: AuthorizeRuleType;
  roleId: string;
  roleIds: string[];
};

type AuthorizePolicyEditorState = {
  policyName: string;
  enabled: boolean;
  roles: AuthorizeRoleEditorState[];
  roleHierarchy: Record<string, string[]>;
  rules: AuthorizeRuleEditorState[];
};

function createBeanEditorState(): BeanEditorState {
  return {
    name: "",
    className: "",
    constructorArgs: ["", ""],
  };
}

function createBeanEditorFromItem(bean: CreatedBean): BeanEditorState {
  return {
    name: bean.name,
    className: bean.className,
    constructorArgs:
      bean.constructorArgs.length > 0
        ? bean.constructorArgs.map((arg) =>
            typeof arg === "string" ? arg : JSON.stringify(arg),
          )
        : ["", ""],
  };
}

function createDataSourceEditorState(): DataSourceEditorState {
  return {
    key: "",
    driver: "",
    username: "",
    password: "",
    maxPool: "",
    minPool: "",
    url: "",
    packageToScan: "",
    l2CacheProvider: "",
    strategy: '{\n  "name": ""\n}',
  };
}

function createDataSourceEditorFromItem(dataSource: CreatedDataSource): DataSourceEditorState {
  return {
    key: dataSource.key,
    driver: dataSource.driver,
    username: dataSource.username,
    password: dataSource.password,
    maxPool: String(dataSource.maxPool),
    minPool: String(dataSource.minPool),
    url: dataSource.url,
    packageToScan: dataSource.packageToScan,
    l2CacheProvider: dataSource.l2CacheProvider,
    strategy: JSON.stringify(dataSource.strategy, null, 2),
  };
}

function createBeanId(name: string) {
  return `bean-${encodeURIComponent(name)}`;
}

function normalizeBackendBean(bean: AppWeaverBeanConfig): CreatedBean {
  const name = bean.name ?? "";

  return {
    id: createBeanId(name),
    name,
    className: bean.className ?? "",
    constructorArgs: Array.isArray(bean.constructorArgs) ? bean.constructorArgs : [],
  };
}

function toBackendBean(bean: Omit<CreatedBean, "id">): AppWeaverBeanConfig {
  return {
    name: bean.name,
    className: bean.className,
    constructorArgs: bean.constructorArgs,
    enabled: true,
  };
}

function createDataSourceId(key: string) {
  return `datasource-${encodeURIComponent(key)}`;
}

function normalizeBackendDataSources(
  dataSources: Record<string, AppWeaverDataSourceConfig>,
): CreatedDataSource[] {
  if (!dataSources || typeof dataSources !== "object" || Array.isArray(dataSources)) {
    throw new Error("Datasource API response must be a JSON object keyed by datasource name.");
  }

  return Object.entries(dataSources).map(([key, dataSource]) => ({
    id: createDataSourceId(key),
    key,
    driver: dataSource.driver ?? "",
    username: dataSource.username ?? "",
    password: dataSource.password ?? "",
    maxPool: Number(dataSource.maxPool ?? 0),
    minPool: Number(dataSource.minPool ?? 0),
    url: dataSource.url ?? "",
    packageToScan: dataSource.packageToScan ?? "",
    l2CacheProvider: dataSource.l2CacheProvider ?? "",
    strategy: {
      name: dataSource.strategy?.name ?? "",
      ...(dataSource.strategy?.schema ? { schema: dataSource.strategy.schema } : {}),
    },
  }));
}

function toBackendDataSource(dataSource: Omit<CreatedDataSource, "id">): AppWeaverDataSourceConfig {
  return {
    name: dataSource.key,
    driver: dataSource.driver,
    username: dataSource.username,
    password: dataSource.password,
    maxPool: dataSource.maxPool,
    minPool: dataSource.minPool,
    url: dataSource.url,
    packageToScan: dataSource.packageToScan,
    l2CacheProvider: dataSource.l2CacheProvider,
    strategy: dataSource.strategy,
  };
}

function normalizeBackendDataSource(
  key: string,
  dataSource: AppWeaverDataSourceConfig,
): CreatedDataSource {
  return normalizeBackendDataSources({ [key]: dataSource })[0];
}

function createDataSourceTenantId(tenantName: string) {
  return `datasource-tenant-${encodeURIComponent(tenantName)}`;
}

function normalizeBackendDataSourceTenants(
  tenants: Record<string, string>,
): CreatedDataSourceTenant[] {
  if (!tenants || typeof tenants !== "object" || Array.isArray(tenants)) {
    throw new Error("Datasource tenant API response must be a JSON object keyed by tenant name.");
  }

  return Object.entries(tenants).map(([tenantName, dataSourceKey]) => ({
    id: createDataSourceTenantId(tenantName),
    tenantName,
    dataSourceKey,
  }));
}

function createAuthClientEditorState(
  overrides: Partial<Omit<AuthClientEditorState, "id">> = {},
): AuthClientEditorState {
  return {
    id: `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: overrides.name ?? "",
    secret: overrides.secret ?? "",
    enabled: overrides.enabled ?? true,
  };
}

function createAuthTenantEditorState(
  overrides: Partial<Omit<AuthTenantEditorState, "id" | "clients">> & {
    clients?: AuthClientEditorState[];
  } = {},
): AuthTenantEditorState {
  return {
    id: `tenant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: overrides.name ?? "",
    keyHeader: overrides.keyHeader ?? "x-api-key",
    secretHeader: overrides.secretHeader ?? "x-api-secret",
    clients: overrides.clients ?? [createAuthClientEditorState()],
  };
}

function createDefaultAuthTenants(): AuthTenantEditorState[] {
  return [
    createAuthTenantEditorState({
      name: "default",
      clients: [createAuthClientEditorState({ name: "apikey1" })],
    }),
  ];
}

function buildAuthConfig(tenants: AuthTenantEditorState[]) {
  return {
    tenants: Object.fromEntries(
      tenants.map((tenant) => [
        tenant.name.trim(),
        {
          keyHeader: tenant.keyHeader.trim(),
          secretHeader: tenant.secretHeader.trim(),
          clients: Object.fromEntries(
            tenant.clients.map((client) => [
              client.name.trim(),
              {
                secret: client.secret,
                enabled: client.enabled,
              },
            ]),
          ),
        },
      ]),
    ),
  };
}

function serializeAuthConfig(tenants: AuthTenantEditorState[]) {
  return JSON.stringify(buildAuthConfig(tenants), null, 2);
}

function parseAuthTenants(content: string): AuthTenantEditorState[] {
  try {
    const parsed = JSON.parse(content) as {
      tenants?: Record<
        string,
        {
          keyHeader?: string;
          secretHeader?: string;
          clients?: Record<string, { secret?: string; enabled?: boolean }>;
        }
      >;
    };

    const tenants = parsed?.tenants;

    if (!tenants || typeof tenants !== "object" || Array.isArray(tenants)) {
      return createDefaultAuthTenants();
    }

    const mappedTenants = Object.entries(tenants).map(([tenantName, tenantValue]) =>
      createAuthTenantEditorState({
        name: tenantName,
        keyHeader: tenantValue?.keyHeader ?? "x-api-key",
        secretHeader: tenantValue?.secretHeader ?? "x-api-secret",
        clients:
          tenantValue?.clients && typeof tenantValue.clients === "object" && !Array.isArray(tenantValue.clients)
            ? Object.entries(tenantValue.clients).map(([clientName, clientValue]) =>
                createAuthClientEditorState({
                  name: clientName,
                  secret: clientValue?.secret ?? "",
                  enabled: clientValue?.enabled ?? true,
                }),
              )
            : [createAuthClientEditorState()],
      }),
    );

    return mappedTenants.length > 0 ? mappedTenants : createDefaultAuthTenants();
  } catch {
    return createDefaultAuthTenants();
  }
}

function createAuthorizeRoleEditorState(name = ""): AuthorizeRoleEditorState {
  return {
    id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
  };
}

function createAuthorizeRuleEditorState(
  roleId: string,
  overrides: Partial<Omit<AuthorizeRuleEditorState, "id">> = {},
): AuthorizeRuleEditorState {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: overrides.type ?? "ROLE",
    roleId: overrides.roleId ?? roleId,
    roleIds: overrides.roleIds ?? (roleId ? [roleId] : []),
  };
}

function createDefaultAuthorizePolicy(): AuthorizePolicyEditorState {
  const admin = createAuthorizeRoleEditorState("admin");
  const manager = createAuthorizeRoleEditorState("manager");
  const user = createAuthorizeRoleEditorState("user");

  return {
    policyName: "policy1",
    enabled: true,
    roles: [admin, manager, user],
    roleHierarchy: {
      [admin.id]: [manager.id],
      [manager.id]: [user.id],
      [user.id]: [],
    },
    rules: [createAuthorizeRuleEditorState(user.id)],
  };
}

function buildAuthorizeRule(
  rule: AuthorizeRuleEditorState,
  roleNameById: Map<string, string>,
) {
  if (rule.type === "ROLE") {
    return {
      type: "ROLE",
      value: roleNameById.get(rule.roleId) ?? "",
    };
  }

  return {
    type: rule.type,
    policyRules: rule.roleIds
      .map((roleId) => roleNameById.get(roleId))
      .filter((roleName): roleName is string => Boolean(roleName))
      .map((roleName) => ({
        type: "ROLE",
        value: roleName,
      })),
  };
}

function buildAuthorizeConfig(policy: AuthorizePolicyEditorState) {
  const roleNameById = new Map(
    policy.roles
      .map((role) => [role.id, role.name.trim()] as const)
      .filter(([, name]) => Boolean(name)),
  );

  return {
    policies: {
      [policy.policyName.trim()]: {
        roleHierarchy: Object.fromEntries(
          policy.roles
            .map((role) => {
              const roleName = role.name.trim();

              if (!roleName) {
                return null;
              }

              return [
                roleName,
                (policy.roleHierarchy[role.id] ?? [])
                  .map((childRoleId) => roleNameById.get(childRoleId))
                  .filter((childRoleName): childRoleName is string => Boolean(childRoleName)),
              ] as const;
            })
            .filter((entry): entry is readonly [string, string[]] => Boolean(entry)),
        ),
        rule:
          policy.rules.length === 1
            ? buildAuthorizeRule(policy.rules[0], roleNameById)
            : {
                type: "AND",
                policyRules: policy.rules.map((rule) => buildAuthorizeRule(rule, roleNameById)),
              },
        enabled: policy.enabled,
      },
    },
  };
}

function serializeAuthorizeConfig(policy: AuthorizePolicyEditorState) {
  return JSON.stringify(buildAuthorizeConfig(policy), null, 2);
}

function parseAuthorizePolicy(content: string): AuthorizePolicyEditorState {
  try {
    type ParsedAuthorizeRule = {
      type?: string;
      value?: string;
      policyRules?: ParsedAuthorizeRule[];
    };
    const parsed = JSON.parse(content) as {
      policies?: Record<
        string,
        {
          roleHierarchy?: Record<string, string[]>;
          rule?: ParsedAuthorizeRule;
          enabled?: boolean;
        }
      >;
    };
    const policyEntry = Object.entries(parsed.policies ?? {})[0];

    if (!policyEntry) {
      return createDefaultAuthorizePolicy();
    }

    const [policyName, policyValue] = policyEntry;
    const collectRuleValues = (rule?: ParsedAuthorizeRule): string[] => {
      if (!rule) {
        return [];
      }

      return [
        rule.value ?? "",
        ...(rule.policyRules ?? []).flatMap((policyRule) => collectRuleValues(policyRule)),
      ].filter(Boolean);
    };
    const roleNames = Array.from(
      new Set([
        ...Object.keys(policyValue.roleHierarchy ?? {}),
        ...Object.values(policyValue.roleHierarchy ?? {}).flat(),
        ...collectRuleValues(policyValue.rule),
      ].filter(Boolean)),
    );
    const roles = (roleNames.length > 0 ? roleNames : ["admin", "manager", "user"]).map((roleName) =>
      createAuthorizeRoleEditorState(roleName),
    );
    const roleIdByName = new Map(roles.map((role) => [role.name, role.id]));
    const roleHierarchy = Object.fromEntries(
      roles.map((role) => [
        role.id,
        (policyValue.roleHierarchy?.[role.name] ?? [])
          .map((childRoleName) => roleIdByName.get(childRoleName))
          .filter((childRoleId): childRoleId is string => Boolean(childRoleId)),
      ]),
    );
    const firstRoleId = roles[0]?.id ?? "";
    const createParsedRule = (rule?: ParsedAuthorizeRule) => {
      const type: AuthorizeRuleType =
        rule?.type === "OR" || rule?.type === "AND" || rule?.type === "NOT"
          ? rule.type
          : "ROLE";
      const roleId =
        roleIdByName.get(rule?.value ?? "") ??
        roleIdByName.get(rule?.policyRules?.[0]?.value ?? "") ??
        firstRoleId;
      const roleIds =
        rule?.policyRules
          ?.map((policyRule) => roleIdByName.get(policyRule.value ?? ""))
          .filter((parsedRoleId): parsedRoleId is string => Boolean(parsedRoleId)) ??
        (roleId ? [roleId] : []);

      return createAuthorizeRuleEditorState(roleId, {
        type,
        roleId,
        roleIds,
      });
    };
    const parsedRules =
      policyValue.rule?.type === "AND" &&
      policyValue.rule.policyRules?.some((rule) => rule.type && rule.type !== "ROLE")
        ? policyValue.rule.policyRules.map((rule) => createParsedRule(rule))
        : [createParsedRule(policyValue.rule)];

    return {
      policyName,
      enabled: policyValue.enabled ?? true,
      roles,
      roleHierarchy,
      rules: parsedRules.length > 0 ? parsedRules : [createAuthorizeRuleEditorState(firstRoleId)],
    };
  } catch {
    return createDefaultAuthorizePolicy();
  }
}

const SECURITY_DEFAULTS: Record<
  SecuritySubsection,
  {
    fileName: string;
    content: string;
    authTenants: AuthTenantEditorState[];
    authorizePolicy: AuthorizePolicyEditorState;
  }
> = {
  auth: {
    fileName: "apikey.json",
    content: serializeAuthConfig(createDefaultAuthTenants()),
    authTenants: createDefaultAuthTenants(),
    authorizePolicy: createDefaultAuthorizePolicy(),
  },
  authorize: {
    fileName: "policy.json",
    content: serializeAuthorizeConfig(createDefaultAuthorizePolicy()),
    authTenants: createDefaultAuthTenants(),
    authorizePolicy: createDefaultAuthorizePolicy(),
  },
};

function createSecurityEditorState(subsection: SecuritySubsection): SecurityEditorState {
  const defaults = SECURITY_DEFAULTS[subsection];

  return {
    fileName: defaults.fileName,
    content: defaults.content,
    authTenants:
      subsection === "auth" ? defaults.authTenants : createDefaultAuthTenants(),
    authorizePolicy:
      subsection === "authorize" ? defaults.authorizePolicy : createDefaultAuthorizePolicy(),
  };
}

function createSecurityEditorFromItem(item: CreatedSecurityConfig): SecurityEditorState {
  return {
    fileName: item.fileName,
    content: item.content,
    authTenants:
      item.subsection === "auth" ? parseAuthTenants(item.content) : createDefaultAuthTenants(),
    authorizePolicy:
      item.subsection === "authorize" ? parseAuthorizePolicy(item.content) : createDefaultAuthorizePolicy(),
  };
}

const pageStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: "18px 20px 22px",
  overflow: "hidden",
};

const panelStyle: React.CSSProperties = {
  borderRadius: 24,
  border: "1px solid rgba(226, 232, 240, 0.95)",
  background: "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96))",
  boxShadow: "0 24px 46px rgba(15, 23, 42, 0.08)",
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid rgba(203, 213, 225, 0.95)",
  background: "#ffffff",
  padding: "12px 14px",
  fontSize: 14,
  color: "#0f172a",
  fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
  outline: "none",
};

const listItemMetaStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: "#64748b",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  lineHeight: 1.55,
};

const iconButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 999,
  border: "1px solid rgba(203, 213, 225, 0.95)",
  background: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  flexShrink: 0,
};

const deleteIconButtonStyle: React.CSSProperties = {
  ...iconButtonStyle,
  width: 26,
  height: 26,
  borderRadius: 9,
  border: "1px solid rgba(252, 165, 165, 0.34)",
  background: "#fff5f5",
  color: "#dc2626",
  boxShadow: "0 6px 14px rgba(127, 29, 29, 0.08)",
};

const workspaceGridStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 340px)",
  gap: 20,
  alignItems: "stretch",
  overflow: "hidden",
};

const workspacePanelStyle: React.CSSProperties = {
  ...panelStyle,
  padding: 20,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

function parseConstructorArgValue(value: string): unknown {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed;
  }

  if (
    trimmed === "true" ||
    trimmed === "false" ||
    trimmed === "null" ||
    /^-?\d+(\.\d+)?$/.test(trimmed) ||
    ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]")))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
}

function normalizeConstructorArgs(value: BeanEditorState["constructorArgs"]): string[] {
  if (Array.isArray(value)) {
    return value.length > 0 ? value : ["", ""];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.length > 0
          ? parsed.map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
          : ["", ""];
      }
    } catch {
      return value.trim().length > 0 ? [value] : ["", ""];
    }

    return value.trim().length > 0 ? [value] : ["", ""];
  }

  return ["", ""];
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <h2 className="app-heading-2" style={{ margin: 0, color: "#0f172a", letterSpacing: "-0.02em" }}>
        {title}
      </h2>
      <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>{subtitle}</p>
    </div>
  );
}

function BeansWorkspace() {
  const { beans, addBean, replaceBeans, updateBean, removeBean } = useFlowStore();
  const [selectedBeanId, setSelectedBeanId] = useState<string | null>(null);
  const [editor, setEditor] = useState<BeanEditorState>(() => createBeanEditorState());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [lookupName, setLookupName] = useState("");
  const constructorArgs = normalizeConstructorArgs(editor.constructorArgs);

  const selectedBean = beans.find((bean) => bean.id === selectedBeanId) ?? null;

  const parseBeanEditor = () => ({
    name: editor.name,
    className: editor.className,
    constructorArgs: constructorArgs.map((arg) => parseConstructorArgValue(arg)),
  });

  const loadBeans = useCallback(async () => {
    setIsLoading(true);
    setLoadMessage(null);

    try {
      const backendBeans = await appWeaverApiClient.system.beans.list();
      const normalizedBeans = backendBeans.map(normalizeBackendBean);

      replaceBeans(normalizedBeans);
      setError(null);
      setLoadMessage(`Loaded ${normalizedBeans.length} bean${normalizedBeans.length === 1 ? "" : "s"} from the backend.`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load beans from the backend.");
      setLoadMessage(null);
    } finally {
      setIsLoading(false);
    }
  }, [replaceBeans]);

  const handleGetBeanByName = async () => {
    const trimmedName = lookupName.trim();

    if (!trimmedName) {
      setError("Enter a bean name to fetch.");
      return;
    }

    setIsLoading(true);
    setLoadMessage(null);

    try {
      const backendBean = await appWeaverApiClient.system.beans.get(trimmedName);
      const normalizedBean = normalizeBackendBean({ ...backendBean, name: backendBean.name ?? trimmedName });

      replaceBeans([normalizedBean]);
      setSelectedBeanId(normalizedBean.id);
      setEditor(createBeanEditorFromItem(normalizedBean));
      setError(null);
      setLoadMessage(`Loaded bean "${normalizedBean.name}" from the backend.`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load that bean from the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const payload = parseBeanEditor();
      const trimmedName = payload.name.trim();

      if (!trimmedName) {
        setError("Bean name is required.");
        return;
      }

      if (beans.some((bean) => bean.name === trimmedName)) {
        setError("A bean with that name already exists.");
        return;
      }

      await appWeaverApiClient.system.beans.create(
        trimmedName,
        toBackendBean({ ...payload, name: trimmedName }),
      );
      const result = addBean(payload);

      if (!result.ok) {
        setError(result.reason);
        return;
      }

      setEditor(createBeanEditorState());
      setError(null);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "The constructor arguments could not be converted.");
    }
  };

  const handleUpdate = async () => {
    if (!selectedBeanId || !selectedBean) {
      setError("Select a bean from the list to edit it.");
      return;
    }

    try {
      const payload = parseBeanEditor();
      const trimmedName = payload.name.trim();

      if (!trimmedName) {
        setError("Bean name is required.");
        return;
      }

      if (beans.some((bean) => bean.id !== selectedBeanId && bean.name === trimmedName)) {
        setError("A bean with that name already exists.");
        return;
      }

      await appWeaverApiClient.system.beans.update(
        selectedBean.name,
        toBackendBean({ ...payload, name: trimmedName }),
      );
      const result = updateBean(selectedBeanId, payload);

      if (!result.ok) {
        setError(result.reason);
        return;
      }

      setError(null);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "The constructor arguments could not be converted.");
    }
  };

  const handleDelete = async (beanId: string) => {
    const bean = beans.find((item) => item.id === beanId);

    if (!bean) {
      return;
    }

    try {
      await appWeaverApiClient.system.beans.remove(bean.name);
      removeBean(beanId);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not delete the bean.");
      return;
    }

    if (selectedBeanId === beanId) {
      setSelectedBeanId(null);
      setEditor(createBeanEditorState());
      setError(null);
    }
  };

  return (
    <>
      <div style={workspaceGridStyle}>
        <section style={workspacePanelStyle}>
          <SectionTitle
            title={selectedBean ? "Edit Bean" : "Create Bean"}
            subtitle="Create and manage bean definitions from the AppWeaver backend."
          />
          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              paddingRight: 6,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ color: "#475569", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Name
              </span>
              <input
                value={editor.name}
                onChange={(event) => setEditor((current) => ({ ...current, name: event.target.value }))}
                style={fieldStyle}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ color: "#475569", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Class Name
              </span>
              <input
                value={editor.className}
                onChange={(event) => setEditor((current) => ({ ...current, className: event.target.value }))}
                style={fieldStyle}
              />
            </label>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#475569", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Constructor Args
                </span>
                <button
                  type="button"
                  aria-label="Add constructor argument"
                  onClick={() =>
                    setEditor((current) => ({
                      ...current,
                      constructorArgs: [...normalizeConstructorArgs(current.constructorArgs), ""],
                    }))
                  }
                  style={iconButtonStyle}
                >
                  +
                </button>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {constructorArgs.map((arg, index) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <input
                      value={arg}
                      placeholder={`Argument ${index + 1}`}
                      onChange={(event) =>
                        setEditor((current) => ({
                          ...current,
                          constructorArgs: normalizeConstructorArgs(current.constructorArgs).map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item,
                          ),
                        }))
                      }
                      style={fieldStyle}
                    />
                    <button
                      type="button"
                      aria-label={`Remove argument ${index + 1}`}
                      onClick={() =>
                        setEditor((current) => ({
                          ...current,
                          constructorArgs:
                            normalizeConstructorArgs(current.constructorArgs).length > 1
                              ? normalizeConstructorArgs(current.constructorArgs).filter((_, itemIndex) => itemIndex !== index)
                              : [""],
                        }))
                      }
                      style={{ ...iconButtonStyle, width: 32, height: 32, borderRadius: 10 }}
                    >
                      -
                    </button>
                  </div>
                ))}
              </div>
              <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 12, lineHeight: 1.55 }}>
                Enter plain text for string arguments. If an argument looks like valid JSON such as
                `123`, `true`, `{}` or `[]`, it will be converted before saving.
              </p>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            {error ? <p style={{ margin: 0, color: "#fca5a5", fontSize: 13 }}>{error}</p> : null}
            <div style={stickyActionBarStyle}>
              <button
                type="button"
                onClick={() => {
                  setSelectedBeanId(null);
                  setEditor(createBeanEditorState());
                  setError(null);
                }}
                style={secondaryButtonStyle}
              >
                New Bean
              </button>
              <button type="button" onClick={() => void handleCreate()} style={primaryButtonStyle}>
                Create Bean
              </button>
              <button type="button" onClick={() => void handleUpdate()} style={secondaryButtonStyle}>
                Edit Bean
              </button>
            </div>
          </div>
        </section>

        <section style={workspacePanelStyle}>
          <SectionTitle
            title="List Beans"
            subtitle="Click load to fetch the current bean list from the backend."
          />
          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            <button
              type="button"
              onClick={() => void loadBeans()}
              disabled={isLoading}
              style={{
                ...secondaryButtonStyle,
                minHeight: 44,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "wait" : "pointer",
              }}
            >
              {isLoading ? "Loading Beans" : "Load Beans"}
            </button>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 10,
                alignItems: "center",
              }}
            >
              <input
                value={lookupName}
                onChange={(event) => setLookupName(event.target.value)}
                placeholder="bean name"
                style={{ ...fieldStyle, minHeight: 44, padding: "9px 12px" }}
              />
              <button
                type="button"
                onClick={() => void handleGetBeanByName()}
                disabled={isLoading}
                style={{
                  ...secondaryButtonStyle,
                  minHeight: 44,
                  whiteSpace: "nowrap",
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? "wait" : "pointer",
                }}
              >
                Get By Name
              </button>
            </div>
            {loadMessage ? (
              <p style={{ margin: 0, color: "#166534", fontSize: 12, lineHeight: 1.5 }}>
                {loadMessage}
              </p>
            ) : null}
          </div>
          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              paddingRight: 6,
            }}
          >
            {beans.length > 0 ? (
              beans.map((bean) => (
                <div
                  key={bean.id}
                  style={{
                    position: "relative",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBeanId(bean.id);
                      setEditor(createBeanEditorFromItem(bean));
                      setError(null);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      borderRadius: 16,
                      border:
                        bean.id === selectedBeanId
                          ? "1px solid rgba(96, 165, 250, 0.5)"
                          : "1px solid rgba(71, 85, 105, 0.3)",
                      background:
                        bean.id === selectedBeanId
                          ? "rgba(30, 64, 175, 0.18)"
                          : "rgba(255, 255, 255, 0.96)",
                      padding: "12px 46px 12px 16px",
                      color: "#0f172a",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>{bean.name}</div>
                    <div style={listItemMetaStyle}>{bean.className}</div>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${bean.name}`}
                    onClick={() => void handleDelete(bean.id)}
                    style={{
                      ...deleteIconButtonStyle,
                      position: "absolute",
                      top: "50%",
                      right: 12,
                      transform: "translateY(-50%)",
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: 14, height: 14 }}
                    >
                      <path d="M9 3.75h6a1 1 0 0 1 1 1V6H8V4.75a1 1 0 0 1 1-1Z" />
                      <path d="M4.75 6h14.5" />
                      <path d="M6.75 6.75 7.6 19a2 2 0 0 0 2 1.86h4.8a2 2 0 0 0 2-1.86l.85-12.25" />
                      <path d="M10 10.25v6.5" />
                      <path d="M14 10.25v6.5" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <div
                style={{
                  borderRadius: 16,
                  border: "1px dashed rgba(71, 85, 105, 0.45)",
                  padding: "18px 16px",
                  color: "#64748b",
                  textAlign: "center",
                }}
              >
                No beans created yet.
              </div>
            )}
          </div>

        </section>
      </div>
    </>
  );
}

function DatasourcesWorkspace() {
  const {
    dataSources,
    dataSourceTenants,
    addDataSource,
    replaceDataSources,
    addDataSourceTenant,
    replaceDataSourceTenants,
    updateDataSourceTenant,
    removeDataSourceTenant,
    updateDataSource,
    removeDataSource,
  } = useFlowStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [editor, setEditor] = useState<DataSourceEditorState>(() => createDataSourceEditorState());
  const [newEditorDraft, setNewEditorDraft] = useState<DataSourceEditorState>(() =>
    createDataSourceEditorState(),
  );
  const [editorDrafts, setEditorDrafts] = useState<Record<string, DataSourceEditorState>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTenantLoading, setIsTenantLoading] = useState(false);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [tenantMessage, setTenantMessage] = useState<string | null>(null);
  const [lookupName, setLookupName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantDataSourceKey, setTenantDataSourceKey] = useState("");

  const selectedItem = dataSources.find((item) => item.id === selectedId) ?? null;
  const selectedTenant = dataSourceTenants.find((item) => item.id === selectedTenantId) ?? null;

  const updateEditor = (
    updater: DataSourceEditorState | ((current: DataSourceEditorState) => DataSourceEditorState),
  ) => {
    setEditor((current) => {
      const nextEditor = typeof updater === "function" ? updater(current) : updater;

      if (selectedId) {
        setEditorDrafts((currentDrafts) => ({
          ...currentDrafts,
          [selectedId]: nextEditor,
        }));
      } else {
        setNewEditorDraft(nextEditor);
      }

      return nextEditor;
    });
  };

  const selectDataSource = (dataSource: CreatedDataSource) => {
    setSelectedId(dataSource.id);
    setEditor(editorDrafts[dataSource.id] ?? createDataSourceEditorFromItem(dataSource));
    setError(null);
  };

  const loadDataSources = useCallback(async () => {
    setIsLoading(true);
    setLoadMessage(null);

    try {
      const backendDataSources = await appWeaverApiClient.system.dataSources.list();
      const normalizedDataSources = normalizeBackendDataSources(backendDataSources);

      replaceDataSources(normalizedDataSources);
      setError(null);
      setLoadMessage(`Loaded ${normalizedDataSources.length} datasource${normalizedDataSources.length === 1 ? "" : "s"} from the backend.`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load datasources from the backend.");
      setLoadMessage(null);
    } finally {
      setIsLoading(false);
    }
  }, [replaceDataSources]);

  const loadDataSourceTenants = useCallback(async () => {
    setIsTenantLoading(true);
    setTenantMessage(null);

    try {
      const backendTenants = await appWeaverApiClient.system.dataSourceTenants.list();
      const normalizedTenants = normalizeBackendDataSourceTenants(backendTenants);

      replaceDataSourceTenants(normalizedTenants);
      setError(null);
      setTenantMessage(`Loaded ${normalizedTenants.length} tenant mapping${normalizedTenants.length === 1 ? "" : "s"} from the backend.`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load datasource tenant mappings from the backend.");
      setTenantMessage(null);
    } finally {
      setIsTenantLoading(false);
    }
  }, [replaceDataSourceTenants]);

  const parseEditor = () => {
    const strategy = JSON.parse(editor.strategy);

    if (!strategy || typeof strategy !== "object" || Array.isArray(strategy)) {
      throw new Error("`strategy` must be a JSON object.");
    }

    const maxPool = Number(editor.maxPool);
    const minPool = Number(editor.minPool);

    if (!Number.isFinite(maxPool) || !Number.isFinite(minPool)) {
      throw new Error("`maxPool` and `minPool` must be valid numbers.");
    }

    return {
      key: editor.key,
      driver: editor.driver,
      username: editor.username,
      password: editor.password,
      maxPool,
      minPool,
      url: editor.url,
      packageToScan: editor.packageToScan,
      l2CacheProvider: editor.l2CacheProvider,
      strategy: strategy as CreatedDataSource["strategy"],
    };
  };

  const handleCreate = async () => {
    try {
      const payload = parseEditor();
      const trimmedKey = payload.key.trim();

      if (!trimmedKey) {
        setError("Datasource key is required.");
        return;
      }

      if (dataSources.some((item) => item.key === trimmedKey)) {
        setError("A datasource with that key already exists.");
        return;
      }

      await appWeaverApiClient.system.dataSources.create(toBackendDataSource({ ...payload, key: trimmedKey }));
      const result = addDataSource(payload);

      if (!result.ok) {
        setError(result.reason);
        return;
      }

      const blankEditor = createDataSourceEditorState();

      setNewEditorDraft(blankEditor);
      setEditor(blankEditor);
      setError(null);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "The datasource fields are invalid.");
    }
  };

  const handleUpdate = async () => {
    if (!selectedId || !selectedItem) {
      setError("Select a datasource from the list to edit it.");
      return;
    }

    try {
      const payload = parseEditor();
      const trimmedKey = payload.key.trim();

      if (!trimmedKey) {
        setError("Datasource key is required.");
        return;
      }

      if (dataSources.some((item) => item.id !== selectedId && item.key === trimmedKey)) {
        setError("A datasource with that key already exists.");
        return;
      }

      await appWeaverApiClient.system.dataSources.update(
        selectedItem.key,
        toBackendDataSource({ ...payload, key: trimmedKey }),
      );
      const result = updateDataSource(selectedId, payload);

      if (!result.ok) {
        setError(result.reason);
        return;
      }

      setError(null);
      setEditorDrafts((currentDrafts) => {
        const { [selectedId]: savedDraft, ...remainingDrafts } = currentDrafts;
        void savedDraft;
        return remainingDrafts;
      });
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "The datasource fields are invalid.");
    }
  };

  const handleDelete = async (dataSourceId: string) => {
    const dataSource = dataSources.find((item) => item.id === dataSourceId);

    if (!dataSource) {
      return;
    }

    try {
      await appWeaverApiClient.system.dataSources.remove(dataSource.key);
      removeDataSource(dataSourceId);
      setEditorDrafts((currentDrafts) => {
        const { [dataSourceId]: deletedDraft, ...remainingDrafts } = currentDrafts;
        void deletedDraft;
        return remainingDrafts;
      });
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not delete the datasource.");
      return;
    }

    if (selectedId === dataSourceId) {
      setSelectedId(null);
      setEditor(newEditorDraft);
      setError(null);
    }
  };

  const handleGetDataSourceByName = async () => {
    const trimmedName = lookupName.trim();

    if (!trimmedName) {
      setError("Enter a datasource name to fetch.");
      return;
    }

    setIsLoading(true);
    setLoadMessage(null);

    try {
      const backendDataSource = await appWeaverApiClient.system.dataSources.get(trimmedName);
      const normalizedDataSource = normalizeBackendDataSource(trimmedName, backendDataSource);
      const nextDataSources = [
        normalizedDataSource,
        ...dataSources.filter((item) => item.key !== normalizedDataSource.key),
      ];

      replaceDataSources(nextDataSources);
      setSelectedId(normalizedDataSource.id);
      setEditorDrafts((currentDrafts) => ({
        ...currentDrafts,
        [normalizedDataSource.id]: createDataSourceEditorFromItem(normalizedDataSource),
      }));
      setEditor(createDataSourceEditorFromItem(normalizedDataSource));
      setError(null);
      setLoadMessage(`Loaded datasource "${normalizedDataSource.key}" from the backend.`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load that datasource from the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewDataSource = () => {
    setSelectedId(null);
    setEditor(newEditorDraft);
    setError(null);
    setLoadMessage(null);
  };

  const selectDataSourceTenant = (tenant: CreatedDataSourceTenant) => {
    setSelectedTenantId(tenant.id);
    setTenantName(tenant.tenantName);
    setTenantDataSourceKey(tenant.dataSourceKey);
    setError(null);
    setTenantMessage(null);
  };

  const handleNewDataSourceTenant = () => {
    setSelectedTenantId(null);
    setTenantName("");
    setTenantDataSourceKey(dataSources[0]?.key ?? "");
    setError(null);
    setTenantMessage(null);
  };

  const validateTenantEditor = () => {
    const trimmedTenantName = tenantName.trim();
    const trimmedDataSourceKey = tenantDataSourceKey.trim();

    if (!trimmedTenantName) {
      throw new Error("Tenant name is required.");
    }

    if (!trimmedDataSourceKey) {
      throw new Error("Select a datasource for the tenant.");
    }

    if (!dataSources.some((item) => item.key === trimmedDataSourceKey)) {
      throw new Error("Selected datasource is not available in the datasource list.");
    }

    return {
      tenantName: trimmedTenantName,
      dataSourceKey: trimmedDataSourceKey,
    };
  };

  const handleCreateDataSourceTenant = async () => {
    try {
      const payload = validateTenantEditor();

      if (dataSourceTenants.some((item) => item.tenantName === payload.tenantName)) {
        setError("A tenant mapping with that name already exists.");
        return;
      }

      await appWeaverApiClient.system.dataSourceTenants.create(
        payload.tenantName,
        payload.dataSourceKey,
      );
      const result = addDataSourceTenant(payload);

      if (!result.ok) {
        setError(result.reason);
        return;
      }

      setSelectedTenantId(null);
      setTenantName("");
      setTenantDataSourceKey(dataSources[0]?.key ?? "");
      setError(null);
      setTenantMessage(`Created tenant mapping "${payload.tenantName}".`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not create the datasource tenant mapping.");
    }
  };

  const handleUpdateDataSourceTenant = async () => {
    if (!selectedTenantId || !selectedTenant) {
      setError("Select a tenant mapping from the list to edit it.");
      return;
    }

    try {
      const payload = validateTenantEditor();

      if (
        dataSourceTenants.some(
          (item) => item.id !== selectedTenantId && item.tenantName === payload.tenantName,
        )
      ) {
        setError("A tenant mapping with that name already exists.");
        return;
      }

      if (payload.tenantName === selectedTenant.tenantName) {
        await appWeaverApiClient.system.dataSourceTenants.update(
          payload.tenantName,
          payload.dataSourceKey,
        );
      } else {
        await appWeaverApiClient.system.dataSourceTenants.create(
          payload.tenantName,
          payload.dataSourceKey,
        );
        await appWeaverApiClient.system.dataSourceTenants.remove(selectedTenant.tenantName);
      }

      const result = updateDataSourceTenant(selectedTenantId, payload);

      if (!result.ok) {
        setError(result.reason);
        return;
      }

      setError(null);
      setTenantMessage(`Updated tenant mapping "${payload.tenantName}".`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not update the datasource tenant mapping.");
    }
  };

  const handleDeleteDataSourceTenant = async (tenantId: string) => {
    const tenant = dataSourceTenants.find((item) => item.id === tenantId);

    if (!tenant) {
      return;
    }

    try {
      await appWeaverApiClient.system.dataSourceTenants.remove(tenant.tenantName);
      removeDataSourceTenant(tenantId);
      setTenantMessage(`Deleted tenant mapping "${tenant.tenantName}".`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not delete the datasource tenant mapping.");
      return;
    }

    if (selectedTenantId === tenantId) {
      handleNewDataSourceTenant();
    }
  };

  return (
    <>
      <div style={workspaceGridStyle}>
        <section style={workspacePanelStyle}>
          <SectionTitle
            title={selectedItem ? "Edit Datasource" : "Create Datasource"}
            subtitle="Create and manage datasource definitions from the AppWeaver backend."
          />
          <div
            style={{
              marginTop: 18,
              display: "grid",
              gap: 14,
              flex: 1,
              minHeight: 0,
              alignContent: "start",
              overflow: "auto",
              paddingRight: 6,
            }}
          >
            {(
              [
                ["Key", "key"],
                ["Driver", "driver"],
                ["Username", "username"],
                ["Password", "password"],
                ["URL", "url"],
                ["Package To Scan", "packageToScan"],
                ["L2 Cache Provider", "l2CacheProvider"],
              ] as const
            ).map(([label, key]) => (
              <label key={key} style={{ display: "grid", gap: 6 }}>
                <span style={fieldLabelStyle}>{label}</span>
                <input
                  value={editor[key]}
                  onChange={(event) =>
                    updateEditor((current) => ({ ...current, [key]: event.target.value }))
                  }
                  style={fieldStyle}
                />
              </label>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
              {(["maxPool", "minPool"] as const).map((key) => (
                <label key={key} style={{ display: "grid", gap: 6 }}>
                  <span style={fieldLabelStyle}>{key}</span>
                  <input
                    value={editor[key]}
                    onChange={(event) =>
                      updateEditor((current) => ({ ...current, [key]: event.target.value }))
                    }
                    style={fieldStyle}
                  />
                </label>
              ))}
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={fieldLabelStyle}>Strategy</span>
              <textarea
                value={editor.strategy}
                onChange={(event) => updateEditor((current) => ({ ...current, strategy: event.target.value }))}
                style={{ ...fieldStyle, minHeight: 140, resize: "vertical", fontFamily: "monospace" }}
              />
            </label>

            <div
              style={{
                borderTop: "1px solid rgba(203, 213, 225, 0.95)",
                paddingTop: 14,
                display: "grid",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={fieldLabelStyle}>Datasource Tenants</span>
                <button
                  type="button"
                  onClick={handleNewDataSourceTenant}
                  style={{ ...secondaryButtonStyle, padding: "8px 12px", fontSize: 12 }}
                >
                  New Tenant
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(180px, 0.8fr)", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={fieldLabelStyle}>Tenant Name</span>
                  <input
                    value={tenantName}
                    onChange={(event) => setTenantName(event.target.value)}
                    placeholder="tenantA"
                    style={fieldStyle}
                  />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={fieldLabelStyle}>Datasource</span>
                  <select
                    value={tenantDataSourceKey}
                    onChange={(event) => setTenantDataSourceKey(event.target.value)}
                    style={fieldStyle}
                  >
                    <option value="">Select datasource</option>
                    {dataSources.map((dataSource) => (
                      <option key={dataSource.id} value={dataSource.key}>
                        {dataSource.key}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => void handleCreateDataSourceTenant()}
                  style={primaryButtonStyle}
                >
                  Create Tenant Mapping
                </button>
                <button
                  type="button"
                  onClick={() => void handleUpdateDataSourceTenant()}
                  style={secondaryButtonStyle}
                >
                  Edit Tenant Mapping
                </button>
              </div>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            {error ? <p style={{ margin: 0, color: "#fca5a5", fontSize: 13 }}>{error}</p> : null}
            <div style={stickyActionBarStyle}>
              <button type="button" onClick={handleNewDataSource} style={secondaryButtonStyle}>
                New Datasource
              </button>
              <button type="button" onClick={() => void handleCreate()} style={primaryButtonStyle}>
                Create Datasource
              </button>
              <button
                type="button"
                onClick={() => void handleUpdate()}
                style={secondaryButtonStyle}
              >
                Edit Datasource
              </button>
            </div>
          </div>
        </section>

        <section style={workspacePanelStyle}>
          <SectionTitle
            title="List Datasources"
            subtitle="Click load to fetch the current datasource list from the backend."
          />
          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 10,
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={() => void loadDataSources()}
                disabled={isLoading}
                style={{
                  ...secondaryButtonStyle,
                  minHeight: 44,
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? "wait" : "pointer",
                }}
              >
                {isLoading ? "Loading Datasources" : "Load Datasources"}
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 10,
                alignItems: "center",
              }}
            >
              <input
                value={lookupName}
                onChange={(event) => setLookupName(event.target.value)}
                placeholder="datasource name"
                style={{ ...fieldStyle, minHeight: 44, padding: "9px 12px" }}
              />
              <button
                type="button"
                onClick={() => void handleGetDataSourceByName()}
                disabled={isLoading}
                style={{
                  ...secondaryButtonStyle,
                  minHeight: 44,
                  whiteSpace: "nowrap",
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? "wait" : "pointer",
                }}
              >
                Get By Name
              </button>
            </div>
            {loadMessage ? (
              <p style={{ margin: 0, color: "#166534", fontSize: 12, lineHeight: 1.5 }}>
                {loadMessage}
              </p>
            ) : null}
          </div>
          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              paddingRight: 6,
            }}
          >
            {dataSources.length > 0 ? (
              dataSources.map((item) => (
                <div
                  key={item.id}
                  style={{
                    position: "relative",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => selectDataSource(item)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      borderRadius: 16,
                      border:
                        item.id === selectedId
                          ? "1px solid rgba(96, 165, 250, 0.5)"
                          : "1px solid rgba(71, 85, 105, 0.3)",
                      background:
                        item.id === selectedId
                          ? "rgba(30, 64, 175, 0.18)"
                          : "rgba(255, 255, 255, 0.96)",
                      padding: "12px 46px 12px 16px",
                      color: "#0f172a",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>{item.key}</div>
                    <div style={listItemMetaStyle}>{item.url}</div>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${item.key}`}
                    onClick={() => void handleDelete(item.id)}
                    style={{
                      ...deleteIconButtonStyle,
                      position: "absolute",
                      top: "50%",
                      right: 12,
                      transform: "translateY(-50%)",
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: 14, height: 14 }}
                    >
                      <path d="M9 3.75h6a1 1 0 0 1 1 1V6H8V4.75a1 1 0 0 1 1-1Z" />
                      <path d="M4.75 6h14.5" />
                      <path d="M6.75 6.75 7.6 19a2 2 0 0 0 2 1.86h4.8a2 2 0 0 0 2-1.86l.85-12.25" />
                      <path d="M10 10.25v6.5" />
                      <path d="M14 10.25v6.5" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <div
                style={{
                  borderRadius: 16,
                  border: "1px dashed rgba(71, 85, 105, 0.45)",
                  padding: "18px 16px",
                  color: "#64748b",
                  textAlign: "center",
                }}
              >
                No datasources created yet.
              </div>
            )}
          </div>
          <div
            style={{
              marginTop: 18,
              borderTop: "1px solid rgba(203, 213, 225, 0.95)",
              paddingTop: 16,
              display: "grid",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={fieldLabelStyle}>Tenant Mappings</span>
              <button
                type="button"
                onClick={() => void loadDataSourceTenants()}
                disabled={isTenantLoading}
                style={{
                  ...secondaryButtonStyle,
                  padding: "8px 12px",
                  fontSize: 12,
                  opacity: isTenantLoading ? 0.7 : 1,
                  cursor: isTenantLoading ? "wait" : "pointer",
                }}
              >
                {isTenantLoading ? "Loading Tenants" : "Load Tenants"}
              </button>
            </div>
            {tenantMessage ? (
              <p style={{ margin: 0, color: "#166534", fontSize: 12, lineHeight: 1.5 }}>
                {tenantMessage}
              </p>
            ) : null}
            <div style={{ display: "grid", gap: 10, maxHeight: 240, overflow: "auto", paddingRight: 6 }}>
              {dataSourceTenants.length > 0 ? (
                dataSourceTenants.map((tenant) => (
                  <div key={tenant.id} style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => selectDataSourceTenant(tenant)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        borderRadius: 16,
                        border:
                          tenant.id === selectedTenantId
                            ? "1px solid rgba(96, 165, 250, 0.5)"
                            : "1px solid rgba(71, 85, 105, 0.3)",
                        background:
                          tenant.id === selectedTenantId
                            ? "rgba(30, 64, 175, 0.18)"
                            : "rgba(255, 255, 255, 0.96)",
                        padding: "12px 46px 12px 16px",
                        color: "#0f172a",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>
                        {tenant.tenantName}
                      </div>
                      <div style={listItemMetaStyle}>{tenant.dataSourceKey}</div>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete tenant mapping ${tenant.tenantName}`}
                      onClick={() => void handleDeleteDataSourceTenant(tenant.id)}
                      style={{
                        ...deleteIconButtonStyle,
                        position: "absolute",
                        top: "50%",
                        right: 12,
                        transform: "translateY(-50%)",
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ width: 14, height: 14 }}
                      >
                        <path d="M9 3.75h6a1 1 0 0 1 1 1V6H8V4.75a1 1 0 0 1 1-1Z" />
                        <path d="M4.75 6h14.5" />
                        <path d="M6.75 6.75 7.6 19a2 2 0 0 0 2 1.86h4.8a2 2 0 0 0 2-1.86l.85-12.25" />
                        <path d="M10 10.25v6.5" />
                        <path d="M14 10.25v6.5" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    borderRadius: 16,
                    border: "1px dashed rgba(71, 85, 105, 0.45)",
                    padding: "14px 16px",
                    color: "#64748b",
                    textAlign: "center",
                  }}
                >
                  No tenant mappings created yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function SecurityWorkspace() {
  const {
    selectedSecuritySubsection,
    selectSecuritySubsection,
    securityConfigs,
    addSecurityConfig,
    updateSecurityConfig,
    removeSecurityConfig,
  } = useFlowStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<SecurityEditorState>(() =>
    createSecurityEditorState(selectedSecuritySubsection),
  );
  const [error, setError] = useState<string | null>(null);
  const filteredConfigs = securityConfigs.filter(
    (item) => item.subsection === selectedSecuritySubsection,
  );
  const selectedItem = filteredConfigs.find((item) => item.id === selectedId) ?? null;
  const authPreview = useMemo(() => serializeAuthConfig(editor.authTenants), [editor.authTenants]);
  const authorizePreview = useMemo(
    () => serializeAuthorizeConfig(editor.authorizePolicy),
    [editor.authorizePolicy],
  );

  const handleSubsectionChange = (section: SecuritySubsection) => {
    selectSecuritySubsection(section);
    setSelectedId(null);
    setEditor(createSecurityEditorState(section));
    setError(null);
  };

  const validateAuthEditor = () => {
    if (editor.authTenants.length === 0) {
      throw new Error("Add at least one tenant.");
    }

    const tenantNames = new Set<string>();

    for (const tenant of editor.authTenants) {
      const tenantName = tenant.name.trim();

      if (!tenantName) {
        throw new Error("Each tenant needs a name.");
      }

      const normalizedTenantName = tenantName.toLowerCase();

      if (tenantNames.has(normalizedTenantName)) {
        throw new Error(`Duplicate tenant name: ${tenantName}`);
      }

      tenantNames.add(normalizedTenantName);

      if (!tenant.keyHeader.trim() || !tenant.secretHeader.trim()) {
        throw new Error(`Tenant ${tenantName} must include both key and secret headers.`);
      }

      if (tenant.clients.length === 0) {
        throw new Error(`Tenant ${tenantName} needs at least one client.`);
      }

      const clientNames = new Set<string>();

      for (const client of tenant.clients) {
        const clientName = client.name.trim();

        if (!clientName) {
          throw new Error(`Every client under ${tenantName} needs a name.`);
        }

        const normalizedClientName = clientName.toLowerCase();

        if (clientNames.has(normalizedClientName)) {
          throw new Error(`Duplicate client name "${clientName}" under tenant ${tenantName}.`);
        }

        clientNames.add(normalizedClientName);
      }
    }
  };

  const validateAuthorizeEditor = () => {
    const policyName = editor.authorizePolicy.policyName.trim();

    if (!policyName) {
      throw new Error("Policy name is required.");
    }

    if (editor.authorizePolicy.roles.length === 0) {
      throw new Error("Add at least one role.");
    }

    const roleNames = new Set<string>();

    for (const role of editor.authorizePolicy.roles) {
      const roleName = role.name.trim();

      if (!roleName) {
        throw new Error("Every role needs a name.");
      }

      const normalizedRoleName = roleName.toLowerCase();

      if (roleNames.has(normalizedRoleName)) {
        throw new Error(`Duplicate role name: ${roleName}`);
      }

      roleNames.add(normalizedRoleName);
    }

    if (editor.authorizePolicy.rules.length === 0) {
      throw new Error("Add at least one rule.");
    }

    for (const [ruleIndex, rule] of editor.authorizePolicy.rules.entries()) {
      if (rule.type === "ROLE") {
        if (!rule.roleId) {
          throw new Error(`Rule ${ruleIndex + 1} needs a role.`);
        }

        continue;
      }

      if (rule.roleIds.length === 0) {
        throw new Error(`Rule ${ruleIndex + 1} needs at least one role.`);
      }
    }
  };

  const getEditorContent = () => {
    if (selectedSecuritySubsection === "auth") {
      validateAuthEditor();
      return authPreview;
    }

    validateAuthorizeEditor();
    return authorizePreview;
  };

  const runAction = (
    action: (
      payload: Omit<CreatedSecurityConfig, "id">,
    ) => { ok: true } | { ok: false; reason: string },
  ) => {
    try {
      const nextContent = getEditorContent();

      const result = action({
        subsection: selectedSecuritySubsection,
        fileName: editor.fileName,
        content: nextContent,
      });

      if (!result.ok) {
        setError(result.reason);
        return;
      }

      setError(null);
    } catch (issue) {
      setError(
        issue instanceof Error
          ? issue.message
          : selectedSecuritySubsection === "auth"
            ? "Auth config is incomplete. Fill in the tenant and client details."
            : "Security config content must be valid JSON.",
      );
      return;
    }
  };

  const handleDelete = (configId: string) => {
    removeSecurityConfig(configId);

    if (selectedId === configId) {
      setSelectedId(null);
      setEditor(createSecurityEditorState(selectedSecuritySubsection));
      setError(null);
    }
  };

  return (
    <>
      <div style={workspaceGridStyle}>
        <section style={workspacePanelStyle}>
          <SectionTitle
            title={selectedItem ? "Edit Security Config" : "Create Security Config"}
            subtitle="Manage auth and authorize JSON files for security configuration."
          />
          <div
            style={{
              marginTop: 18,
              display: "grid",
              gap: 14,
              flex: 1,
              minHeight: 0,
              alignContent: "start",
              overflow: "auto",
              paddingRight: 6,
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, borderBottom: "1px solid rgba(226, 232, 240, 0.95)", paddingBottom: 2 }}>
              {(["auth", "authorize"] as const).map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => handleSubsectionChange(section)}
                  style={{
                    ...securitySubsectionButtonStyle,
                    color: selectedSecuritySubsection === section ? "var(--workflow-accent)" : "#475569",
                    borderBottom:
                      selectedSecuritySubsection === section
                        ? "2px solid var(--workflow-accent)"
                        : securitySubsectionButtonStyle.borderBottom,
                  }}
                >
                  {section}
                </button>
              ))}
            </div>

            {selectedSecuritySubsection === "auth" ? (
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span style={fieldLabelStyle}>Tenants</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditor((current) => ({
                        ...current,
                        authTenants: [
                          ...current.authTenants,
                          createAuthTenantEditorState({
                            name: `tenant${current.authTenants.length + 1}`,
                            clients: [
                              createAuthClientEditorState({
                                name: `apikey${current.authTenants.length + 1}`,
                              }),
                            ],
                          }),
                        ],
                      }))
                    }
                    style={iconButtonStyle}
                  >
                    +
                  </button>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {editor.authTenants.map((tenant, tenantIndex) => (
                    <div
                      key={tenant.id}
                      style={{
                        borderRadius: 16,
                        border: "1px solid rgba(71, 85, 105, 0.35)",
                        background: "rgba(248, 250, 252, 0.95)",
                        padding: 16,
                        display: "grid",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>
                          Tenant {tenantIndex + 1}
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove tenant ${tenantIndex + 1}`}
                          onClick={() =>
                            setEditor((current) => ({
                              ...current,
                              authTenants:
                                current.authTenants.length > 1
                                  ? current.authTenants.filter((item) => item.id !== tenant.id)
                                  : [createAuthTenantEditorState()],
                            }))
                          }
                          style={{ ...iconButtonStyle, width: 32, height: 32, borderRadius: 10 }}
                        >
                          -
                        </button>
                      </div>

                      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                        <label style={{ display: "grid", gap: 6 }}>
                          <span style={fieldLabelStyle}>Tenant Name</span>
                          <input
                            value={tenant.name}
                            onChange={(event) =>
                              setEditor((current) => ({
                                ...current,
                                authTenants: current.authTenants.map((item) =>
                                  item.id === tenant.id ? { ...item, name: event.target.value } : item,
                                ),
                              }))
                            }
                            placeholder="default"
                            style={fieldStyle}
                          />
                        </label>
                        <label style={{ display: "grid", gap: 6 }}>
                          <span style={fieldLabelStyle}>Key Header</span>
                          <input
                            value={tenant.keyHeader}
                            onChange={(event) =>
                              setEditor((current) => ({
                                ...current,
                                authTenants: current.authTenants.map((item) =>
                                  item.id === tenant.id ? { ...item, keyHeader: event.target.value } : item,
                                ),
                              }))
                            }
                            placeholder="x-api-key"
                            style={fieldStyle}
                          />
                        </label>
                        <label style={{ display: "grid", gap: 6 }}>
                          <span style={fieldLabelStyle}>Secret Header</span>
                          <input
                            value={tenant.secretHeader}
                            onChange={(event) =>
                              setEditor((current) => ({
                                ...current,
                                authTenants: current.authTenants.map((item) =>
                                  item.id === tenant.id ? { ...item, secretHeader: event.target.value } : item,
                                ),
                              }))
                            }
                            placeholder="x-api-secret"
                            style={fieldStyle}
                          />
                        </label>
                      </div>

                      <div style={{ display: "grid", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <span style={fieldLabelStyle}>Clients</span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditor((current) => ({
                                ...current,
                                authTenants: current.authTenants.map((item) =>
                                  item.id === tenant.id
                                    ? {
                                        ...item,
                                        clients: [
                                          ...item.clients,
                                          createAuthClientEditorState({
                                            name: `apikey${item.clients.length + 1}`,
                                          }),
                                        ],
                                      }
                                    : item,
                                ),
                              }))
                            }
                            style={iconButtonStyle}
                          >
                            +
                          </button>
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                          {tenant.clients.map((client, clientIndex) => (
                            <div
                              key={client.id}
                              style={{
                                borderRadius: 14,
                                border: "1px solid rgba(71, 85, 105, 0.3)",
                                background: "rgba(255, 255, 255, 0.98)",
                                padding: 14,
                                display: "grid",
                                gap: 10,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <span style={{ color: "#334155", fontSize: 13, fontWeight: 700 }}>
                                  Client {clientIndex + 1}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Remove client ${clientIndex + 1}`}
                                  onClick={() =>
                                    setEditor((current) => ({
                                      ...current,
                                      authTenants: current.authTenants.map((item) =>
                                        item.id === tenant.id
                                          ? {
                                              ...item,
                                              clients:
                                                item.clients.length > 1
                                                  ? item.clients.filter((clientItem) => clientItem.id !== client.id)
                                                  : [createAuthClientEditorState()],
                                            }
                                          : item,
                                      ),
                                    }))
                                  }
                                  style={{ ...iconButtonStyle, width: 30, height: 30, borderRadius: 10 }}
                                >
                                  -
                                </button>
                              </div>

                              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                                <label style={{ display: "grid", gap: 6 }}>
                                  <span style={fieldLabelStyle}>Client Name</span>
                                  <input
                                    value={client.name}
                                    onChange={(event) =>
                                      setEditor((current) => ({
                                        ...current,
                                        authTenants: current.authTenants.map((item) =>
                                          item.id === tenant.id
                                            ? {
                                                ...item,
                                                clients: item.clients.map((clientItem) =>
                                                  clientItem.id === client.id
                                                    ? { ...clientItem, name: event.target.value }
                                                    : clientItem,
                                                ),
                                              }
                                            : item,
                                        ),
                                      }))
                                    }
                                    placeholder="apikey1"
                                    style={fieldStyle}
                                  />
                                </label>
                                <label style={{ display: "grid", gap: 6 }}>
                                  <span style={fieldLabelStyle}>Secret</span>
                                  <input
                                    value={client.secret}
                                    onChange={(event) =>
                                      setEditor((current) => ({
                                        ...current,
                                        authTenants: current.authTenants.map((item) =>
                                          item.id === tenant.id
                                            ? {
                                                ...item,
                                                clients: item.clients.map((clientItem) =>
                                                  clientItem.id === client.id
                                                    ? { ...clientItem, secret: event.target.value }
                                                    : clientItem,
                                                ),
                                              }
                                            : item,
                                        ),
                                      }))
                                    }
                                    placeholder="client secret"
                                    style={fieldStyle}
                                  />
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 28, color: "#334155", fontSize: 13 }}>
                                  <input
                                    type="checkbox"
                                    checked={client.enabled}
                                    onChange={(event) =>
                                      setEditor((current) => ({
                                        ...current,
                                        authTenants: current.authTenants.map((item) =>
                                          item.id === tenant.id
                                            ? {
                                                ...item,
                                                clients: item.clients.map((clientItem) =>
                                                  clientItem.id === client.id
                                                    ? { ...clientItem, enabled: event.target.checked }
                                                    : clientItem,
                                                ),
                                              }
                                            : item,
                                        ),
                                      }))
                                    }
                                  />
                                  Enabled
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={fieldLabelStyle}>Generated JSON Preview</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(authPreview);
                          setError(null);
                        } catch {
                          setError("Could not copy the generated JSON preview.");
                        }
                      }}
                      style={{ ...secondaryButtonStyle, padding: "8px 12px", fontSize: 12 }}
                    >
                      Copy JSON
                    </button>
                  </div>
                  <textarea
                    value={authPreview}
                    readOnly
                    style={{ ...fieldStyle, minHeight: 220, resize: "vertical", fontFamily: "monospace" }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={fieldLabelStyle}>Policy Name</span>
                    <input
                      value={editor.authorizePolicy.policyName}
                      onChange={(event) =>
                        setEditor((current) => ({
                          ...current,
                          authorizePolicy: {
                            ...current.authorizePolicy,
                            policyName: event.target.value,
                          },
                        }))
                      }
                      placeholder="policy1"
                      style={fieldStyle}
                    />
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 28, color: "#334155", fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={editor.authorizePolicy.enabled}
                      onChange={(event) =>
                        setEditor((current) => ({
                          ...current,
                          authorizePolicy: {
                            ...current.authorizePolicy,
                            enabled: event.target.checked,
                          },
                        }))
                      }
                    />
                    Enabled
                  </label>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={fieldLabelStyle}>Roles</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditor((current) => {
                          const nextRole = createAuthorizeRoleEditorState(`role${current.authorizePolicy.roles.length + 1}`);

                          return {
                            ...current,
                            authorizePolicy: {
                              ...current.authorizePolicy,
                              roles: [...current.authorizePolicy.roles, nextRole],
                              roleHierarchy: {
                                ...current.authorizePolicy.roleHierarchy,
                                [nextRole.id]: [],
                              },
                            },
                          };
                        })
                      }
                      style={iconButtonStyle}
                    >
                      +
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {editor.authorizePolicy.roles.map((role, roleIndex) => (
                      <div
                        key={role.id}
                        style={{
                          borderRadius: 14,
                          border: "1px solid rgba(71, 85, 105, 0.3)",
                          background: "rgba(248, 250, 252, 0.95)",
                          padding: 14,
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <span style={{ color: "#334155", fontSize: 13, fontWeight: 700 }}>
                            Role {roleIndex + 1}
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove role ${roleIndex + 1}`}
                            onClick={() =>
                              setEditor((current) => {
                                const nextRoles =
                                  current.authorizePolicy.roles.length > 1
                                    ? current.authorizePolicy.roles.filter((item) => item.id !== role.id)
                                    : [createAuthorizeRoleEditorState("admin")];
                                const nextRoleIds = new Set(nextRoles.map((item) => item.id));
                                const nextHierarchy = Object.fromEntries(
                                  nextRoles.map((item) => [
                                    item.id,
                                    (current.authorizePolicy.roleHierarchy[item.id] ?? []).filter((childId) =>
                                      nextRoleIds.has(childId),
                                    ),
                                  ]),
                                );
                                const fallbackRoleId = nextRoles[0]?.id ?? "";

                                return {
                                  ...current,
                                  authorizePolicy: {
                                    ...current.authorizePolicy,
                                    roles: nextRoles,
                                    roleHierarchy: nextHierarchy,
                                    rules: current.authorizePolicy.rules.map((rule) => ({
                                      ...rule,
                                      roleId: nextRoleIds.has(rule.roleId) ? rule.roleId : fallbackRoleId,
                                      roleIds: rule.roleIds.filter((roleId) => nextRoleIds.has(roleId)),
                                    })),
                                  },
                                };
                              })
                            }
                            style={{ ...iconButtonStyle, width: 30, height: 30, borderRadius: 10 }}
                          >
                            -
                          </button>
                        </div>
                        <input
                          value={role.name}
                          onChange={(event) =>
                            setEditor((current) => ({
                              ...current,
                              authorizePolicy: {
                                ...current.authorizePolicy,
                                roles: current.authorizePolicy.roles.map((item) =>
                                  item.id === role.id ? { ...item, name: event.target.value } : item,
                                ),
                              },
                            }))
                          }
                          placeholder="admin"
                          style={fieldStyle}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <span style={fieldLabelStyle}>Role Hierarchy</span>
                  <div style={{ display: "grid", gap: 10 }}>
                    {editor.authorizePolicy.roles.map((role) => (
                      <div
                        key={role.id}
                        style={{
                          borderRadius: 14,
                          border: "1px solid rgba(71, 85, 105, 0.3)",
                          background: "rgba(255, 255, 255, 0.98)",
                          padding: 14,
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <span style={{ color: "#334155", fontSize: 13, fontWeight: 700 }}>
                          {role.name.trim() || "Unnamed role"} includes
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                          {editor.authorizePolicy.roles
                            .filter((childRole) => childRole.id !== role.id)
                            .map((childRole) => (
                              <label key={childRole.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#334155", fontSize: 13 }}>
                                <input
                                  type="checkbox"
                                  checked={(editor.authorizePolicy.roleHierarchy[role.id] ?? []).includes(childRole.id)}
                                  onChange={(event) =>
                                    setEditor((current) => {
                                      const currentChildren = current.authorizePolicy.roleHierarchy[role.id] ?? [];

                                      return {
                                        ...current,
                                        authorizePolicy: {
                                          ...current.authorizePolicy,
                                          roleHierarchy: {
                                            ...current.authorizePolicy.roleHierarchy,
                                            [role.id]: event.target.checked
                                              ? [...currentChildren, childRole.id]
                                              : currentChildren.filter((childId) => childId !== childRole.id),
                                          },
                                        },
                                      };
                                    })
                                  }
                                />
                                {childRole.name.trim() || "Unnamed role"}
                              </label>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={fieldLabelStyle}>Rules</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditor((current) => ({
                          ...current,
                          authorizePolicy: {
                            ...current.authorizePolicy,
                            rules: [
                              ...current.authorizePolicy.rules,
                              createAuthorizeRuleEditorState(current.authorizePolicy.roles[0]?.id ?? ""),
                            ],
                          },
                        }))
                      }
                      style={iconButtonStyle}
                    >
                      +
                    </button>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {editor.authorizePolicy.rules.map((rule, ruleIndex) => (
                      <div
                        key={rule.id}
                        style={{
                          borderRadius: 14,
                          border: "1px solid rgba(71, 85, 105, 0.3)",
                          background: "rgba(255, 255, 255, 0.98)",
                          padding: 14,
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <span style={{ color: "#334155", fontSize: 13, fontWeight: 700 }}>
                            Rule {ruleIndex + 1}
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove rule ${ruleIndex + 1}`}
                            onClick={() =>
                              setEditor((current) => ({
                                ...current,
                                authorizePolicy: {
                                  ...current.authorizePolicy,
                                  rules:
                                    current.authorizePolicy.rules.length > 1
                                      ? current.authorizePolicy.rules.filter((item) => item.id !== rule.id)
                                      : [createAuthorizeRuleEditorState(current.authorizePolicy.roles[0]?.id ?? "")],
                                },
                              }))
                            }
                            style={{ ...iconButtonStyle, width: 30, height: 30, borderRadius: 10 }}
                          >
                            -
                          </button>
                        </div>
                        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                          <label style={{ display: "grid", gap: 6 }}>
                            <span style={fieldLabelStyle}>Type</span>
                            <select
                              value={rule.type}
                              onChange={(event) =>
                                setEditor((current) => ({
                                  ...current,
                                  authorizePolicy: {
                                    ...current.authorizePolicy,
                                    rules: current.authorizePolicy.rules.map((item) =>
                                      item.id === rule.id
                                        ? { ...item, type: event.target.value as AuthorizeRuleType }
                                        : item,
                                    ),
                                  },
                                }))
                              }
                              style={fieldStyle}
                            >
                              {(["ROLE", "OR", "AND", "NOT"] as const).map((ruleType) => (
                                <option key={ruleType} value={ruleType}>
                                  {ruleType}
                                </option>
                              ))}
                            </select>
                          </label>

                          {rule.type === "ROLE" ? (
                            <label style={{ display: "grid", gap: 6 }}>
                              <span style={fieldLabelStyle}>Role</span>
                              <select
                                value={rule.roleId}
                                onChange={(event) =>
                                  setEditor((current) => ({
                                    ...current,
                                    authorizePolicy: {
                                      ...current.authorizePolicy,
                                      rules: current.authorizePolicy.rules.map((item) =>
                                        item.id === rule.id ? { ...item, roleId: event.target.value } : item,
                                      ),
                                    },
                                  }))
                                }
                                style={fieldStyle}
                              >
                                {editor.authorizePolicy.roles.map((role) => (
                                  <option key={role.id} value={role.id}>
                                    {role.name.trim() || "Unnamed role"}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : (
                            <div style={{ display: "grid", gap: 8 }}>
                              <span style={fieldLabelStyle}>Roles</span>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, minHeight: 44, alignItems: "center" }}>
                                {editor.authorizePolicy.roles.map((role) => (
                                  <label key={role.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#334155", fontSize: 13 }}>
                                    <input
                                      type="checkbox"
                                      checked={rule.roleIds.includes(role.id)}
                                      onChange={(event) =>
                                        setEditor((current) => ({
                                          ...current,
                                          authorizePolicy: {
                                            ...current.authorizePolicy,
                                            rules: current.authorizePolicy.rules.map((item) =>
                                              item.id === rule.id
                                                ? {
                                                    ...item,
                                                    roleIds: event.target.checked
                                                      ? [...item.roleIds, role.id]
                                                      : item.roleIds.filter((roleId) => roleId !== role.id),
                                                  }
                                                : item,
                                            ),
                                          },
                                        }))
                                      }
                                    />
                                    {role.name.trim() || "Unnamed role"}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={fieldLabelStyle}>Generated JSON Preview</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(authorizePreview);
                          setError(null);
                        } catch {
                          setError("Could not copy the generated JSON preview.");
                        }
                      }}
                      style={{ ...secondaryButtonStyle, padding: "8px 12px", fontSize: 12 }}
                    >
                      Copy JSON
                    </button>
                  </div>
                  <textarea
                    value={authorizePreview}
                    readOnly
                    style={{ ...fieldStyle, minHeight: 220, resize: "vertical", fontFamily: "monospace" }}
                  />
                </div>
              </div>
            )}
          </div>
          <div style={{ flexShrink: 0 }}>
            {error ? <p style={{ margin: 0, color: "#fca5a5", fontSize: 13 }}>{error}</p> : null}
            <div style={stickyActionBarStyle}>
              <button type="button" onClick={() => runAction(addSecurityConfig)} style={primaryButtonStyle}>
                Create Security Config
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedId) {
                    setError("Select a security config from the list to edit it.");
                    return;
                  }

                  runAction((payload) => updateSecurityConfig(selectedId, payload));
                }}
                style={secondaryButtonStyle}
              >
                Edit Security Config
              </button>
            </div>
          </div>
        </section>

        <section style={workspacePanelStyle}>
          <SectionTitle
            title="List Security Configs"
            subtitle="Auth and authorize files are grouped by subsection, like a config tree."
          />
          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              paddingRight: 6,
            }}
          >
            {(["auth", "authorize"] as const).map((section) => {
              const sectionItems = securityConfigs.filter((item) => item.subsection === section);

              return (
                <div key={section} style={{ display: "grid", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleSubsectionChange(section)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: selectedSecuritySubsection === section ? "var(--workflow-accent)" : "#475569",
                      padding: "0 0 8px",
                      textAlign: "left",
                      fontSize: 16,
                      lineHeight: "24px",
                      fontWeight: 500,
                      cursor: "pointer",
                      textTransform: "lowercase",
                      borderBottom: selectedSecuritySubsection === section ? "2px solid var(--workflow-accent)" : "2px solid transparent",
                      width: "fit-content",
                    }}
                  >
                    {section}
                  </button>
                  {sectionItems.length > 0 ? (
                    sectionItems.map((item) => (
                      <div key={item.id} style={{ position: "relative", marginLeft: 12 }}>
                        <button
                          type="button"
                          onClick={() => {
                            selectSecuritySubsection(item.subsection);
                            setSelectedId(item.id);
                            setEditor(createSecurityEditorFromItem(item));
                            setError(null);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            borderRadius: 16,
                            border:
                              item.id === selectedId
                                ? "1px solid rgba(96, 165, 250, 0.5)"
                                : "1px solid rgba(71, 85, 105, 0.3)",
                            background:
                              item.id === selectedId
                                ? "rgba(30, 64, 175, 0.18)"
                                : "rgba(255, 255, 255, 0.96)",
                            padding: "12px 46px 12px 16px",
                            color: "#0f172a",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>
                            {item.fileName}
                          </div>
                          <div style={listItemMetaStyle}>{item.subsection}</div>
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${item.fileName}`}
                          onClick={() => handleDelete(item.id)}
                          style={{
                            ...deleteIconButtonStyle,
                            position: "absolute",
                            top: "50%",
                            right: 12,
                            transform: "translateY(-50%)",
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ width: 14, height: 14 }}
                          >
                            <path d="M9 3.75h6a1 1 0 0 1 1 1V6H8V4.75a1 1 0 0 1 1-1Z" />
                            <path d="M4.75 6h14.5" />
                            <path d="M6.75 6.75 7.6 19a2 2 0 0 0 2 1.86h4.8a2 2 0 0 0 2-1.86l.85-12.25" />
                            <path d="M10 10.25v6.5" />
                            <path d="M14 10.25v6.5" />
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        marginLeft: 12,
                        borderRadius: 14,
                        border: "1px dashed rgba(71, 85, 105, 0.4)",
                        padding: "14px 16px",
                        color: "#64748b",
                        fontSize: 12,
                      }}
                    >
                      No {section} configs created yet.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  color: "#475569",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 8,
  background: "#10233f",
  color: "#ffffff",
  padding: "12px 16px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(16, 35, 63, 0.18)",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #10233f",
  borderRadius: 8,
  background: "#ffffff",
  color: "#10233f",
  padding: "12px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(16, 35, 63, 0.06)",
};

const stickyActionBarStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 16,
  paddingTop: 16,
  borderTop: "1px solid rgba(203, 213, 225, 0.95)",
  flexShrink: 0,
};

const securitySubsectionButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "#475569",
  padding: "0 4px 12px",
  fontSize: 16,
  lineHeight: "24px",
  fontWeight: 500,
  cursor: "pointer",
  textTransform: "lowercase",
  borderBottom: "2px solid transparent",
};

export default function ConfigurationWorkspace() {
  const { openSidebar, selectedConfigSection, selectedLlmSubsection } = useFlowStore();
  const pageMeta = useMemo(
    () =>
      selectedConfigSection === "beans"
        ? {
            title: "Bean Configuration"
          }
        : selectedConfigSection === "datasources"
          ? {
              title: "Datasource Configuration"
            }
          : selectedConfigSection === "llms"
            ? {
                title:
                  selectedLlmSubsection === "rag"
                    ? "LLM / RAG Configuration"
                    : "LLM / Provider Configuration"
              }
          : selectedConfigSection === "endpoints"
            ? {
                title: "Endpoints Configuration"
              }
          : {
              title: "Security Configuration"
            },
    [selectedConfigSection, selectedLlmSubsection],
  );

  return (
    <div style={pageStyle}>
      <section
        style={{
          ...panelStyle,
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#2DB780", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Configuration Workspace
          </span>
          <h1 className="app-heading-1" style={{ margin: 0, color: "#0f172a", letterSpacing: "-0.03em" }}>
            {pageMeta.title}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => openSidebar("components")}
          style={{
            ...secondaryButtonStyle,
            padding: "10px 14px",
            fontSize: 12,
          }}
        >
          Back To Builder
        </button>
      </section>

      {selectedConfigSection === "beans" ? (
        <BeansWorkspace />
      ) : selectedConfigSection === "datasources" ? (
        <DatasourcesWorkspace />
      ) : selectedConfigSection === "llms" ? (
        <LlmConfigurationWorkspace />
      ) : selectedConfigSection === "endpoints" ? (
        <EndpointsConfigurationWorkspace />
      ) : (
        <SecurityWorkspace />
      )}
    </div>
  );
}
