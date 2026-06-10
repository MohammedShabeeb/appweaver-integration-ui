"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
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
import { visibleComponentDefinitions } from "@/config/componentCatalog";
import { nodeTypeMeta } from "./node-icons";

const nodeTypes = {
  start: FromNode,
  marshal: StepNode,
  unmarshal: StepNode,
  setBody: StepNode,
  setHeader: StepNode,
  setProperty: StepNode,
  setContext: StepNode,
  globalOption: StepNode,
  convertBodyTo: StepNode,
  transform: StepNode,
  filter: StepNode,
  choice: StepNode,
  routeContainer: StepNode,
  split: StepNode,
  dynamicroute: StepNode,
  validate: StepNode,
  process: StepNode,
  bean: StepNode,
  to: StepNode,
  toD: StepNode,
  upload: StepNode,
  download: StepNode,
  enrich: StepNode,
  dbCrud: StepNode,
  smartRouter: StepNode,
  agent: StepNode,
  workflow: StepNode,
  aggregation: StepNode,
  delay: StepNode,
  log: StepNode,
  customStep: StepNode,
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
    setNodes,
    setEdges,
    addNode,
    setSelectedNode,
    setSelectedEdge,
    clearSelection,
    arrangeCurrentRoute,
    clearCurrentCanvas,
    goBackCanvas,
    openCanvasFromBreadcrumb,
    openSidebar,
    customComponents,
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

    const getMatchScore = (label: string, type: string, description = "") => {
      const normalizedLabel = label.toLowerCase();
      const normalizedType = type.toLowerCase();
      const normalizedDescription = description.toLowerCase();

      if (normalizedLabel.startsWith(query)) {
        return 0;
      }

      if (normalizedType.startsWith(query)) {
        return 1;
      }

      if (query.length < 2) {
        return null;
      }

      if (normalizedLabel.includes(query)) {
        return 2;
      }

      if (normalizedType.includes(query)) {
        return 3;
      }

      if (normalizedDescription.includes(query)) {
        return 4;
      }

      return null;
    };

    const builtInResults = visibleComponentDefinitions
      .filter((component) => component.type !== "start")
      .map((component) => {
        const title = nodeTypeMeta[component.type].label;
        const score = getMatchScore(title, component.type);

        if (score === null) {
          return null;
        }

        return {
          id: `component-${component.type}`,
          kind: "Component" as const,
          title,
          subtitle: component.type,
          score,
          target: {
            kind: "component" as const,
            groupId: component.defaultGroup,
            componentKey: component.type,
          },
        };
      })
      .filter((result): result is NonNullable<typeof result> => result !== null);

    const customResults = customComponents
      .map((component) => {
        const score = getMatchScore(component.label, component.type, component.description);

        if (score === null) {
          return null;
        }

        return {
          id: `component-${component.type}`,
          kind: "Component" as const,
          title: component.label,
          subtitle: component.type,
          score,
          target: {
            kind: "component" as const,
            groupId: "processing",
            componentKey: component.type,
          },
        };
      })
      .filter((result): result is NonNullable<typeof result> => result !== null);

    return [...builtInResults, ...customResults]
      .sort((a, b) => a.score - b.score || a.title.localeCompare(b.title))
      .slice(0, 8);
  }, [customComponents, searchValue]);
  const [activeSearchResultIndex, setActiveSearchResultIndex] = useState(0);
  const activeSearchResult = searchResults[activeSearchResultIndex] ?? searchResults[0] ?? null;

  const commitSearchResult = useCallback(
    (result: NonNullable<typeof activeSearchResult>) => {
      openSidebar("components");
      setSearchValue(result.title);
      window.dispatchEvent(
        new CustomEvent("focus-sidebar-search-target", {
          detail: result.target,
        }),
      );
    },
    [openSidebar],
  );

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
            onChange={(event) => {
              setSearchValue(event.target.value);
              setActiveSearchResultIndex(0);
            }}
            onKeyDown={(event) => {
              if (!searchResults.length) {
                return;
              }

              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveSearchResultIndex((current) => (current + 1) % searchResults.length);
                return;
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveSearchResultIndex(
                  (current) => (current - 1 + searchResults.length) % searchResults.length,
                );
                return;
              }

              if (event.key === "Enter" || event.key === "Tab") {
                event.preventDefault();
                if (event.key === "Tab") {
                  setSearchValue(activeSearchResult.title);
                  setActiveSearchResultIndex(0);
                  return;
                }

                commitSearchResult(activeSearchResult);
              }
            }}
            placeholder="Search components or categories"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="component-search-results"
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
            id="component-search-results"
            role="listbox"
            style={{
              marginTop: 10,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              borderRadius: 12,
              border: "1px solid rgba(203, 213, 225, 0.9)",
              background: "rgba(255, 255, 255, 0.99)",
              backdropFilter: "blur(16px)",
              padding: 6,
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.14)",
              overflow: "hidden",
            }}
          >
            {searchResults.map((result, index) => (
              <button
                key={result.id}
                type="button"
                role="option"
                aria-selected={index === activeSearchResultIndex}
                onMouseEnter={() => setActiveSearchResultIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  commitSearchResult(result);
                }}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: 10,
                  border: "none",
                  borderRadius: 8,
                  background: index === activeSearchResultIndex ? "rgba(45, 183, 128, 0.10)" : "transparent",
                  padding: "10px",
                  color: "#0f172a",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: index === activeSearchResultIndex ? "#ffffff" : "rgba(241, 245, 249, 0.95)",
                    color: "var(--workflow-accent)",
                    fontSize: 12,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {result.title.slice(0, 1).toUpperCase()}
                </span>
                <span style={{ display: "grid", gap: 2, minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, lineHeight: "18px" }}>{result.title}</span>
                  <span style={{ fontSize: 11, color: "#64748b", lineHeight: "16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {result.kind} / {result.subtitle}
                  </span>
                </span>
                <span
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(203, 213, 225, 0.9)",
                    background: "#ffffff",
                    padding: "2px 7px",
                    color: "#64748b",
                    fontSize: 10,
                    fontWeight: 700,
                    lineHeight: "14px",
                    flexShrink: 0,
                  }}
                >
                  Enter
                </span>
              </button>
            ))}
            <div
              style={{
                borderTop: "1px solid rgba(226, 232, 240, 0.95)",
                margin: "2px 4px 0",
                padding: "7px 6px 3px",
                color: "#94a3b8",
                fontSize: 10,
                lineHeight: "14px",
                fontWeight: 700,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              Enter opens selected / Tab autofills
            </div>
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
        fitViewOptions={{ padding: 0.35, maxZoom: 0.85 }}
        minZoom={0.35}
        maxZoom={1.4}
        style={{ background: "linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)" }}
      >
        <Background color="#d7dee8" gap={20} size={1} />
        <Controls />
      </ReactFlow>
      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          zIndex: 20,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          borderRadius: 12,
          border: "1px solid rgba(226, 232, 240, 0.95)",
          background: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(14px)",
          padding: 6,
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
        }}
      >
        <button
          type="button"
          onClick={() => {
            arrangeCurrentRoute();
            window.setTimeout(() => {
              reactFlowRef.current?.fitView({ padding: 0.35, maxZoom: 0.95, duration: 260 });
            }, 0);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 108,
            height: 34,
            borderRadius: 8,
            border: "1px solid rgba(45, 183, 128, 0.34)",
            background: "rgba(240, 253, 244, 0.98)",
            padding: "0 12px",
            color: "var(--workflow-accent)",
            fontSize: 12,
            fontWeight: 800,
            fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
            cursor: "pointer",
          }}
        >
          Arrange Route
        </button>
        <button
          type="button"
          onClick={clearCurrentCanvas}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 96,
            height: 34,
            borderRadius: 8,
            border: "1px solid rgba(248, 113, 113, 0.30)",
            background: "rgba(255, 245, 245, 0.98)",
            padding: "0 12px",
            color: "#dc2626",
            fontSize: 12,
            fontWeight: 800,
            fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
            cursor: "pointer",
          }}
        >
          Clear Canvas
        </button>
      </div>
    </div>
  );
}
