import React from 'react';
import gatoImg from '../assets/gato.png';

export default function Splash() {
  return (
    <div className="fixed inset-0 bg-[#FDC717] flex flex-col items-center justify-center z-50 select-none">
      <div className="flex flex-col items-center">
        {/* Cat Logo 400x400px */}
        <div className="w-[400px] h-[400px] mb-4 shadow-2xl rounded-3xl overflow-hidden border-4 border-slate-900 bg-[#FDC717]">
          <img
            src={gatoImg}
            alt="Logo Gato"
            className="w-full h-full object-contain"
          />
        </div>

        <h1 className="text-3xl font-black text-slate-900 tracking-wide mb-3 uppercase">
          Etiquetado de Notificaciones
        </h1>
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm bg-yellow-500/30 px-4 py-1.5 rounded-full border border-slate-900/20">
          <svg className="animate-spin h-4 w-4 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Iniciando sistema y verificando licencia...</span>
        </div>
      </div>
    </div>
  );
}
