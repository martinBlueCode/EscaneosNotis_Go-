import React, { useState, useEffect, useCallback } from 'react';
import Splash from './components/Splash';
import HeaderControls from './components/HeaderControls';
import LeftPanel from './components/LeftPanel';
import FileList from './components/FileList';
import PdfViewer from './components/PdfViewer';

import {
  VerificarLicencia,
  CargarConfiguracion,
  GuardarConfiguracion,
  ListarArchivosPDF,
  EnviarEscaneos,
  RenameFile,
  DeleteFile
} from '../wailsjs/go/main/App';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [licenseError, setLicenseError] = useState(null);

  // App configuration state
  const [config, setConfig] = useState({
    ruta_origen: '',
    ruta_destino: 'C:\\Expedientes_Prueba',
    ruta_respaldo: 'C:\\Users\\LmartinezN\\Documents\\CAMBIOS_SISTEMA\\RESPALDO'
  });

  // Expediente state (fiel al proyecto original)
  const [expedienteData, setExpedienteData] = useState({
    siglas: 'INVEACDMX',
    materia: '',
    folio: '',
    anio: '',
    fechaEjecucion: new Date().toISOString().split('T')[0],
    fechaResolucion: ''
  });

  // Classification state
  const [selectedType, setSelectedType] = useState('AD');
  const [selectedSubtype, setSelectedSubtype] = useState('');

  // Files & UI state
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sentExpedientes, setSentExpedientes] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Initialization phase
  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. License Check
        const licensed = await VerificarLicencia();
        if (!licensed) {
          setLicenseError('Acceso denegado: Licencia no autorizada.');
          setShowSplash(false);
          return;
        }

        // 2. Load Configuration
        const loadedCfg = await CargarConfiguracion();
        if (loadedCfg) {
          setConfig(loadedCfg);
        }

        // Hide splash screen after 1000ms
        setTimeout(() => {
          setShowSplash(false);
        }, 1000);

      } catch (err) {
        console.warn('Ejecutando en modo previsualización web:', err);
        // En modo previsualización de navegador, mostramos la interfaz gráfica completa
        setTimeout(() => {
          setShowSplash(false);
        }, 1000);
      }
    };

    initApp();
  }, []);

  // Fetch files whenever ruta_origen changes or refresh is requested
  const refreshFiles = useCallback(async (targetPathToSelect = null) => {
    if (!config.ruta_origen) return;
    try {
      const pdfList = await ListarArchivosPDF(config.ruta_origen);
      setFiles(pdfList || []);
      if (pdfList && pdfList.length > 0) {
        let match = null;
        if (targetPathToSelect) {
          match = pdfList.find((f) => f.path === targetPathToSelect);
        }
        if (!match && selectedFile) {
          match = pdfList.find((f) => f.path === selectedFile.path);
        }
        if (!match) {
          match = pdfList[0];
        }
        setSelectedFile(match);
        setSelectedFiles([match]);
      } else {
        setSelectedFile(null);
        setSelectedFiles([]);
      }
    } catch (err) {
      console.error('Error listando archivos PDF:', err);
    }
  }, [config.ruta_origen, selectedFile]);

  useEffect(() => {
    if (!showSplash && !licenseError && config.ruta_origen) {
      refreshFiles();
    }
  }, [showSplash, licenseError, config.ruta_origen]);

  const handleUpdateConfig = async (newConfig) => {
    setConfig(newConfig);
    try {
      await GuardarConfiguracion(newConfig);
    } catch (err) {
      console.error('Error guardando configuración:', err);
    }
  };

  const handleFileSelect = (file, isCtrl = false, isShift = false) => {
    if (!file) return;

    if (isShift && selectedFile) {
      const idx1 = files.findIndex(f => f.path === selectedFile.path);
      const idx2 = files.findIndex(f => f.path === file.path);
      if (idx1 !== -1 && idx2 !== -1) {
        const start = Math.min(idx1, idx2);
        const end = Math.max(idx1, idx2);
        const range = files.slice(start, end + 1);
        setSelectedFiles(range);
        setSelectedFile(file);
        return;
      }
    }

    if (isCtrl) {
      setSelectedFiles(prev => {
        const exists = prev.some(f => f.path === file.path);
        if (exists) {
          const updated = prev.filter(f => f.path !== file.path);
          setSelectedFile(updated.length > 0 ? updated[updated.length - 1] : null);
          return updated;
        } else {
          const updated = [...prev, file];
          setSelectedFile(file);
          return updated;
        }
      });
      return;
    }

    setSelectedFile(file);
    setSelectedFiles([file]);
  };

  const handleRenameFile = async (oldPath, newNameBase) => {
    try {
      const newPath = await RenameFile(oldPath, newNameBase);
      setStatusMessage({
        type: 'success',
        text: `Renombrado a: ${newPath.split(/[/\\]/).pop()}`
      });
      await refreshFiles(newPath);
    } catch (err) {
      console.error('Error al renombrar archivo:', err);
      alert(`Error al renombrar: ${err}`);
    }
  };

  const handleDeleteFile = async (file) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el archivo "${file.name}"?`)) return;
    try {
      await DeleteFile(file.path);
      setStatusMessage({ type: 'info', text: `Archivo eliminado: ${file.name}` });
      await refreshFiles();
    } catch (err) {
      console.error('Error al eliminar archivo:', err);
      alert(`Error al eliminar archivo: ${err}`);
    }
  };

  const handleSendEscaneos = async () => {
    const selFiles = selectedFiles.length > 0 ? selectedFiles : (selectedFile ? [selectedFile] : []);

    if (selFiles.length === 0) {
      alert('Por favor selecciona al menos un archivo para enviar.');
      return;
    }

    // 1. Validar rutas (AC y Respaldo)
    if (!config.ruta_destino || !config.ruta_respaldo) {
      alert('Falta seleccionar una de las rutas requeridas.\nDebes tener seleccionadas las rutas de AC y Respaldo para poder enviar los escaneos.');
      return;
    }

    // 2. Validar que TODOS los archivos hayan sido etiquetados/renombrados (YYYY-MM-DD-*.pdf)
    const patronTag = /^\d{4}-\d{2}-\d{2}[-].+\.pdf$/i;
    for (const f of selFiles) {
      if (!patronTag.test(f.name)) {
        if (selFiles.length === 1) {
          alert('Este archivo no ha sido etiquetado. Etiquétalo antes de enviarlo.');
        } else {
          alert('La selección contiene archivos sin etiquetar. Etiqueta todos los archivos antes de enviarlos.');
        }
        return;
      }
    }

    // 3. Validar expediente campos
    const siglas = expedienteData.siglas || 'INVEACDMX';
    const materia = expedienteData.materia;
    const folio = expedienteData.folio ? expedienteData.folio.trim() : '';
    const anio = expedienteData.anio;

    if (!materia || materia === '') {
      alert('Falta seleccionar la materia del expediente.');
      return;
    }
    if (!folio) {
      alert('El formato del expediente no es válido, ningún input del expediente puede ir vacío.');
      return;
    }
    if (!anio || anio === '') {
      alert('Falta seleccionar el año del expediente.');
      return;
    }

    // Construir formato de expediente: 4 partes para IO, 5 partes para otras materias
    let expedienteStr = '';
    let expedienteDisplayStr = '';
    if (materia === 'IO') {
      expedienteStr = `${siglas}/IO/${folio}/${anio}`;
      expedienteDisplayStr = `${siglas}-IO-${folio}-${anio}`;
    } else {
      expedienteStr = `${siglas}/OV/${materia}/${folio}/${anio}`;
      expedienteDisplayStr = `${siglas}-OV-${materia}-${folio}-${anio}`;
    }

    setIsSending(true);
    setStatusMessage({ type: 'info', text: 'Procesando y enviando escaneos a AC y Respaldo...' });

    try {
      const targetPaths = selFiles.map(f => f.path);
      const report = await EnviarEscaneos(expedienteStr, targetPaths);

      if (report && report.success) {
        setSentExpedientes(prev => [expedienteDisplayStr, ...prev.filter(e => e !== expedienteDisplayStr)]);
        setStatusMessage({
          type: 'success',
          text: report.message
        });
        alert(report.message);

        // Limpiar el folio a blanco como en Python
        setExpedienteData(prev => ({ ...prev, folio: '' }));
      } else {
        const errorMsg = report ? report.message : 'Error desconocido al enviar.';
        setStatusMessage({ type: 'error', text: errorMsg });
        alert(`Error al enviar: ${errorMsg}`);
      }

      await refreshFiles();
    } catch (err) {
      console.error('Error enviando escaneos:', err);
      setStatusMessage({
        type: 'error',
        text: `Error al enviar escaneos: ${err}`
      });
      alert(`Error al enviar escaneos: ${err}`);
    } finally {
      setIsSending(false);
    }
  };

  if (showSplash) {
    return <Splash />;
  }

  if (licenseError) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Error de Licencia</h1>
        <p className="text-slate-300 text-sm max-w-md mb-6">{licenseError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 font-bold rounded-lg text-sm transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-sans">
      {/* Top Controls Bar */}
      <HeaderControls
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onRefreshFiles={refreshFiles}
        onSendEscaneos={handleSendEscaneos}
        isSending={isSending}
        filesCount={files.length}
      />

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`px-4 py-2 text-xs font-semibold flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : statusMessage.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          <span className="whitespace-pre-line">{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-white/80 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Input & Classification Panel */}
        <LeftPanel
          expedienteData={expedienteData}
          onChangeExpediente={setExpedienteData}
          selectedType={selectedType}
          onSelectType={setSelectedType}
          selectedSubtype={selectedSubtype}
          onSelectSubtype={setSelectedSubtype}
          selectedFile={selectedFile}
          selectedFiles={selectedFiles}
          onRenameFile={handleRenameFile}
          sentExpedientes={sentExpedientes}
        />

        {/* Center File List */}
        <FileList
          files={files}
          selectedFile={selectedFile}
          selectedFiles={selectedFiles}
          onSelectFile={handleFileSelect}
          onDeleteFile={handleDeleteFile}
          onRenameFile={handleRenameFile}
        />

        {/* Right PDF Preview Viewer */}
        <PdfViewer selectedFile={selectedFile} />
      </div>
    </div>
  );
}
