import { Wand2, X } from 'lucide-react';

type RoleEditorProps = {
  editingSkillLabel: string;
  setEditingSkillLabel: (value: string) => void;
  editingSkillInstruction: string;
  setEditingSkillInstruction: (value: string) => void;
  buildSystemPrompt: () => string;
  saveRolePreset: () => void;
  onOpenImportModal?: () => void;
  importSourceLabel?: string;
  closeFlip: () => void;
};

const RoleEditor = ({
  editingSkillLabel,
  setEditingSkillLabel,
  editingSkillInstruction,
  setEditingSkillInstruction,
  buildSystemPrompt,
  saveRolePreset,
  onOpenImportModal,
  importSourceLabel,
  closeFlip,
}: RoleEditorProps) => {
  return (
    <>
      <div className="fablab-chat-header">
        <div className="fablab-header-top">
          <div className="fablab-header-title">
            <h1 className="fablab-header-title-text">
              <Wand2 size={18} />
              Editor de Rol
            </h1>
            <p className="fablab-header-subtitle">Edita la instruccion del perfil seleccionado</p>
          </div>

          <div className="fablab-header-actions">
            <button type="button" onClick={closeFlip} className="fablab-header-action-btn">
              <X size={14} />
              <span className="fablab-header-action-text">Close</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', padding: 'var(--space-xl)' }}>
        <div className="fablab-skill-editor-field">
          <label>Opciones</label>
          <button
            type="button"
            onClick={() => onOpenImportModal?.()}
            className="fablab-header-action-btn"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Importar desde libreria de objetos
          </button>
          {importSourceLabel && (
            <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', marginTop: '10px', fontSize: '0.85rem' }}>
              Importando desde: {importSourceLabel}
            </div>
          )}
        </div>
        <div className="fablab-skill-editor-field">
          <label>Nombre del rol</label>
          <input
            value={editingSkillLabel}
            onChange={(event) => setEditingSkillLabel(event.target.value)}
            placeholder="Ej: Ingeniero de software"
            className="fablab-skill-editor-input"
          />
        </div>
        <div className="fablab-skill-editor-field">
          <label>Instruccion</label>
          <textarea
            value={editingSkillInstruction}
            onChange={(event) => setEditingSkillInstruction(event.target.value)}
            rows={10}
            placeholder="Describe la instruccion del rol..."
            className="fablab-skill-editor-textarea"
          />
        </div>
        <div className="fablab-skill-editor-field">
          <label>Configuracion de prompt completa (vista previa)</label>
          <textarea
            value={buildSystemPrompt()}
            readOnly
            rows={8}
            placeholder="Vista previa del system prompt completo que se enviara al modelo..."
            className="fablab-skill-editor-textarea fablab-skill-editor-preview"
          />
          <small className="fablab-skill-editor-hint">
            Este es el prompt final que se envia al modelo, incluyendo el rol activo, instrucciones de rol y comportamiento base.
          </small>
        </div>
        <div className="fablab-skill-editor-actions">
          <button type="button" onClick={closeFlip} className="fablab-header-action-btn">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void saveRolePreset()}
            className="fablab-header-action-btn fablab-header-action-btn-primary"
          >
            Guardar rol
          </button>
        </div>
      </div>
    </>
  );
};

export default RoleEditor;
