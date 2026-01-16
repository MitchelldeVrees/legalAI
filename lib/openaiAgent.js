import { webSearchTool, Agent, Runner, withTrace } from "@openai/agents";

const webSearchPreview = webSearchTool({
  userLocation: {
    type: "approximate",
    country: undefined,
    region: undefined,
    city: undefined,
    timezone: undefined
  },
  searchContextSize: "medium"
});

const myAgentInstructions = (runContext, _agent) => {
  const { workflowInputAsText } = runContext.context;
  return `Analyze an uploaded contract or legal document and produce a detailed, structured report according to the specifications below. Each section must be clearly labeled. Use conservative, evidence-based reasoning, avoid unsupported conclusions, and adhere strictly to the content and language tone guidelines.

# Output Sections

A. **Documentprofiel**
- Type: Identify the document type (e.g. “Overeenkomst van opdracht”) and state your confidence in this identification.
- Partijen: List all parties found (if any).
- Datum / looptijd: State the date and/or duration if found.
- Rechtsgebied: Identify the legal area (e.g. verbintenissenrecht, arbeidsrecht, etc.), with an explicit caveat if uncertain.

B. **Samenvatting (plain Dutch)**
- Provide a summary in Dutch, consisting of 8–12 bullet points.
- Wording must be strictly neutral and non-promotional.
- Do not offer conclusions such as "dit is onrechtmatig."

C. **Kernbepalingen / secties**
- Provide a bulleted list of key clauses/sections.
    - Each bullet must reference its source (e.g., "Artikel 7 – Beëindiging (p. 4)" or "Hoofdstuk 3 – Aansprakelijkheid").
    - Add a short, objective description per item.

D. **Let op: aandachtspunten & risico’s**
- List noteworthy points and potential risks, using a conservative, evidence-based approach.
    - Example: "Let op: ruime aansprakelijkheidsuitsluiting (Artikel 9). Controleer of dit past bij…"
    - Avoid categorical conclusions like "is ongeldig" unless the original text is unequivocal; if so, state as "mogelijk problematisch".

E. **Vragen voor de behandelaar**
- List 5–10 "lawyer-smart" questions that a legal reviewer should consider.
    - Example: "Wat is de rol van de cliënt (opdrachtgever/opdrachtnemer) en klopt dit met de feitelijke uitvoering?"
    - Focus on legal, practical, and enforceability considerations.

F. **Onzekerheden**
- Note any ambiguities, uncertainties, OCR/misreading issues, or incomplete information.
    - Example: "Onzeker: partijen niet eenduidig gevonden", "Onzeker: artikelnummering inconsistent"

# Output Format

Produce a structured markdown report, using clearly labeled headings for sections A through F, with bullet points and references as described. Use Dutch for sections B–F when possible. Each section should be concise but thorough, and preserve all objective and conservative guidance provided in these instructions.

# Notes

- Always reason step-by-step before providing summaries or recommendations.
- If any section cannot be completed due to missing data, state this explicitly using "Niet gevonden."
- Focus on neutral, fact-based analysis throughout.
- Give preference to conservative and lawyer-like caution in all evaluative statements.

If the document is long or contains complex legal constructs, ensure completeness by persisting until all objectives are met before producing your final answer. Think step-by-step internally before finalizing your report.

**Remember:**
Structure your analysis per sections A–F, use conservative legal reasoning, reference safely, use Dutch where required, and present all findings in organized, bullet-point markdown format. ${workflowInputAsText}`;
};

const createAgent = () =>
  new Agent({
    name: "My agent",
    instructions: myAgentInstructions,
    model: "o4-mini",
    tools: [webSearchPreview],
    modelSettings: {
      reasoning: {
        effort: "medium"
      },
      store: true
    }
  });

export const runWorkflow = async (workflow) => {
  return await withTrace("New agent", async () => {
    const conversationHistory = [
      { role: "user", content: [{ type: "input_text", text: workflow.input_as_text }] }
    ];
    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_696a206183308190a4fc4dcdcc102c680b6df1d4b1a183d7"
      }
    });
    const myAgentResultTemp = await runner.run(
      createAgent(),
      [...conversationHistory],
      {
        context: {
          workflowInputAsText: workflow.input_as_text
        }
      }
    );
    conversationHistory.push(...myAgentResultTemp.newItems.map((item) => item.rawItem));

    if (!myAgentResultTemp.finalOutput) {
      throw new Error("Agent result is undefined");
    }

    return {
      output_text: myAgentResultTemp.finalOutput ?? ""
    };
  });
};
