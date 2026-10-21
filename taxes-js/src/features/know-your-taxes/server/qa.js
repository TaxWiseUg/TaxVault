export function buildPacket(o, sources) {
  const lines = [
    `OBLIGATION: ${o.content.name} (${o.code})`,
    `STATUS FOR THIS USER: ${o.status}`,
    `DEFINITION: ${o.content.plainDefinition}`,
    `WHY IT APPLIES TO THIS USER:\n- ${o.why.join("\n- ")}`,
    `TRIGGERS:\n- ${o.content.triggers.join("\n- ")}`,
    `RATES/THRESHOLDS (rule ${o.rule.version}, verification: ${o.rule.verification}):\n- ${o.rateSummary.join("\n- ") || "none encoded"}`,
    o.estimate
      ? `ESTIMATE WORKINGS (estimate only, indicative=${o.estimate.indicativeOnly}):\n- ${o.estimate.workings.join("\n- ")}`
      : "ESTIMATE: none",
    o.workedExample ? `WORKED EXAMPLE:\n- ${o.workedExample.join("\n- ")}` : "",
    `RECORDS:\n- ${o.content.records.join("\n- ")}`,
    `DEADLINES:\n- ${o.content.deadlines.join("\n- ")}`,
    `HOW TO FILE/PAY:\n- ${o.content.channel.join("\n- ")}`,
    `CONSEQUENCES:\n- ${o.content.consequences.map((c) => `${c.text} (verification: ${c.verification})`).join("\n- ") || "none recorded"}`,
    `NEXT STEPS:\n- ${o.content.nextSteps.join("\n- ")}`,
    `MISSING INFO:\n- ${o.missing.join("\n- ") || "none"}`,
    `SOURCES:\n${sources.map((s) => `[S:${s.id}] ${s.title}${s.section ? ` ${s.section}` : ""} — ${s.url}${s.note ? ` (note: ${s.note})` : ""}`).join("\n")}`,
  ];
  return lines.filter(Boolean).join("\n\n");
}
const SYSTEM = `You are TaxWise's "Know Your Taxes" explainer for Ugandan taxpayers.
Answer ONLY from the CONTEXT PACKET. Do not use outside knowledge of tax rates, thresholds, deadlines, exemptions, penalties or procedures.
Rules:
- Plain English, short paragraphs, explain any tax term you use.
- Cite sources inline as [S:<id>] using only ids listed under SOURCES.
- Never state a number, percentage or date that is not in the packet.
- If anything is marked NEEDS_VERIFICATION, say the figure is pending verification.
- If the packet doesn't answer the question (e.g. how to correct a filed return, a specific exemption), say so plainly and recommend a qualified tax professional or URA. Do not guess.
- Amounts are estimates, never confirmed liabilities.`;
const NUM = /\d[\d,]*(?:\.\d+)?/g;
const norm = (s) => s.replace(/,/g, "");
export function verifyAnswer(answer, packet, allowedIds) {
  const packetNums = new Set((packet.match(NUM) ?? []).map(norm));
  const cited = [...answer.matchAll(/\[S:([A-Z0-9-]+)\]/g)].map((m) => m[1]);
  const bad = cited.find((id) => !allowedIds.has(id));
  if (bad) return { ok: false, cited, reason: `unknown source ${bad}` };
  const stray = (answer.replace(/\[S:[^\]]+\]/g, "").match(NUM) ?? []).map(norm).find((n) => !packetNums.has(n));
  if (stray) return { ok: false, cited, reason: `number not in packet: ${stray}` };
  return { ok: true, cited };
}
/** Deterministic answers used when the model is unavailable or fails verification. */
export function fallbackAnswer(o, question) {
  const q = question.toLowerCase();
  const pick = (title, items) => `${title}\n${items.map((x) => `• ${x}`).join("\n")}`;
  if (/why/.test(q)) return pick("Why this may apply to you:", o.why);
  if (/calculat|how much|amount/.test(q))
    return o.estimate
      ? pick(
          `How the estimate was worked out${o.estimate.indicativeOnly ? " (indicative — rates pending verification)" : ""}:`,
          o.estimate.workings,
        )
      : pick(
          "We couldn't estimate an amount. What's needed:",
          o.missing.length ? o.missing : (o.workedExample ?? ["See the rates section."]),
        );
  if (/document|record|keep/.test(q)) return pick("Records to keep:", o.content.records);
  if (/deadline|when|late|miss/.test(q))
    return pick("Deadlines and consequences:", [...o.content.deadlines, ...o.content.consequences.map((c) => c.text)]);
  if (/guidance|source|law|where/.test(q))
    return "See the legal sources listed with this obligation. Links go to the official URA, Parliament or ULII pages.";
  return "TaxWise's verified rules don't cover that question. Please consult a qualified tax professional or URA directly — we'd rather not guess on your tax position.";
}
export async function answerQuestion(o, sources, question) {
  const packet = buildPacket(o, sources);
  const allowed = new Set(sources.map((s) => s.id));
  const cite = (ids) => sources.filter((s) => ids.includes(s.id)).map(({ id, title, url }) => ({ id, title, url }));
  const fallback = () => ({
    answer: fallbackAnswer(o, question),
    citations: cite(o.content.legalBasis),
    grounded: false,
    mode: "fallback",
  });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallback();
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.KYT_MODEL ?? "claude-sonnet-5-5",
        max_tokens: 700,
        temperature: 0,
        system: SYSTEM,
        messages: [{ role: "user", content: `CONTEXT PACKET:\n${packet}\n\nQUESTION: ${question}` }],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return fallback();
    const data = await res.json();
    const text = (data.content ?? [])
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("")
      .trim();
    const check = verifyAnswer(text, packet + "\n" + question, allowed);
    if (!text || !check.ok) return fallback();
    const uncertain = /professional|not covered|don't cover|pending verification/i.test(text);
    return {
      answer: text,
      citations: cite(check.cited.length ? check.cited : o.content.legalBasis),
      grounded: !uncertain,
      mode: "model",
    };
  } catch {
    return fallback();
  }
}
