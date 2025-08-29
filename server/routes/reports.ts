import { RequestHandler } from 'express';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// POST /api/reports/generate
// Body: { reportConfig, results, cycleData, costAnalysis, sustainability, diagramDataUrl }
export const generateReportPdf: RequestHandler = async (req, res) => {
  console.log('[reports] generateReportPdf called', { path: req.path, method: req.method });
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      console.log('[reports] missing token');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      reportConfig,
      results,
      cycleData,
      costAnalysis,
      sustainability,
      diagramDataUrl,
      refrigerant,
      unitSystem,
    } = req.body as any;

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 portrait points

    const { width, height } = page.getSize();

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 40;
    let y = height - margin;

    const title = reportConfig?.projectName || 'Refrigeration Cycle Analysis Report';
    page.drawText(title, { x: margin, y: y - 10, size: 18, font: helveticaBold, color: rgb(0.06, 0.36, 1) });
    y -= 30;

    const meta = `Company: ${reportConfig?.companyName || '-'}   |   Engineer: ${reportConfig?.engineerName || '-'}   |   Date: ${new Date().toLocaleString()}`;
    page.drawText(meta, { x: margin, y: y - 6, size: 9, font: helvetica, color: rgb(0.27, 0.36, 0.42) });
    y -= 26;

    // Executive summary
    page.drawText('Executive Summary', { x: margin, y: y - 6, size: 12, font: helveticaBold, color: rgb(0.06, 0.06, 0.06) });
    y -= 18;
    const notes = reportConfig?.reportNotes || 'No additional notes provided.';
    const wrappedNotes = wrapText(notes, 80);
    wrappedNotes.forEach((line: string) => {
      page.drawText(line, { x: margin, y: y - 6, size: 10, font: helvetica, color: rgb(0, 0, 0) });
      y -= 14;
    });
    y -= 6;

    // Metrics
    page.drawText('Key Performance Metrics', { x: margin, y: y - 6, size: 12, font: helveticaBold });
    y -= 18;

    const cop = getValue(results, ['cop', 'COP', 'coefficient_of_performance']);
    const cooling = getValue(results, ['cooling_capacity_kw', 'cooling_capacity', 'capacity', 'Q_evap']);
    const work = getValue(results, ['compressor_power_kw', 'compressor_power', 'power', 'W_comp']);

    page.drawText(`COP: ${formatNumber(cop)}`, { x: margin, y: y - 6, size: 11, font: helvetica });
    page.drawText(`Cooling Capacity: ${formatNumber(cooling)} kW`, { x: margin + 200, y: y - 6, size: 11, font: helvetica });
    y -= 18;
    page.drawText(`Compressor Work: ${formatNumber(work)} kW`, { x: margin, y: y - 6, size: 11, font: helvetica });
    y -= 26;

    // Insert diagram if provided
    if (diagramDataUrl) {
      try {
        // Accept either data URL or raw base64
        const base64 = diagramDataUrl.startsWith('data:') ? diagramDataUrl.split(',')[1] : diagramDataUrl;
        const pngImage = await pdfDoc.embedPng(base64);
        const pngDims = pngImage.scale(0.5);
        const imgWidth = Math.min(pngDims.width, width - margin * 2);
        const imgHeight = (pngDims.height * imgWidth) / pngDims.width;
        // If not enough space, add new page
        if (y - imgHeight < margin) {
          const p2 = pdfDoc.addPage([595, 842]);
          y = p2.getSize().height - margin;
          p2.drawImage(pngImage, { x: margin, y: y - imgHeight, width: imgWidth, height: imgHeight });
          y = y - imgHeight - 16;
        } else {
          page.drawImage(pngImage, { x: margin, y: y - imgHeight, width: imgWidth, height: imgHeight });
          y = y - imgHeight - 16;
        }
      } catch (e) {
        console.error('Failed to embed diagram image into PDF', e);
      }
    }

    // Cost analysis table
    page.drawText('Cost Analysis', { x: margin, y: y - 6, size: 12, font: helveticaBold });
    y -= 18;
    if (costAnalysis) {
      page.drawText(`Annual Energy Cost: $${formatNumber(costAnalysis.annualEnergyCost)}`, { x: margin, y: y - 6, size: 11, font: helvetica });
      page.drawText(`Total Lifetime Cost: $${formatNumber(costAnalysis.totalLifetimeCost)}`, { x: margin + 260, y: y - 6, size: 11, font: helvetica });
      y -= 18;
      page.drawText(`Payback Period: ${formatNumber(costAnalysis.paybackPeriod)} years`, { x: margin, y: y - 6, size: 11, font: helvetica });
      y -= 18;
    } else {
      page.drawText('No cost analysis available', { x: margin, y: y - 6, size: 10, font: helvetica });
      y -= 18;
    }

    // Sustainability
    page.drawText('Sustainability', { x: margin, y: y - 6, size: 12, font: helveticaBold });
    y -= 18;
    if (sustainability) {
      page.drawText(`GWP: ${sustainability.gwp}`, { x: margin, y: y - 6, size: 11, font: helvetica });
      page.drawText(`ODP: ${sustainability.odp}`, { x: margin + 200, y: y - 6, size: 11, font: helvetica });
      y -= 18;
      page.drawText(`Recommended Alternatives: ${sustainability.alternative}`, { x: margin, y: y - 6, size: 11, font: helvetica });
      y -= 18;
    } else {
      page.drawText('No sustainability data available', { x: margin, y: y - 6, size: 10, font: helvetica });
      y -= 18;
    }

    // Recommendations
    page.drawText('Recommendations', { x: margin, y: y - 6, size: 12, font: helveticaBold });
    y -= 18;
    const recs = (req.body.recommendations || []) as string[];
    if (recs && recs.length > 0) {
      recs.forEach((r: string) => {
        const wrapped = wrapText(r, 80);
        wrapped.forEach((line: string) => {
          page.drawText(`- ${line}`, { x: margin, y: y - 6, size: 10, font: helvetica });
          y -= 12;
        });
        y -= 4;
      });
    } else {
      page.drawText('- No recommendations', { x: margin, y: y - 6, size: 10, font: helvetica });
      y -= 12;
    }

    // Finalize
    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${(reportConfig?.projectName || 'report').replace(/[^a-z0-9\-]/gi, '_')}.pdf"`);
    return res.status(200).send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('generateReportPdf error', err);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

function formatNumber(v: any) {
  if (v === undefined || v === null || isNaN(Number(v))) return 'N/A';
  return Number(v).toFixed(2);
}

function getValue(obj: any, keys: string[]) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && !isNaN(Number(obj[k]))) return Number(obj[k]);
  }
  // try case-insensitive
  const ks = Object.keys(obj || {});
  for (const k of ks) {
    for (const want of keys) {
      if (k.toLowerCase().includes(want.split('_')[0].toLowerCase())) {
        const val = obj[k];
        if (val !== undefined && val !== null && !isNaN(Number(val))) return Number(val);
      }
    }
  }
  return undefined;
}

function wrapText(text: string, maxChars: number) {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur.trim());
  return lines;
}
