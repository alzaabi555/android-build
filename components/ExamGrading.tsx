
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, ExamPaper, GradingData } from '../types';
import { ChevronRight, Save, FileText, Check, X, Calculator, Upload, Trash2, Maximize2, AlertCircle, PenTool, ExternalLink, ChevronLeft, Loader2, ZoomIn, ZoomOut, Move } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker locally for offline support
// The worker file is copied to www/pdf.worker.js during build
pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.js';

interface ExamGradingProps {
  student: Student;
  onUpdateStudent: (s: Student) => void;
  onBack: () => void;
  teacherInfo: any;
}

interface Marker {
    id: string;
    type: 'correct' | 'wrong' | 'partial';
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    label?: string;
    score?: number;
}

const ExamGrading: React.FC<ExamGradingProps> = ({ student, onUpdateStudent, onBack, teacherInfo }) => {
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const [papers, setPapers] = useState<ExamPaper[]>(student.examPapers || []);
  
  // --- PDF Rendering State ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paperContainerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfScale, setPdfScale] = useState(1.0); // Start at 100%
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  // --- Grading State ---
  const [currentGrading, setCurrentGrading] = useState<GradingData>({
      mcq: [null, null, null, null, null],
      essay: { q6: { a: 0 }, q7: { a: 0 }, q8: { a: 0 }, q9: { a: 0 } }
  });

  // --- Visual Markers State ---
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);

  // --- Load Paper & Grading Data ---
  useEffect(() => {
      if (activePaperId) {
          const paper = papers.find(p => p.id === activePaperId);
          if (paper) {
              if (paper.gradingData) setCurrentGrading(paper.gradingData);
              else setCurrentGrading({ mcq: [null, null, null, null, null], essay: { q6: { a: 0 }, q7: { a: 0 }, q8: { a: 0 }, q9: { a: 0 } } });

              if (paper.fileData.startsWith('data:application/pdf')) {
                  loadPdf(paper.fileData);
              } else {
                  setPdfDoc(null);
              }
              setMarkers([]);
          }
      }
  }, [activePaperId]);

  // --- Sync Markers with Grading Data ---
  useEffect(() => {
      const newMarkers: Marker[] = [];
      currentGrading.mcq.forEach((val, idx) => {
          if (val !== null) {
              const id = `mcq-${idx}`;
              const existing = markers.find(m => m.id === id);
              newMarkers.push({
                  id,
                  type: val === 1 ? 'correct' : 'wrong',
                  x: existing ? existing.x : 10,
                  y: existing ? existing.y : 10 + (idx * 5),
                  label: `س${idx + 1}`
              });
          }
      });

      Object.entries(currentGrading.essay).forEach(([qKey, parts], idx) => {
          const total = Object.values(parts).reduce((a, b) => a + (Number(b)||0), 0);
          if (total > 0) {
              const id = `essay-${qKey}`;
              const existing = markers.find(m => m.id === id);
              newMarkers.push({
                  id,
                  type: 'partial',
                  x: existing ? existing.x : 80,
                  y: existing ? existing.y : 20 + (idx * 10),
                  label: qKey.replace('q', 'س'),
                  score: total
              });
          }
      });

      if (newMarkers.length !== markers.length || newMarkers.some((nm, i) => !markers[i] || markers[i].type !== nm.type || markers[i].score !== nm.score)) {
          const merged = newMarkers.map(nm => {
              const prev = markers.find(pm => pm.id === nm.id);
              return prev ? { ...nm, x: prev.x, y: prev.y } : nm;
          });
          setMarkers(merged);
      }
  }, [currentGrading]);

  // --- Render PDF Page ---
  useEffect(() => {
      if (pdfDoc) {
          renderPage(pageNum);
      }
  }, [pdfDoc, pageNum, pdfScale]);

  const loadPdf = async (base64Data: string) => {
      setIsPdfLoading(true);
      setPdfError(false);
      try {
          const pdfData = atob(base64Data.split(',')[1]);
          const loadingTask = pdfjsLib.getDocument({ data: pdfData });
          const doc = await loadingTask.promise;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setPageNum(1);
          setIsPdfLoading(false);
      } catch (error) {
          console.error('Error loading PDF:', error);
          setPdfError(true);
          setIsPdfLoading(false);
      }
  };

  const renderPage = async (num: number) => {
      if (!pdfDoc || !canvasRef.current) return;
      try {
          const page = await pdfDoc.getPage(num);
          const viewport = page.getViewport({ scale: pdfScale });
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              const renderContext = { canvasContext: context, viewport: viewport };
              await page.render(renderContext).promise;
          }
      } catch (e) { console.error('Render error:', e); }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
      e.stopPropagation();
      setDraggingMarkerId(id);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!draggingMarkerId || !paperContainerRef.current) return;
      
      const container = paperContainerRef.current.getBoundingClientRect();
      let clientX, clientY;

      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }

      const x = ((clientX - container.left) / container.width) * 100;
      const y = ((clientY - container.top) / container.height) * 100;

      setMarkers(prev => prev.map(m => m.id === draggingMarkerId ? { ...m, x, y } : m));
  };

  const handleMouseUp = () => {
      setDraggingMarkerId(null);
  };

  const mcqScore = useMemo(() => currentGrading.mcq.reduce((acc, val) => acc + (val || 0), 0), [currentGrading.mcq]);
  const essayScore = useMemo(() => {
      let total = 0;
      Object.values(currentGrading.essay).forEach(parts => Object.values(parts).forEach(val => total += Number(val) || 0));
      return total;
  }, [currentGrading.essay]);
  const totalScore = mcqScore + essayScore;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const newPaper: ExamPaper = {
                  id: Math.random().toString(36).substr(2, 9),
                  title: `ورقة اختبار ${papers.length + 1}`,
                  fileData: reader.result as string,
                  date: new Date().toISOString()
              };
              const updatedPapers = [newPaper, ...papers];
              setPapers(updatedPapers);
              onUpdateStudent({ ...student, examPapers: updatedPapers });
              setActivePaperId(newPaper.id);
          };
          reader.readAsDataURL(file);
      }
  };

  const saveGrading = () => {
      if (!activePaperId) return;
      const updatedPapers = papers.map(p => {
          if (p.id === activePaperId) {
              return { ...p, gradingData: currentGrading, totalScore: totalScore, maxScore: 100 };
          }
          return p;
      });
      onUpdateStudent({ ...student, examPapers: updatedPapers });
      setPapers(updatedPapers);
      alert(`تم حفظ الدرجة: ${totalScore} ✅`);
  };

  const toggleMCQ = (index: number) => {
      const newMcq = [...currentGrading.mcq];
      const current = newMcq[index];
      if (current === null) newMcq[index] = 1;
      else if (current === 1) newMcq[index] = 0;
      else newMcq[index] = null;
      setCurrentGrading({ ...currentGrading, mcq: newMcq });
  };

  const updateEssayScore = (qKey: string, partKey: string, val: string) => {
      const numVal = parseFloat(val);
      if (isNaN(numVal)) return;
      const newEssay = { ...currentGrading.essay };
      if (!newEssay[qKey]) newEssay[qKey] = {};
      newEssay[qKey][partKey] = numVal;
      setCurrentGrading({ ...currentGrading, essay: newEssay });
  };

  const activePaper = papers.find(p => p.id === activePaperId);
  const isImage = activePaper?.fileData.startsWith('data:image');

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] text-slate-900 dark:text-white pb-20" onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>
        <div className="glass-heavy px-4 py-3 flex justify-between items-center border-b border-white/20 shrink-0 z-20">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 glass-icon rounded-full hover:bg-white/10"><ChevronRight className="w-5 h-5"/></button>
                <div><h2 className="text-lg font-black">{student.name}</h2><p className="text-xs text-slate-500 dark:text-white/60 font-bold">المصحح الإلكتروني</p></div>
            </div>
            <div className="flex items-center gap-4"><div className="bg-indigo-600 px-4 py-2 rounded-xl text-white font-black flex items-center gap-2 shadow-lg shadow-indigo-500/30"><Calculator className="w-4 h-4" /><span className="text-lg">{totalScore}</span><span className="text-[10px] opacity-70">درجة</span></div><button onClick={saveGrading} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg hover:bg-emerald-600 transition-all active:scale-95" title="حفظ الدرجة"><Save className="w-5 h-5" /></button></div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
            <div className="w-full md:w-[320px] bg-slate-50 dark:bg-black/20 border-l border-white/10 flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-4 gap-6 z-10 shadow-xl">
                {!activePaper ? (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl bg-white/5 p-6 text-center">
                        <Upload className="w-12 h-12 text-indigo-400 mb-4" /><h3 className="font-bold text-slate-700 dark:text-white mb-2">رفع ورقة جديدة</h3>
                        <label className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black cursor-pointer hover:bg-indigo-700 transition-all shadow-lg">اختيار ملف<input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} /></label>
                        {papers.length > 0 && (<div className="w-full mt-6 space-y-2"><p className="text-[10px] font-bold text-slate-400 text-right">الأوراق المحفوظة:</p>{papers.map(p => (<button key={p.id} onClick={() => setActivePaperId(p.id)} className="w-full p-3 glass-card rounded-xl text-xs font-bold flex justify-between items-center hover:bg-white/10"><span>{p.title}</span>{p.totalScore !== undefined && <span className="bg-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded text-[10px]">{p.totalScore}</span>}</button>))}</div>)}
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center"><h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2"><PenTool className="w-4 h-4 text-purple-500" />الموضوعي</h3><button onClick={() => setActivePaperId(null)} className="text-[10px] text-red-400 font-bold hover:underline">تغيير</button></div>
                        <div className="grid grid-cols-5 gap-2">{currentGrading.mcq.map((val, idx) => (<button key={idx} onClick={() => toggleMCQ(idx)} className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-200 shadow-sm border ${val === 1 ? 'bg-emerald-500 text-white border-emerald-600 scale-105' : val === 0 ? 'bg-rose-500 text-white border-rose-600 scale-95 opacity-80' : 'bg-white dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10'}`}><span className="text-[10px] font-bold mb-1 opacity-70">س{idx + 1}</span>{val === 1 ? <Check className="w-6 h-6" strokeWidth={4} /> : val === 0 ? <X className="w-6 h-6" strokeWidth={4} /> : <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/20"></div>}</button>))}</div>
                        <div className="h-px bg-slate-200 dark:bg-white/10 w-full my-2"></div>
                        <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" />المقالي</h3>
                        <div className="space-y-3">{Object.entries(currentGrading.essay).map(([qKey, parts]) => (<div key={qKey} className="glass-card p-3 rounded-2xl border border-white/20 bg-white/5"><div className="flex justify-between items-center mb-3"><span className="font-black text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-lg">{qKey.replace('q', 'سؤال ')}</span><span className="font-mono font-bold text-lg text-slate-700 dark:text-white">{Object.values(parts).reduce((a, b) => a + (Number(b)||0), 0)}</span></div><div className="grid grid-cols-3 gap-2">{Object.entries(parts).map(([partKey, val]) => (<div key={partKey} className="relative"><span className="absolute -top-2 right-2 text-[9px] font-bold bg-white dark:bg-slate-800 px-1 rounded text-slate-400 uppercase">{partKey}</span><input type="number" value={val} onChange={(e) => updateEssayScore(qKey, partKey, e.target.value)} className="w-full text-center font-bold text-lg p-2 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-500" /></div>))}</div></div>))}</div>
                    </>
                )}
            </div>

            <div className="flex-1 bg-slate-200 dark:bg-[#151515] relative overflow-hidden flex flex-col" onMouseMove={handleMouseMove} onTouchMove={handleMouseMove}>
                {activePaper ? (
                    <>
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl">
                            <button onClick={() => setPdfScale(s => Math.max(0.5, s - 0.2))} className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors"><ZoomOut className="w-5 h-5"/></button>
                            <span className="text-xs font-black text-white min-w-[40px] text-center">{Math.round(pdfScale * 100)}%</span>
                            <button onClick={() => setPdfScale(s => Math.min(3, s + 0.2))} className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors"><ZoomIn className="w-5 h-5"/></button>
                            {!isImage && (<><div className="w-px h-5 bg-white/20 mx-1"></div><button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1} className="p-2 text-white hover:bg-white/20 rounded-xl disabled:opacity-30"><ChevronRight className="w-5 h-5"/></button><span className="text-xs font-bold text-white">{pageNum} / {numPages}</span><button onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum >= numPages} className="p-2 text-white hover:bg-white/20 rounded-xl disabled:opacity-30"><ChevronLeft className="w-5 h-5"/></button></>)}
                        </div>
                        <div className="flex-1 w-full h-full overflow-auto custom-scrollbar flex items-start justify-center p-8 bg-slate-200 dark:bg-[#121212]">
                            <div className="relative bg-white shadow-2xl transition-transform duration-200" ref={paperContainerRef} style={{ width: isImage ? `${80 * pdfScale}%` : 'auto' }}>
                                {isPdfLoading ? (<div className="flex flex-col items-center justify-center p-20 opacity-50 min-h-[500px] w-full"><Loader2 className="w-10 h-10 animate-spin text-slate-500 mb-2"/><p className="text-xs font-bold text-slate-500">جاري المعالجة...</p></div>) : pdfError ? (<div className="text-center p-10 bg-white rounded-xl"><AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-2"/><p className="text-slate-800 font-bold mb-2">تعذر عرض الملف</p><a href={activePaper.fileData} target="_blank" className="text-blue-600 underline text-xs">فتح خارجي</a></div>) : isImage ? (<img src={activePaper.fileData} className="w-full h-auto block" alt="Paper" draggable={false} />) : (<canvas ref={canvasRef} className="block" />)}
                                <div className="absolute top-4 left-4 z-20 transform -rotate-12 border-4 border-red-600 text-red-600 px-4 py-2 rounded-xl text-3xl font-black opacity-80 pointer-events-none mix-blend-multiply bg-transparent">{totalScore}</div>
                                {markers.map((marker) => (<div key={marker.id} onMouseDown={(e) => handleDragStart(e, marker.id)} onTouchStart={(e) => handleDragStart(e, marker.id)} className={`absolute z-10 cursor-move transform -translate-x-1/2 -translate-y-1/2 ${draggingMarkerId === marker.id ? 'scale-125 z-50' : 'hover:scale-110'} transition-transform`} style={{ left: `${marker.x}%`, top: `${marker.y}%` }}>{marker.type === 'correct' && <Check className="w-8 h-8 text-emerald-600 drop-shadow-md stroke-[4]" />}{marker.type === 'wrong' && <X className="w-8 h-8 text-rose-600 drop-shadow-md stroke-[4]" />}{marker.type === 'partial' && (<div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-md border-2 border-white">{marker.score}</div>)}{marker.label && (<div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] bg-black/70 text-white px-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">{marker.label}</div>)}</div>))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30"><FileText className="w-32 h-32 text-slate-500 mb-4" /><p className="font-black text-2xl text-slate-500">منطقة عرض الورقة</p></div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ExamGrading;
