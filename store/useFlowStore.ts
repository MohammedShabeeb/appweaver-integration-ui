import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Edge, Node, XYPosition } from "reactflow";
import {
  getComponentDependencies,
  type MavenDependencyDefinition,
  type ComponentType,
  type BuiltInComponentType,
  isBuiltInComponent,
} from "@/config/componentCatalog";
import type { DataSourceStrategy } from "@/config/datasourceCatalog";

type InsertableNodeType = Exclude<ComponentType, "start">;
type SidebarView = "components" | "workflows" | "configs";
type ConfigSection = "beans" | "datasources" | "security";

export type SecuritySubsection = "auth" | "authorize";

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

export type CreatedSecurityConfig = {
  id: string;
  subsection: SecuritySubsection;
  fileName: string;
  content: string;
};

type AppNodeData = {
  label: string;
  config: Record<string, unknown>;
  componentKey?: string;
  description?: string;
  accentColor?: string;
  childCanvasId?: string;
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
};

type RouteImportStep = {
  type?: string;
  name?: string;
  library?: string;
  clazz?: string;
  ref?: string;
  dependencies?: unknown;
};

type RouteImportDefinition = {
  routeId?: string;
  from?: string;
  contentType?: string;
  steps?: RouteImportStep[];
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
  beans?: CreatedBean[];
  dataSources?: CreatedDataSource[];
  securityConfigs?: CreatedSecurityConfig[];
};

type WorkflowPomDependency = MavenDependencyDefinition;

const DEFAULT_WORKFLOW_ID = "workflow-root";
const ROOT_CANVAS_ID = "root-canvas";

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
): AppNode {
  if (!isBuiltInComponent(componentKey)) {
    throw new Error(`Unsupported component type: ${componentKey}`);
  }

  const builtInType = componentKey;
  const id = `${componentKey}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const labelMap: Record<BuiltInComponentType, string> = {
    start: "From",
    marshal: "Marshal",
    unmarshal: "Unmarshal",
    process: "Process",
  };
  const defaultConfigMap: Partial<Record<BuiltInComponentType, Record<string, unknown>>> = {
    marshal: {
      name: "json",
      library: "Jackson",
      clazz: "java.util.Map",
    },
    unmarshal: {
      name: "json",
      library: "Jackson",
      clazz: "java.util.Map",
    },
    process: {
      ref: "processorRef",
    },
  };

  const node: AppNode = {
    id,
    type: builtInType,
    position,
    data: {
      label: labelMap[builtInType],
      config: defaultConfigMap[builtInType] ?? {},
      componentKey,
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
    const childCanvasId = node.data?.childCanvasId;

    if (childCanvasId) {
      nextCanvases = removeCanvasSubtree(nextCanvases, childCanvasId);
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
      if (node.data?.childCanvasId) {
        nextCanvasMap = removeCanvasSubtree(nextCanvasMap, node.data.childCanvasId);
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
  };
}

function normalizeDependencyList(raw: unknown): WorkflowPomDependency[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((item): item is WorkflowPomDependency => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const candidate = item as Partial<WorkflowPomDependency>;

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

function collectWorkflowDependencies(workflow: WorkflowRecord): WorkflowPomDependency[] {
  const dependencyMap = new Map<string, WorkflowPomDependency>();

  for (const canvas of Object.values(workflow.canvases)) {
    for (const node of canvas.nodes) {
      const componentKey = node.data?.componentKey;

      if (!componentKey || !isBuiltInComponent(componentKey)) {
        continue;
      }

      for (const dependency of getComponentDependencies(componentKey)) {
        const key = `${dependency.groupId}:${dependency.artifactId}`;

        if (!dependencyMap.has(key)) {
          dependencyMap.set(key, dependency);
        }
      }

      const configDependencies = normalizeDependencyList(node.data?.config?.dependencies);

      for (const dependency of configDependencies) {
        const key = `${dependency.groupId}:${dependency.artifactId}`;

        if (!dependencyMap.has(key)) {
          dependencyMap.set(key, dependency);
        }
      }
    }
  }

  return [...dependencyMap.values()];
}

function createPomXml(workflow: WorkflowRecord) {
  const artifactId =
    workflow.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "camel-workflow";
  const dependencies = collectWorkflowDependencies(workflow);
  const dependencyBlocks =
    dependencies.length > 0
      ? dependencies
          .map(
            (dependency) => `    <dependency>
      <groupId>${dependency.groupId}</groupId>
      <artifactId>${dependency.artifactId}</artifactId>
      <version>${dependency.version}</version>
    </dependency>`,
          )
          .join("\n")
      : "    <!-- No additional component dependencies required -->";

  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>${artifactId}</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <name>${workflow.name}</name>

  <dependencies>
${dependencyBlocks}
  </dependencies>
</project>
`;
}

function buildWorkflowFromRouteDefinition(
  raw: unknown,
  existingWorkflows: Record<string, WorkflowRecord>,
  fallbackName: string,
): WorkflowRecord | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const route = raw as RouteImportDefinition;

  if (!Array.isArray(route.steps)) {
    return null;
  }

  const supportedSteps = route.steps.filter(
    (step): step is RouteImportStep & { type: "marshal" | "unmarshal" | "process" } =>
      step?.type === "marshal" || step?.type === "unmarshal" || step?.type === "process",
  );

  if (supportedSteps.length !== route.steps.length) {
    return null;
  }

  const workflowNameSource =
    (typeof route.routeId === "string" && route.routeId.trim()) ||
    (typeof fallbackName === "string" && fallbackName.trim()) ||
    "Imported Route";
  const workflowName = dedupeWorkflowName(workflowNameSource, existingWorkflows);
  const workflowId = createWorkflowId(workflowName);
  const rootCanvasId = `canvas-${workflowId}`;
  const startNodeId = `${rootCanvasId}-start`;
  const startNode = createStartNode(startNodeId, { x: 160, y: 140 });

  startNode.data = {
    ...startNode.data,
    label: typeof route.from === "string" && route.from.trim() ? route.from : "From",
    config: {
      from: route.from ?? "",
      routeId: route.routeId ?? "",
      contentType: route.contentType ?? "",
    },
  };

  const nodes: AppNode[] = [startNode];
  const edges: AppEdge[] = [];
  let previousNodeId = startNodeId;

  supportedSteps.forEach((step, index) => {
    const componentKey = step.type;
    const node = createFlowNode(componentKey, { x: 160 + (index + 1) * 240, y: 140 });

    node.data = {
      ...node.data,
      label:
        componentKey === "process"
          ? step.ref?.trim() || "Process"
          : componentKey === "marshal"
            ? "Marshal"
            : "Unmarshal",
      config:
        componentKey === "process"
          ? {
              ref: step.ref ?? "",
              dependencies: normalizeDependencyList(step.dependencies),
            }
          : {
              name: step.name ?? "json",
              library: step.library ?? "Jackson",
              clazz: step.clazz ?? "java.util.Map",
              dependencies: normalizeDependencyList(step.dependencies),
            },
    };

    nodes.push(node);
    edges.push({
      id: `${previousNodeId}-${node.id}`,
      source: previousNodeId,
      target: node.id,
      type: "insertable",
    });
    previousNodeId = node.id;
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
  const securityConfigs = persistedState?.securityConfigs ?? [];
  const isSidebarOpen = persistedState?.isSidebarOpen ?? false;
  const sidebarView = persistedState?.sidebarView ?? "components";
  const selectedConfigSection = persistedState?.selectedConfigSection ?? "beans";
  const selectedSecuritySubsection = persistedState?.selectedSecuritySubsection ?? "auth";

  const shouldPruneLegacyNode = (node: AppNode) =>
    !["start", "marshal", "unmarshal", "process"].includes(node.type ?? "");

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
      beans,
      dataSources,
      securityConfigs,
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
    beans,
    dataSources,
    securityConfigs,
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
  isSidebarOpen: boolean;
  sidebarView: SidebarView;
  selectedConfigSection: ConfigSection;
  selectedSecuritySubsection: SecuritySubsection;
  beans: CreatedBean[];
  dataSources: CreatedDataSource[];
  securityConfigs: CreatedSecurityConfig[];
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: AppEdge[]) => void;
  addNode: (componentKey: ComponentType, position: XYPosition) => void;
  setSelectedNode: (node: AppNode | null) => void;
  setSelectedEdge: (edge: AppEdge | null) => void;
  clearSelection: () => void;
  updateNodeData: (id: string, data: Partial<AppNodeData>) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  clearCurrentCanvas: () => void;
  insertNodeOnEdge: (edgeId: string, type: InsertableNodeType) => void;
  goBackCanvas: () => void;
  openCanvasFromBreadcrumb: (canvasId: string) => void;
  toggleSidebar: () => void;
  openSidebar: (view: SidebarView) => void;
  openConfigSection: (section: ConfigSection) => void;
  selectSecuritySubsection: (section: SecuritySubsection) => void;
  addBean: (bean: Omit<CreatedBean, "id">) => { ok: true } | { ok: false; reason: string };
  updateBean: (beanId: string, bean: Omit<CreatedBean, "id">) => { ok: true } | { ok: false; reason: string };
  removeBean: (beanId: string) => void;
  addDataSource: (dataSource: Omit<CreatedDataSource, "id">) => { ok: true } | { ok: false; reason: string };
  updateDataSource: (
    dataSourceId: string,
    dataSource: Omit<CreatedDataSource, "id">,
  ) => { ok: true } | { ok: false; reason: string };
  removeDataSource: (dataSourceId: string) => void;
  addSecurityConfig: (
    config: Omit<CreatedSecurityConfig, "id" | "fileName">,
  ) => { ok: true } | { ok: false; reason: string };
  updateSecurityConfig: (
    configId: string,
    config: Omit<CreatedSecurityConfig, "id" | "fileName">,
  ) => { ok: true } | { ok: false; reason: string };
  removeSecurityConfig: (configId: string) => void;
  exportWorkflow: () => WorkflowExport;
  exportPomXml: () => string;
  importWorkflow: (raw: unknown, fallbackName?: string) => boolean;
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
      isSidebarOpen: false,
      sidebarView: "components",
      selectedConfigSection: "beans",
      selectedSecuritySubsection: "auth",
      beans: [],
      dataSources: [],
      securityConfigs: [],

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
          const newNode = createFlowNode(componentKey, position);
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
          };
        }),

      setSelectedNode: (node) => set({ selectedNode: node }),
      setSelectedEdge: (edge) => set({ selectedEdge: edge }),
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
        };
      },
      exportPomXml: () => {
        const state = get();
        const activeWorkflow = state.workflows[state.activeWorkflowId];

        return createPomXml(activeWorkflow);
      },

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

          if (nodeToDelete?.data?.childCanvasId) {
            nextCanvases = removeCanvasSubtree(nextCanvases, nodeToDelete.data.childCanvasId);
          }

          const nextStack = activeWorkflow.canvasStack.filter(
            (canvasId) => canvasId !== nodeToDelete?.data?.childCanvasId,
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

          const startNode =
            currentCanvas.nodes.find((node) => node.type === "start") ??
            createStartNode(`${currentCanvas.id}-start`, { x: 160, y: 120 });

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              canvases: {
                ...activeWorkflow.canvases,
                [activeWorkflow.currentCanvasId]: {
                  ...currentCanvas,
                  nodes: [startNode],
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
      version: 8,
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
        beans: state.beans,
        dataSources: state.dataSources,
        securityConfigs: state.securityConfigs,
      }),
    },
  ),
);
