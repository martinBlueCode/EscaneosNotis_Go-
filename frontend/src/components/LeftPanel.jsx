import React, { useState } from 'react';

const getTodayLocalDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function LeftPanel({
  expedienteData,
  onChangeExpediente,
  selectedType,
  onSelectType,
  selectedSubtype,
  onSelectSubtype,
  selectedFile,
  selectedFiles,
  onRenameFile,
  sentExpedientes = []
}) {
  const [activeTab, setActiveTab] = useState('AD'); // 'AD' or 'RE'

  const materiasOptions = ["", "DU", "MP", "IO", "A", "AFO", "DUYUS", "MOBUR"];
  const siglasOptions = ["INVEACDMX", "INVEADF"];
  
  const currentYear = new Date().getFullYear();
  const yearOptions = ["", ...Array.from({ length: 11 }, (_, i) => (currentYear - i).toString())];

  // Submenú AD (Acuerdos) - 7 opciones desde config.py
  const adSubmenu = [
    { label: "Oficio Comision NAC", sigla: "NAC-OC" },
    { label: "Acuerdo (fecha)", sigla: "NAC" },
    { label: "Razon NAC", sigla: "NAC-RA" },
    { label: "Citatorio NAC", sigla: "NAC-CT" },
    { label: "Citatorio instructivo NAC", sigla: "NAC-CI" },
    { label: "Cedula NAC", sigla: "NAC-CE" },
    { label: "Instructivo NAC", sigla: "NAC-IN" }
  ];

  // Submenú RE - Sección 1: Con Sanción (NCS) - 7 opciones
  const reSection1NCS = [
    { label: "Oficio Comision NCS", sigla: "NCS-OC" },
    { label: "Resolucion NCS (fecha)", sigla: "NCS" },
    { label: "Razon NCS", sigla: "NCS-RA" },
    { label: "Citatorio NCS", sigla: "NCS-CT" },
    { label: "Citatorio instructivo NCS", sigla: "NCS-CI" },
    { label: "Cedula NCS", sigla: "NCS-CE" },
    { label: "Instructivo NCS", sigla: "NCS-IN" }
  ];

  // Submenú RE - Sección 2: Sin Sanción (NSS) - 7 opciones
  const reSection2NSS = [
    { label: "Oficio Comision NSS", sigla: "NSS-OC" },
    { label: "Resolucion NSS (fecha)", sigla: "NSS" },
    { label: "Razon NSS", sigla: "NSS-RA" },
    { label: "Citatorio NSS", sigla: "NSS-CT" },
    { label: "Citatorio instructivo NSS", sigla: "NSS-CI" },
    { label: "Cedula NSS", sigla: "NSS-CE" },
    { label: "Instructivo NSS", sigla: "NSS-IN" }
  ];

  const handleInputChange = (field, value) => {
    let updatedData = { ...expedienteData, [field]: value };

    // Regla especial de Python: Si materia es "IO", se fija siglas a "INVEACDMX"
    if (field === 'materia' && value === 'IO') {
      updatedData.siglas = 'INVEACDMX';
    }

    // Regla de Folio/Número: solo dígitos, máx 4 caracteres, sin ceros a la izquierda
    if (field === 'folio') {
      let cleanVal = value.replace(/\D/g, '');
      if (cleanVal.length > 0) {
        cleanVal = cleanVal.replace(/^0+/, '');
      }
      if (cleanVal.length > 4) {
        cleanVal = cleanVal.slice(0, 4);
      }
      updatedData.folio = cleanVal;
    }

    onChangeExpediente(updatedData);
  };

  const handleSelectAD = () => {
    setActiveTab('AD');
    onSelectType('AD');
  };

  const handleSelectRE = () => {
    setActiveTab('RE');
    onSelectType('RE');
  };

  const esOpcionResolucionAcuerdo = (prefijoBoton, label) => {
    if (prefijoBoton === 'AD' && (label === 'Acuerdo (fecha)' || label === 'Acuerdo NAC/AC' || label === 'Acuerdo NAC/AD')) {
      return true;
    }
    if (prefijoBoton === 'RE' && (label === 'Resolucion NCS (fecha)' || label === 'Resolucion NSS (fecha)' || label === 'Resolucion NCS' || label === 'Resolucion NSS')) {
      return true;
    }
    return false;
  };

  const handleClassifySuboption = (prefijoBoton, item) => {
    onSelectType(prefijoBoton);
    onSelectSubtype(item.label);

    const selFiles = selectedFiles && selectedFiles.length > 0 ? selectedFiles : (selectedFile ? [selectedFile] : []);
    
    if (selFiles.length === 0) {
      alert('Por favor selecciona un archivo de la lista para renombrar.');
      return;
    }
    if (selFiles.length > 1) {
      alert('Selecciona solo 1 archivo para renombrar.');
      return;
    }

    const targetFile = selFiles[0];
    const requiereFechaRes = esOpcionResolucionAcuerdo(prefijoBoton, item.label);
    const fechaRes = expedienteData.fechaResolucion;

    if (requiereFechaRes && (!fechaRes || fechaRes.trim() === '')) {
      if (prefijoBoton === 'AD') {
        alert('Ingresa fecha de ACUERDO antes de renombrar.');
      } else if (prefijoBoton === 'RE') {
        alert('Ingresa fecha de RESOLUCION antes de renombrar.');
      } else {
        alert('Ingresa la Fecha de Resolución / Acuerdo antes de renombrar.');
      }
      return;
    }

    const fechaEjec = expedienteData.fechaEjecucion || getTodayLocalDate();
    const siglas = item.sigla;

    let nombreFinal = '';
    if (requiereFechaRes && fechaRes) {
      nombreFinal = `${fechaEjec}-${prefijoBoton}-${siglas}-${fechaRes}`;
    } else {
      nombreFinal = `${fechaEjec}-${prefijoBoton}-${siglas}`;
    }

    if (onRenameFile) {
      onRenameFile(targetFile.path, nombreFinal);
    }

    if (requiereFechaRes) {
      handleInputChange('fechaResolucion', '');
    }
  };

  return (
    <div className="w-[425px] bg-white border-r border-slate-200 p-4 flex flex-col h-full overflow-y-auto space-y-4 shadow-sm select-none">
      <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 uppercase tracking-wide">
        Expediente:
      </h2>

      {/* Expediente Form Selects & Inputs */}
      <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        {/* Siglas & Materia Dropdowns */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1">
              INVEA
            </label>
            <select
              value={expedienteData.siglas || 'INVEACDMX'}
              disabled={expedienteData.materia === 'IO'}
              onChange={(e) => handleInputChange('siglas', e.target.value)}
              className={`w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none ${
                expedienteData.materia === 'IO' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'text-slate-800'
              }`}
            >
              {siglasOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1">
              Materia
            </label>
            <select
              value={expedienteData.materia || ''}
              onChange={(e) => handleInputChange('materia', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {materiasOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === '' ? '-- Seleccionar --' : opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Folio & Año */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1">
              Número de Expediente
            </label>
            <input
              type="text"
              placeholder="ej. 655"
              value={expedienteData.folio || ''}
              onChange={(e) => handleInputChange('folio', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg font-extrabold text-blue-700 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1">
              Año
            </label>
            <select
              value={expedienteData.anio || ''}
              onChange={(e) => handleInputChange('anio', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {yearOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === '' ? '-- Seleccionar --' : opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date Picker (Únicamente Resolución / Acuerdo) */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[13px] font-bold text-amber-900 truncate">
              Fecha Resolución / Acuerdo:
            </label>
            {expedienteData.fechaResolucion && (
              <button
                type="button"
                onClick={() => handleInputChange('fechaResolucion', '')}
                className="text-xs font-bold text-red-600 hover:text-red-800 underline"
                title="Borrar fecha de resolución"
              >
                Borrar
              </button>
            )}
          </div>
          <input
            type="date"
            value={expedienteData.fechaResolucion || ''}
            onChange={(e) => handleInputChange('fechaResolucion', e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-amber-500 rounded-lg font-bold text-amber-900 bg-amber-50 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Primary Classification Buttons AD / RE */}
      <div className="pt-1">
        <label className="block text-[13px] font-bold text-slate-700 mb-2">
          Renombrar:
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleSelectAD}
            className={`btn-big-class transition-all ${
              activeTab === 'AD' && selectedType === 'AD'
                ? 'bg-[#E8413A] text-white ring-4 ring-red-300 border-2 border-red-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-300'
            }`}
          >
            AD
          </button>
          <button
            type="button"
            onClick={handleSelectRE}
            className={`btn-big-class transition-all ${
              activeTab === 'RE' || selectedType === 'RE'
                ? 'bg-[#CF1E64] text-white ring-4 ring-pink-300 border-2 border-pink-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-300'
            }`}
          >
            RE
          </button>
        </div>
      </div>

      {/* Submenu for AD (Acuerdos) */}
      {activeTab === 'AD' && (
        <div className="space-y-2 pt-2 border-t border-slate-200 animate-fadeIn">
          <div className="p-2 rounded-xl border border-blue-200 bg-blue-50/80 space-y-1">
            <span className="block text-xs font-black tracking-wider text-blue-900 uppercase mb-1">
              Opciones Acuerdos (AD)
            </span>
            <div className="space-y-[1px]">
              {adSubmenu.map((item) => (
                <button
                  key={item.sigla}
                  type="button"
                  onClick={() => handleClassifySuboption('AD', item)}
                  className={`w-full text-left px-2 py-[2px] rounded-md text-[14px] font-bold transition-all flex items-center justify-between ${
                    selectedSubtype === item.label
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-950 hover:bg-blue-200/70'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`text-[13px] font-mono font-bold px-1.5 py-[1px] rounded ${
                    selectedSubtype === item.label
                      ? 'bg-blue-800 text-white'
                      : 'bg-blue-100/90 text-blue-900'
                  }`}>
                    {item.sigla}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submenu for RE (Resoluciones) */}
      {activeTab === 'RE' && (
        <div className="space-y-2.5 pt-2 border-t border-slate-200 animate-fadeIn">
          {/* Section 1: Resoluciones con Sanción (NCS) */}
          <div className="p-2 rounded-xl border border-pink-200 bg-pink-15 space-y-1">
            <span className="block text-xs font-black tracking-wider text-pink-900 uppercase mb-1">
              Resoluciones con Sanción (NCS)
            </span>
            <div className="space-y-[1px]">
              {reSection1NCS.map((item) => (
                <button
                  key={item.sigla}
                  type="button"
                  onClick={() => handleClassifySuboption('RE', item)}
                  className={`w-full text-left px-2 py-[2px] rounded-md text-[14px] font-bold transition-all flex items-center justify-between ${
                    selectedSubtype === item.label
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'text-pink-950 hover:bg-pink-200/60'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`text-[13px] font-mono font-bold px-1.5 py-[1px] rounded ${
                    selectedSubtype === item.label
                      ? 'bg-pink-800 text-white'
                      : 'bg-pink-200/90 text-pink-950'
                  }`}>
                    {item.sigla}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Resoluciones sin Sanción (NSS) */}
          <div className="p-2 rounded-xl border border-amber-200 bg-yellow-15 space-y-1">
            <span className="block text-xs font-black tracking-wider text-amber-900 uppercase mb-1">
              Resoluciones sin Sanción (NSS)
            </span>
            <div className="space-y-[1px]">
              {reSection2NSS.map((item) => (
                <button
                  key={item.sigla}
                  type="button"
                  onClick={() => handleClassifySuboption('RE', item)}
                  className={`w-full text-left px-2 py-[2px] rounded-md text-[14px] font-bold transition-all flex items-center justify-between ${
                    selectedSubtype === item.label
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-950 hover:bg-amber-200/60'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`text-[13px] font-mono font-bold px-1.5 py-[1px] rounded ${
                    selectedSubtype === item.label
                      ? 'bg-amber-800 text-white'
                      : 'bg-amber-200/90 text-amber-950'
                  }`}>
                    {item.sigla}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sent Expedientes Summary Badge */}
      <div className="mt-auto pt-3 border-t border-slate-200 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
        <span className="block text-xs uppercase tracking-wider font-black text-emerald-800 mb-1">
          Enviados:
        </span>
        {sentExpedientes && sentExpedientes.length > 0 ? (
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {sentExpedientes.map((item, idx) => {
              const expName = typeof item === 'object' ? item.expediente : item;
              const fecha = typeof item === 'object' && item.fecha_envio ? item.fecha_envio : '';
              const rutas = typeof item === 'object' && item.rutas_detalle ? item.rutas_detalle : (typeof item === 'object' && item.rutasDetalle ? item.rutasDetalle : []);

              let tooltipLines = [`Expediente: ${expName}`];
              if (fecha) tooltipLines.push(`Fecha de envío: ${fecha}`);
              if (rutas && rutas.length > 0) {
                tooltipLines.push(`\nRutas donde fue colocado:\n• ${rutas.join('\n• ')}`);
              }
              const tooltipText = tooltipLines.join('\n');

              return (
                <div
                  key={idx}
                  title={tooltipText}
                  className="text-xs font-mono font-black text-emerald-950 block break-all bg-emerald-100/70 hover:bg-emerald-200/90 px-2 py-1 rounded-md cursor-help transition-all shadow-xs border border-emerald-300/60"
                >
                  {idx + 1}. {expName} {fecha && <span className="text-[10px] font-normal text-slate-500 float-right ml-1">{fecha.split(' ')[0]}</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-sm font-semibold text-slate-400 block">
            Ninguno
          </span>
        )}
      </div>
    </div>
  );
}
