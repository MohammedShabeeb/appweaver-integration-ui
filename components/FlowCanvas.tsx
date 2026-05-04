"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  ConnectionMode,
  Controls,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
} from "reactflow";

import "reactflow/dist/style.css";

import { useFlowStore } from "@/store/useFlowStore";

import FromNode from "./nodes/StartNode";
import StepNode from "./nodes/StepNode";
import InsertableEdge from "./edges/InsertableEdge";
import { componentDefinitions } from "@/config/componentCatalog";
import { nodeTypeMeta } from "./node-icons";

const nodeTypes = {
  start: FromNode,
  marshal: StepNode,
  unmarshal: StepNode,
  process: StepNode,
};

const edgeTypes = {
  insertable: InsertableEdge,
};

const EMPTY_NODES = [] as const;
const EMPTY_EDGES = [] as const;

export default function FlowCanvas() {
  const {
    canvases,
    currentCanvasId,
    canvasStack,
    selectedNode,
    selectedEdge,
    setNodes,
    setEdges,
    addNode,
    setSelectedNode,
    setSelectedEdge,
    clearSelection,
    deleteNode,
    deleteEdge,
    clearCurrentCanvas,
    goBackCanvas,
    openCanvasFromBreadcrumb,
    openSidebar,
  } = useFlowStore();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const currentCanvas = canvases[currentCanvasId];
  const nodes = currentCanvas?.nodes ?? EMPTY_NODES;
  const edges = currentCanvas?.edges ?? EMPTY_EDGES;
  const searchResults = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return [];
    }

    const builtInResults = componentDefinitions
      .filter((component) => component.type !== "start")
      .filter((component) => {
        const meta = nodeTypeMeta[component.type];

        return (
          meta.label.toLowerCase().includes(query) || component.type.toLowerCase().includes(query)
        );
      })
      .map((component) => ({
        id: `component-${component.type}`,
        kind: "Component" as const,
        title: nodeTypeMeta[component.type].label,
        subtitle: component.type,
        target: {
          kind: "component" as const,
          groupId: component.defaultGroup,
          componentKey: component.type,
        },
      }));

    return builtInResults.slice(0, 8);
  }, [searchValue]);

  const canUseEndpoint = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) {
        return false;
      }

      if (params.source === params.target) {
        return false;
      }

      const sourceHandle = params.sourceHandle ?? null;
      const targetHandle = params.targetHandle ?? null;
      const sourceNode = nodes.find((node) => node.id === params.source);
      const allowSourceFanOut = sourceNode?.type === "start";

      if (
        !allowSourceFanOut &&
        edges.some(
          (edge) =>
            edge.source === params.source && (edge.sourceHandle ?? null) === sourceHandle,
        )
      ) {
        return false;
      }

      if (
        edges.some(
          (edge) =>
            edge.target === params.target && (edge.targetHandle ?? null) === targetHandle,
        )
      ) {
        return false;
      }

      return true;
    },
    [edges, nodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!canUseEndpoint(params)) {
        return;
      }

      setEdges(
        addEdge(
          {
            ...params,
            type: "insertable",
          },
          edges
        )
      );
    },
    [canUseEndpoint, edges, setEdges]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(applyNodeChanges(changes, nodes));
    },
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges]
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const rawComponent = event.dataTransfer.getData("application/reactflow-component");
      const fallbackType = event.dataTransfer.getData("application/reactflow");
      let componentKey = fallbackType;

      if (rawComponent) {
        try {
          componentKey =
            (JSON.parse(rawComponent) as { componentKey?: string }).componentKey ?? "";
        } catch {
          componentKey = "";
        }
      }

      if (!componentKey) {
        return;
      }

      const position = reactFlowRef.current?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (!position) {
        return;
      }

      addNode(componentKey, position);
    },
    [addNode]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isTyping || (event.key !== "Delete" && event.key !== "Backspace")) {
        return;
      }

      if (selectedEdge) {
        deleteEdge(selectedEdge.id);
        return;
      }

      if (selectedNode && selectedNode.type !== "start") {
        deleteNode(selectedNode.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteEdge, deleteNode, selectedEdge, selectedNode]);

  return (
    <div
      ref={wrapperRef}
      className="relative flex-1 h-full"
      style={{ background: "linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)" }}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div
        style={{
          position: "absolute",
          left: 16,
          top: 16,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderRadius: 12,
          border: "1px solid rgba(226, 232, 240, 0.95)",
          background: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(16px)",
          padding: "6px 12px",
          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
        }}
      >
        <button
          type="button"
          style={{
            borderRadius: 8,
            border: "1px solid rgba(203, 213, 225, 0.95)",
            background: "transparent",
            padding: "4px 10px",
            fontSize: 13,
            color: "#334155",
            cursor: "pointer",
            fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
            opacity: canvasStack.length <= 1 ? 0.35 : 1,
          }}
          onClick={goBackCanvas}
          disabled={canvasStack.length <= 1}
        >
          Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {canvasStack.map((canvasId, index) => (
            <React.Fragment key={canvasId}>
              {index > 0 ? <span style={{ color: "#94a3b8", fontSize: 13 }}>/</span> : null}
              <button
                type="button"
                style={{
                  borderRadius: 8,
                  border: "none",
                  background: canvasId === currentCanvasId
                    ? "rgba(var(--workflow-accent-rgb), 0.10)"
                    : "transparent",
                  padding: "4px 10px",
                  fontSize: 13,
                  color: canvasId === currentCanvasId ? "var(--workflow-accent)" : "#64748b",
                  cursor: "pointer",
                  fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
                }}
                onClick={() => openCanvasFromBreadcrumb(canvasId)}
              >
                {canvases[canvasId]?.name || "Canvas"}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 16,
          top: 72,
          zIndex: 20,
          width: 280,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 12,
            border: "1px solid rgba(226, 232, 240, 0.95)",
            background: "rgba(255, 255, 255, 0.94)",
            backdropFilter: "blur(16px)",
            padding: "8px 10px",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 15, height: 15, color: "#94a3b8", flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search components or categories"
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "#0f172a",
              fontSize: 13,
              outline: "none",
              fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
            }}
          />
        </div>
        {searchResults.length > 0 ? (
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              borderRadius: 14,
              border: "1px solid rgba(226, 232, 240, 0.95)",
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(16px)",
              padding: 8,
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
            }}
          >
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  openSidebar("components");
                  setSearchValue(result.title);
                  window.dispatchEvent(
                    new CustomEvent("focus-sidebar-search-target", {
                      detail: result.target,
                    }),
                  );
                }}
                style={{
                  display: "flex",
                  width: "100%",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 2,
                  border: "none",
                  borderRadius: 10,
                  background: "transparent",
                  padding: "10px 12px",
                  color: "#0f172a",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{result.title}</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {result.kind} &bull; {result.subtitle}
                </span>
              </button>
            ))}
          </div>
        ) : searchValue.trim() ? (
          <div
            style={{
              marginTop: 8,
              borderRadius: 14,
              border: "1px solid rgba(226, 232, 240, 0.95)",
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(16px)",
              padding: "12px 14px",
              color: "#64748b",
              fontSize: 12,
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
            }}
          >
            No matching component or category found.
          </div>
        ) : null}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        proOptions={{ hideAttribution: true }}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={canUseEndpoint}
        onInit={(instance) => {
          reactFlowRef.current = instance;
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => {
          setSelectedNode(node);
          setSelectedEdge(null);
        }}
        onEdgeClick={(_, edge) => {
          setSelectedEdge(edge);
          setSelectedNode(null);
        }}
        onPaneClick={clearSelection}
        fitView
        style={{ background: "linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)" }}
      >
        <Background color="#d7dee8" gap={20} size={1} />
        <Controls />
      </ReactFlow>
      <button
        type="button"
        onClick={clearCurrentCanvas}
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          zIndex: 20,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 92,
          height: 36,
          borderRadius: 10,
          border: "1px solid rgba(248, 113, 113, 0.25)",
          background: "rgba(255, 245, 245, 0.96)",
          backdropFilter: "blur(12px)",
          padding: "0 12px",
          color: "#dc2626",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
        }}
      >
        Clear Canvas
      </button>
    </div>
  );
}
