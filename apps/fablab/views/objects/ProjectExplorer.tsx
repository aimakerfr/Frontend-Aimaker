import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getProjectFile, getProjectTree, ProjectFileResponse, ProjectTreeNode } from '@core/objects';

const formatBytes = (value: number) => {
  if (!Number.isFinite(value)) return '';
  if (value < 1024) return `${value} B`;
  const kb = value / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const ProjectExplorer: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const projectName = (location.state as { name?: string } | undefined)?.name;

  const [tree, setTree] = useState<ProjectTreeNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [fileData, setFileData] = useState<ProjectFileResponse | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'code' | 'render'>('code');

  const canRender = useMemo(() => {
    return selectedPath.toLowerCase().endsWith('.html') || selectedPath.toLowerCase().endsWith('.htm');
  }, [selectedPath]);

  useEffect(() => {
    if (!id) return;
    setTreeLoading(true);
    setError(null);
    getProjectTree(id)
      .then((response) => {
        setTree(response.tree || []);
        const initial = new Set<string>();
        (response.tree || []).forEach((node) => {
          if (node.type === 'folder') {
            initial.add(node.path);
          }
        });
        setExpanded(initial);
      })
      .catch((err) => {
        setError(err?.message || 'No se pudo cargar el proyecto');
      })
      .finally(() => setTreeLoading(false));
  }, [id]);

  const handleSelectFile = useCallback((path: string) => {
    if (!id) return;
    setSelectedPath(path);
    setFileLoading(true);
    setError(null);
    getProjectFile(id, path)
      .then((response) => {
        setFileData(response);
      })
      .catch((err) => {
        setFileData(null);
        setError(err?.message || 'No se pudo leer el archivo');
      })
      .finally(() => setFileLoading(false));
  }, [id]);

  const toggleFolder = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const renderNode = useCallback((node: ProjectTreeNode, depth: number) => {
    const isFolder = node.type === 'folder';
    const isExpanded = expanded.has(node.path);
    const isActive = node.path === selectedPath;

    return (
      <div key={node.path}>
        <button
          type="button"
          onClick={() => (isFolder ? toggleFolder(node.path) : handleSelectFile(node.path))}
          className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg transition-colors ${
            isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100 text-gray-700'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <span className="text-xs text-gray-400">
            {isFolder ? (isExpanded ? '▾' : '▸') : '•'}
          </span>
          <span className={isFolder ? 'font-semibold text-sm' : 'text-sm'}>{node.name}</span>
        </button>
        {isFolder && isExpanded && node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }, [expanded, handleSelectFile, selectedPath, toggleFolder]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Objects Library</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            {projectName ? `Proyecto: ${projectName}` : 'Explorador de proyecto'}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/objects-library')}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Volver a objetos
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Carpetas</h2>
            {treeLoading && <span className="text-xs text-gray-400">Cargando...</span>}
          </div>
          {error && (
            <div className="text-xs text-red-500 mb-3">{error}</div>
          )}
          {!treeLoading && tree.length === 0 && !error && (
            <p className="text-xs text-gray-400">Sin archivos para mostrar.</p>
          )}
          <div className="space-y-1">
            {tree.map((node) => renderNode(node, 0))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col min-h-[520px]">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400">Archivo seleccionado</p>
              <p className="text-sm font-semibold text-gray-900">
                {selectedPath || 'Selecciona un archivo'}
              </p>
            </div>
            {selectedPath && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{fileData ? formatBytes(fileData.size) : ''}</span>
                {canRender && (
                  <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('code')}
                      className={`px-2 py-1 rounded-md ${viewMode === 'code' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
                    >
                      Código
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('render')}
                      className={`px-2 py-1 rounded-md ${viewMode === 'render' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
                    >
                      Render
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {fileLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                Cargando archivo...
              </div>
            )}
            {!fileLoading && selectedPath && fileData && viewMode === 'render' && canRender && (
              <iframe
                title="preview"
                sandbox=""
                srcDoc={fileData.content}
                className="w-full h-[65vh] border border-gray-100 rounded-xl"
              />
            )}
            {!fileLoading && selectedPath && (!canRender || viewMode === 'code') && (
              <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-mono">
                {fileData?.content || ''}
              </pre>
            )}
            {!fileLoading && !selectedPath && (
              <div className="text-sm text-gray-400">Selecciona un archivo para ver su contenido.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectExplorer;
