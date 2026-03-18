import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Edge, Node, XYPosition } from "reactflow";

type AppNodeType = "start" | "http" | "delay" | "container";
type InsertableNodeType = "http" | "delay" | "container";

type AppNodeData = {
  label: string;
  config: Record<string, unknown>;
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

type SidebarView = "components" | "workflows";

type PersistedFlowState = {
  workflows?: Record<string, WorkflowRecord>;
  workflowOrder?: string[];
  activeWorkflowId?: string;
  canvases?: Record<string, CanvasState>;
  currentCanvasId?: string;
  canvasStack?: string[];
};

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

function createFlowNode(type: AppNodeType, position: XYPosition): AppNode {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const labelMap: Record<AppNodeType, string> = {
    start: "From",
    http: "HTTP",
    delay: "Delay",
    container: "Container",
  };

  const node: AppNode = {
    id,
    type,
    position,
    data: {
      label: labelMap[type],
      config: {},
    },
  };

  if (type === "container") {
    node.data.childCanvasId = `canvas-${id}`;
  }

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

function normalizePersistedState(persistedState?: PersistedFlowState) {
  if (persistedState?.workflows && Object.keys(persistedState.workflows).length > 0) {
    const workflowOrder =
      persistedState.workflowOrder?.filter(
        (workflowId) => workflowId in persistedState.workflows!,
      ) ?? Object.keys(persistedState.workflows);
    const activeWorkflowId =
      persistedState.activeWorkflowId && persistedState.activeWorkflowId in persistedState.workflows
        ? persistedState.activeWorkflowId
        : workflowOrder[0];
    const activeWorkflow =
      persistedState.workflows[activeWorkflowId] ?? createInitialWorkflow();

    return {
      workflows: persistedState.workflows,
      workflowOrder,
      activeWorkflowId,
      canvases: activeWorkflow.canvases,
      currentCanvasId: activeWorkflow.currentCanvasId,
      canvasStack: activeWorkflow.canvasStack,
    };
  }

  const legacyWorkflow = createInitialWorkflow();
  const legacyCanvases = persistedState?.canvases;

  if (legacyCanvases && Object.keys(legacyCanvases).length > 0) {
    legacyWorkflow.canvases = legacyCanvases;
    legacyWorkflow.currentCanvasId =
      persistedState.currentCanvasId &&
      persistedState.currentCanvasId in legacyCanvases
        ? persistedState.currentCanvasId
        : legacyWorkflow.rootCanvasId;
    legacyWorkflow.canvasStack =
      persistedState.canvasStack?.filter((canvasId) => canvasId in legacyCanvases) ?? [
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
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: AppEdge[]) => void;
  addNode: (type: AppNodeType, position: XYPosition) => void;
  setSelectedNode: (node: AppNode | null) => void;
  setSelectedEdge: (edge: AppEdge | null) => void;
  clearSelection: () => void;
  updateNodeData: (id: string, data: Partial<AppNodeData>) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  insertNodeOnEdge: (edgeId: string, type: InsertableNodeType) => void;
  openContainer: (nodeId: string) => void;
  goBackCanvas: () => void;
  openCanvasFromBreadcrumb: (canvasId: string) => void;
  toggleSidebar: () => void;
  openSidebar: (view: SidebarView) => void;
  exportWorkflow: () => WorkflowExport;
  importWorkflow: (raw: unknown, fallbackName?: string) => boolean;
  selectWorkflow: (workflowId: string) => void;
  deleteWorkflow: (workflowId: string) => void;
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

      addNode: (type, position) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          const currentCanvas = activeWorkflow.canvases[activeWorkflow.currentCanvasId];
          const newNode = createFlowNode(type, position);
          const nextCanvases: Record<string, CanvasState> = {
            ...activeWorkflow.canvases,
            [activeWorkflow.currentCanvasId]: {
              ...currentCanvas,
              nodes: [...currentCanvas.nodes, newNode],
            },
          };

          if (type === "container" && newNode.data.childCanvasId) {
            nextCanvases[newNode.data.childCanvasId] = createCanvas(
              newNode.data.childCanvasId,
              newNode.data.label,
            );
          }

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

      importWorkflow: (raw, fallbackName = "Imported Workflow") => {
        const importedWorkflow = normalizeImportedWorkflow(
          raw,
          get().workflows,
          fallbackName,
        );

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

      insertNodeOnEdge: (edgeId, type) =>
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
            type,
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

          if (type === "container" && newNode.data.childCanvasId) {
            nextCanvases[newNode.data.childCanvasId] = createCanvas(
              newNode.data.childCanvasId,
              newNode.data.label,
            );
          }

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              canvases: nextCanvases,
            }),
            selectedNode: newNode,
            selectedEdge: null,
          };
        }),

      openContainer: (nodeId) =>
        set((state) => {
          const activeWorkflow = state.workflows[state.activeWorkflowId];

          if (!activeWorkflow) {
            return state;
          }

          const currentCanvas = activeWorkflow.canvases[activeWorkflow.currentCanvasId];
          const node = currentCanvas.nodes.find((item) => item.id === nodeId);

          if (!node || node.type !== "container" || !node.data.childCanvasId) {
            return state;
          }

          const childCanvasId = node.data.childCanvasId;
          const childCanvas =
            activeWorkflow.canvases[childCanvasId] ??
            createCanvas(childCanvasId, node.data.label);

          return {
            ...syncActiveWorkflow(state, {
              ...activeWorkflow,
              canvases: {
                ...activeWorkflow.canvases,
                [childCanvasId]: childCanvas,
              },
              currentCanvasId: childCanvasId,
              canvasStack: [...activeWorkflow.canvasStack, childCanvasId],
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
    }),
    {
      name: "nextui-flow-store",
      version: 2,
      migrate: (persistedState) =>
        normalizePersistedState(persistedState as PersistedFlowState),
      partialize: (state) => ({
        workflows: state.workflows,
        workflowOrder: state.workflowOrder,
        activeWorkflowId: state.activeWorkflowId,
      }),
    },
  ),
);
