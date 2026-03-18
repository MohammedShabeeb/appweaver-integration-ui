"use client";

import FlowCanvas from "@/components/FlowCanvas";
import TopNav from "@/components/TopNav";
import ComponentsSidebar from "@/components/ComponentsSidebar";
import ConfigPanel from "@/components/ConfigPanel";

export default function Home(){
  return(
    <div className="app-layout">
      <TopNav />
      <div className="app-body">
        <ComponentsSidebar />
        <FlowCanvas />
        <ConfigPanel />
      </div>
    </div>
  );
}
