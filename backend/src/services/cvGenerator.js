const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Generate an ATS-friendly CV PDF from tailored CV data
 */
function generateCVPdf(cvData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const colors = {
        primary: '#1a1a2e',
        secondary: '#4f46e5',
        text: '#1f2937',
        muted: '#6b7280',
        divider: '#e5e7eb',
      };

      // ── Header: Name & Contact ──
      doc.fontSize(22).fillColor(colors.primary).text(cvData.name || 'Candidate Name', { align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(11).fillColor(colors.secondary).text(cvData.title || '', { align: 'center' });
      doc.moveDown(0.3);

      const contactParts = [];
      if (cvData.email) contactParts.push(cvData.email);
      if (cvData.phone) contactParts.push(cvData.phone);
      if (cvData.linkedin) contactParts.push(cvData.linkedin);
      if (contactParts.length) {
        doc.fontSize(9).fillColor(colors.muted).text(contactParts.join('  •  '), { align: 'center' });
      }
      doc.moveDown(0.5);

      // Divider
      drawDivider(doc, colors.divider);

      // ── Summary ──
      if (cvData.summary) {
        sectionHeader(doc, 'PROFESSIONAL SUMMARY', colors);
        doc.fontSize(9.5).fillColor(colors.text).text(cvData.summary, { lineGap: 2 });
        doc.moveDown(0.5);
      }

      // ── Skills ──
      if (cvData.skills && cvData.skills.length > 0) {
        sectionHeader(doc, 'SKILLS', colors);
        doc.fontSize(9.5).fillColor(colors.text).text(cvData.skills.join('  •  '), { lineGap: 2 });
        doc.moveDown(0.5);
      }

      // ── Experience ──
      if (cvData.experience && cvData.experience.length > 0) {
        sectionHeader(doc, 'EXPERIENCE', colors);
        cvData.experience.forEach((exp, idx) => {
          doc.fontSize(10).fillColor(colors.primary).font('Helvetica-Bold')
            .text(`${exp.title || 'Role'}`, { continued: true })
            .font('Helvetica').fillColor(colors.muted)
            .text(`  |  ${exp.company || ''}  |  ${exp.startDate || ''} – ${exp.endDate || 'Present'}`);

          if (exp.bullets && exp.bullets.length > 0) {
            doc.moveDown(0.2);
            exp.bullets.forEach(bullet => {
              doc.fontSize(9).fillColor(colors.text).text(`• ${bullet}`, { indent: 12, lineGap: 1.5 });
            });
          }
          if (idx < cvData.experience.length - 1) doc.moveDown(0.4);
        });
        doc.moveDown(0.5);
      }

      // ── Education ──
      if (cvData.education && cvData.education.length > 0) {
        sectionHeader(doc, 'EDUCATION', colors);
        cvData.education.forEach(edu => {
          doc.fontSize(10).fillColor(colors.primary).font('Helvetica-Bold')
            .text(edu.degree || '', { continued: true })
            .font('Helvetica').fillColor(colors.muted)
            .text(`  |  ${edu.institution || ''}  |  ${edu.year || ''}`);
        });
        doc.moveDown(0.5);
      }

      // ── Projects ──
      if (cvData.projects && cvData.projects.length > 0) {
        sectionHeader(doc, 'PROJECTS', colors);
        cvData.projects.forEach((proj, idx) => {
          doc.fontSize(10).fillColor(colors.primary).font('Helvetica-Bold')
            .text(proj.name || 'Project');
          doc.font('Helvetica');
          if (proj.description) {
            doc.fontSize(9).fillColor(colors.text).text(proj.description, { lineGap: 1.5 });
          }
          if (proj.technologies && proj.technologies.length > 0) {
            doc.fontSize(8.5).fillColor(colors.secondary).text(`Tech: ${proj.technologies.join(', ')}`);
          }
          if (idx < cvData.projects.length - 1) doc.moveDown(0.3);
        });
      }

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

function sectionHeader(doc, title, colors) {
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor(colors.secondary).font('Helvetica-Bold').text(title);
  doc.font('Helvetica');
  drawDivider(doc, colors.divider);
  doc.moveDown(0.2);
}

function drawDivider(doc, color) {
  const y = doc.y;
  doc.strokeColor(color).lineWidth(0.5)
    .moveTo(50, y).lineTo(545, y).stroke();
  doc.moveDown(0.3);
}

module.exports = { generateCVPdf };
