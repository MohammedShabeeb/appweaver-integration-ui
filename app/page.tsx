"use client";

import { useFlowStore } from "@/store/useFlowStore";
import FlowCanvas from "@/components/FlowCanvas";
import TopNav from "@/components/TopNav";
import ComponentsSidebar from "@/components/ComponentsSidebar";
import ConfigPanel from "@/components/ConfigPanel";
import ConfigurationWorkspace from "@/components/ConfigurationWorkspace";
import DirectRouteEditorOverlay from "@/components/DirectRouteEditorOverlay";

export default function Home(){
  const { isSidebarOpen, sidebarView } = useFlowStore();
  const isConfigWorkspaceOpen = isSidebarOpen && sidebarView === "configs";

  return(
    <div className="app-layout">
      <TopNav />
      {isConfigWorkspaceOpen ? (
        <ConfigurationWorkspace />
      ) : (
        <div className="app-body">
          <ComponentsSidebar />
          <FlowCanvas />
          <ConfigPanel />
        </div>
      )}
      <DirectRouteEditorOverlay />
    </div>
  );
}
