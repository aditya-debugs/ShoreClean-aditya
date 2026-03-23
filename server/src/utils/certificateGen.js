// server/src/utils/certificateGen.js
// Generates a PDF certificate in-memory using jsPDF (server-side via canvas)
// jspdf uses canvas internally — works in Node with the canvas polyfill included in jspdf deps.

const { jsPDF } = require('jspdf');

/**
 * Generate a PDF certificate buffer.
 * @param {Object} opts
 * @param {string} opts.volunteerName
 * @param {string} opts.eventTitle
 * @param {Date|string} opts.eventDate
 * @param {string} opts.eventLocation
 * @param {Date|string} opts.issuedAt
 * @param {string} opts.certId
 * @returns {Buffer} PDF file buffer
 */
async function generateCertificatePDF({ volunteerName, eventTitle, eventDate, eventLocation, issuedAt, certId }) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const W = 297; // A4 landscape width mm
  const H = 210; // A4 landscape height mm

  // ── Background ──────────────────────────────────────────────────────────────
  // Deep ocean gradient — approximate with filled rects
  doc.setFillColor(2, 62, 138);        // #023E8A
  doc.rect(0, 0, W, H, 'F');

  doc.setFillColor(0, 119, 182);       // #0077B6
  doc.roundedRect(6, 6, W - 12, H - 12, 4, 4, 'F');

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 12, W - 24, H - 24, 3, 3, 'F');

  // ── Top accent stripe ───────────────────────────────────────────────────────
  doc.setFillColor(0, 180, 216);       // #00B4D8 cyan
  doc.rect(12, 12, W - 24, 6, 'F');

  doc.setFillColor(0, 119, 182);
  doc.rect(12, 18, W - 24, 2, 'F');

  // ── Bottom accent stripe ────────────────────────────────────────────────────
  doc.setFillColor(0, 180, 216);
  doc.rect(12, H - 18, W - 24, 6, 'F');

  doc.setFillColor(0, 119, 182);
  doc.rect(12, H - 20, W - 24, 2, 'F');

  // ── Header: Organisation name ───────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 119, 182);
  doc.text('SHORECLEAN', W / 2, 32, { align: 'center' });

  // ── Divider ─────────────────────────────────────────────────────────────────
  doc.setDrawColor(0, 180, 216);
  doc.setLineWidth(0.5);
  doc.line(40, 36, W - 40, 36);

  // ── Main Title ──────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(2, 62, 138);
  doc.text('Certificate of Participation', W / 2, 56, { align: 'center' });

  // ── Sub text ─────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('This is to proudly certify that', W / 2, 70, { align: 'center' });

  // ── Volunteer Name ───────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(28);
  doc.setTextColor(0, 119, 182);
  doc.text(volunteerName || 'Volunteer', W / 2, 88, { align: 'center' });

  // Name underline
  const nameWidth = doc.getTextWidth(volunteerName || 'Volunteer');
  doc.setDrawColor(0, 180, 216);
  doc.setLineWidth(0.7);
  doc.line(W / 2 - nameWidth / 2, 91, W / 2 + nameWidth / 2, 91);

  // ── Body text ────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text('has successfully participated as a volunteer in the coastal cleanup event', W / 2, 102, { align: 'center' });

  // ── Event Name ───────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(2, 62, 138);
  doc.text(`"${eventTitle || 'Coastal Cleanup Event'}"`, W / 2, 116, { align: 'center' });

  // ── Event details row ────────────────────────────────────────────────────────
  const evDate = eventDate ? new Date(eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const evLoc  = eventLocation || '';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);

  if (evDate && evLoc) {
    doc.text(`📅  ${evDate}     📍  ${evLoc}`, W / 2, 127, { align: 'center' });
  } else if (evDate) {
    doc.text(`📅  ${evDate}`, W / 2, 127, { align: 'center' });
  }

  // ── Appreciation line ────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(
    'In recognition of your dedication to protecting our coastlines and oceans.',
    W / 2, 140, { align: 'center' }
  );

  // ── Divider ──────────────────────────────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(40, 147, W - 40, 147);

  // ── Footer: Issue date + Certificate ID ──────────────────────────────────────
  const issueDate = issuedAt ? new Date(issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Issued on: ${issueDate}`, 40, 158);
  doc.text(`Certificate ID: ${certId || 'N/A'}`, 40, 164);

  // Signature line (right side)
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.4);
  doc.line(W - 100, 160, W - 40, 160);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(2, 62, 138);
  doc.text('ShoreClean Organization', W - 70, 165, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Authorized Signature', W - 70, 170, { align: 'center' });

  // ── Wave decoration (simple arc approximation using lines) ───────────────────
  doc.setDrawColor(0, 180, 216);
  doc.setLineWidth(0.3);
  for (let x = 12; x < W - 12; x += 8) {
    doc.line(x, H - 26, x + 4, H - 24);
    doc.line(x + 4, H - 24, x + 8, H - 26);
  }

  // Return as buffer
  const pdfArrayBuffer = doc.output('arraybuffer');
  return Buffer.from(pdfArrayBuffer);
}

// Legacy shim (used by old code)
async function generateCertificate({ eventId, userId }) {
  return `${process.env.CLIENT_URL || 'http://localhost:3000'}/certificates/placeholder.pdf`;
}

module.exports = { generateCertificatePDF, generateCertificate };
