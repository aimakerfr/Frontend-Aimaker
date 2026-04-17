import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Download, FolderPlus, ImageDown, Paperclip } from 'lucide-react';
import type { FablabChatMessage } from '@core/fablab-chat';
import type { RichOutput } from '../types/chat.types';
import PDFCard from './PDFCard';

export type RenderedMessage = {
  message: FablabChatMessage;
  isUser: boolean;
  imageSrc: string | null;
  richOutput: RichOutput;
  textBody: string;
  fileCardMessage: string;
};

type ChatMessagesProps = {
  renderedMessages: RenderedMessage[];
  t: any;
  formatTime: (value?: string) => string;
  downloadGeneratedImage: (imageSrc: string) => void;
  saveGeneratedImageToObjects: (imageSrc: string) => void;
  downloadDataUriAsset: (src: string, fileName: string) => void;
  exportMessage: (messageId: string) => void;
  markdownComponents: Record<string, unknown>;
  markdownUrlTransform: (url: string) => string;
  isSending: boolean;
};

const ChatMessages = ({
  renderedMessages,
  t,
  formatTime,
  downloadGeneratedImage,
  saveGeneratedImageToObjects,
  downloadDataUriAsset,
  exportMessage,
  markdownComponents,
  markdownUrlTransform,
  isSending,
}: ChatMessagesProps) => {
  return (
    <div className="fablab-chat-messages">
      {renderedMessages.map(({ message, isUser, imageSrc, richOutput, textBody, fileCardMessage }) => (
        <div
          key={message.id}
          className={`fablab-message-wrapper ${isUser ? 'fablab-message-user' : 'fablab-message-assistant'}`}
        >
          <div className={`fablab-message-bubble ${isUser ? 'fablab-bubble-user' : 'fablab-bubble-assistant'}`}>
            <p className="fablab-message-role-time">
              <span className="fablab-message-role">
                {isUser ? (t?.fablabChat?.messages?.you || 'You') : (t?.fablabChat?.messages?.assistant || 'Assistant')}
              </span>
              <span className="fablab-message-time">{formatTime(message.createdAt)}</span>
            </p>

            {isUser && Array.isArray(message.attachments) && message.attachments.length > 0 && (
              <div className="fablab-message-attachments">
                {message.attachments.map((attachment) => (
                  <div key={attachment.id} className={`fablab-message-attachment ${attachment.status || 'ready'}`}>
                    <Paperclip size={12} />
                    <span>{attachment.name}</span>
                  </div>
                ))}
              </div>
            )}

            {imageSrc && (
              <div>
                <img src={imageSrc} alt="Generated output" loading="lazy" decoding="async" />
                <div>
                  <button type="button" onClick={() => downloadGeneratedImage(imageSrc)}>
                    <ImageDown size={12} />
                    Download
                  </button>
                  <button type="button" onClick={() => saveGeneratedImageToObjects(imageSrc)}>
                    <FolderPlus size={12} />
                    Save
                  </button>
                </div>
              </div>
            )}

            {richOutput && richOutput.kind === 'audio' && (
              <div>
                <audio controls src={richOutput.src} />
                <div>
                  <button type="button" onClick={() => downloadDataUriAsset(richOutput.src, richOutput.fileName)}>
                    <Download size={12} />
                    Download audio
                  </button>
                </div>
              </div>
            )}

            {richOutput && richOutput.kind === 'video' && (
              <div>
                <video controls src={richOutput.src} />
                <div>
                  <button type="button" onClick={() => downloadDataUriAsset(richOutput.src, richOutput.fileName)}>
                    <Download size={12} />
                    Download video
                  </button>
                </div>
              </div>
            )}

            {richOutput && richOutput.kind === 'file' && (
              (() => {
                const isPdf = richOutput.fileName?.toLowerCase().endsWith('.pdf');
                if (isPdf) {
                  return (
                    <div>
                      <p>{fileCardMessage || 'Claro, aca genere tu PDF. Ya tienes el boton para descargarlo.'}</p>
                      <PDFCard
                        fileName={richOutput.fileName || 'documento.pdf'}
                        onDownload={() => downloadDataUriAsset(richOutput.src, richOutput.fileName)}
                      />
                    </div>
                  );
                }
                return (
                  <div>
                    <p>{fileCardMessage || 'Claro, aca genere tu archivo. Usa el boton para descargarlo.'}</p>
                    <div>
                      <button type="button" onClick={() => downloadDataUriAsset(richOutput.src, richOutput.fileName)}>
                        <Download size={12} />
                        Descargar archivo
                      </button>
                    </div>
                  </div>
                );
              })()
            )}

            {textBody && !(richOutput && richOutput.kind === 'file') && (
              isUser ? (
                <p>{textBody}</p>
              ) : (
                <div>
                  {(() => {
                    const pdfMatch = textBody.match(/\[PDF:\s*([^\]]+)\]/i);
                    if (pdfMatch) {
                      const fileName = pdfMatch[1].trim();
                      const textWithoutPdf = textBody.replace(/\[PDF:\s*[^\]]+\]/i, '').trim();
                      return (
                        <>
                          {textWithoutPdf && (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={markdownComponents}
                              urlTransform={markdownUrlTransform}
                            >
                              {textWithoutPdf}
                            </ReactMarkdown>
                          )}
                          <PDFCard fileName={fileName} onDownload={() => {}} />
                        </>
                      );
                    }
                    return (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents}
                        urlTransform={markdownUrlTransform}
                      >
                        {textBody}
                      </ReactMarkdown>
                    );
                  })()}
                </div>
              )
            )}

            {!isUser && (
              <button
                type="button"
                onClick={() => exportMessage(message.id)}
                className="fablab-message-save-btn"
                title="Save this message to objects"
              >
                <FolderPlus size={14} />
              </button>
            )}
          </div>
        </div>
      ))}

      {isSending && (
        <div className="fablab-message-wrapper fablab-message-assistant">
          <div className="fablab-message-bubble fablab-bubble-assistant">
            <div className="fablab-typing-indicator">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessages;
