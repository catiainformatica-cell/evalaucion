import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportStatsToPdf(statsData, currentFilters = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Primary colors
  const primaryNavy = [10, 37, 64];
  const primaryBlue = [12, 135, 235];
  const textDark = [30, 41, 59];
  const textMuted = [100, 116, 139];

  // 1. Header Banner
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Decorative accent line
  doc.setFillColor(...primaryBlue);
  doc.rect(0, 27, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTITUTO UNIVERSITARIO JESÚS OBRERO (IUJO)', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Coordinación de la Carrera de Informática • Período Académico 2-2026', 14, 17);
  doc.text('INFORME INSTITUCIONAL DE EVALUACIÓN DEL DESEMPEÑO DOCENTE', 14, 23);

  // Date on top right
  const today = new Date().toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  doc.setFontSize(8);
  doc.text(`Fecha: ${today}`, pageWidth - 14, 11, { align: 'right' });
  doc.text('CONFIDENCIAL Y ANÓNIMO', pageWidth - 14, 17, { align: 'right' });

  // 2. Summary Overview Box
  let currentY = 36;
  const metrics = statsData.metricasGenerales || {};

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 3, 3, 'FD');

  doc.setTextColor(...textDark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Métricas Globales del Desempeño', 18, currentY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);

  // Column 1: Satisfaction Score
  doc.text('Índice de Satisfacción:', 18, currentY + 13);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text(`${metrics.promedioGlobal || 0} / 5.00`, 18, currentY + 20);

  // Column 2: Total Evaluations
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Evaluaciones Recibidas:', 75, currentY + 13);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`${metrics.totalRespuestas || 0} alumnos`, 75, currentY + 20);

  // Column 3: Participation rate
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Tasa de Participación:', 135, currentY + 13);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text(`${metrics.tasaParticipacion || 0}%`, 135, currentY + 20);

  // 3. Item-by-item Table (15 questions)
  currentY += 34;

  const tableRows = (statsData.itemStats || []).map((item) => [
    item.id,
    item.text,
    item.dimension,
    `${item.average} / 5`,
    `${item.distributionPercent?.[5] || 0}%`,
    `${item.distributionPercent?.[4] || 0}%`,
    `${item.distributionPercent?.[3] || 0}%`,
    `${item.distributionPercent?.[2] || 0}%`,
    `${item.distributionPercent?.[1] || 0}%`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Ítem Evaluado (Escala Likert)', 'Dimensión', 'Prom.', '5 pts', '4 pts', '3 pts', '2 pts', '1 pt']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryNavy,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      halign: 'center',
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7,
      textColor: textDark,
      cellPadding: 2,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 70 },
      2: { cellWidth: 32, fontStyle: 'italic' },
      3: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 12, halign: 'center' },
      8: { cellWidth: 12, halign: 'center' },
    },
    margin: { left: 14, right: 14 }
  });

  // 4. Anonymous Comments Section
  const comments = statsData.comentarios || [];
  if (comments.length > 0) {
    const finalY = doc.lastAutoTable.finalY + 10;
    
    // Check if new page is needed
    if (finalY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY = finalY;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryNavy);
    doc.text(`Observaciones Anónimas de los Estudiantes (${comments.length} registradas)`, 14, currentY);

    const commentRows = comments.map(c => [
      c.materia || 'Asignatura',
      c.texto
    ]);

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Materia / Sección', 'Comentario / Observación Anónima']],
      body: commentRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        fontSize: 7.5
      },
      styles: {
        fontSize: 7,
        cellPadding: 2.5
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 'auto' }
      },
      margin: { left: 14, right: 14 }
    });
  }

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `IUJO Informática • Reporte generado automáticamente • Página ${i} de ${totalPages} • Anonimato garantizado`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  doc.save(`Reporte_Evaluacion_Docente_IUJO_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportStatsToCsv(statsData) {
  const items = statsData.itemStats || [];
  if (items.length === 0) return;

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Item,Pregunta,Dimension,Promedio,5_Totalmente_De_Acuerdo,4_Parcialmente_De_Acuerdo,3_De_Acuerdo,2_Parcialmente_Desacuerdo,1_Totalmente_Desacuerdo\n';

  items.forEach(it => {
    const cleanText = `"${it.text.replace(/"/g, '""')}"`;
    const cleanDim = `"${it.dimension}"`;
    const row = [
      it.id,
      cleanText,
      cleanDim,
      it.average,
      it.distribution[5] || 0,
      it.distribution[4] || 0,
      it.distribution[3] || 0,
      it.distribution[2] || 0,
      it.distribution[1] || 0
    ].join(',');
    csvContent += row + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Estadisticas_IUJO_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
