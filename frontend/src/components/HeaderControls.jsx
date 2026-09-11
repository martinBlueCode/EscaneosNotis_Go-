import React from 'react';
import { SeleccionarCarpeta } from '../../wailsjs/go/main/App';
import gatoImg from '../assets/gato.png';

export default function HeaderControls({
  config,
  onUpdateConfig,
  onRefreshFiles,
  onSendEscaneos,
  isSending,
  filesCount
}) {
  const handleSelectFolder = async (key) => {
    try {
      let selected = null;

      // Intentar abrir el diálogo nativo de Wails
      if (typeof SeleccionarCarpeta === 'function') {
        try {
          selected = await SeleccionarCarpeta(`Seleccionar carpeta para ${key.toUpperCase()}`);
        } catch (e) {
          console.warn('Wails dialog no disponible:', e);
        }
      }

      // Si se ejecuta en previsualización web y no devolvió carpeta nativa, solicitar mediante prompt
      if (!selected || typeof selected !== 'string' || selected.trim() === '') {
        const defaultPath = key === 'origen'
          ? 'C:\\Users\\LmartinezN\\Desktop\\DOCUMENTOS SSC'
          : key === 'destino'
          ? 'C:\\Expedientes_Prueba'
          : 'C:\\Users\\LmartinezN\\Documents\\CAMBIOS_SISTEMA\\RESPALDO';

        const inputPath = window.prompt(`Ingrese o pegue la ruta para ${key.toUpperCase()}:`, config[`ruta_${key}`] || defaultPath);
        if (inputPath && inputPath.trim() !== '') {
          selected = inputPath.trim();
        }
      }

      if (selected && selected.trim() !== '') {
        const newConfig = { ...config, [`ruta_${key}`]: selected };
        await onUpdateConfig(newConfig);
      }
    } catch (err) {
      console.error('Error seleccionando carpeta:', err);
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 shadow-sm flex flex-row items-center justify-between gap-3 overflow-x-auto">
      {/* Cat Icon + Folders (Origen, AC, Respaldo) */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Icono del Gato + Título de Versión */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <img
            src={gatoImg}
            alt="Gato Logo"
            className="w-10 h-10 object-contain flex-shrink-0"
          />
          <span className="font-extrabold text-sm text-slate-800 tracking-tight whitespace-nowrap bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
            Escaneos MB 0.2
          </span>
        </div>

        {/* Origen */}
        <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm flex-auto min-w-fit">
          <button
            onClick={() => handleSelectFolder('origen')}
            className="px-3.5 py-1.5 rounded-lg font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-95 flex-shrink-0 transition-all shadow-sm"
            title="Seleccionar carpeta de Origen"
          >
            Origen
          </button>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-mono font-semibold text-slate-700 whitespace-nowrap block" title={config.ruta_origen}>
              {config.ruta_origen || 'Seleccionar...'}
            </span>
          </div>
        </div>

        {/* AC */}
        <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm flex-auto min-w-fit">
          <button
            onClick={() => handleSelectFolder('destino')}
            className="px-3.5 py-1.5 rounded-lg font-bold text-sm text-white bg-red-600 hover:bg-red-700 active:scale-95 flex-shrink-0 transition-all shadow-sm"
            title="Seleccionar carpeta AC (Destino)"
          >
            AC
          </button>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-mono font-semibold text-slate-700 whitespace-nowrap block" title={config.ruta_destino}>
              {config.ruta_destino || 'C:\\Expedientes_Prueba'}
            </span>
          </div>
        </div>

        {/* Respaldo */}
        <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm flex-auto min-w-fit">
          <button
            onClick={() => handleSelectFolder('respaldo')}
            className="px-3.5 py-1.5 rounded-lg font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 flex-shrink-0 transition-all shadow-sm"
            title="Seleccionar carpeta de Respaldo"
          >
            Respaldo
          </button>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-mono font-semibold text-slate-700 whitespace-nowrap block" title={config.ruta_respaldo}>
              {config.ruta_respaldo || 'RESPALDO'}
            </span>
          </div>
        </div>
      </div>

      {/* Recargar + Count & Enviar Escaneos */}
      <div className="flex items-center space-x-3 flex-shrink-0">
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <button
            onClick={onRefreshFiles}
            className="btn-route btn-recargar shadow-sm active:scale-95 text-sm py-1 px-3"
            title="Recargar archivos de la carpeta origen"
          >
            Recargar
          </button>
          <span className="text-sm font-bold text-slate-600">
            {filesCount > 0 ? `${filesCount} archivo(s)` : '0 archivos'}
          </span>
        </div>

        <button
          onClick={onSendEscaneos}
          disabled={isSending}
          className={`px-5 py-2 rounded-xl font-bold text-sm text-white shadow-md transition-all flex-shrink-0 ${
            isSending
              ? 'bg-slate-300 border border-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 border border-emerald-700'
          }`}
        >
          {isSending ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Enviando...</span>
            </span>
          ) : (
            'Enviar Escaneos'
          )}
        </button>
      </div>
    </div>
  );
}

