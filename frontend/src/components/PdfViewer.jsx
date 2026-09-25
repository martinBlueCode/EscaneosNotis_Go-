import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ObtenerContenidoPDF } from '../../wailsjs/go/main/App';

// Configuración del worker de PDF.js
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url
  ).toString();
} catch (e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export default function PdfViewer({ selectedFile }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [pageObj, setPageObj] = useState(null);

  // Cargar el documento PDF y extraer ÚNICAMENTE la primera página
  useEffect(() => {
    let isMounted = true;

    if (!selectedFile) {
      setNumPages(0);
      setPageObj(null);
      setError(null);
      return;
    }

    const loadPdfPage1 = async () => {
      setLoading(true);
      setError(null);
      setPageObj(null);
      setNumPages(0);

      // Cancelar cualquier tarea de renderizado previa
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }

      try {
        let loadingTask = null;

        // Intentar primero cargar desde la URL del servidor interno /wails/file
        try {
          const fileUrl = `/wails/file?path=${encodeURIComponent(selectedFile.path)}`;
          loadingTask = pdfjsLib.getDocument({ url: fileUrl });
        } catch (urlErr) {
          // Fallback a base64 mediante ObtenerContenidoPDF
          const base64Data = await ObtenerContenidoPDF(selectedFile.path);
          if (!base64Data) {
            throw new Error('El archivo está vacío o no se pudo leer.');
          }
          loadingTask = pdfjsLib.getDocument({ data: atob(base64Data.replace(/^data:application\/pdf;base64,/, '')) });
        }

        const pdfDoc = await loadingTask.promise;

        if (!isMounted) return;

        setNumPages(pdfDoc.numPages);

        // EXTRAER ÚNICAMENTE LA PÁGINA 1
        const firstPage = await pdfDoc.getPage(1);
        if (isMounted) {
          setPageObj(firstPage);
        }
      } catch (err) {
        console.error('Error al cargar la página 1 del PDF:', err);

        // Si falló por URL local, intentar con Base64 como último recurso
        try {
          const base64Data = await ObtenerContenidoPDF(selectedFile.path);
          if (base64Data) {
            const raw = window.atob(base64Data.replace(/^data:application\/pdf;base64,/, ''));
            const uint8Array = new Uint8Array(raw.length);
            for (let i = 0; i < raw.length; i++) {
              uint8Array[i] = raw.charCodeAt(i);
            }
            const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
            const pdfDoc = await loadingTask.promise;
            if (isMounted) {
              setNumPages(pdfDoc.numPages);
              const firstPage = await pdfDoc.getPage(1);
              setPageObj(firstPage);
              setLoading(false);
              return;
            }
          }
        } catch (fallbackErr) {
          console.error('Error fallback PDF:', fallbackErr);
        }

        if (isMounted) {
          setError('No se pudo cargar la vista previa del archivo PDF.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPdfPage1();

    return () => {
      isMounted = false;
    };
  }, [selectedFile]);

  // Renderizar la Página 1 en el Canvas cada vez que cambie la página, escala o rotación
  useEffect(() => {
    if (!pageObj || !canvasRef.current) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {}
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const viewport = pageObj.getViewport({ scale, rotation });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    const renderTask = pageObj.render(renderContext);
    renderTaskRef.current = renderTask;

    renderTask.promise.then(
      () => {
        renderTaskRef.current = null;
      },
      (error) => {
        if (error?.name !== 'RenderingCancelledException') {
          console.error('Error renderizando canvas PDF:', error);
        }
      }
    );

    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }
    };
  }, [pageObj, scale, rotation]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => {
    setScale(1.2);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

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
    <div className="flex-1 bg-slate-800 flex flex-col h-full overflow-hidden select-none">
      {/* Header bar del visor */}
      <div className="bg-slate-900 text-slate-200 px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center space-x-2 truncate max-w-sm">
          <span className="truncate">{selectedFile.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
          </span>
        </div>

        {/* Controles de Vista Previa (Página 1 + Zoom) */}
        <div className="flex items-center space-x-2">
          {numPages > 0 && (
            <span className="bg-blue-950/80 text-blue-300 border border-blue-700/60 px-2 py-0.5 rounded text-[11px] font-medium">
              Página 1 de {numPages} (Vista Previa)
            </span>
          )}

          <div className="flex items-center bg-slate-800 rounded border border-slate-700 overflow-hidden">
            <button
              onClick={handleZoomOut}
              title="Alejar (-)"
              className="px-2 py-1 hover:bg-slate-700 text-slate-300 font-bold transition"
            >
              -
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-300">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Acercar (+)"
              className="px-2 py-1 hover:bg-slate-700 text-slate-300 font-bold transition"
            >
              +
            </button>
            <button
              onClick={handleRotate}
              title="Rotar 90°"
              className="px-2 py-1 hover:bg-slate-700 text-slate-300 transition border-l border-slate-700"
            >
              ↻
            </button>
            <button
              onClick={handleResetZoom}
              title="Restablecer vista"
              className="px-2 py-1 hover:bg-slate-700 text-slate-300 text-[10px] uppercase font-bold transition border-l border-slate-700"
            >
              Ajustar
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor del Canvas */}
      <div className="flex-1 relative bg-slate-900 overflow-auto flex items-center justify-center p-4">
        {loading ? (
          <div className="flex flex-col items-center space-y-2 text-slate-300">
            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs font-medium">Generando vista previa (Página 1)...</span>
          </div>
        ) : error ? (
          <div className="text-red-400 text-xs font-medium bg-red-950/40 p-4 rounded-lg border border-red-800">
            {error}
          </div>
        ) : (
          <div className="shadow-2xl border border-slate-700 bg-white rounded transition-transform">
            <canvas ref={canvasRef} className="block" />
          </div>
        )}
      </div>
    </div>
  );
}
