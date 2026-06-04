"use client";

import { useCallback, useEffect, useState } from "react";
import { appWeaverApiClient } from "@/lib/appweaverApiClient";
import { useFlowStore } from "@/store/useFlowStore";
import { ConnectorIcon, nodeTypeMeta } from "./node-icons";

const JAVA_CLASS_OPTIONS = [
  { label: "Map", value: "java.util.Map", hint: "Generic key-value JSON object" },
  { label: "String", value: "java.lang.String", hint: "Plain text payload" },
  {
    label: "JsonNode",
    value: "com.fasterxml.jackson.databind.JsonNode",
    hint: "Jackson tree model",
  },
  { label: "List", value: "java.util.List", hint: "Ordered JSON array" },
] as const;

const LOG_LEVEL_OPTIONS = ["DEBUG", "INFO", "WARN", "ERROR"] as const;
const MARSHAL_TYPE_OPTIONS = [{ label: "JSON", value: "json" }] as const;
const TRANSFORM_TYPE_OPTIONS = [
  { label: "Simple expression", value: "simple" },
  { label: "JSON mapper", value: "mapper" },
] as const;
const PROCESS_MODE_OPTIONS = [
  { label: "Bean reference", value: "ref" },
  { label: "Processor class", value: "clazz" },
] as const;
const BEAN_MODE_OPTIONS = [
  { label: "Bean reference", value: "ref" },
  { label: "Bean class", value: "clazz" },
] as const;
const DB_CRUD_OPERATION_OPTIONS = [
  { label: "Create", value: "create" },
  { label: "Batch Insert", value: "batchInsert" },
  { label: "Select one", value: "readOne" },
  { label: "Select many", value: "readMany" },
  { label: "Update", value: "update" },
  { label: "Delete", value: "delete" },
  { label: "Custom SQL", value: "customSql" },
] as const;
const DB_CRUD_OUTPUT_OPTIONS = [
  { label: "JSON", value: "json" },
  { label: "Raw", value: "raw" },
  { label: "No response body", value: "none" },
] as const;
const SMART_ROUTER_PROTOCOL_OPTIONS = ["http", "https", "grpc", "soap"] as const;
const SMART_ROUTER_METHOD_OPTIONS = ["get", "post", "put", "patch", "delete"] as const;
const SMART_ROUTER_TRANSFORM_OPTIONS = [
  { label: "Simple Transform", value: "simple-transform" },
  { label: "Array Transform", value: "array-transform" },
  { label: "Nested Object Mapping", value: "nested-object-mapping-transform" },
  { label: "Nested Array Nested Object", value: "nested-array-nested-object" },
  { label: "Enrichment Transform", value: "enrichment-transform" },
  { label: "Multi Array Transform", value: "multi-array-transform" },
  { label: "Flatten Transform", value: "flatten-transform" },
] as const;
const UNMARSHAL_TYPE_OPTIONS = [
  { label: "JSON", value: "json" },
  { label: "CSV", value: "csv" },
  { label: "XML", value: "xml" },
] as const;
const UNMARSHAL_LIBRARY_OPTIONS = [
  { label: "Jackson", value: "Jackson" },
  { label: "Custom ObjectMapper", value: "custom" },
  { label: "Default", value: "" },
] as const;
const ENRICH_ENDPOINT_TYPE_OPTIONS = ["NONE", "REST", "DB"] as const;
const DEFAULT_ENRICH_STRATEGY_CLASS =
  "com.bytestrone.appweaver.integration.core.aggregator.imp.EnrichAggregationStrategy";
const DEFAULT_SPLIT_AGGREGATION_STRATEGY_CLASS =
  "com.bytestrone.appweaver.integration.core.aggregator.imp.SourceTrackingAggregationStrategy";

const panelStyle: React.CSSProperties = {
  position: "absolute",
  right: 16,
  top: 16,
  bottom: 16,
  zIndex: 20,
  width: "min(520px, calc(100vw - 32px))",
  maxWidth: "calc(100vw - 32px)",
  overflowY: "auto",
  overscrollBehavior: "contain",
  scrollbarWidth: "thin",
  borderRadius: 18,
  border: "1px solid rgba(226, 232, 240, 0.95)",
  background: "rgba(255, 255, 255, 0.96)",
  backdropFilter: "blur(16px)",
  padding: "18px 18px 20px",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
};

const promptTemplatePanelStyle: React.CSSProperties = {
  ...panelStyle,
  right: "calc(min(520px, calc(100vw - 32px)) + 16px)",
  width: "min(440px, calc(100vw - 32px))",
  maxWidth: "calc(100vw - 32px)",
  display: "flex",
  flexDirection: "column",
  overflowY: "hidden",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 10,
  border: "1px solid rgba(203, 213, 225, 0.95)",
  background: "#ffffff",
  padding: "10px 12px",
  fontSize: 13,
  lineHeight: 1.45,
  color: "#0f172a",
  fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
  outline: "none",
};

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 112,
  resize: "vertical",
};

const codeTextAreaStyle: React.CSSProperties = {
  ...textAreaStyle,
  minHeight: 180,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  lineHeight: 1.65,
  whiteSpace: "pre",
  overflowX: "auto",
};

const helperTextStyle: React.CSSProperties = {
  marginTop: 5,
  fontSize: 11,
  lineHeight: 1.45,
  color: "#64748b",
};

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  borderRadius: 0,
  border: "none",
  borderTop: "1px solid rgba(226, 232, 240, 0.95)",
  background: "transparent",
  padding: "16px 0 0",
};

const compactSectionStyle: React.CSSProperties = {
  ...sectionStyle,
  gap: 12,
  padding: "14px 0 0",
};

const deleteBtnStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 8,
  border: "none",
  background: "#dc2626",
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 500,
  color: "#fff",
  cursor: "pointer",
  fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
};

const iconButtonStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  flex: "0 0 38px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  border: "1px solid rgba(203, 213, 225, 0.95)",
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  borderRadius: 8,
  border: "1px solid rgba(203, 213, 225, 0.95)",
  background: "#ffffff",
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 700,
  color: "#0f172a",
  cursor: "pointer",
  fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
};

const primaryBtnStyle: React.CSSProperties = {
  ...secondaryBtnStyle,
  border: "1px solid rgba(var(--workflow-accent-rgb), 0.32)",
  background: "var(--workflow-accent)",
  color: "#ffffff",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 4,
  display: "block",
};

const selectWrapStyle: React.CSSProperties = {
  position: "relative",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  paddingRight: 42,
  cursor: "pointer",
  minHeight: 44,
  border: "1px solid rgba(var(--workflow-accent-rgb), 0.28)",
  background: "#ffffff",
  boxShadow: "inset 0 0 0 1px rgba(var(--workflow-accent-rgb), 0.06), 0 0 0 1px rgba(var(--workflow-accent-rgb), 0.04)",
  fontWeight: 600,
};

const optionStyle: React.CSSProperties = {
  background: "#ffffff",
  color: "#0f172a",
};

const selectIconStyle: React.CSSProperties = {
  position: "absolute",
  right: 10,
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  color: "var(--workflow-accent)",
  width: 26,
  height: 26,
  padding: 5,
  borderRadius: 999,
  background: "var(--workflow-accent-soft)",
  border: "1px solid rgba(var(--workflow-accent-rgb), 0.14)",
};

function getProperties(config: Record<string, unknown>) {
  const properties = config.properties;
  return properties && typeof properties === "object" && !Array.isArray(properties)
    ? (properties as Record<string, unknown>)
    : {};
}

function getCustomFieldValue(config: Record<string, unknown>, field: { key: string; target?: string }) {
  return field.target === "properties" ? getProperties(config)[field.key] : config[field.key];
}

function buildCustomFieldUpdate(
  config: Record<string, unknown>,
  field: { key: string; target?: string },
  value: unknown,
) {
  if (field.target !== "properties") {
    return { [field.key]: value };
  }

  return {
    properties: {
      ...getProperties(config),
      [field.key]: value,
    },
  };
}

function parseSetBodyDataValue(value: string): unknown {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function parseOptionalJsonValue(value: string): unknown {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function getDelimiterValue(value: string) {
  return value ? value.slice(0, 1) : undefined;
}

function parseValidationRules(value: string) {
  const parsed = JSON.parse(value) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Validation rules must be a JSON array.");
  }

  return parsed
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    .map((item) => ({
      expression: String(item.expression ?? ""),
      ...(typeof item.errorMessage === "string" && item.errorMessage.trim()
        ? { errorMessage: item.errorMessage }
        : {}),
    }))
    .filter((item) => item.expression.trim());
}

function parseTransformMapper(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return {};
  }

  const parsed = JSON.parse(trimmed) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Transform mapper must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

function parseParameters(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return {};
  }

  const parsed = JSON.parse(trimmed) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Parameters must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

function parseJsonArray(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  const parsed = JSON.parse(trimmed) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Value must be a JSON array.");
  }

  return parsed;
}

function appendDefaultTenantValueMapping(values: unknown[]) {
  const hasTenantId = values.some((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return false;
    }

    const mapping = item as Record<string, unknown>;
    return mapping.column === "tenant_id" || mapping.parameterName === "tenant_id";
  });

  if (hasTenantId) {
    return values;
  }

  return [
    ...values,
    {
      column: "tenant_id",
      valueExpression: "${body['tenant_id']}",
      parameterName: "tenant_id",
    },
  ];
}

type PromptTemplateEditorMode = "view" | "create";

type PromptTemplateEditorState = {
  isOpen: boolean;
  nodeId: string | null;
  mode: PromptTemplateEditorMode;
  path: string;
  draft: string;
  isLoading: boolean;
  isSaving: boolean;
  message: string | null;
  error: string | null;
};

const closedPromptTemplateEditor: PromptTemplateEditorState = {
  isOpen: false,
  nodeId: null,
  mode: "view",
  path: "",
  draft: "",
  isLoading: false,
  isSaving: false,
  message: null,
  error: null,
};

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export default function ConfigPanel() {
  const {
    selectedNode,
    selectedEdge,
    updateNodeData,
    deleteEdge,
    deleteNode,
    openNestedRouteCanvas,
    customComponents,
  } = useFlowStore();
  const [promptEditor, setPromptEditor] = useState<PromptTemplateEditorState>(closedPromptTemplateEditor);
  const [llmProviderOptions, setLlmProviderOptions] = useState<string[]>([]);
  const [ragConfigOptions, setRagConfigOptions] = useState<string[]>([]);
  const [isAgentOptionsLoading, setIsAgentOptionsLoading] = useState(false);
  const [agentOptionsError, setAgentOptionsError] = useState<string | null>(null);
  const [promptTemplateOptions, setPromptTemplateOptions] = useState<string[]>([]);
  const [isPromptTemplateOptionsLoading, setIsPromptTemplateOptionsLoading] = useState(false);
  const [promptTemplateOptionsError, setPromptTemplateOptionsError] = useState<string | null>(null);

  const loadAgentOptions = useCallback(async () => {
    setIsAgentOptionsLoading(true);
    setAgentOptionsError(null);

    try {
      const [providers, ragConfigs] = await Promise.all([
        appWeaverApiClient.system.llm.providers.list(),
        appWeaverApiClient.system.llm.rag.list(),
      ]);

      setLlmProviderOptions(
        Array.from(
          new Set(
            providers
              .map((provider) => String(provider.id ?? provider.model ?? "").trim())
              .filter(Boolean),
          ),
        ).sort((first, second) => first.localeCompare(second)),
      );
      setRagConfigOptions(
        Array.from(
          new Set(
            ragConfigs
              .map((ragConfig) => String(ragConfig.id ?? ragConfig.embeddingStore.indexName ?? "").trim())
              .filter(Boolean),
          ),
        ).sort((first, second) => first.localeCompare(second)),
      );
    } catch (issue) {
      setAgentOptionsError(
        issue instanceof Error ? issue.message : "Could not load LLM configuration options.",
      );
    } finally {
      setIsAgentOptionsLoading(false);
    }
  }, []);

  const loadPromptTemplateOptions = useCallback(async () => {
    setIsPromptTemplateOptionsLoading(true);
    setPromptTemplateOptionsError(null);

    try {
      const templates = await appWeaverApiClient.system.promptTemplates.list();
      setPromptTemplateOptions(
        Array.from(
          new Set(
            templates
              .map((template) => template.path.trim())
              .filter((templatePath) => templatePath.toLowerCase().endsWith(".md")),
          ),
        ).sort((first, second) => first.localeCompare(second)),
      );
    } catch (issue) {
      setPromptTemplateOptionsError(
        issue instanceof Error ? issue.message : "Could not load prompt templates.",
      );
    } finally {
      setIsPromptTemplateOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAgentOptions();
    void loadPromptTemplateOptions();
  }, [loadAgentOptions, loadPromptTemplateOptions]);

  if (!selectedNode && !selectedEdge) {
    return null;
  }

  if (selectedEdge) {
    return (
      <div style={panelStyle}>
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 12,
            fontSize: 14,
          }}
        >
          <ConnectorIcon style={{ width: 16, height: 16, color: "var(--workflow-accent)" }} />
          Connector
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          {selectedEdge.source} to {selectedEdge.target}
        </p>
        <button type="button" style={deleteBtnStyle} onClick={() => deleteEdge(selectedEdge.id)}>
          Delete connector
        </button>
      </div>
    );
  }

  if (!selectedNode) {
    return null;
  }

  const type = selectedNode.type;
  const componentKey = selectedNode.data.componentKey ?? type ?? "";
  const customComponent = customComponents.find((component) => component.type === componentKey) ?? null;

  if (type === "start") {
    return null;
  }

  const nodeMeta = nodeTypeMeta[type as keyof typeof nodeTypeMeta] ?? nodeTypeMeta.process;
  const config = (selectedNode.data.config as Record<string, unknown> | undefined) ?? {};
  const isPromptEditorOpen = promptEditor.isOpen && promptEditor.nodeId === selectedNode.id;
  const selectedUnmarshalType = String(config.name ?? "json");
  const selectedTransformType = String(config.name ?? "simple");
  const selectedProcessMode = typeof config.clazz === "string" && config.clazz.trim() ? "clazz" : "ref";
  const selectedBeanMode = typeof config.clazz === "string" && config.clazz.trim() ? "clazz" : "ref";
  const selectedDbCrudOperation = String(config.operation ?? "customSql");
  const selectedSmartRouterProtocol = String(config.protocol ?? "http");
  const aggregationClazz =
    config.aggregationClazz && typeof config.aggregationClazz === "object" && !Array.isArray(config.aggregationClazz)
      ? (config.aggregationClazz as Record<string, unknown>)
      : {};
  const llmId = String(config.llmId ?? "");
  const trimmedLlmId = llmId.trim();
  const llmProviderChoices =
    trimmedLlmId && !llmProviderOptions.includes(trimmedLlmId)
      ? [trimmedLlmId, ...llmProviderOptions]
      : llmProviderOptions;
  const chatSettingsId = String(config.chatSettingsId ?? "");
  const trimmedChatSettingsId = chatSettingsId.trim();
  const chatSettingsChoices =
    trimmedChatSettingsId && trimmedChatSettingsId !== "default"
      ? [trimmedChatSettingsId, "default"]
      : ["default"];
  const ragId = String(config.ragId ?? "");
  const trimmedRagId = ragId.trim();
  const ragConfigChoices =
    trimmedRagId && !ragConfigOptions.includes(trimmedRagId)
      ? [trimmedRagId, ...ragConfigOptions]
      : ragConfigOptions;
  const promptTemplatePath = String(config.promptTemplate ?? "");
  const trimmedPromptTemplatePath = promptTemplatePath.trim();
  const promptTemplateChoices =
    trimmedPromptTemplatePath && !promptTemplateOptions.includes(trimmedPromptTemplatePath)
      ? [trimmedPromptTemplatePath, ...promptTemplateOptions]
      : promptTemplateOptions;
  const openPromptTemplateEditor = async () => {
    const path = promptTemplatePath.trim();

    if (!path) {
      setPromptEditor({
        ...closedPromptTemplateEditor,
        isOpen: true,
        nodeId: selectedNode.id,
        mode: "view",
        error: "Enter a prompt template path before opening it.",
      });
      return;
    }

    setPromptEditor({
      isOpen: true,
      nodeId: selectedNode.id,
      mode: "view",
      path,
      draft: "",
      isLoading: true,
      isSaving: false,
      message: null,
      error: null,
    });

    try {
      const template = await appWeaverApiClient.system.promptTemplates.get(path);
      setPromptEditor({
        isOpen: true,
        nodeId: selectedNode.id,
        mode: "view",
        path: template.path || path,
        draft: template.content,
        isLoading: false,
        isSaving: false,
        message: `Loaded ${template.path || path}.`,
        error: null,
      });
    } catch (issue) {
      setPromptEditor((current) => ({
        ...current,
        isLoading: false,
        error: issue instanceof Error ? issue.message : "Could not load the prompt template.",
      }));
    }
  };
  const createPromptTemplateEditor = () => {
    const currentPath = promptTemplatePath.trim();
    const basePath = currentPath.includes("/")
      ? currentPath.slice(0, currentPath.lastIndexOf("/") + 1)
      : "/agents/";

    setPromptEditor({
      isOpen: true,
      nodeId: selectedNode.id,
      mode: "create",
      path: `${basePath}newPromptTemplate.md`,
      draft: "# New prompt template\n\n",
      isLoading: false,
      isSaving: false,
      message: null,
      error: null,
    });
  };
  const savePromptTemplateEditor = async () => {
    const path = promptEditor.path.trim();

    if (!path) {
      setPromptEditor((current) => ({ ...current, error: "Prompt template path is required." }));
      return;
    }

    setPromptEditor((current) => ({ ...current, isSaving: true, message: null, error: null }));

    try {
      const savedTemplate =
        promptEditor.mode === "create"
          ? await appWeaverApiClient.system.promptTemplates.create({
              path,
              content: promptEditor.draft,
            })
          : await appWeaverApiClient.system.promptTemplates.update(path, promptEditor.draft);

      updateNodeData(selectedNode.id, {
        config: { promptTemplate: savedTemplate.path || path },
      });
      setPromptEditor((current) => ({
        ...current,
        nodeId: selectedNode.id,
        mode: "view",
        path: savedTemplate.path || path,
        draft: savedTemplate.content || current.draft,
        isSaving: false,
        message: `Saved ${savedTemplate.path || path}.`,
        error: null,
      }));
    } catch (issue) {
      setPromptEditor((current) => ({
        ...current,
        isSaving: false,
        error: issue instanceof Error ? issue.message : "Could not save the prompt template.",
      }));
    }
  };
  const dbCrudValuesForEditor =
    ["create", "batchInsert"].includes(selectedDbCrudOperation)
      ? appendDefaultTenantValueMapping(Array.isArray(config.values) ? config.values : [])
      : Array.isArray(config.values)
        ? config.values
        : [];
  const panelDescription = customComponent
    ? customComponent.description || "Configure this custom component from its template fields."
    :
    type === "marshal"
      ? "Write the exchange body into the selected data format."
      : type === "setBody"
        ? "Set the exchange body from an expression or constant data."
      : type === "setHeader"
        ? "Set an exchange header from an expression or constant value."
        : type === "setProperty"
          ? "Set an exchange property from an expression or constant value."
        : type === "setContext"
          ? "Set a shared context value from an expression or constant."
        : type === "globalOption"
          ? "Set a Camel global option from a constant or expression."
        : type === "convertBodyTo"
          ? "Convert the exchange body to a target Java class."
        : type === "transform"
          ? "Transform the exchange body with a simple expression or JSON mapper."
      : type === "filter"
        ? "Continue only when an expression or processor allows the exchange."
        : type === "routeContainer"
          ? "Open a nested canvas and define a child route inside this component."
        : type === "split"
          ? "Split the exchange body and run nested backend steps."
        : type === "dynamicroute"
          ? "Route exchanges dynamically through a backend router class."
        : type === "validate"
          ? "Validate the JSON payload with backend validation rules."
        : type === "to"
          ? "Send the exchange to a static Camel endpoint."
        : type === "toD"
          ? "Send the exchange to a dynamic Camel endpoint URI."
        : type === "upload"
          ? "Upload multipart documents to the configured backend endpoint."
        : type === "download"
          ? "Download content from the configured backend endpoint."
        : type === "enrich"
          ? "Enrich the exchange from another endpoint using request and response mapping."
        : type === "dbCrud"
          ? "Configure a database operation that exports as standard backend route steps."
        : type === "smartRouter"
          ? "Route requests to the configured endpoint and optionally transform the payload first."
        : type === "agent"
          ? "Invoke the backend agent endpoint with direct-route tools filtered by tag."
        : type === "bean"
          ? "Invoke a backend bean by registry reference or Java class."
        : type === "aggregation"
          ? "Aggregate exchanges with a configured AggregationStrategy."
        : type === "unmarshal"
          ? "Read JSON, CSV, or XML payloads into the exchange body."
        : type === "log"
          ? "Write a message through the backend LogHandler."
        : type === "delay"
          ? "Pause route processing with a constant or simple expression."
          : "Run a processor bean by its Spring or Camel reference name.";

  return (
    <>
      <div style={panelStyle}>
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 12,
            fontSize: 14,
          }}
        >
        {nodeMeta ? <nodeMeta.Icon style={{ width: 16, height: 16, color: "var(--workflow-accent)" }} /> : null}
        {customComponent ? customComponent.label : nodeMeta ? nodeMeta.label : type} Config
      </h2>

      <p style={{ ...helperTextStyle, marginTop: -4, marginBottom: 14 }}>{panelDescription}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={sectionStyle}>
          <label
            style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}
          >
            <input
              type="checkbox"
              checked={config.disabled !== true}
              onChange={(event) =>
                updateNodeData(selectedNode.id, {
                  config: { disabled: !event.target.checked },
                })
              }
            />
            <span style={{ fontWeight: 700 }}>Enabled in direct route</span>
          </label>
          <p style={helperTextStyle}>
            Disabled components stay on the canvas but are ignored when creating or exporting the backend direct route.
          </p>
        </div>

        {type === "marshal" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Data format</span>
              <div style={selectWrapStyle}>
                <select
                  value={String(config.name ?? "json")}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { name: event.target.value },
                    })
                  }
                >
                  {MARSHAL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={optionStyle}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={selectIconStyle}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <p style={helperTextStyle}>Saved as `name`. The backend currently handles `json` with `camelJackson`.</p>
            </label>
            <label
              style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}
            >
              <input
                type="checkbox"
                checked={Boolean(config.useList)}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { useList: event.target.checked },
                  })
                }
              />
              <span style={{ fontWeight: 700 }}>Marshal list payloads</span>
            </label>
            <p style={helperTextStyle}>Saved as `useList` for the backend `MarshallStep`.</p>
          </div>
        )}

        {type === "unmarshal" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Payload type</span>
              <div style={selectWrapStyle}>
                <select
                  value={String(config.name ?? "json")}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { name: event.target.value },
                    })
                  }
                >
                  {UNMARSHAL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={optionStyle}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={selectIconStyle}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <p style={helperTextStyle}>Saved as `name`: `json`, `csv`, or `xml`.</p>
            </label>

            {selectedUnmarshalType === "json" ? (
              <>
                <label>
                  <span style={labelStyle}>JSON library</span>
                  <div style={selectWrapStyle}>
                    <select
                      value={String(config.library ?? "Jackson")}
                      style={selectStyle}
                      onChange={(event) =>
                        updateNodeData(selectedNode.id, {
                          config: { library: event.target.value },
                        })
                      }
                    >
                      {UNMARSHAL_LIBRARY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} style={optionStyle}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={selectIconStyle}
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                  <p style={helperTextStyle}>Used when payload type is `json`.</p>
                </label>

                <label>
                  <span style={labelStyle}>Target class</span>
                  <div style={selectWrapStyle}>
                    <select
                      value={String(config.clazz ?? "java.util.Map")}
                      style={selectStyle}
                      onChange={(event) =>
                        updateNodeData(selectedNode.id, {
                          config: { clazz: event.target.value },
                        })
                      }
                    >
                      {JAVA_CLASS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} style={optionStyle}>
                          {option.label} - {option.value}
                        </option>
                      ))}
                    </select>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={selectIconStyle}
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                  <p style={helperTextStyle}>Saved as `clazz` for JSON unmarshalling.</p>
                </label>

                <label
                  style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(config.useList)}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, {
                        config: { useList: event.target.checked },
                      })
                    }
                  />
                  <span style={{ fontWeight: 700 }}>Use list for JSON payloads</span>
                </label>
              </>
            ) : null}

            {selectedUnmarshalType === "csv" ? (
              <>
                <label>
                  <span style={labelStyle}>CSV delimiter</span>
                  <input
                    value={String(config.delimiter ?? ",")}
                    placeholder=","
                    maxLength={1}
                    style={inputStyle}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, {
                        config: { delimiter: getDelimiterValue(event.target.value) },
                      })
                    }
                  />
                  <p style={helperTextStyle}>Saved as a single-character `delimiter` for CSV payloads.</p>
                </label>

                <label
                  style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(config.skipHeader)}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, {
                        config: { skipHeader: event.target.checked },
                      })
                    }
                  />
                  <span style={{ fontWeight: 700 }}>Skip CSV header row</span>
                </label>

                <label
                  style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(config.useMap)}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, {
                        config: { useMap: event.target.checked },
                      })
                    }
                  />
                  <span style={{ fontWeight: 700 }}>Use CSV maps</span>
                </label>
              </>
            ) : null}
          </div>
        )}

        {type === "setBody" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Name</span>
              <input
                value={String(config.name ?? "")}
                placeholder="setBody"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { name: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `name` for the backend SetBody step.</p>
            </label>
            <label>
              <span style={labelStyle}>Expression</span>
              <textarea
                value={String(config.expression ?? "")}
                placeholder="${body}"
                style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { expression: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>
                Saved as `expression`. Values containing <code>{"${...}"}</code> or <code>#</code> are evaluated as
                Camel simple expressions.
              </p>
            </label>
            <label>
              <span style={labelStyle}>Data</span>
              <textarea
                value={
                  config.data === undefined
                    ? ""
                    : typeof config.data === "string"
                      ? config.data
                      : JSON.stringify(config.data, null, 2)
                }
                placeholder='{"status":"ok"}'
                style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { data: parseSetBodyDataValue(event.target.value) },
                  })
                }
              />
              <p style={helperTextStyle}>
                Optional constant body. When provided, the backend uses `data` before `expression`.
              </p>
            </label>
          </div>
        )}

        {type === "setHeader" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Header name</span>
              <input
                value={String(config.name ?? "")}
                placeholder="Content-Type"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { name: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `name`, for example `Content-Type`.</p>
            </label>
            <label>
              <span style={labelStyle}>Expression</span>
              <textarea
                value={String(config.expression ?? "")}
                placeholder="application/json"
                style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { expression: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>
                Saved as `expression`. Values containing <code>{"${...}"}</code> or <code>#</code> are evaluated as
                Camel simple expressions; other values are constants.
              </p>
            </label>
          </div>
        )}

        {type === "setProperty" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Property name</span>
              <input
                value={String(config.name ?? "")}
                placeholder="propertyName"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { name: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `name`, for example `originalBody`.</p>
            </label>
            <label>
              <span style={labelStyle}>Expression</span>
              <textarea
                value={String(config.expression ?? "")}
                placeholder="${body}"
                style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { expression: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>
                Saved as `expression`. Values containing <code>{"${...}"}</code> or <code>#</code> are evaluated as
                Camel simple expressions; other values are constants.
              </p>
            </label>
          </div>
        )}

        {type === "setContext" && (
          <div style={compactSectionStyle}>
            <label>
              <span style={labelStyle}>Context name</span>
              <input
                value={String(config.name ?? "")}
                placeholder="contextKey"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { name: event.target.value },
                  })
                }
              />
            </label>
            <label>
              <span style={labelStyle}>Expression</span>
              <textarea
                value={String(config.expression ?? "")}
                placeholder="${body.customerId}"
                style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { expression: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Use <code>{"${...}"}</code> or <code>#</code> for Camel simple expressions.</p>
            </label>
            <label>
              <span style={labelStyle}>Constant value</span>
              <textarea
                value={
                  config.value === undefined
                    ? ""
                    : typeof config.value === "string"
                      ? config.value
                      : JSON.stringify(config.value, null, 2)
                }
                placeholder='{"tenant":"default"}'
                style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { value: parseOptionalJsonValue(event.target.value) },
                  })
                }
              />
              <p style={helperTextStyle}>Used when expression is blank or constant text.</p>
            </label>
          </div>
        )}

        {type === "globalOption" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Option name</span>
              <input
                value={String(config.name ?? "")}
                placeholder="optionName"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { name: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `name` and used as the Camel global option key.</p>
            </label>
            <label>
              <span style={labelStyle}>Expression or value</span>
              <input
                value={String(config.expression ?? "")}
                placeholder="${body}"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { expression: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>
                Values containing <code>{"${...}"}</code> or <code>#</code> are evaluated as expressions.
              </p>
            </label>
          </div>
        )}

        {type === "convertBodyTo" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Target class</span>
              <div style={selectWrapStyle}>
                <select
                  value={String(config.clazz ?? "java.lang.String")}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { clazz: event.target.value },
                    })
                  }
                >
                  {JAVA_CLASS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={optionStyle}>
                      {option.label} - {option.value}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={selectIconStyle}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <p style={helperTextStyle}>
                Saved as `clazz`; the backend resolves it with `Class.forName` before calling `convertBodyTo`.
              </p>
            </label>
          </div>
        )}

        {type === "transform" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Transform type</span>
              <div style={selectWrapStyle}>
                <select
                  value={selectedTransformType}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { name: event.target.value },
                    })
                  }
                >
                  {TRANSFORM_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={optionStyle}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={selectIconStyle}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <p style={helperTextStyle}>Saved as `name`: `simple` or `mapper`.</p>
            </label>

            {selectedTransformType === "simple" ? (
              <label>
                <span style={labelStyle}>Expression</span>
                <textarea
                  value={String(config.expression ?? "")}
                  placeholder="${body}"
                  style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { expression: event.target.value },
                    })
                  }
                />
                <p style={helperTextStyle}>Saved as `expression` and passed to Camel `transform().simple(...)`.</p>
              </label>
            ) : null}

            {selectedTransformType === "mapper" ? (
              <label>
                <span style={labelStyle}>Mapper JSON</span>
                <textarea
                  key={`${selectedNode.id}-transform-mapper`}
                  defaultValue={JSON.stringify(
                    config.mapper && typeof config.mapper === "object" && !Array.isArray(config.mapper)
                      ? config.mapper
                      : {},
                    null,
                    2,
                  )}
                  placeholder='{"targetField":"$.sourceField"}'
                  style={{ ...inputStyle, minHeight: 150, resize: "vertical", fontFamily: "monospace" }}
                  onBlur={(event) => {
                    try {
                      updateNodeData(selectedNode.id, {
                        config: { mapper: parseTransformMapper(event.target.value) },
                      });
                    } catch (issue) {
                      window.alert(issue instanceof Error ? issue.message : "Transform mapper must be valid JSON.");
                    }
                  }}
                />
                <p style={helperTextStyle}>Saved as `mapper` and passed into `JsonExpressionTransformer`.</p>
              </label>
            ) : null}
          </div>
        )}

        {type === "filter" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Expression</span>
              <textarea
                value={String(config.expression ?? "")}
                placeholder="${body} != null"
                style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { expression: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `expression`; the backend evaluates it as a Boolean.</p>
            </label>
            <label>
              <span style={labelStyle}>Filter processor class</span>
              <input
                value={String(config.clazz ?? "")}
                placeholder="com.example.MyFilterProcessor"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { clazz: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Optional. Used only when nested steps are empty.</p>
            </label>
            <label>
              <span style={labelStyle}>Nested steps JSON</span>
              <textarea
                key={`${selectedNode.id}-filter-steps`}
                defaultValue={JSON.stringify(Array.isArray(config.steps) ? config.steps : [], null, 2)}
                placeholder='[{"type":"log","message":"Matched"}]'
                style={{ ...codeTextAreaStyle, minHeight: 160 }}
                onBlur={(event) => {
                  try {
                    updateNodeData(selectedNode.id, {
                      config: { steps: parseJsonArray(event.target.value) },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Nested steps must be a JSON array.");
                  }
                }}
              />
            </label>
          </div>
        )}

        {type === "routeContainer" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Route ID</span>
              <input
                value={String(config.routeId ?? "")}
                placeholder="nestedRoute"
                style={inputStyle}
                onChange={(event) => {
                  const routeId = event.target.value;
                  updateNodeData(selectedNode.id, {
                    label: routeId.trim() || "Nested Route",
                    config: { routeId },
                  });
                }}
              />
              <p style={helperTextStyle}>Exports as `routeId` on the nested route step.</p>
            </label>
            <label>
              <span style={labelStyle}>From endpoint</span>
              <input
                value={String(config.from ?? "")}
                placeholder="direct:nestedRoute"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { from: event.target.value },
                  })
                }
              />
            </label>
            <label>
              <span style={labelStyle}>Backend step type</span>
              <input
                value={String(config.backendType ?? "route")}
                placeholder="route"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { backendType: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Defaults to `route`; nested components are exported under this step&apos;s `steps` array.</p>
            </label>
            <label>
              <span style={labelStyle}>Content type</span>
              <input
                value={String(config.contentType ?? "")}
                placeholder="application/json"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { contentType: event.target.value },
                  })
                }
              />
            </label>
            <label>
              <span style={labelStyle}>Description</span>
              <textarea
                value={String(config.description ?? "")}
                placeholder="Nested route purpose"
                style={{ ...inputStyle, minHeight: 88, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { description: event.target.value },
                  })
                }
              />
            </label>
            <button
              type="button"
              style={primaryBtnStyle}
              onClick={() => openNestedRouteCanvas(selectedNode.id)}
            >
              Open nested route
            </button>
            <p style={helperTextStyle}>
              Use the nested canvas to drag and connect normal route components. The parent component exports those
              components as nested backend `steps`.
            </p>
          </div>
        )}

        {type === "split" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Simple expression</span>
              <input
                value={String(config.expression ?? "")}
                placeholder="${body}"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { expression: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Optional. When empty, the backend splits the current body.</p>
            </label>
            <label>
              <span style={labelStyle}>Tokenize delimiter</span>
              <input
                value={String(config.tokenize ?? "")}
                placeholder=","
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { tokenize: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Used only when no simple expression or split class is configured.</p>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={config.streaming !== false}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { streaming: event.target.checked },
                  })
                }
              />
              <span style={{ fontWeight: 700 }}>Streaming split</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={Boolean(config.parallel)}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { parallel: event.target.checked },
                  })
                }
              />
              <span style={{ fontWeight: 700 }}>Parallel processing</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={Boolean(config.useVirtualThread)}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { useVirtualThread: event.target.checked },
                  })
                }
              />
              <span style={{ fontWeight: 700 }}>Use virtual thread executor</span>
            </label>
            <label>
              <span style={labelStyle}>Aggregation class JSON</span>
              <textarea
                key={`${selectedNode.id}-split-aggregation`}
                defaultValue={JSON.stringify(
                  config.aggregationClazz && typeof config.aggregationClazz === "object" && !Array.isArray(config.aggregationClazz)
                    ? config.aggregationClazz
                    : {},
                  null,
                  2,
                )}
                placeholder='{"clazz":"com.example.AggregationStrategy","parameters":{}}'
                style={{ ...inputStyle, minHeight: 110, resize: "vertical", fontFamily: "monospace" }}
                onBlur={(event) => {
                  try {
                    updateNodeData(selectedNode.id, {
                      config: { aggregationClazz: parseParameters(event.target.value) },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Aggregation class must be valid JSON.");
                  }
                }}
              />
            </label>
            <label>
              <span style={labelStyle}>Nested steps JSON</span>
              <textarea
                key={`${selectedNode.id}-split-steps`}
                defaultValue={JSON.stringify(Array.isArray(config.steps) ? config.steps : [], null, 2)}
                placeholder='[{"type":"log","message":"Inside split"}]'
                style={{ ...inputStyle, minHeight: 130, resize: "vertical", fontFamily: "monospace" }}
                onBlur={(event) => {
                  try {
                    const parsed = JSON.parse(event.target.value || "[]");
                    if (!Array.isArray(parsed)) {
                      throw new Error("Nested steps must be a JSON array.");
                    }
                    updateNodeData(selectedNode.id, {
                      config: { steps: parsed },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Nested steps must be valid JSON.");
                  }
                }}
              />
              <p style={helperTextStyle}>Saved as backend `steps` and applied inside the split block.</p>
            </label>
          </div>
        )}

        {type === "dynamicroute" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Router class</span>
              <input
                value={String(config.clazz ?? "")}
                placeholder="com.example.DynamicRouter"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { clazz: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `clazz`; backend constructs it with the step and route builder.</p>
            </label>
            <label>
              <span style={labelStyle}>Routes JSON</span>
              <textarea
                key={`${selectedNode.id}-dynamicroute-routes`}
                defaultValue={JSON.stringify(Array.isArray(config.routes) ? config.routes : [], null, 2)}
                placeholder={`[{"condition":"\${header.type} == 'a'","endpoint":"direct:a"}]`}
                style={{ ...codeTextAreaStyle, minHeight: 160 }}
                onBlur={(event) => {
                  try {
                    updateNodeData(selectedNode.id, {
                      config: { routes: parseJsonArray(event.target.value) },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Routes must be a JSON array.");
                  }
                }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={config.isMap !== false}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { isMap: event.target.checked },
                  })
                }
              />
              <span style={{ fontWeight: 700 }}>Use mapped routing</span>
            </label>
          </div>
        )}

        {type === "validate" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Validation status code</span>
              <input
                type="number"
                value={String(config.validationStatusCode ?? 400)}
                min={100}
                max={599}
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: {
                      validationStatusCode: Number.isFinite(Number(event.target.value))
                        ? Number(event.target.value)
                        : 400,
                    },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `validationStatusCode` and used when validation fails.</p>
            </label>
            <label>
              <span style={labelStyle}>Rules</span>
              <textarea
                key={`${selectedNode.id}-validation-rules`}
                defaultValue={JSON.stringify(
                  Array.isArray(config.rules)
                    ? config.rules
                    : [
                        {
                          expression: "body != null",
                          errorMessage: "Request body is required",
                        },
                      ],
                  null,
                  2,
                )}
                placeholder='[{"expression":"body != null","errorMessage":"Request body is required"}]'
                style={{ ...inputStyle, minHeight: 150, resize: "vertical", fontFamily: "monospace" }}
                onBlur={(event) => {
                  try {
                    updateNodeData(selectedNode.id, {
                      config: { rules: parseValidationRules(event.target.value) },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Validation rules must be valid JSON.");
                  }
                }}
              />
              <p style={helperTextStyle}>
                Saved as `rules`. Each rule needs an MVEL `expression`; `errorMessage` is optional.
              </p>
            </label>
          </div>
        )}

        {type === "process" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Processor mode</span>
              <div style={selectWrapStyle}>
                <select
                  value={selectedProcessMode}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config:
                        event.target.value === "clazz"
                          ? { clazz: String(config.clazz ?? ""), ref: "" }
                          : { ref: String(config.ref ?? "processorRef"), clazz: "" },
                    })
                  }
                >
                  {PROCESS_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={optionStyle}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={selectIconStyle}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </label>

            {selectedProcessMode === "ref" ? (
              <label>
                <span style={labelStyle}>Processor reference</span>
                <input
                  value={String(config.ref ?? "")}
                  placeholder="llmContextProcessor"
                  style={inputStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { ref: event.target.value },
                    })
                  }
                />
                <p style={helperTextStyle}>Saved as `ref` and executed through `route.bean(ref)`.</p>
              </label>
            ) : (
              <label>
                <span style={labelStyle}>Processor class</span>
                <input
                  value={String(config.clazz ?? "")}
                  placeholder="com.example.MyProcessor"
                  style={inputStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { clazz: event.target.value },
                    })
                  }
                />
                <p style={helperTextStyle}>Saved as `clazz` and instantiated by the backend.</p>
              </label>
            )}

            <label>
              <span style={labelStyle}>Parameters JSON</span>
              <textarea
                key={`${selectedNode.id}-process-parameters`}
                defaultValue={JSON.stringify(
                  config.parameters && typeof config.parameters === "object" && !Array.isArray(config.parameters)
                    ? config.parameters
                    : {},
                  null,
                  2,
                )}
                placeholder='{"tenant":"default"}'
                style={{ ...inputStyle, minHeight: 110, resize: "vertical", fontFamily: "monospace" }}
                onBlur={(event) => {
                  try {
                    updateNodeData(selectedNode.id, {
                      config: { parameters: parseParameters(event.target.value) },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Parameters must be valid JSON.");
                  }
                }}
              />
              <p style={helperTextStyle}>
                For `ref`, these become exchange properties. For `clazz`, they are constructor/config parameters.
              </p>
            </label>
          </div>
        )}

        {type === "bean" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Bean mode</span>
              <div style={selectWrapStyle}>
                <select
                  value={selectedBeanMode}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config:
                        event.target.value === "clazz"
                          ? { clazz: String(config.clazz ?? ""), ref: "" }
                          : { ref: String(config.ref ?? "beanRef"), clazz: "" },
                    })
                  }
                >
                  {BEAN_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={optionStyle}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={selectIconStyle}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </label>

            {selectedBeanMode === "ref" ? (
              <label>
                <span style={labelStyle}>Bean reference</span>
                <input
                  value={String(config.ref ?? "")}
                  placeholder="myBean"
                  style={inputStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { ref: event.target.value },
                    })
                  }
                />
                <p style={helperTextStyle}>Saved as `ref` and resolved from the Camel registry.</p>
              </label>
            ) : (
              <label>
                <span style={labelStyle}>Bean class</span>
                <input
                  value={String(config.clazz ?? "")}
                  placeholder="com.example.MyBean"
                  style={inputStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { clazz: event.target.value },
                    })
                  }
                />
                <p style={helperTextStyle}>Saved as `clazz`; the backend creates the bean with `BeanCreator`.</p>
              </label>
            )}

            <label>
              <span style={labelStyle}>Method</span>
              <input
                value={String(config.method ?? "")}
                placeholder="handle"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { method: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `method` and passed to `route.bean(ref, method)`.</p>
            </label>

            <label>
              <span style={labelStyle}>Constructor args JSON</span>
              <textarea
                key={`${selectedNode.id}-bean-constructor-args`}
                defaultValue={JSON.stringify(Array.isArray(config.constructorArgs) ? config.constructorArgs : [], null, 2)}
                placeholder='["value", 10]'
                style={{ ...inputStyle, minHeight: 110, resize: "vertical", fontFamily: "monospace" }}
                onBlur={(event) => {
                  try {
                    updateNodeData(selectedNode.id, {
                      config: { constructorArgs: parseJsonArray(event.target.value) },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Constructor args must be a JSON array.");
                  }
                }}
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={config.enableSecurityContext === true}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { enableSecurityContext: event.target.checked },
                  })
                }
              />
              <span style={{ fontWeight: 700 }}>Enable security context</span>
            </label>
          </div>
        )}

        {(type === "to" || type === "toD") && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Endpoint</span>
              <input
                value={String(config.endpoint ?? "")}
                placeholder={type === "toD" ? "direct:${header.nextEndpoint}" : "direct:next"}
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { endpoint: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>
                Saved as `endpoint` and converted with backend component URI parameters.
              </p>
            </label>
            <label>
              <span style={labelStyle}>Parameters JSON</span>
              <textarea
                key={`${selectedNode.id}-${type}-parameters`}
                defaultValue={JSON.stringify(
                  config.parameters && typeof config.parameters === "object" && !Array.isArray(config.parameters)
                    ? config.parameters
                    : {},
                  null,
                  2,
                )}
                placeholder='{"bridgeEndpoint":true}'
                style={{ ...inputStyle, minHeight: 110, resize: "vertical", fontFamily: "monospace" }}
                onBlur={(event) => {
                  try {
                    updateNodeData(selectedNode.id, {
                      config: { parameters: parseParameters(event.target.value) },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Parameters must be valid JSON.");
                  }
                }}
              />
              <p style={helperTextStyle}>
                Saved as `parameters` and appended to the endpoint URI before Camel {type === "toD" ? "`toD`" : "`to`"} runs.
              </p>
            </label>
          </div>
        )}

        {type === "smartRouter" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Protocol</span>
              <div style={selectWrapStyle}>
                <select
                  value={selectedSmartRouterProtocol}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { protocol: event.target.value },
                    })
                  }
                >
                  {SMART_ROUTER_PROTOCOL_OPTIONS.map((option) => (
                    <option key={option} value={option} style={optionStyle}>
                      {option}
                    </option>
                  ))}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={selectIconStyle} aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <p style={helperTextStyle}>Exports inside `parameters.protocol` for the backend `smart-router` endpoint.</p>
            </label>
            <label>
              <span style={labelStyle}>Target URL</span>
              <input
                value={String(config.url ?? "")}
                placeholder={selectedSmartRouterProtocol === "grpc" ? "localhost:9090/MyService" : "https://example.com/api"}
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { url: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>For HTTP/SOAP this is the target URL; for gRPC the backend builds `grpc://url?method=...`.</p>
            </label>
            <label>
              <span style={labelStyle}>Method</span>
              <div style={selectWrapStyle}>
                <select
                  value={String(config.method ?? "post")}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { method: event.target.value },
                    })
                  }
                >
                  {SMART_ROUTER_METHOD_OPTIONS.map((option) => (
                    <option key={option} value={option} style={optionStyle}>
                      {option}
                    </option>
                  ))}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={selectIconStyle} aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </label>
            <label>
              <span style={labelStyle}>Content type</span>
              <input
                value={String(config.contentType ?? "application/json")}
                placeholder="application/json"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { contentType: event.target.value },
                  })
                }
              />
            </label>
            <label>
              <span style={labelStyle}>Header params</span>
              <input
                value={String(config.headerParams ?? "")}
                placeholder="X-App:MyFramework,X-Tenant:${header.tenant}"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { headerParams: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Comma-separated `Header:value` mappings passed as `parameters.headerParams`.</p>
            </label>
            <label>
              <span style={labelStyle}>Query params</span>
              <input
                value={String(config.queryParams ?? "")}
                placeholder="query:${header.query},limit:10"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { queryParams: event.target.value },
                  })
                }
              />
            </label>
            {selectedSmartRouterProtocol === "soap" ? (
              <label>
                <span style={labelStyle}>SOAP action</span>
                <input
                  value={String(config.soapAction ?? "")}
                  placeholder="urn:SomeAction"
                  style={inputStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { soapAction: event.target.value },
                    })
                  }
                />
              </label>
            ) : null}
            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={config.enableTransformation !== false}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: {
                      enableTransformation: event.target.checked,
                      payloadTransformer: event.target.checked
                        ? String(config.payloadTransformer ?? "#joltPayloadTransformer") || "#joltPayloadTransformer"
                        : "",
                    },
                  })
                }
              />
              <span style={{ fontWeight: 700 }}>Transform request payload</span>
            </label>
            {config.enableTransformation !== false ? (
              <>
                <label>
                  <span style={labelStyle}>Transformation strategy</span>
                  <div style={selectWrapStyle}>
                    <select
                      value={String(config.transformerConfig ?? "simple-transform")}
                      style={selectStyle}
                      onChange={(event) =>
                        updateNodeData(selectedNode.id, {
                          config: {
                            transformerConfig: event.target.value,
                            payloadTransformer: "#joltPayloadTransformer",
                          },
                        })
                      }
                    >
                      {SMART_ROUTER_TRANSFORM_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} style={optionStyle}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={selectIconStyle} aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                  <p style={helperTextStyle}>Exports the config id as `transformerConfig`; the backend receives `#joltPayloadTransformer`.</p>
                </label>
                <label>
                  <span style={labelStyle}>Payload transformer bean</span>
                  <input
                    value={String(config.payloadTransformer ?? "#joltPayloadTransformer")}
                    placeholder="#joltPayloadTransformer"
                    style={inputStyle}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, {
                        config: { payloadTransformer: event.target.value },
                      })
                    }
                  />
                </label>
              </>
            ) : null}
          </div>
        )}

        {type === "agent" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Tool tag</span>
              <input
                value={String(config.tag ?? "")}
                placeholder="agent-direct"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { tag: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Direct routes must expose a matching `toolConfig.tag` to be available as tools.</p>
            </label>
            <label>
              <span style={labelStyle}>LLM ID</span>
              <div style={selectWrapStyle}>
                <select
                  value={llmId}
                  style={selectStyle}
                  onFocus={() => {
                    if (!llmProviderOptions.length && !isAgentOptionsLoading) {
                      void loadAgentOptions();
                    }
                  }}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { llmId: event.target.value },
                    })
                  }
                >
                  <option value="" style={optionStyle}>
                    {isAgentOptionsLoading ? "Loading LLM providers..." : "Select LLM provider"}
                  </option>
                  {llmProviderChoices.map((providerId) => (
                    <option key={providerId} value={providerId} style={optionStyle}>
                      {providerId}
                    </option>
                  ))}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={selectIconStyle} aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              {agentOptionsError ? <p style={{ ...helperTextStyle, color: "#b91c1c" }}>{agentOptionsError}</p> : null}
            </label>
            <label>
              <span style={labelStyle}>Chat settings ID</span>
              <div style={selectWrapStyle}>
                <select
                  value={chatSettingsId}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { chatSettingsId: event.target.value },
                    })
                  }
                >
                  <option value="" style={optionStyle}>
                    Select chat settings
                  </option>
                  {chatSettingsChoices.map((settingsId) => (
                    <option key={settingsId} value={settingsId} style={optionStyle}>
                      {settingsId}
                    </option>
                  ))}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={selectIconStyle} aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </label>
            <label>
              <span style={labelStyle}>RAG ID</span>
              <div style={selectWrapStyle}>
                <select
                  value={ragId}
                  style={selectStyle}
                  onFocus={() => {
                    if (!ragConfigOptions.length && !isAgentOptionsLoading) {
                      void loadAgentOptions();
                    }
                  }}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { ragId: event.target.value },
                    })
                  }
                >
                  <option value="" style={optionStyle}>
                    {isAgentOptionsLoading ? "Loading RAG configs..." : "Select RAG config"}
                  </option>
                  {ragConfigChoices.map((configId) => (
                    <option key={configId} value={configId} style={optionStyle}>
                      {configId}
                    </option>
                  ))}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={selectIconStyle} aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </label>
            <label>
              <span style={labelStyle}>Prompt template</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ ...selectWrapStyle, flex: 1, minWidth: 0 }}>
                  <select
                    value={promptTemplatePath}
                    style={selectStyle}
                    onFocus={() => {
                      if (!promptTemplateOptions.length && !isPromptTemplateOptionsLoading) {
                        void loadPromptTemplateOptions();
                      }
                    }}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, {
                        config: { promptTemplate: event.target.value },
                      })
                    }
                  >
                    <option value="" style={optionStyle}>
                      {isPromptTemplateOptionsLoading ? "Loading markdown files..." : "Select markdown file"}
                    </option>
                    {promptTemplateChoices.map((templatePath) => (
                      <option key={templatePath} value={templatePath} style={optionStyle}>
                        {templatePath}
                      </option>
                    ))}
                  </select>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={selectIconStyle} aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                <button
                  type="button"
                  title="View prompt template"
                  aria-label="View prompt template"
                  style={iconButtonStyle}
                  onClick={() => void openPromptTemplateEditor()}
                >
                  <EyeIcon style={{ width: 18, height: 18 }} />
                </button>
                <button
                  type="button"
                  title="Create prompt template"
                  aria-label="Create prompt template"
                  style={iconButtonStyle}
                  onClick={createPromptTemplateEditor}
                >
                  <PlusIcon style={{ width: 18, height: 18 }} />
                </button>
              </div>
              <p style={helperTextStyle}>
                {promptTemplateOptionsError
                  ? promptTemplateOptionsError
                  : promptTemplateOptions.length
                    ? "Exports to `parameters.promptTemplate` for the backend `agent:chat` endpoint."
                    : "No markdown templates found yet."}
              </p>
            </label>
          </div>
        )}

        {type === "upload" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Endpoint</span>
              <input
                value={String(config.endpoint ?? "")}
                placeholder="file:uploads"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { endpoint: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `endpoint` and converted with backend component URI parameters.</p>
            </label>
            <label>
              <span style={labelStyle}>Parameters JSON</span>
              <textarea
                key={`${selectedNode.id}-upload-parameters`}
                defaultValue={JSON.stringify(
                  config.parameters && typeof config.parameters === "object" && !Array.isArray(config.parameters)
                    ? config.parameters
                    : {},
                  null,
                  2,
                )}
                placeholder='{"fileName":"${header.fileName}"}'
                style={{ ...inputStyle, minHeight: 110, resize: "vertical", fontFamily: "monospace" }}
                onBlur={(event) => {
                  try {
                    updateNodeData(selectedNode.id, {
                      config: { parameters: parseParameters(event.target.value) },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Parameters must be valid JSON.");
                  }
                }}
              />
              <p style={helperTextStyle}>Saved as `parameters` and appended to the upload endpoint URI.</p>
            </label>
          </div>
        )}

        {type === "download" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Endpoint</span>
              <input
                value={String(config.endpoint ?? "")}
                placeholder="file:downloads"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { endpoint: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `endpoint` and used by backend poll enrich.</p>
            </label>
            <label>
              <span style={labelStyle}>Timeout ms</span>
              <input
                type="number"
                value={String(config.timeout ?? 5000)}
                min={0}
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: {
                      timeout: Number.isFinite(Number(event.target.value)) ? Number(event.target.value) : 0,
                    },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `timeout` for the backend `pollEnrich` call.</p>
            </label>
            <label>
              <span style={labelStyle}>Content type</span>
              <input
                value={String(config.contentType ?? "")}
                placeholder="application/octet-stream"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { contentType: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Optional `contentType` response header.</p>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={Boolean(config.isInline)}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { isInline: event.target.checked },
                  })
                }
              />
              <span style={{ fontWeight: 700 }}>Render inline</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={Boolean(config.converToByte)}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { converToByte: event.target.checked },
                  })
                }
              />
              <span style={{ fontWeight: 700 }}>Convert body to bytes</span>
            </label>
            <label>
              <span style={labelStyle}>Parameters JSON</span>
              <textarea
                key={`${selectedNode.id}-download-parameters`}
                defaultValue={JSON.stringify(
                  config.parameters && typeof config.parameters === "object" && !Array.isArray(config.parameters)
                    ? config.parameters
                    : {},
                  null,
                  2,
                )}
                placeholder='{"fileName":"report.pdf"}'
                style={{ ...inputStyle, minHeight: 110, resize: "vertical", fontFamily: "monospace" }}
                onBlur={(event) => {
                  try {
                    updateNodeData(selectedNode.id, {
                      config: { parameters: parseParameters(event.target.value) },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Parameters must be valid JSON.");
                  }
                }}
              />
              <p style={helperTextStyle}>Saved as `parameters` and appended to the download endpoint URI.</p>
            </label>
          </div>
        )}

        {type === "enrich" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Endpoint</span>
              <input
                value={String(config.endpoint ?? "")}
                placeholder="direct:lookup"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { endpoint: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `endpoint` and passed to Camel `enrich`.</p>
            </label>
            <label>
              <span style={labelStyle}>Endpoint type</span>
              <div style={selectWrapStyle}>
                <select
                  value={String(config.endpointType ?? "NONE")}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { endpointType: event.target.value },
                    })
                  }
                >
                  {ENRICH_ENDPOINT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option} style={optionStyle}>
                      {option}
                    </option>
                  ))}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={selectIconStyle} aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </label>
            <label>
              <span style={labelStyle}>Enrich strategy class</span>
              <input
                value={String(config.enrichStrategyClazz ?? "")}
                placeholder={DEFAULT_ENRICH_STRATEGY_CLASS}
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { enrichStrategyClazz: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Must expose a constructor with `(Map responseMapper, Map requestMapper)`.</p>
            </label>
            <label>
              <span style={labelStyle}>Request mapper JSON</span>
              <textarea
                key={`${selectedNode.id}-enrich-request-mapper`}
                defaultValue={JSON.stringify(
                  config.requestMapper && typeof config.requestMapper === "object" && !Array.isArray(config.requestMapper)
                    ? config.requestMapper
                    : {},
                  null,
                  2,
                )}
                placeholder='{"id":"${header.id}"}'
                style={{ ...codeTextAreaStyle, minHeight: 130 }}
                onBlur={(event) => {
                  try {
                    updateNodeData(selectedNode.id, {
                      config: { requestMapper: parseParameters(event.target.value) },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Request mapper must be valid JSON.");
                  }
                }}
              />
            </label>
            <label>
              <span style={labelStyle}>Response mapper JSON</span>
              <textarea
                key={`${selectedNode.id}-enrich-response-mapper`}
                defaultValue={JSON.stringify(
                  config.responseMapper && typeof config.responseMapper === "object" && !Array.isArray(config.responseMapper)
                    ? config.responseMapper
                    : {},
                  null,
                  2,
                )}
                placeholder='{"profile":"${body}"}'
                style={{ ...codeTextAreaStyle, minHeight: 130 }}
                onBlur={(event) => {
                  try {
                    updateNodeData(selectedNode.id, {
                      config: { responseMapper: parseParameters(event.target.value) },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Response mapper must be valid JSON.");
                  }
                }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={config.split === true}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: {
                      split: event.target.checked,
                      ...(event.target.checked &&
                      !(typeof config.aggregationStrategyClazz === "string" && config.aggregationStrategyClazz.trim())
                        ? { aggregationStrategyClazz: DEFAULT_SPLIT_AGGREGATION_STRATEGY_CLASS }
                        : {}),
                    },
                  })
                }
              />
              <span style={{ fontWeight: 700 }}>Split body before enrichment</span>
            </label>
            {config.split === true ? (
              <>
                <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={config.parallelProcessing === true}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, {
                        config: { parallelProcessing: event.target.checked },
                      })
                    }
                  />
                  <span style={{ fontWeight: 700 }}>Parallel processing</span>
                </label>
                <label>
                  <span style={labelStyle}>Split aggregation strategy class</span>
                  <input
                    value={String(config.aggregationStrategyClazz ?? "")}
                    placeholder={DEFAULT_SPLIT_AGGREGATION_STRATEGY_CLASS}
                    style={inputStyle}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, {
                        config: { aggregationStrategyClazz: event.target.value },
                      })
                    }
                  />
                  <p style={helperTextStyle}>Must expose a no-argument constructor for Camel split aggregation.</p>
                </label>
              </>
            ) : null}
          </div>
        )}

        {type === "dbCrud" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Operation</span>
              <div style={selectWrapStyle}>
                <select
                  value={selectedDbCrudOperation}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { operation: event.target.value },
                    })
                  }
                >
                  {DB_CRUD_OPERATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={optionStyle}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={selectIconStyle} aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </label>
            <label>
              <span style={labelStyle}>Data source</span>
              <input
                value={String(config.dataSource ?? "#dataSource")}
                placeholder="#dataSource"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { dataSource: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Used in the generated Camel SQL endpoint as `dataSource`.</p>
            </label>
            {selectedDbCrudOperation !== "customSql" ? (
              <>
                <label>
                  <span style={labelStyle}>Table</span>
                  <input
                    value={String(config.table ?? "")}
                    placeholder="users"
                    style={inputStyle}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, {
                        config: { table: event.target.value },
                      })
                    }
                  />
                  <p style={helperTextStyle}>Use a table name such as `users` or a schema-qualified table such as `TEST.users`.</p>
                </label>
                {["readOne", "readMany"].includes(selectedDbCrudOperation) ? (
                  <label>
                    <span style={labelStyle}>Selected columns JSON</span>
                    <textarea
                      key={`${selectedNode.id}-dbcrud-columns`}
                      defaultValue={JSON.stringify(Array.isArray(config.columns) ? config.columns : [], null, 2)}
                      placeholder='["id", "name", "email"]'
                      style={{ ...codeTextAreaStyle, minHeight: 150 }}
                      onBlur={(event) => {
                        try {
                          updateNodeData(selectedNode.id, {
                            config: { columns: parseJsonArray(event.target.value) },
                          });
                        } catch (issue) {
                          window.alert(issue instanceof Error ? issue.message : "Columns must be a JSON array.");
                        }
                      }}
                    />
                  </label>
                ) : null}
                {["create", "batchInsert", "update"].includes(selectedDbCrudOperation) ? (
                  <label>
                    <span style={labelStyle}>Column/value mappings JSON</span>
                    <textarea
                      key={`${selectedNode.id}-dbcrud-values`}
                      defaultValue={JSON.stringify(dbCrudValuesForEditor, null, 2)}
                      placeholder={`[{"column":"name","valueExpression":"\${body['name']}","parameterName":"name"}]`}
                      style={{ ...codeTextAreaStyle, minHeight: 220 }}
                      onBlur={(event) => {
                        try {
                          updateNodeData(selectedNode.id, {
                            config: { values: parseJsonArray(event.target.value) },
                          });
                        } catch (issue) {
                          window.alert(issue instanceof Error ? issue.message : "Mappings must be a JSON array.");
                        }
                      }}
                    />
                  </label>
                ) : null}
                {selectedDbCrudOperation === "readMany" ? (
                  <label>
                    <span style={labelStyle}>Limit</span>
                    <input
                      type="number"
                      value={String(config.limit ?? "")}
                      min={1}
                      placeholder="100"
                      style={inputStyle}
                      onChange={(event) =>
                        updateNodeData(selectedNode.id, {
                          config: {
                            limit: event.target.value ? Number(event.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </label>
                ) : null}
                {!["create", "batchInsert"].includes(selectedDbCrudOperation) ? (
                  <label>
                    <span style={labelStyle}>Where conditions JSON</span>
                    <textarea
                      key={`${selectedNode.id}-dbcrud-where`}
                      defaultValue={JSON.stringify(Array.isArray(config.where) ? config.where : [], null, 2)}
                      placeholder='[{"column":"id","operator":"=","valueExpression":"${header.id}","parameterName":"id"}]'
                      style={{ ...codeTextAreaStyle, minHeight: 220 }}
                      onBlur={(event) => {
                        try {
                          updateNodeData(selectedNode.id, {
                            config: { where: parseJsonArray(event.target.value) },
                          });
                        } catch (issue) {
                          window.alert(issue instanceof Error ? issue.message : "Where conditions must be a JSON array.");
                        }
                      }}
                    />
                  </label>
                ) : null}
              </>
            ) : (
              <>
                <label>
                  <span style={labelStyle}>SQL</span>
                  <textarea
                    value={String(config.customSql ?? "")}
                    placeholder="select * from users where id = :#id"
                    style={{ ...codeTextAreaStyle, minHeight: 180 }}
                    onChange={(event) =>
                      updateNodeData(selectedNode.id, {
                        config: { customSql: event.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  <span style={labelStyle}>Parameter mappings JSON</span>
                  <textarea
                    key={`${selectedNode.id}-dbcrud-parameters`}
                    defaultValue={JSON.stringify(Array.isArray(config.parameters) ? config.parameters : [], null, 2)}
                    placeholder='[{"name":"id","expression":"${header.id}"}]'
                    style={{ ...codeTextAreaStyle, minHeight: 220 }}
                    onBlur={(event) => {
                      try {
                        updateNodeData(selectedNode.id, {
                          config: { parameters: parseJsonArray(event.target.value) },
                        });
                      } catch (issue) {
                        window.alert(issue instanceof Error ? issue.message : "Parameters must be a JSON array.");
                      }
                    }}
                  />
                </label>
              </>
            )}
            <label>
              <span style={labelStyle}>Output format</span>
              <div style={selectWrapStyle}>
                <select
                  value={String(config.output ?? "json")}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { output: event.target.value },
                    })
                  }
                >
                  {DB_CRUD_OUTPUT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={optionStyle}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={selectIconStyle} aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={Boolean(config.logSql)}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { logSql: event.target.checked },
                  })
                }
              />
              <span style={{ fontWeight: 700 }}>Log operation result</span>
            </label>
          </div>
        )}

        {type === "log" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Message</span>
              <textarea
                value={String(config.message ?? "")}
                placeholder="Processing exchange ${body}"
                style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { message: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>
                Saved as `message`. Simple expressions such as <code>{"${body}"}</code> are evaluated by the backend.
              </p>
            </label>
            <label>
              <span style={labelStyle}>Logger name</span>
              <input
                value={String(config.name ?? "")}
                placeholder="DEFAULT or AUDIT"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { name: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>
                Saved as `name`. `AUDIT` uses the audit logging path in `LogHandler`.
              </p>
            </label>
            <label>
              <span style={labelStyle}>Log level</span>
              <div style={selectWrapStyle}>
                <select
                  value={String(config.logLevel ?? "INFO")}
                  style={selectStyle}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      config: { logLevel: event.target.value },
                    })
                  }
                >
                  {LOG_LEVEL_OPTIONS.map((level) => (
                    <option key={level} value={level} style={optionStyle}>
                      {level}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={selectIconStyle}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <p style={helperTextStyle}>Saved as `logLevel`. The backend defaults to `INFO` when omitted.</p>
            </label>
          </div>
        )}

        {type === "aggregation" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Aggregation strategy class</span>
              <input
                value={String(aggregationClazz.clazz ?? "")}
                placeholder="com.bytestrone.appweaver.integration.core.aggregator.imp.BatchAggregationStrategy"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: {
                      aggregationClazz: {
                        ...aggregationClazz,
                        clazz: event.target.value,
                      },
                    },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `aggregationClazz.clazz` and instantiated by the backend.</p>
            </label>

            <label>
              <span style={labelStyle}>Strategy parameters JSON</span>
              <textarea
                key={`${selectedNode.id}-aggregation-parameters`}
                defaultValue={JSON.stringify(
                  aggregationClazz.parameters && typeof aggregationClazz.parameters === "object" && !Array.isArray(aggregationClazz.parameters)
                    ? aggregationClazz.parameters
                    : {},
                  null,
                  2,
                )}
                placeholder='{"mode":"merge"}'
                style={{ ...codeTextAreaStyle, minHeight: 130 }}
                onBlur={(event) => {
                  try {
                    updateNodeData(selectedNode.id, {
                      config: {
                        aggregationClazz: {
                          ...aggregationClazz,
                          parameters: parseParameters(event.target.value),
                        },
                      },
                    });
                  } catch (issue) {
                    window.alert(issue instanceof Error ? issue.message : "Strategy parameters must be valid JSON.");
                  }
                }}
              />
            </label>

            <label>
              <span style={labelStyle}>Correlation expression</span>
              <input
                value={String(config.correlationExpression ?? "")}
                placeholder="${header.correlationId}"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { correlationExpression: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `correlationExpression`; blank uses a constant `true` correlation.</p>
            </label>

            <label>
              <span style={labelStyle}>Completion size</span>
              <input
                type="number"
                value={String(config.completionSize ?? "")}
                min={1}
                placeholder="10"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: {
                      completionSize: event.target.value ? Number(event.target.value) : undefined,
                    },
                  })
                }
              />
            </label>

            <label>
              <span style={labelStyle}>Completion timeout ms</span>
              <input
                type="number"
                value={String(config.completionTimeOut ?? "")}
                min={1}
                placeholder="5000"
                style={inputStyle}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: {
                      completionTimeOut: event.target.value ? Number(event.target.value) : undefined,
                    },
                  })
                }
              />
              <p style={helperTextStyle}>Saved as `completionTimeOut` to match the backend step field.</p>
            </label>
          </div>
        )}

        {type === "delay" && (
          <div style={sectionStyle}>
            <label>
              <span style={labelStyle}>Delay expression</span>
              <textarea
                value={String(config.expression ?? "")}
                placeholder="1000"
                style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                onChange={(event) =>
                  updateNodeData(selectedNode.id, {
                    config: { expression: event.target.value },
                  })
                }
              />
              <p style={helperTextStyle}>
                Saved as `expression`. Values containing <code>{"${...}"}</code> or <code>#</code> are evaluated as
                Camel simple expressions; other values are constants.
              </p>
            </label>
          </div>
        )}

        {customComponent ? (
          <div style={sectionStyle}>
            {customComponent.fields.map((field) => {
              const value = getCustomFieldValue(config, field);
              const helperText = field.helperText
                ? field.helperText
                : field.target === "properties"
                  ? `Saved as properties.${field.key}.`
                  : null;

              if (field.control === "checkbox") {
                return (
                  <label
                    key={field.key}
                    style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) =>
                        updateNodeData(selectedNode.id, {
                          config: buildCustomFieldUpdate(config, field, event.target.checked),
                        })
                      }
                    />
                    <span style={{ fontWeight: 700 }}>{field.label}</span>
                  </label>
                );
              }

              if (field.control === "select") {
                return (
                  <label key={field.key}>
                    <span style={labelStyle}>{field.label}</span>
                    <div style={selectWrapStyle}>
                      <select
                        value={String(value ?? field.options?.[0]?.value ?? "")}
                        style={selectStyle}
                        onChange={(event) =>
                          updateNodeData(selectedNode.id, {
                            config: buildCustomFieldUpdate(config, field, event.target.value),
                          })
                        }
                      >
                        {(field.options ?? []).map((option) => (
                          <option key={option.value} value={option.value} style={optionStyle}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={selectIconStyle}
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                    {helperText ? <p style={helperTextStyle}>{helperText}</p> : null}
                  </label>
                );
              }

              return (
                <label key={field.key}>
                  <span style={labelStyle}>{field.label}</span>
                  {field.control === "textarea" ? (
                    <textarea
                      value={String(value ?? "")}
                      placeholder={field.placeholder}
                      style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
                      onChange={(event) =>
                        updateNodeData(selectedNode.id, {
                          config: buildCustomFieldUpdate(config, field, event.target.value),
                        })
                      }
                    />
                  ) : (
                    <input
                      value={String(value ?? "")}
                      placeholder={field.placeholder}
                      style={inputStyle}
                      onChange={(event) =>
                        updateNodeData(selectedNode.id, {
                          config: buildCustomFieldUpdate(config, field, event.target.value),
                        })
                      }
                    />
                  )}
                  {helperText ? <p style={helperTextStyle}>{helperText}</p> : null}
                </label>
              );
            })}
          </div>
        ) : null}

        <button type="button" style={deleteBtnStyle} onClick={() => deleteNode(selectedNode.id)}>
          Delete component
        </button>
        </div>
      </div>
      {isPromptEditorOpen ? (
        <div style={promptTemplatePanelStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
            <h2
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
                fontSize: 14,
              }}
            >
              {promptEditor.mode === "create" ? (
                <PlusIcon style={{ width: 16, height: 16, color: "var(--workflow-accent)" }} />
              ) : (
                <EyeIcon style={{ width: 16, height: 16, color: "var(--workflow-accent)" }} />
              )}
              Prompt Template
            </h2>
            <button
              type="button"
              title="Close prompt template"
              aria-label="Close prompt template"
              style={iconButtonStyle}
              onClick={() => setPromptEditor(closedPromptTemplateEditor)}
            >
              <XIcon style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <label>
            <span style={labelStyle}>Markdown file</span>
            <input
              value={promptEditor.path}
              placeholder="/agents/commonAgent.md"
              style={inputStyle}
              onChange={(event) =>
                setPromptEditor((current) => ({
                  ...current,
                  path: event.target.value,
                  message: null,
                  error: null,
                }))
              }
              disabled={promptEditor.isLoading || promptEditor.isSaving}
            />
          </label>

          <label style={{ display: "flex", flex: 1, minHeight: 0, flexDirection: "column", marginTop: 12 }}>
            <span style={labelStyle}>Template content</span>
            <textarea
              value={promptEditor.isLoading ? "Loading prompt template..." : promptEditor.draft}
              placeholder="# Agent prompt"
              style={{
                ...codeTextAreaStyle,
                flex: 1,
                minHeight: 260,
                resize: "none",
              }}
              onChange={(event) =>
                setPromptEditor((current) => ({
                  ...current,
                  draft: event.target.value,
                  message: null,
                  error: null,
                }))
              }
              disabled={promptEditor.isLoading || promptEditor.isSaving}
            />
          </label>

          {promptEditor.error ? (
            <p style={{ ...helperTextStyle, color: "#b91c1c", marginTop: 8 }}>{promptEditor.error}</p>
          ) : promptEditor.message ? (
            <p style={{ ...helperTextStyle, color: "#166534", marginTop: 8 }}>{promptEditor.message}</p>
          ) : null}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            <button
              type="button"
              style={secondaryBtnStyle}
              onClick={() => setPromptEditor(closedPromptTemplateEditor)}
              disabled={promptEditor.isSaving}
            >
              Close
            </button>
            <button
              type="button"
              style={{
                ...primaryBtnStyle,
                opacity: promptEditor.isLoading || promptEditor.isSaving ? 0.68 : 1,
                cursor: promptEditor.isLoading || promptEditor.isSaving ? "not-allowed" : "pointer",
              }}
              onClick={() => void savePromptTemplateEditor()}
              disabled={promptEditor.isLoading || promptEditor.isSaving}
            >
              {promptEditor.isSaving ? "Saving" : "Save"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
