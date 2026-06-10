"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  appWeaverApiClient,
  type AppWeaverWorkflowConfig,
  type WorkflowActionDefinition,
} from "@/lib/appweaverApiClient";
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

type WorkflowCreationType = "service" | "user";

type BpmnElement = {
  id: string;
  type: string;
  businessObject?: BpmnBusinessObject;
};

type BpmnBusinessObject = {
  id?: string;
  name?: string;
  $type?: string;
  extensionElements?: {
    values?: unknown[];
  };
};

type BpmnElementRegistry = {
  getAll: () => BpmnElement[];
};

type BpmnSelection = {
  get: () => BpmnElement[];
};

type BpmnEventBus = {
  on: (event: string, callback: (event?: { newSelection?: BpmnElement[] }) => void) => void;
};

type BpmnModeling = {
  updateProperties: (element: BpmnElement, properties: Record<string, unknown>) => void;
};

type BpmnModdle = {
  create: (type: string, properties?: Record<string, unknown>) => unknown;
  createAny: (name: string, nsUri: string, properties?: Record<string, unknown>) => unknown;
};

const DEFAULT_WORKFLOW_NAME = "BPMN Workflow";
const APPWEAVER_ACTION_NS = "https://appweaver.dev/schema/bpmn";
const APPWEAVER_ACTION_TYPE = "appweaver:action";
const SERVICE_TASK_TYPE = "bpmn:ServiceTask";
const FLOWABLE_NS = "http://flowable.org/bpmn";
const FLOWABLE_PREFIX = "flowable";
const XMLNS_NS = "http://www.w3.org/2000/xmlns/";
const FLOWABLE_FALLBACK_EXPRESSION = "${true}";
const FLOWABLE_SERVICE_TASK_IMPLEMENTATION_ATTRIBUTES = [
  "class",
  "delegateExpression",
  "type",
  "operation",
  "expression",
];

const workflowCreationOptions: Array<{
  type: WorkflowCreationType;
  label: string;
  helper: string;
}> = [
  {
    type: "service",
    label: "Service workflow",
    helper: "Creates a service task for backend workflow actions.",
  },
  {
    type: "user",
    label: "User workflow",
    helper: "Creates a user task for human-assigned work.",
  },
];

function createWorkflowId() {
  return `bpmn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createDefaultBpmnXml(
  workflowId: string,
  workflowName: string,
  workflowType: WorkflowCreationType = "service",
) {
  const processId = workflowId.replace(/[^A-Za-z0-9_]/g, "_") || "bpmn_workflow";
  const escapedName = workflowName
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const taskElement = workflowType === "service" ? "serviceTask" : "userTask";
  const taskName = workflowType === "service" ? "Service task" : "User task";

  const taskImplementation =
    workflowType === "service" ? ` flowable:expression="${FLOWABLE_FALLBACK_EXPRESSION}"` : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:flowable="${FLOWABLE_NS}" id="Definitions_${processId}" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_${processId}" name="${escapedName}" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:${taskElement} id="Task_1" name="${taskName}"${taskImplementation}>
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:${taskElement}>
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

function hasFlowableServiceTaskImplementation(task: Element) {
  return FLOWABLE_SERVICE_TASK_IMPLEMENTATION_ATTRIBUTES.some((attributeName) =>
    Array.from(task.attributes).some((attribute) => attribute.localName === attributeName),
  );
}

function ensureFlowableServiceTaskImplementations(xml: string) {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return xml;
  }

  const document = new DOMParser().parseFromString(xml, "application/xml");
  const parseError = document.querySelector("parsererror");

  if (parseError) {
    return xml;
  }

  const definitions = document.documentElement;
  const serviceTasks = Array.from(document.getElementsByTagNameNS("*", "serviceTask"));
  const serviceTasksMissingImplementation = serviceTasks.filter(
    (task) => !hasFlowableServiceTaskImplementation(task),
  );
  let didUpdate = false;

  if (serviceTasksMissingImplementation.length === 0) {
    return xml;
  }

  if (!definitions.getAttribute(`xmlns:${FLOWABLE_PREFIX}`)) {
    definitions.setAttributeNS(XMLNS_NS, `xmlns:${FLOWABLE_PREFIX}`, FLOWABLE_NS);
    didUpdate = true;
  }

  for (const task of serviceTasksMissingImplementation) {
    task.setAttributeNS(
      FLOWABLE_NS,
      `${FLOWABLE_PREFIX}:expression`,
      FLOWABLE_FALLBACK_EXPRESSION,
    );
    didUpdate = true;
  }

  return didUpdate ? new XMLSerializer().serializeToString(document) : xml;
}

function getSavedWorkflows(value: unknown): SavedBpmnWorkflow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): SavedBpmnWorkflow[] => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }

    const workflow = item as Partial<SavedBpmnWorkflow> & Partial<AppWeaverWorkflowConfig>;
    const id = workflow.id ?? workflow.workflowId;
    const name = workflow.name ?? workflow.workflowName ?? id;
    const xml = workflow.xml ?? workflow.bpmnXml;

    if (typeof id !== "string" || typeof name !== "string" || typeof xml !== "string") {
      return [];
    }

    return [
      {
        id,
        name,
        xml,
        updatedAt:
          typeof workflow.updatedAt === "string" ? workflow.updatedAt : new Date().toISOString(),
      },
    ];
  });
}

function fromBackendWorkflow(workflow: AppWeaverWorkflowConfig): SavedBpmnWorkflow {
  return {
    id: workflow.workflowId,
    name: workflow.workflowName || workflow.workflowId,
    xml: workflow.bpmnXml,
    updatedAt: new Date().toISOString(),
  };
}

function mergeSavedWorkflows(
  first: SavedBpmnWorkflow[],
  second: SavedBpmnWorkflow[],
): SavedBpmnWorkflow[] {
  const workflowsById = new Map<string, SavedBpmnWorkflow>();

  for (const workflow of [...first, ...second]) {
    workflowsById.set(workflow.id, workflow);
  }

  return Array.from(workflowsById.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function isGeneratedWorkflowId(value: string) {
  return value.startsWith("bpmn-");
}

function hasOnlyGeneratedWorkflowDefaults(workflows: SavedBpmnWorkflow[]) {
  return workflows.every((workflow) => isGeneratedWorkflowId(workflow.id));
}

function isServiceTask(element: BpmnElement | null) {
  return element?.type === SERVICE_TASK_TYPE || element?.businessObject?.$type === SERVICE_TASK_TYPE;
}

function getElementLabel(element: BpmnElement) {
  return element.businessObject?.name?.trim() || element.businessObject?.id || element.id;
}

function isAppWeaverAction(value: unknown): value is { id?: string; $type?: string } {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as { $type?: unknown }).$type === APPWEAVER_ACTION_TYPE
  );
}

function getAppWeaverActionId(element: BpmnElement | null) {
  const values = element?.businessObject?.extensionElements?.values;
  const action = values?.find((value) => isAppWeaverAction(value));

  return isAppWeaverAction(action) && typeof action.id === "string" ? action.id : "";
}

function getCompatibleWorkflowActions(
  actions: WorkflowActionDefinition[],
  element: BpmnElement | null,
) {
  if (!element) {
    return [];
  }

  return actions.filter(
    (action) =>
      action.bpmnElementTypes.length === 0 ||
      action.bpmnElementTypes.includes(element.type) ||
      (element.businessObject?.$type ? action.bpmnElementTypes.includes(element.businessObject.$type) : false),
  );
}

export default function BpmnWorkflowEditor({ config, onConfigChange }: BpmnWorkflowEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);
  const isImportingRef = useRef(false);
  const currentXmlRef = useRef("");
  const workflowIdRef = useRef("");
  const workflowNameRef = useRef("");
  const savedWorkflowsRef = useRef<SavedBpmnWorkflow[]>([]);
  const workflowActionsRef = useRef<WorkflowActionDefinition[]>([]);
  const selectedElementRef = useRef<BpmnElement | null>(null);
  const refreshWorkflowActionWarningsRef = useRef<() => void>(() => undefined);
  const syncSelectedElementRef = useRef<(nextSelection?: BpmnElement[]) => void>(() => undefined);
  const onConfigChangeRef = useRef(onConfigChange);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
  const [isDeletingWorkflow, setIsDeletingWorkflow] = useState(false);
  const [workflowActions, setWorkflowActions] = useState<WorkflowActionDefinition[]>([]);
  const [isLoadingWorkflowActions, setIsLoadingWorkflowActions] = useState(false);
  const [selectedElement, setSelectedElement] = useState<BpmnElement | null>(null);
  const [selectedActionId, setSelectedActionId] = useState("");
  const [workflowActionWarnings, setWorkflowActionWarnings] = useState<string[]>([]);
  const [workflowCreationType, setWorkflowCreationType] = useState<WorkflowCreationType>("service");

  const configSavedWorkflows = useMemo(
    () => getSavedWorkflows(config.savedWorkflows),
    [config.savedWorkflows],
  );
  const [loadedWorkflows, setLoadedWorkflows] = useState<SavedBpmnWorkflow[]>([]);
  const savedWorkflows = useMemo(
    () => mergeSavedWorkflows(configSavedWorkflows, loadedWorkflows),
    [configSavedWorkflows, loadedWorkflows],
  );
  const compatibleWorkflowActions = useMemo(
    () => getCompatibleWorkflowActions(workflowActions, selectedElement),
    [selectedElement, workflowActions],
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
    createDefaultBpmnXml(workflowId, workflowName, workflowCreationType);

  useEffect(() => {
    currentXmlRef.current = bpmnXml;
    workflowIdRef.current = workflowId;
    workflowNameRef.current = workflowName;
    savedWorkflowsRef.current = savedWorkflows;
  }, [bpmnXml, savedWorkflows, workflowId, workflowName]);

  useEffect(() => {
    if (typeof config.bpmnXml === "string" && config.bpmnXml.trim()) {
      return;
    }

    onConfigChange({
      workflowId,
      workflowName,
      bpmnXml,
      savedWorkflows,
    });
  }, [bpmnXml, config.bpmnXml, onConfigChange, savedWorkflows, workflowId, workflowName]);

  useEffect(() => {
    onConfigChangeRef.current = onConfigChange;
  }, [onConfigChange]);

  const syncSavedWorkflows = useCallback((nextSavedWorkflows: SavedBpmnWorkflow[]) => {
    onConfigChangeRef.current({
      savedWorkflows: nextSavedWorkflows,
    });
  }, []);

  const refreshWorkflowActionWarnings = useCallback(
    (actions = workflowActionsRef.current) => {
      const modeler = modelerRef.current;

      if (actions.length === 0 || !modeler) {
        setWorkflowActionWarnings([]);
        return;
      }

      const knownActionIds = new Set(actions.map((action) => action.id));
      const elementRegistry = modeler.get<BpmnElementRegistry>("elementRegistry");
      const warnings = elementRegistry
        .getAll()
        .filter(isServiceTask)
        .flatMap((element) => {
          const actionId = getAppWeaverActionId(element);
          const label = getElementLabel(element);

          if (!actionId) {
            return [`${label} has no workflow action.`];
          }

          if (!knownActionIds.has(actionId)) {
            return [`${label} uses unknown workflow action "${actionId}".`];
          }

          return [];
        });

      setWorkflowActionWarnings(warnings);
    },
    [setWorkflowActionWarnings],
  );

  const syncSelectedElement = useCallback((nextSelection?: BpmnElement[]) => {
    const selection =
      nextSelection ??
      modelerRef.current?.get<BpmnSelection>("selection").get() ??
      [];
    const element = selection.length === 1 ? selection[0] : null;

    selectedElementRef.current = element;
    setSelectedElement(element);
    setSelectedActionId(getAppWeaverActionId(element));
  }, [setSelectedActionId, setSelectedElement]);

  useEffect(() => {
    refreshWorkflowActionWarningsRef.current = refreshWorkflowActionWarnings;
    syncSelectedElementRef.current = syncSelectedElement;
  }, [refreshWorkflowActionWarnings, syncSelectedElement]);

  const loadWorkflowActions = useCallback(async () => {
    setIsLoadingWorkflowActions(true);

    try {
      const registry = await appWeaverApiClient.system.workflowActions.list();
      workflowActionsRef.current = registry.actions;
      setWorkflowActions(registry.actions);
      refreshWorkflowActionWarnings(registry.actions);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load workflow actions.");
    } finally {
      setIsLoadingWorkflowActions(false);
    }
  }, [
    refreshWorkflowActionWarnings,
    setError,
    setIsLoadingWorkflowActions,
    setWorkflowActions,
  ]);

  const updateSelectedElementAction = useCallback(
    (actionId: string) => {
      const modeler = modelerRef.current;

      const element = selectedElementRef.current;

      if (!modeler || !element || !isServiceTask(element)) {
        return;
      }

      const moddle = modeler.get<BpmnModdle>("moddle");
      const modeling = modeler.get<BpmnModeling>("modeling");
      const businessObject = element.businessObject;

      if (!businessObject) {
        return;
      }

      const existingValues = businessObject.extensionElements?.values ?? [];
      const nextValues = existingValues.filter((value) => !isAppWeaverAction(value));

      if (actionId) {
        nextValues.push(moddle.createAny(APPWEAVER_ACTION_TYPE, APPWEAVER_ACTION_NS, { id: actionId }));
      }

      const extensionElements = moddle.create("bpmn:ExtensionElements", {
        values: nextValues,
      });

      modeling.updateProperties(element, {
        extensionElements: nextValues.length > 0 ? extensionElements : undefined,
      });
      setSelectedActionId(actionId);
      refreshWorkflowActionWarnings();
      setStatus(null);
      setError(null);
    },
    [refreshWorkflowActionWarnings, setError, setSelectedActionId, setStatus],
  );

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
      syncSelectedElementRef.current();
      refreshWorkflowActionWarningsRef.current();
      setError(null);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load BPMN XML.");
    } finally {
      isImportingRef.current = false;
    }
  }, [refreshWorkflowActionWarningsRef, setError, syncSelectedElementRef]);

  const loadBackendWorkflows = useCallback(async () => {
    setIsLoadingWorkflows(true);
    setError(null);

    try {
      const backendWorkflows = await appWeaverApiClient.system.workflows.list();
      const backendSavedWorkflows = backendWorkflows.map(fromBackendWorkflow);
      const nextSavedWorkflows = mergeSavedWorkflows(savedWorkflowsRef.current, backendSavedWorkflows);

      setLoadedWorkflows(nextSavedWorkflows);
      syncSavedWorkflows(nextSavedWorkflows);

      const shouldSelectBackendWorkflow =
        backendSavedWorkflows.length > 0 &&
        hasOnlyGeneratedWorkflowDefaults(savedWorkflowsRef.current) &&
        isGeneratedWorkflowId(workflowIdRef.current);

      if (shouldSelectBackendWorkflow) {
        const firstWorkflow = backendSavedWorkflows[0];
        onConfigChangeRef.current({
          workflowId: firstWorkflow.id,
          workflowName: firstWorkflow.name,
          bpmnXml: firstWorkflow.xml,
          savedWorkflows: nextSavedWorkflows,
        });
        currentXmlRef.current = firstWorkflow.xml;
        workflowIdRef.current = firstWorkflow.id;
        workflowNameRef.current = firstWorkflow.name;
        void importXml(firstWorkflow.xml);
      }
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load BPMN workflows.");
    } finally {
      setIsLoadingWorkflows(false);
    }
  }, [
    importXml,
    setError,
    setIsLoadingWorkflows,
    setLoadedWorkflows,
    syncSavedWorkflows,
  ]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadBackendWorkflows();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadBackendWorkflows]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadWorkflowActions();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadWorkflowActions]);

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
        const xml = ensureFlowableServiceTaskImplementations(result.xml ?? "");
        currentXmlRef.current = xml;
        onConfigChangeRef.current({
          workflowId: workflowIdRef.current,
          workflowName: workflowNameRef.current,
          bpmnXml: xml,
        });
        syncSelectedElementRef.current();
        refreshWorkflowActionWarningsRef.current();
        setStatus(null);
        setError(null);
      });
      modeler.get<BpmnEventBus>("eventBus").on("selection.changed", (event) => {
        syncSelectedElementRef.current(event?.newSelection);
      });

      await importXml(currentXmlRef.current);
      syncSelectedElementRef.current();
      refreshWorkflowActionWarningsRef.current();
    };

    void setupModeler();

    return () => {
      isMounted = false;
      modeler?.destroy();
      if (modelerRef.current === modeler) {
        modelerRef.current = null;
      }
    };
  }, [importXml, refreshWorkflowActionWarningsRef, syncSelectedElementRef]);

  useEffect(() => {
    if (bpmnXml && bpmnXml !== currentXmlRef.current) {
      currentXmlRef.current = bpmnXml;
      void importXml(bpmnXml);
    }
  }, [bpmnXml, importXml]);

  const handleWorkflowNameChange = (name: string) => {
    workflowNameRef.current = name;
    onConfigChange({
      workflowId,
      workflowName: name,
      bpmnXml: currentXmlRef.current || bpmnXml,
    });
    setStatus(null);
    setError(null);
  };

  const handleSelectWorkflow = async (selectedWorkflowId: string) => {
    const selectedWorkflow = savedWorkflows.find((workflow) => workflow.id === selectedWorkflowId);

    if (!selectedWorkflow) {
      return;
    }

    setIsLoadingWorkflows(true);
    setError(null);

    try {
      const backendWorkflow = await appWeaverApiClient.system.workflows.get(selectedWorkflowId);
      const resolvedWorkflow =
        backendWorkflow.bpmnXml.trim() ? fromBackendWorkflow(backendWorkflow) : selectedWorkflow;
      const nextSavedWorkflows = mergeSavedWorkflows([resolvedWorkflow], savedWorkflows);

      onConfigChange({
        workflowId: resolvedWorkflow.id,
        workflowName: resolvedWorkflow.name,
        bpmnXml: resolvedWorkflow.xml,
        savedWorkflows: nextSavedWorkflows,
      });
      setStatus(`Selected ${resolvedWorkflow.name}.`);
      currentXmlRef.current = resolvedWorkflow.xml;
      void importXml(resolvedWorkflow.xml);
    } catch (issue) {
      onConfigChange({
        workflowId: selectedWorkflow.id,
        workflowName: selectedWorkflow.name,
        bpmnXml: selectedWorkflow.xml,
        savedWorkflows,
      });
      setStatus(`Selected ${selectedWorkflow.name}.`);
      setError(issue instanceof Error ? issue.message : "Could not load BPMN workflow from backend.");
      currentXmlRef.current = selectedWorkflow.xml;
      void importXml(selectedWorkflow.xml);
    } finally {
      setIsLoadingWorkflows(false);
    }
  };

  const handleNewWorkflow = () => {
    const nextWorkflowId = createWorkflowId();
    const nextWorkflowName =
      workflowCreationType === "service" ? "New Service Workflow" : "New User Workflow";
    const nextXml = createDefaultBpmnXml(nextWorkflowId, nextWorkflowName, workflowCreationType);

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

    setIsSavingWorkflow(true);

    try {
      const result = await modeler.saveXML({ format: true });
      const xml = ensureFlowableServiceTaskImplementations(result.xml ?? bpmnXml);
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
      const payload: AppWeaverWorkflowConfig = {
        workflowId: savedWorkflow.id,
        workflowName: savedWorkflow.name,
        bpmnXml: xml,
        savedWorkflows: nextSavedWorkflows.map((workflow) => ({
          id: workflow.id,
          name: workflow.name,
          xml: workflow.xml,
          workflowId: workflow.id,
          workflowName: workflow.name,
          bpmnXml: workflow.xml,
        })),
      };
      const persistedWorkflow = savedWorkflows.some((workflow) => workflow.id === savedWorkflow.id)
        ? await appWeaverApiClient.system.workflows.update(savedWorkflow.id, payload)
        : await appWeaverApiClient.system.workflows.create(payload);
      const resolvedSavedWorkflow = fromBackendWorkflow(persistedWorkflow);
      const resolvedSavedWorkflows = mergeSavedWorkflows(
        [resolvedSavedWorkflow],
        nextSavedWorkflows,
      );

      setLoadedWorkflows(resolvedSavedWorkflows);
      onConfigChange({
        workflowId: resolvedSavedWorkflow.id,
        workflowName: resolvedSavedWorkflow.name,
        bpmnXml: resolvedSavedWorkflow.xml || xml,
        savedWorkflows: resolvedSavedWorkflows,
      });
      setStatus(`Saved ${resolvedSavedWorkflow.name}.`);
      setError(null);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not save BPMN workflow.");
    } finally {
      setIsSavingWorkflow(false);
    }
  };

  const handleDeleteWorkflow = async () => {
    if (!workflowId) {
      return;
    }

    setIsDeletingWorkflow(true);
    setError(null);

    try {
      await appWeaverApiClient.system.workflows.remove(workflowId);
      const nextSavedWorkflows = savedWorkflows.filter((workflow) => workflow.id !== workflowId);
      setLoadedWorkflows(nextSavedWorkflows);

      if (nextSavedWorkflows[0]) {
        const nextWorkflow = nextSavedWorkflows[0];

        onConfigChange({
          workflowId: nextWorkflow.id,
          workflowName: nextWorkflow.name,
          bpmnXml: nextWorkflow.xml,
          savedWorkflows: nextSavedWorkflows,
        });
        currentXmlRef.current = nextWorkflow.xml;
        void importXml(nextWorkflow.xml);
      } else {
        const nextWorkflowId = createWorkflowId();
        const nextWorkflowName = DEFAULT_WORKFLOW_NAME;
        const nextXml = createDefaultBpmnXml(nextWorkflowId, nextWorkflowName, workflowCreationType);

        onConfigChange({
          workflowId: nextWorkflowId,
          workflowName: nextWorkflowName,
          bpmnXml: nextXml,
          savedWorkflows: [],
        });
        currentXmlRef.current = nextXml;
        void importXml(nextXml);
      }

      setStatus("Deleted BPMN workflow.");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not delete BPMN workflow.");
    } finally {
      setIsDeletingWorkflow(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(260px, 300px) minmax(0, 1fr)",
        flex: 1,
        minHeight: 0,
        gap: 14,
      }}
    >
      <aside
        style={{
          display: "flex",
          minHeight: 0,
          flexDirection: "column",
          gap: 12,
          overflowY: "auto",
          borderRadius: 8,
          border: "1px solid rgba(203, 213, 225, 0.95)",
          background: "#ffffff",
          padding: 14,
        }}
        onKeyDownCapture={(event) => event.stopPropagation()}
        onKeyUpCapture={(event) => event.stopPropagation()}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Saved workflow</span>
          <select
            value={savedWorkflows.some((workflow) => workflow.id === workflowId) ? workflowId : ""}
            onFocus={() => {
              if (!isLoadingWorkflows && loadedWorkflows.length === 0) {
                void loadBackendWorkflows();
              }
            }}
            onChange={(event) => void handleSelectWorkflow(event.target.value)}
            style={{
              width: "100%",
              height: 42,
              borderRadius: 8,
              border: "1px solid rgba(203, 213, 225, 0.95)",
              background: "#ffffff",
              padding: "0 10px",
              color: "#0f172a",
              fontSize: 13,
              fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
            }}
          >
            <option value="">{isLoadingWorkflows ? "Loading..." : "Select BPMN workflow"}</option>
            {savedWorkflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Workflow name</span>
          <input
            key={workflowId}
            defaultValue={workflowName}
            placeholder={DEFAULT_WORKFLOW_NAME}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => handleWorkflowNameChange(event.target.value)}
            style={{
              width: "100%",
              height: 42,
              borderRadius: 8,
              border: "1px solid rgba(203, 213, 225, 0.95)",
              background: "#ffffff",
              padding: "0 10px",
              color: "#0f172a",
              fontSize: 13,
              fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
            }}
          />
        </label>

        <section aria-label="Workflow type" style={{ display: "grid", gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Workflow type</span>
          <div
            role="radiogroup"
            aria-label="Workflow type for new diagrams"
            style={{ display: "grid", gap: 7 }}
          >
            {workflowCreationOptions.map((option) => {
              const isSelected = workflowCreationType === option.type;

              return (
                <button
                  key={option.type}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  title={option.helper}
                  onClick={() => setWorkflowCreationType(option.type)}
                  style={{
                    height: 42,
                    borderRadius: 8,
                    border: isSelected
                      ? "1px solid rgba(var(--workflow-accent-rgb), 0.52)"
                      : "1px solid rgba(203, 213, 225, 0.95)",
                    background: isSelected ? "var(--workflow-accent-soft)" : "#ffffff",
                    color: isSelected ? "var(--workflow-accent)" : "#0f172a",
                    padding: "0 10px",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 800,
                    textAlign: "left",
                    fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        {isServiceTask(selectedElement) ? (
          <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Service task action</span>
            <select
              value={selectedActionId}
              onChange={(event) => updateSelectedElementAction(event.target.value)}
              disabled={isLoadingWorkflowActions || compatibleWorkflowActions.length === 0}
              style={{
                width: "100%",
                height: 42,
                borderRadius: 8,
                border: "1px solid rgba(203, 213, 225, 0.95)",
                background: "#ffffff",
                padding: "0 10px",
                color: "#0f172a",
                fontSize: 13,
                fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
              }}
            >
              <option value="">
                {isLoadingWorkflowActions
                  ? "Loading actions..."
                  : compatibleWorkflowActions.length === 0
                    ? "No workflow actions loaded"
                    : "Select workflow action"}
              </option>
              {selectedActionId && !compatibleWorkflowActions.some((action) => action.id === selectedActionId) ? (
                <option value={selectedActionId}>Unknown action: {selectedActionId}</option>
              ) : null}
              {compatibleWorkflowActions.map((action) => (
                <option key={action.id} value={action.id}>
                  {action.label || action.id}
                </option>
              ))}
            </select>
            {!isLoadingWorkflowActions && compatibleWorkflowActions.length === 0 ? (
              <span style={{ color: "#92400e", fontSize: 12, lineHeight: 1.35 }}>
                No bpmn:ServiceTask actions came back from /system/workflow-actions.
              </span>
            ) : null}
          </label>
        ) : null}

        <div style={{ display: "grid", gap: 8, marginTop: 2 }}>
          <button
            type="button"
            className="app-modal-btn app-modal-btn-secondary"
            style={{ width: "100%", height: 42, borderRadius: 8 }}
            onClick={handleNewWorkflow}
          >
            New
          </button>
          <button
            type="button"
            className="app-modal-btn app-modal-btn-secondary"
            style={{
              width: "100%",
              height: 42,
              borderRadius: 8,
              border: "1px solid rgba(16, 185, 129, 0.35)",
              background: "var(--workflow-accent)",
              color: "#ffffff",
            }}
            onClick={() => void handleSaveWorkflow()}
            disabled={isSavingWorkflow}
          >
            {isSavingWorkflow ? "Saving" : "Save"}
          </button>
          {savedWorkflows.some((workflow) => workflow.id === workflowId) ? (
            <button
              type="button"
              className="app-modal-btn app-modal-btn-secondary"
              style={{
                width: "100%",
                height: 42,
                borderRadius: 8,
                border: "1px solid rgba(239, 68, 68, 0.24)",
                background: "#fff7f7",
                color: "#b91c1c",
              }}
              onClick={() => void handleDeleteWorkflow()}
              disabled={isDeletingWorkflow}
            >
              {isDeletingWorkflow ? "Deleting" : "Delete"}
            </button>
          ) : null}
        </div>

        {workflowActionWarnings.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: 4,
              borderRadius: 8,
              border: "1px solid rgba(245, 158, 11, 0.28)",
              background: "#fffbeb",
              padding: "9px 10px",
              color: "#92400e",
              fontSize: 12,
            }}
          >
            {workflowActionWarnings.map((warning) => (
              <p key={warning} style={{ margin: 0 }}>
                {warning}
              </p>
            ))}
          </div>
        ) : null}

        {error ? (
          <p style={{ margin: 0, fontSize: 12, color: "#b91c1c" }}>{error}</p>
        ) : status ? (
          <p style={{ margin: 0, fontSize: 12, color: "#166534" }}>{status}</p>
        ) : null}
      </aside>

      <div
        ref={containerRef}
        className="bpmn-workflow-modeler"
        style={{
          width: "100%",
          height: "100%",
          minHeight: 520,
          borderRadius: 8,
          border: "1px solid rgba(203, 213, 225, 0.95)",
          background: "#ffffff",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
