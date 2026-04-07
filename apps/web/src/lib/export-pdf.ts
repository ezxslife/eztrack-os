import type { ReportResult } from "./queries/reports";

/**
 * Generate a PDF from report data using the browser's print-to-PDF.
 * Opens a clean print window with formatted report data, styled for PDF output.
 *
 * All content is built using DOM APIs (no innerHTML/document.write) to prevent XSS.
 * Works on all modern browsers without external dependencies.
 */
export function exportReportPDF(
  report: ReportResult,
  options: {
    title: string;
    dateRange?: string;
    orgName?: string;
  }
) {
  const { title, dateRange, orgName } = options;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Pop-up blocked. Please allow pop-ups for PDF export.");
  }

  const doc = printWindow.document;

  // Set title
  doc.title = `${title} - EZTrack Report`;

  // Add stylesheet
  const style = doc.createElement("style");
  style.textContent = `
    @page { size: landscape; margin: 0.5in; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a2e; font-size: 10px; line-height: 1.4; padding: 20px;
    }
    .header {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;
    }
    .header h1 { font-size: 18px; font-weight: 700; color: #1a1a2e; }
    .header .meta { text-align: right; font-size: 9px; color: #64748b; }
    .header .meta .org { font-weight: 600; font-size: 11px; color: #1a1a2e; }
    .stats-row { display: flex; gap: 12px; margin-bottom: 16px; }
    .stat-card {
      flex: 1; background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 6px; padding: 10px 12px; text-align: center;
    }
    .stat-value { font-size: 20px; font-weight: 700; color: #2563eb; }
    .stat-label {
      font-size: 9px; font-weight: 600; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;
    }
    .stat-sub { font-size: 8px; color: #94a3b8; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    thead th {
      background: #1e293b; color: #fff; padding: 6px 8px; text-align: left;
      font-weight: 600; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    tbody td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .footer {
      margin-top: 16px; padding-top: 8px; border-top: 1px solid #e2e8f0;
      display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8;
    }
    .record-count { font-size: 9px; color: #64748b; margin-bottom: 8px; }
    @media print { body { padding: 0; } }
  `;
  doc.head.appendChild(style);

  // ─── Header ────────────────────────────────────────────
  const header = doc.createElement("div");
  header.className = "header";

  const headerLeft = doc.createElement("div");
  const h1 = doc.createElement("h1");
  h1.textContent = title;
  headerLeft.appendChild(h1);
  if (dateRange) {
    const dateDiv = doc.createElement("div");
    dateDiv.style.cssText = "font-size: 10px; color: #64748b; margin-top: 4px;";
    dateDiv.textContent = dateRange;
    headerLeft.appendChild(dateDiv);
  }

  const headerRight = doc.createElement("div");
  headerRight.className = "meta";
  if (orgName) {
    const orgDiv = doc.createElement("div");
    orgDiv.className = "org";
    orgDiv.textContent = orgName;
    headerRight.appendChild(orgDiv);
  }
  const genDiv = doc.createElement("div");
  genDiv.textContent = `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  headerRight.appendChild(genDiv);
  const sysDiv = doc.createElement("div");
  sysDiv.textContent = "EZTrack Report System";
  headerRight.appendChild(sysDiv);

  header.appendChild(headerLeft);
  header.appendChild(headerRight);
  doc.body.appendChild(header);

  // ─── Stats Row ─────────────────────────────────────────
  const statsRow = doc.createElement("div");
  statsRow.className = "stats-row";
  for (const s of report.stats) {
    const card = doc.createElement("div");
    card.className = "stat-card";

    const val = doc.createElement("div");
    val.className = "stat-value";
    val.textContent = s.value;
    card.appendChild(val);

    const label = doc.createElement("div");
    label.className = "stat-label";
    label.textContent = s.label;
    card.appendChild(label);

    if (s.sub) {
      const sub = doc.createElement("div");
      sub.className = "stat-sub";
      sub.textContent = s.sub;
      card.appendChild(sub);
    }
    statsRow.appendChild(card);
  }
  doc.body.appendChild(statsRow);

  // ─── Record Count ──────────────────────────────────────
  const countDiv = doc.createElement("div");
  countDiv.className = "record-count";
  countDiv.textContent = `${report.rows.length} record${report.rows.length !== 1 ? "s" : ""}`;
  doc.body.appendChild(countDiv);

  // ─── Table ─────────────────────────────────────────────
  const table = doc.createElement("table");
  const thead = doc.createElement("thead");
  const headerRow = doc.createElement("tr");
  for (const col of report.columns) {
    const th = doc.createElement("th");
    th.textContent = col.label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = doc.createElement("tbody");
  for (const row of report.rows) {
    const tr = doc.createElement("tr");
    for (const col of report.columns) {
      const td = doc.createElement("td");
      td.textContent = String(row[col.key] ?? "-");
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  doc.body.appendChild(table);

  // ─── Footer ────────────────────────────────────────────
  const footer = doc.createElement("div");
  footer.className = "footer";
  const footerLeft = doc.createElement("span");
  footerLeft.textContent = `CONFIDENTIAL — ${orgName ?? "EZTrack"}`;
  const footerRight = doc.createElement("span");
  footerRight.textContent = "Page 1 of 1";
  footer.appendChild(footerLeft);
  footer.appendChild(footerRight);
  doc.body.appendChild(footer);

  // Trigger print dialog after content renders
  printWindow.addEventListener("load", () => printWindow.print());
  // Fallback: trigger print after a short delay
  setTimeout(() => printWindow.print(), 500);
}
