/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DatabaseState, saveDatabase } from '../dbStore';
import { Book } from '../types';
import { isDesktopApp } from '../api/electron';
import { Search, Plus, Filter, Edit, Trash2, CheckCircle2, AlertCircle, FileText, X } from 'lucide-react';

interface BooksManagementProps {
  db: DatabaseState;
  setDb: (db: DatabaseState) => void;
}

export default function BooksManagement({ db, setDb }: BooksManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeries, setFilterSeries] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterTerm, setFilterTerm] = useState('all');

  // Form states for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form Fields
  const [series, setSeries] = useState('');
  const [subject, setSubject] = useState('');
  const [stage, setStage] = useState('');
  const [grade, setGrade] = useState('');
  const [term, setTerm] = useState('');
  const [customerPrice, setCustomerPrice] = useState(100);
  const [branchPrice, setBranchPrice] = useState(80);
  const [wholesalePrice, setWholesalePrice] = useState(70);
  const [pdfPath, setPdfPath] = useState('C:\\BookFlow_PDFs\\');
  const [quantityPrinted, setQuantityPrinted] = useState(0);

  const resetForm = () => {
    setSeries(db.settings.series[0] || '');
    setSubject(db.settings.subjects[0] || '');
    setStage(db.settings.stages[0] || '');
    setGrade(db.settings.grades[0] || '');
    setTerm(db.settings.terms[0] || '');
    setCustomerPrice(100);
    setBranchPrice(80);
    setWholesalePrice(70);
    setPdfPath('C:\\BookFlow_PDFs\\');
    setQuantityPrinted(0);
    setEditingBook(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setSeries(book.series);
    setSubject(book.subject);
    setStage(book.stage);
    setGrade(book.grade);
    setTerm(book.term);
    setCustomerPrice(book.customerPrice);
    setBranchPrice(book.branchPrice);
    setWholesalePrice(book.wholesalePrice);
    setPdfPath(book.pdfPath);
    setQuantityPrinted(book.quantityPrinted);
    setIsModalOpen(true);
  };

  const handleDeleteBook = async (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الكتاب نهائياً من النظام؟ قد يؤثر هذا على السجلات المرتبطة.')) {
      try {
        if (isDesktopApp()) await window.electron!.books.remove(id);
        const newState = { ...db, books: db.books.filter(b => b.id !== id) };
        setDb(newState);
        if (!isDesktopApp()) saveDatabase(newState);
      } catch (error) {
        console.error('Unable to delete book:', error);
        alert('تعذر حذف الكتاب من قاعدة البيانات.');
      }
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!series || !subject || !grade || !term) {
      alert('يرجى تعبئة جميع الحقول الأساسية لكتابة البيانات بشكل صحيح');
      return;
    }

    const book: Book = {
      id: editingBook?.id ?? `book-${Date.now()}`, series, subject, stage, grade, term,
      customerPrice: Number(customerPrice), branchPrice: Number(branchPrice), wholesalePrice: Number(wholesalePrice),
      pdfPath, printingStatus: editingBook?.printingStatus ?? 'idle', quantityPrinted: Number(quantityPrinted)
    };
    try {
      const savedBook = isDesktopApp()
        ? await (editingBook ? window.electron!.books.update(book) : window.electron!.books.create(book))
        : book;
      const updatedBooks = editingBook
        ? db.books.map((item) => item.id === savedBook.id ? savedBook : item)
        : [...db.books, savedBook];
      const newState = { ...db, books: updatedBooks };
      setDb(newState);
      if (!isDesktopApp()) saveDatabase(newState);
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Unable to save book:', error);
      alert('تعذر حفظ الكتاب في قاعدة البيانات.');
    }
  };

  // Filter & Search Logic
  const filteredBooks = db.books.filter(book => {
    const matchesSearch =
      book.series.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.pdfPath.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeries = filterSeries === 'all' || book.series === filterSeries;
    const matchesSubject = filterSubject === 'all' || book.subject === filterSubject;
    const matchesStage = filterStage === 'all' || book.stage === filterStage;
    const matchesGrade = filterGrade === 'all' || book.grade === filterGrade;
    const matchesTerm = filterTerm === 'all' || book.term === filterTerm;

    return matchesSearch && matchesSeries && matchesSubject && matchesStage && matchesGrade && matchesTerm;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">مستودع الكتب والمناهج</h1>
          <p className="text-zinc-400 text-xs">إدارة كافة المناهج التعليمية وتفاصيل الأسعار ومواقع الـ PDF للمطبعة.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          إدراج كتاب جديد
        </button>
      </div>

      {/* Search and Advanced Filter Card */}
      <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="البحث السريع باسم السلسلة، المادة، الصف الدراسي أو مسار الملف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-zinc-900 border border-[#27272a] rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/80 font-sans"
            />
          </div>
        </div>

        {/* Dynamic Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-[#27272a]/60">
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">السلسلة</label>
            <select
              value={filterSeries}
              onChange={(e) => setFilterSeries(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-[#27272a] rounded text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">الكل</option>
              {db.settings.series.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">المادة</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-[#27272a] rounded text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">الكل</option>
              {db.settings.subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">المرحلة</label>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-[#27272a] rounded text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">الكل</option>
              {db.settings.stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">الصف</label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-[#27272a] rounded text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">الكل</option>
              {db.settings.grades.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">الترم</label>
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-[#27272a] rounded text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">الكل</option>
              {db.settings.terms.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Books Table / Grid */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
        {filteredBooks.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-2">
            <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm">لم يتم العثور على أي كتب تطابق المعايير المحددة.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-zinc-900/60 border-b border-[#27272a] text-zinc-400 text-xs font-semibold">
                  <th className="p-3">الكتاب والترم</th>
                  <th className="p-3">الصف والمرحلة</th>
                  <th className="p-3 text-center">سعر البيع (زبون)</th>
                  <th className="p-3 text-center">سعر الفروع</th>
                  <th className="p-3 text-center">سعر الجملة</th>
                  <th className="p-3">حالة ومسار ملف الـ PDF</th>
                  <th className="p-3 text-center">إجمالي المطبوع</th>
                  <th className="p-3 text-center">الخيارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/40 text-sm">
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-zinc-800/40 transition border-b border-[#27272a]/30 last:border-b-0">
                    <td className="p-3">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[11px] font-sans border border-blue-500/20">
                            {book.series}
                          </span>
                          <span>{book.subject}</span>
                        </div>
                        <span className="text-xs text-zinc-400">{book.term}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <span className="text-zinc-200 block">{book.grade}</span>
                        <span className="text-xs text-zinc-500">{book.stage}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-white">
                      {book.customerPrice} ج.م
                    </td>
                    <td className="p-3 text-center font-mono text-blue-400 font-bold">
                      {book.branchPrice} ج.م
                    </td>
                    <td className="p-3 text-center font-mono text-cyan-400 font-bold">
                      {book.wholesalePrice} ج.م
                    </td>
                    <td className="p-3 max-w-[200px]">
                      <div className="truncate text-xs font-mono text-zinc-400" title={book.pdfPath}>
                        {book.pdfPath}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {book.printingStatus === 'completed' && (
                          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-blue-500/20">
                            <CheckCircle2 className="w-2.5 h-2.5" /> جاهز للطلب
                          </span>
                        )}
                        {book.printingStatus === 'printing' && (
                          <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded animate-pulse border border-purple-500/20">
                            ● قيد الطباعة نشط
                          </span>
                        )}
                        {book.printingStatus === 'idle' && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-[#27272a]">
                            خامل (لم يطبع)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono text-zinc-300 font-bold">
                      {book.quantityPrinted} نسخة
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(book)}
                          className="p-1.5 hover:bg-zinc-800 text-zinc-300 rounded transition cursor-pointer"
                          title="تعديل تفاصيل الكتاب"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="p-1.5 hover:bg-red-950/60 text-red-400 rounded transition cursor-pointer"
                          title="حذف الكتاب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-2xl overflow-hidden desktop-shadow animate-fade-in text-right">
            <div className="flex justify-between items-center bg-zinc-900 p-4 border-b border-[#27272a]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                {editingBook ? 'تعديل بيانات الكتاب الحالي' : 'إدراج منهج دراسي جديد للمستودع'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Series selector */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">السلسلة التعليمية *</label>
                  <select
                    value={series}
                    onChange={(e) => setSeries(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-[#27272a] rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">-- اختر السلسلة --</option>
                    {db.settings.series.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Subject selector */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">المادة والمحتوى *</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-[#27272a] rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">-- اختر المادة --</option>
                    {db.settings.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Stage */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">المرحلة الدراسية *</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-[#27272a] rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">-- اختر المرحلة --</option>
                    {db.settings.stages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Grade */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">الصف الدراسي *</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-[#27272a] rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">-- اختر الصف --</option>
                    {db.settings.grades.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Term */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">الفصل الدراسي (الترم) *</label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-[#27272a] rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">-- اختر الترم --</option>
                    {db.settings.terms.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Local PDF File location */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">مسار ملف الـ PDF المحلي بالقرص *</label>
                  <input
                    type="text"
                    value={pdfPath}
                    onChange={(e) => setPdfPath(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-[#27272a] rounded-lg text-sm text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                    placeholder="C:\Books\Series\file.pdf"
                    required
                  />
                </div>
              </div>

              {/* Prices Section */}
              <div className="bg-zinc-900/60 p-4 rounded-lg border border-[#27272a] space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 border-b border-[#27272a] pb-1.5">تحديد تسعير المطبوعات (بالجنية المصري)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">سعر الزبون العادي</label>
                    <input
                      type="number"
                      value={customerPrice}
                      onChange={(e) => setCustomerPrice(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-zinc-950 border border-[#27272a] rounded text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">سعر الفروع الفرعية</label>
                    <input
                      type="number"
                      value={branchPrice}
                      onChange={(e) => setBranchPrice(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-zinc-950 border border-[#27272a] rounded text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">سعر كبار تجار الجملة</label>
                    <input
                      type="number"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-zinc-950 border border-[#27272a] rounded text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Extra details (initial quantity printed) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">إجمالي كمية النسخ المطبوعة سابقاً</label>
                <input
                  type="number"
                  value={quantityPrinted}
                  onChange={(e) => setQuantityPrinted(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-[#27272a] rounded-lg text-sm text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                  min="0"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-sm transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
                >
                  {editingBook ? 'تحديث وحفظ' : 'حفظ الكتاب بالمستودع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
