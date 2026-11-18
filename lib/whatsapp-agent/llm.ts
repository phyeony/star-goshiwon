// Provider-neutral LLM access. The agent only ever asks for a JSON object
// matching a schema, so every provider is reached the same way and the
// model can be switched by settings alone.

export interface JsonSchema {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
}

export interface LlmRequest {
  system: string; // stable prefix first (knowledge pack), for prompt caching
  user: string;
  schemaName: string;
  schema: JsonSchema;
  maxOutputTokens?: number;
}

export interface LlmUsage {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
}

export interface LlmResponse {
  data: unknown;
  usage: LlmUsage;
  latencyMs: number;
}

export interface LlmClient {
  readonly label: string; // e.g. "openai/gpt-6-luna"
  json(req: LlmRequest): Promise<LlmResponse>;
}

export class LlmError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

export interface OpenAiCompatibleConfig {
  label: string;
  baseUrl: string; // e.g. https://api.openai.com/v1
  apiKey: string;
  model: string;
  // "json_schema" (OpenAI, Gemini, OpenRouter) or "json_object" for hosts
  // that only support plain JSON mode; the schema then goes in the prompt.
  responseFormat?: "json_schema" | "json_object";
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

// Chat Completions shape: OpenAI, Gemini (OpenAI-compatible endpoint),
// OpenRouter and Cloudflare Workers AI all accept it.
export function openAiCompatibleClient(cfg: OpenAiCompatibleConfig): LlmClient {
  const doFetch = cfg.fetchImpl ?? fetch;
  return {
    label: cfg.label,
    async json(req) {
      const format = cfg.responseFormat ?? "json_schema";
      const body: Record<string, unknown> = {
        model: cfg.model,
        messages: [
          {
            role: "system",
            content:
              format === "json_object"
                ? `${req.system}\n\nRespond with one JSON object matching this JSON schema:\n${JSON.stringify(req.schema)}`
                : req.system,
          },
          { role: "user", content: req.user },
        ],
        max_completion_tokens: req.maxOutputTokens ?? 2000,
        response_format:
          format === "json_object"
            ? { type: "json_object" }
            : {
                type: "json_schema",
                json_schema: { name: req.schemaName, schema: req.schema, strict: true },
              },
      };
      if (cfg.reasoningEffort) body.reasoning_effort = cfg.reasoningEffort;

      const started = Date.now();
      const res = await doFetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(cfg.timeoutMs ?? 60_000),
      });
      const latencyMs = Date.now() - started;
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new LlmError(`${cfg.label}: HTTP ${res.status} ${text.slice(0, 500)}`, res.status);
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string | null; refusal?: string | null } }[];
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          prompt_tokens_details?: { cached_tokens?: number };
        };
      };
      const message = json.choices?.[0]?.message;
      if (message?.refusal) throw new LlmError(`${cfg.label}: refused: ${message.refusal}`);
      const content = message?.content ?? "";
      let data: unknown;
      try {
        data = JSON.parse(stripFences(content));
      } catch {
        throw new LlmError(`${cfg.label}: reply was not JSON: ${content.slice(0, 200)}`);
      }
      return {
        data,
        latencyMs,
        usage: {
          inputTokens: json.usage?.prompt_tokens ?? 0,
          cachedInputTokens: json.usage?.prompt_tokens_details?.cached_tokens ?? 0,
          outputTokens: json.usage?.completion_tokens ?? 0,
        },
      };
    },
  };
}

function stripFences(s: string): string {
  return s.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

// Provider presets. Model ids are settings, not code: pick one per provider.
export const PROVIDERS = {
  openai: { baseUrl: "https://api.openai.com/v1", envKey: "OPENAI_API_KEY" },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    envKey: "GEMINI_API_KEY",
  },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", envKey: "OPENROUTER_API_KEY" },
} as const;
export type ProviderName = keyof typeof PROVIDERS | "workers-ai";

export function createLlmClient(
  provider: ProviderName,
  model: string,
  env: Record<string, string | undefined>,
  opts: Pick<OpenAiCompatibleConfig, "reasoningEffort" | "fetchImpl" | "timeoutMs"> = {},
): LlmClient {
  if (provider === "workers-ai") {
    const account = env.CLOUDFLARE_ACCOUNT_ID;
    const key = env.CLOUDFLARE_AI_API_TOKEN;
    if (!account || !key) throw new LlmError("workers-ai: CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_AI_API_TOKEN not set");
    return openAiCompatibleClient({
      label: `workers-ai/${model}`,
      baseUrl: `https://api.cloudflare.com/client/v4/accounts/${account}/ai/v1`,
      apiKey: key,
      model,
      responseFormat: "json_object",
      ...opts,
    });
  }
  const preset = PROVIDERS[provider];
  const key = env[preset.envKey];
  if (!key) throw new LlmError(`${provider}: ${preset.envKey} not set`);
  return openAiCompatibleClient({
    label: `${provider}/${model}`,
    // e.g. OPENAI_BASE_URL, to go through a gateway or a local mock.
    baseUrl: env[`${provider.toUpperCase()}_BASE_URL`] || preset.baseUrl,
    apiKey: key,
    model,
    ...opts,
  });
}
