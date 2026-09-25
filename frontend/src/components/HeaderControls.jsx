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

      if (typeof SeleccionarCarpeta === 'function') {
        try {
          selected = await SeleccionarCarpeta(`Seleccionar carpeta para ${key.toUpperCase()}`);
        } catch (e) {
          console.warn('Wails dialog no disponible:', e);
        }
      }

      if (!selected || typeof selected !== 'string' || selected.trim() === '') {
        const defaultPath = key === 'origen'
          ? 'C:\\Users\\LmartinezN\\Desktop\\DOCUMENTOS SSC'
          : key === 'destino'
          ? 'C:\\Expedientes_Prueba'
          : key === 'respaldo'
          ? 'C:\\Users\\LmartinezN\\Documents\\CAMBIOS_SISTEMA\\RESPALDO'
          : '';

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

  const handleClearFolder = async (key) => {
    try {
      const newConfig = { ...config, [`ruta_${key}`]: '' };
      await onUpdateConfig(newConfig);
    } catch (err) {
      console.error('Error limpiando carpeta:', err);
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 shadow-sm flex flex-col gap-2">
      {/* FILA 1: Logo + Origen | AC (Izquierda) --- Recargar | Enviar Escaneos (Derecha) */}
      <div className="flex flex-row items-center justify-between gap-3 w-full">
        {/* Lado Izquierdo: Logo + Origen + AC */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Logo del Gato */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <img
              src={gatoImg}
              alt="Gato Logo"
              className="w-9 h-9 object-contain flex-shrink-0"
            />
            <span className="font-extrabold text-xs text-slate-800 tracking-tight whitespace-nowrap bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
              Escaneos MB 0.8
            </span>
          </div>

          {/* Origen */}
          <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs flex-auto min-w-fit">
            <button
              onClick={() => handleSelectFolder('origen')}
              className="px-3 py-1 rounded-lg font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 active:scale-95 flex-shrink-0 transition-all shadow-xs"
              title="Seleccionar carpeta de Origen (Obligatoria)"
            >
              Origen
            </button>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-mono font-semibold text-slate-700 whitespace-nowrap block" title={config.ruta_origen}>
                {config.ruta_origen || 'No seleccionado'}
              </span>
            </div>
          </div>

          {/* AC */}
          <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs flex-auto min-w-fit">
            <button
              onClick={() => handleSelectFolder('destino')}
              className="px-3 py-1 rounded-lg font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 flex-shrink-0 transition-all shadow-xs"
              title="Seleccionar carpeta AC (Obligatoria)"
            >
              AC
            </button>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-mono font-semibold text-slate-700 whitespace-nowrap block" title={config.ruta_destino}>
                {config.ruta_destino || 'Por defecto'}
              </span>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Recargar + Enviar Escaneos */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="flex items-center space-x-2 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
            <button
              onClick={onRefreshFiles}
              className="btn-route btn-recargar shadow-xs active:scale-95 text-xs py-1 px-2.5 font-bold"
              title="Recargar archivos de la carpeta origen"
            >
              Recargar
            </button>
            <span className="text-xs font-bold text-slate-600">
              {filesCount > 0 ? `${filesCount} archivo(s)` : '0 archivos'}
            </span>
          </div>

          <button
            onClick={onSendEscaneos}
            disabled={isSending}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-md transition-all flex-shrink-0 ${
              isSending
                ? 'bg-slate-300 border border-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 border border-emerald-700'
            }`}
          >
            {isSending ? (
              <span className="flex items-center space-x-1.5">
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
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

      {/* FILA 2: Respaldo (Izquierda/Opcional) | Destino 2 (Izquierda/Opcional) */}
      <div className="flex flex-row items-center space-x-3 w-full">
        {/* Respaldo + ❌ */}
        <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs flex-1 min-w-0">
          <button
            onClick={() => handleSelectFolder('respaldo')}
            className="px-3 py-1 rounded-lg font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 active:scale-95 flex-shrink-0 transition-all shadow-xs"
            title="Seleccionar carpeta de Respaldo (Opcional)"
          >
            Respaldo
          </button>
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-700 whitespace-nowrap block truncate" title={config.ruta_respaldo}>
              {config.ruta_respaldo || 'No seleccionado'}
            </span>
            {config.ruta_respaldo && (
              <button
                onClick={() => handleClearFolder('respaldo')}
                className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 p-0.5 rounded transition-all font-bold text-xs"
                title="Cancelar / limpiar ruta de Respaldo"
              >
                ❌
              </button>
            )}
          </div>
        </div>

        {/* Destino 2 + ❌ */}
        <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs flex-1 min-w-0">
          <button
            onClick={() => handleSelectFolder('destino_2')}
            className="px-3 py-1 rounded-lg font-bold text-xs text-white bg-cyan-600 hover:bg-cyan-700 active:scale-95 flex-shrink-0 transition-all shadow-xs"
            title="Seleccionar carpeta Destino 2 (Opcional)"
          >
            Destino 2
          </button>
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-700 whitespace-nowrap block truncate" title={config.ruta_destino_2}>
              {config.ruta_destino_2 || 'No seleccionado'}
            </span>
            {config.ruta_destino_2 && (
              <button
                onClick={() => handleClearFolder('destino_2')}
                className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 p-0.5 rounded transition-all font-bold text-xs"
                title="Cancelar / limpiar ruta de Destino 2"
              >
                ❌
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}





