import { Bot, Paperclip, Pencil, Trash2, X } from 'lucide-react';
import type { ChatSkill } from '@core/chat-skills';
import type { ObjectItem } from '@core/objects';

export type ChatSkillsEditorProps = {
  chatSkills: ChatSkill[];
  editingChatSkill: ChatSkill | null;
  newChatSkillName: string;
  newChatSkillInstruction: string;
  newChatSkillSourceType: 'manual' | 'object';
  newChatSkillObjectId: number | null;
  objects: ObjectItem[];
  onClose: () => void;
  onEditSkill: (skill: ChatSkill) => void;
  onDeleteSkill: (id: number) => void;
  onOpenImportModal: () => void;
  onChangeName: (value: string) => void;
  onChangeInstruction: (value: string) => void;
  onSave: () => void;
  onCreate: () => void;
};

const ChatSkillsEditor = ({
  chatSkills,
  editingChatSkill,
  newChatSkillName,
  newChatSkillInstruction,
  newChatSkillSourceType,
  newChatSkillObjectId,
  objects,
  onClose,
  onEditSkill,
  onDeleteSkill,
  onOpenImportModal,
  onChangeName,
  onChangeInstruction,
  onSave,
  onCreate,
}: ChatSkillsEditorProps) => {
  return (
    <>
      <div className="fablab-chat-header">
        <div className="fablab-header-top">
          <div className="fablab-header-title">
            <h1 className="fablab-header-title-text">
              <Bot size={18} />
              Chat Skills Editor
            </h1>
            <p className="fablab-header-subtitle">Crea skills para usar con /nombre en el chat</p>
          </div>

          <div className="fablab-header-actions">
            <button type="button" onClick={onClose} className="fablab-header-action-btn">
              <X size={14} />
              <span className="fablab-header-action-text">Close</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', padding: 'var(--space-xl)' }}>
        <div className="fablab-skill-editor-field">
          <label>Skill activos</label>
          <div className="fablab-chat-skills-list" style={{ maxHeight: '150px', overflow: 'auto', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '8px', padding: '8px' }}>
            {chatSkills.length === 0 && (
              <div style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                No hay skills creados. Crea uno abajo.
              </div>
            )}
            {chatSkills.map((skill) => (
              <div key={skill.id} className="fablab-skill-menu-row" style={{ marginBottom: '4px' }}>
                <code className="fablab-skill-menu-code" style={{ flex: 1 }}>/{skill.name}</code>
                <button
                  type="button"
                  onClick={() => onEditSkill(skill)}
                  className="fablab-skill-menu-edit"
                >
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSkill(skill.id)}
                  className="fablab-skill-menu-delete"
                  title="Eliminar skill"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="fablab-skill-editor-field">
          <label>Opciones de creacion</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={onOpenImportModal}
              className="fablab-header-action-btn"
              style={{ flex: 1 }}
            >
              <Paperclip size={14} />
              <span>Importar desde libreria de objetos</span>
            </button>
          </div>
          {newChatSkillSourceType === 'object' && newChatSkillObjectId && (
            <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem' }}>
              Importando desde: {objects.find((o) => o.id === newChatSkillObjectId)?.name || 'Archivo seleccionado'}
            </div>
          )}
        </div>

        <div className="fablab-skill-editor-field">
          <label>{editingChatSkill ? 'Editar skill' : 'Crear nuevo skill'}</label>
          <input
            value={newChatSkillName}
            onChange={(event) => onChangeName(event.target.value)}
            placeholder="Nombre del skill (ej: documentar)"
            className="fablab-skill-editor-input"
            style={{ marginBottom: '8px' }}
          />
          <textarea
            value={newChatSkillInstruction}
            onChange={(event) => onChangeInstruction(event.target.value)}
            rows={8}
            placeholder="Instruccion del skill. Ej: Al final de cada respuesta, genera un documento PDF descargable con el resumen de la conversacion."
            className="fablab-skill-editor-textarea"
          />
        </div>

        <div className="fablab-skill-editor-actions">
          <button type="button" onClick={onClose} className="fablab-header-action-btn">
            Cancelar
          </button>
          <button
            type="button"
            onClick={editingChatSkill ? onSave : onCreate}
            disabled={!newChatSkillName.trim() || !newChatSkillInstruction.trim()}
            className="fablab-header-action-btn fablab-header-action-btn-primary"
          >
            {editingChatSkill ? 'Actualizar skill' : 'Crear skill'}
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatSkillsEditor;
