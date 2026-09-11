import React, { useState, useEffect } from 'react';
import { ObtenerContenidoPDF } from '../../wailsjs/go/main/App';

export default function PdfViewer({ selectedFile }) {
  const [pdfDataUrl, setPdfDataUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!selectedFile) {
      setPdfDataUrl(null);
      return;
    }

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      try {
        let data = await ObtenerContenidoPDF(selectedFile.path);
        if (isMounted) {
          if (!data) {
            setError('El archivo PDF está vacío o no se pudo leer.');
            return;
          }
          const formattedUrl = data.startsWith('data:') ? data : `data:application/pdf;base64,${data}`;
          const urlWithFitParams = formattedUrl.includes('#') ? formattedUrl : `${formattedUrl}#view=FitV&toolbar=1&navpanes=0`;
          setPdfDataUrl(urlWithFitParams);
        }
      } catch (err) {
        console.error('Error cargando PDF:', err);
        if (isMounted) {
          setError('No se pudo cargar el archivo PDF seleccionado');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [selectedFile]);

  if (!selectedFile) {
    return (
      <div className="flex-1 bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-400 select-none">
        <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 21h10a2 2 0 002-2V7.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 1H7a2 2 0 00-2 2v16a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-semibold">Seleccione un archivo PDF de la lista para visualizarlo</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-800 flex flex-col h-full overflow-hidden">
      {/* Document header bar */}
      <div className="bg-slate-900 text-slate-200 px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-slate-700">
        <span className="truncate max-w-md">{selectedFile.name}</span>
        <span className="text-[10px] text-slate-400 font-mono">
          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
        </span>
      </div>

      <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center space-y-2 text-slate-300">
            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs font-medium">Cargando vista previa...</span>
          </div>
        ) : error ? (
          <div className="text-red-400 text-xs font-medium bg-red-950/40 p-4 rounded-lg border border-red-800">
            {error}
          </div>
        ) : pdfDataUrl ? (
          <iframe
            src={pdfDataUrl}
            title={selectedFile.name}
            className="w-full h-full border-none"
          />
        ) : null}
      </div>
    </div>
  );
}
