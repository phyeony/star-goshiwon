// List prices in USD per 1M tokens: [input, cached input, output].
// From the model comparison (provider pages, Nov 2026); update when a
// provider changes its price or a new model is chosen. A model missing here
// shows tokens but no cost.
export const MODEL_PRICES: Record<string, [number, number, number]> = {
  "gpt-6-luna": [0.1, 0.01, 0.5],
  "claude-haiku-5-5": [0.1, 0.1, 0.5],
  "gemini-3.1-flash-lite": [0.25, 0.025, 1.5],
  "deepseek/deepseek-v4.1-flash": [0.14, 0.004, 0.42],
};

/** Accepts "gpt-6-luna" or a run's label such as "openai/gpt-6-luna". */
export function priceFor(model: string): [number, number, number] | null {
  if (MODEL_PRICES[model]) return MODEL_PRICES[model];
  const slash = model.indexOf("/");
  return slash >= 0 ? priceFor(model.slice(slash + 1)) : null;
}

/**
 * Estimated cost in USD. `input` includes the cached tokens (as OpenAI
 * reports them); those are charged at the cached rate.
 */
export function estimateCostUsd(
  model: string,
  tokens: { input: number; cachedInput: number; output: number },
): number | null {
  const p = priceFor(model);
  if (!p) return null;
  const cached = Math.min(tokens.cachedInput, tokens.input);
  return ((tokens.input - cached) * p[0] + cached * p[1] + tokens.output * p[2]) / 1_000_000;
}
