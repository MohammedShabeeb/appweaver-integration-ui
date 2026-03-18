"use client";

import { useFlowStore } from "@/store/useFlowStore";
import { nodeTypeMeta } from "./node-icons";

const draggableItems: {
  type: string;
  label: string;
  color: string;
  bgClass: string;
}[] = [
  { type: "start", label: nodeTypeMeta.start.label, color: "#34d399", bgClass: "sidebar-item-from" },
  { type: "http", label: nodeTypeMeta.http.label, color: "#60a5fa", bgClass: "sidebar-item-http" },
  { type: "delay", label: nodeTypeMeta.delay.label, color: "#fbbf24", bgClass: "sidebar-item-delay" },
  { type: "container", label: nodeTypeMeta.container.label, color: "#c084fc", bgClass: "sidebar-item-container" },
];

export default function ComponentsSidebar() {
  const { isSidebarOpen, toggleSidebar } = useFlowStore();

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <aside className="components-sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Components</h2>
        <button type="button" className="sidebar-close" onClick={toggleSidebar}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sidebar-close-icon"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="sidebar-hint">Drag a component onto the canvas</p>

      <div className="sidebar-items">
        {draggableItems.map((item) => {
          const meta = nodeTypeMeta[item.type as keyof typeof nodeTypeMeta];
          const Icon = meta?.Icon;

          return (
            <div
              key={item.type}
              className={`sidebar-item ${item.bgClass}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("application/reactflow", item.type);
                event.dataTransfer.effectAllowed = "move";
              }}
            >
              <div className="sidebar-item-icon" style={{ color: item.color }}>
                {Icon ? <Icon className="h-5 w-5" /> : null}
              </div>
              <div className="sidebar-item-info">
                <span className="sidebar-item-label">{item.label}</span>
                <span className="sidebar-item-type">{item.type}</span>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="sidebar-item-grip"
              >
                <circle cx="9" cy="6" r="1" fill="currentColor" />
                <circle cx="15" cy="6" r="1" fill="currentColor" />
                <circle cx="9" cy="12" r="1" fill="currentColor" />
                <circle cx="15" cy="12" r="1" fill="currentColor" />
                <circle cx="9" cy="18" r="1" fill="currentColor" />
                <circle cx="15" cy="18" r="1" fill="currentColor" />
              </svg>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
