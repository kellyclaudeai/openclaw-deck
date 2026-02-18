export interface ModelDisplayInfo {
  model: string;
  sourceLabel: "active runtime" | "configured";
  isFallback: boolean;
}

interface ModelDisplayParams {
  runtimeModel?: string | null;
  configuredModel?: string | null;
}

export function getModelDisplay({
  runtimeModel,
  configuredModel,
}: ModelDisplayParams): ModelDisplayInfo | null {
  const runtime = runtimeModel?.trim();
  if (runtime) {
    return {
      model: runtime,
      sourceLabel: "active runtime",
      isFallback: false,
    };
  }

  const configured = configuredModel?.trim();
  if (configured) {
    return {
      model: configured,
      sourceLabel: "configured",
      isFallback: true,
    };
  }

  return null;
}
