/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DatabaseState, saveDatabase } from '../dbStore';
import { PrinterId, PrintJob, Printer } from '../types';
import { Play, Printer as PrinterIcon, History, AlertCircle, RefreshCw, FileText, Settings, Sparkles } from 'lucide-react';

interface PrintingCenterProps {
  db: DatabaseState;
  setDb: (db: DatabaseState) => void;
}

export default function PrintingCenter({ db, setDb }: PrintingCenterProps) {
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedPrinterId, setSelectedPrinterId] = useState<PrinterId>('HP-1');
  const [layout, setLayout] = useState<'portrait' | 'landscape'>('portrait');
  const [pagesPerSheet, setPagesPerSheet] = useState<'1-up' | '2-up' | '4-up'>('1-up');
  const [duplex, setDuplex] = useState(true);
  const [copies, setCopies] = useState(50);

  // Load active printer job progress tracker in background
  useEffect(() => {
    // Check if there are any jobs in 'printing' or 'pending' status
    const interval = setInterval(() => {
      let stateChanged = false;
      let updatedPrinters = { ...db.printers };
      let updatedHistory = [...db.printHistory];
      let updatedBooks = [...db.books];

      // Find if any printer is currently printing
      Object.keys(updatedPrinters).forEach((pId) => {
        const printerId = pId as PrinterId;
        const printer = updatedPrinters[printerId];

        if (printer.status === 'printing' && printer.currentJobId) {
          // Progress increment
          const currentProgress = printer.progress || 0;
          if (currentProgress < 100) {
            updatedPrinters[printerId] = {
              ...printer,
              progress: currentProgress + 10 // Increase progress by 10% each interval tick
            };
            stateChanged = true;
          } else {
            // Completed!
            const completedJobId = printer.currentJobId;
            // Update Printer state to idle
            updatedPrinters[printerId] = {
              ...printer,
              status: 'idle',
              currentJobId: undefined,
              progress: undefined
            };

            // Update Job status in history
            updatedHistory = updatedHistory.map(job => {
              if (job.id === completedJobId) {
                return {
                  ...job,
                  status: 'completed' as const,
                  completedAt: new Date().toISOString()
                };
              }
              return job;
            });

            // Add printed quantities to the book!
            const jobDetail = updatedHistory.find(j => j.id === completedJobId);
            if (jobDetail) {
              updatedBooks = updatedBooks.map(b => {
                if (b.id === jobDetail.bookId) {
                  return {
                    ...b,
                    quantityPrinted: b.quantityPrinted + jobDetail.copies,
                    printingStatus: 'completed' as const
                  };
                }
                return b;
              });
            }

            stateChanged = true;
          }
        } else if (printer.status === 'idle') {
          // If printer is idle, look for a pending job in history for this printer
          const nextPendingJob = updatedHistory.find(job => job.printerId === printerId && job.status === 'pending');
          if (nextPendingJob) {
            // Activate printer
            updatedPrinters[printerId] = {
              ...printer,
              status: 'printing',
              currentJobId: nextPendingJob.id,
              progress: 0
            };

            // Update Job status to printing
            updatedHistory = updatedHistory.map(job => {
              if (job.id === nextPendingJob.id) {
                return { ...job, status: 'printing' as const };
              }
              return job;
            });

            // Update book status to printing
            updatedBooks = updatedBooks.map(b => {
              if (b.id === nextPendingJob.bookId) {
                return { ...b, printingStatus: 'printing' as const };
              }
              return b;
            });

            stateChanged = true;
          }
        }
      });

      if (stateChanged) {
        const newState = {
          ...db,
          printers: updatedPrinters,
          printHistory: updatedHistory,
          books: updatedBooks
        };
        setDb(newState);
        saveDatabase(newState);
      }
    }, 1500); // Check and simulate every 1.5 seconds

    return () => clearInterval(interval);
  }, [db, setDb]);

  // Handle triggering a new print job
  const handlePrintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) {
      alert('الرجاء اختيار الكتاب المراد طباعته من مستودع الملفات أولاً');
      return;
    }

    const selectedBook = db.books.find(b => b.id === selectedBookId)!;

    const newJob: PrintJob = {
      id: `pj-${Date.now()}`,
      bookId: selectedBook.id,
      series: selectedBook.series,
      subject: selectedBook.subject,
      grade: selectedBook.grade,
      printerId: selectedPrinterId,
      layout,
      pagesPerSheet,
      duplex,
      copies: Number(copies),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const newState = {
      ...db,
      printHistory: [newJob, ...db.printHistory]
    };

    setDb(newState);
    saveDatabase(newState);
    alert(`تم إرسال أمر الطباعة بنجاح إلى طابور طابعة ${selectedPrinterId}. ستبدأ الطباعة تلقائياً.`);
  };

  const handleResetQueue = () => {
    if (confirm('هل ترغب في مسح سجل الطابعات بالكامل وتصفير طابور الانتظار؟')) {
      const resetPrinters = { ...db.printers };
      Object.keys(resetPrinters).forEach((pId) => {
        resetPrinters[pId as PrinterId] = {
          ...resetPrinters[pId as PrinterId],
          status: 'idle',
          currentJobId: undefined,
          progress: undefined
        };
      });

      const newState = {
        ...db,
        printers: resetPrinters,
        printHistory: []
      };
      setDb(newState);
      saveDatabase(newState);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 font-sans tracking-tight">مركز وجدولة الطباعة الرقمية</h1>
          <p className="text-zinc-400 text-xs mt-1">مراقبة الطابعات الأربعة والتحكم في خيارات الإخراج (وجهين، ترتيب الصفحات) وجدولة ملفات الـ PDF يدوياً.</p>
        </div>
        <button
          onClick={handleResetQueue}
          className="px-3.5 py-1.5 bg-[#18181b] hover:bg-[#27272a] text-xs text-zinc-300 font-medium border border-[#27272a] rounded-lg transition duration-150"
        >
          تصفير طابور الطباعة
        </button>
      </div>

      {/* Printers Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(db.printers).map((printer) => {
          const currentJob = printer.currentJobId ? db.printHistory.find(j => j.id === printer.currentJobId) : null;
          return (
            <div
              key={printer.id}
              className={`border p-4 rounded-xl relative overflow-hidden transition-all duration-300 ${
                printer.status === 'printing'
                  ? 'bg-blue-950/10 border-blue-500/40 shadow-lg shadow-blue-500/5'
                  : 'bg-[#18181b] border-[#27272a]'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-1.5">
                    <PrinterIcon className={`w-4 h-4 ${printer.status === 'printing' ? 'text-blue-400 animate-bounce' : 'text-zinc-500'}`} />
                    {printer.name}
                  </h3>
                  <span className="text-[10px] text-zinc-500 block mt-1">منفذ شبكة محلي USB-0{printer.id.slice(-1)}</span>
                </div>
                <div>
                  {printer.status === 'printing' ? (
                    <span className="text-[10px] bg-blue-600 text-white font-medium px-2 py-0.5 rounded shadow-sm animate-pulse">
                      جاري الطباعة
                    </span>
                  ) : (
                    <span className="text-[10px] bg-[#09090b] text-zinc-400 border border-[#27272a] font-medium px-2 py-0.5 rounded">
                      جاهز (خامل)
                    </span>
                  )}
                </div>
              </div>

              {/* Progress and Job Detail */}
              {printer.status === 'printing' && currentJob ? (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[11px] font-medium text-zinc-300">
                    <span className="truncate max-w-[120px] font-medium text-zinc-200">[{currentJob.series}] {currentJob.subject}</span>
                    <span className="font-mono text-blue-400 font-bold">{printer.progress || 0}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#09090b] h-1.5 rounded-full overflow-hidden border border-[#27272a]/30">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${printer.progress || 0}%` }}
                    />
                  </div>

                  <div className="text-[10px] text-zinc-500 flex justify-between pt-0.5">
                    <span>الكمية: {currentJob.copies} نسخة</span>
                    <span className="font-mono">{currentJob.layout === 'portrait' ? 'عمودي' : 'أفقي'} • {currentJob.pagesPerSheet}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-8 text-center text-[11px] text-zinc-500">
                  لا توجد مهام نشطة حالياً على هذه الطابعة.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Print Dispatch Form */}
        <div className="bg-[#18181b] border border-[#27272a] p-6 rounded-xl space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 border-b border-[#27272a] pb-2.5">
              <Settings className="w-4 h-4 text-blue-400" />
              أمر طباعة جديد من القرص المحلي
            </h3>
            <p className="text-xs text-zinc-400">اختر الكتاب وسيقرأ النظام ملف الـ PDF الخاص به تلقائياً من القرص الصلب المخزن.</p>

            <form onSubmit={handlePrintSubmit} className="space-y-3.5">
              {/* Select Book */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">اختر الكتاب المراد طباعته:</label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- اختر الكتاب --</option>
                  {db.books.map(b => (
                    <option key={b.id} value={b.id}>
                      [{b.series}] {b.subject} - {b.grade} ({b.term})
                    </option>
                  ))}
                </select>

                {selectedBookId && (
                  <div className="mt-2 p-2 bg-[#09090b] rounded border border-[#27272a]/80 font-mono text-[9px] text-zinc-500 truncate">
                    مسار الملف: {db.books.find(b => b.id === selectedBookId)?.pdfPath}
                  </div>
                )}
              </div>

              {/* Select Printer */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">اختر الطابعة المستهدفة:</label>
                <select
                  value={selectedPrinterId}
                  onChange={(e) => setSelectedPrinterId(e.target.value as PrinterId)}
                  className="w-full px-3 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  {Object.values(db.printers).map(p => (
                    <option key={p.id} value={p.id} disabled={p.status === 'offline'}>
                      {p.name} {p.status === 'printing' ? '(مشغولة)' : '(جاهزة)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Print options */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">توجيه الورقة:</label>
                  <select
                    value={layout}
                    onChange={(e) => setLayout(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="portrait">Portrait (عمودي)</option>
                    <option value="landscape">Landscape (أفقي)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">تنسيق الصفحات:</label>
                  <select
                    value={pagesPerSheet}
                    onChange={(e) => setPagesPerSheet(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="1-up">صفحة في الورقة</option>
                    <option value="2-up">صفحتين (2-up)</option>
                    <option value="4-up">أربع صفحات (4-up)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">عدد النسخ المطلوبة:</label>
                  <input
                    type="number"
                    min="1"
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="duplex"
                    checked={duplex}
                    onChange={(e) => setDuplex(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-[#09090b] border-[#27272a] rounded focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="duplex" className="text-xs text-zinc-300 cursor-pointer select-none font-medium">
                    طباعة على الوجهين
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition duration-200 mt-3 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                إرسال إلى طابور الطباعة
              </button>
            </form>
          </div>
        </div>

        {/* Print History / Queue logs */}
        <div className="lg:col-span-2 bg-[#18181b] border border-[#27272a] rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 border-b border-[#27272a] pb-2.5">
              <History className="w-4 h-4 text-blue-400" />
              طابور المهام وسجل مخرجات الطابعات
            </h3>

            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3 text-xs">
              {db.printHistory.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">لا توجد مهام طباعة مسجلة بسجلات الطابعات.</div>
              ) : (
                db.printHistory.map((job) => (
                  <div key={job.id} className="p-3 bg-[#09090b]/80 rounded-lg border border-[#27272a]/60 flex justify-between items-center gap-2">
                    <div className="space-y-1">
                      <div className="font-medium text-zinc-200">
                        [{job.series}] {job.subject} - {job.grade}
                      </div>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-2 font-mono">
                        <span>الكمية: {job.copies} نسخة</span>
                        <span>•</span>
                        <span>الطابعة: {job.printerId}</span>
                        <span>•</span>
                        <span>{job.pagesPerSheet}</span>
                        {job.duplex && <span>• وجهين</span>}
                      </div>
                    </div>
                    <div>
                      {job.status === 'completed' && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                          اكتمل ✓
                        </span>
                      )}
                      {job.status === 'printing' && (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-medium animate-pulse">
                          جاري الطباعة...
                        </span>
                      )}
                      {job.status === 'pending' && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                          في الانتظار
                        </span>
                      )}
                      {job.status === 'failed' && (
                        <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-medium">
                          فشل!
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-blue-950/10 p-3.5 border border-blue-900/20 rounded-lg mt-6 flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
            <div className="text-[10px] text-zinc-400 space-y-1.5 leading-relaxed">
              <span className="font-semibold text-blue-300 block">مراقب الطباعة الذكي:</span>
              <span>هذه الصفحة تحاكي إرسال البيانات لطابعات ليزر حقيقية. تتم تعبئة كميات الكتب المطبوعة وتحديث مخازن الإنتاج ذاتياً فور وصول مؤشر الطابعة النشطة إلى 100%.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
