export type RichOutput = {
  kind: 'audio' | 'video' | 'file';
  src: string;
  mimeType: string;
  fileName: string;
} | null;
