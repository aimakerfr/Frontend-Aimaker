import { Wand2, X } from 'lucide-react';

type RoleEditorProps = {
  editingSkillLabel: string;
  setEditingSkillLabel: (value: string) => void;
  editingSkillInstruction: string;
  setEditingSkillInstruction: (value: string) => void;
  buildSystemPrompt: () => string;
  saveSkillPreset: () => void;
  closeFlip: () => void;
};

const RoleEditor = ({
  editingSkillLabel,
  setEditingSkillLabel,
  editingSkillInstruction,
  setEditingSkillInstruction,
  buildSystemPrompt,
  saveSkillPreset,
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
            onClick={() => void saveSkillPreset()}
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
