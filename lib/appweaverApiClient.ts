const DEFAULT_BASE_URL = "/api/appweaver";

export type AppWeaverDataSourceStrategy = {
  name: string;
  schema?: string | null;
};

export type AppWeaverDataSourceConfig = {
  name?: string;
  driver: string;
  username: string;
  password: string;
  url: string;
  maxPool: number;
  minPool: number;
  packageToScan?: string;
  strategy: AppWeaverDataSourceStrategy;
  l2CacheProvider?: string;
  enabled?: boolean;
};

export type AppWeaverDataSourceTenantMapping = Record<string, string>;

export type AppWeaverBeanConfig = {
  name?: string;
  className: string;
  constructorArgs?: unknown[];
  enabled?: boolean;
};

export type AppWeaverLlmProviderConfig = {
  id?: string;
  provider: string;
  model: string;
  baseUrl: string;
  apiKey?: string;
  templatePath: string;
  enableStreaming?: boolean;
};

export type AppWeaverRagConfig = {
  id?: string;
  embeddingModel: {
    provider: string;
    endpoint: string;
    modelName: string;
  };
  embeddingStore: {
    provider: string;
    endpoint?: string;
    apiKey?: string;
    indexName?: string;
    dimension?: number;
  };
};

export type AppWeaverPromptTemplate = {
  path: string;
  content: string;
};

export type AppWeaverPromptTemplateSummary = {
  path: string;
};

export type AppWeaverWorkflowConfig = {
  id?: string;
  name?: string;
  xml?: string;
  updatedAt?: string;
  workflowId: string;
  workflowName: string;
  bpmnXml: string;
  savedWorkflows?: AppWeaverWorkflowConfig[];
};

export type WorkflowActionDefinition = {
  id: string;
  label: string;
  kind: string;
  description: string;
  endpointTemplate: string;
  bpmnElementTypes: string[];
};

export type WorkflowActionRegistryResponse = {
  actions: WorkflowActionDefinition[];
};

export type AppWeaverRestRouteConfig = {
  enabled?: boolean;
  name: string;
  path: string;
  index?: number;
  description?: string;
  config?: {
    routeId?: string;
    method: string;
    path: string;
    to: string;
    rateLimiter?: string;
    policyName?: string;
    contentType?: string;
    enableCors?: boolean;
    virtualThreadEnabled?: boolean;
    description?: string;
  };
};

export type AppWeaverDirectRouteStep = {
  type: string;
  [key: string]: unknown;
};

export type AppWeaverDirectRouteConfig = {
  enabled?: boolean;
  name: string;
  path: string;
  index?: number;
  description?: string;
  config?: {
    routeId?: string;
    contentType?: string;
    from?: string;
    steps: AppWeaverDirectRouteStep[];
    [key: string]: unknown;
  };
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
};

export class AppWeaverApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AppWeaverApiError";
    this.status = status;
  }
}

const appWeaverEndpoints = {
  system: {
    beans: "/system/beans",
    bean: (name: string) => `/system/beans/${encodeURIComponent(name)}`,
    dataSources: "/system/datasource",
    dataSource: (name: string) => `/system/datasource/${encodeURIComponent(name)}`,
    dataSourceTenants: "/system/datasource/mapping/tenants",
    dataSourceTenant: (name: string) => `/system/datasource/mapping/tenants/${encodeURIComponent(name)}`,
    llmProviders: "/system/llm/provider",
    llmProvider: (id: string) => `/system/llm/provider/${encodeURIComponent(id)}`,
    llmRagConfigs: "/system/llm/rag",
    llmRagConfig: (id: string) => `/system/llm/rag/${encodeURIComponent(id)}`,
    promptTemplates: "/system/prompt-templates",
    promptTemplate: (path: string) => `/system/prompt-templates?path=${encodeURIComponent(path)}`,
    workflows: "/system/workflows",
    workflow: (workflowId: string) => `/system/workflows/${encodeURIComponent(workflowId)}`,
    workflowActions: "/system/workflow-actions",
    restRoutes: "/system/routes/rest-routes",
    restRoutesByPath: (path: string) =>
      `/system/routes/rest-routes?path=${encodeURIComponent(path)}`,
    restRoute: (name: string) => `/system/routes/rest-routes/${encodeURIComponent(name)}`,
    directRoutes: "/system/routes/direct-routes",
    directRoute: (name: string) => `/system/routes/direct-routes/${encodeURIComponent(name)}`,
  },
};

export function getAppWeaverApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_APPWEAVER_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

async function request<T>(path: string, requestOptions: RequestOptions = {}): Promise<T> {
  const headers = new Headers(requestOptions.headers);
  headers.set("Accept", headers.get("Accept") || "application/json");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), requestOptions.timeoutMs ?? 10000);

  let body: BodyInit | undefined;

  const { timeoutMs, ...fetchOptions } = requestOptions;
  void timeoutMs;

  if (fetchOptions.body !== undefined) {
    headers.set("Content-Type", headers.get("Content-Type") || "application/json");
    body = JSON.stringify(fetchOptions.body);
  }

  try {
    const response = await fetch(`${getAppWeaverApiBaseUrl()}${path}`, {
      ...fetchOptions,
      headers,
      body,
      signal: controller.signal,
    });

    const payload = await parseResponseBody(response);

    if (!response.ok && response.status !== 302) {
      throw createApiError(response, payload);
    }

    return payload as T;
  } catch (issue) {
    if (issue instanceof DOMException && issue.name === "AbortError") {
      throw new Error(`AppWeaver API request timed out after ${requestOptions.timeoutMs ?? 10000}ms.`);
    }

    throw issue;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function parseResponseBody(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return JSON.parse(text);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function createApiError(response: Response, payload: unknown) {
  const message =
    payload &&
    typeof payload === "object" &&
    ("message" in payload || "error" in payload)
      ? String(
          (payload as { message?: unknown; error?: unknown }).message ??
            (payload as { error?: unknown }).error,
        )
      : `AppWeaver API request failed with status ${response.status}`;

  return new AppWeaverApiError(message, response.status);
}

function normalizeBeanPayload(bean: AppWeaverBeanConfig): AppWeaverBeanConfig {
  return {
    constructorArgs: [],
    enabled: true,
    ...bean,
  };
}

function normalizeRestRoutePayload(route: AppWeaverRestRouteConfig): AppWeaverRestRouteConfig {
  const routeName = route.name.trim();
  const routePath = route.path.trim();
  const routeConfig = route.config;

  if (!routeConfig) {
    throw new Error("REST route config is required.");
  }

  const configPath = routeConfig.path.trim();
  const routeTarget = routeConfig.to.trim();

  return {
    enabled: route.enabled ?? true,
    name: routeName,
    path: routePath,
    index: route.index ?? 0,
    description: route.description?.trim() ?? "",
    config: {
      ...routeConfig,
      routeId: routeName,
      method: routeConfig.method.toLowerCase(),
      path: configPath,
      to: routeTarget,
      contentType: routeConfig.contentType?.trim() || "application/json",
      enableCors: routeConfig.enableCors ?? true,
      description: routeConfig.description?.trim() ?? route.description?.trim() ?? "",
    },
  };
}

function normalizeDirectRoutePayload(route: AppWeaverDirectRouteConfig): AppWeaverDirectRouteConfig {
  const routeName = route.name.trim();
  const routePath = route.path.trim();
  const routeConfig = route.config;

  if (!routeConfig) {
    throw new Error("Direct route config is required.");
  }

  if (!routeName) {
    throw new Error("Direct route name is required.");
  }

  return {
    enabled: route.enabled ?? true,
    name: routeName,
    path: routePath,
    index: route.index ?? 0,
    description: route.description?.trim() ?? "",
    config: {
      ...routeConfig,
      routeId: routeConfig.routeId?.trim() || routeName,
      from: routeConfig.from?.trim() ?? "",
      contentType: routeConfig.contentType?.trim() || "application/json",
      steps: routeConfig.steps,
    },
  };
}

function normalizePromptTemplatePayload(payload: unknown, fallbackPath: string): AppWeaverPromptTemplate {
  if (typeof payload === "string") {
    return { path: fallbackPath, content: payload };
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const template = payload as Record<string, unknown>;
    return {
      path: String(template.path ?? template.filePath ?? template.name ?? fallbackPath),
      content: String(template.content ?? template.template ?? template.body ?? ""),
    };
  }

  return { path: fallbackPath, content: "" };
}

function normalizeWorkflowPayload(payload: unknown, fallbackWorkflowId = ""): AppWeaverWorkflowConfig {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const workflow = payload as Record<string, unknown>;
    const workflowId = String(workflow.workflowId ?? workflow.id ?? fallbackWorkflowId);
    const workflowName = String(workflow.workflowName ?? workflow.name ?? workflowId);
    const bpmnXml = String(workflow.bpmnXml ?? workflow.xml ?? workflow.content ?? "");

    return {
      workflowId,
      workflowName,
      bpmnXml,
      savedWorkflows: normalizeWorkflowList(workflow.savedWorkflows),
    };
  }

  return {
    workflowId: fallbackWorkflowId,
    workflowName: fallbackWorkflowId,
    bpmnXml: typeof payload === "string" ? payload : "",
    savedWorkflows: [],
  };
}

function normalizeWorkflowList(payload: unknown): AppWeaverWorkflowConfig[] {
  const workflowsPayload =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? ((payload as Record<string, unknown>).savedWorkflows ??
        (payload as Record<string, unknown>).workflows ??
        (payload as Record<string, unknown>).value)
      : payload;

  if (!Array.isArray(workflowsPayload)) {
    return [];
  }

  return workflowsPayload
    .map((workflow) => normalizeWorkflowPayload(workflow))
    .filter((workflow) => workflow.workflowId.trim());
}

function normalizeWorkflowActionDefinition(payload: unknown): WorkflowActionDefinition | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const action = payload as Record<string, unknown>;
  const id = String(action.id ?? "").trim();

  if (!id) {
    return null;
  }

  return {
    id,
    label: String(action.label ?? id),
    kind: String(action.kind ?? ""),
    description: String(action.description ?? ""),
    endpointTemplate: String(action.endpointTemplate ?? ""),
    bpmnElementTypes: Array.isArray(action.bpmnElementTypes)
      ? action.bpmnElementTypes.map((type) => String(type)).filter(Boolean)
      : [],
  };
}

function normalizeWorkflowActionRegistry(payload: unknown): WorkflowActionRegistryResponse {
  const parsedPayload =
    typeof payload === "string"
      ? (() => {
          try {
            return JSON.parse(payload) as unknown;
          } catch {
            return payload;
          }
        })()
      : payload;
  const actionsPayload =
    parsedPayload && typeof parsedPayload === "object" && !Array.isArray(parsedPayload)
      ? ((parsedPayload as Record<string, unknown>).actions ??
        (parsedPayload as Record<string, unknown>).body ??
        (parsedPayload as Record<string, unknown>).value)
      : parsedPayload;

  if (
    actionsPayload &&
    typeof actionsPayload === "object" &&
    !Array.isArray(actionsPayload) &&
    "actions" in actionsPayload
  ) {
    return normalizeWorkflowActionRegistry((actionsPayload as Record<string, unknown>).actions);
  }

  if (!Array.isArray(actionsPayload)) {
    return { actions: [] };
  }

  return {
    actions: actionsPayload.flatMap((action) => {
      const normalizedAction = normalizeWorkflowActionDefinition(action);
      return normalizedAction ? [normalizedAction] : [];
    }),
  };
}

export const appWeaverApiClient = {
  system: {
    beans: {
      list: () => request<AppWeaverBeanConfig[]>(appWeaverEndpoints.system.beans),
      get: (name: string) => request<AppWeaverBeanConfig>(appWeaverEndpoints.system.bean(name)),
      create: (name: string, bean: AppWeaverBeanConfig) =>
        request<AppWeaverBeanConfig>(appWeaverEndpoints.system.beans, {
          method: "POST",
          body: normalizeBeanPayload({ ...bean, name }),
        }),
      update: (name: string, bean: AppWeaverBeanConfig) =>
        request<AppWeaverBeanConfig>(appWeaverEndpoints.system.bean(name), {
          method: "PUT",
          body: normalizeBeanPayload({ ...bean, name }),
        }),
      remove: (name: string) =>
        request<AppWeaverBeanConfig | null>(appWeaverEndpoints.system.bean(name), {
          method: "DELETE",
        }),
    },
    dataSources: {
      list: () =>
        request<Record<string, AppWeaverDataSourceConfig>>(
          appWeaverEndpoints.system.dataSources,
        ),
      get: (name: string) =>
        request<AppWeaverDataSourceConfig>(appWeaverEndpoints.system.dataSource(name)),
      create: (dataSource: AppWeaverDataSourceConfig) =>
        request<AppWeaverDataSourceConfig>(appWeaverEndpoints.system.dataSources, {
          method: "POST",
          body: dataSource,
        }),
      update: (name: string, dataSource: AppWeaverDataSourceConfig) =>
        request<AppWeaverDataSourceConfig>(appWeaverEndpoints.system.dataSource(name), {
          method: "PUT",
          body: { ...dataSource, name },
        }),
      remove: (name: string) =>
        request<AppWeaverDataSourceConfig | null>(appWeaverEndpoints.system.dataSource(name), {
          method: "DELETE",
        }),
    },
    dataSourceTenants: {
      list: () =>
        request<AppWeaverDataSourceTenantMapping>(
          appWeaverEndpoints.system.dataSourceTenants,
        ),
      create: (tenantName: string, dataSourceName: string) =>
        request<AppWeaverDataSourceTenantMapping>(appWeaverEndpoints.system.dataSourceTenants, {
          method: "POST",
          body: { [tenantName]: dataSourceName },
        }),
      update: (tenantName: string, dataSourceName: string) =>
        request<AppWeaverDataSourceTenantMapping>(appWeaverEndpoints.system.dataSourceTenant(tenantName), {
          method: "PUT",
          body: { [tenantName]: dataSourceName },
        }),
      remove: (tenantName: string) =>
        request<AppWeaverDataSourceTenantMapping | null>(
          appWeaverEndpoints.system.dataSourceTenant(tenantName),
          {
            method: "DELETE",
          },
        ),
    },
    llm: {
      providers: {
        list: () => request<AppWeaverLlmProviderConfig[]>(appWeaverEndpoints.system.llmProviders),
        get: (id: string) =>
          request<AppWeaverLlmProviderConfig>(appWeaverEndpoints.system.llmProvider(id)),
        create: (provider: AppWeaverLlmProviderConfig) =>
          request<AppWeaverLlmProviderConfig>(appWeaverEndpoints.system.llmProviders, {
            method: "POST",
            body: provider,
          }),
        update: (id: string, provider: AppWeaverLlmProviderConfig) =>
          request<AppWeaverLlmProviderConfig>(appWeaverEndpoints.system.llmProvider(id), {
            method: "PUT",
            body: { ...provider, id },
          }),
        remove: (id: string) =>
          request<AppWeaverLlmProviderConfig | null>(appWeaverEndpoints.system.llmProvider(id), {
            method: "DELETE",
          }),
      },
      rag: {
        list: () => request<AppWeaverRagConfig[]>(appWeaverEndpoints.system.llmRagConfigs),
        get: (id: string) =>
          request<AppWeaverRagConfig>(appWeaverEndpoints.system.llmRagConfig(id)),
        create: (ragConfig: AppWeaverRagConfig) =>
          request<AppWeaverRagConfig>(appWeaverEndpoints.system.llmRagConfigs, {
            method: "POST",
            body: ragConfig,
          }),
        update: (id: string, ragConfig: AppWeaverRagConfig) =>
          request<AppWeaverRagConfig>(appWeaverEndpoints.system.llmRagConfig(id), {
            method: "PUT",
            body: { ...ragConfig, id },
          }),
        remove: (id: string) =>
          request<AppWeaverRagConfig | null>(appWeaverEndpoints.system.llmRagConfig(id), {
            method: "DELETE",
          }),
      },
    },
    promptTemplates: {
      list: () => request<AppWeaverPromptTemplateSummary[]>("/prompt-template-files"),
      get: async (path: string) =>
        normalizePromptTemplatePayload(
          await request<unknown>(appWeaverEndpoints.system.promptTemplate(path)),
          path,
        ),
      create: async (template: AppWeaverPromptTemplate) =>
        normalizePromptTemplatePayload(
          await request<unknown>(appWeaverEndpoints.system.promptTemplates, {
            method: "POST",
            body: template,
          }),
          template.path,
        ),
      update: async (path: string, content: string) =>
        normalizePromptTemplatePayload(
          await request<unknown>(appWeaverEndpoints.system.promptTemplate(path), {
            method: "PUT",
            body: { path, content },
          }),
          path,
        ),
    },
    workflows: {
      list: async () =>
        normalizeWorkflowList(await request<unknown>(appWeaverEndpoints.system.workflows)),
      get: async (workflowId: string) =>
        normalizeWorkflowPayload(
          await request<unknown>(appWeaverEndpoints.system.workflow(workflowId)),
          workflowId,
        ),
      create: async (workflow: AppWeaverWorkflowConfig) =>
        normalizeWorkflowPayload(
          await request<unknown>(appWeaverEndpoints.system.workflows, {
            method: "POST",
            body: workflow,
          }),
          workflow.workflowId,
        ),
      update: async (workflowId: string, workflow: AppWeaverWorkflowConfig) =>
        normalizeWorkflowPayload(
          await request<unknown>(appWeaverEndpoints.system.workflow(workflowId), {
            method: "PUT",
            body: { ...workflow, workflowId },
          }),
          workflowId,
        ),
      remove: (workflowId: string) =>
        request<AppWeaverWorkflowConfig | null>(appWeaverEndpoints.system.workflow(workflowId), {
          method: "DELETE",
        }),
    },
    workflowActions: {
      list: async () =>
        normalizeWorkflowActionRegistry(
          await request<unknown>(appWeaverEndpoints.system.workflowActions),
        ),
    },
    restRoutes: {
      list: (path?: string) =>
        request<AppWeaverRestRouteConfig[]>(
          path?.trim()
            ? appWeaverEndpoints.system.restRoutesByPath(path.trim())
            : appWeaverEndpoints.system.restRoutes,
        ),
      get: (name: string) =>
        request<AppWeaverRestRouteConfig>(appWeaverEndpoints.system.restRoute(name)),
      create: (route: AppWeaverRestRouteConfig) =>
        request<AppWeaverRestRouteConfig>(appWeaverEndpoints.system.restRoutes, {
          method: "POST",
          body: normalizeRestRoutePayload(route),
        }),
      update: (name: string, route: AppWeaverRestRouteConfig) =>
        request<AppWeaverRestRouteConfig>(appWeaverEndpoints.system.restRoute(name), {
          method: "PUT",
          body: normalizeRestRoutePayload({ ...route, name }),
        }),
      remove: (name: string) =>
        request<AppWeaverRestRouteConfig | null>(appWeaverEndpoints.system.restRoute(name), {
          method: "DELETE",
        }),
    },
    directRoutes: {
      list: () =>
        request<AppWeaverDirectRouteConfig[]>(appWeaverEndpoints.system.directRoutes),
      get: (name: string) =>
        request<AppWeaverDirectRouteConfig>(appWeaverEndpoints.system.directRoute(name)),
      create: (route: AppWeaverDirectRouteConfig) =>
        request<AppWeaverDirectRouteConfig>(appWeaverEndpoints.system.directRoutes, {
          method: "POST",
          body: normalizeDirectRoutePayload(route),
        }),
      update: (name: string, route: AppWeaverDirectRouteConfig) =>
        request<AppWeaverDirectRouteConfig>(appWeaverEndpoints.system.directRoute(name), {
          method: "PUT",
          body: normalizeDirectRoutePayload({ ...route, name }),
        }),
    },
  },
};
