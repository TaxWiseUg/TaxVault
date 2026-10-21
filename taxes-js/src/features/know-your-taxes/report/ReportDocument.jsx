import React from "react";
import { Document, Link, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { ugx } from "../engine/calculators";
// "The Ledger" palette. Register Fraunces / Inter / IBM Plex Mono with Font.register()
// if your existing compliance report module already does — otherwise built-in fonts are used.
const C = {
  ink: "#14213D",
  muted: "#5B6475",
  line: "#D9D4C7",
  paper: "#FBF8F1",
  green: "#1F6F50",
  amber: "#B7791F",
  red: "#9B2C2C",
  blue: "#2B4C7E",
};
const STATUS = {
  LIKELY: { label: "Likely applicable", color: C.green },
  NEEDS_INFO: { label: "Potentially applicable — more information needed", color: C.amber },
  PROFESSIONAL_REVIEW: { label: "Requires professional review", color: C.blue },
  NOT_APPLICABLE: { label: "Not applicable on the information supplied", color: C.muted },
};
const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9.5, color: C.ink, backgroundColor: C.paper, fontFamily: "Helvetica", lineHeight: 1.45 },
  h1: { fontSize: 22, fontFamily: "Times-Bold", lineHeight: 1.2, marginTop: 4, marginBottom: 6 },
  h2: {
    fontSize: 13,
    fontFamily: "Times-Bold",
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  h3: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  muted: { color: C.muted },
  small: { fontSize: 8, color: C.muted },
  card: { borderWidth: 1, borderColor: C.line, borderRadius: 4, padding: 10, marginBottom: 8, backgroundColor: "#FFFFFF" },
  pill: {
    fontSize: 7.5,
    color: "#FFFFFF",
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  label: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  bullet: { flexDirection: "row", marginBottom: 1.5 },
  mono: { fontFamily: "Courier", fontSize: 8.5 },
  estimate: { marginTop: 6, padding: 6, backgroundColor: "#F3EFE4", borderLeftWidth: 2, borderLeftColor: C.amber },
  banner: { padding: 8, backgroundColor: "#FFF4DE", borderWidth: 1, borderColor: C.amber, borderRadius: 4, marginVertical: 8 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 7,
    color: C.muted,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
const Bullets = ({ items }) => (
  <View>
    {items.map((t, i) => (
      <View key={i} style={s.bullet} wrap={false}>
        <Text style={{ width: 10 }}>•</Text>
        <Text style={{ flex: 1 }}>{t}</Text>
      </View>
    ))}
  </View>
);
function ObligationBlock({ o, sources }) {
  const st = STATUS[o.status];
  return (
    // Cards may break across pages; individual lines, the header and the estimate box never split.
    <View style={s.card}>
      <View wrap={false}>
        <Text style={[s.pill, { backgroundColor: st.color }]}>{st.label}</Text>
        <Text style={s.h3}>{o.content.name}</Text>
        <Text style={s.muted}>{o.content.plainDefinition}</Text>
      </View>
      <Text style={s.label} minPresenceAhead={30}>
        Why it may apply to you
      </Text>
      <Bullets items={o.why} />
      {o.rateSummary.length > 0 && (
        <>
          <Text style={s.label} minPresenceAhead={30}>
            Rates & thresholds (rule {o.rule.version})
          </Text>
          <Bullets items={o.rateSummary} />
        </>
      )}
      {o.estimate && (
        <View style={s.estimate} wrap={false}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>
            ESTIMATE — not a confirmed liability: {ugx(o.estimate.amount)}{" "}
            {o.estimate.period === "MONTHLY" ? "per month" : "per year"}
            {o.estimate.indicativeOnly ? " (indicative: uses rates pending verification)" : ""}
          </Text>
          {o.estimate.workings.map((w, i) => (
            <Text key={i} style={s.mono}>
              {w}
            </Text>
          ))}
        </View>
      )}
      {o.workedExample && (
        <>
          <Text style={s.label} minPresenceAhead={30}>
            Worked example
          </Text>
          <Bullets items={o.workedExample} />
        </>
      )}
      {o.status !== "NOT_APPLICABLE" && (
        <>
          <Text style={s.label} minPresenceAhead={30}>
            Records to keep
          </Text>
          <Bullets items={o.content.records} />
          <Text style={s.label} minPresenceAhead={30}>
            Deadlines
          </Text>
          <Bullets items={o.content.deadlines} />
          <Text style={s.label} minPresenceAhead={30}>
            How to declare / pay
          </Text>
          <Bullets items={o.content.channel} />
          {o.content.consequences.length > 0 && (
            <>
              <Text style={s.label} minPresenceAhead={30}>
                If you don't comply
              </Text>
              <Bullets items={o.content.consequences.map((c) => c.text)} />
            </>
          )}
          <Text style={s.label} minPresenceAhead={30}>
            Next steps
          </Text>
          <Bullets items={o.content.nextSteps} />
        </>
      )}
      <Text style={s.label} minPresenceAhead={30}>
        Legal basis
      </Text>
      {o.content.legalBasis.map((id) => {
        const src = sources[id];
        return src ? (
          <Link key={id} src={src.url} style={{ color: C.blue, fontSize: 8.5 }}>
            {src.title}
            {src.section ? ` (${src.section})` : ""}
          </Link>
        ) : null;
      })}
    </View>
  );
}
export function ReportDocument({ result, sources, generatedAt }) {
  const by = (st) => result.obligations.filter((o) => o.status === st);
  return (
    <Document title="Know Your Taxes — TaxWise report" author="TaxWise">
      <Page size="A4" style={s.page}>
        <Text style={s.small}>TAXWISE · KNOW YOUR TAXES</Text>
        <Text style={s.h1}>Your tax obligations</Text>
        <Text style={s.muted}>
          Generated {generatedAt.toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" })} · Rules{" "}
          {result.ruleSetVersion} (as of {result.asOf}) · {result.engineVersion}
        </Text>

        <View style={s.banner}>
          <Text>
            This report explains which taxes may apply to you based on your answers. It is general information, not a tax ruling.
            All amounts are ESTIMATES, not confirmed liabilities.{" "}
            {result.unverifiedRuleCount > 0
              ? `${result.unverifiedRuleCount} rule(s) used here are pending verification against current legislation.`
              : ""}
          </Text>
        </View>

        <Text style={s.h2}>Your profile</Text>
        <Bullets items={result.profileSummary} />

        {result.upcomingDeadlines.length > 0 && (
          <>
            <Text style={s.h2}>Upcoming deadlines</Text>
            <Bullets items={result.upcomingDeadlines.map((d) => `${d.label}: ${d.text}`)} />
          </>
        )}

        {result.missingInformation.length > 0 && (
          <>
            <Text style={s.h2}>Information still needed</Text>
            <Bullets items={result.missingInformation} />
          </>
        )}

        <Text style={s.h2}>Recommended next steps</Text>
        <Bullets items={result.nextSteps} />

        {["LIKELY", "NEEDS_INFO", "PROFESSIONAL_REVIEW", "NOT_APPLICABLE"].map((st) =>
          by(st).length ? (
            <View key={st}>
              {/* minPresenceAhead keeps the heading off the bottom of a page. */}
              <Text style={s.h2} minPresenceAhead={160}>
                {STATUS[st].label}
              </Text>
              {by(st).map((o) => (
                <ObligationBlock key={o.code} o={o} sources={sources} />
              ))}
            </View>
          ) : null,
        )}

        <View style={s.footer} fixed>
          <Text>TaxWise · taxwise.cloud · Not a substitute for professional advice</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
export async function renderReportPdf(result, sources) {
  const map = Object.fromEntries(sources.map((x) => [x.id, x]));
  return renderToBuffer(<ReportDocument result={result} sources={map} generatedAt={new Date()} />);
}
