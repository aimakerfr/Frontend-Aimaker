import { Loader2, MessageSquare, Paperclip, Send, Wand2 } from 'lucide-react';

export type ChatInputProps = {
  input: string;
  setInput: (value: string) => void;
  handleInputKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  renderSkillDropdown: () => React.ReactNode;
  renderProjectAuditWizard: () => React.ReactNode;
  renderComplementsDropdown: () => React.ReactNode;
  renderQuickSkillButtons: () => React.ReactNode;
  setSourceMode: (mode: 'context' | 'role' | 'prompt' | null) => void;
  isSending: boolean;
  runtimeSelection: unknown;
  skills: { projectAudit: boolean };
  projectAuditWizardVisible: boolean;
  projectAuditWizardComplete: boolean;
  sendMessage: () => void;
  sendProjectAuditWizardPrompt: () => void;
  t: any;
  buildHighlightedInputHtml: (value: string) => string;
  inputClassName: string;
  containerClassName?: string;
  rows: number;
};

const ChatInput = ({
  input,
  setInput,
  handleInputKeyDown,
  renderSkillDropdown,
  renderProjectAuditWizard,
  renderComplementsDropdown,
  renderQuickSkillButtons,
  setSourceMode,
  isSending,
  runtimeSelection,
  skills,
  projectAuditWizardVisible,
  projectAuditWizardComplete,
  sendMessage,
  sendProjectAuditWizardPrompt,
  t,
  buildHighlightedInputHtml,
  inputClassName,
  containerClassName,
  rows,
}: ChatInputProps) => {
  return (
    <div className={containerClassName ?? 'fablab-conversation-input'}>
      <div className="fablab-input-with-overlay">
        <div
          className="fablab-input-highlight-layer"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: buildHighlightedInputHtml(input) }}
        />
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleInputKeyDown}
          rows={rows}
          placeholder={t?.fablabChat?.inputPlaceholder || 'Write your message...'}
          className={`${inputClassName} fablab-input-overlay`}
        />
        {renderSkillDropdown()}
      </div>

      {renderProjectAuditWizard()}

      <div className="fablab-input-buttons">
        <div className="fablab-skill-buttons">
          {renderComplementsDropdown()}
          {renderQuickSkillButtons()}

          <button
            type="button"
            onClick={() => setSourceMode('context')}
            className="fablab-source-button"
          >
            <Paperclip size={14} />
            <span className="fablab-source-text">{t?.fablabChat?.actions?.contextSources || 'Context sources'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSourceMode('role')}
            className="fablab-source-button"
          >
            <Wand2 size={14} />
            <span className="fablab-source-text">{t?.fablabChat?.actions?.roleSource || 'Role from library'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSourceMode('prompt')}
            className="fablab-source-button"
          >
            <MessageSquare size={14} />
            <span className="fablab-source-text">{t?.fablabChat?.actions?.promptSource || 'Prompt from library'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (skills.projectAudit && projectAuditWizardVisible) {
              sendProjectAuditWizardPrompt();
              return;
            }
            sendMessage();
          }}
          disabled={isSending || !runtimeSelection || (skills.projectAudit && projectAuditWizardVisible ? !projectAuditWizardComplete : !input.trim())}
          className="fablab-send-button"
        >
          {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          <span>{skills.projectAudit && projectAuditWizardVisible ? 'Enviar auditoria' : (t?.fablabChat?.actions?.send || 'Send')}</span>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
