"use client";

import { useMemo, useState } from "react";

import {
  appWeaverApiClient,
  type AppWeaverRestRouteConfig,
} from "@/lib/appweaverApiClient";
import {
  useFlowStore,
  type CreatedEndpointConfig,
  type EndpointProtocol,
} from "@/store/useFlowStore";

type EndpointEditorState = {
  folderPath: string;
  fileName: string;
  content: string;
};

type ApiRouteEditorState = {
  routeId: string;
  method: string;
  path: string;
  route: string;
  policyName: string;
  rateLimiter: string;
  contentType: string;
  enableCors: boolean;
  description: string;
};

const DEFAULT_CONTENT = '{\n  "routeId": "",\n  "workflow": "",\n  "description": ""\n}';
const REST_METHOD_OPTIONS = ["get", "post", "put", "delete"];
const POLICY_OPTIONS = ["policy1", "policy2", "policy3"];
const RATE_LIMITER_OPTIONS = ["rateLimiter", "strictRateLimiter", "publicRateLimiter"];
const API_INDEX_CONTENT = `[
  {
    "enabled": true,
    "name": "llm",
    "path": "routes/llm",
    "description": "REST endpoints for workflow access"
  }
]`;
const API_ROUTE_CONTENT = `{
  "routeId": "multiChatRoute",
  "method": "post",
  "path": "/llm/chat",
  "to": "direct:multiChatProcessor",
  "rateLimiter": "rateLimiter",
  "policyName": "policy2",
  "contentType": "application/json",
  "enableCors": true,
  "description": "REST endpoint for workflow access"
}`;
const SSE_INDEX_CONTENT = `[
  {
    "enabled": true,
    "name": "dataStream",
    "path": "routes",
    "description": "SSE endpoint for data streaming"
  }
]`;
const SSE_ROUTE_CONTENT = `{
  "routeId": "dataStream",
  "method": "post",
  "path": "/llm/sse",
  "to": "direct:streamingChatProcessor",
  "rateLimiter": "rateLimiter",
  "policyName": "policy2",
  "contentType": "application/json",
  "enableCors": true,
  "description": "SSE endpoint for data streaming"
}`;

const DEFAULTS: Record<EndpointProtocol, EndpointEditorState> = {
  api: { folderPath: "", fileName: "index.json", content: API_INDEX_CONTENT },
  grpc: { folderPath: "routes", fileName: "serviceRoute.json", content: DEFAULT_CONTENT },
  sse: { folderPath: "", fileName: "index.json", content: SSE_INDEX_CONTENT },
  ws: { folderPath: "routes", fileName: "socketRoute.json", content: DEFAULT_CONTENT },
};

function createEditorState(protocol: EndpointProtocol): EndpointEditorState {
  return { ...DEFAULTS[protocol] };
}

function createAdditionalRouteState(protocol: EndpointProtocol): EndpointEditorState {
  if (protocol === "api") {
    return {
      folderPath: "routes/llm",
      fileName: "multiChatRoute.json",
      content: API_ROUTE_CONTENT,
    };
  }

  if (protocol === "sse") {
    return {
      folderPath: "routes",
      fileName: "dataStream.json",
      content: SSE_ROUTE_CONTENT,
    };
  }

  return createEditorState(protocol);
}

function createEditorFromItem(item: CreatedEndpointConfig): EndpointEditorState {
  return { folderPath: item.folderPath, fileName: item.fileName, content: item.content };
}

function createApiRouteEditorState(): ApiRouteEditorState {
  return {
    routeId: "multiChatRoute",
    method: "post",
    path: "/llm/chat",
    route: "direct:multiChatProcessor",
    policyName: "policy2",
    rateLimiter: "rateLimiter",
    contentType: "application/json",
    enableCors: true,
    description: "REST endpoint for workflow access",
  };
}

function createApiRouteEditorFromItem(item: CreatedEndpointConfig): ApiRouteEditorState {
  try {
    const parsed = JSON.parse(item.content) as {
      routeId?: string;
      method?: string;
      path?: string;
      to?: string;
      policyName?: string;
      rateLimiter?: string;
      contentType?: string;
      enableCors?: boolean;
      description?: string;
    };

    return {
      routeId: parsed.routeId ?? "",
      method: parsed.method ?? "post",
      path: parsed.path ?? "",
      route: parsed.to ?? "",
      policyName: parsed.policyName ?? "policy2",
      rateLimiter: parsed.rateLimiter ?? "rateLimiter",
      contentType: parsed.contentType ?? "application/json",
      enableCors: parsed.enableCors ?? true,
      description: parsed.description ?? "",
    };
  } catch {
    return createApiRouteEditorState();
  }
}

function buildApiRouteContent(editor: ApiRouteEditorState, routeNameOverride?: string) {
  const routeId = (routeNameOverride ?? editor.routeId).trim();

  return JSON.stringify(
    {
      routeId,
      method: editor.method,
      path: editor.path.trim(),
      to: editor.route.trim(),
      rateLimiter: editor.rateLimiter,
      policyName: editor.policyName,
      contentType: editor.contentType.trim() || "application/json",
      enableCors: editor.enableCors,
      description: editor.description.trim(),
    },
    null,
    2,
  );
}

function createEndpointId(routeName: string) {
  return `endpoint-api-${encodeURIComponent(routeName)}`;
}

function normalizeBackendRestRoute(route: AppWeaverRestRouteConfig): CreatedEndpointConfig {
  const routeName = route.name || route.config?.routeId || route.config?.path || "rest-route";
  const routeConfig = route.config;

  return {
    id: createEndpointId(routeName),
    protocol: "api",
    folderPath: route.path ?? "",
    fileName: `${routeName}.json`,
    content: JSON.stringify(
      {
        routeId: routeConfig?.routeId ?? route.name,
        method: routeConfig?.method ?? "get",
        path: routeConfig?.path ?? "",
        to: routeConfig?.to ?? "",
        rateLimiter: routeConfig?.rateLimiter ?? "rateLimiter",
        policyName: routeConfig?.policyName ?? "policy2",
        contentType: routeConfig?.contentType ?? "application/json",
        enableCors: routeConfig?.enableCors ?? true,
        description: routeConfig?.description ?? route.description ?? "",
      },
      null,
      2,
    ),
  };
}

function getRestRouteNameFromItem(item: CreatedEndpointConfig) {
  return item.fileName.replace(/\.json$/i, "");
}

function buildBackendRestRoute(
  editor: ApiRouteEditorState,
  routeGroupPath: string,
  routeNameOverride?: string,
): AppWeaverRestRouteConfig {
  const routeId = (routeNameOverride ?? editor.routeId).trim();

  return {
    enabled: true,
    name: routeId,
    path: routeGroupPath.trim(),
    description: editor.description.trim(),
    config: {
      routeId,
      method: editor.method,
      path: editor.path.trim(),
      to: editor.route.trim(),
      rateLimiter: editor.rateLimiter,
      policyName: editor.policyName,
      contentType: editor.contentType.trim() || "application/json",
      enableCors: editor.enableCors,
      description: editor.description.trim(),
    },
  };
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <h2 className="app-heading-2" style={{ margin: 0, color: "#0f172a", letterSpacing: "-0.03em" }}>{title}</h2>
      <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>{subtitle}</p>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  borderRadius: 28,
  border: "1px solid rgba(226, 232, 240, 0.95)",
  background: "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96))",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
};
const workspaceGridStyle: React.CSSProperties = { flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(300px, 360px)", gap: 20, alignItems: "stretch", overflow: "hidden" };
const workspacePanelStyle: React.CSSProperties = { ...panelStyle, padding: 24, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" };
const fieldStyle: React.CSSProperties = { width: "100%", borderRadius: 16, border: "1px solid #dbe4f0", background: "#ffffff", padding: "14px 16px", fontSize: 14, color: "#0f172a", fontFamily: "var(--font-body), Arial, Helvetica, sans-serif", outline: "none", boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.04)" };
const fieldLabelStyle: React.CSSProperties = { color: "#475569", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" };
const subsectionButtonStyle: React.CSSProperties = { border: "none", borderRadius: 0, background: "transparent", color: "#475569", padding: "0 4px 12px", fontSize: 16, lineHeight: "24px", fontWeight: 500, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid transparent" };
const primaryButtonStyle: React.CSSProperties = { border: "none", borderRadius: 8, background: "#10233f", color: "#ffffff", padding: "12px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 12px 24px rgba(16, 35, 63, 0.18)" };
const secondaryButtonStyle: React.CSSProperties = { border: "1px solid #10233f", borderRadius: 8, background: "#ffffff", color: "#10233f", padding: "12px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 8px 18px rgba(16, 35, 63, 0.06)" };
const tertiaryButtonStyle: React.CSSProperties = { border: "none", borderRadius: 8, background: "#2DB780", color: "#ffffff", padding: "12px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 12px 24px rgba(45, 183, 128, 0.18)" };
const stickyActionBarStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(203, 213, 225, 0.95)", flexShrink: 0 };
const deleteIconButtonStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 10, border: "1px solid rgba(248, 113, 113, 0.28)", background: "#fff5f5", color: "#dc2626", boxShadow: "0 8px 18px rgba(220, 38, 38, 0.08)", cursor: "pointer" };
const listItemMetaStyle: React.CSSProperties = { marginTop: 4, fontSize: 12, color: "#64748b", overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.55 };

export default function EndpointsConfigurationWorkspace() {
  const {
    endpointConfigs,
    addEndpointConfig,
    replaceEndpointConfigs,
    updateEndpointConfig,
    removeEndpointConfig,
  } = useFlowStore();
  const [selectedProtocol, setSelectedProtocol] = useState<EndpointProtocol>("api");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EndpointEditorState>(() => createEditorState("api"));
  const [apiEditor, setApiEditor] = useState<ApiRouteEditorState>(() => createApiRouteEditorState());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [restRoutePath, setRestRoutePath] = useState("routes/llm");
  const [routeLookupName, setRouteLookupName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedItem = endpointConfigs.find((item) => item.id === selectedId) ?? null;
  const protocolItems = endpointConfigs.filter((item) => item.protocol === selectedProtocol);
  const routeLookupSuggestions = useMemo(() => {
    const query = routeLookupName.trim().toLowerCase();
    const routeNames = endpointConfigs
      .filter((item) => item.protocol === "api")
      .map(getRestRouteNameFromItem);
    const uniqueRouteNames = Array.from(new Set(routeNames)).sort((a, b) => a.localeCompare(b));

    if (!query) {
      return uniqueRouteNames;
    }

    return uniqueRouteNames.filter((name) => name.toLowerCase().includes(query));
  }, [endpointConfigs, routeLookupName]);
  const groupedItems = useMemo(() => {
    const groups = new Map<EndpointProtocol, CreatedEndpointConfig[]>();
    (["api", "grpc", "sse", "ws"] as const).forEach((protocol) =>
      groups.set(protocol, endpointConfigs.filter((item) => item.protocol === protocol)),
    );
    return groups;
  }, [endpointConfigs]);

  const handleProtocolChange = (protocol: EndpointProtocol) => {
    setSelectedProtocol(protocol);
    setSelectedId(null);
    setEditor(createEditorState(protocol));
    setApiEditor(createApiRouteEditorState());
    setError(null);
    setMessage(null);
  };

  const buildPayload = (routeNameOverride?: string) => {
    if (selectedProtocol === "api") {
      const routeName = (routeNameOverride ?? apiEditor.routeId).trim();
      const payload = {
        protocol: selectedProtocol,
        folderPath: restRoutePath.trim(),
        fileName: `${routeName || "route"}.json`,
        content: buildApiRouteContent(apiEditor, routeName),
      };

      if (!payload.fileName) {
        setError("Endpoint file name is required.");
        return null;
      }

      if (!routeName) {
        setError("Route id is required.");
        return null;
      }

      if (!apiEditor.path.trim()) {
        setError("API URL is required.");
        return null;
      }

      if (!apiEditor.route.trim()) {
        setError("Route target is required.");
        return null;
      }

      if (!restRoutePath.trim()) {
        setError("Route group path is required.");
        return null;
      }

      return payload;
    }

    const payload = {
      protocol: selectedProtocol,
      folderPath: editor.folderPath.trim(),
      fileName: editor.fileName.trim(),
      content: editor.content.trim(),
    };

    if (!payload.fileName) {
      setError("Endpoint file name is required.");
      return null;
    }

    if (!payload.content) {
      setError("Endpoint JSON content is required.");
      return null;
    }

    try {
      JSON.parse(payload.content);
    } catch {
      setError("Endpoint content must be valid JSON.");
      return null;
    }

    return payload;
  };

  const handleCreate = async () => {
    const payload = buildPayload();
    if (!payload) return;

    if (selectedProtocol === "api") {
      try {
        await appWeaverApiClient.system.restRoutes.create(
          buildBackendRestRoute(apiEditor, restRoutePath),
        );
      } catch (issue) {
        setError(issue instanceof Error ? issue.message : "Could not create the REST route.");
        setMessage(null);
        return;
      }
    }

    const result = addEndpointConfig(payload);
    if (!result.ok) return void setError(result.reason);
    setError(null);
    setMessage(selectedProtocol === "api" ? `Created REST route "${apiEditor.routeId.trim()}".` : null);
    setSelectedId(null);
    setEditor(createEditorState(selectedProtocol));
    setApiEditor(createApiRouteEditorState());
  };

  const handleUpdate = async () => {
    if (!selectedId) return void setError("Select an endpoint config from the list to edit it.");
    const currentRouteName = selectedItem ? getRestRouteNameFromItem(selectedItem) : undefined;
    const payload = buildPayload(currentRouteName);
    if (!payload) return;

    if (selectedProtocol === "api" && selectedItem && currentRouteName) {
      try {
        await appWeaverApiClient.system.restRoutes.update(
          currentRouteName,
          buildBackendRestRoute(apiEditor, restRoutePath, currentRouteName),
        );
      } catch (issue) {
        setError(issue instanceof Error ? issue.message : "Could not update the REST route.");
        setMessage(null);
        return;
      }
    }

    const result = updateEndpointConfig(selectedId, payload);
    if (!result.ok) return void setError(result.reason);
    setError(null);
    setMessage(selectedProtocol === "api" ? `Updated REST route "${currentRouteName ?? apiEditor.routeId.trim()}".` : null);
  };

  const handleDelete = async (configId: string) => {
    const config = endpointConfigs.find((item) => item.id === configId);

    if (config?.protocol === "api") {
      try {
        await appWeaverApiClient.system.restRoutes.remove(getRestRouteNameFromItem(config));
      } catch (issue) {
        setError(issue instanceof Error ? issue.message : "Could not delete the REST route.");
        setMessage(null);
        return;
      }
    }

    removeEndpointConfig(configId);
    setMessage(config?.protocol === "api" ? `Deleted REST route "${config.fileName.replace(/\.json$/i, "")}".` : null);
    if (selectedId === configId) {
      setSelectedId(null);
      setEditor(createEditorState(selectedProtocol));
      setApiEditor(createApiRouteEditorState());
      setError(null);
    }
  };

  const handleSelectItem = (item: CreatedEndpointConfig) => {
    setSelectedProtocol(item.protocol);
    setSelectedId(item.id);
    setEditor(createEditorFromItem(item));
    if (item.protocol === "api") {
      setApiEditor(createApiRouteEditorFromItem(item));
      setRestRoutePath(item.folderPath || "routes/llm");
    }
    setError(null);
  };

  const loadRestRoutes = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const routeSummaries = await appWeaverApiClient.system.restRoutes.list();
      const routeList = Array.isArray(routeSummaries) ? routeSummaries : [routeSummaries];
      const backendRoutes = await Promise.all(
        routeList.map(async (route) => {
          try {
            return await appWeaverApiClient.system.restRoutes.get(route.name);
          } catch {
            return route;
          }
        }),
      );
      const normalizedRoutes = backendRoutes.map(normalizeBackendRestRoute);

      replaceEndpointConfigs([
        ...endpointConfigs.filter((item) => item.protocol !== "api"),
        ...normalizedRoutes,
      ]);
      setError(null);
      setMessage(`Loaded ${normalizedRoutes.length} REST route${normalizedRoutes.length === 1 ? "" : "s"}.`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load REST routes.");
      setMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRestRouteByName = async () => {
    const trimmedName = routeLookupName.trim();

    if (!trimmedName) {
      setError("Enter a REST route name to fetch.");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const backendRoute = await appWeaverApiClient.system.restRoutes.get(trimmedName);
      const normalizedRoute = normalizeBackendRestRoute(backendRoute);
      const nextEndpointConfigs = [
        ...endpointConfigs.filter(
          (item) => item.protocol !== "api" || getRestRouteNameFromItem(item) !== trimmedName,
        ),
        normalizedRoute,
      ];

      replaceEndpointConfigs(nextEndpointConfigs);
      setSelectedProtocol("api");
      setSelectedId(normalizedRoute.id);
      setRestRoutePath(normalizedRoute.folderPath || "routes/llm");
      setApiEditor(createApiRouteEditorFromItem(normalizedRoute));
      setEditor(createEditorFromItem(normalizedRoute));
      setError(null);
      setMessage(`Loaded REST route "${trimmedName}".`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load that REST route.");
      setMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={workspaceGridStyle}>
      <section style={workspacePanelStyle}>
        <SectionTitle title={selectedItem ? "Edit Endpoint Config" : "Create Endpoint Config"} subtitle="Manage endpoint JSON files for API, gRPC, SSE, and WS access to your workflows." />
        <div style={{ marginTop: 18, display: "grid", gap: 14, flex: 1, minHeight: 0, alignContent: "start", overflow: "auto", paddingRight: 6 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, borderBottom: "1px solid rgba(226, 232, 240, 0.95)", paddingBottom: 2 }}>
            {(["api", "grpc", "sse", "ws"] as const).map((protocol) => (
              <button key={protocol} type="button" onClick={() => handleProtocolChange(protocol)} style={{ ...subsectionButtonStyle, color: selectedProtocol === protocol ? "var(--workflow-accent)" : subsectionButtonStyle.color, borderBottom: selectedProtocol === protocol ? "2px solid var(--workflow-accent)" : subsectionButtonStyle.borderBottom }}>
                {protocol}
              </button>
            ))}
          </div>
          {selectedProtocol === "api" ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 240px)", gap: 18, alignItems: "stretch" }}>
                <div style={{ borderRadius: 26, border: "1px solid rgba(203, 213, 225, 0.95)", background: "rgba(255, 255, 255, 0.98)", padding: 22, display: "grid", gap: 18 }}>
                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={fieldLabelStyle}>Method</span>
                      <select value={apiEditor.method} onChange={(event) => setApiEditor((current) => ({ ...current, method: event.target.value }))} style={fieldStyle}>
                        {REST_METHOD_OPTIONS.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={fieldLabelStyle}>API URL</span>
                      <input value={apiEditor.path} onChange={(event) => setApiEditor((current) => ({ ...current, path: event.target.value }))} placeholder="/llm/chat" style={fieldStyle} />
                    </label>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={fieldLabelStyle}>Route</span>
                      <input value={apiEditor.route} onChange={(event) => setApiEditor((current) => ({ ...current, route: event.target.value }))} placeholder="direct:multiChatProcessor" style={fieldStyle} />
                    </label>
                  </div>
                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={fieldLabelStyle}>Route Id</span>
                      <input value={selectedItem?.protocol === "api" ? getRestRouteNameFromItem(selectedItem) : apiEditor.routeId} readOnly={selectedItem?.protocol === "api"} onChange={(event) => setApiEditor((current) => ({ ...current, routeId: event.target.value }))} placeholder="multiChatRoute" style={{ ...fieldStyle, background: selectedItem?.protocol === "api" ? "#f8fafc" : fieldStyle.background }} />
                    </label>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={fieldLabelStyle}>Policy Name</span>
                      <select value={apiEditor.policyName} onChange={(event) => setApiEditor((current) => ({ ...current, policyName: event.target.value }))} style={fieldStyle}>
                        {POLICY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={fieldLabelStyle}>Rate Limiter</span>
                      <select value={apiEditor.rateLimiter} onChange={(event) => setApiEditor((current) => ({ ...current, rateLimiter: event.target.value }))} style={fieldStyle}>
                        {RATE_LIMITER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                  </div>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={fieldLabelStyle}>Description</span>
                    <input value={apiEditor.description} onChange={(event) => setApiEditor((current) => ({ ...current, description: event.target.value }))} placeholder="REST endpoint for workflow access" style={fieldStyle} />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={fieldLabelStyle}>JSON</span>
                    <textarea value={buildApiRouteContent(apiEditor, selectedItem?.protocol === "api" ? getRestRouteNameFromItem(selectedItem) : undefined)} readOnly style={{ ...fieldStyle, minHeight: 180, resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", background: "#f8fafc" }} />
                  </label>
                </div>
                <div style={{ borderRadius: 26, border: "1px solid rgba(203, 213, 225, 0.95)", background: "rgba(248, 250, 252, 0.92)", padding: 18, display: "grid", gap: 12, alignContent: "start" }}>
                  <span style={fieldLabelStyle}>REST Notes</span>
                  <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>{`${apiEditor.routeId.trim() || "route"}.json`}</div>
                  <div style={listItemMetaStyle}>Protocol: API / REST</div>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={fieldLabelStyle}>Route Group Path</span>
                    <input value={restRoutePath} onChange={(event) => setRestRoutePath(event.target.value)} placeholder="routes/llm" style={fieldStyle} />
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: 13 }}>
                    <input type="checkbox" checked={apiEditor.enableCors} onChange={(event) => setApiEditor((current) => ({ ...current, enableCors: event.target.checked }))} />
                    Enable CORS
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={fieldLabelStyle}>Content Type</span>
                    <input value={apiEditor.contentType} onChange={(event) => setApiEditor((current) => ({ ...current, contentType: event.target.value }))} placeholder="application/json" style={fieldStyle} />
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={fieldLabelStyle}>JSON Content</span>
                <textarea value={editor.content} onChange={(event) => setEditor((current) => ({ ...current, content: event.target.value }))} style={{ ...fieldStyle, minHeight: 260, resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", background: "#f8fafc" }} />
              </label>
              <p style={{ margin: 0, color: "#64748b", fontSize: 12, lineHeight: 1.6 }}>Protocol-specific files are saved to their default locations automatically.</p>
            </>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>
          {error ? <p style={{ margin: 0, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>{error}</p> : null}
          {message ? <p style={{ margin: error ? "8px 0 0" : 0, color: "#047857", fontSize: 13, fontWeight: 600 }}>{message}</p> : null}
          <div style={stickyActionBarStyle}>
            <button type="button" onClick={() => void handleCreate()} style={primaryButtonStyle}>Create Endpoint Config</button>
            <button type="button" onClick={() => void handleUpdate()} style={secondaryButtonStyle}>Edit Endpoint Config</button>
            {selectedProtocol === "api" ? (
              <>
                <button type="button" onClick={() => void loadRestRoutes()} disabled={isLoading} style={secondaryButtonStyle}>{isLoading ? "Loading..." : "Load REST Routes"}</button>
                <input
                  value={routeLookupName}
                  onChange={(event) => setRouteLookupName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Tab" && routeLookupSuggestions[0]) {
                      event.preventDefault();
                      setRouteLookupName(routeLookupSuggestions[0]);
                      return;
                    }

                    if (event.key === "Enter") {
                      event.preventDefault();
                      void loadRestRouteByName();
                    }
                  }}
                  placeholder="route name"
                  list="rest-route-lookup-suggestions"
                  style={{ ...fieldStyle, width: 180, minHeight: 43, padding: "9px 12px" }}
                />
                <datalist id="rest-route-lookup-suggestions">
                  {routeLookupSuggestions.map((routeName) => (
                    <option key={routeName} value={routeName} />
                  ))}
                </datalist>
                <button type="button" onClick={() => void loadRestRouteByName()} disabled={isLoading} style={secondaryButtonStyle}>Get By Name</button>
              </>
            ) : null}
            {selectedProtocol === "api" ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setEditor(createAdditionalRouteState("api"));
                  setApiEditor(createApiRouteEditorState());
                  setError(null);
                }}
                style={tertiaryButtonStyle}
              >
                New REST Route
              </button>
            ) : null}
            {selectedProtocol === "sse" ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setEditor(createAdditionalRouteState("sse"));
                  setError(null);
                }}
                style={tertiaryButtonStyle}
              >
                New SSE Route
              </button>
            ) : null}
          </div>
        </div>
      </section>
      <section style={workspacePanelStyle}>
        <SectionTitle title="Endpoint Tree" subtitle="Files are grouped by protocol and folder path to mirror the endpoint directory structure." />
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16, flex: 1, minHeight: 0, overflow: "auto", paddingRight: 6 }}>
          {(["api", "grpc", "sse", "ws"] as const).map((protocol) => {
            const items = groupedItems.get(protocol) ?? [];
            const folders = [...new Set(items.map((item) => item.folderPath || "(root)"))].sort();

            return (
              <div key={protocol} style={{ display: "grid", gap: 10 }}>
                <button type="button" onClick={() => handleProtocolChange(protocol)} style={{ border: "none", background: "transparent", color: selectedProtocol === protocol ? "#0f172a" : "#64748b", padding: 0, textAlign: "left", fontSize: 13, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {protocol}
                </button>
                {items.length > 0 ? folders.map((folder) => (
                  <div key={`${protocol}-${folder}`} style={{ display: "grid", gap: 8, marginLeft: 12 }}>
                    <div style={{ color: "#475569", fontSize: 12, fontWeight: 700, letterSpacing: "0.03em" }}>{folder}</div>
                    {items.filter((item) => (item.folderPath || "(root)") === folder).map((item) => (
                      <div key={item.id} style={{ position: "relative", marginLeft: 12 }}>
                        <button type="button" onClick={() => handleSelectItem(item)} style={{ width: "100%", textAlign: "left", borderRadius: 18, border: item.id === selectedId ? "1px solid rgba(15, 23, 42, 0.18)" : "1px solid rgba(226, 232, 240, 0.95)", background: item.id === selectedId ? "linear-gradient(180deg, #eff6ff, #ffffff)" : "linear-gradient(180deg, #ffffff, #f8fafc)", padding: "14px 52px 14px 16px", color: "#0f172a", cursor: "pointer", boxShadow: item.id === selectedId ? "0 14px 28px rgba(37, 99, 235, 0.10)" : "0 8px 18px rgba(15, 23, 42, 0.05)" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>{item.fileName}</div>
                          <div style={listItemMetaStyle}>{item.folderPath || `${item.protocol} root`}</div>
                        </button>
                        <button type="button" aria-label={`Delete ${item.fileName}`} onClick={() => void handleDelete(item.id)} style={{ ...deleteIconButtonStyle, position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M9 3.75h6a1 1 0 0 1 1 1V6H8V4.75a1 1 0 0 1 1-1Z" /><path d="M4.75 6h14.5" /><path d="M6.75 6.75 7.6 19a2 2 0 0 0 2 1.86h4.8a2 2 0 0 0 2-1.86l.85-12.25" /><path d="M10 10.25v6.5" /><path d="M14 10.25v6.5" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )) : <div style={{ marginLeft: 12, borderRadius: 16, border: "1px dashed #cbd5e1", padding: "16px 18px", color: "#64748b", fontSize: 12, background: "rgba(248, 250, 252, 0.9)" }}>No {protocol} endpoint configs created yet.</div>}
              </div>
            );
          })}
          {protocolItems.length === 0 ? <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>Start by creating a file for the selected protocol.</p> : null}
        </div>
      </section>
    </div>
  );
}
