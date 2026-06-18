"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  appWeaverApiClient,
  // type AppWeaverBeanConfig,
  type AppWeaverDirectRouteConfig,
  type AppWeaverDirectRouteStep,
  type AppWeaverWorkflowConfig,
} from "@/lib/appweaverApiClient";
import { nodeTypeMeta } from "@/components/node-icons";
import { CircleStop, Eye, Plus, Route } from "lucide-react";
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
type ServiceTaskTargetType = /* "bean" | */ "directRoute";
type ServiceTaskTarget = {
  targetType: ServiceTaskTargetType;
  target: string;
};

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
const SERVICE_TASK_TARGET_TYPES: ServiceTaskTargetType[] = [
  // "bean",
  "directRoute",
];
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
const routePreviewAccent = "#2DB780";
const routePreviewLine = "#94a3b8";

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

// const serviceTaskTargetOptions: Array<{
//   type: ServiceTaskTargetType;
//   label: string;
// }> = [
//   { type: "bean", label: "Bean" },
//   { type: "directRoute", label: "Direct route" },
// ];

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

function getDirectRouteStepLabel(step: AppWeaverDirectRouteStep, index: number) {
  const meta = getRouteStepMeta(step.type);
  const explicitLabel =
    typeof step.name === "string" && step.name.trim()
      ? step.name
      : typeof step.routeId === "string" && step.routeId.trim()
        ? step.routeId
        : typeof step.path === "string" && step.path.trim()
          ? step.path
          : typeof step.type === "string" && step.type.trim()
            ? meta.label
            : `Step ${index + 1}`;

  return explicitLabel;
}

function isRouteStepType(value: string): value is keyof typeof nodeTypeMeta {
  return value in nodeTypeMeta;
}

function getRouteStepMeta(type: string) {
  if (isRouteStepType(type)) {
    return nodeTypeMeta[type];
  }

  return {
    label: type
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .trim() || "Custom Step",
    Icon: nodeTypeMeta.workflow.Icon,
  };
}

function getStepStringValue(step: AppWeaverDirectRouteStep, keys: string[]) {
  for (const key of keys) {
    const value = step[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getDirectRouteStepSummary(step: AppWeaverDirectRouteStep) {
  return getStepStringValue(step, [
    "uri",
    "endpoint",
    "endpointUri",
    "ref",
    "beanName",
    "className",
    "headerName",
    "propertyName",
    "expression",
    "body",
    "routeId",
    "path",
  ]);
}

function getNestedRouteStepGroups(step: AppWeaverDirectRouteStep) {
  const groups: Array<{ label: string; steps: AppWeaverDirectRouteStep[] }> = [];

  if (Array.isArray(step.steps)) {
    groups.push({ label: "Steps", steps: step.steps as AppWeaverDirectRouteStep[] });
  }

  if (Array.isArray(step.when)) {
    step.when.forEach((branch, index) => {
      if (!branch || typeof branch !== "object" || Array.isArray(branch)) {
        return;
      }

      const branchRecord = branch as Record<string, unknown>;
      const branchSteps = branchRecord.steps;

      if (!Array.isArray(branchSteps)) {
        return;
      }

      const expression =
        typeof branchRecord.expression === "string" && branchRecord.expression.trim()
          ? branchRecord.expression.trim()
          : `When ${index + 1}`;

      groups.push({ label: expression, steps: branchSteps as AppWeaverDirectRouteStep[] });
    });
  }

  if (Array.isArray(step.otherwise)) {
    groups.push({ label: "Otherwise", steps: step.otherwise as AppWeaverDirectRouteStep[] });
  }

  return groups;
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

function isWorkflowEndpointRouteConfigError(issue: unknown) {
  return issue instanceof Error && /route config is required/i.test(issue.message);
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

function isServiceTaskTargetType(value: unknown): value is ServiceTaskTargetType {
  return typeof value === "string" && SERVICE_TASK_TARGET_TYPES.includes(value as ServiceTaskTargetType);
}

function normalizeServiceTaskTargetType(value: unknown): ServiceTaskTargetType | null {
  if (isServiceTaskTargetType(value)) {
    return value;
  }

  return value === "Route" ? "directRoute" : null;
}

function getSerializedServiceTaskTargetType(targetType: ServiceTaskTargetType) {
  return targetType === "directRoute" ? "Route" : targetType;
}

function isAppWeaverAction(
  value: unknown,
): value is { id?: string; target?: string; targetType?: string; $type?: string } {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as { $type?: unknown }).$type === APPWEAVER_ACTION_TYPE
  );
}

function getAppWeaverServiceTaskTarget(element: BpmnElement | null): ServiceTaskTarget | null {
  const values = element?.businessObject?.extensionElements?.values;
  const action = values?.find((value) => isAppWeaverAction(value));

  if (!isAppWeaverAction(action)) {
    return null;
  }

  const normalizedTargetType = normalizeServiceTaskTargetType(action.targetType);

  if (normalizedTargetType && typeof action.target === "string") {
    return {
      targetType: normalizedTargetType,
      target: action.target,
    };
  }

  if (typeof action.id === "string") {
    const [targetType, ...targetParts] = action.id.split(":");
    const target = targetParts.join(":");

    if (isServiceTaskTargetType(targetType) && target) {
      return { targetType, target };
    }
  }

  return null;
}

function normalizeAppWeaverDirectRouteActions(xml: string) {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return xml;
  }

  const document = new DOMParser().parseFromString(xml, "application/xml");
  const parseError = document.querySelector("parsererror");

  if (parseError) {
    return xml;
  }

  let didUpdate = false;
  const actions = Array.from(document.getElementsByTagNameNS(APPWEAVER_ACTION_NS, "action"));

  for (const action of actions) {
    const id = action.getAttribute("id") ?? "";
    const target = action.getAttribute("target") ?? "";
    const targetType = action.getAttribute("targetType") ?? "";
    const isDirectRouteAction =
      targetType === "directRoute" || targetType === "Route" || id.startsWith("directRoute:");

    if (!isDirectRouteAction) {
      continue;
    }

    const normalizedTarget = target || id.replace(/^directRoute:/, "");

    if (normalizedTarget && action.getAttribute("id") !== normalizedTarget) {
      action.setAttribute("id", normalizedTarget);
      didUpdate = true;
    }

    if (normalizedTarget && action.getAttribute("target") !== normalizedTarget) {
      action.setAttribute("target", normalizedTarget);
      didUpdate = true;
    }

    if (action.getAttribute("targetType") !== "Route") {
      action.setAttribute("targetType", "Route");
      didUpdate = true;
    }
  }

  return didUpdate ? new XMLSerializer().serializeToString(document) : xml;
}

function prepareBpmnXmlForBackend(xml: string) {
  return normalizeAppWeaverDirectRouteActions(ensureFlowableServiceTaskImplementations(xml));
}

function RoutePreviewConnector() {
  return (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: 34,
        color: routePreviewLine,
      }}
    >
      <span style={{ width: 2, flex: 1, minHeight: 22, background: "currentColor" }} />
      <svg
        viewBox="0 0 12 12"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3l4 5 4-5" />
      </svg>
    </div>
  );
}

function RoutePreviewEndpoint({ label, type }: { label: string; type: "start" | "end" }) {
  const Icon = type === "start" ? nodeTypeMeta.start.Icon : null;

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        gap: 8,
        minWidth: 92,
        color: type === "start" ? routePreviewAccent : "#475569",
      }}
    >
      <div
        style={{
          display: "grid",
          placeItems: "center",
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: `2px solid ${type === "start" ? routePreviewAccent : "#64748b"}`,
          background: "#ffffff",
        }}
      >
        {Icon ? (
          <Icon width={22} height={22} />
        ) : (
          <CircleStop aria-hidden="true" size={22} strokeWidth={2} />
        )}
      </div>
      <span style={{ fontSize: 12, fontWeight: 800 }}>{label}</span>
    </div>
  );
}

function RoutePreviewStepCard({
  step,
  index,
  compact = false,
}: {
  step: AppWeaverDirectRouteStep;
  index: number;
  compact?: boolean;
}) {
  const meta = getRouteStepMeta(step.type);
  const Icon = meta.Icon;
  const nestedGroups = getNestedRouteStepGroups(step);
  const summary = getDirectRouteStepSummary(step);

  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        width: "100%",
        maxWidth: compact ? "100%" : 560,
        borderRadius: 8,
        border: "1px solid rgba(203, 213, 225, 0.95)",
        background: "#ffffff",
        padding: 12,
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
        <div
          style={{
            display: "grid",
            flex: "0 0 auto",
            placeItems: "center",
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "var(--workflow-accent-soft)",
            color: routePreviewAccent,
          }}
        >
          <Icon width={20} height={20} />
        </div>
        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <span
            style={{
              color: "#0f172a",
              fontSize: 13,
              fontWeight: 900,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={getDirectRouteStepLabel(step, index)}
          >
            {getDirectRouteStepLabel(step, index)}
          </span>
          <span style={{ color: "#64748b", fontSize: 11, fontWeight: 800 }}>{step.type}</span>
        </div>
      </div>

      {summary ? (
        <span
          style={{
            color: "#475569",
            fontSize: 11,
            lineHeight: 1.35,
            overflowWrap: "anywhere",
          }}
        >
          {summary}
        </span>
      ) : null}

      {nestedGroups.length > 0 ? (
        <div style={{ display: "grid", gap: 8 }}>
          {nestedGroups.map((group) => (
            <div
              key={`${step.type}-${group.label}`}
              style={{
                display: "grid",
                gap: 6,
                borderRadius: 8,
                border: "1px solid rgba(45, 183, 128, 0.22)",
                background: "rgba(45, 183, 128, 0.06)",
                padding: 8,
              }}
            >
              <span style={{ color: "#166534", fontSize: 10, fontWeight: 900 }}>
                {group.label}
              </span>
              <RoutePreviewStepSequence steps={group.steps} compact />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RoutePreviewStepSequence({
  steps,
  compact = false,
}: {
  steps: AppWeaverDirectRouteStep[];
  compact?: boolean;
}) {
  if (steps.length === 0) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: compact ? 48 : 84,
          borderRadius: 8,
          border: "1px dashed rgba(148, 163, 184, 0.75)",
          color: "#64748b",
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        No steps
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        justifyItems: "center",
        gap: compact ? 6 : 8,
        width: "100%",
      }}
    >
      {steps.map((step, index) => (
        <div
          key={`${step.type}-${index}`}
          style={{
            display: "grid",
            justifyItems: "center",
            gap: compact ? 6 : 8,
            width: "100%",
          }}
        >
          {index > 0 ? <RoutePreviewConnector /> : null}
          <RoutePreviewStepCard step={step} index={index} compact={compact} />
        </div>
      ))}
    </div>
  );
}

function DirectRouteWorkflowPreview({ route }: { route: AppWeaverDirectRouteConfig }) {
  const steps = route.config?.steps ?? [];

  return (
    <div
      style={{
        width: "100%",
        maxHeight: "min(560px, calc(100vh - 260px))",
        borderRadius: 8,
        border: "1px solid rgba(203, 213, 225, 0.95)",
        background: "#f8fafc",
        overflowY: "auto",
        overflowX: "hidden",
        padding: 22,
      }}
    >
      <div
        style={{
          display: "grid",
          justifyItems: "center",
          gap: 8,
          width: "100%",
        }}
      >
        <RoutePreviewEndpoint label="Start" type="start" />
        <RoutePreviewConnector />
        <RoutePreviewStepSequence steps={steps} />
        <RoutePreviewConnector />
        <RoutePreviewEndpoint label="End" type="end" />
      </div>
    </div>
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
  // const beansRef = useRef<AppWeaverBeanConfig[]>([]);
  const directRoutesRef = useRef<AppWeaverDirectRouteConfig[]>([]);
  const selectedElementRef = useRef<BpmnElement | null>(null);
  const refreshServiceTaskTargetWarningsRef = useRef<() => void>(() => undefined);
  const syncSelectedElementRef = useRef<(nextSelection?: BpmnElement[]) => void>(() => undefined);
  const onConfigChangeRef = useRef(onConfigChange);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
  const [isDeletingWorkflow, setIsDeletingWorkflow] = useState(false);
  // const [beans, setBeans] = useState<AppWeaverBeanConfig[]>([]);
  const [directRoutes, setDirectRoutes] = useState<AppWeaverDirectRouteConfig[]>([]);
  const [isLoadingServiceTaskTargets, setIsLoadingServiceTaskTargets] = useState(false);
  const [selectedElement, setSelectedElement] = useState<BpmnElement | null>(null);
  const [selectedTargetType, setSelectedTargetType] = useState<ServiceTaskTargetType>("directRoute");
  const [selectedTargetName, setSelectedTargetName] = useState("");
  const [serviceTaskTargetWarnings, setServiceTaskTargetWarnings] = useState<string[]>([]);
  const [workflowCreationType, setWorkflowCreationType] = useState<WorkflowCreationType>("service");
  const [previewRoute, setPreviewRoute] = useState<AppWeaverDirectRouteConfig | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isLoadingRoutePreview, setIsLoadingRoutePreview] = useState(false);
  const [isCreatingDirectRoute, setIsCreatingDirectRoute] = useState(false);

  const configSavedWorkflows = useMemo(
    () => getSavedWorkflows(config.savedWorkflows),
    [config.savedWorkflows],
  );
  const [loadedWorkflows, setLoadedWorkflows] = useState<SavedBpmnWorkflow[]>([]);
  const savedWorkflows = useMemo(
    () => mergeSavedWorkflows(configSavedWorkflows, loadedWorkflows),
    [configSavedWorkflows, loadedWorkflows],
  );
  const serviceTaskTargetNames = useMemo(() => {
    // const names =
    //   selectedTargetType === "bean"
    //     ? beans.map((bean) => bean.name ?? "").filter(Boolean)
    //     : directRoutes.map((route) => route.name).filter(Boolean);
    const names = directRoutes.map((route) => route.name).filter(Boolean);

    return Array.from(new Set(names)).sort((left, right) => left.localeCompare(right));
  }, [directRoutes]);
  const selectedDirectRoute = useMemo(
    () => directRoutes.find((route) => route.name === selectedTargetName) ?? null,
    [directRoutes, selectedTargetName],
  );

  useEffect(() => {
    document.body.classList.toggle("direct-route-preview-open", Boolean(previewRoute));

    return () => {
      document.body.classList.remove("direct-route-preview-open");
    };
  }, [previewRoute]);

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

  const refreshServiceTaskTargetWarnings = useCallback(
    (
      // nextBeans = beansRef.current,
      nextDirectRoutes = directRoutesRef.current,
    ) => {
      const modeler = modelerRef.current;

      if (!modeler) {
        setServiceTaskTargetWarnings([]);
        return;
      }

      // const knownBeanNames = new Set(nextBeans.map((bean) => bean.name ?? "").filter(Boolean));
      const knownDirectRouteNames = new Set(nextDirectRoutes.map((route) => route.name).filter(Boolean));
      const elementRegistry = modeler.get<BpmnElementRegistry>("elementRegistry");
      const warnings = elementRegistry
        .getAll()
        .filter(isServiceTask)
        .flatMap((element) => {
          const serviceTaskTarget = getAppWeaverServiceTaskTarget(element);
          const label = getElementLabel(element);

          if (!serviceTaskTarget?.target) {
            return [`${label} has no direct route selected.`];
          }

          // if (serviceTaskTarget.targetType === "bean" && !knownBeanNames.has(serviceTaskTarget.target)) {
          //   return [`${label} uses unknown bean "${serviceTaskTarget.target}".`];
          // }

          if (
            serviceTaskTarget.targetType === "directRoute" &&
            !knownDirectRouteNames.has(serviceTaskTarget.target)
          ) {
            return [`${label} uses unknown direct route "${serviceTaskTarget.target}".`];
          }

          return [];
        });

      setServiceTaskTargetWarnings(warnings);
    },
    [setServiceTaskTargetWarnings],
  );

  const syncSelectedElement = useCallback((nextSelection?: BpmnElement[]) => {
    const selection =
      nextSelection ??
      modelerRef.current?.get<BpmnSelection>("selection").get() ??
      [];
    const element = selection.length === 1 ? selection[0] : null;

    selectedElementRef.current = element;
    setSelectedElement(element);
    const serviceTaskTarget = getAppWeaverServiceTaskTarget(element);

    if (serviceTaskTarget) {
      setSelectedTargetType(serviceTaskTarget.targetType);
      setSelectedTargetName(serviceTaskTarget.target);
    } else {
      setSelectedTargetName("");
    }
  }, [setSelectedElement, setSelectedTargetName, setSelectedTargetType]);

  useEffect(() => {
    refreshServiceTaskTargetWarningsRef.current = refreshServiceTaskTargetWarnings;
    syncSelectedElementRef.current = syncSelectedElement;
  }, [refreshServiceTaskTargetWarnings, syncSelectedElement]);

  const loadServiceTaskTargets = useCallback(async () => {
    setIsLoadingServiceTaskTargets(true);

    try {
      // const [backendBeans, backendDirectRoutes] = await Promise.all([
      //   appWeaverApiClient.system.beans.list(),
      //   appWeaverApiClient.system.directRoutes.list(),
      // ]);
      const backendDirectRoutes = await appWeaverApiClient.system.directRoutes.list();

      // beansRef.current = backendBeans;
      directRoutesRef.current = backendDirectRoutes;
      // setBeans(backendBeans);
      setDirectRoutes(backendDirectRoutes);
      refreshServiceTaskTargetWarnings(backendDirectRoutes);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load direct routes.");
    } finally {
      setIsLoadingServiceTaskTargets(false);
    }
  }, [
    refreshServiceTaskTargetWarnings,
    setError,
    // setBeans,
    setDirectRoutes,
    setIsLoadingServiceTaskTargets,
  ]);

  const updateSelectedElementTarget = useCallback(
    (targetType: ServiceTaskTargetType, targetName: string) => {
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

      if (targetName) {
        nextValues.push(
          moddle.createAny(APPWEAVER_ACTION_TYPE, APPWEAVER_ACTION_NS, {
            // id: targetType === "directRoute" ? targetName : `${targetType}:${targetName}`,
            id: targetName,
            target: targetName,
            targetType: getSerializedServiceTaskTargetType(targetType),
          }),
        );
      }

      const extensionElements = moddle.create("bpmn:ExtensionElements", {
        values: nextValues,
      });

      modeling.updateProperties(element, {
        extensionElements: nextValues.length > 0 ? extensionElements : undefined,
      });
      setSelectedTargetType(targetType);
      setSelectedTargetName(targetName);
      refreshServiceTaskTargetWarnings();
      setStatus(null);
      setError(null);
    },
    [
      refreshServiceTaskTargetWarnings,
      setError,
      setSelectedTargetName,
      setSelectedTargetType,
      setStatus,
    ],
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
      refreshServiceTaskTargetWarningsRef.current();
      setError(null);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load BPMN XML.");
    } finally {
      isImportingRef.current = false;
    }
  }, [refreshServiceTaskTargetWarningsRef, setError, syncSelectedElementRef]);

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
      void loadServiceTaskTargets();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadServiceTaskTargets]);

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
        const xml = prepareBpmnXmlForBackend(result.xml ?? "");
        currentXmlRef.current = xml;
        onConfigChangeRef.current({
          workflowId: workflowIdRef.current,
          workflowName: workflowNameRef.current,
          bpmnXml: xml,
        });
        syncSelectedElementRef.current();
        refreshServiceTaskTargetWarningsRef.current();
        setStatus(null);
        setError(null);
      });
      modeler.get<BpmnEventBus>("eventBus").on("selection.changed", (event) => {
        syncSelectedElementRef.current(event?.newSelection);
      });

      await importXml(currentXmlRef.current);
      syncSelectedElementRef.current();
      refreshServiceTaskTargetWarningsRef.current();
    };

    void setupModeler();

    return () => {
      isMounted = false;
      modeler?.destroy();
      if (modelerRef.current === modeler) {
        modelerRef.current = null;
      }
    };
  }, [importXml, refreshServiceTaskTargetWarningsRef, syncSelectedElementRef]);

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
      const xml = prepareBpmnXmlForBackend(result.xml ?? bpmnXml);
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
        savedWorkflows: nextSavedWorkflows.map((workflow) => {
          const workflowXml = prepareBpmnXmlForBackend(workflow.xml);

          return {
            id: workflow.id,
            name: workflow.name,
            xml: workflowXml,
            workflowId: workflow.id,
            workflowName: workflow.name,
            bpmnXml: workflowXml,
          };
        }),
      };
      let resolvedSavedWorkflow = savedWorkflow;
      let resolvedSavedWorkflows = nextSavedWorkflows;
      let savedToBackend = true;

      try {
        const persistedWorkflow = savedWorkflows.some((workflow) => workflow.id === savedWorkflow.id)
          ? await appWeaverApiClient.system.workflows.update(savedWorkflow.id, payload)
          : await appWeaverApiClient.system.workflows.create(payload);

        resolvedSavedWorkflow = fromBackendWorkflow(persistedWorkflow);
        resolvedSavedWorkflows = mergeSavedWorkflows(
          [resolvedSavedWorkflow],
          nextSavedWorkflows,
        );
      } catch (issue) {
        if (!isWorkflowEndpointRouteConfigError(issue)) {
          throw issue;
        }

        savedToBackend = false;
      }

      setLoadedWorkflows(resolvedSavedWorkflows);
      onConfigChange({
        workflowId: resolvedSavedWorkflow.id,
        workflowName: resolvedSavedWorkflow.name,
        bpmnXml: resolvedSavedWorkflow.xml || xml,
        savedWorkflows: resolvedSavedWorkflows,
      });
      setStatus(
        savedToBackend
          ? `Saved ${resolvedSavedWorkflow.name}.`
          : `Saved ${resolvedSavedWorkflow.name} in this workflow config.`,
      );
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

  const handleOpenDirectRoutePreview = async () => {
    if (!selectedDirectRoute) {
      setError("Select a direct route before opening its workflow.");
      return;
    }

    setIsLoadingRoutePreview(true);
    setPreviewError(null);
    setStatus(null);
    setError(null);

    try {
      const backendRoute = await appWeaverApiClient.system.directRoutes.get(selectedDirectRoute.name);

      setPreviewRoute(backendRoute);
    } catch (issue) {
      setPreviewRoute(selectedDirectRoute);
      setPreviewError(issue instanceof Error ? issue.message : "Could not load direct route JSON.");
    } finally {
      setIsLoadingRoutePreview(false);
    }
  };

  const handleCreateDirectRoute = async () => {
    const routeName = window.prompt("Direct route name");
    const normalizedRouteName = routeName?.trim();

    if (!normalizedRouteName) {
      return;
    }

    if (directRoutes.some((route) => route.name === normalizedRouteName)) {
      setError(`Direct route "${normalizedRouteName}" already exists.`);
      return;
    }

    setIsCreatingDirectRoute(true);
    setError(null);
    setStatus(null);

    try {
      const newRoute: AppWeaverDirectRouteConfig = {
        enabled: true,
        name: normalizedRouteName,
        path: "",
        index: directRoutes.length,
        description: "Custom direct route",
        config: {
          routeId: normalizedRouteName,
          from: `direct:${normalizedRouteName}`,
          contentType: "application/json",
          steps: [],
        },
      };
      const savedRoute = await appWeaverApiClient.system.directRoutes.create(newRoute);
      const nextDirectRoutes = Array.from(
        new Map([...directRoutesRef.current, savedRoute].map((route) => [route.name, route])).values(),
      ).sort((left, right) => left.name.localeCompare(right.name));

      directRoutesRef.current = nextDirectRoutes;
      setDirectRoutes(nextDirectRoutes);
      updateSelectedElementTarget("directRoute", savedRoute.name);
      setStatus(`Created direct route ${savedRoute.name}.`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not create direct route.");
    } finally {
      setIsCreatingDirectRoute(false);
    }
  };

  return (
    <>
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
          <section style={{ display: "grid", gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Service task target</span>
            {/* <select
              value={selectedTargetType}
              onChange={(event) => {
                const nextTargetType = event.target.value;

                if (isServiceTaskTargetType(nextTargetType)) {
                  updateSelectedElementTarget(nextTargetType, "");
                }
              }}
              disabled={isLoadingServiceTaskTargets}
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
              {serviceTaskTargetOptions.map((option) => (
                <option key={option.type} value={option.type}>
                  {option.label}
                </option>
              ))}
            </select> */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 38px 38px",
                gap: 6,
              }}
            >
              <select
                value={selectedTargetName}
                onChange={(event) =>
                  updateSelectedElementTarget(selectedTargetType, event.target.value)
                }
                disabled={isLoadingServiceTaskTargets || serviceTaskTargetNames.length === 0}
                style={{
                  width: "100%",
                  height: 42,
                  minWidth: 0,
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
                  {isLoadingServiceTaskTargets
                    ? "Loading direct routes..."
                    : serviceTaskTargetNames.length === 0
                      ? "No direct routes loaded"
                      : "Select direct route"}
                </option>
                {selectedTargetName && !serviceTaskTargetNames.includes(selectedTargetName) ? (
                  <option value={selectedTargetName}>Unknown target: {selectedTargetName}</option>
                ) : null}
                {serviceTaskTargetNames.map((targetName) => (
                  <option key={targetName} value={targetName}>
                    {targetName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Preview selected direct route workflow"
                title="Preview selected direct route workflow"
                onClick={() => void handleOpenDirectRoutePreview()}
                disabled={!selectedDirectRoute || isLoadingRoutePreview}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 38,
                  height: 42,
                  padding: 0,
                  borderRadius: 8,
                  border: "1px solid rgba(45, 183, 128, 0.34)",
                  background: selectedDirectRoute ? "var(--workflow-accent-soft)" : "#f8fafc",
                  color: selectedDirectRoute ? "var(--workflow-accent)" : "#94a3b8",
                  cursor: selectedDirectRoute && !isLoadingRoutePreview ? "pointer" : "not-allowed",
                }}
              >
                <Eye aria-hidden="true" size={18} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                aria-label="Create custom direct route"
                title="Create custom direct route"
                onClick={() => void handleCreateDirectRoute()}
                disabled={isCreatingDirectRoute}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 38,
                  height: 42,
                  padding: 0,
                  borderRadius: 8,
                  border: "1px solid rgba(45, 183, 128, 0.34)",
                  background: "#ffffff",
                  color: "var(--workflow-accent)",
                  cursor: isCreatingDirectRoute ? "progress" : "pointer",
                }}
              >
                <Plus aria-hidden="true" size={18} strokeWidth={2.4} />
              </button>
            </div>
            {!isLoadingServiceTaskTargets && serviceTaskTargetNames.length === 0 ? (
              <span style={{ color: "#92400e", fontSize: 12, lineHeight: 1.35 }}>
                No direct routes came back from /system/routes/direct-routes.
              </span>
            ) : null}
          </section>
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

        {serviceTaskTargetWarnings.length > 0 ? (
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
            {serviceTaskTargetWarnings.map((warning) => (
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

      {previewRoute ? (
        <div
          className="app-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPreviewRoute(null);
            }
          }}
        >
          <section
            className="app-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="direct-route-preview-title"
            style={{ width: "min(920px, calc(100vw - 48px))", maxWidth: "none" }}
          >
            <div className="app-modal-header">
              <div className="app-modal-icon" aria-hidden="true">
                <Route size={21} strokeWidth={2.1} />
              </div>
              <div className="app-modal-copy">
                <h3 id="direct-route-preview-title" className="app-modal-title">
                  {previewRoute.name}
                </h3>
                <p className="app-modal-text">
                  {previewRoute.config?.steps.length ?? 0} components from backend route JSON
                </p>
              </div>
            </div>
            <DirectRouteWorkflowPreview route={previewRoute} />
            {previewError ? (
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "#b91c1c" }}>
                {previewError}
              </p>
            ) : null}
            <div className="app-modal-actions">
              <button
                type="button"
                className="app-modal-btn app-modal-btn-secondary"
                onClick={() => setPreviewRoute(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
