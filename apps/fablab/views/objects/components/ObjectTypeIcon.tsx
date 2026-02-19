import React from 'react';
import { Cog, Code2, FileText, Globe, ImageIcon, Video } from 'lucide-react';

type Props = { type?: string; t: any };

const normalizeType = (raw?: string):
  | 'doc'
  | 'html'
  | 'code'
  | 'image'
  | 'video'
  | 'config'
  | undefined => {
  if (!raw) return undefined;
  const v = raw.toLowerCase();
  // Map common synonyms coming from backend ENUM to local buckets
  if (v === 'website') return 'html';
  if (v === 'doc' || v === 'text' || v === 'json' || v === 'pdf') return 'doc';
  // Direct matches
  if (v === 'doc' || v === 'html' || v === 'code' || v === 'image' || v === 'video' || v === 'config') return v as any;
  return undefined;
};

const ObjectTypeIcon: React.FC<Props> = ({ type, t }) => {
  const norm = normalizeType(type);
  return (
    <div className="flex items-center gap-2">
      {(() => {
        switch (norm) {
          case 'doc':
            return (
              <>
                <FileText className="text-red-500 flex-shrink-0 h-4 w-4" />
                <span className="font-medium">
                  {t.home?.objects_library?.tabs?.document ?? 'DOC'}
                </span>
              </>
            );
          case 'html':
            return (
              <>
                <Globe className="text-blue-600 flex-shrink-0 h-4 w-4" />
                <span className="font-medium">
                  {t.home?.objects_library?.tabs?.html ?? 'HTML'}
                </span>
              </>
            );
          case 'code':
            return (
              <>
                <Code2 className="text-teal-600 flex-shrink-0 h-4 w-4" />
                <span className="font-medium">
                  {t.home?.objects_library?.tabs?.code ?? 'Code'}
                </span>
              </>
            );
          case 'image':
            return (
              <>
                <ImageIcon className="text-amber-500 flex-shrink-0 h-4 w-4" />
                <span className="font-medium">
                  {t.home?.objects_library?.tabs?.image ?? 'Image'}
                </span>
              </>
            );
          case 'video':
            return (
              <>
                <Video className="text-purple-500 flex-shrink-0 h-4 w-4" />
                <span className="font-medium">
                  {t.home?.objects_library?.tabs?.video ?? 'Video'}
                </span>
              </>
            );
          case 'config':
            return (
              <>
                <Cog className="text-slate-600 flex-shrink-0 h-4 w-4" />
                <span className="font-medium">
                  {t.home?.objects_library?.tabs?.config ?? 'Config'}
                </span>
              </>
            );
          default:
            return <span className="font-medium">{type ?? '-'}</span>;
        }
      })()}
    </div>
  );
};

export default ObjectTypeIcon;