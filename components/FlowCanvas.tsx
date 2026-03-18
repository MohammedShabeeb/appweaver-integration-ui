"use client";

import React, { useCallback, useEffect, useRef } from "react";
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
import HttpNode from "./nodes/HttpNode";
import DelayNode from "./nodes/DelayNode";
import ContainerNode from "./nodes/ContainerNode";
import InsertableEdge from "./edges/InsertableEdge";
import { nodeTypeMeta } from "./node-icons";

const nodeTypes = {
  start: FromNode,
  http: HttpNode,
  delay: DelayNode,
  container: ContainerNode,
};

const edgeTypes = {
  insertable: InsertableEdge,
};

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
    openContainer,
    goBackCanvas,
    openCanvasFromBreadcrumb,
  } = useFlowStore();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const currentCanvas = canvases[currentCanvasId];
  const nodes = currentCanvas?.nodes ?? [];
  const edges = currentCanvas?.edges ?? [];

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges(
        addEdge(
          {
            ...params,
            type: "insertable",
          },
          edges
        )
      ),
    [edges, setEdges]
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

      const type = event.dataTransfer.getData("application/reactflow");

      if (!type) {
        return;
      }

      const position = reactFlowRef.current?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (!position) {
        return;
      }

      addNode(type as "start" | "http" | "delay" | "container", position);
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
          border: "1px solid rgba(71, 85, 105, 0.5)",
          background: "rgba(15, 23, 42, 0.92)",
          backdropFilter: "blur(16px)",
          padding: "6px 12px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
        }}
      >
        <button
          type="button"
          style={{
            borderRadius: 8,
            border: "1px solid rgba(71, 85, 105, 0.5)",
            background: "transparent",
            padding: "4px 10px",
            fontSize: 13,
            color: "#cbd5e1",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
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
              {index > 0 ? <span style={{ color: "#475569", fontSize: 13 }}>/</span> : null}
              <button
                type="button"
                style={{
                  borderRadius: 8,
                  border: "none",
                  background: canvasId === currentCanvasId
                    ? "rgba(99, 102, 241, 0.15)"
                    : "transparent",
                  padding: "4px 10px",
                  fontSize: 13,
                  color: canvasId === currentCanvasId ? "#a5b4fc" : "#94a3b8",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
                onClick={() => openCanvasFromBreadcrumb(canvasId)}
              >
                {canvases[canvasId]?.name || "Canvas"}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
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
        onNodeDoubleClick={(_, node) => {
          if (node.type === "container") {
            openContainer(node.id);
          }
        }}
        onEdgeClick={(_, edge) => {
          setSelectedEdge(edge);
          setSelectedNode(null);
        }}
        onPaneClick={clearSelection}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
