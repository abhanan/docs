'use client';
import { useState } from 'react';

/**
 * M4 — Export the finished card. Renders the target DOM node (the wall) to a
 * canvas via html2canvas, then downloads it as a PNG or a multi-page PDF via
 * jsPDF. Libraries are imported dynamically so they don't weigh down first load
 * and never run on the server.
 *
 * This is the natural spot for a future paywall: free to create/share, paid to
 * export or extend.
 */
export function ExportButton({
  targetId,
  filename = 'greeting-card',
}: {
  targetId: string;
  filename?: string;
}) {
  const [busy, setBusy] = useState<null | 'png' | 'pdf'>(null);
  const [error, setError] = useState<string | null>(null);

  async function render() {
    const node = document.getElementById(targetId);
    if (!node) throw new Error('Nothing to export yet.');
    const { default: html2canvas } = await import('html2canvas');
    return html2canvas(node, {
      backgroundColor: '#ffffff',
      scale: Math.min(2, window.devicePixelRatio || 1),
      useCORS: true, // load R2 images cross-origin into the canvas
      logging: false,
    });
  }

  async function exportPng() {
    setError(null);
    setBusy('png');
    try {
      const canvas = await render();
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf() {
    setError(null);
    setBusy('pdf');
    try {
      const canvas = await render();
      const { jsPDF } = await import('jspdf');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${filename}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={exportPng}
          disabled={busy !== null}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
        >
          {busy === 'png' ? 'Saving…' : 'Save as image'}
        </button>
        <button
          type="button"
          onClick={exportPdf}
          disabled={busy !== null}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
        >
          {busy === 'pdf' ? 'Saving…' : 'Download PDF'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
