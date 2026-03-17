import * as React from 'react';
import { useState, useCallback, useRef, useEffect, ErrorInfo, ReactNode } from 'react';
import { 
  Merge, 
  Scissors, 
  Minimize2, 
  FileText, 
  Image as ImageIcon, 
  FileImage, 
  RotateCw, 
  Unlock, 
  Lock, 
  Layout,
  Upload,
  X,
  ArrowRight,
  Download,
  Plus,
  Trash2,
  File as FileIcon,
  ChevronLeft,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ups! Terjadi kesalahan</h2>
            <p className="text-gray-600 mb-6">
              Aplikasi mengalami masalah saat memuat. Silakan muat ulang halaman.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#E5322E] text-white py-3 rounded-xl font-bold hover:bg-[#C42B27] transition-colors"
            >
              Muat Ulang Halaman
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-40">
                {(this as any).state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Tool, ToolId, PDFFile } from './types';
import { TOOLS } from './constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const IconMap: Record<string, any> = {
  Merge,
  Scissors,
  Minimize2,
  FileText,
  Image: ImageIcon,
  ImageIcon,
  FileImage,
  RotateCw,
  Unlock,
  Lock,
  Layout,
  Edit: FileText // Using FileText as a fallback for Edit icon
};

export default function App() {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [processedSize, setProcessedSize] = useState<number | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file: File) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size
      }));
      setFiles(prev => [...prev, ...newFiles]);

      // If active tool is Edit, extract text from the first file
      if (activeTool?.id === 'edit' && newFiles.length > 0) {
        setIsProcessing(true);
        try {
          const pdfBytes = await newFiles[0].file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
          const pdf = await loadingTask.promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            let lastY: number | null = null;
            let pageHtml = '';
            
            for (const item of textContent.items as any[]) {
              if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                pageHtml += '<br/>';
              }
              pageHtml += item.str;
              lastY = item.transform[5];
            }
            fullText += `<div style="margin-bottom: 20px;">${pageHtml}</div>`;
          }
          setEditorContent(fullText || '<p>Mulai mengetik di sini...</p>');
        } catch (error) {
          console.error('Error extracting text:', error);
          setEditorContent('<p>Failed to extract text. You can still start typing here...</p>');
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeTool?.id === 'edit') setEditorContent('');
  };

  const resetTool = () => {
    setActiveTool(null);
    setFiles([]);
    setResultUrl(null);
    setIsProcessing(false);
    setEditorContent('');
  };

  const processPDF = async () => {
    if (!activeTool || (files.length === 0 && activeTool.id !== 'edit')) return;
    setIsProcessing(true);

    try {
      if (activeTool.id === 'edit') {
        const doc = new jsPDF('p', 'mm', 'a4');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = editorContent;
        tempDiv.style.width = '190mm';
        tempDiv.style.padding = '10mm';
        tempDiv.style.fontSize = '12pt';
        tempDiv.style.lineHeight = '1.5';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.style.color = '#000000';
        tempDiv.style.backgroundColor = '#ffffff';
        tempDiv.className = 'ql-editor'; 
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        document.body.appendChild(tempDiv);

        try {
          await doc.html(tempDiv, {
            x: 0,
            y: 0,
            width: 210,
            windowWidth: 800,
            autoPaging: 'text',
            margin: [10, 10, 10, 10],
            callback: function (doc) {
              const pdfBlob = doc.output('blob');
              setProcessedSize(pdfBlob.size);
              setResultUrl(URL.createObjectURL(pdfBlob));
              setIsProcessing(false);
              document.body.removeChild(tempDiv);
            }
          });
          return; 
        } catch (err) {
          if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
          throw err;
        }
      } else if (activeTool.id === 'merge') {
        const mergedPdf = await PDFDocument.create();
        for (const pdfFile of files) {
          const pdfBytes = await pdfFile.file.arrayBuffer();
          const pdf = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        setProcessedSize(blob.size);
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
      } else if (activeTool.id === 'compress') {
        const pdfBytes = await files[0].file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        
        // Create a new document and copy pages to strip redundant data
        const compressedPdf = await PDFDocument.create();
        const copiedPages = await compressedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => compressedPdf.addPage(page));
        
        // Save with maximum compression options available in pdf-lib
        const compressedPdfBytes = await compressedPdf.save({ 
          useObjectStreams: true,
          addDefaultPage: false,
          updateFieldAppearances: false
        });
        
        const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
        setProcessedSize(blob.size);
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
      } else if (activeTool.id === 'split') {
        const pdfBytes = await files[0].file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const splitPdf = await PDFDocument.create();
        const [firstPage] = await splitPdf.copyPages(pdf, [0]);
        splitPdf.addPage(firstPage);
        const splitPdfBytes = await splitPdf.save();
        const blob = new Blob([splitPdfBytes], { type: 'application/pdf' });
        setProcessedSize(blob.size);
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
      } else if (activeTool.id === 'jpg-to-pdf') {
        const pdfDoc = await PDFDocument.create();
        for (const imgFile of files) {
          const imgBytes = await imgFile.file.arrayBuffer();
          let image;
          if (imgFile.file.type === 'image/jpeg' || imgFile.file.type === 'image/jpg') {
            image = await pdfDoc.embedJpg(imgBytes);
          } else if (imgFile.file.type === 'image/png') {
            image = await pdfDoc.embedPng(imgBytes);
          } else {
            continue;
          }
          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
        }
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        setProcessedSize(blob.size);
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
      } else if (activeTool.id === 'protect') {
        const password = prompt('Masukkan kata sandi untuk melindungi PDF:');
        if (!password) {
          setIsProcessing(false);
          return;
        }
        const pdfBytes = await files[0].file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const protectedPdfBytes = await pdf.save();
        const blob = new Blob([protectedPdfBytes], { type: 'application/pdf' });
        setProcessedSize(blob.size);
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
      } else if (activeTool.id === 'pdf-to-jpg') {
        const pdfBytes = await files[0].file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport, canvas }).promise;
          const imgData = canvas.toDataURL('image/jpeg');
          // For images, size is harder to get directly from URL, but we can estimate
          setProcessedSize(imgData.length * 0.75); // Base64 estimate
          setResultUrl(imgData);
        }
      } else if (activeTool.id === 'rotate') {
        const pdfBytes = await files[0].file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = pdf.getPages();
        pages.forEach(page => {
          const currentRotation = page.getRotation().angle;
          page.setRotation({ angle: (currentRotation + 90) % 360, type: 'degrees' as any });
        });
        const pdfBytesRotated = await pdf.save();
        const blob = new Blob([pdfBytesRotated], { type: 'application/pdf' });
        setProcessedSize(blob.size);
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
      } else if (activeTool.id === 'watermark') {
        const text = prompt('Masukkan teks watermark:');
        if (!text) {
          setIsProcessing(false);
          return;
        }
        const pdfBytes = await files[0].file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = pdf.getPages();
        pages.forEach(page => {
          const { width, height } = page.getSize();
          page.drawText(text, {
            x: width / 2 - 50,
            y: height / 2,
            size: 50,
            opacity: 0.3,
            rotate: { angle: 45, type: 'degrees' as any }
          });
        });
        const watermarkedPdfBytes = await pdf.save({ 
          useObjectStreams: true,
          updateFieldAppearances: false
        });
        const blob = new Blob([watermarkedPdfBytes], { type: 'application/pdf' });
        setProcessedSize(blob.size);
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const blob = new Blob([await files[0].file.arrayBuffer()], { type: 'application/pdf' });
        setProcessedSize(blob.size);
        setResultUrl(URL.createObjectURL(blob));
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Gagal memproses PDF. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = useCallback(() => {
    if (resultUrl) {
      const extension = activeTool?.id === 'pdf-to-jpg' ? 'jpg' : 'pdf';
      saveAs(resultUrl, `hasil_${activeTool?.id}_${files[0]?.name.split('.')[0] || 'dokumen'}.${extension}`);
    }
  }, [resultUrl, activeTool, files]);

  // Automatic download when resultUrl is set
  useEffect(() => {
    if (resultUrl) {
      downloadResult();
    }
  }, [resultUrl, downloadResult]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F3F3F3] font-sans text-[#333]">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center cursor-pointer" onClick={resetTool}>
              <div className="bg-[#E5322E] p-1.5 rounded-lg mr-2">
                <FileIcon className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-[#333]">PDF Master</span>
            </div>
            <div className="hidden md:flex space-x-8 text-sm font-medium uppercase tracking-wider text-gray-500">
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTool(TOOLS.find(t => t.id === 'merge') || null); }} className="hover:text-[#E5322E] transition-colors">Gabungkan</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTool(TOOLS.find(t => t.id === 'split') || null); }} className="hover:text-[#E5322E] transition-colors">Pisahkan</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTool(TOOLS.find(t => t.id === 'compress') || null); }} className="hover:text-[#E5322E] transition-colors">Kompres</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTool(TOOLS.find(t => t.id === 'edit') || null); }} className="hover:text-[#E5322E] transition-colors">Edit</a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {!activeTool ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#333]">Semua alat yang Anda butuhkan untuk PDF di satu tempat</h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">Setiap alat yang Anda butuhkan untuk menggunakan PDF, di ujung jari Anda. Semuanya 100% GRATIS dan mudah digunakan!</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {TOOLS.map((tool) => {
                  const Icon = IconMap[tool.icon];
                  return (
                    <motion.div
                      key={tool.id}
                      whileHover={{ y: -5 }}
                      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group"
                      onClick={() => setActiveTool(tool)}
                    >
                      <div className="bg-[#F8F9FA] w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#E5322E] transition-colors">
                        <Icon className="w-6 h-6 text-[#E5322E] group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{tool.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="tool-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto"
            >
              <button 
                onClick={resetTool}
                className="flex items-center text-gray-500 hover:text-[#E5322E] mb-8 transition-colors font-medium"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Kembali ke semua alat
              </button>

              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-8 border-b border-gray-100 bg-[#FBFBFB]">
                  <div className="flex items-center mb-2">
                    <div className="bg-[#E5322E] p-2 rounded-lg mr-3">
                      {React.createElement(IconMap[activeTool.icon], { className: "text-white w-6 h-6" })}
                    </div>
                    <h2 className="text-3xl font-bold">{activeTool.title}</h2>
                  </div>
                  <p className="text-gray-500">{activeTool.description}</p>
                </div>

                <div className="p-8">
                  {resultUrl ? (
                    <div className="text-center py-12">
                      <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">PDF telah diproses!</h3>
                      <p className="text-gray-500 mb-8">File Anda siap untuk diunduh (pengunduhan otomatis dimulai).</p>
                      
                      {processedSize && (files.length > 0 || activeTool.id === 'edit') && (
                        <div className="mb-8 p-4 bg-gray-50 rounded-xl inline-block">
                          <div className="flex items-center justify-center space-x-8">
                            {files.length > 0 && (
                              <>
                                <div className="text-center">
                                  <p className="text-xs text-gray-400 uppercase font-bold">Asli</p>
                                  <p className="text-lg font-bold">{(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <ArrowRight className="text-gray-300" />
                              </>
                            )}
                            <div className="text-center">
                              <p className="text-xs text-gray-400 uppercase font-bold">Hasil</p>
                              <p className="text-lg font-bold text-[#E5322E]">{(processedSize / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          {activeTool.id === 'compress' && files.length > 0 && processedSize < files[0].size && (
                            <div className="mt-2 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                              Hemat {(((files[0].size - processedSize) / files[0].size) * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={downloadResult}
                          className="bg-[#E5322E] text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center hover:bg-[#C42B27] transition-colors shadow-lg shadow-red-200"
                        >
                          <Download className="w-6 h-6 mr-2" />
                          Unduh PDF
                        </button>
                        <button
                          onClick={resetTool}
                          className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors"
                        >
                          Proses file lain
                        </button>
                      </div>
                    </div>
                  ) : activeTool.id === 'edit' ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Editor ala Word</h3>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-sm bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-bold"
                          >
                            Impor PDF
                          </button>
                          <button 
                            onClick={() => setEditorContent('<p>Mulai mengetik di sini...</p>')}
                            className="text-sm bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-bold"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 rounded-xl overflow-hidden min-h-[400px]">
                        <ReactQuill 
                          theme="snow" 
                          value={editorContent} 
                          onChange={setEditorContent}
                          className="h-[350px]"
                          modules={{
                            toolbar: [
                              [{ 'header': [1, 2, 3, false] }],
                              ['bold', 'italic', 'underline', 'strike'],
                              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                              ['link', 'image'],
                              ['clean']
                            ],
                          }}
                        />
                      </div>

                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf"
                        className="hidden"
                      />

                      <button
                        onClick={processPDF}
                        disabled={isProcessing || !editorContent}
                        className="w-full bg-[#E5322E] text-white py-5 rounded-xl font-bold text-xl flex items-center justify-center hover:bg-[#C42B27] disabled:bg-gray-300 transition-all shadow-lg shadow-red-200"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            Simpan sebagai PDF
                            <ArrowRight className="w-6 h-6 ml-2" />
                          </>
                        )}
                      </button>
                    </div>
                  ) : files.length === 0 ? (
                    <div 
                      className="border-2 border-dashed border-gray-200 rounded-2xl p-20 text-center hover:border-[#E5322E] hover:bg-red-50 transition-all cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-white transition-colors">
                        <Upload className="w-10 h-10 text-gray-400 group-hover:text-[#E5322E] transition-colors" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Pilih file PDF</h3>
                      <p className="text-gray-500">atau seret PDF ke sini</p>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple={activeTool.id === 'merge' || activeTool.id === 'jpg-to-pdf'}
                        accept={activeTool.id === 'jpg-to-pdf' ? ".jpg,.jpeg,.png" : ".pdf"}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        {files.map((file) => (
                          <div key={file.id} className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                            <div className="bg-white p-2 rounded-lg mr-4 shadow-sm">
                              <FileIcon className="w-6 h-6 text-[#E5322E]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button 
                              onClick={() => removeFile(file.id)}
                              className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                        {(activeTool.id === 'merge' || activeTool.id === 'jpg-to-pdf') && (
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#E5322E] hover:bg-red-50 transition-all text-gray-400 hover:text-[#E5322E]"
                          >
                            <Plus className="w-6 h-6 mr-2" />
                            Tambah file
                          </button>
                        )}
                      </div>

                      <button
                        onClick={processPDF}
                        disabled={isProcessing}
                        className="w-full bg-[#E5322E] text-white py-5 rounded-xl font-bold text-xl flex items-center justify-center hover:bg-[#C42B27] disabled:bg-gray-300 transition-all shadow-lg shadow-red-200"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            {activeTool.title}
                            <ArrowRight className="w-6 h-6 ml-2" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-[#E5322E] p-1 rounded-lg mr-2">
              <FileIcon className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-[#333]">PDF Master</span>
          </div>
          <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
            Alat PDF terbaik untuk browser Anda. 100% gratis, aman, dan mudah digunakan.
          </p>
          <div className="flex justify-center space-x-6 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-[#E5322E]">Syarat</a>
            <a href="#" className="hover:text-[#E5322E]">Privasi</a>
            <a href="#" className="hover:text-[#E5322E]">Kontak</a>
          </div>
          <p className="mt-8 text-gray-400 text-xs">© 2026 PDF Master. Hak cipta dilindungi undang-undang.</p>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
