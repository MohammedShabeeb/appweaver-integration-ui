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

interface FlowState {
  canvases: Record<string, CanvasState>;
  currentCanvasId: string;
  canvasStack: string[];
  selectedNode: AppNode | null;
  selectedEdge: AppEdge | null;
  isSidebarOpen: boolean;
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
}

const initialRootCanvas = createCanvas(ROOT_CANVAS_ID, "Root");

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      canvases: {
        [ROOT_CANVAS_ID]: initialRootCanvas,
      },
      currentCanvasId: ROOT_CANVAS_ID,
      canvasStack: [ROOT_CANVAS_ID],
      selectedNode: null,
      selectedEdge: null,
      isSidebarOpen: false,

      setNodes: (nodes) =>
        set((state) => ({
          canvases: {
            ...state.canvases,
            [state.currentCanvasId]: {
              ...state.canvases[state.currentCanvasId],
              nodes,
            },
          },
        })),

      setEdges: (edges) =>
        set((state) => ({
          canvases: {
            ...state.canvases,
            [state.currentCanvasId]: {
              ...state.canvases[state.currentCanvasId],
              edges,
            },
          },
        })),

      addNode: (type, position) =>
        set((state) => {
          const currentCanvas = state.canvases[state.currentCanvasId];
          const newNode = createFlowNode(type, position);
          const nextCanvases: Record<string, CanvasState> = {
            ...state.canvases,
            [state.currentCanvasId]: {
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
            canvases: nextCanvases,
            selectedNode: newNode,
            selectedEdge: null,
          };
        }),

      setSelectedNode: (node) => set({ selectedNode: node }),
      setSelectedEdge: (edge) => set({ selectedEdge: edge }),
      clearSelection: () => set({ selectedNode: null, selectedEdge: null }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      updateNodeData: (id, newData) =>
        set((state) => {
          const currentCanvas = state.canvases[state.currentCanvasId];
          const currentNode = currentCanvas.nodes.find((node) => node.id === id);
          const childCanvasId = currentNode?.data?.childCanvasId;

          return {
            canvases: {
              ...state.canvases,
              [state.currentCanvasId]: {
                ...currentCanvas,
                nodes: currentCanvas.nodes.map((node) =>
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
                ),
              },
              ...(childCanvasId && typeof newData.label === "string"
                ? {
                    [childCanvasId]: {
                      ...state.canvases[childCanvasId],
                      name: newData.label,
                    },
                  }
                : {}),
            },
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
          const currentCanvas = state.canvases[state.currentCanvasId];
          const nodeToDelete = currentCanvas.nodes.find((node) => node.id === id);
          let nextCanvases = {
            ...state.canvases,
            [state.currentCanvasId]: {
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

          const nextStack = state.canvasStack.filter(
            (canvasId) => canvasId !== nodeToDelete?.data?.childCanvasId,
          );

          return {
            canvases: nextCanvases,
            currentCanvasId:
              nextCanvases[state.currentCanvasId]
                ? state.currentCanvasId
                : ROOT_CANVAS_ID,
            canvasStack: nextStack.length > 0 ? nextStack : [ROOT_CANVAS_ID],
            selectedNode:
              state.selectedNode?.id === id ? null : state.selectedNode,
            selectedEdge:
              state.selectedEdge &&
              (state.selectedEdge.source === id || state.selectedEdge.target === id)
                ? null
                : state.selectedEdge,
          };
        }),

      deleteEdge: (id) =>
        set((state) => {
          const currentCanvas = state.canvases[state.currentCanvasId];

          return {
            canvases: {
              ...state.canvases,
              [state.currentCanvasId]: {
                ...currentCanvas,
                edges: currentCanvas.edges.filter((edge) => edge.id !== id),
              },
            },
            selectedEdge: state.selectedEdge?.id === id ? null : state.selectedEdge,
          };
        }),

      insertNodeOnEdge: (edgeId, type) =>
        set((state) => {
          const currentCanvas = state.canvases[state.currentCanvasId];
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
            ...state.canvases,
            [state.currentCanvasId]: {
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
            canvases: nextCanvases,
            selectedNode: newNode,
            selectedEdge: null,
          };
        }),

      openContainer: (nodeId) =>
        set((state) => {
          const currentCanvas = state.canvases[state.currentCanvasId];
          const node = currentCanvas.nodes.find((item) => item.id === nodeId);

          if (!node || node.type !== "container" || !node.data.childCanvasId) {
            return state;
          }

          const childCanvasId = node.data.childCanvasId;
          const childCanvas =
            state.canvases[childCanvasId] ?? createCanvas(childCanvasId, node.data.label);

          return {
            canvases: {
              ...state.canvases,
              [childCanvasId]: childCanvas,
            },
            currentCanvasId: childCanvasId,
            canvasStack: [...state.canvasStack, childCanvasId],
            selectedNode: null,
            selectedEdge: null,
          };
        }),

      goBackCanvas: () =>
        set((state) => {
          if (state.canvasStack.length <= 1) {
            return state;
          }

          const nextStack = state.canvasStack.slice(0, -1);

          return {
            currentCanvasId: nextStack[nextStack.length - 1],
            canvasStack: nextStack,
            selectedNode: null,
            selectedEdge: null,
          };
        }),

      openCanvasFromBreadcrumb: (canvasId) =>
        set((state) => {
          const index = state.canvasStack.indexOf(canvasId);

          if (index === -1) {
            return state;
          }

          return {
            currentCanvasId: canvasId,
            canvasStack: state.canvasStack.slice(0, index + 1),
            selectedNode: null,
            selectedEdge: null,
          };
        }),
    }),
    {
      name: "nextui-flow-store",
      partialize: (state) => ({
        canvases: state.canvases,
        currentCanvasId: state.currentCanvasId,
        canvasStack: state.canvasStack,
      }),
    },
  ),
);
