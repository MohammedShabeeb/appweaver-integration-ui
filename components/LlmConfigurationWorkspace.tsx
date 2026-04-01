"use client";

import { useMemo, useState } from "react";

import {
  useFlowStore,
  type CreatedLlmConfig,
  type CreatedRagConfig,
} from "@/store/useFlowStore";

type LlmEditorState = {
  providerId: string;
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  templatePath: string;
};

type RagEditorState = {
  ragId: string;
  embeddingModelProvider: string;
  embeddingModelEndpoint: string;
  embeddingModelName: string;
  embeddingStoreProvider: string;
  embeddingStoreEndpoint: string;
  embeddingStoreApiKey: string;
  embeddingStoreIndexName: string;
  embeddingStoreDimension: string;
};

type ProviderPayload = {
  id: string;
  provider: string;
  model: string;
  baseUrl: string;
  apiKey?: string;
  templatePath: string;
};

type RagPayload = {
  id: string;
  embeddingModel: {
    provider: string;
    endpoint: string;
    modelName: string;
  };
  embeddingStore: {
    provider: string;
    endpoint?: string;
    apiKey?: string;
    indexName?: string;
    dimension?: number;
  };
};

function createLlmEditorState(): LlmEditorState {
  return {
    providerId: "",
    provider: "",
    model: "",
    baseUrl: "",
    apiKey: "",
    templatePath: "/llm/templates",
  };
}

function createLlmEditorFromItem(item: CreatedLlmConfig): LlmEditorState {
  return {
    providerId: item.providerId,
    provider: item.provider,
    model: item.model,
    baseUrl: item.baseUrl,
    apiKey: item.apiKey,
    templatePath: item.templatePath,
  };
}

function createRagEditorState(): RagEditorState {
  return {
    ragId: "",
    embeddingModelProvider: "",
    embeddingModelEndpoint: "",
    embeddingModelName: "",
    embeddingStoreProvider: "memory",
    embeddingStoreEndpoint: "",
    embeddingStoreApiKey: "",
    embeddingStoreIndexName: "",
    embeddingStoreDimension: "",
  };
}

function createRagEditorFromItem(item: CreatedRagConfig): RagEditorState {
  return {
    ragId: item.ragId,
    embeddingModelProvider: item.embeddingModelProvider,
    embeddingModelEndpoint: item.embeddingModelEndpoint,
    embeddingModelName: item.embeddingModelName,
    embeddingStoreProvider: item.embeddingStoreProvider,
    embeddingStoreEndpoint: item.embeddingStoreEndpoint,
    embeddingStoreApiKey: item.embeddingStoreApiKey,
    embeddingStoreIndexName: item.embeddingStoreIndexName,
    embeddingStoreDimension: item.embeddingStoreDimension,
  };
}

function SectionTitle({
  title
}: {
  title: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h2 className="app-heading-2" style={{ margin: 0, color: "#0f172a", letterSpacing: "-0.03em" }}>
        {title}
      </h2>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  borderRadius: 28,
  border: "1px solid rgba(226, 232, 240, 0.95)",
  background: "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96))",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 16,
  border: "1px solid #dbe4f0",
  background: "#ffffff",
  padding: "14px 16px",
  fontSize: 14,
  color: "#0f172a",
  fontFamily: "var(--font-body), Arial, Helvetica, sans-serif",
  outline: "none",
  boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.04)",
};

const fieldLabelStyle: React.CSSProperties = {
  color: "#475569",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const listItemMetaStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: "#64748b",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  lineHeight: 1.55,
};

const workspaceGridStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(300px, 340px)",
  gap: 20,
  alignItems: "stretch",
  overflow: "hidden",
};

const workspacePanelStyle: React.CSSProperties = {
  ...panelStyle,
  padding: 24,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(135deg, #2DB780, #249c6c)",
  color: "#ffffff",
  padding: "12px 18px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(45, 183, 128, 0.22)",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.38)",
  borderRadius: 14,
  background: "#ffffff",
  color: "#475569",
  padding: "12px 18px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
};

const stickyActionBarStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: "auto",
  paddingTop: 16,
  borderTop: "1px solid rgba(203, 213, 225, 0.95)",
};

const subsectionButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "#475569",
  padding: "0 4px 12px",
  fontSize: 16,
  lineHeight: "24px",
  fontWeight: 500,
  cursor: "pointer",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "2px solid transparent",
};

const deleteIconButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: 10,
  border: "1px solid rgba(248, 113, 113, 0.28)",
  background: "#fff5f5",
  color: "#dc2626",
  boxShadow: "0 8px 18px rgba(220, 38, 38, 0.08)",
  cursor: "pointer",
};

const previewStyle: React.CSSProperties = {
  ...fieldStyle,
  minHeight: 220,
  resize: "vertical",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  background: "#f8fafc",
};

const treeHeaderButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  textAlign: "left",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

export default function LlmConfigurationWorkspace() {
  const {
    llmConfigs,
    ragConfigs,
    selectedLlmSubsection,
    selectLlmSubsection,
    addLlmConfig,
    updateLlmConfig,
    removeLlmConfig,
    addRagConfig,
    updateRagConfig,
    removeRagConfig,
  } = useFlowStore();

  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedRagConfigId, setSelectedRagConfigId] = useState<string | null>(null);
  const [providerEditor, setProviderEditor] = useState<LlmEditorState>(() => createLlmEditorState());
  const [ragEditor, setRagEditor] = useState<RagEditorState>(() => createRagEditorState());
  const [providerError, setProviderError] = useState<string | null>(null);
  const [ragError, setRagError] = useState<string | null>(null);

  const selectedProvider = llmConfigs.find((item) => item.id === selectedProviderId) ?? null;
  const selectedRagConfig = ragConfigs.find((item) => item.id === selectedRagConfigId) ?? null;

  const providerPreview = useMemo(
    () =>
      JSON.stringify(
        llmConfigs.map((item) => {
          const payload: ProviderPayload = {
            id: item.providerId,
            provider: item.provider,
            model: item.model,
            baseUrl: item.baseUrl,
            templatePath: item.templatePath,
          };

          if (item.apiKey.trim()) {
            payload.apiKey = item.apiKey;
          }

          return payload;
        }),
        null,
        2,
      ),
    [llmConfigs],
  );

  const ragPreview = useMemo(
    () =>
      JSON.stringify(
        ragConfigs.map((item) => {
          const payload: RagPayload = {
            id: item.ragId,
            embeddingModel: {
              provider: item.embeddingModelProvider,
              endpoint: item.embeddingModelEndpoint,
              modelName: item.embeddingModelName,
            },
            embeddingStore: {
              provider: item.embeddingStoreProvider,
            },
          };

          if (item.embeddingStoreEndpoint.trim()) {
            payload.embeddingStore.endpoint = item.embeddingStoreEndpoint;
          }

          if (item.embeddingStoreApiKey.trim()) {
            payload.embeddingStore.apiKey = item.embeddingStoreApiKey;
          }

          if (item.embeddingStoreIndexName.trim()) {
            payload.embeddingStore.indexName = item.embeddingStoreIndexName;
          }

          if (item.embeddingStoreDimension.trim()) {
            const dimension = Number(item.embeddingStoreDimension);

            if (Number.isFinite(dimension)) {
              payload.embeddingStore.dimension = dimension;
            }
          }

          return payload;
        }),
        null,
        2,
      ),
    [ragConfigs],
  );

  const buildProviderPayload = () => {
    const payload = {
      providerId: providerEditor.providerId.trim(),
      provider: providerEditor.provider.trim(),
      model: providerEditor.model.trim(),
      baseUrl: providerEditor.baseUrl.trim(),
      apiKey: providerEditor.apiKey.trim(),
      templatePath: providerEditor.templatePath.trim(),
    };

    if (!payload.providerId) {
      setProviderError("Provider id is required.");
      return null;
    }

    if (!payload.provider) {
      setProviderError("Provider name is required.");
      return null;
    }

    if (!payload.model) {
      setProviderError("Model is required.");
      return null;
    }

    if (!payload.baseUrl) {
      setProviderError("Base URL is required.");
      return null;
    }

    if (!payload.templatePath) {
      setProviderError("Template path is required.");
      return null;
    }

    return payload;
  };

  const buildRagPayload = () => {
    const payload = {
      ragId: ragEditor.ragId.trim(),
      embeddingModelProvider: ragEditor.embeddingModelProvider.trim(),
      embeddingModelEndpoint: ragEditor.embeddingModelEndpoint.trim(),
      embeddingModelName: ragEditor.embeddingModelName.trim(),
      embeddingStoreProvider: ragEditor.embeddingStoreProvider.trim(),
      embeddingStoreEndpoint: ragEditor.embeddingStoreEndpoint.trim(),
      embeddingStoreApiKey: ragEditor.embeddingStoreApiKey.trim(),
      embeddingStoreIndexName: ragEditor.embeddingStoreIndexName.trim(),
      embeddingStoreDimension: ragEditor.embeddingStoreDimension.trim(),
    };

    if (!payload.ragId) {
      setRagError("RAG id is required.");
      return null;
    }

    if (!payload.embeddingModelProvider) {
      setRagError("Embedding model provider is required.");
      return null;
    }

    if (!payload.embeddingModelEndpoint) {
      setRagError("Embedding model endpoint is required.");
      return null;
    }

    if (!payload.embeddingModelName) {
      setRagError("Embedding model name is required.");
      return null;
    }

    if (!payload.embeddingStoreProvider) {
      setRagError("Embedding store provider is required.");
      return null;
    }

    if (payload.embeddingStoreDimension && !Number.isFinite(Number(payload.embeddingStoreDimension))) {
      setRagError("Embedding store dimension must be a valid number.");
      return null;
    }

    return payload;
  };

  const handleCreateProvider = () => {
    const payload = buildProviderPayload();

    if (!payload) {
      return;
    }

    const result = addLlmConfig(payload);

    if (!result.ok) {
      setProviderError(result.reason);
      return;
    }

    setProviderError(null);
    setProviderEditor(createLlmEditorState());
    setSelectedProviderId(null);
  };

  const handleUpdateProvider = () => {
    if (!selectedProviderId) {
      setProviderError("Select a provider config from the list to edit it.");
      return;
    }

    const payload = buildProviderPayload();

    if (!payload) {
      return;
    }

    const result = updateLlmConfig(selectedProviderId, payload);

    if (!result.ok) {
      setProviderError(result.reason);
      return;
    }

    setProviderError(null);
  };

  const handleDeleteProvider = (configId: string) => {
    removeLlmConfig(configId);

    if (selectedProviderId === configId) {
      setSelectedProviderId(null);
      setProviderEditor(createLlmEditorState());
      setProviderError(null);
    }
  };

  const handleCreateRag = () => {
    const payload = buildRagPayload();

    if (!payload) {
      return;
    }

    const result = addRagConfig(payload);

    if (!result.ok) {
      setRagError(result.reason);
      return;
    }

    setRagError(null);
    setRagEditor(createRagEditorState());
    setSelectedRagConfigId(null);
  };

  const handleUpdateRag = () => {
    if (!selectedRagConfigId) {
      setRagError("Select a RAG config from the list to edit it.");
      return;
    }

    const payload = buildRagPayload();

    if (!payload) {
      return;
    }

    const result = updateRagConfig(selectedRagConfigId, payload);

    if (!result.ok) {
      setRagError(result.reason);
      return;
    }

    setRagError(null);
  };

  const handleDeleteRag = (configId: string) => {
    removeRagConfig(configId);

    if (selectedRagConfigId === configId) {
      setSelectedRagConfigId(null);
      setRagEditor(createRagEditorState());
      setRagError(null);
    }
  };

  const handleSubsectionChange = (section: "providers" | "rag") => {
    selectLlmSubsection(section);

    if (section === "providers") {
      setSelectedProviderId(null);
      setProviderEditor(createLlmEditorState());
      setProviderError(null);
      return;
    }

    setSelectedRagConfigId(null);
    setRagEditor(createRagEditorState());
    setRagError(null);
  };

  return (
    <div style={workspaceGridStyle}>
      <section style={workspacePanelStyle}>
        <SectionTitle
          title={selectedLlmSubsection === "providers" ? (selectedProvider ? "Edit Provider Config" : "Create Provider Config") : selectedRagConfig ? "Edit RAG Config" : "Create RAG Config"}
        />
        <div style={{ marginTop: 18, display: "grid", gap: 14, flex: 1, minHeight: 0, alignContent: "start", overflow: "auto", paddingRight: 6 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, borderBottom: "1px solid rgba(226, 232, 240, 0.95)", paddingBottom: 2 }}>
            {(["providers", "rag"] as const).map((section) => (
              <button key={section} type="button" onClick={() => handleSubsectionChange(section)} style={{ ...subsectionButtonStyle, color: selectedLlmSubsection === section ? "var(--workflow-accent)" : subsectionButtonStyle.color, borderBottom: selectedLlmSubsection === section ? "2px solid var(--workflow-accent)" : subsectionButtonStyle.borderBottom }}>
                {section}
              </button>
            ))}
          </div>
          {selectedLlmSubsection === "providers" ? (
            <>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Provider ID</span><input value={providerEditor.providerId} onChange={(event) => setProviderEditor((current) => ({ ...current, providerId: event.target.value }))} placeholder="azure_gpt-4o-mini" style={fieldStyle} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Provider</span><input value={providerEditor.provider} onChange={(event) => setProviderEditor((current) => ({ ...current, provider: event.target.value }))} placeholder="azure" style={fieldStyle} /></label>
              </div>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Model</span><input value={providerEditor.model} onChange={(event) => setProviderEditor((current) => ({ ...current, model: event.target.value }))} placeholder="gpt-4o-mini" style={fieldStyle} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Template Path</span><input value={providerEditor.templatePath} onChange={(event) => setProviderEditor((current) => ({ ...current, templatePath: event.target.value }))} placeholder="/llm/templates" style={fieldStyle} /></label>
              </div>
              <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Base URL</span><input value={providerEditor.baseUrl} onChange={(event) => setProviderEditor((current) => ({ ...current, baseUrl: event.target.value }))} placeholder="https://api.x.ai/v1" style={fieldStyle} /></label>
              <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>API Key</span><input type="password" value={providerEditor.apiKey} onChange={(event) => setProviderEditor((current) => ({ ...current, apiKey: event.target.value }))} placeholder="Optional for local providers like Ollama" style={fieldStyle} /></label>
              <div style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Generated JSON Preview</span><textarea value={providerPreview} readOnly style={previewStyle} /></div>
              {providerError ? <p style={{ margin: 0, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>{providerError}</p> : null}
              <div style={stickyActionBarStyle}><button type="button" onClick={handleCreateProvider} style={primaryButtonStyle}>Create Provider</button><button type="button" onClick={handleUpdateProvider} style={secondaryButtonStyle}>Edit Provider</button></div>
            </>
          ) : (
            <>
              <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>RAG ID</span><input value={ragEditor.ragId} onChange={(event) => setRagEditor((current) => ({ ...current, ragId: event.target.value }))} placeholder="default" style={fieldStyle} /></label>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Embedding Model Provider</span><input value={ragEditor.embeddingModelProvider} onChange={(event) => setRagEditor((current) => ({ ...current, embeddingModelProvider: event.target.value }))} placeholder="ollama_nomic-embed-text" style={fieldStyle} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Embedding Model Name</span><input value={ragEditor.embeddingModelName} onChange={(event) => setRagEditor((current) => ({ ...current, embeddingModelName: event.target.value }))} placeholder="nomic-embed-text" style={fieldStyle} /></label>
              </div>
              <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Embedding Model Endpoint</span><input value={ragEditor.embeddingModelEndpoint} onChange={(event) => setRagEditor((current) => ({ ...current, embeddingModelEndpoint: event.target.value }))} placeholder="http://localhost:11434" style={fieldStyle} /></label>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Embedding Store Provider</span><input value={ragEditor.embeddingStoreProvider} onChange={(event) => setRagEditor((current) => ({ ...current, embeddingStoreProvider: event.target.value }))} placeholder="memory or azure" style={fieldStyle} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Store Dimension</span><input value={ragEditor.embeddingStoreDimension} onChange={(event) => setRagEditor((current) => ({ ...current, embeddingStoreDimension: event.target.value }))} placeholder="768" style={fieldStyle} /></label>
              </div>
              <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Store Endpoint</span><input value={ragEditor.embeddingStoreEndpoint} onChange={(event) => setRagEditor((current) => ({ ...current, embeddingStoreEndpoint: event.target.value }))} placeholder="Optional for memory store" style={fieldStyle} /></label>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Store API Key</span><input type="password" value={ragEditor.embeddingStoreApiKey} onChange={(event) => setRagEditor((current) => ({ ...current, embeddingStoreApiKey: event.target.value }))} placeholder="Optional for memory store" style={fieldStyle} /></label>
                <label style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Store Index Name</span><input value={ragEditor.embeddingStoreIndexName} onChange={(event) => setRagEditor((current) => ({ ...current, embeddingStoreIndexName: event.target.value }))} placeholder="aihub-framework-index" style={fieldStyle} /></label>
              </div>
              <div style={{ display: "grid", gap: 6 }}><span style={fieldLabelStyle}>Generated JSON Preview</span><textarea value={ragPreview} readOnly style={previewStyle} /></div>
              {ragError ? <p style={{ margin: 0, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>{ragError}</p> : null}
              <div style={stickyActionBarStyle}><button type="button" onClick={handleCreateRag} style={primaryButtonStyle}>Create RAG Config</button><button type="button" onClick={handleUpdateRag} style={secondaryButtonStyle}>Edit RAG Config</button></div>
            </>
          )}
        </div>
      </section>
      <section style={workspacePanelStyle}>
        <SectionTitle title="List LLM Configs"/>
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16, flex: 1, minHeight: 0, overflow: "auto", paddingRight: 6 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <button type="button" onClick={() => handleSubsectionChange("providers")} style={{ ...treeHeaderButtonStyle, color: selectedLlmSubsection === "providers" ? "#0f172a" : "#64748b" }}>providers</button>
            {llmConfigs.length > 0 ? llmConfigs.map((item) => (
              <div key={item.id} style={{ position: "relative", marginLeft: 12 }}>
                <button type="button" onClick={() => { selectLlmSubsection("providers"); setSelectedProviderId(item.id); setProviderEditor(createLlmEditorFromItem(item)); setProviderError(null); }} style={{ width: "100%", textAlign: "left", borderRadius: 18, border: item.id === selectedProviderId && selectedLlmSubsection === "providers" ? "1px solid rgba(15, 23, 42, 0.18)" : "1px solid rgba(226, 232, 240, 0.95)", background: item.id === selectedProviderId && selectedLlmSubsection === "providers" ? "linear-gradient(180deg, #eff6ff, #ffffff)" : "linear-gradient(180deg, #ffffff, #f8fafc)", padding: "14px 52px 14px 16px", color: "#0f172a", cursor: "pointer", boxShadow: item.id === selectedProviderId && selectedLlmSubsection === "providers" ? "0 14px 28px rgba(37, 99, 235, 0.10)" : "0 8px 18px rgba(15, 23, 42, 0.05)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>{item.providerId}</div><div style={listItemMetaStyle}>{item.provider} | {item.model}</div><div style={listItemMetaStyle}>{item.baseUrl}</div>
                </button>
                <button type="button" aria-label={`Delete ${item.providerId}`} onClick={() => handleDeleteProvider(item.id)} style={{ ...deleteIconButtonStyle, position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M9 3.75h6a1 1 0 0 1 1 1V6H8V4.75a1 1 0 0 1 1-1Z" /><path d="M4.75 6h14.5" /><path d="M6.75 6.75 7.6 19a2 2 0 0 0 2 1.86h4.8a2 2 0 0 0 2-1.86l.85-12.25" /><path d="M10 10.25v6.5" /><path d="M14 10.25v6.5" /></svg></button>
              </div>
            )) : <div style={{ marginLeft: 12, borderRadius: 16, border: "1px dashed #cbd5e1", padding: "16px 18px", color: "#64748b", fontSize: 12, background: "rgba(248, 250, 252, 0.9)" }}>No provider configs created yet.</div>}
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <button type="button" onClick={() => handleSubsectionChange("rag")} style={{ ...treeHeaderButtonStyle, color: selectedLlmSubsection === "rag" ? "#0f172a" : "#64748b" }}>rag</button>
            {ragConfigs.length > 0 ? ragConfigs.map((item) => (
              <div key={item.id} style={{ position: "relative", marginLeft: 12 }}>
                <button type="button" onClick={() => { selectLlmSubsection("rag"); setSelectedRagConfigId(item.id); setRagEditor(createRagEditorFromItem(item)); setRagError(null); }} style={{ width: "100%", textAlign: "left", borderRadius: 18, border: item.id === selectedRagConfigId && selectedLlmSubsection === "rag" ? "1px solid rgba(15, 23, 42, 0.18)" : "1px solid rgba(226, 232, 240, 0.95)", background: item.id === selectedRagConfigId && selectedLlmSubsection === "rag" ? "linear-gradient(180deg, #eff6ff, #ffffff)" : "linear-gradient(180deg, #ffffff, #f8fafc)", padding: "14px 52px 14px 16px", color: "#0f172a", cursor: "pointer", boxShadow: item.id === selectedRagConfigId && selectedLlmSubsection === "rag" ? "0 14px 28px rgba(37, 99, 235, 0.10)" : "0 8px 18px rgba(15, 23, 42, 0.05)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>{item.ragId}</div><div style={listItemMetaStyle}>{item.embeddingModelProvider} | {item.embeddingModelName}</div><div style={listItemMetaStyle}>{item.embeddingStoreProvider}{item.embeddingStoreIndexName ? ` | ${item.embeddingStoreIndexName}` : ""}</div>
                </button>
                <button type="button" aria-label={`Delete ${item.ragId}`} onClick={() => handleDeleteRag(item.id)} style={{ ...deleteIconButtonStyle, position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M9 3.75h6a1 1 0 0 1 1 1V6H8V4.75a1 1 0 0 1 1-1Z" /><path d="M4.75 6h14.5" /><path d="M6.75 6.75 7.6 19a2 2 0 0 0 2 1.86h4.8a2 2 0 0 0 2-1.86l.85-12.25" /><path d="M10 10.25v6.5" /><path d="M14 10.25v6.5" /></svg></button>
              </div>
            )) : <div style={{ marginLeft: 12, borderRadius: 16, border: "1px dashed #cbd5e1", padding: "16px 18px", color: "#64748b", fontSize: 12, background: "rgba(248, 250, 252, 0.9)" }}>No RAG configs created yet.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
