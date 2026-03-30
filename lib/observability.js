import crypto from "crypto";

const METRICS_WINDOW_MS = Number(process.env.OPS_METRICS_WINDOW_MS || 60 * 60 * 1000);
const MAX_REQUEST_SAMPLES = Number(process.env.OPS_MAX_REQUEST_SAMPLES || 5000);
const ALERT_COOLDOWN_MS = Number(process.env.OPS_ALERT_COOLDOWN_MS || 15 * 60 * 1000);

const getStore = () => {
  if (!globalThis.__LEGALAI_OBS__) {
    globalThis.__LEGALAI_OBS__ = {
      requests: [],
      openaiUsage: {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostUsd: 0,
        byModel: {}
      },
      providerErrors: {
        openai: 0,
        supabase: 0,
        auth: 0,
        other: 0
      },
      alertState: {
        lastByKey: {}
      }
    };
  }
  return globalThis.__LEGALAI_OBS__;
};

const toLowerHeaderMap = (headers) => {
  if (!headers) {
    return {};
  }
  if (typeof headers.get === "function") {
    return new Proxy(
      {},
      {
        get: (_target, prop) => headers.get(String(prop)) || ""
      }
    );
  }
  const normalized = {};
  Object.entries(headers).forEach(([key, value]) => {
    normalized[String(key || "").toLowerCase()] = Array.isArray(value)
      ? value[0] || ""
      : value || "";
  });
  return normalized;
};

const getPath = (request) => {
  if (!request) {
    return "";
  }
  if (request?.nextUrl?.pathname) {
    return request.nextUrl.pathname;
  }
  const raw = String(request.url || "");
  return raw.split("?")[0] || "";
};

const getMethod = (request) => {
  return String(request?.method || "GET").toUpperCase();
};

const getClientIp = (headers) => {
  const xff = String(headers["x-forwarded-for"] || "").trim();
  if (xff) {
    return xff.split(",")[0].trim();
  }
  return String(headers["x-real-ip"] || "").trim();
};

const hashValue = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  const salt = process.env.OBSERVABILITY_HASH_SALT || "legalai-observability-salt";
  return crypto.createHash("sha256").update(`${salt}:${raw}`).digest("hex").slice(0, 16);
};

const detectIdentity = (request, identity = {}) => {
  const headers = toLowerHeaderMap(request?.headers || {});
  const userInput =
    identity.userId ||
    identity.user_id ||
    identity.email ||
    headers["x-user-id"] ||
    headers["x-user-email"] ||
    "";
  const firmInput = identity.firmId || identity.firm_id || headers["x-firm-id"] || "";
  const ipInput = getClientIp(headers);
  const uaInput = String(headers["user-agent"] || "");

  return {
    user_id_hash: hashValue(userInput),
    firm_id_hash: hashValue(firmInput),
    client_ip_hash: hashValue(ipInput),
    user_agent_hash: hashValue(uaInput)
  };
};

const modelPricingPerMillion = (model) => {
  const normalized = String(model || "").trim().toLowerCase();
  if (!normalized) {
    return { input: 0, output: 0 };
  }

  const defaults = {
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "text-embedding-3-small": { input: 0.02, output: 0 }
  };

  return defaults[normalized] || { input: 0, output: 0 };
};

const estimateCostUsd = ({ model, inputTokens, outputTokens }) => {
  const pricing = modelPricingPerMillion(model);
  const inputCost = (Number(inputTokens || 0) / 1_000_000) * pricing.input;
  const outputCost = (Number(outputTokens || 0) / 1_000_000) * pricing.output;
  return Number((inputCost + outputCost).toFixed(8));
};

const pruneOldRequests = (store) => {
  const minTs = Date.now() - METRICS_WINDOW_MS;
  store.requests = store.requests.filter((item) => Number(item.ts || 0) >= minTs);
  if (store.requests.length > MAX_REQUEST_SAMPLES) {
    store.requests = store.requests.slice(-MAX_REQUEST_SAMPLES);
  }
};

const sendWebhook = async (url, payload) => {
  if (!url) {
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("[obs-webhook-failed]", {
      message: String(error?.message || error || "")
    });
  }
};

const maybeSendAlert = async ({ key, severity, message, details }) => {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL || "";
  if (!webhookUrl || process.env.NODE_ENV !== "production") {
    return;
  }

  const store = getStore();
  const now = Date.now();
  const previous = Number(store.alertState.lastByKey[key] || 0);
  if (now - previous < ALERT_COOLDOWN_MS) {
    return;
  }
  store.alertState.lastByKey[key] = now;

  await sendWebhook(webhookUrl, {
    service: "legalai-web",
    severity,
    message,
    details,
    timestamp: new Date(now).toISOString()
  });
};

export const createRequestContext = ({ request, route, identity } = {}) => {
  const contextRoute = route || getPath(request) || "unknown_route";
  const method = getMethod(request);
  const request_id = crypto.randomUUID();
  const started_at = Date.now();
  const identityHashes = detectIdentity(request, identity);

  return {
    request_id,
    route: contextRoute,
    method,
    started_at,
    ...identityHashes
  };
};

export const logRequestStart = (ctx, extra = {}) => {
  console.info(
    JSON.stringify({
      event: "request_start",
      request_id: ctx.request_id,
      route: ctx.route,
      method: ctx.method,
      user_id_hash: ctx.user_id_hash || null,
      firm_id_hash: ctx.firm_id_hash || null,
      client_ip_hash: ctx.client_ip_hash || null,
      user_agent_hash: ctx.user_agent_hash || null,
      ...extra
    })
  );
};

const recordRequestMetric = ({ route, method, status, latency_ms }) => {
  const store = getStore();
  store.requests.push({
    ts: Date.now(),
    route,
    method,
    status,
    latency_ms
  });
  pruneOldRequests(store);
};

const maybeAlertOnSpike = async ({ route }) => {
  const store = getStore();
  const recent = store.requests.filter((item) => item.route === route).slice(-40);
  if (recent.length < 20) {
    return;
  }

  const errors = recent.filter((item) => Number(item.status || 0) >= 500).length;
  const errorRate = errors / recent.length;
  if (errorRate >= 0.25) {
    await maybeSendAlert({
      key: `spike:${route}`,
      severity: "high",
      message: `API error spike on ${route}`,
      details: {
        route,
        sample_size: recent.length,
        error_rate: Number(errorRate.toFixed(4))
      }
    });
  }
};

export const recordOpenAIUsage = ({ model, inputTokens, outputTokens }) => {
  const inTok = Number(inputTokens || 0);
  const outTok = Number(outputTokens || 0);
  if (!Number.isFinite(inTok) && !Number.isFinite(outTok)) {
    return;
  }

  const safeIn = Number.isFinite(inTok) ? inTok : 0;
  const safeOut = Number.isFinite(outTok) ? outTok : 0;
  const cost = estimateCostUsd({
    model,
    inputTokens: safeIn,
    outputTokens: safeOut
  });

  const store = getStore();
  store.openaiUsage.totalInputTokens += safeIn;
  store.openaiUsage.totalOutputTokens += safeOut;
  store.openaiUsage.totalCostUsd += cost;

  const key = String(model || "unknown_model");
  if (!store.openaiUsage.byModel[key]) {
    store.openaiUsage.byModel[key] = {
      input_tokens: 0,
      output_tokens: 0,
      estimated_cost_usd: 0
    };
  }
  store.openaiUsage.byModel[key].input_tokens += safeIn;
  store.openaiUsage.byModel[key].output_tokens += safeOut;
  store.openaiUsage.byModel[key].estimated_cost_usd += cost;
};

export const logRequestEnd = async (ctx, { status, extra = {} } = {}) => {
  const latency_ms = Date.now() - Number(ctx.started_at || Date.now());
  recordRequestMetric({
    route: ctx.route,
    method: ctx.method,
    status: Number(status || 200),
    latency_ms
  });

  console.info(
    JSON.stringify({
      event: "request_end",
      request_id: ctx.request_id,
      route: ctx.route,
      method: ctx.method,
      status: Number(status || 200),
      latency_ms,
      user_id_hash: ctx.user_id_hash || null,
      firm_id_hash: ctx.firm_id_hash || null,
      ...extra
    })
  );

  await maybeAlertOnSpike({ route: ctx.route });
};

export const logProviderError = async (provider, details = {}) => {
  const store = getStore();
  const key = ["openai", "supabase", "auth"].includes(provider) ? provider : "other";
  store.providerErrors[key] += 1;
  console.error(
    JSON.stringify({
      event: "provider_error",
      provider: key,
      ...details
    })
  );
  await maybeSendAlert({
    key: `provider_error:${key}`,
    severity: "high",
    message: `Provider error: ${key}`,
    details
  });
};

export const reportError = async ({ ctx, error, status = 500, tags = {}, extra = {} } = {}) => {
  const message = String(error?.message || error || "unknown_error");

  console.error(
    JSON.stringify({
      event: "request_error",
      request_id: ctx?.request_id || null,
      route: ctx?.route || null,
      method: ctx?.method || null,
      status,
      error_message: message,
      tags,
      extra
    })
  );

  if (ctx) {
    await logRequestEnd(ctx, { status, extra: { error: true } });
  }

  const webhookUrl = process.env.ERROR_MONITOR_WEBHOOK_URL || "";
  if (webhookUrl && process.env.NODE_ENV === "production") {
    await sendWebhook(webhookUrl, {
      service: "legalai-web",
      event: "error",
      route: ctx?.route || null,
      method: ctx?.method || null,
      request_id: ctx?.request_id || null,
      status,
      message,
      tags,
      extra,
      timestamp: new Date().toISOString()
    });
  }
};

const p95 = (values) => {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1));
  return sorted[idx];
};

export const getMetricsSnapshot = () => {
  const store = getStore();
  pruneOldRequests(store);

  const requests = store.requests;
  const total = requests.length;
  const errors = requests.filter((item) => Number(item.status || 0) >= 500).length;
  const latencies = requests.map((item) => Number(item.latency_ms || 0)).filter(Number.isFinite);
  const byRoute = {};

  requests.forEach((item) => {
    const key = item.route || "unknown_route";
    if (!byRoute[key]) {
      byRoute[key] = { count: 0, errors: 0, latencies: [] };
    }
    byRoute[key].count += 1;
    if (Number(item.status || 0) >= 500) {
      byRoute[key].errors += 1;
    }
    byRoute[key].latencies.push(Number(item.latency_ms || 0));
  });

  const byRouteSummary = Object.entries(byRoute).map(([route, data]) => ({
    route,
    request_count: data.count,
    error_rate: data.count ? Number((data.errors / data.count).toFixed(4)) : 0,
    p95_latency_ms: p95(data.latencies)
  }));

  return {
    generated_at: new Date().toISOString(),
    window_minutes: Math.round(METRICS_WINDOW_MS / 60000),
    requests: {
      total,
      error_rate: total ? Number((errors / total).toFixed(4)) : 0,
      p95_latency_ms: p95(latencies),
      by_route: byRouteSummary.sort((a, b) => b.request_count - a.request_count)
    },
    openai: {
      input_tokens: store.openaiUsage.totalInputTokens,
      output_tokens: store.openaiUsage.totalOutputTokens,
      estimated_cost_usd: Number(store.openaiUsage.totalCostUsd.toFixed(6)),
      by_model: Object.entries(store.openaiUsage.byModel).map(([model, usage]) => ({
        model,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        estimated_cost_usd: Number(usage.estimated_cost_usd.toFixed(6))
      }))
    },
    provider_errors: store.providerErrors
  };
};
