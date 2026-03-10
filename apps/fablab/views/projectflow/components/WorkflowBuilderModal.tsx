import React, { useMemo, useState } from 'react';
import { X as CloseIcon, Plus, Trash2 } from 'lucide-react';
import type { StepAction, WorkflowStep } from '../types';
import { STEP_TEMPLATES } from '../constants/stepCatalog';

export type WorkflowDraft = {
  id: string;
  name: string;
  description: string;
  outputType: string;
  stageName: string;
  steps: WorkflowStep[];
  source?: 'demo' | 'custom';
};

type Props = {
  open: boolean;
  onClose: () => void;
  t: any;
  initial?: WorkflowDraft;
  onSave: (draft: WorkflowDraft) => void;
  onDelete?: (id: string) => void;
};

const nextStepId = (steps: WorkflowStep[]): number => {
  const max = steps.reduce((acc, s) => Math.max(acc, s.step_id), 0);
  return max + 1;
};

const WorkflowBuilderModal: React.FC<Props> = ({ open, onClose, t, initial, onSave, onDelete }) => {
  const [id, setId] = useState(initial?.id || `wf_${Date.now()}`);
  const [name, setName] = useState(initial?.name || 'Nuevo Workflow');
  const [description, setDescription] = useState(initial?.description || '');
  const [outputType, setOutputType] = useState(initial?.outputType || 'TEXT');
  const [stageName, setStageName] = useState(initial?.stageName || id);
  const [steps, setSteps] = useState<WorkflowStep[]>(initial?.steps || []);
  const [selectedTemplate, setSelectedTemplate] = useState<StepAction>(STEP_TEMPLATES[0]?.action || 'rag_selector');

  const templates = useMemo(() => STEP_TEMPLATES, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-[71] w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
            {t?.projectFlow?.workflowBuilderTitle || 'Workflow Builder'}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
            <CloseIcon size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
                ID
              </label>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
                {t?.projectFlow?.name || 'Name'}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
                {t?.projectFlow?.description || 'Description'}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-20 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
                Output Type
              </label>
              <select
                value={outputType}
                onChange={(e) => setOutputType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
              >
                <option value="TEXT">TEXT</option>
                <option value="HTML">HTML</option>
                <option value="JSON">JSON</option>
                <option value="IMAGE">IMAGE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
                Stage Name
              </label>
              <input
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
                  Add Step
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value as StepAction)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.action} value={tpl.action}>
                      {tpl.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  const tpl = templates.find((x) => x.action === selectedTemplate);
                  if (!tpl) return;
                  const newStep: WorkflowStep = {
                    step_id: nextStepId(steps),
                    ...(tpl.defaults as any),
                  };
                  setSteps((prev) => [...prev, newStep]);
                }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                aria-label="Add step"
                title="Add step"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="max-h-[320px] overflow-auto">
                {steps.length === 0 ? (
                  <div className="p-3 text-xs text-gray-500">No steps</div>
                ) : (
                  <table className="min-w-full text-left text-xs">
                    <thead className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Action</th>
                        <th className="py-2 px-3">Title</th>
                        <th className="py-2 px-3" />
                      </tr>
                    </thead>
                    <tbody className="text-gray-800 dark:text-gray-200">
                      {steps
                        .slice()
                        .sort((a, b) => a.step_id - b.step_id)
                        .map((s) => (
                          <tr key={s.step_id} className="border-t border-gray-100 dark:border-gray-700">
                            <td className="py-2 px-3">{s.step_id}</td>
                            <td className="py-2 px-3 font-mono">{s.action}</td>
                            <td className="py-2 px-3">{s.displayName || s.name}</td>
                            <td className="py-2 px-3 text-right">
                              <button
                                onClick={() => {
                                  setSteps((prev) => prev.filter((x) => x.step_id !== s.step_id));
                                }}
                                className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label="Remove step"
                                title="Remove step"
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              {onDelete && (
                <button
                  onClick={() => onDelete(id)}
                  className="px-3 py-2 text-xs font-bold uppercase tracking-wide rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  {t?.common?.delete || 'Delete'}
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => {
                  onSave({ id, name, description, outputType, stageName, steps, source: initial?.source || 'custom' });
                }}
                className="px-3 py-2 text-xs font-bold uppercase tracking-wide rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                {t?.common?.save || 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilderModal;
