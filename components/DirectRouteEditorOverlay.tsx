"use client";

import { useEffect, useRef, useState } from "react";
import { Route, Save, X } from "lucide-react";
import ComponentsSidebar from "@/components/ComponentsSidebar";
import ConfigPanel from "@/components/ConfigPanel";
import FlowCanvas from "@/components/FlowCanvas";
import { appWeaverApiClient, type AppWeaverDirectRouteConfig } from "@/lib/appweaverApiClient";
import { useFlowStore } from "@/store/useFlowStore";

type DirectRouteSavedEvent = CustomEvent<AppWeaverDirectRouteConfig>;
type DirectRouteEditorSession = NonNullable<
  ReturnType<typeof useFlowStore.getState>["directRouteEditorSession"]
>;

export const DIRECT_ROUTE_EDITOR_SAVED_EVENT = "direct-route-editor:saved";

export default function DirectRouteEditorOverlay() {
  const session = useFlowStore((state) => state.directRouteEditorSession);

  if (!session) {
    return null;
  }

  return <DirectRouteEditorSessionOverlay key={`${session.route.name}-${session.sourceWorkflowId}`} session={session} />;
}

function DirectRouteEditorSessionOverlay({ session }: { session: DirectRouteEditorSession }) {
  const closeDirectRouteEditor = useFlowStore((state) => state.closeDirectRouteEditor);
  const importWorkflow = useFlowStore((state) => state.importWorkflow);
  const deleteWorkflow = useFlowStore((state) => state.deleteWorkflow);
  const selectWorkflow = useFlowStore((state) => state.selectWorkflow);
  const exportBackendRouteJson = useFlowStore((state) => state.exportBackendRouteJson);
  const openSidebar = useFlowStore((state) => state.openSidebar);
  const [editorWorkflowId, setEditorWorkflowId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const importedRouteNameRef = useRef<string | null>(null);

  useEffect(() => {
    document.body.classList.add("direct-route-preview-open");
    openSidebar("components");

    const routeName = session.route.name || session.route.config?.routeId || "Direct route";
    const imported = importWorkflow(session.route, routeName);
    let isActive = true;

    if (!imported) {
      window.setTimeout(() => {
        if (isActive) {
          setError("Could not render this direct route as an editable canvas.");
        }
      }, 0);
      return () => {
        isActive = false;
        document.body.classList.remove("direct-route-preview-open");
      };
    }

    const workflowId = useFlowStore.getState().activeWorkflowId;

    importedRouteNameRef.current = routeName;
    window.setTimeout(() => {
      if (isActive) {
        setEditorWorkflowId(workflowId);
      }
    }, 0);

    return () => {
      isActive = false;
      document.body.classList.remove("direct-route-preview-open");
    };
  }, [importWorkflow, openSidebar, session]);

  const restoreSourceWorkflow = () => {
    const workflowIdToDelete = editorWorkflowId;
    const sourceWorkflowId = session.sourceWorkflowId;

    closeDirectRouteEditor();

    if (workflowIdToDelete) {
      deleteWorkflow(workflowIdToDelete);
    }

    selectWorkflow(sourceWorkflowId);
    setEditorWorkflowId(null);
    importedRouteNameRef.current = null;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    setError(null);

    try {
      const exportedRoute = exportBackendRouteJson();
      const routeToSave: AppWeaverDirectRouteConfig = {
        ...session.route,
        ...exportedRoute,
        name: session.route.name || exportedRoute.name,
        path: exportedRoute.path ?? session.route.path ?? "",
        index: exportedRoute.index ?? session.route.index,
        description: exportedRoute.description ?? session.route.description,
      };
      const savedRoute = await appWeaverApiClient.system.directRoutes.update(
        session.route.name,
        routeToSave,
      );

      window.dispatchEvent(
        new CustomEvent(DIRECT_ROUTE_EDITOR_SAVED_EVENT, {
          detail: savedRoute,
        }) as DirectRouteSavedEvent,
      );
      setStatus(`Saved ${savedRoute.name}.`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not save the direct route.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="direct-route-editor-overlay" role="dialog" aria-modal="true">
      <header className="direct-route-editor-header">
        <div className="direct-route-editor-title">
          <span className="direct-route-editor-icon" aria-hidden="true">
            <Route size={20} strokeWidth={2.1} />
          </span>
          <div>
            <h2>{session.route.name}</h2>
            <p>{session.route.config?.steps.length ?? 0} components from backend route JSON</p>
          </div>
        </div>
        <div className="direct-route-editor-status" role="status">
          {error ? <span className="direct-route-editor-error">{error}</span> : status}
        </div>
        <div className="direct-route-editor-actions">
          <button
            type="button"
            className="direct-route-editor-btn direct-route-editor-btn-secondary"
            onClick={restoreSourceWorkflow}
          >
            <X aria-hidden="true" size={17} strokeWidth={2.2} />
            Close
          </button>
          <button
            type="button"
            className="direct-route-editor-btn direct-route-editor-btn-primary"
            onClick={() => void handleSave()}
            disabled={isSaving || !editorWorkflowId}
          >
            <Save aria-hidden="true" size={17} strokeWidth={2.2} />
            {isSaving ? "Saving" : "Save Route"}
          </button>
        </div>
      </header>
      <div className="direct-route-editor-body">
        <ComponentsSidebar />
        <FlowCanvas />
        <ConfigPanel />
      </div>
    </div>
  );
}
