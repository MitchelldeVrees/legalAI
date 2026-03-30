const MODEL_PRICING_PER_MILLION = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "text-embedding-3-small": { input: 0.02, output: 0 }
};

const toTokensFromChars = (chars) => {
  const value = Number(chars || 0);
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.ceil(value / 4);
};

const costFor = (model, inputTokens, outputTokens) => {
  const pricing = MODEL_PRICING_PER_MILLION[model] || { input: 0, output: 0 };
  const inputCost = (Number(inputTokens || 0) / 1_000_000) * pricing.input;
  const outputCost = (Number(outputTokens || 0) / 1_000_000) * pricing.output;
  return Number((inputCost + outputCost).toFixed(6));
};

export const getMonthlyCostProjection = () => {
  const assumptions = {
    monthly_search_requests: Number(process.env.COST_MODEL_MONTHLY_SEARCH_REQUESTS || 10000),
    monthly_answer_requests: Number(process.env.COST_MODEL_MONTHLY_ANSWER_REQUESTS || 6000),
    monthly_document_uploads: Number(process.env.COST_MODEL_MONTHLY_DOCUMENT_UPLOADS || 1200),
    avg_search_query_chars: Number(process.env.COST_MODEL_AVG_SEARCH_QUERY_CHARS || 220),
    avg_answer_query_chars: Number(process.env.COST_MODEL_AVG_ANSWER_QUERY_CHARS || 450),
    avg_answer_context_chars: Number(process.env.COST_MODEL_AVG_ANSWER_CONTEXT_CHARS || 7000),
    avg_answer_output_tokens: Number(process.env.COST_MODEL_AVG_ANSWER_OUTPUT_TOKENS || 350),
    avg_document_chars: Number(process.env.COST_MODEL_AVG_DOCUMENT_CHARS || 12000),
    avg_document_related_context_chars: Number(
      process.env.COST_MODEL_AVG_DOCUMENT_RELATED_CONTEXT_CHARS || 5000
    ),
    avg_document_output_tokens: Number(
      process.env.COST_MODEL_AVG_DOCUMENT_OUTPUT_TOKENS || 900
    )
  };

  const embeddingTokens =
    assumptions.monthly_search_requests * toTokensFromChars(assumptions.avg_search_query_chars) +
    assumptions.monthly_document_uploads * toTokensFromChars(assumptions.avg_document_chars);

  const answerInputTokens =
    assumptions.monthly_answer_requests *
    toTokensFromChars(
      assumptions.avg_answer_query_chars + assumptions.avg_answer_context_chars
    );
  const answerOutputTokens =
    assumptions.monthly_answer_requests * assumptions.avg_answer_output_tokens;

  const documentInputTokens =
    assumptions.monthly_document_uploads *
    toTokensFromChars(
      assumptions.avg_document_chars + assumptions.avg_document_related_context_chars
    );
  const documentOutputTokens =
    assumptions.monthly_document_uploads * assumptions.avg_document_output_tokens;

  const embeddingCost = costFor("text-embedding-3-small", embeddingTokens, 0);
  const answerCost = costFor("gpt-4o-mini", answerInputTokens, answerOutputTokens);
  const documentCost = costFor("gpt-4o-mini", documentInputTokens, documentOutputTokens);
  const total = Number((embeddingCost + answerCost + documentCost).toFixed(6));

  return {
    assumptions,
    projection: {
      embedding: {
        model: "text-embedding-3-small",
        input_tokens: embeddingTokens,
        estimated_cost_usd: embeddingCost
      },
      answer_generation: {
        model: "gpt-4o-mini",
        input_tokens: answerInputTokens,
        output_tokens: answerOutputTokens,
        estimated_cost_usd: answerCost
      },
      document_analysis: {
        model: "gpt-4o-mini",
        input_tokens: documentInputTokens,
        output_tokens: documentOutputTokens,
        estimated_cost_usd: documentCost
      },
      total_estimated_monthly_cost_usd: total
    }
  };
};

