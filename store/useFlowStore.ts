import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Edge, Node, XYPosition } from "reactflow";
import {
  type MavenDependencyDefinition,
  type ComponentType,
  type BuiltInComponentType,
  isBuiltInComponent,
} from "@/config/componentCatalog";
import type { DataSourceStrategy } from "@/config/datasourceCatalog";
import type { AppWeaverDirectRouteConfig } from "@/lib/appweaverApiClient";

type InsertableNodeType = Exclude<ComponentType, "start">;
type SidebarView = "components" | "workflows" | "configs";
type ConfigSection = "beans" | "datasources" | "security" | "llms" | "endpoints" | "components";
type LlmSubsection = "providers" | "rag";
export type EndpointProtocol = "api" | "grpc" | "sse" | "ws";

export type SecuritySubsection = "global" | "policies" | "rateLimiters" | "auth" | "authorize";

type DbCrudOperation =
  | "create"
  | "batchInsert"
  | "readOne"
  | "readMany"
  | "update"
  | "delete"
  | "customSql";
type DbCrudOutput = "json" | "raw" | "none";

type DbCrudWhereCondition = {
  column: string;
  operator?: string;
  valueExpression: string;
  parameterName: string;
};

type DbCrudValueMapping = {
  column: string;
  valueExpression: string;
  parameterName: string;
};

type DbCrudParameterMapping = {
  name: string;
  expression: string;
};

export type CreatedBean = {
  id: string;
  name: string;
  className: string;
  constructorArgs: unknown[];
};

export type CreatedDataSource = {
  id: string;
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

export type CreatedDataSourceTenant = {
  id: string;
  tenantName: string;
  dataSourceKey: string;
};

export type CreatedSecurityConfig = {
  id: string;
  subsection: SecuritySubsection;
  fileName: string;
  content: string;
};

export type CreatedLlmConfig = {
  id: string;
  providerId: string;
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  templatePath: string;
};

export type CreatedRagConfig = {
  id: string;
  ragId: string;
  embeddingModelProvider: string;
  embeddingModelEndpoint: string;
  embeddingModelName: string;
  embeddingStoreProvider: string;
  embeddingStoreEndpoint: string;
  embeddingStoreApiKey: string;
  embeddingStoreIndexName: string;
  embeddingStoreDimension: string;
};

export type CreatedEndpointConfig = {
  id: string;
  protocol: EndpointProtocol;
  folderPath: string;
  fileName: string;
  content: string;
};

export type ComponentFieldControl = "text" | "textarea" | "select" | "checkbox";
export type ComponentFieldTarget = "config" | "properties";

export type ComponentFieldOption = {
  label: string;
  value: string;
};

export type ComponentFieldDefinition = {
  key: string;
  label: string;
  control: ComponentFieldControl;
  target?: ComponentFieldTarget;
  placeholder?: string;
  helperText?: string;
  options?: ComponentFieldOption[];
};

export type CreatedComponentTemplate = {
  id: string;
  type: string;
  label: string;
  description: string;
  color: string;
  fields: ComponentFieldDefinition[];
  config: Record<string, unknown>;
  dependencies: MavenDependencyDefinition[];
};

type AppNodeData = {
  label: string;
  config: Record<string, unknown>;
  componentKey?: string;
  description?: string;
  accentColor?: string;
  childCanvasId?: string;
  choiceBranchCanvasIds?: Record<string, string>;
};

type AppNode = Node<AppNodeData>;
type AppEdge = Edge;

type CanvasState = {
  id: string;
  name: string;
  nodes: AppNode[];
  edges: AppEdge[];
};

type WorkflowRecord = {
  id: string;
  name: string;
  rootCanvasId: string;
  currentCanvasId: string;
  canvasStack: string[];
  canvases: Record<string, CanvasState>;
  backendRoutePublication?: BackendRoutePublication;
};

type BackendRoutePublication = {
  routeName: string;
  lastSyncedSignature: string;
  syncedAt: string;
};

type WorkflowExport = {
  version: 2;
  workflowId: string;
  name: string;
  exportedAt: string;
  rootCanvasId: string;
  currentCanvasId: string;
  canvasStack: string[];
  canvases: Record<string, CanvasState>;
  backendRoutePublication?: BackendRoutePublication;
};

type BackendRouteStep = {
  type: string;
  [key: string]: unknown;
};

type BackendRouteConfigExport = {
  routeId: string;
  from: string;
  steps: BackendRouteStep[];
  contentType?: string;
  description?: string;
  onException?: unknown[];
};

type BackendRouteExport = {
  enabled: boolean;
  name: string;
  path: string;
  index: number;
  description: string;
  config: BackendRouteConfigExport;
};

type DirectRouteEditorSession = {
  route: AppWeaverDirectRouteConfig;
  sourceWorkflowId: string;
};

type RouteImportStep = {
  type?: string;
  disabled?: boolean;
  parameters?: Record<string, unknown>;
  name?: string;
  library?: string;
  clazz?: string;
  useList?: boolean;
  delimiter?: string;
  skipHeader?: boolean;
  useMap?: boolean;
  ref?: string;
  expression?: string;
  pattern?: string;
  excludePattern?: string;
  steps?: unknown;
  when?: unknown;
  otherwise?: unknown;
  splitBody?: boolean;
  splitClazz?: unknown;
  tokenize?: string;
  parallel?: boolean;
  streaming?: boolean;
  executorServiceRef?: string;
  enableParallelExecutorServiceRef?: boolean;
  useVirtualThread?: boolean;
  mapper?: unknown;
  data?: unknown;
  value?: unknown;
  message?: string;
  logLevel?: string;
  method?: string;
  constructorArgs?: unknown[];
  enableSecurityContext?: boolean;
  aggregationClazz?: unknown;
  aggregationStrategyClazz?: string;
  correlationExpression?: string;
  completionSize?: number;
  completionTimeOut?: number;
  routes?: unknown;
  isMap?: boolean;
  endpointType?: string;
  enrichStrategyClazz?: string;
  requestMapper?: unknown;
  responseMapper?: unknown;
  split?: boolean;
  parallelProcessing?: boolean;
  endpoint?: string;
  toD?: boolean;
  timeout?: number;
  contentType?: string;
  isInline?: boolean;
  converToByte?: boolean;
  rules?: unknown;
  validationStatusCode?: number;
  dependencies?: unknown;
};

type RouteImportDefinition = {
  routeId?: string;
  from?: string;
  contentType?: string;
  description?: string;
  onException?: unknown;
  steps?: RouteImportStep[];
};

type RouteImportEnvelope = {
  enabled?: boolean;
  name?: string;
  path?: string;
  index?: number;
  description?: string;
  config?: RouteImportDefinition;
};

type PersistedFlowState = {
  workflows?: Record<string, WorkflowRecord>;
  workflowOrder?: string[];
  activeWorkflowId?: string;
  canvases?: Record<string, CanvasState>;
  currentCanvasId?: string;
  canvasStack?: string[];
  isSidebarOpen?: boolean;
  sidebarView?: SidebarView;
  selectedConfigSection?: ConfigSection;
  selectedSecuritySubsection?: SecuritySubsection;
  selectedLlmSubsection?: LlmSubsection;
  beans?: CreatedBean[];
  dataSources?: CreatedDataSource[];
  dataSourceTenants?: CreatedDataSourceTenant[];
  securityConfigs?: CreatedSecurityConfig[];
  llmConfigs?: CreatedLlmConfig[];
  ragConfigs?: CreatedRagConfig[];
  endpointConfigs?: CreatedEndpointConfig[];
  customComponents?: CreatedComponentTemplate[];
};

type WorkflowDependency = MavenDependencyDefinition;

const DEFAULT_WORKFLOW_ID = "workflow-root";
const ROOT_CANVAS_ID = "root-canvas";
const DEFAULT_ENRICH_STRATEGY_CLASS =
  "com.bytestrone.appweaver.integration.core.aggregator.imp.EnrichAggregationStrategy";
const DEFAULT_SPLIT_AGGREGATION_STRATEGY_CLASS =
  "com.bytestrone.appweaver.integration.core.aggregator.imp.SourceTrackingAggregationStrategy";
const DEFAULT_AGGREGATION_STRATEGY_CLASS =
  "com.bytestrone.appweaver.integration.core.aggregator.imp.BatchAggregationStrategy";

function createStartNode(id: string, position: XYPosition): AppNode {
  return {
    id,
    type: "start",
    position,
    data: { label: "From", config: {} },
  };
}

function createCanvas(id: string, name: string): CanvasState {
  return {
    id,
    name,
    nodes: [createStartNode(`${id}-start`, { x: 160, y: 120 })],
    edges: [],
  };
}

function createStepOnlyCanvas(id: string, name: string): CanvasState {
  return {
    id,
    name,
    nodes: [],
    edges: [],
  };
}

function parseSqlEndpoint(endpoint: unknown) {
  const rawEndpoint = String(endpoint ?? "").trim();

  if (!rawEndpoint.toLowerCase().startsWith("sql:")) {
    return null;
  }

  const endpointBody = rawEndpoint.slice(4);
  const queryStart = endpointBody.indexOf("?");
  const sql = queryStart === -1 ? endpointBody : endpointBody.slice(0, queryStart);
  const query = queryStart === -1 ? "" : endpointBody.slice(queryStart + 1);
  const queryParameters = new URLSearchParams(query);

  return {
    sql: decodeURIComponent(sql).trim(),
    dataSource: queryParameters.get("dataSource") ?? undefined,
    batch: queryParameters.get("batch") ?? undefined,
  };
}

function isSqlToStep(step: RouteImportStep) {
  return step.type === "to" && Boolean(parseSqlEndpoint(step.endpoint));
}

function buildImportedDbCrudConfig(step: RouteImportStep) {
  const endpoint = parseSqlEndpoint(step.endpoint);
  const parameters = isPlainRecord(step.parameters) ? step.parameters : {};
  const dataSource =
    String(parameters.dataSource ?? endpoint?.dataSource ?? "").trim() || "#dataSource";
  const batchValue = parameters.batch ?? endpoint?.batch;

  return {
    operation: "customSql",
    customSql: endpoint?.sql ?? "",
    dataSource,
    output: "raw",
    logSql: false,
    disabled: Boolean(step.disabled),
    parameters: [],
    dependencies: normalizeDependencyList(step.dependencies),
    ...(batchValue === true || String(batchValue).toLowerCase() === "true"
      ? { batch: true }
      : {}),
  };
}

function getRouteStepComponentKey(step: RouteImportStep): BuiltInComponentType | null {
  if (step.type === "to" && step.endpoint === "smart-router") {
    return "smartRouter";
  }

  if (step.type === "to" && step.endpoint === "agent:chat") {
    return "agent";
  }

  if (isSqlToStep(step)) {
    return "dbCrud";
  }

  return step.type && isBuiltInComponent(step.type) ? step.type : null;
}

function createCanvasFromBackendSteps(
  id: string,
  name: string,
  steps: unknown,
  options: { includeStart?: boolean } = {},
): CanvasState {
  const includeStart = options.includeStart ?? true;
  const canvas = includeStart ? createCanvas(id, name) : createStepOnlyCanvas(id, name);

  if (!Array.isArray(steps)) {
    return canvas;
  }

  const startNode = includeStart ? canvas.nodes[0] : null;
  const nodes: AppNode[] = startNode ? [startNode] : [];
  const edges: AppEdge[] = [];
  let previousNodeId = startNode?.id ?? null;
  let previousNodePosition = startNode?.position ?? null;

  steps.forEach((rawStep, index) => {
    if (!isPlainRecord(rawStep) || typeof rawStep.type !== "string") {
      return;
    }

    const step = rawStep as RouteImportStep;
    const componentKey = getRouteStepComponentKey(step);

    if (!componentKey || componentKey === "start") {
      return;
    }

    const node = createFlowNode(componentKey, getRouteCanvasPosition(includeStart ? index + 1 : index));
    const label =
      componentKey === "dbCrud"
        ? "SQL"
        : typeof step.name === "string" && step.name.trim()
        ? step.name
        : typeof step.ref === "string" && step.ref.trim()
          ? step.ref
          : node.data.label;
    const importedConfig =
      componentKey === "dbCrud"
        ? buildImportedDbCrudConfig(step)
        : {
            ...node.data.config,
            ...step,
            disabled: Boolean(step.disabled),
            parameters: step.parameters ?? {},
            dependencies: normalizeDependencyList(step.dependencies),
          };

    node.data = {
      ...node.data,
      label,
      config: importedConfig,
    };

    nodes.push(node);
    if (previousNodeId && previousNodePosition) {
      edges.push({
        id: `${previousNodeId}-${node.id}`,
        source: previousNodeId,
        target: node.id,
        ...getRouteEdgeHandles(previousNodePosition, node.position),
        type: "insertable",
      });
    }

    previousNodeId = node.id;
    previousNodePosition = node.position;
  });

  return {
    ...canvas,
    nodes,
    edges,
  };
}

function getChoiceWhenBranchKey(index: number) {
  return `when-${index}`;
}

function getChoiceBranchName(node: AppNode, branchKey: string) {
  if (branchKey === "otherwise") {
    return `${node.data?.label || "Choice"}: Otherwise`;
  }

  const match = branchKey.match(/^when-(\d+)$/);
  const branchIndex = match ? Number(match[1]) : 0;
  const when = Array.isArray(node.data?.config?.when) ? node.data.config.when : [];
  const branch = when[branchIndex];
  const expression =
    branch && typeof branch === "object" && !Array.isArray(branch)
      ? String((branch as Record<string, unknown>).expression ?? "").trim()
      : "";

  return `${node.data?.label || "Choice"}: When ${branchIndex + 1}${expression ? ` (${expression})` : ""}`;
}

function getChoiceBranchFallbackSteps(node: AppNode, branchKey: string) {
  if (branchKey === "otherwise") {
    return node.data?.config?.otherwise;
  }

  const match = branchKey.match(/^when-(\d+)$/);
  const branchIndex = match ? Number(match[1]) : 0;
  const when = Array.isArray(node.data?.config?.when) ? node.data.config.when : [];
  const branch = when[branchIndex];

  return branch && typeof branch === "object" && !Array.isArray(branch)
    ? (branch as Record<string, unknown>).steps
    : [];
}

function getSplitCanvasName(node: AppNode) {
  return `${node.data?.label || "Split"}: Steps`;
}

function getNodeNestedCanvasIds(node: AppNode): string[] {
  return [
    ...(node.data?.childCanvasId ? [node.data.childCanvasId] : []),
    ...Object.values(node.data?.choiceBranchCanvasIds ?? {}),
  ];
}

function isChoiceBranchCanvas(workflow: WorkflowRecord, canvasId: string) {
  return Object.values(workflow.canvases).some((canvas) =>
    canvas.nodes.some((node) =>
      Object.values(node.data?.choiceBranchCanvasIds ?? {}).includes(canvasId),
    ),
  );
}

function createInitialWorkflow(id = DEFAULT_WORKFLOW_ID, name = "Root"): WorkflowRecord {
  return {
    id,
    name,
    rootCanvasId: ROOT_CANVAS_ID,
    currentCanvasId: ROOT_CANVAS_ID,
    canvasStack: [ROOT_CANVAS_ID],
    canvases: {
      [ROOT_CANVAS_ID]: createCanvas(ROOT_CANVAS_ID, name),
    },
  };
}

function createFlowNode(
  componentKey: ComponentType,
  position: XYPosition,
  customComponents: CreatedComponentTemplate[] = [],
): AppNode {
  const customComponent = customComponents.find((component) => component.type === componentKey);

  if (!isBuiltInComponent(componentKey) && !customComponent) {
    throw new Error(`Unsupported component type: ${componentKey}`);
  }

  const builtInType = isBuiltInComponent(componentKey) ? componentKey : "process";
  const id = `${componentKey}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const labelMap: Record<BuiltInComponentType, string> = {
    start: "From",
    marshal: "Marshal",
    unmarshal: "Unmarshal",
    setBody: "Set Body",
    setHeader: "Set Header",
    removeHeaders: "Remove Headers",
    setProperty: "Set Property",
    setContext: "Set Context",
    globalOption: "Global Option",
    convertBodyTo: "Convert Body",
    transform: "Transform",
    filter: "Filter",
    choice: "Choice",
    routeContainer: "Nested Route",
    split: "Split",
    dynamicroute: "Dynamic Route",
    validate: "Validate",
    process: "Process",
    bean: "Bean",
    to: "To",
    toD: "To Dynamic",
    upload: "Upload",
    download: "Download",
    enrich: "Enrich",
    dbCrud: "SQL",
    smartRouter: "Smart Router",
    agent: "Agent",
    workflow: "Workflow",
    aggregation: "Aggregation",
    delay: "Delay",
    log: "Log",
  };
  const defaultConfigMap: Partial<Record<BuiltInComponentType, Record<string, unknown>>> = {
    marshal: {
      disabled: false,
      name: "json",
      useList: false,
    },
    unmarshal: {
      disabled: false,
      name: "json",
      library: "Jackson",
      clazz: "java.util.Map",
      useList: false,
      delimiter: ",",
      skipHeader: false,
      useMap: false,
    },
    setBody: {
      disabled: false,
      name: "setBody",
      expression: "${body}",
    },
    setHeader: {
      disabled: false,
      name: "Content-Type",
      expression: "application/json",
    },
    removeHeaders: {
      disabled: false,
      pattern: "CamelHttp*",
      excludePattern: "",
    },
    setProperty: {
      disabled: false,
      name: "propertyName",
      expression: "${body}",
    },
    setContext: {
      disabled: false,
      name: "contextKey",
      expression: "",
      value: "",
    },
    globalOption: {
      disabled: false,
      name: "optionName",
      expression: "${body}",
    },
    convertBodyTo: {
      disabled: false,
      clazz: "java.lang.String",
    },
    transform: {
      disabled: false,
      name: "simple",
      expression: "${body}",
      mapper: {},
    },
    filter: {
      disabled: false,
      expression: "${body} != null",
      clazz: "",
      steps: [],
    },
    choice: {
      disabled: false,
      when: [
        {
          expression: "${body} != null",
          steps: [],
        },
      ],
      otherwise: [],
    },
    routeContainer: {
      disabled: false,
      backendType: "route",
      routeId: "nestedRoute",
      from: "direct:nestedRoute",
      contentType: "application/json",
      description: "",
    },
    split: {
      disabled: false,
      splitBody: true,
      expression: "",
      tokenize: "",
      parallel: false,
      streaming: true,
      useVirtualThread: false,
      enableParallelExecutorServiceRef: false,
      executorServiceRef: "",
      aggregationMode: "object",
      aggregationStrategyClazz: "",
      aggregationClazz: {
        clazz: DEFAULT_AGGREGATION_STRATEGY_CLASS,
        parameters: {},
      },
      completionSize: undefined,
      completionTimeOut: undefined,
      steps: [],
    },
    dynamicroute: {
      disabled: false,
      clazz: "com.example.DynamicRouter",
      routes: [],
      isMap: true,
    },
    validate: {
      disabled: false,
      rules: [
        {
          expression: "body != null",
          errorMessage: "Request body is required",
        },
      ],
      validationStatusCode: 400,
    },
    process: {
      disabled: false,
      ref: "processorRef",
      clazz: "",
      parameters: {},
    },
    bean: {
      disabled: false,
      ref: "beanRef",
      clazz: "",
      method: "",
      constructorArgs: [],
      enableSecurityContext: false,
    },
    to: {
      disabled: false,
      endpoint: "direct:next",
      parameters: {},
    },
    toD: {
      disabled: false,
      endpoint: "direct:${header.nextEndpoint}",
      parameters: {},
    },
    upload: {
      disabled: false,
      endpoint: "file:uploads",
      parameters: {},
    },
    download: {
      disabled: false,
      endpoint: "file:downloads",
      timeout: 5000,
      contentType: "application/octet-stream",
      isInline: false,
      converToByte: false,
      parameters: {},
    },
    enrich: {
      disabled: false,
      endpoint: "direct:lookup",
      endpointType: "NONE",
      enrichStrategyClazz: DEFAULT_ENRICH_STRATEGY_CLASS,
      requestMapper: {},
      responseMapper: {},
      split: false,
      parallelProcessing: false,
      aggregationStrategyClazz: DEFAULT_SPLIT_AGGREGATION_STRATEGY_CLASS,
    },
    dbCrud: {
      disabled: false,
      operation: "customSql",
      dataSource: "#dataSource",
      table: "users",
      columns: ["id", "name", "email", "tenant_id"],
      where: [
        {
          column: "id",
          operator: "=",
          valueExpression: "${header.id}",
          parameterName: "id",
        },
      ],
      values: [
        {
          column: "name",
          valueExpression: "${body['name']}",
          parameterName: "name",
        },
        {
          column: "email",
          valueExpression: "${body['email']}",
          parameterName: "email",
        },
        {
          column: "tenant_id",
          valueExpression: "${body['tenant_id']}",
          parameterName: "tenant_id",
        },
      ],
      customSql: "select * from users where id = :#id",
      parameters: [
        {
          name: "id",
          expression: "${header.id}",
        },
      ],
      output: "json",
      logSql: false,
    },
    smartRouter: {
      disabled: false,
      protocol: "http",
      url: "http://localhost:8080/api/gateway/test",
      method: "post",
      contentType: "application/json",
      headerParams: "",
      queryParams: "",
      enableTransformation: true,
      payloadTransformer: "#joltPayloadTransformer",
      transformerConfig: "simple-transform",
      soapAction: "",
    },
    agent: {
      disabled: false,
      tag: "agent-direct",
      llmId: "azure_gpt-4o-mini",
      chatSettingsId: "default",
      ragId: "",
      promptTemplate: "/agents/commonAgent.md",
    },
    workflow: {
      workflowId: "bpmn-default",
      workflowName: "BPMN Workflow",
      bpmnXml: "",
      savedWorkflows: [],
    },
    aggregation: {
      disabled: false,
      aggregationClazz: {
        clazz: DEFAULT_AGGREGATION_STRATEGY_CLASS,
        parameters: {},
      },
      correlationExpression: "${header.correlationId}",
      completionSize: 10,
      completionTimeOut: 5000,
    },
    delay: {
      disabled: false,
      expression: "1000",
    },
    log: {
      disabled: false,
      message: "Processing exchange",
      name: "DEFAULT",
      logLevel: "INFO",
    },
  };

  const node: AppNode = {
    id,
    type: customComponent ? "customStep" : builtInType,
    position,
    data: {
      label: customComponent?.label ?? labelMap[builtInType],
      config: customComponent
        ? {
            disabled: false,
            ...customComponent.config,
            dependencies: customComponent.dependencies,
          }
        : defaultConfigMap[builtInType] ?? {},
      componentKey,
      description: customComponent?.description,
      accentColor: customComponent?.color,
    },
  };

  return node;
}

function removeCanvasSubtree(
  canvases: Record<string, CanvasState>,
  canvasId: string,
): Record<string, CanvasState> {
  const canvas = canvases[canvasId];

  if (!canvas) {
    return canvases;
  }

  let nextCanvases = { ...canvases };

  for (const node of canvas.nodes) {
    for (const childCanvasId of getNodeNestedCanvasIds(node)) {
      if (childCanvasId) {
        nextCanvases = removeCanvasSubtree(nextCanvases, childCanvasId);
      }
    }
  }

  delete nextCanvases[canvasId];
  return nextCanvases;
}

function pruneDeprecatedNodesFromCanvases(
  canvases: Record<string, CanvasState>,
  shouldRemove: (node: AppNode) => boolean,
): Record<string, CanvasState> {
  let nextCanvases = { ...canvases };

  for (const [canvasId, canvas] of Object.entries(canvases)) {
    const nodesToDelete = canvas.nodes.filter(shouldRemove);
    let nextCanvasMap = nextCanvases;

    for (const node of nodesToDelete) {
      for (const childCanvasId of getNodeNestedCanvasIds(node)) {
        nextCanvasMap = removeCanvasSubtree(nextCanvasMap, childCanvasId);
      }
    }

    nextCanvases = {
      ...nextCanvasMap,
      [canvasId]: {
        ...canvas,
        nodes: canvas.nodes.filter((node) => !shouldRemove(node)),
        edges: canvas.edges.filter((edge) => {
          const sourceNode = canvas.nodes.find((node) => node.id === edge.source);
          const targetNode = canvas.nodes.find((node) => node.id === edge.target);

          return !sourceNode || !targetNode || (!shouldRemove(sourceNode) && !shouldRemove(targetNode));
        }),
      },
    };
  }

  return nextCanvases;
}

function sanitizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createWorkflowId(name: string) {
  return `workflow-${sanitizeName(name) || Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

function dedupeWorkflowName(
  name: string,
  workflows: Record<string, WorkflowRecord>,
  excludeWorkflowId?: string,
) {
  const baseName = name.trim() || "Workflow";
  const takenNames = new Set(
    Object.values(workflows)
      .filter((workflow) => workflow.id !== excludeWorkflowId)
      .map((workflow) => workflow.name),
  );

  if (!takenNames.has(baseName)) {
    return baseName;
  }

  let suffix = 2;

  while (takenNames.has(`${baseName} (${suffix})`)) {
    suffix += 1;
  }

  return `${baseName} (${suffix})`;
}

function normalizeImportedWorkflow(
  raw: unknown,
  existingWorkflows: Record<string, WorkflowRecord>,
  fallbackName: string,
): WorkflowRecord | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Partial<WorkflowExport>;
  const canvases = candidate.canvases;

  if (!canvases || typeof canvases !== "object") {
    return null;
  }

  const rootCanvasId =
    typeof candidate.rootCanvasId === "string" && candidate.rootCanvasId in canvases
      ? candidate.rootCanvasId
      : Object.keys(canvases)[0];

  if (!rootCanvasId) {
    return null;
  }

  const workflowNameSource =
    typeof candidate.name === "string" && candidate.name.trim().length > 0
      ? candidate.name
      : typeof canvases[rootCanvasId]?.name === "string"
        ? canvases[rootCanvasId].name
        : fallbackName;
  const workflowName = dedupeWorkflowName(workflowNameSource, existingWorkflows);
  const workflowId = createWorkflowId(workflowName);
  const currentCanvasId =
    typeof candidate.currentCanvasId === "string" &&
    candidate.currentCanvasId in canvases
      ? candidate.currentCanvasId
      : rootCanvasId;
  const canvasStack = Array.isArray(candidate.canvasStack)
    ? candidate.canvasStack.filter(
        (canvasId): canvasId is string =>
          typeof canvasId === "string" && canvasId in canvases,
      )
    : [];

  return {
    id: workflowId,
    name: workflowName,
    rootCanvasId,
    currentCanvasId,
    canvasStack:
      canvasStack.length > 0 && canvasStack[canvasStack.length - 1] === currentCanvasId
        ? canvasStack
        : [rootCanvasId],
    canvases,
    ...(candidate.backendRoutePublication
      ? { backendRoutePublication: candidate.backendRoutePublication }
      : {}),
  };
}

function normalizeDependencyList(raw: unknown): WorkflowDependency[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((item): item is WorkflowDependency => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const candidate = item as Partial<WorkflowDependency>;

    return (
      typeof candidate.groupId === "string" &&
      candidate.groupId.trim().length > 0 &&
      typeof candidate.artifactId === "string" &&
      candidate.artifactId.trim().length > 0 &&
      typeof candidate.version === "string" &&
      candidate.version.trim().length > 0
    );
  });
}

function isValidHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value.trim());
}

function normalizeComponentTemplate(
  template: Omit<CreatedComponentTemplate, "id">,
): Omit<CreatedComponentTemplate, "id"> | { error: string } {
  const type = template.type.trim();
  const label = template.label.trim();

  if (!type) {
    return { error: "Component type is required." };
  }

  if (!/^[a-z][a-z0-9-]*$/i.test(type)) {
    return { error: "Component type can only use letters, numbers, and hyphens." };
  }

  if (isBuiltInComponent(type) || type === "customStep") {
    return { error: "That component type is reserved by the built-in catalog." };
  }

  if (!label) {
    return { error: "Component label is required." };
  }

  if (!isValidHexColor(template.color)) {
    return { error: "Component color must be a six-digit hex value, such as #14b8a6." };
  }

  const fieldKeys = new Set<string>();
  type FieldValidationResult = ComponentFieldDefinition | { error: string };
  const fields: FieldValidationResult[] = template.fields.map((field) => {
    const key = field.key.trim();
    const fieldLabel = field.label.trim();

    if (!key) {
      return { error: "Every field needs a key." };
    }

    if (fieldKeys.has(key)) {
      return { error: `Duplicate field key: ${key}.` };
    }

    if (!["text", "textarea", "select", "checkbox"].includes(field.control)) {
      return { error: `Unsupported control for ${key}.` };
    }

    const target = "target" in field && field.target === "properties" ? field.target : "config";

    if (field.control === "select" && (!field.options || field.options.length === 0)) {
      return { error: `Select field ${key} needs at least one option.` };
    }

    fieldKeys.add(key);

    return {
      key,
      label: fieldLabel || key,
      control: field.control,
      ...(target === "properties" ? { target } : {}),
      ...(field.placeholder?.trim() ? { placeholder: field.placeholder.trim() } : {}),
      ...(field.helperText?.trim() ? { helperText: field.helperText.trim() } : {}),
      ...(field.control === "select"
        ? {
            options: (field.options ?? [])
              .map((option) => ({
                label: option.label.trim() || option.value.trim(),
                value: option.value.trim(),
              }))
              .filter((option) => option.value),
          }
        : {}),
    };
  });
  const invalidField = fields.find((field): field is { error: string } => "error" in field);

  if (invalidField) {
    return { error: invalidField.error };
  }

  const normalizedFields = fields.filter(
    (field): field is ComponentFieldDefinition => !("error" in field),
  );

  return {
    type,
    label,
    description: template.description.trim(),
    color: template.color.trim(),
    fields: normalizedFields,
    config:
      template.config && typeof template.config === "object" && !Array.isArray(template.config)
        ? template.config
        : {},
    dependencies: normalizeDependencyList(template.dependencies),
  };
}

function stripBackendConfig(config: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!config) {
    return {};
  }

  const backendConfig = { ...config };
  delete backendConfig.dependencies;

  if (backendConfig.disabled === false) {
    delete backendConfig.disabled;
  }

  if (
    backendConfig.parameters &&
    typeof backendConfig.parameters === "object" &&
    !Array.isArray(backendConfig.parameters) &&
    Object.keys(backendConfig.parameters).length === 0
  ) {
    delete backendConfig.parameters;
  }

  return backendConfig;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function removeBlankStringField(config: Record<string, unknown>, field: string) {
  if (typeof config[field] === "string" && !config[field].trim()) {
    delete config[field];
  }
}

function compactStringParameters(
  params: Record<string, unknown>,
  fields: string[],
): Record<string, unknown> {
  const compacted = { ...params };

  fields.forEach((field) => removeBlankStringField(compacted, field));

  return compacted;
}

function buildSmartRouterBackendStep(config: Record<string, unknown> | undefined): BackendRouteStep {
  const smartConfig = stripBackendConfig(config);
  const enableTransformation = smartConfig.enableTransformation !== false;
  const parameters = compactStringParameters(
    {
      protocol: smartConfig.protocol ?? "http",
      url: smartConfig.url ?? "",
      method: smartConfig.method ?? "post",
      contentType: smartConfig.contentType ?? "application/json",
      headerParams: smartConfig.headerParams ?? "",
      queryParams: smartConfig.queryParams ?? "",
      ...(enableTransformation
        ? {
            payloadTransformer: smartConfig.payloadTransformer ?? "#joltPayloadTransformer",
            transformerConfig: smartConfig.transformerConfig ?? "",
          }
        : {}),
      ...(String(smartConfig.protocol ?? "http") === "soap"
        ? { soapAction: smartConfig.soapAction ?? "" }
        : {}),
    },
    [
      "url",
      "method",
      "contentType",
      "headerParams",
      "queryParams",
      "payloadTransformer",
      "transformerConfig",
      "soapAction",
    ],
  );

  return {
    type: "to",
    endpoint: "smart-router",
    parameters,
  };
}

function buildAgentBackendStep(config: Record<string, unknown> | undefined): BackendRouteStep {
  const agentConfig = stripBackendConfig(config);
  const parameters = compactStringParameters(
    {
      tag: String(agentConfig.tag ?? "").trim() || "default",
      llmId: agentConfig.llmId ?? "",
      chatSettingsId: agentConfig.chatSettingsId ?? "",
      ragId: agentConfig.ragId ?? "",
      promptTemplate: agentConfig.promptTemplate ?? "",
    },
    ["llmId", "chatSettingsId", "ragId", "promptTemplate"],
  );

  return {
    type: "to",
    endpoint: "agent:chat",
    parameters,
  };
}

function buildRouteContainerBackendStep(
  workflow: WorkflowRecord,
  node: AppNode,
): BackendRouteStep {
  const routeConfig = stripBackendConfig(node.data?.config);
  const childCanvas =
    node.data?.childCanvasId ? workflow.canvases[node.data.childCanvasId] : null;
  const steps = childCanvas ? buildBackendStepsFromCanvas(workflow, childCanvas) : [];
  const backendType = String(routeConfig.backendType ?? "route").trim() || "route";
  const routeId = String(routeConfig.routeId ?? node.data?.label ?? "nestedRoute").trim();
  const from = String(routeConfig.from ?? "").trim();
  const contentType = String(routeConfig.contentType ?? "").trim();
  const description = String(routeConfig.description ?? "").trim();

  return {
    type: backendType,
    ...(routeId ? { routeId } : {}),
    ...(from ? { from } : {}),
    ...(contentType ? { contentType } : {}),
    ...(description ? { description } : {}),
    steps,
  };
}

function getChoiceBranchSteps(
  workflow: WorkflowRecord,
  node: AppNode,
  branchKey: string,
  fallbackSteps: unknown,
) {
  const branchCanvasId = node.data?.choiceBranchCanvasIds?.[branchKey];
  const branchCanvas = branchCanvasId ? workflow.canvases[branchCanvasId] : null;

  if (branchCanvas) {
    return buildBackendStepsFromCanvas(workflow, branchCanvas);
  }

  return Array.isArray(fallbackSteps) ? fallbackSteps : [];
}

function buildChoiceBackendStep(workflow: WorkflowRecord, node: AppNode): BackendRouteStep {
  const choiceConfig = stripBackendConfig(node.data?.config);
  const when = Array.isArray(choiceConfig.when)
    ? choiceConfig.when.filter(
        (item) =>
          isPlainRecord(item) &&
          typeof item.expression === "string" &&
          item.expression.trim().length > 0,
      )
    : [];
  const otherwise = getChoiceBranchSteps(
    workflow,
    node,
    "otherwise",
    choiceConfig.otherwise,
  );
  const nextConfig = { ...choiceConfig };

  if (when.length > 0) {
    nextConfig.when = when.map((item, index) => ({
      ...item,
      steps: getChoiceBranchSteps(workflow, node, getChoiceWhenBranchKey(index), item.steps),
    }));
  } else {
    delete nextConfig.when;
  }

  if (otherwise.length > 0) {
    nextConfig.otherwise = otherwise;
  } else {
    delete nextConfig.otherwise;
  }

  return {
    type: "choice",
    ...nextConfig,
  };
}

function buildSplitBackendStep(workflow: WorkflowRecord, node: AppNode): BackendRouteStep {
  const splitConfig = stripBackendStepConfig("split", node.data?.config);
  const childCanvas =
    node.data?.childCanvasId ? workflow.canvases[node.data.childCanvasId] : null;
  const steps = childCanvas
    ? buildBackendStepsFromCanvas(workflow, childCanvas)
    : Array.isArray(splitConfig.steps)
      ? splitConfig.steps
      : [];

  if (steps.length > 0) {
    splitConfig.steps = steps;
  } else {
    delete splitConfig.steps;
  }

  return {
    type: "split",
    ...splitConfig,
  };
}

function stripBackendStepConfig(
  componentType: string,
  config: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const backendConfig = stripBackendConfig(config);

  if (componentType === "bean" || componentType === "process") {
    const executableConfig = { ...backendConfig };

    if (typeof executableConfig.ref === "string" && !executableConfig.ref.trim()) {
      delete executableConfig.ref;
    }

    if (typeof executableConfig.clazz === "string" && !executableConfig.clazz.trim()) {
      delete executableConfig.clazz;
    }

    if (componentType === "bean" && typeof executableConfig.method === "string" && !executableConfig.method.trim()) {
      delete executableConfig.method;
    }

    return executableConfig;
  }

  if (componentType === "aggregation") {
    const aggregationConfig = { ...backendConfig };
    const rawAggregationClazz = aggregationConfig.aggregationClazz;
    const directClazz =
      typeof aggregationConfig.clazz === "string" && aggregationConfig.clazz.trim()
        ? aggregationConfig.clazz
        : isPlainRecord(rawAggregationClazz) &&
            typeof rawAggregationClazz.clazz === "string" &&
            rawAggregationClazz.clazz.trim()
          ? rawAggregationClazz.clazz
          : DEFAULT_AGGREGATION_STRATEGY_CLASS;

    removeBlankStringField(aggregationConfig, "correlationExpression");

    if (isPlainRecord(rawAggregationClazz)) {
      const nextAggregationClazz = { ...rawAggregationClazz };
      if (
        typeof nextAggregationClazz.clazz !== "string" ||
        !nextAggregationClazz.clazz.trim()
      ) {
        nextAggregationClazz.clazz = DEFAULT_AGGREGATION_STRATEGY_CLASS;
      }
      nextAggregationClazz.parameters = isPlainRecord(nextAggregationClazz.parameters)
        ? nextAggregationClazz.parameters
        : {};
      aggregationConfig.aggregationClazz = nextAggregationClazz;
    } else if (typeof aggregationConfig.clazz === "string" && aggregationConfig.clazz.trim()) {
      aggregationConfig.aggregationClazz = {
        clazz: aggregationConfig.clazz,
        parameters: isPlainRecord(aggregationConfig.parameters) ? aggregationConfig.parameters : {},
      };
    } else {
      aggregationConfig.aggregationClazz = {
        clazz: DEFAULT_AGGREGATION_STRATEGY_CLASS,
        parameters: isPlainRecord(aggregationConfig.parameters) ? aggregationConfig.parameters : {},
      };
    }

    aggregationConfig.clazz = directClazz;

    if (typeof aggregationConfig.completionSize !== "number" || !Number.isFinite(aggregationConfig.completionSize)) {
      delete aggregationConfig.completionSize;
    }

    if (
      typeof aggregationConfig.completionTimeOut !== "number" ||
      !Number.isFinite(aggregationConfig.completionTimeOut)
    ) {
      delete aggregationConfig.completionTimeOut;
    }

    return aggregationConfig;
  }

  if (componentType === "dynamicroute") {
    const dynamicRouteConfig = { ...backendConfig };
    removeBlankStringField(dynamicRouteConfig, "clazz");

    if (!Array.isArray(dynamicRouteConfig.routes)) {
      dynamicRouteConfig.routes = [];
    }

    if (typeof dynamicRouteConfig.isMap !== "boolean") {
      dynamicRouteConfig.isMap = true;
    }

    return dynamicRouteConfig;
  }

  if (componentType === "filter") {
    const filterConfig = { ...backendConfig };
    removeBlankStringField(filterConfig, "clazz");

    if (!Array.isArray(filterConfig.steps) || filterConfig.steps.length === 0) {
      delete filterConfig.steps;
    }

    return filterConfig;
  }

  if (componentType === "removeHeaders") {
    const removeHeadersConfig = { ...backendConfig };
    removeBlankStringField(removeHeadersConfig, "pattern");
    removeBlankStringField(removeHeadersConfig, "excludePattern");

    return removeHeadersConfig;
  }

  if (componentType === "choice") {
    const choiceConfig = { ...backendConfig };
    const when = Array.isArray(choiceConfig.when)
      ? choiceConfig.when.filter(
          (item) =>
            isPlainRecord(item) &&
            typeof item.expression === "string" &&
            item.expression.trim().length > 0,
        )
      : [];

    if (when.length > 0) {
      choiceConfig.when = when.map((item) => ({
        ...item,
        steps: Array.isArray(item.steps) ? item.steps : [],
      }));
    } else {
      delete choiceConfig.when;
    }

    if (!Array.isArray(choiceConfig.otherwise) || choiceConfig.otherwise.length === 0) {
      delete choiceConfig.otherwise;
    }

    return choiceConfig;
  }

  if (componentType === "split") {
    const splitConfig = { ...backendConfig };
    const aggregationMode = String(splitConfig.aggregationMode ?? "").trim();
    const usesExplicitSplitSource =
      Boolean(splitConfig.expression) ||
      Boolean(splitConfig.tokenize) ||
      isPlainRecord(splitConfig.splitClazz);

    removeBlankStringField(splitConfig, "expression");
    removeBlankStringField(splitConfig, "tokenize");
    removeBlankStringField(splitConfig, "executorServiceRef");
    removeBlankStringField(splitConfig, "aggregationStrategyClazz");
    delete splitConfig.aggregationMode;

    if (!isPlainRecord(splitConfig.splitClazz)) {
      delete splitConfig.splitClazz;
    }

    if (usesExplicitSplitSource || splitConfig.splitBody !== true) {
      delete splitConfig.splitBody;
    }

    if (aggregationMode === "none") {
      delete splitConfig.aggregationClazz;
      delete splitConfig.aggregationStrategyClazz;
    } else if (aggregationMode === "strategy") {
      if (typeof splitConfig.aggregationStrategyClazz !== "string" || !splitConfig.aggregationStrategyClazz.trim()) {
        delete splitConfig.aggregationStrategyClazz;
      }
      if (!isPlainRecord(splitConfig.aggregationClazz)) {
        delete splitConfig.aggregationClazz;
      }
    } else if (!isPlainRecord(splitConfig.aggregationClazz)) {
      delete splitConfig.aggregationClazz;
    }

    if (!Array.isArray(splitConfig.steps)) {
      splitConfig.steps = [];
    }

    if (typeof splitConfig.completionSize !== "number" || !Number.isFinite(splitConfig.completionSize)) {
      delete splitConfig.completionSize;
    }

    if (
      typeof splitConfig.completionTimeOut !== "number" ||
      !Number.isFinite(splitConfig.completionTimeOut)
    ) {
      delete splitConfig.completionTimeOut;
    }

    return splitConfig;
  }

  if (componentType === "enrich") {
    const enrichConfig = { ...backendConfig };

    if (typeof enrichConfig.enrichStrategyClazz !== "string" || !enrichConfig.enrichStrategyClazz.trim()) {
      enrichConfig.enrichStrategyClazz = DEFAULT_ENRICH_STRATEGY_CLASS;
    }

    if (!["NONE", "REST", "DB"].includes(String(enrichConfig.endpointType ?? ""))) {
      enrichConfig.endpointType = "NONE";
    }

    enrichConfig.requestMapper = isPlainRecord(enrichConfig.requestMapper) ? enrichConfig.requestMapper : {};
    enrichConfig.responseMapper = isPlainRecord(enrichConfig.responseMapper) ? enrichConfig.responseMapper : {};

    if (enrichConfig.split === true) {
      if (
        typeof enrichConfig.aggregationStrategyClazz !== "string" ||
        !enrichConfig.aggregationStrategyClazz.trim()
      ) {
        enrichConfig.aggregationStrategyClazz = DEFAULT_SPLIT_AGGREGATION_STRATEGY_CLASS;
      }
    } else {
      delete enrichConfig.aggregationStrategyClazz;
      delete enrichConfig.parallelProcessing;
    }

    return enrichConfig;
  }

  if (componentType !== "marshal") {
    return backendConfig;
  }

  const marshalConfig: Record<string, unknown> = {
    name: typeof backendConfig.name === "string" && backendConfig.name.trim() ? backendConfig.name : "json",
  };

  if (typeof backendConfig.useList === "boolean") {
    marshalConfig.useList = backendConfig.useList;
  }

  if (backendConfig.disabled === true) {
    marshalConfig.disabled = true;
  }

  if (backendConfig.parameters !== undefined) {
    marshalConfig.parameters = backendConfig.parameters;
  }

  return marshalConfig;
}

function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function parseObjectList<T extends Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value)
    ? value.filter((item): item is T => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    : [];
}

function appendDefaultTenantValueMapping(values: DbCrudValueMapping[]) {
  const hasTenantId = values.some(
    (item) => item.column === "tenant_id" || item.parameterName === "tenant_id",
  );

  if (hasTenantId) {
    return values;
  }

  return [
    ...values,
    {
      column: "tenant_id",
      valueExpression: "${body['tenant_id']}",
      parameterName: "tenant_id",
    },
  ];
}

function normalizeDbCrudValueExpression(
  expression: string,
  mapping: { parameterName?: string; name?: string; column?: string },
) {
  const trimmedExpression = expression.trim();
  const mappingName = String(mapping.parameterName ?? mapping.name ?? mapping.column ?? "").trim();

  if (
    mappingName === "tenant_id" &&
    (trimmedExpression === "${header.tenantId}" || trimmedExpression === "${body[tenantId]}")
  ) {
    return "${body['tenant_id']}";
  }

  return trimmedExpression.replace(
    /\$\{body\[([A-Za-z_][A-Za-z0-9_]*)\]\}/g,
    "${body['$1']}",
  );
}

function getDbCrudIdentifier(value: unknown, fallback = "") {
  const raw = String(value ?? fallback).trim();
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(raw) ? raw : "";
}

function getDbCrudTableIdentifier(value: unknown, fallback = "") {
  const raw = String(value ?? fallback).trim();
  return /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/.test(raw) ? raw : "";
}

function getDbCrudParameterName(value: unknown, fallback: string) {
  const raw = String(value ?? fallback).trim();
  const sanitized = raw.replace(/[^A-Za-z0-9_]/g, "");
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(sanitized) ? sanitized : fallback;
}

function normalizeDbCrudDataSource(value: unknown) {
  const dataSource = String(value ?? "#dataSource").trim();
  return dataSource || "#dataSource";
}

function buildDbCrudWhereSql(where: DbCrudWhereCondition[]) {
  const conditions = where
    .map((item) => {
      const column = getDbCrudIdentifier(item.column);
      const parameterName = getDbCrudParameterName(item.parameterName, column);
      const operator = ["=", "!=", "<>", ">", ">=", "<", "<=", "like"].includes(
        String(item.operator ?? "=").trim().toLowerCase(),
      )
        ? String(item.operator ?? "=").trim()
        : "=";

      return column && parameterName ? `${column} ${operator} :#${parameterName}` : "";
    })
    .filter(Boolean);

  return conditions.length > 0 ? ` where ${conditions.join(" and ")}` : "";
}

function buildDbCrudHeaderSteps(
  mappings: Array<{ parameterName?: string; name?: string; valueExpression?: string; expression?: string; column?: string }>,
): BackendRouteStep[] {
  const seen = new Set<string>();

  return mappings.flatMap((item) => {
    const fallback = item.column ? String(item.column) : "param";
    const name = getDbCrudParameterName(item.parameterName ?? item.name, fallback);
    const expression = normalizeDbCrudValueExpression(
      String(item.valueExpression ?? item.expression ?? ""),
      item,
    );

    if (!name || !expression || seen.has(name)) {
      return [];
    }

    seen.add(name);
    return [{ type: "setHeader", name, expression }];
  });
}

function appendDbCrudOutputSteps(output: DbCrudOutput, successStatus: string | null): BackendRouteStep[] {
  if (output === "json") {
    return [{ type: "marshal", name: "json" }];
  }

  if (output === "none") {
    return [];
  }

  return successStatus ? [{ type: "setBody", expression: `{"status":"${successStatus}"}` }] : [];
}

function buildDbCrudBackendSteps(config: Record<string, unknown> | undefined): BackendRouteStep[] {
  const dbConfig = config ?? {};
  const operation = String(dbConfig.operation ?? "customSql") as DbCrudOperation;
  const dataSource = normalizeDbCrudDataSource(dbConfig.dataSource);
  const output = String(dbConfig.output ?? "json") as DbCrudOutput;
  const table = getDbCrudTableIdentifier(dbConfig.table);
  const columns = parseStringList(dbConfig.columns);
  const where = parseObjectList<DbCrudWhereCondition>(dbConfig.where);
  const configuredValues = parseObjectList<DbCrudValueMapping>(dbConfig.values);
  const values =
    operation === "create" || operation === "batchInsert"
      ? appendDefaultTenantValueMapping(configuredValues)
      : configuredValues;
  const parameters = parseObjectList<DbCrudParameterMapping>(dbConfig.parameters);
  const selectedColumns = columns.map((column) => getDbCrudIdentifier(column)).filter(Boolean);
  const columnSql = selectedColumns.length > 0 ? selectedColumns.join(", ") : "*";
  const headers = buildDbCrudHeaderSteps([...where, ...values, ...parameters]);
  const logSql = dbConfig.logSql === true;
  let sql = "";
  let successStatus: string | null = null;

  if (operation === "customSql") {
    sql = String(dbConfig.customSql ?? "").trim();
  } else if ((operation === "create" || operation === "batchInsert") && table) {
    const validValues = values
      .map((item) => ({
        column: getDbCrudIdentifier(item.column),
        parameterName: getDbCrudParameterName(item.parameterName, item.column),
      }))
      .filter((item) => item.column && item.parameterName);

    if (validValues.length > 0) {
      sql = `insert into ${table}(${validValues.map((item) => item.column).join(", ")}) values (${validValues
        .map((item) => `:#${item.parameterName}`)
        .join(", ")})`;
      successStatus = operation === "batchInsert" ? "batch inserted" : "created";
    }
  } else if ((operation === "readOne" || operation === "readMany") && table) {
    const limit =
      operation === "readMany" && typeof dbConfig.limit === "number" && Number.isFinite(dbConfig.limit)
        ? ` limit ${Math.max(1, Math.floor(dbConfig.limit))}`
        : "";
    sql = `select ${columnSql} from ${table}${buildDbCrudWhereSql(where)}${limit}`;
  } else if (operation === "update" && table) {
    const validValues = values
      .map((item) => ({
        column: getDbCrudIdentifier(item.column),
        parameterName: getDbCrudParameterName(item.parameterName, item.column),
      }))
      .filter((item) => item.column && item.parameterName);

    sql = `update ${table} set ${validValues
      .map((item) => `${item.column} = :#${item.parameterName}`)
      .join(", ")}${buildDbCrudWhereSql(where)}`;
    successStatus = "updated";
  } else if (operation === "delete" && table) {
    sql = `delete from ${table}${buildDbCrudWhereSql(where)}`;
    successStatus = "deleted";
  }

  if (!sql) {
    return [
      {
        type: "log",
        message: "SQL step is incomplete; configure SQL/table and mappings before publishing.",
        logLevel: "WARN",
      },
    ];
  }

  const endpoint = `sql:${sql}`;
  const querySteps: BackendRouteStep[] = [
    ...headers,
    {
      type: "to",
      endpoint,
      parameters: {
        dataSource,
        batch: operation === "batchInsert" || dbConfig.batch === true,
      },
    },
    ...(logSql ? [{ type: "log", message: "Executed SQL operation result: ${body}" }] : []),
  ];

  return [...querySteps, ...appendDbCrudOutputSteps(output, successStatus)];
}

function stringValueOrDefault(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberValueOrDefault(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function buildDefaultRouteName(routeId: string) {
  const trimmedRouteId = routeId.trim();

  if (!trimmedRouteId) {
    return "route";
  }

  return `${trimmedRouteId.charAt(0).toLowerCase()}${trimmedRouteId.slice(1)}Route`;
}

function getRouteFromMode(config: Record<string, unknown>) {
  const configuredMode = String(config.fromMode ?? "").trim();

  if (configuredMode === "normal") {
    return "normal";
  }

  if (configuredMode === "direct") {
    return "direct";
  }

  const from = String(config.from ?? "").trim();
  return from && !from.startsWith("direct:") ? "normal" : "direct";
}

function buildFromEndpoint(routeId: string, fromMode: string) {
  const trimmedRouteId = routeId.trim();

  if (!trimmedRouteId) {
    return "";
  }

  return fromMode === "normal" ? trimmedRouteId : `direct:${trimmedRouteId}`;
}

function getRouteOrderedNodes(canvas: CanvasState): AppNode[] {
  const startNode = canvas.nodes.find((node) => node.type === "start") ?? null;
  const nonStartNodes = canvas.nodes.filter((node) => node.type !== "start");
  const nodeMap = new Map(canvas.nodes.map((node) => [node.id, node]));
  const orderedNodes: AppNode[] = [];
  const visited = new Set<string>();

  const visitNode = (node: AppNode) => {
    if (visited.has(node.id)) {
      return;
    }

    visited.add(node.id);
    orderedNodes.push(node);
    visitNext(node.id);
  };

  const visitNext = (nodeId: string) => {
    const outgoingEdges = canvas.edges.filter((edge) => edge.source === nodeId);

    for (const edge of outgoingEdges) {
      if (!edge.target || visited.has(edge.target)) {
        continue;
      }

      const targetNode = nodeMap.get(edge.target);

      if (!targetNode || targetNode.type === "start") {
        continue;
      }

      visitNode(targetNode);
    }
  };

  if (startNode) {
    visitNext(startNode.id);
  } else {
    const incomingTargets = new Set(canvas.edges.map((edge) => edge.target).filter(Boolean));
    const sourceNodes = nonStartNodes.filter((node) => !incomingTargets.has(node.id));
    const orderedSourceNodes = sourceNodes.length > 0 ? sourceNodes : nonStartNodes;

    for (const node of orderedSourceNodes) {
      visitNode(node);
    }

    for (const node of nonStartNodes) {
      visitNode(node);
    }
  }

  return orderedNodes;
}

const ROUTE_CANVAS_LAYOUT = {
  startX: 160,
  startY: 140,
  columnGap: 240,
  rowGap: 160,
  nodesPerRow: 3,
};

function getRouteCanvasPosition(layoutIndex: number): XYPosition {
  const row = Math.floor(layoutIndex / ROUTE_CANVAS_LAYOUT.nodesPerRow);
  const column = layoutIndex % ROUTE_CANVAS_LAYOUT.nodesPerRow;
  const isReverseRow = row % 2 === 1;
  const visualColumn = isReverseRow ? ROUTE_CANVAS_LAYOUT.nodesPerRow - 1 - column : column;

  return {
    x: ROUTE_CANVAS_LAYOUT.startX + visualColumn * ROUTE_CANVAS_LAYOUT.columnGap,
    y: ROUTE_CANVAS_LAYOUT.startY + row * ROUTE_CANVAS_LAYOUT.rowGap,
  };
}

function arrangeRouteCanvas(canvas: CanvasState): CanvasState {
  const startNode = canvas.nodes.find((node) => node.type === "start") ?? null;
  const routeNodes = startNode ? [startNode, ...getRouteOrderedNodes(canvas)] : getRouteOrderedNodes(canvas);

  if (routeNodes.length === 0) {
    return canvas;
  }

  const positions = new Map(routeNodes.map((node, index) => [node.id, getRouteCanvasPosition(index)]));

  return {
    ...canvas,
    nodes: canvas.nodes.map((node) => {
      const position = positions.get(node.id);

      return position ? { ...node, position } : node;
    }),
    edges: canvas.edges.map((edge) => {
      const sourceIndex = routeNodes.findIndex((node) => node.id === edge.source);
      const targetIndex = routeNodes.findIndex((node) => node.id === edge.target);

      if (sourceIndex === -1 || targetIndex !== sourceIndex + 1) {
        return edge;
      }

      const sourcePosition = positions.get(edge.source);
      const targetPosition = positions.get(edge.target);

      if (!sourcePosition || !targetPosition) {
        return edge;
      }

      return {
        ...edge,
        ...getRouteEdgeHandles(sourcePosition, targetPosition),
      };
    }),
  };
}

function getRouteEdgeHandles(sourcePosition: XYPosition, targetPosition: XYPosition) {
  if (Math.abs(sourcePosition.y - targetPosition.y) > Math.abs(sourcePosition.x - targetPosition.x)) {
    return {
      sourceHandle: "source-bottom",
      targetHandle: "target-top",
    };
  }

  if (targetPosition.x < sourcePosition.x) {
    return {
      sourceHandle: "source-left",
      targetHandle: "target-right",
    };
  }

  return {
    sourceHandle: "source-right",
    targetHandle: "target-left",
  };
}

function buildBackendStepsFromCanvas(
  workflow: WorkflowRecord,
  canvas: CanvasState,
): BackendRouteStep[] {
  return getRouteOrderedNodes(canvas)
    .filter((node) => node.data?.config?.disabled !== true)
    .map((node) => {
      const componentType = String(node.data?.componentKey ?? node.type ?? "");

      if (componentType === "dbCrud") {
        return buildDbCrudBackendSteps(node.data?.config);
      }

      if (componentType === "smartRouter") {
        return buildSmartRouterBackendStep(node.data?.config);
      }

      if (componentType === "agent") {
        return buildAgentBackendStep(node.data?.config);
      }

      if (componentType === "routeContainer") {
        return buildRouteContainerBackendStep(workflow, node);
      }

      if (componentType === "choice") {
        return buildChoiceBackendStep(workflow, node);
      }

      if (componentType === "split") {
        return buildSplitBackendStep(workflow, node);
      }

      if (componentType === "workflow") {
        return [];
      }

      return {
        type: componentType,
        ...stripBackendStepConfig(componentType, node.data?.config),
      };
    })
    .flat();
}

function createBackendRouteJson(workflow: WorkflowRecord): BackendRouteExport {
  const rootCanvas = workflow.canvases[workflow.rootCanvasId];
  const startNode = rootCanvas?.nodes.find((node) => node.type === "start") ?? null;
  const startConfig = startNode?.data?.config ?? {};
  const steps = rootCanvas ? buildBackendStepsFromCanvas(workflow, rootCanvas) : [];
  const routeId = stringValueOrDefault(startConfig.routeId, workflow.name);
  const fromMode = getRouteFromMode(startConfig);
  const from = buildFromEndpoint(routeId, fromMode);
  const routeName = stringValueOrDefault(
    startConfig.name ?? startConfig.routeName,
    buildDefaultRouteName(routeId),
  );
  const routePath = String(startConfig.path ?? startConfig.routePath ?? "").trim();
  const description = String(startConfig.description ?? "").trim();
  const contentType = String(startConfig.contentType ?? "application/json").trim();
  const onException = Array.isArray(startConfig.onException) ? startConfig.onException : [];

  return {
    enabled: typeof startConfig.enabled === "boolean" ? startConfig.enabled : true,
    name: routeName,
    path: routePath,
    index: numberValueOrDefault(startConfig.index, 0),
    description,
    config: {
      routeId,
      steps,
      from,
      ...(contentType ? { contentType } : {}),
      ...(description ? { description } : {}),
      onException,
    },
  };
}

function buildWorkflowFromRouteDefinition(
  raw: unknown,
  existingWorkflows: Record<string, WorkflowRecord>,
  fallbackName: string,
): WorkflowRecord | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const envelope = raw as RouteImportEnvelope;
  const route = envelope.config && typeof envelope.config === "object"
    ? envelope.config
    : raw as RouteImportDefinition;

  if (!Array.isArray(route.steps)) {
    return null;
  }

  const supportedSteps = route.steps.filter(
    (step): step is RouteImportStep & { type: BuiltInComponentType } =>
      step?.type === "marshal" ||
      step?.type === "unmarshal" ||
      step?.type === "setBody" ||
      step?.type === "setHeader" ||
      step?.type === "removeHeaders" ||
      step?.type === "setProperty" ||
      step?.type === "setContext" ||
      step?.type === "globalOption" ||
      step?.type === "convertBodyTo" ||
      step?.type === "transform" ||
      step?.type === "filter" ||
      step?.type === "choice" ||
      step?.type === "split" ||
      step?.type === "dynamicroute" ||
      step?.type === "validate" ||
      step?.type === "process" ||
      step?.type === "bean" ||
      step?.type === "to" ||
      step?.type === "toD" ||
      step?.type === "upload" ||
      step?.type === "download" ||
      step?.type === "enrich" ||
      step?.type === "dbCrud" ||
      step?.type === "smartRouter" ||
      step?.type === "agent" ||
      step?.type === "aggregation" ||
      step?.type === "delay" ||
      step?.type === "log",
  );

  if (supportedSteps.length !== route.steps.length) {
    return null;
  }

  const workflowNameSource =
    (typeof envelope.name === "string" && envelope.name.trim()) ||
    (typeof route.routeId === "string" && route.routeId.trim()) ||
    (typeof fallbackName === "string" && fallbackName.trim()) ||
    "Imported Route";
  const workflowName = dedupeWorkflowName(workflowNameSource, existingWorkflows);
  const workflowId = createWorkflowId(workflowName);
  const rootCanvasId = `canvas-${workflowId}`;
  const startNodeId = `${rootCanvasId}-start`;
  const startNode = createStartNode(startNodeId, getRouteCanvasPosition(0));

  startNode.data = {
    ...startNode.data,
    label: typeof route.from === "string" && route.from.trim() ? route.from : "From",
    config: {
      from: route.from ?? "",
      fromMode:
        typeof route.from === "string" && route.from.trim() && !route.from.startsWith("direct:")
          ? "normal"
          : "direct",
      routeId: route.routeId ?? "",
      contentType: route.contentType ?? "",
      onException: Array.isArray(route.onException) ? route.onException : [],
      enabled: envelope.enabled ?? true,
      name: envelope.name ?? "",
      path: envelope.path ?? "",
      index: envelope.index ?? 0,
      description: route.description ?? envelope.description ?? "",
    },
  };

  const nodes: AppNode[] = [startNode];
  const edges: AppEdge[] = [];
  let previousNodeId = startNodeId;
  let previousNodePosition = startNode.position;

  supportedSteps.forEach((step, index) => {
    const stepParameters = isPlainRecord(step.parameters) ? step.parameters : {};
    const componentKey = getRouteStepComponentKey(step) ?? step.type;
    const node = createFlowNode(componentKey, getRouteCanvasPosition(index + 1));

    node.data = {
      ...node.data,
      label:
        componentKey === "process"
          ? step.ref?.trim() || "Process"
          : componentKey === "bean"
            ? step.ref?.trim() || step.method?.trim() || "Bean"
          : componentKey === "log"
            ? step.name?.trim() || "Log"
          : componentKey === "to"
            ? "To"
          : componentKey === "smartRouter"
            ? "Smart Router"
          : componentKey === "agent"
            ? "Agent"
          : componentKey === "dbCrud"
            ? "SQL"
          : componentKey === "toD"
            ? "To Dynamic"
            : componentKey === "setBody"
              ? step.name?.trim() || "Set Body"
            : componentKey === "setHeader"
              ? step.name?.trim() || "Set Header"
            : componentKey === "removeHeaders"
              ? step.pattern?.trim() || "Remove Headers"
              : componentKey === "setProperty"
                ? step.name?.trim() || "Set Property"
                : componentKey === "setContext"
                  ? step.name?.trim() || "Set Context"
                : componentKey === "globalOption"
                  ? step.name?.trim() || "Global Option"
                : componentKey === "convertBodyTo"
                  ? "Convert Body"
                  : componentKey === "transform"
                    ? "Transform"
              : componentKey === "filter"
                ? "Filter"
              : componentKey === "choice"
                ? "Choice"
              : componentKey === "split"
                ? "Split"
              : componentKey === "dynamicroute"
                ? "Dynamic Route"
              : componentKey === "validate"
                ? "Validate"
              : componentKey === "delay"
                ? "Delay"
              : componentKey === "aggregation"
                ? "Aggregation"
              : componentKey === "marshal"
                ? "Marshal"
                : componentKey === "unmarshal"
                  ? "Unmarshal"
                  : componentKey === "enrich"
                    ? "Enrich"
                  : "Set Header",
      config:
        componentKey === "process"
          ? {
              ref: step.ref ?? "",
              clazz: step.clazz ?? "",
              disabled: Boolean(step.disabled),
              parameters: step.parameters ?? {},
              dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "bean"
            ? {
                ref: step.ref ?? "",
                clazz: step.clazz ?? "",
                method: step.method ?? "",
                constructorArgs: Array.isArray(step.constructorArgs) ? step.constructorArgs : [],
                enableSecurityContext: Boolean(step.enableSecurityContext),
                disabled: Boolean(step.disabled),
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "unmarshal"
            ? {
                name: step.name ?? "json",
                library: step.library ?? "Jackson",
                clazz: step.clazz ?? "java.util.Map",
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                useList: Boolean(step.useList),
                delimiter: typeof step.delimiter === "string" ? step.delimiter : ",",
                skipHeader: Boolean(step.skipHeader),
                useMap: Boolean(step.useMap),
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "validate"
            ? {
                rules: Array.isArray(step.rules) ? step.rules : [],
                validationStatusCode: typeof step.validationStatusCode === "number" ? step.validationStatusCode : 400,
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "setBody"
            ? {
                name: step.name ?? "setBody",
                expression: step.expression ?? "${body}",
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                ...(step.data !== undefined ? { data: step.data } : {}),
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "setHeader"
            ? {
                name: step.name ?? "Content-Type",
                expression: step.expression ?? "application/json",
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "removeHeaders"
            ? {
                pattern: step.pattern ?? "CamelHttp*",
                excludePattern: step.excludePattern ?? "",
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "setProperty"
            ? {
                name: step.name ?? "propertyName",
                expression: step.expression ?? "${body}",
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "setContext"
            ? {
                name: step.name ?? "contextKey",
                expression: step.expression ?? "",
                value: step.value ?? "",
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "globalOption"
            ? {
                name: step.name ?? "optionName",
                expression: step.expression ?? "",
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "convertBodyTo"
            ? {
                clazz: step.clazz ?? "java.lang.String",
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "transform"
            ? {
                name: step.name ?? "simple",
                expression: step.expression ?? "${body}",
                mapper:
                  step.mapper && typeof step.mapper === "object" && !Array.isArray(step.mapper)
                    ? step.mapper
                    : {},
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "filter"
            ? {
                expression: step.expression ?? "${body} != null",
                clazz: step.clazz ?? "",
                steps: Array.isArray(step.steps) ? step.steps : [],
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "choice"
            ? {
                when: Array.isArray(step.when)
                  ? step.when.filter(
                      (item): item is Record<string, unknown> =>
                        Boolean(item) && typeof item === "object" && !Array.isArray(item),
                    )
                  : [],
                otherwise: Array.isArray(step.otherwise) ? step.otherwise : [],
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "dbCrud"
            ? buildImportedDbCrudConfig(step)
          : componentKey === "split"
            ? {
                splitBody: Boolean(step.splitBody),
                expression: step.expression ?? "",
                tokenize: step.tokenize ?? "",
                splitClazz:
                  step.splitClazz && typeof step.splitClazz === "object" && !Array.isArray(step.splitClazz)
                    ? step.splitClazz
                    : undefined,
                aggregationClazz:
                  step.aggregationClazz && typeof step.aggregationClazz === "object" && !Array.isArray(step.aggregationClazz)
                    ? step.aggregationClazz
                    : undefined,
                aggregationMode:
                  typeof step.aggregationStrategyClazz === "string" && step.aggregationStrategyClazz.trim()
                    ? "strategy"
                    : step.aggregationClazz && typeof step.aggregationClazz === "object" && !Array.isArray(step.aggregationClazz)
                      ? "object"
                      : "none",
                aggregationStrategyClazz:
                  typeof step.aggregationStrategyClazz === "string" ? step.aggregationStrategyClazz : "",
                parallel: Boolean(step.parallel),
                streaming: step.streaming !== false,
                executorServiceRef: step.executorServiceRef ?? "",
                enableParallelExecutorServiceRef: Boolean(step.enableParallelExecutorServiceRef),
                useVirtualThread: Boolean(step.useVirtualThread),
                completionSize: step.completionSize,
                completionTimeOut: step.completionTimeOut,
                steps: Array.isArray(step.steps) ? step.steps : [],
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "dynamicroute"
            ? {
                clazz: step.clazz ?? "",
                routes: Array.isArray(step.routes) ? step.routes : [],
                isMap: step.isMap !== false,
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "log"
            ? {
                message: typeof step.message === "string" ? step.message : "Processing exchange",
                name: step.name ?? "DEFAULT",
                logLevel: typeof step.logLevel === "string" ? step.logLevel : "INFO",
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "to" || componentKey === "toD"
            ? {
                endpoint: step.endpoint ?? "",
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "smartRouter"
            ? {
                protocol: stepParameters.protocol ?? "http",
                url: stepParameters.url ?? "",
                method: stepParameters.method ?? "post",
                contentType: stepParameters.contentType ?? "application/json",
                headerParams: stepParameters.headerParams ?? "",
                queryParams: stepParameters.queryParams ?? "",
                enableTransformation:
                  Boolean(stepParameters.payloadTransformer) ||
                  Boolean(stepParameters.transformerConfig),
                payloadTransformer: stepParameters.payloadTransformer ?? "#joltPayloadTransformer",
                transformerConfig: stepParameters.transformerConfig ?? "",
                soapAction: stepParameters.soapAction ?? "",
                disabled: Boolean(step.disabled),
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "agent"
            ? {
                tag: stepParameters.tag ?? "default",
                llmId: stepParameters.llmId ?? "",
                chatSettingsId: stepParameters.chatSettingsId ?? "",
                ragId: stepParameters.ragId ?? "",
                promptTemplate: stepParameters.promptTemplate ?? "",
                disabled: Boolean(step.disabled),
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "delay"
            ? {
                expression: step.expression ?? "1000",
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "enrich"
            ? {
                endpoint: step.endpoint ?? "",
                endpointType: step.endpointType ?? "NONE",
                enrichStrategyClazz:
                  typeof step.enrichStrategyClazz === "string" && step.enrichStrategyClazz.trim()
                    ? step.enrichStrategyClazz
                    : DEFAULT_ENRICH_STRATEGY_CLASS,
                requestMapper:
                  step.requestMapper && typeof step.requestMapper === "object" && !Array.isArray(step.requestMapper)
                    ? step.requestMapper
                    : {},
                responseMapper:
                  step.responseMapper && typeof step.responseMapper === "object" && !Array.isArray(step.responseMapper)
                    ? step.responseMapper
                    : {},
                split: Boolean(step.split),
                parallelProcessing: Boolean(step.parallelProcessing),
                aggregationStrategyClazz:
                  typeof step.aggregationStrategyClazz === "string" && step.aggregationStrategyClazz.trim()
                    ? step.aggregationStrategyClazz
                    : DEFAULT_SPLIT_AGGREGATION_STRATEGY_CLASS,
                disabled: Boolean(step.disabled),
                parameters: step.parameters ?? {},
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : componentKey === "aggregation"
            ? {
                aggregationClazz:
                  step.aggregationClazz && typeof step.aggregationClazz === "object" && !Array.isArray(step.aggregationClazz)
                    ? step.aggregationClazz
                    : {
                        clazz:
                          typeof step.clazz === "string" && step.clazz.trim()
                            ? step.clazz
                            : DEFAULT_AGGREGATION_STRATEGY_CLASS,
                        parameters: step.parameters ?? {},
                      },
                clazz: step.clazz ?? "",
                correlationExpression: step.correlationExpression ?? "",
                completionSize: step.completionSize,
                completionTimeOut: step.completionTimeOut,
                disabled: Boolean(step.disabled),
                dependencies: normalizeDependencyList(step.dependencies),
              }
          : {
              name: step.name ?? "json",
              useList: Boolean(step.useList),
              disabled: Boolean(step.disabled),
              parameters: step.parameters ?? {},
              dependencies: normalizeDependencyList(step.dependencies),
            },
    };

    nodes.push(node);
    edges.push({
      id: `${previousNodeId}-${node.id}`,
      source: previousNodeId,
      target: node.id,
      ...getRouteEdgeHandles(previousNodePosition, node.position),
      type: "insertable",
    });
    previousNodeId = node.id;
    previousNodePosition = node.position;
  });

  return {
    id: workflowId,
    name: workflowName,
    rootCanvasId,
    currentCanvasId: rootCanvasId,
    canvasStack: [rootCanvasId],
    canvases: {
      [rootCanvasId]: {
        id: rootCanvasId,
        name: workflowName,
        nodes,
        edges,
      },
    },
  };
}

function normalizePersistedState(
  persistedState?: PersistedFlowState,
  resetLegacyCustomizations = false,
) {
  const beans = persistedState?.beans ?? [];
  const dataSources = persistedState?.dataSources ?? [];
  const dataSourceTenants = persistedState?.dataSourceTenants ?? [];
  const securityConfigs = persistedState?.securityConfigs ?? [];
  const llmConfigs = persistedState?.llmConfigs ?? [];
  const ragConfigs = persistedState?.ragConfigs ?? [];
  const endpointConfigs = persistedState?.endpointConfigs ?? [];
  const customComponents = persistedState?.customComponents ?? [];
  const isSidebarOpen = persistedState?.isSidebarOpen ?? false;
  const sidebarView = persistedState?.sidebarView ?? "components";
  const selectedConfigSection = persistedState?.selectedConfigSection ?? "beans";
  const selectedSecuritySubsection = persistedState?.selectedSecuritySubsection ?? "auth";
  const selectedLlmSubsection = persistedState?.selectedLlmSubsection ?? "providers";

  const shouldPruneLegacyNode = (node: AppNode) =>
    ![
      "start",
      "marshal",
      "unmarshal",
      "setBody",
      "setHeader",
      "removeHeaders",
      "setProperty",
      "setContext",
      "globalOption",
      "convertBodyTo",
      "transform",
      "filter",
      "choice",
      "split",
      "dynamicroute",
      "validate",
      "process",
      "bean",
      "to",
      "toD",
      "upload",
      "download",
      "enrich",
      "dbCrud",
      "aggregation",
      "delay",
      "log",
    ].includes(node.type ?? "");

  if (persistedState?.workflows && Object.keys(persistedState.workflows).length > 0) {
    const workflowOrder =
      persistedState.workflowOrder?.filter(
        (workflowId) => workflowId in persistedState.workflows!,
      ) ?? Object.keys(persistedState.workflows);
    const activeWorkflowId =
      persistedState.activeWorkflowId && persistedState.activeWorkflowId in persistedState.workflows
        ? persistedState.activeWorkflowId
        : workflowOrder[0];

    const normalizedWorkflows = resetLegacyCustomizations
      ? Object.fromEntries(
          Object.entries(persistedState.workflows).map(([workflowId, workflow]) => [
            workflowId,
            {
              ...workflow,
              canvases: pruneDeprecatedNodesFromCanvases(
                workflow.canvases,
                shouldPruneLegacyNode,
              ),
            },
          ]),
        ) as Record<string, WorkflowRecord>
      : persistedState.workflows;
    const normalizedActiveWorkflow =
      normalizedWorkflows[activeWorkflowId] ?? createInitialWorkflow();

    return {
      workflows: normalizedWorkflows,
      workflowOrder,
      activeWorkflowId,
      canvases: normalizedActiveWorkflow.canvases,
      currentCanvasId: normalizedActiveWorkflow.currentCanvasId,
      canvasStack: normalizedActiveWorkflow.canvasStack,
      isSidebarOpen,
      sidebarView,
      selectedConfigSection,
      selectedSecuritySubsection,
      selectedLlmSubsection,
      beans,
      dataSources,
      dataSourceTenants,
      securityConfigs,
      llmConfigs,
      ragConfigs,
      endpointConfigs,
      customComponents,
    };
  }

  const legacyWorkflow = createInitialWorkflow();
  const legacyCanvases = persistedState?.canvases;

  if (legacyCanvases && Object.keys(legacyCanvases).length > 0) {
    legacyWorkflow.canvases = resetLegacyCustomizations
      ? pruneDeprecatedNodesFromCanvases(
          legacyCanvases,
          shouldPruneLegacyNode,
        )
      : legacyCanvases;
    legacyWorkflow.currentCanvasId =
      persistedState.currentCanvasId &&
      persistedState.currentCanvasId in legacyWorkflow.canvases
        ? persistedState.currentCanvasId
        : legacyWorkflow.rootCanvasId;
    legacyWorkflow.canvasStack =
      persistedState.canvasStack?.filter((canvasId) => canvasId in legacyWorkflow.canvases) ?? [
        legacyWorkflow.rootCanvasId,
      ];
    legacyWorkflow.name = legacyCanvases[legacyWorkflow.rootCanvasId]?.name ?? legacyWorkflow.name;
  }

  return {
    workflows: {
      [legacyWorkflow.id]: legacyWorkflow,
    },
    workflowOrder: [legacyWorkflow.id],
    activeWorkflowId: legacyWorkflow.id,
    canvases: legacyWorkflow.canvases,
    currentCanvasId: legacyWorkflow.currentCanvasId,
    canvasStack: legacyWorkflow.canvasStack,
    isSidebarOpen,
    sidebarView,
    selectedConfigSection,
    selectedSecuritySubsection,
    selectedLlmSubsection,
    beans,
    dataSources,
    securityConfigs,
    llmConfigs,
    ragConfigs,
    endpointConfigs,
    customComponents,
  };
}

interface FlowState {
  workflows: Record<string, WorkflowRecord>;
  workflowOrder: string[];
  activeWorkflowId: string;
  canvases: Record<string, CanvasState>;
  currentCanvasId: string;
  canvasStack: string[];
  selectedNode: AppNode | null;
  selectedEdge: AppEdge | null;
  directRouteEditorSession: DirectRouteEditorSession | null;
  isSidebarOpen: boolean;
  sidebarView: SidebarView;
  selectedConfigSection: ConfigSection;
  selectedSecuritySubsection: SecuritySubsection;
  selectedLlmSubsection: LlmSubsection;
  beans: CreatedBean[];
  dataSources: CreatedDataSource[];
  dataSourceTenants: CreatedDataSourceTenant[];
  securityConfigs: CreatedSecurityConfig[];
  llmConfigs: CreatedLlmConfig[];
  ragConfigs: CreatedRagConfig[];
  endpointConfigs: CreatedEndpointConfig[];
  customComponents: CreatedComponentTemplate[];
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: AppEdge[]) => void;
  addNode: (componentKey: ComponentType, position: XYPosition) => void;
  setSelectedNode: (node: AppNode | null) => void;
  setSelectedEdge: (edge: AppEdge | null) => void;
  clearSelection: () => void;
  updateNodeData: (id: string, data: Partial<AppNodeData>) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  arrangeCurrentRoute: () => void;
  clearCurrentCanvas: () => void;
  insertNodeOnEdge: (edgeId: string, type: InsertableNodeType) => void;
  openNestedRouteCanvas: (nodeId: string) => void;
  openChoiceBranchCanvas: (nodeId: string, branchKey: string) => void;
  openSplitCanvas: (nodeId: string) => void;
  goBackCanvas: () => void;
  openCanvasFromBreadcrumb: (canvasId: string) => void;
  toggleSidebar: () => void;
  openSidebar: (view: SidebarView) => void;
  openConfigSection: (section: ConfigSection) => void;
  selectSecuritySubsection: (section: SecuritySubsection) => void;
  selectLlmSubsection: (section: LlmSubsection) => void;
  addBean: (bean: Omit<CreatedBean, "id">) => { ok: true } | { ok: false; reason: string };
  replaceBeans: (beans: CreatedBean[]) => void;
  updateBean: (beanId: string, bean: Omit<CreatedBean, "id">) => { ok: true } | { ok: false; reason: string };
  removeBean: (beanId: string) => void;
  addDataSource: (dataSource: Omit<CreatedDataSource, "id">) => { ok: true } | { ok: false; reason: string };
  replaceDataSources: (dataSources: CreatedDataSource[]) => void;
  addDataSourceTenant: (
    tenant: Omit<CreatedDataSourceTenant, "id">,
  ) => { ok: true } | { ok: false; reason: string };
  replaceDataSourceTenants: (tenants: CreatedDataSourceTenant[]) => void;
  updateDataSourceTenant: (
    tenantId: string,
    tenant: Omit<CreatedDataSourceTenant, "id">,
  ) => { ok: true } | { ok: false; reason: string };
  removeDataSourceTenant: (tenantId: string) => void;
  updateDataSource: (
    dataSourceId: string,
    dataSource: Omit<CreatedDataSource, "id">,
  ) => { ok: true } | { ok: false; reason: string };
  removeDataSource: (dataSourceId: string) => void;
  addSecurityConfig: (
    config: Omit<CreatedSecurityConfig, "id">,
  ) => { ok: true } | { ok: false; reason: string };
  updateSecurityConfig: (
    configId: string,
    config: Omit<CreatedSecurityConfig, "id">,
  ) => { ok: true } | { ok: false; reason: string };
  removeSecurityConfig: (configId: string) => void;
  addLlmConfig: (
    config: Omit<CreatedLlmConfig, "id">,
  ) => { ok: true } | { ok: false; reason: string };
  replaceLlmConfigs: (configs: CreatedLlmConfig[]) => void;
  updateLlmConfig: (
    configId: string,
    config: Omit<CreatedLlmConfig, "id">,
  ) => { ok: true } | { ok: false; reason: string };
  removeLlmConfig: (configId: string) => void;
  addRagConfig: (
    config: Omit<CreatedRagConfig, "id">,
  ) => { ok: true } | { ok: false; reason: string };
  replaceRagConfigs: (configs: CreatedRagConfig[]) => void;
  updateRagConfig: (
    configId: string,
    config: Omit<CreatedRagConfig, "id">,
  ) => { ok: true } | { ok: false; reason: string };
  removeRagConfig: (configId: string) => void;
  addEndpointConfig: (
    config: Omit<CreatedEndpointConfig, "id">,
  ) => { ok: true } | { ok: false; reason: string };
  replaceEndpointConfigs: (configs: CreatedEndpointConfig[]) => void;
  updateEndpointConfig: (
    configId: string,
    config: Omit<CreatedEndpointConfig, "id">,
  ) => { ok: true } | { ok: false; reason: string };
  removeEndpointConfig: (configId: string) => void;
  addCustomComponent: (
    component: Omit<CreatedComponentTemplate, "id">,
  ) => { ok: true } | { ok: false; reason: string };
  updateCustomComponent: (
    componentId: string,
    component: Omit<CreatedComponentTemplate, "id">,
  ) => { ok: true } | { ok: false; reason: string };
  removeCustomComponent: (componentId: string) => void;
  exportWorkflow: () => WorkflowExport;
  exportBackendRouteJson: () => BackendRouteExport;
  markBackendRoutePublished: (routeName: string, routeSignature: string) => void;
  openDirectRouteEditor: (route: AppWeaverDirectRouteConfig) => void;
  closeDirectRouteEditor: () => void;
  importWorkflow: (raw: unknown, fallbackName?: string) => boolean;
  createWorkflow: (name?: string) => { id: string; name: string };
  selectWorkflow: (workflowId: string) => void;
  deleteWorkflow: (workflowId: string) => void;
  updateEdgeData: (edgeId: string, data: Record<string, unknown>) => void;
}

const initialWorkflow = createInitialWorkflow();

function syncActiveWorkflow(
  state: FlowState,
  activeWorkflow: WorkflowRecord,
  partial?: Partial<FlowState>,
) {
  return {
    ...partial,
    workflows: {
      ...state.workflows,
      [activeWorkflow.id]: activeWorkflow,
    },
    activeWorkflowId: activeWorkflow.id,
    canvases: activeWorkflow.canvases,
    currentCanvasId: activeWorkflow.currentCanvasId,
    canvasStack: activeWorkflow.canvasStack,
  };
}

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      workflows: {
        [initialWorkflow.id]: initialWorkflow,
      },
      workflowOrder: [initialWorkflow.id],
      activeWorkflowId: initialWorkflow.id,
      canvases: initialWorkflow.canvases,
      currentCanvasId: initialWorkflow.currentCanvasId,
      canvasStack: initialWorkflow.canvasStack,
      selectedNode: null,
      selectedEdge: null,
      directRouteEditorSession: null,
      isSidebarOpen: false,
      sidebarView: "components",
      selectedConfigSection: "beans",
      selectedSecuritySubsection: "global",
      selectedLlmSubsection: "providers",
      beans: [],
      dataSources: [],
      dataSourceTenants: [],
      securityConfigs: [],
      llmConfigs: [],
      ragConfigs: [],
      endpointConfigs: [],
      customComponents: [],

      setNodes: (nodes) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          return syncActiveWorkflow(state, {
            ...activeWorkflow,
            canvases: {
              ...activeWorkflow.canvases,
              [activeWorkflow.currentCanvasId]: {
                ...activeWorkflow.canvases[activeWorkflow.currentCanvasId],
                nodes,
              },
            },
          });
        }),

      setEdges: (edges) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          return syncActiveWorkflow(state, {
            ...activeWorkflow,
            canvases: {
              ...activeWorkflow.canvases,
              [activeWorkflow.currentCanvasId]: {
                ...activeWorkflow.canvases[activeWorkflow.currentCanvasId],
                edges,
              },
            },
          });
        }),

      addNode: (componentKey, position) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          const currentCanvas = activeWorkflow.canvases[activeWorkflow.currentCanvasId];
          const newNode = createFlowNode(componentKey, position, state.customComponents);
          const nextCanvases: Record<string, CanvasState> = {
            ...activeWorkflow.canvases,
            [activeWorkflow.currentCanvasId]: {
              ...currentCanvas,
              nodes: [...currentCanvas.nodes, newNode],
            },
          };

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              canvases: nextCanvases,
            }),
            selectedNode: newNode,
            selectedEdge: null,
            isSidebarOpen: false,
          };
        }),

      setSelectedNode: (node) =>
        set({
          selectedNode: node,
          ...(node ? { isSidebarOpen: false } : {}),
        }),
      setSelectedEdge: (edge) =>
        set({
          selectedEdge: edge,
          ...(edge ? { isSidebarOpen: false } : {}),
        }),
      clearSelection: () => set({ selectedNode: null, selectedEdge: null }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      openSidebar: (view) => set({ isSidebarOpen: true, sidebarView: view }),
      openConfigSection: (section) =>
        set({
          isSidebarOpen: true,
          sidebarView: "configs",
          selectedConfigSection: section,
        }),
      selectSecuritySubsection: (section) => set({ selectedSecuritySubsection: section }),
      selectLlmSubsection: (section) => set({ selectedLlmSubsection: section }),
      addBean: (bean) => {
        const trimmedName = bean.name.trim();

        if (!trimmedName) {
          return { ok: false, reason: "Bean name is required." };
        }

        const currentState = get();

        if (currentState.beans.some((item) => item.name === trimmedName)) {
          return { ok: false, reason: "A bean with that name already exists." };
        }

        set((state) => ({
          beans: [
            ...state.beans,
            {
              id: `bean-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              ...bean,
              name: trimmedName,
            },
          ],
        }));

        return { ok: true };
      },
      replaceBeans: (beans) => set({ beans }),
      removeBean: (beanId) =>
        set((state) => ({
          beans: state.beans.filter((bean) => bean.id !== beanId),
        })),
      updateBean: (beanId, bean) => {
        const trimmedName = bean.name.trim();

        if (!trimmedName) {
          return { ok: false, reason: "Bean name is required." };
        }

        const currentState = get();

        if (
          currentState.beans.some((item) => item.id !== beanId && item.name === trimmedName)
        ) {
          return { ok: false, reason: "A bean with that name already exists." };
        }

        set((state) => ({
          beans: state.beans.map((item) =>
            item.id === beanId
              ? {
                  ...item,
                  ...bean,
                  name: trimmedName,
                }
              : item,
          ),
        }));

        return { ok: true };
      },
      addDataSource: (dataSource) => {
        const trimmedKey = dataSource.key.trim();

        if (!trimmedKey) {
          return { ok: false, reason: "Datasource key is required." };
        }

        const currentState = get();

        if (currentState.dataSources.some((item) => item.key === trimmedKey)) {
          return { ok: false, reason: "A datasource with that key already exists." };
        }

        set((state) => ({
          dataSources: [
            ...state.dataSources,
            {
              id: `datasource-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              ...dataSource,
              key: trimmedKey,
            },
          ],
        }));

        return { ok: true };
      },
      replaceDataSources: (dataSources) => set({ dataSources }),
      addDataSourceTenant: (tenant) => {
        const trimmedTenantName = tenant.tenantName.trim();
        const trimmedDataSourceKey = tenant.dataSourceKey.trim();

        if (!trimmedTenantName) {
          return { ok: false, reason: "Tenant name is required." };
        }

        if (!trimmedDataSourceKey) {
          return { ok: false, reason: "Select a datasource for the tenant." };
        }

        const currentState = get();

        if (currentState.dataSourceTenants.some((item) => item.tenantName === trimmedTenantName)) {
          return { ok: false, reason: "A tenant mapping with that name already exists." };
        }

        set((state) => ({
          dataSourceTenants: [
            ...state.dataSourceTenants,
            {
              id: `datasource-tenant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              tenantName: trimmedTenantName,
              dataSourceKey: trimmedDataSourceKey,
            },
          ],
        }));

        return { ok: true };
      },
      replaceDataSourceTenants: (tenants) => set({ dataSourceTenants: tenants }),
      updateDataSourceTenant: (tenantId, tenant) => {
        const trimmedTenantName = tenant.tenantName.trim();
        const trimmedDataSourceKey = tenant.dataSourceKey.trim();

        if (!trimmedTenantName) {
          return { ok: false, reason: "Tenant name is required." };
        }

        if (!trimmedDataSourceKey) {
          return { ok: false, reason: "Select a datasource for the tenant." };
        }

        const currentState = get();

        if (
          currentState.dataSourceTenants.some(
            (item) => item.id !== tenantId && item.tenantName === trimmedTenantName,
          )
        ) {
          return { ok: false, reason: "A tenant mapping with that name already exists." };
        }

        set((state) => ({
          dataSourceTenants: state.dataSourceTenants.map((item) =>
            item.id === tenantId
              ? {
                  ...item,
                  tenantName: trimmedTenantName,
                  dataSourceKey: trimmedDataSourceKey,
                }
              : item,
          ),
        }));

        return { ok: true };
      },
      removeDataSourceTenant: (tenantId) =>
        set((state) => ({
          dataSourceTenants: state.dataSourceTenants.filter((tenant) => tenant.id !== tenantId),
        })),
      removeDataSource: (dataSourceId) =>
        set((state) => ({
          dataSources: state.dataSources.filter((dataSource) => dataSource.id !== dataSourceId),
        })),
      updateDataSource: (dataSourceId, dataSource) => {
        const trimmedKey = dataSource.key.trim();

        if (!trimmedKey) {
          return { ok: false, reason: "Datasource key is required." };
        }

        const currentState = get();

        if (
          currentState.dataSources.some(
            (item) => item.id !== dataSourceId && item.key === trimmedKey,
          )
        ) {
          return { ok: false, reason: "A datasource with that key already exists." };
        }

        set((state) => ({
          dataSources: state.dataSources.map((item) =>
            item.id === dataSourceId
              ? {
                  ...item,
                  ...dataSource,
                  key: trimmedKey,
                }
              : item,
          ),
        }));

        return { ok: true };
      },
      addSecurityConfig: (config) => {
        const currentState = get();
        const normalizedFileName = config.fileName.trim().toLowerCase().endsWith(".json")
          ? config.fileName.trim()
          : `${config.fileName.trim()}.json`;

        if (!normalizedFileName || normalizedFileName === ".json") {
          return { ok: false, reason: "Security file name is required." };
        }

        if (
          config.subsection !== "policies" &&
          config.subsection !== "rateLimiters" &&
          currentState.securityConfigs.some(
            (item) =>
              item.subsection === config.subsection &&
              item.fileName.toLowerCase() === normalizedFileName.toLowerCase(),
          )
        ) {
          return { ok: false, reason: "A security config for that file already exists." };
        }

        set((state) => ({
          securityConfigs: [
            ...state.securityConfigs,
            {
              id: `security-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              ...config,
              fileName: normalizedFileName,
            },
          ],
        }));

        return { ok: true };
      },
      updateSecurityConfig: (configId, config) => {
        const currentState = get();
        const normalizedFileName = config.fileName.trim().toLowerCase().endsWith(".json")
          ? config.fileName.trim()
          : `${config.fileName.trim()}.json`;

        if (!normalizedFileName || normalizedFileName === ".json") {
          return { ok: false, reason: "Security file name is required." };
        }

        if (
          config.subsection !== "policies" &&
          config.subsection !== "rateLimiters" &&
          currentState.securityConfigs.some(
            (item) =>
              item.id !== configId &&
              item.subsection === config.subsection &&
              item.fileName.toLowerCase() === normalizedFileName.toLowerCase(),
          )
        ) {
          return { ok: false, reason: "A security config for that file already exists." };
        }

        set((state) => ({
          securityConfigs: state.securityConfigs.map((item) =>
            item.id === configId
              ? {
                  ...item,
                  ...config,
                  fileName: normalizedFileName,
                }
              : item,
          ),
        }));

        return { ok: true };
      },
      removeSecurityConfig: (configId) =>
        set((state) => ({
          securityConfigs: state.securityConfigs.filter((item) => item.id !== configId),
        })),
      addLlmConfig: (config) => {
        const trimmedProviderId = config.providerId.trim();

        if (!trimmedProviderId) {
          return { ok: false, reason: "Provider id is required." };
        }

        const currentState = get();

        if (
          currentState.llmConfigs.some(
            (item) => item.providerId.toLowerCase() === trimmedProviderId.toLowerCase(),
          )
        ) {
          return { ok: false, reason: "An LLM config with that provider id already exists." };
        }

        set((state) => ({
          llmConfigs: [
            ...state.llmConfigs,
            {
              id: `llm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              ...config,
              providerId: trimmedProviderId,
            },
          ],
        }));

        return { ok: true };
      },
      replaceLlmConfigs: (configs) => set({ llmConfigs: configs }),
      updateLlmConfig: (configId, config) => {
        const trimmedProviderId = config.providerId.trim();

        if (!trimmedProviderId) {
          return { ok: false, reason: "Provider id is required." };
        }

        const currentState = get();

        if (
          currentState.llmConfigs.some(
            (item) =>
              item.id !== configId &&
              item.providerId.toLowerCase() === trimmedProviderId.toLowerCase(),
          )
        ) {
          return { ok: false, reason: "An LLM config with that provider id already exists." };
        }

        set((state) => ({
          llmConfigs: state.llmConfigs.map((item) =>
            item.id === configId
              ? {
                  ...item,
                  ...config,
                  providerId: trimmedProviderId,
                }
              : item,
          ),
        }));

        return { ok: true };
      },
      removeLlmConfig: (configId) =>
        set((state) => ({
          llmConfigs: state.llmConfigs.filter((item) => item.id !== configId),
        })),
      addRagConfig: (config) => {
        const trimmedRagId = config.ragId.trim();

        if (!trimmedRagId) {
          return { ok: false, reason: "RAG id is required." };
        }

        const currentState = get();

        if (
          currentState.ragConfigs.some(
            (item) => item.ragId.toLowerCase() === trimmedRagId.toLowerCase(),
          )
        ) {
          return { ok: false, reason: "A RAG config with that id already exists." };
        }

        set((state) => ({
          ragConfigs: [
            ...state.ragConfigs,
            {
              id: `rag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              ...config,
              ragId: trimmedRagId,
            },
          ],
        }));

        return { ok: true };
      },
      replaceRagConfigs: (configs) => set({ ragConfigs: configs }),
      updateRagConfig: (configId, config) => {
        const trimmedRagId = config.ragId.trim();

        if (!trimmedRagId) {
          return { ok: false, reason: "RAG id is required." };
        }

        const currentState = get();

        if (
          currentState.ragConfigs.some(
            (item) => item.id !== configId && item.ragId.toLowerCase() === trimmedRagId.toLowerCase(),
          )
        ) {
          return { ok: false, reason: "A RAG config with that id already exists." };
        }

        set((state) => ({
          ragConfigs: state.ragConfigs.map((item) =>
            item.id === configId
              ? {
                  ...item,
                  ...config,
                  ragId: trimmedRagId,
                }
              : item,
          ),
        }));

        return { ok: true };
      },
      removeRagConfig: (configId) =>
        set((state) => ({
          ragConfigs: state.ragConfigs.filter((item) => item.id !== configId),
        })),
      addEndpointConfig: (config) => {
        const normalizedFolderPath = config.folderPath
          .trim()
          .replace(/\\/g, "/")
          .replace(/^\/+|\/+$/g, "");
        const normalizedFileName = config.fileName.trim().toLowerCase().endsWith(".json")
          ? config.fileName.trim()
          : `${config.fileName.trim()}.json`;

        if (!normalizedFileName || normalizedFileName === ".json") {
          return { ok: false, reason: "Endpoint file name is required." };
        }

        const currentState = get();

        if (
          currentState.endpointConfigs.some(
            (item) =>
              item.protocol === config.protocol &&
              item.folderPath.toLowerCase() === normalizedFolderPath.toLowerCase() &&
              item.fileName.toLowerCase() === normalizedFileName.toLowerCase(),
          )
        ) {
          return { ok: false, reason: "An endpoint config already exists for that protocol and path." };
        }

        set((state) => ({
          endpointConfigs: [
            ...state.endpointConfigs,
            {
              id: `endpoint-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              ...config,
              folderPath: normalizedFolderPath,
              fileName: normalizedFileName,
            },
          ],
        }));

        return { ok: true };
      },
      replaceEndpointConfigs: (configs) => set({ endpointConfigs: configs }),
      updateEndpointConfig: (configId, config) => {
        const normalizedFolderPath = config.folderPath
          .trim()
          .replace(/\\/g, "/")
          .replace(/^\/+|\/+$/g, "");
        const normalizedFileName = config.fileName.trim().toLowerCase().endsWith(".json")
          ? config.fileName.trim()
          : `${config.fileName.trim()}.json`;

        if (!normalizedFileName || normalizedFileName === ".json") {
          return { ok: false, reason: "Endpoint file name is required." };
        }

        const currentState = get();

        if (
          currentState.endpointConfigs.some(
            (item) =>
              item.id !== configId &&
              item.protocol === config.protocol &&
              item.folderPath.toLowerCase() === normalizedFolderPath.toLowerCase() &&
              item.fileName.toLowerCase() === normalizedFileName.toLowerCase(),
          )
        ) {
          return { ok: false, reason: "An endpoint config already exists for that protocol and path." };
        }

        set((state) => ({
          endpointConfigs: state.endpointConfigs.map((item) =>
            item.id === configId
              ? {
                  ...item,
                  ...config,
                  folderPath: normalizedFolderPath,
                  fileName: normalizedFileName,
                }
              : item,
          ),
        }));

        return { ok: true };
      },
      removeEndpointConfig: (configId) =>
        set((state) => ({
          endpointConfigs: state.endpointConfigs.filter((item) => item.id !== configId),
        })),
      addCustomComponent: (component) => {
        const normalized = normalizeComponentTemplate(component);

        if ("error" in normalized) {
          return { ok: false, reason: normalized.error };
        }

        const currentState = get();

        if (
          currentState.customComponents.some(
            (item) => item.type.toLowerCase() === normalized.type.toLowerCase(),
          )
        ) {
          return { ok: false, reason: "A component with that type already exists." };
        }

        set((state) => ({
          customComponents: [
            ...state.customComponents,
            {
              id: `component-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              ...normalized,
            },
          ],
        }));

        return { ok: true };
      },
      updateCustomComponent: (componentId, component) => {
        const normalized = normalizeComponentTemplate(component);

        if ("error" in normalized) {
          return { ok: false, reason: normalized.error };
        }

        const currentState = get();

        if (
          currentState.customComponents.some(
            (item) =>
              item.id !== componentId &&
              item.type.toLowerCase() === normalized.type.toLowerCase(),
          )
        ) {
          return { ok: false, reason: "A component with that type already exists." };
        }

        set((state) => ({
          customComponents: state.customComponents.map((item) =>
            item.id === componentId ? { id: item.id, ...normalized } : item,
          ),
        }));

        return { ok: true };
      },
      removeCustomComponent: (componentId) =>
        set((state) => ({
          customComponents: state.customComponents.filter((item) => item.id !== componentId),
        })),
      exportWorkflow: () => {
        const state = get();
        const activeWorkflow = state.workflows[state.activeWorkflowId];

        return {
          version: 2,
          workflowId: activeWorkflow.id,
          name: activeWorkflow.name,
          exportedAt: new Date().toISOString(),
          rootCanvasId: activeWorkflow.rootCanvasId,
          currentCanvasId: activeWorkflow.currentCanvasId,
          canvasStack: activeWorkflow.canvasStack,
          canvases: activeWorkflow.canvases,
          ...(activeWorkflow.backendRoutePublication
            ? { backendRoutePublication: activeWorkflow.backendRoutePublication }
            : {}),
        };
      },
      exportBackendRouteJson: () => {
        const state = get();
        const activeWorkflow = state.workflows[state.activeWorkflowId];

        return createBackendRouteJson(activeWorkflow);
      },

      markBackendRoutePublished: (routeName, routeSignature) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          return syncActiveWorkflow(state, {
            ...activeWorkflow,
            backendRoutePublication: {
              routeName,
              lastSyncedSignature: routeSignature,
              syncedAt: new Date().toISOString(),
            },
          });
        }),

      openDirectRouteEditor: (route) =>
        set((state) => ({
          directRouteEditorSession: {
            route,
            sourceWorkflowId: state.activeWorkflowId,
          },
        })),

      closeDirectRouteEditor: () =>
        set(() => ({
          directRouteEditorSession: null,
        })),

      importWorkflow: (raw, fallbackName = "Imported Workflow") => {
        const currentWorkflows = get().workflows;
        const importedWorkflow =
          normalizeImportedWorkflow(raw, currentWorkflows, fallbackName) ??
          buildWorkflowFromRouteDefinition(raw, currentWorkflows, fallbackName);

        if (!importedWorkflow) {
          return false;
        }

        set((state) => ({
          workflows: {
            ...state.workflows,
            [importedWorkflow.id]: importedWorkflow,
          },
          workflowOrder: [...state.workflowOrder, importedWorkflow.id],
          activeWorkflowId: importedWorkflow.id,
          canvases: importedWorkflow.canvases,
          currentCanvasId: importedWorkflow.currentCanvasId,
          canvasStack: importedWorkflow.canvasStack,
          selectedNode: null,
          selectedEdge: null,
        }));

        return true;
      },

      createWorkflow: (name = "Workflow") => {
        const currentWorkflows = get().workflows;
        const workflowName = dedupeWorkflowName(name, currentWorkflows);
        const workflowId = createWorkflowId(workflowName);
        const rootCanvasId = `canvas-${workflowId}`;
        const workflow: WorkflowRecord = {
          id: workflowId,
          name: workflowName,
          rootCanvasId,
          currentCanvasId: rootCanvasId,
          canvasStack: [rootCanvasId],
          canvases: {
            [rootCanvasId]: createCanvas(rootCanvasId, workflowName),
          },
        };

        set((state) => ({
          workflows: {
            ...state.workflows,
            [workflow.id]: workflow,
          },
          workflowOrder: [...state.workflowOrder, workflow.id],
          activeWorkflowId: workflow.id,
          canvases: workflow.canvases,
          currentCanvasId: workflow.currentCanvasId,
          canvasStack: workflow.canvasStack,
          selectedNode: null,
          selectedEdge: null,
        }));

        return { id: workflow.id, name: workflow.name };
      },

      selectWorkflow: (workflowId) =>
        set((state) => {
          const workflow = state.workflows[workflowId];

          if (!workflow) {
            return state;
          }

          return {
            activeWorkflowId: workflow.id,
            canvases: workflow.canvases,
            currentCanvasId: workflow.currentCanvasId,
            canvasStack: workflow.canvasStack,
            selectedNode: null,
            selectedEdge: null,
          };
        }),

      deleteWorkflow: (workflowId) =>
        set((state) => {
          if (!(workflowId in state.workflows)) {
            return state;
          }

          const nextWorkflowOrder = state.workflowOrder.filter((id) => id !== workflowId);

          if (nextWorkflowOrder.length === 0) {
            const replacementWorkflow = createInitialWorkflow();

            return {
              workflows: {
                [replacementWorkflow.id]: replacementWorkflow,
              },
              workflowOrder: [replacementWorkflow.id],
              activeWorkflowId: replacementWorkflow.id,
              canvases: replacementWorkflow.canvases,
              currentCanvasId: replacementWorkflow.currentCanvasId,
              canvasStack: replacementWorkflow.canvasStack,
              selectedNode: null,
              selectedEdge: null,
            };
          }

          const { [workflowId]: deletedWorkflow, ...remainingWorkflows } = state.workflows;
          void deletedWorkflow;
          const nextActiveWorkflowId =
            state.activeWorkflowId === workflowId
              ? nextWorkflowOrder[0]
              : state.activeWorkflowId;
          const nextActiveWorkflow = remainingWorkflows[nextActiveWorkflowId];

          if (!nextActiveWorkflow) {
            return state;
          }

          return {
            workflows: remainingWorkflows,
            workflowOrder: nextWorkflowOrder,
            activeWorkflowId: nextActiveWorkflow.id,
            canvases: nextActiveWorkflow.canvases,
            currentCanvasId: nextActiveWorkflow.currentCanvasId,
            canvasStack: nextActiveWorkflow.canvasStack,
            selectedNode: null,
            selectedEdge: null,
          };
        }),

      updateNodeData: (id, newData) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          const currentCanvas = activeWorkflow.canvases[activeWorkflow.currentCanvasId];
          const currentNode = currentCanvas.nodes.find((node) => node.id === id);
          const childCanvasId = currentNode?.data?.childCanvasId;
          const nextNodes = currentCanvas.nodes.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    ...newData,
                    config: {
                      ...(node.data?.config ?? {}),
                      ...(newData.config ?? {}),
                    },
                  },
                }
              : node,
          );
          const nextCanvases = {
            ...activeWorkflow.canvases,
            [activeWorkflow.currentCanvasId]: {
              ...currentCanvas,
              nodes: nextNodes,
            },
            ...(childCanvasId && typeof newData.label === "string"
              ? {
                  [childCanvasId]: {
                    ...activeWorkflow.canvases[childCanvasId],
                    name: newData.label,
                  },
                }
              : {}),
          };
          const nextWorkflowName =
            id === activeWorkflow.rootCanvasId && typeof newData.label === "string"
              ? dedupeWorkflowName(newData.label, state.workflows, activeWorkflow.id)
              : activeWorkflow.name;

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              name: nextWorkflowName,
              canvases: nextCanvases,
            }),
            selectedNode:
              state.selectedNode?.id === id
                ? {
                    ...state.selectedNode,
                    data: {
                      ...state.selectedNode.data,
                      ...newData,
                      config: {
                        ...(state.selectedNode.data?.config ?? {}),
                        ...(newData.config ?? {}),
                      },
                    },
                  }
                : state.selectedNode,
          };
        }),

      deleteNode: (id) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          const currentCanvas = activeWorkflow.canvases[activeWorkflow.currentCanvasId];
          const nodeToDelete = currentCanvas.nodes.find((node) => node.id === id);
          let nextCanvases = {
            ...activeWorkflow.canvases,
            [activeWorkflow.currentCanvasId]: {
              ...currentCanvas,
              nodes: currentCanvas.nodes.filter((node) => node.id !== id),
              edges: currentCanvas.edges.filter(
                (edge) => edge.source !== id && edge.target !== id,
              ),
            },
          };

          for (const childCanvasId of nodeToDelete ? getNodeNestedCanvasIds(nodeToDelete) : []) {
            nextCanvases = removeCanvasSubtree(nextCanvases, childCanvasId);
          }

          const deletedCanvasIds = new Set(
            nodeToDelete ? getNodeNestedCanvasIds(nodeToDelete) : [],
          );
          const nextStack = activeWorkflow.canvasStack.filter(
            (canvasId) => !deletedCanvasIds.has(canvasId),
          );
          const nextCurrentCanvasId = nextCanvases[activeWorkflow.currentCanvasId]
            ? activeWorkflow.currentCanvasId
            : activeWorkflow.rootCanvasId;

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              canvases: nextCanvases,
              currentCanvasId: nextCurrentCanvasId,
              canvasStack:
                nextStack.length > 0 && nextStack[nextStack.length - 1] === nextCurrentCanvasId
                  ? nextStack
                  : [activeWorkflow.rootCanvasId],
            }),
            selectedNode: state.selectedNode?.id === id ? null : state.selectedNode,
            selectedEdge:
              state.selectedEdge &&
              (state.selectedEdge.source === id || state.selectedEdge.target === id)
                ? null
                : state.selectedEdge,
          };
        }),

      deleteEdge: (id) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          const currentCanvas = activeWorkflow.canvases[activeWorkflow.currentCanvasId];

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              canvases: {
                ...activeWorkflow.canvases,
                [activeWorkflow.currentCanvasId]: {
                  ...currentCanvas,
                  edges: currentCanvas.edges.filter((edge) => edge.id !== id),
                },
              },
            }),
            selectedEdge: state.selectedEdge?.id === id ? null : state.selectedEdge,
          };
        }),

      arrangeCurrentRoute: () =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          const currentCanvas = activeWorkflow.canvases[activeWorkflow.currentCanvasId];

          if (!currentCanvas) {
            return state;
          }

          return syncActiveWorkflow(state, {
            ...activeWorkflow,
            canvases: {
              ...activeWorkflow.canvases,
              [activeWorkflow.currentCanvasId]: arrangeRouteCanvas(currentCanvas),
            },
          });
        }),

      clearCurrentCanvas: () =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          const currentCanvas = activeWorkflow.canvases[activeWorkflow.currentCanvasId];

          if (!currentCanvas) {
            return state;
          }

          const isBranchCanvas = isChoiceBranchCanvas(activeWorkflow, currentCanvas.id);
          const startNode = isBranchCanvas
            ? null
            : currentCanvas.nodes.find((node) => node.type === "start") ??
              createStartNode(`${currentCanvas.id}-start`, { x: 160, y: 120 });

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              canvases: {
                ...activeWorkflow.canvases,
                [activeWorkflow.currentCanvasId]: {
                  ...currentCanvas,
                  nodes: startNode ? [startNode] : [],
                  edges: [],
                },
              },
            }),
            selectedNode: null,
            selectedEdge: null,
          };
        }),

      insertNodeOnEdge: (edgeId, componentKey) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          const currentCanvas = activeWorkflow.canvases[activeWorkflow.currentCanvasId];
          const edgeToSplit = currentCanvas.edges.find((edge) => edge.id === edgeId);

          if (!edgeToSplit) {
            return state;
          }

          const sourceNode = currentCanvas.nodes.find(
            (node) => node.id === edgeToSplit.source,
          );
          const targetNode = currentCanvas.nodes.find(
            (node) => node.id === edgeToSplit.target,
          );
          const newNode = createFlowNode(
            componentKey,
            sourceNode && targetNode
              ? {
                  x: (sourceNode.position.x + targetNode.position.x) / 2,
                  y: (sourceNode.position.y + targetNode.position.y) / 2,
                }
              : { x: 200, y: 200 },
            state.customComponents,
          );

          const remainingEdges = currentCanvas.edges.filter((edge) => edge.id !== edgeId);
          const nextCanvases: Record<string, CanvasState> = {
            ...activeWorkflow.canvases,
            [activeWorkflow.currentCanvasId]: {
              ...currentCanvas,
              nodes: [...currentCanvas.nodes, newNode],
              edges: [
                ...remainingEdges,
                {
                  id: `${edgeToSplit.source}-${newNode.id}`,
                  source: edgeToSplit.source,
                  target: newNode.id,
                  type: "insertable",
                },
                {
                  id: `${newNode.id}-${edgeToSplit.target}`,
                  source: newNode.id,
                  target: edgeToSplit.target,
                  type: "insertable",
                },
              ],
            },
          };

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              canvases: nextCanvases,
            }),
            selectedNode: newNode,
            selectedEdge: null,
          };
        }),

      openNestedRouteCanvas: (nodeId) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          const currentCanvas = activeWorkflow.canvases[activeWorkflow.currentCanvasId];
          const node = currentCanvas?.nodes.find((item) => item.id === nodeId);

          if (!currentCanvas || !node) {
            return state;
          }

          const existingChildCanvasId = node.data?.childCanvasId;
          const childCanvasId =
            existingChildCanvasId ??
            `canvas-${nodeId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const childCanvasName = node.data?.label || "Nested Route";
          const childCanvas =
            activeWorkflow.canvases[childCanvasId] ?? createCanvas(childCanvasId, childCanvasName);
          const nextNodes = existingChildCanvasId
            ? currentCanvas.nodes
            : currentCanvas.nodes.map((item) =>
                item.id === nodeId
                  ? {
                      ...item,
                      data: {
                        ...item.data,
                        childCanvasId,
                      },
                    }
                  : item,
              );
          const nextStack = activeWorkflow.canvasStack.includes(childCanvasId)
            ? activeWorkflow.canvasStack.slice(0, activeWorkflow.canvasStack.indexOf(childCanvasId) + 1)
            : [...activeWorkflow.canvasStack, childCanvasId];

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              currentCanvasId: childCanvasId,
              canvasStack: nextStack,
              canvases: {
                ...activeWorkflow.canvases,
                [activeWorkflow.currentCanvasId]: {
                  ...currentCanvas,
                  nodes: nextNodes,
                },
                [childCanvasId]: childCanvas,
              },
            }),
            selectedNode: null,
            selectedEdge: null,
          };
        }),

      openChoiceBranchCanvas: (nodeId, branchKey) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          const currentCanvas = activeWorkflow.canvases[activeWorkflow.currentCanvasId];
          const node = currentCanvas?.nodes.find((item) => item.id === nodeId);

          if (!currentCanvas || !node) {
            return state;
          }

          const existingBranchCanvasId = node.data?.choiceBranchCanvasIds?.[branchKey];
          const branchCanvasId =
            existingBranchCanvasId ??
            `canvas-${nodeId}-${branchKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const branchCanvasName = getChoiceBranchName(node, branchKey);
          const branchCanvas =
            activeWorkflow.canvases[branchCanvasId] ??
            createCanvasFromBackendSteps(
              branchCanvasId,
              branchCanvasName,
              getChoiceBranchFallbackSteps(node, branchKey),
              { includeStart: false },
            );
          const nextBranchCanvasIds = {
            ...(node.data?.choiceBranchCanvasIds ?? {}),
            [branchKey]: branchCanvasId,
          };
          const nextNodes = existingBranchCanvasId
            ? currentCanvas.nodes
            : currentCanvas.nodes.map((item) =>
                item.id === nodeId
                  ? {
                      ...item,
                      data: {
                        ...item.data,
                        choiceBranchCanvasIds: nextBranchCanvasIds,
                      },
                    }
                  : item,
              );
          const nextStack = activeWorkflow.canvasStack.includes(branchCanvasId)
            ? activeWorkflow.canvasStack.slice(0, activeWorkflow.canvasStack.indexOf(branchCanvasId) + 1)
            : [...activeWorkflow.canvasStack, branchCanvasId];

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              currentCanvasId: branchCanvasId,
              canvasStack: nextStack,
              canvases: {
                ...activeWorkflow.canvases,
                [activeWorkflow.currentCanvasId]: {
                  ...currentCanvas,
                  nodes: nextNodes,
                },
                [branchCanvasId]: {
                  ...branchCanvas,
                  name: branchCanvasName,
                  nodes: branchCanvas.nodes.filter((branchNode) => branchNode.type !== "start"),
                  edges: branchCanvas.edges.filter((edge) =>
                    branchCanvas.nodes.every(
                      (branchNode) =>
                        branchNode.type !== "start" ||
                        (edge.source !== branchNode.id && edge.target !== branchNode.id),
                    ),
                  ),
                },
              },
            }),
            selectedNode: null,
            selectedEdge: null,
          };
        }),

      openSplitCanvas: (nodeId) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          const currentCanvas = activeWorkflow.canvases[activeWorkflow.currentCanvasId];
          const node = currentCanvas?.nodes.find((item) => item.id === nodeId);

          if (!currentCanvas || !node) {
            return state;
          }

          const existingChildCanvasId = node.data?.childCanvasId;
          const childCanvasId =
            existingChildCanvasId ??
            `canvas-${nodeId}-split-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const childCanvasName = getSplitCanvasName(node);
          const childCanvas =
            activeWorkflow.canvases[childCanvasId] ??
            createCanvasFromBackendSteps(
              childCanvasId,
              childCanvasName,
              node.data?.config?.steps,
              { includeStart: false },
            );
          const nextNodes = existingChildCanvasId
            ? currentCanvas.nodes
            : currentCanvas.nodes.map((item) =>
                item.id === nodeId
                  ? {
                      ...item,
                      data: {
                        ...item.data,
                        childCanvasId,
                      },
                    }
                  : item,
              );
          const nextStack = activeWorkflow.canvasStack.includes(childCanvasId)
            ? activeWorkflow.canvasStack.slice(0, activeWorkflow.canvasStack.indexOf(childCanvasId) + 1)
            : [...activeWorkflow.canvasStack, childCanvasId];

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              currentCanvasId: childCanvasId,
              canvasStack: nextStack,
              canvases: {
                ...activeWorkflow.canvases,
                [activeWorkflow.currentCanvasId]: {
                  ...currentCanvas,
                  nodes: nextNodes,
                },
                [childCanvasId]: {
                  ...childCanvas,
                  name: childCanvasName,
                  nodes: childCanvas.nodes.filter((childNode) => childNode.type !== "start"),
                  edges: childCanvas.edges.filter((edge) =>
                    childCanvas.nodes.every(
                      (childNode) =>
                        childNode.type !== "start" ||
                        (edge.source !== childNode.id && edge.target !== childNode.id),
                    ),
                  ),
                },
              },
            }),
            selectedNode: null,
            selectedEdge: null,
          };
        }),

      goBackCanvas: () =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow || activeWorkflow.canvasStack.length <= 1) {
            return state;
          }

          const nextStack = activeWorkflow.canvasStack.slice(0, -1);

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              currentCanvasId: nextStack[nextStack.length - 1],
              canvasStack: nextStack,
            }),
            selectedNode: null,
            selectedEdge: null,
          };
        }),

      openCanvasFromBreadcrumb: (canvasId) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          const index = activeWorkflow.canvasStack.indexOf(canvasId);

          if (index === -1) {
            return state;
          }

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              currentCanvasId: canvasId,
              canvasStack: activeWorkflow.canvasStack.slice(0, index + 1),
            }),
            selectedNode: null,
            selectedEdge: null,
          };
        }),

      updateEdgeData: (edgeId, data) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          const currentCanvas = activeWorkflow.canvases[activeWorkflow.currentCanvasId];
          const nextEdges = currentCanvas.edges.map((edge) =>
            edge.id === edgeId
              ? { ...edge, data: { ...(edge.data ?? {}), ...data } }
              : edge,
          );

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              canvases: {
                ...activeWorkflow.canvases,
                [activeWorkflow.currentCanvasId]: {
                  ...currentCanvas,
                  edges: nextEdges,
                },
              },
            }),
            selectedEdge:
              state.selectedEdge?.id === edgeId
                ? { ...state.selectedEdge, data: { ...(state.selectedEdge.data ?? {}), ...data } }
                : state.selectedEdge,
          };
        }),
    }),
    {
      name: "nextui-flow-store",
      storage: createJSONStorage(() => localStorage),
      version: 9,
      migrate: (persistedState, version) =>
        normalizePersistedState(
          persistedState as PersistedFlowState,
          typeof version === "number" && version < 6,
        ),
      partialize: (state) => ({
        workflows: state.workflows,
        workflowOrder: state.workflowOrder,
        activeWorkflowId: state.activeWorkflowId,
        canvases: state.canvases,
        currentCanvasId: state.currentCanvasId,
        canvasStack: state.canvasStack,
        isSidebarOpen: state.isSidebarOpen,
        sidebarView: state.sidebarView,
        selectedConfigSection: state.selectedConfigSection,
        selectedSecuritySubsection: state.selectedSecuritySubsection,
        selectedLlmSubsection: state.selectedLlmSubsection,
        beans: state.beans,
        dataSources: state.dataSources,
        dataSourceTenants: state.dataSourceTenants,
        securityConfigs: state.securityConfigs,
        llmConfigs: state.llmConfigs,
        ragConfigs: state.ragConfigs,
        endpointConfigs: state.endpointConfigs,
        customComponents: state.customComponents,
      }),
    },
  ),
);
