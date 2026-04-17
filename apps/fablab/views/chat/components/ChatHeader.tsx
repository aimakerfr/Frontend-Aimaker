import { AlertTriangle, Download, Loader2, RotateCcw, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import type { ObjectItem } from '@core/objects';
import type { ReactNode } from 'react';

type ChatHeaderProps = {
  t: any;
  runtimeSelection: { provider: string; modelId: string } | null;
  selectedModelLabel: string;
  renderChatSkillsButton: () => ReactNode;
  renderRoleMenu: () => ReactNode;
  exportConversation: () => void;
  resetConversation: () => void;
  clearAll: () => void;
  isExporting: boolean;
  messagesLength: number;
  statsTotalRequests: number;
  navigateToProfile: () => void;
  selectedRoleObject: ObjectItem | null;
  selectedContextSources: ObjectItem[];
  onClearRole: () => void;
  onRemoveContextSource: (sourceId: string | number) => void;
  getObjectType: (item: ObjectItem) => string | null;
};

const ChatHeader = ({
  t,
  runtimeSelection,
  selectedModelLabel,
  renderChatSkillsButton,
  renderRoleMenu,
  exportConversation,
  resetConversation,
  clearAll,
  isExporting,
  messagesLength,
  statsTotalRequests,
  navigateToProfile,
  selectedRoleObject,
  selectedContextSources,
  onClearRole,
  onRemoveContextSource,
  getObjectType,
}: ChatHeaderProps) => {
  return (
    <header className="fablab-chat-header">
      <div className="fablab-header-top">
        <div className="fablab-header-title">
          <div className="fablab-header-title-row">
            <h1 className="fablab-header-title-text">
              <Sparkles size={18} />
              {t?.fablabChat?.title || 'Fablab Chat'}
            </h1>
          </div>
          <p className="fablab-header-subtitle">
            {runtimeSelection
              ? `${runtimeSelection.provider} - ${selectedModelLabel || runtimeSelection.modelId}`
              : (t?.fablabChat?.runtimeMissing || 'Configure provider and model in Profile to start chatting.')}
          </p>
        </div>

        <div className="fablab-header-actions">
          {renderChatSkillsButton()}
          {renderRoleMenu()}

          <button
            type="button"
            onClick={exportConversation}
            disabled={isExporting || messagesLength === 0}
            className="fablab-header-action-btn"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span className="fablab-header-action-text">{t?.fablabChat?.actions?.export || 'Export'}</span>
          </button>

          <button
            type="button"
            onClick={resetConversation}
            disabled={messagesLength === 0}
            className="fablab-header-action-btn"
          >
            <RotateCcw size={14} />
            <span className="fablab-header-action-text">{t?.fablabChat?.actions?.reset || 'Reset'}</span>
          </button>

          <button
            type="button"
            onClick={clearAll}
            disabled={messagesLength === 0 && statsTotalRequests === 0}
            className="fablab-header-action-btn"
          >
            <Trash2 size={14} />
            <span className="fablab-header-action-text">{t?.fablabChat?.actions?.delete || 'Delete'}</span>
          </button>
        </div>
      </div>

      {!runtimeSelection && (
        <div className="fablab-header-warning-bubble">
          <div className="fablab-warning-bubble-icon">
            <AlertTriangle size={16} />
          </div>
          <div className="fablab-warning-tooltip">
            <p className="fablab-warning-tooltip-text">
              Configure your API key and model in Profile before starting the chat.
            </p>
            <button
              type="button"
              onClick={navigateToProfile}
              className="fablab-warning-tooltip-btn"
            >
              Go to profile
            </button>
          </div>
        </div>
      )}

      {(selectedRoleObject || selectedContextSources.length > 0) && (
        <div>
          {selectedRoleObject && (
            <span>
              {t?.fablabChat?.sources?.role || 'Role'}: {selectedRoleObject.name}
              <button type="button" onClick={onClearRole}>
                <X size={12} />
              </button>
            </span>
          )}

          {selectedContextSources.length > 0 && (
            <span>
              <ShieldCheck size={12} />
              {selectedContextSources.length} {t?.fablabChat?.sources?.selected || 'sources selected'}
            </span>
          )}
        </div>
      )}

      {selectedContextSources.length > 0 && (
        <div>
          <p>Active context sources (fully analyzed before generation)</p>
          <div>
            {selectedContextSources.map((source) => (
              <span key={String(source.id)}>
                {source.name} ({getObjectType(source) || 'file'})
                <button type="button" onClick={() => onRemoveContextSource(source.id)}>
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default ChatHeader;
