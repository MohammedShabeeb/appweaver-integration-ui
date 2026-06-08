"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type BpmnModeler from "bpmn-js/lib/Modeler";

type SavedBpmnWorkflow = {
  id: string;
  name: string;
  xml: string;
  updatedAt: string;
};

type BpmnWorkflowEditorProps = {
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
};

const DEFAULT_WORKFLOW_NAME = "BPMN Workflow";

function createWorkflowId() {
  return `bpmn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createDefaultBpmnXml(workflowId: string, workflowName: string) {
  const processId = workflowId.replace(/[^A-Za-z0-9_]/g, "_") || "bpmn_workflow";
  const escapedName = workflowName
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_${processId}" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_${processId}" name="${escapedName}" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Task">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_${processId}">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="160" y="120" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="166" y="163" width="25" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="250" y="98" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="410" y="120" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="419" y="163" width="19" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="196" y="138" />
        <di:waypoint x="250" y="138" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="350" y="138" />
        <di:waypoint x="410" y="138" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

function getSavedWorkflows(value: unknown): SavedBpmnWorkflow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is SavedBpmnWorkflow => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return false;
    }

    const workflow = item as Partial<SavedBpmnWorkflow>;
    return (
      typeof workflow.id === "string" &&
      typeof workflow.name === "string" &&
      typeof workflow.xml === "string" &&
      typeof workflow.updatedAt === "string"
    );
  });
}

export default function BpmnWorkflowEditor({ config, onConfigChange }: BpmnWorkflowEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);
  const isImportingRef = useRef(false);
  const currentXmlRef = useRef("");
  const workflowIdRef = useRef("");
  const workflowNameRef = useRef("");
  const onConfigChangeRef = useRef(onConfigChange);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const savedWorkflows = useMemo(
    () => getSavedWorkflows(config.savedWorkflows),
    [config.savedWorkflows],
  );
  const workflowId =
    typeof config.workflowId === "string" && config.workflowId.trim()
      ? config.workflowId
      : savedWorkflows[0]?.id || createWorkflowId();
  const workflowName =
    typeof config.workflowName === "string" && config.workflowName.trim()
      ? config.workflowName
      : savedWorkflows[0]?.name || DEFAULT_WORKFLOW_NAME;
  const bpmnXml =
    (typeof config.bpmnXml === "string" && config.bpmnXml.trim() ? config.bpmnXml : "") ||
    savedWorkflows.find((workflow) => workflow.id === workflowId)?.xml ||
    createDefaultBpmnXml(workflowId, workflowName);

  useEffect(() => {
    currentXmlRef.current = bpmnXml;
    workflowIdRef.current = workflowId;
    workflowNameRef.current = workflowName;
  }, [bpmnXml, workflowId, workflowName]);

  useEffect(() => {
    onConfigChangeRef.current = onConfigChange;
  }, [onConfigChange]);

  const importXml = useCallback(async (xml: string) => {
    const modeler = modelerRef.current;

    if (!modeler) {
      return;
    }

    try {
      isImportingRef.current = true;
      await modeler.importXML(xml);
      const canvas = modeler.get<{ zoom: (mode: string) => void }>("canvas");
      canvas.zoom("fit-viewport");
      setError(null);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load BPMN XML.");
    } finally {
      isImportingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let modeler: BpmnModeler | null = null;

    const setupModeler = async () => {
      if (!containerRef.current) {
        return;
      }

      const { default: Modeler } = await import("bpmn-js/lib/Modeler");

      if (!isMounted || !containerRef.current) {
        return;
      }

      modeler = new Modeler({
        container: containerRef.current,
      });
      modelerRef.current = modeler;

      const eventBus = modeler.get<{ on: (event: string, callback: () => void) => void }>("eventBus");
      eventBus.on("commandStack.changed", async () => {
        if (isImportingRef.current || !modelerRef.current) {
          return;
        }

        const result = await modelerRef.current.saveXML({ format: true });
        const xml = result.xml ?? "";
        currentXmlRef.current = xml;
        onConfigChangeRef.current({
          workflowId: workflowIdRef.current,
          workflowName: workflowNameRef.current,
          bpmnXml: xml,
        });
        setStatus(null);
        setError(null);
      });

      await importXml(currentXmlRef.current);
    };

    void setupModeler();

    return () => {
      isMounted = false;
      modeler?.destroy();
      if (modelerRef.current === modeler) {
        modelerRef.current = null;
      }
    };
  }, [importXml]);

  useEffect(() => {
    if (bpmnXml && bpmnXml !== currentXmlRef.current) {
      currentXmlRef.current = bpmnXml;
      void importXml(bpmnXml);
    }
  }, [bpmnXml, importXml]);

  const handleWorkflowNameChange = (name: string) => {
    onConfigChange({
      workflowId,
      workflowName: name,
      bpmnXml: currentXmlRef.current || bpmnXml,
    });
    setStatus(null);
    setError(null);
  };

  const handleSelectWorkflow = (selectedWorkflowId: string) => {
    const selectedWorkflow = savedWorkflows.find((workflow) => workflow.id === selectedWorkflowId);

    if (!selectedWorkflow) {
      return;
    }

    onConfigChange({
      workflowId: selectedWorkflow.id,
      workflowName: selectedWorkflow.name,
      bpmnXml: selectedWorkflow.xml,
      savedWorkflows,
    });
    setStatus(`Selected ${selectedWorkflow.name}.`);
    setError(null);
    currentXmlRef.current = selectedWorkflow.xml;
    void importXml(selectedWorkflow.xml);
  };

  const handleNewWorkflow = () => {
    const nextWorkflowId = createWorkflowId();
    const nextWorkflowName = "New BPMN Workflow";
    const nextXml = createDefaultBpmnXml(nextWorkflowId, nextWorkflowName);

    onConfigChange({
      workflowId: nextWorkflowId,
      workflowName: nextWorkflowName,
      bpmnXml: nextXml,
      savedWorkflows,
    });
    setStatus(null);
    setError(null);
    currentXmlRef.current = nextXml;
    void importXml(nextXml);
  };

  const handleSaveWorkflow = async () => {
    const modeler = modelerRef.current;

    if (!modeler) {
      setError("BPMN modeler is still loading.");
      return;
    }

    try {
      const result = await modeler.saveXML({ format: true });
      const xml = result.xml ?? bpmnXml;
      const savedWorkflow: SavedBpmnWorkflow = {
        id: workflowId,
        name: workflowName.trim() || DEFAULT_WORKFLOW_NAME,
        xml,
        updatedAt: new Date().toISOString(),
      };
      const nextSavedWorkflows = [
        savedWorkflow,
        ...savedWorkflows.filter((workflow) => workflow.id !== savedWorkflow.id),
      ];

      onConfigChange({
        workflowId: savedWorkflow.id,
        workflowName: savedWorkflow.name,
        bpmnXml: xml,
        savedWorkflows: nextSavedWorkflows,
      });
      setStatus(`Saved ${savedWorkflow.name}.`);
      setError(null);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not save BPMN workflow.");
    }
  };

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto auto", gap: 8 }}>
        <select
          value={savedWorkflows.some((workflow) => workflow.id === workflowId) ? workflowId : ""}
          onChange={(event) => handleSelectWorkflow(event.target.value)}
          style={{
            minWidth: 0,
            borderRadius: 8,
            border: "1px solid rgba(203, 213, 225, 0.95)",
            background: "#ffffff",
            padding: "9px 10px",
            color: "#0f172a",
            fontSize: 13,
            fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
          }}
        >
          <option value="">Select BPMN workflow</option>
          {savedWorkflows.map((workflow) => (
            <option key={workflow.id} value={workflow.id}>
              {workflow.name}
            </option>
          ))}
        </select>
        <button type="button" className="app-modal-btn app-modal-btn-secondary" style={{ minWidth: 76, height: 40 }} onClick={handleNewWorkflow}>
          New
        </button>
        <button type="button" className="app-modal-btn app-modal-btn-danger" style={{ minWidth: 76, height: 40 }} onClick={() => void handleSaveWorkflow()}>
          Save
        </button>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Workflow name</span>
        <input
          value={workflowName}
          placeholder={DEFAULT_WORKFLOW_NAME}
          onChange={(event) => handleWorkflowNameChange(event.target.value)}
          style={{
            width: "100%",
            borderRadius: 8,
            border: "1px solid rgba(203, 213, 225, 0.95)",
            background: "#ffffff",
            padding: "9px 10px",
            color: "#0f172a",
            fontSize: 13,
            fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
          }}
        />
      </label>

      <div
        ref={containerRef}
        className="bpmn-workflow-modeler"
        style={{
          width: "100%",
          flex: 1,
          minHeight: 0,
          borderRadius: 8,
          border: "1px solid rgba(203, 213, 225, 0.95)",
          background: "#ffffff",
          overflow: "hidden",
        }}
      />

      {error ? (
        <p style={{ margin: 0, fontSize: 12, color: "#b91c1c" }}>{error}</p>
      ) : status ? (
        <p style={{ margin: 0, fontSize: 12, color: "#166534" }}>{status}</p>
      ) : null}
    </div>
  );
}
