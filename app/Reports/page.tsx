'use client';

import { useState } from 'react';

interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

async function buildPdf(reportId: string): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const colW = pageW - margin * 2;
  const generated = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  function header(title: string, subtitle?: string) {
    doc.setFillColor(34, 197, 94);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 14);
    if (subtitle) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, pageW - margin, 14, { align: 'right' });
    }
    doc.setTextColor(0, 0, 0);
    return 30;
  }

  function sectionTitle(y: number, text: string): number {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text(text, margin, y);
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(34, 197, 94);
    doc.line(margin, y + 1.5, margin + colW, y + 1.5);
    return y + 8;
  }

  function row(y: number, label: string, value: string, shade = false): number {
    if (shade) { doc.setFillColor(248, 250, 252); doc.rect(margin, y - 4, colW, 7, 'F'); }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 55, y);
    return y + 7;
  }

  function checkPage(y: number): number {
    if (y > 270) { doc.addPage(); return 20; }
    return y;
  }

  function footer() {
    const pages = (doc.internal as any).pages.length - 1;
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated ${generated} — Farm Management System`, margin, 291);
      doc.text(`Page ${i} of ${pages}`, pageW - margin, 291, { align: 'right' });
    }
  }

  if (reportId === 'harvest') {
    const [harvestRes, summaryRes] = await Promise.all([
      fetch('/api/Controllers/Harvest'),
      fetch('/api/Controllers/Harvest/summary'),
    ]);
    const { records = [] } = await harvestRes.json();
    const { summary } = await summaryRes.json();

    let y = header('Harvest Season Summary', generated);
    y = sectionTitle(y, 'Overview');

    if (summary) {
      y = row(y, 'Total Harvests', String(summary.totalHarvests), false);
      y = row(y, 'Distinct Crops', String(summary.distinctCrops), true);
      if (summary.totalYieldByUnit) {
        for (const [unit, total] of Object.entries(summary.totalYieldByUnit)) {
          y = row(y, `Total Yield (${unit})`, `${Number(total).toFixed(2)} ${unit}`, false);
        }
      }
    }

    y = checkPage(y + 5);
    y = sectionTitle(y, 'Harvest Records');

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      y = checkPage(y);
      const shade = i % 2 === 0;
      if (shade) { doc.setFillColor(248, 250, 252); doc.rect(margin, y - 4, colW, 7, 'F'); }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(r.cropName ?? '—', margin + 1, y);
      doc.setFont('helvetica', 'normal');
      doc.text(fmt(r.harvestDate), margin + 40, y);
      doc.text(`${Number(r.actualYield).toFixed(2)} ${r.yieldUnit}`, margin + 80, y);
      if (r.expectedYield != null) {
        const pct = ((r.actualYield - r.expectedYield) / r.expectedYield * 100);
        doc.setTextColor(pct >= 0 ? 34 : 220, pct >= 0 ? 197 : 38, pct >= 0 ? 94 : 38);
        doc.text(`${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, margin + 120, y);
        doc.setTextColor(0, 0, 0);
      }
      doc.text(r.qualityGrade ?? '—', margin + 145, y);
      y += 7;
    }

    footer();
    doc.save('harvest-summary.pdf');
    return;
  }

  if (reportId === 'soil') {
    const res = await fetch('/api/Controllers/Soil/soilTests');
    const soilTestsRaw = await res.json();
    const soilTests: any[] = Array.isArray(soilTestsRaw) ? soilTestsRaw : (soilTestsRaw.soilTests ?? []);

    let y = header('Soil Test History', generated);
    y = sectionTitle(y, `${soilTests.length} tests recorded`);

    for (let i = 0; i < soilTests.length; i++) {
      const t = soilTests[i];
      y = checkPage(y + 2);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 253, 244);
      doc.rect(margin, y - 4, colW, 8, 'F');
      doc.text(`${fmt(t.testDate)} — ${t.fieldLocation}`, margin + 1, y);
      doc.setFont('helvetica', 'normal');
      y += 8;
      doc.setFontSize(8);
      const cols = [
        `pH: ${Number(t.pH).toFixed(2)}`,
        `N: ${Number(t.nitrogen).toFixed(2)} mg/kg`,
        `P: ${Number(t.phosphorus).toFixed(2)} mg/kg`,
        `K: ${Number(t.potassium).toFixed(2)} mg/kg`,
        `OM: ${Number(t.organicMatter).toFixed(2)}%`,
        `Texture: ${t.texture}`,
      ];
      const cols2 = [
        t.calcium != null ? `Ca: ${Number(t.calcium).toFixed(2)} mg/kg` : '',
        t.magnesium != null ? `Mg: ${Number(t.magnesium).toFixed(2)} mg/kg` : '',
        t.sulfur != null ? `S: ${Number(t.sulfur).toFixed(2)} mg/kg` : '',
        t.cec != null ? `CEC: ${Number(t.cec).toFixed(2)} meq/100g` : '',
      ].filter(Boolean);
      doc.text(cols.slice(0, 3).join('   '), margin + 2, y);
      y += 5;
      doc.text(cols.slice(3).join('   '), margin + 2, y);
      if (cols2.length > 0) { y += 5; doc.text(cols2.join('   '), margin + 2, y); }
      y += 5;
      if (t.notes) { doc.setTextColor(100, 100, 100); doc.text(t.notes, margin + 2, y); doc.setTextColor(0, 0, 0); y += 5; }
      y += 3;
    }

    footer();
    doc.save('soil-test-history.pdf');
    return;
  }

  if (reportId === 'finance') {
    const [recordsRes, summaryRes] = await Promise.all([
      fetch('/api/Controllers/Finance'),
      fetch('/api/Controllers/Finance/summary'),
    ]);
    const { records = [] } = await recordsRes.json();
    const { summary } = await summaryRes.json();

    let y = header('Financial Season Report', generated);
    y = sectionTitle(y, 'Summary');

    if (summary) {
      if (summary.multipleCurrencies) {
        for (const b of (summary.byCurrency ?? [])) {
          y = row(y, `Revenue (${b.currency})`, `${b.currency} ${Number(b.revenue).toFixed(2)}`, false);
          y = row(y, `Expense (${b.currency})`, `${b.currency} ${Number(b.expense).toFixed(2)}`, true);
          y = row(y, `Net Profit (${b.currency})`, `${b.currency} ${Number(b.netProfit).toFixed(2)}`, false);
          y += 3;
        }
      } else {
        y = row(y, 'Total Revenue', `${records[0]?.currency ?? 'EUR'} ${Number(summary.totalRevenue ?? 0).toFixed(2)}`, false);
        y = row(y, 'Total Expense', `${records[0]?.currency ?? 'EUR'} ${Number(summary.totalExpense ?? 0).toFixed(2)}`, true);
        y = row(y, 'Net Profit', `${records[0]?.currency ?? 'EUR'} ${Number(summary.netProfit ?? 0).toFixed(2)}`, false);
      }
    }

    y = checkPage(y + 5);
    y = sectionTitle(y, 'Transactions');

    for (let i = 0; i < records.length; i++) {
      y = checkPage(y);
      const r = records[i];
      const shade = i % 2 === 0;
      if (shade) { doc.setFillColor(248, 250, 252); doc.rect(margin, y - 4, colW, 7, 'F'); }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(r.type === 'REVENUE' ? 34 : 220, r.type === 'REVENUE' ? 197 : 38, r.type === 'REVENUE' ? 94 : 38);
      doc.text(r.type, margin + 1, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text(r.category, margin + 22, y);
      doc.text(fmt(r.recordDate), margin + 60, y);
      doc.text(`${r.currency} ${Number(r.amount).toFixed(2)}`, margin + 95, y);
      if (r.description) doc.text(r.description.slice(0, 40), margin + 130, y);
      y += 7;
    }

    footer();
    doc.save('financial-report.pdf');
    return;
  }

  if (reportId === 'fertilization') {
    const res = await fetch('/api/Controllers/FertilizationPlan');
    const { plans = [] } = await res.json();

    let y = header('Fertilization Plan Summary', generated);
    y = sectionTitle(y, `${plans.length} plans recorded`);

    for (let i = 0; i < plans.length; i++) {
      const p = plans[i];
      y = checkPage(y);
      const shade = i % 2 === 0;
      if (shade) { doc.setFillColor(248, 250, 252); doc.rect(margin, y - 4, colW, 10, 'F'); }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(fmt(p.plannedDate), margin + 1, y);
      doc.setFont('helvetica', 'normal');
      doc.text(p.fertilizer ?? '—', margin + 35, y);
      doc.text(`${Number(p.applicationRate).toFixed(1)} kg/ha`, margin + 85, y);
      doc.text(p.applicationMethod ?? '—', margin + 115, y);
      doc.setTextColor(p.completed ? 34 : 180, p.completed ? 197 : 180, p.completed ? 94 : 180);
      doc.text(p.completed ? '✓ Done' : 'Pending', margin + 155, y);
      doc.setTextColor(0, 0, 0);
      y += 7;
      if (p.notes) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(p.notes, margin + 3, y);
        doc.setTextColor(0, 0, 0);
        y += 5;
      }
      y += 1;
    }

    footer();
    doc.save('fertilization-plan.pdf');
    return;
  }
}

const REPORTS: ReportDefinition[] = [
  {
    id: 'harvest',
    title: 'Harvest Season Summary',
    description: 'All harvest records with yield, quality grades, and variance vs expected yield.',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    icon: (
      <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    id: 'soil',
    title: 'Soil Test History',
    description: 'All soil test records with pH, N, P, K, organic matter, and texture per field.',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    icon: (
      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    id: 'finance',
    title: 'Financial Report',
    description: 'Revenue, expenses, and net profit summary with all transaction records.',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'fertilization',
    title: 'Fertilization Plan',
    description: 'All fertilization plan entries with dates, fertilizer, rate, method, and completion status.',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    icon: (
      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(reportId: string) {
    setGenerating(reportId);
    setError(null);
    try {
      await buildPdf(reportId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">Generate and download PDF reports for your farm data</p>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REPORTS.map(report => (
              <button
                key={report.id}
                onClick={() => generate(report.id)}
                disabled={generating !== null}
                className={`text-left rounded-xl border p-5 transition-colors ${report.color} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0">{report.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                    <p className="text-sm text-gray-600">{report.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      {generating === report.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          <span className="text-xs text-gray-600">Generating…</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span className="text-xs text-gray-600">Download PDF</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Note</p>
              <p>Reports include all data currently stored in your account. PDF files are generated in your browser and downloaded directly — no data is sent to any third-party service.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
