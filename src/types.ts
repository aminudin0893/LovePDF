export type ToolId = 
  | 'merge' 
  | 'split' 
  | 'compress' 
  | 'pdf-to-word' 
  | 'pdf-to-powerpoint' 
  | 'pdf-to-excel' 
  | 'word-to-pdf' 
  | 'powerpoint-to-pdf' 
  | 'excel-to-pdf' 
  | 'edit' 
  | 'pdf-to-jpg' 
  | 'jpg-to-pdf' 
  | 'sign' 
  | 'watermark' 
  | 'rotate' 
  | 'html-to-pdf' 
  | 'unlock' 
  | 'protect' 
  | 'organize' 
  | 'repair' 
  | 'page-numbers' 
  | 'scan-to-pdf' 
  | 'ocr';

export interface Tool {
  id: ToolId;
  title: string;
  description: string;
  icon: string;
  category: 'organize' | 'optimize' | 'convert-to' | 'convert-from' | 'edit' | 'security';
}

export interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  previewUrl?: string;
}
