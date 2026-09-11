import React, { useState, useEffect, useRef } from 'react';

export default function FileList({ files, selectedFile, selectedFiles = [], onSelectFile, onDeleteFile, onRenameFile }) {
  const [editingPath, setEditingPath] = useState(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingPath && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingPath]);

  const isFileTagged = (file) => {
    if (file.isTagged !== undefined) return file.isTagged;
    return /^\d{4}-\d{2}-\d{2}[-].+\.pdf$/i.test(file.name);
  };

  const handleStartRename = (e, file) => {
    e.stopPropagation();
    setEditingPath(file.path);
    // Strip .pdf extension if present for editing ease
    const baseName = file.name.endsWith('.pdf') || file.name.endsWith('.PDF')
      ? file.name.slice(0, -4)
      : file.name;
    setEditName(baseName);
  };

  const handleSaveRename = (file) => {
    if (!editingPath) return;

    let trimmed = editName.trim();
    if (!trimmed) {
      setEditingPath(null);
      return;
    }

    // Always ensure .pdf extension
    if (!trimmed.toLowerCase().endsWith('.pdf')) {
      trimmed += '.pdf';
    }

    if (trimmed !== file.name && onRenameFile) {
      onRenameFile(file.path, trimmed);
    }
    setEditingPath(null);
  };

  const handleKeyDown = (e, file) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename(file);
    } else if (e.key === 'Escape') {
      setEditingPath(null);
    }
  };

  return (
    <div className="w-[415px] flex-shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-hidden select-none">
      <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Archivos ({files ? files.length : 0})
        </h3>
        <span className="text-xs font-bold text-slate-500">
          {files ? files.filter(isFileTagged).length : 0} etiquetado(s)
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {files && files.length > 0 ? (
          files.map((file) => {
            const isSelected = (selectedFile && selectedFile.path === file.path) || 
                               (selectedFiles && selectedFiles.some(f => f.path === file.path));
            const tagged = isFileTagged(file);
            const isEditing = editingPath === file.path;

            return (
              <div key={file.path} className="relative group">
                <button
                  type="button"
                  onClick={(e) => onSelectFile(file, e.ctrlKey || e.metaKey, e.shiftKey)}
                  onDoubleClick={(e) => handleStartRename(e, file)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start space-x-2 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-sm'
                      : tagged
                      ? 'bg-emerald-50/80 text-emerald-950 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-white' : tagged ? 'text-emerald-600' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      {isEditing ? (
                        <div className="flex items-center space-x-1 w-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            ref={inputRef}
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => handleSaveRename(file)}
                            onKeyDown={(e) => handleKeyDown(e, file)}
                            className="w-full px-2 py-0.5 text-sm border border-blue-400 rounded bg-white text-slate-900 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-400">.pdf</span>
                        </div>
                      ) : (
                        <span
                          className="font-semibold break-all text-[13px] leading-snug cursor-pointer"
                          title="Doble clic para editar el nombre del archivo"
                        >
                          {file.name}
                        </span>
                      )}
                      {tagged && !isEditing && (
                        <span className={`ml-1 text-[11px] px-1.5 py-0.5 rounded font-normal flex-shrink-0 ${isSelected ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-200 text-emerald-800'}`}>
                          Etiquetado
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                {onDeleteFile && (
                  <button
                    type="button"
                    title="Eliminar archivo"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file);
                    }}
                    className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-600 rounded"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 px-4 text-slate-400">
            <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <p className="text-xs font-medium">No hay archivos en la carpeta origen</p>
          </div>
        )}
      </div>
    </div>
  );
}
