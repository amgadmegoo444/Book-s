/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { DatabaseState } from '../dbStore';
import { FileText, Printer, FileDown, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

interface ReportsProps {
  db: DatabaseState;
}

type ReportType = 'reservations' | 'production' | 'printing' | 'sales' | 'branches' | 'employees';

export default function Reports({ db }: ReportsProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>('sales');

  const handlePrint = () => {
    window.print();
  };

  // Calculations for various reports
  const totalReservationsAmount = db.reservations.reduce((sum, r) => sum + r.netAmount, 0);
  const totalPaidReservations = db.reservations.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalRemainingBalance = db.reservations.reduce((sum, r) => sum + r.remainingBalance, 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-white">مركز التقارير المحاسبية والتشغيلية</h1>
          <p className="text-slate-400 text-xs">عرض وتصدير بيانات وتقارير مبيعات الكتب وحالة التشغيل والإنتاج مع دعم الطباعة الورقية.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            طباعة التقرير الحالي
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 print:hidden">
        {(['sales', 'reservations', 'production', 'printing', 'branches', 'employees'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedReport(type)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedReport === type
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {type === 'sales' && 'تقرير المبيعات والتحصيلات'}
            {type === 'reservations' && 'كشف الحجوزات والفواتير'}
            {type === 'production' && 'تقرير حالة الإنتاج والمخزون'}
            {type === 'printing' && 'سجل طابور وعمليات الطباعة'}
            {type === 'branches' && 'كشف مديونيات الفروع والوكلاء'}
            {type === 'employees' && 'إنتاجية ومسؤولية الموظفين'}
          </button>
        ))}
      </div>

      {/* Report Paper Container */}
      <div className="bg-slate-800/20 border border-slate-700/40 rounded-xl p-6 md:p-8 space-y-6 print:bg-white print:text-black print:border-none print:p-0">
        {/* Report Paper Header */}
        <div className="flex justify-between items-start border-b border-slate-700/60 pb-6 print:border-black">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white print:text-black">مؤسسة بوك فلو برو لطباعة وتوزيع الكتب</h2>
            <p className="text-xs text-slate-400 print:text-black">نظام إدارة المطبعة والمكتبة المتكامل - فرع التموين الرئيسي</p>
            <p className="text-[10px] text-slate-500 font-mono">تاريخ استخراج التقرير: 2026-07-20 | التوقيت المحلي</p>
          </div>
          <div className="text-left font-mono text-xs text-emerald-400 print:text-black bg-slate-900/40 p-3 rounded-lg border border-slate-800 print:border-none print:p-0">
            <div className="font-bold text-white print:text-black">تقرير تشغيلي داخلي</div>
            <div>رقم المستند: RP-{Date.now().toString().slice(-6)}</div>
            <div>الحالة: معتمد ومثبت</div>
          </div>
        </div>

        {/* Dynamic Report Content based on selection */}
        {selectedReport === 'sales' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-emerald-400 print:text-black">1. تقرير المبيعات والتحصيلات المالية الموحدة</h3>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg print:border-black">
                <span className="text-[11px] text-slate-400 print:text-black block">إجمالي مبيعات المناهج</span>
                <span className="text-base font-bold text-white font-mono print:text-black">{totalReservationsAmount} ج.م</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg print:border-black">
                <span className="text-[11px] text-slate-400 print:text-black block">المبالغ المقبوضة فعلياً</span>
                <span className="text-base font-bold text-emerald-400 font-mono print:text-black">{totalPaidReservations} ج.م</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg print:border-black">
                <span className="text-[11px] text-slate-400 print:text-black block">المتبقي دين بالذمة</span>
                <span className="text-base font-bold text-amber-500 font-mono print:text-black">{totalRemainingBalance} ج.م</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-300 border-b border-slate-700 print:border-black font-semibold">
                    <th className="p-2.5">رقم الفاتورة</th>
                    <th className="p-2.5">اسم العميل والفرع</th>
                    <th className="p-2.5 text-center">صافي القيمة</th>
                    <th className="p-2.5 text-center">المدفوع نقداً</th>
                    <th className="p-2.5 text-center">المتبقي عجز</th>
                    <th className="p-2.5 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30 print:text-black">
                  {db.reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-800/10">
                      <td className="p-2.5 font-mono font-bold text-white print:text-black">{res.invoiceNumber}</td>
                      <td className="p-2.5">{res.customerName}</td>
                      <td className="p-2.5 text-center font-mono font-bold">{res.netAmount} ج.م</td>
                      <td className="p-2.5 text-center font-mono text-emerald-400 print:text-black">{res.paidAmount}.00 ج.م</td>
                      <td className="p-2.5 text-center font-mono text-amber-500 print:text-black">{res.remainingBalance}.00 ج.م</td>
                      <td className="p-2.5 text-center">
                        {res.status === 'completed' ? 'مكتمل' : res.status === 'partial' ? 'جزئي' : res.status === 'cancelled' ? 'ملغي' : 'معلق'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === 'reservations' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 print:text-black">2. كشف طلبات الحجز والتوريد التفصيلي</h3>
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-300 border-b border-slate-700 font-semibold">
                    <th className="p-2.5">رقم الفاتورة</th>
                    <th className="p-2.5">العميل</th>
                    <th className="p-2.5">الكتب والمناهج المحجوزة</th>
                    <th className="p-2.5 text-center">الكمية المطلوبة</th>
                    <th className="p-2.5 text-center">الكمية المستلمة</th>
                    <th className="p-2.5 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {db.reservations.map((res) => (
                    <tr key={res.id}>
                      <td className="p-2.5 font-mono font-bold text-white print:text-black">{res.invoiceNumber}</td>
                      <td className="p-2.5">{res.customerName}</td>
                      <td className="p-2.5">
                        {res.items.map((i, idx) => (
                          <div key={idx} className="text-[10px] text-slate-400 print:text-black">
                            - {i.series}: {i.subject} ({i.grade})
                          </div>
                        ))}
                      </td>
                      <td className="p-2.5 text-center font-mono">
                        {res.items.reduce((sum, i) => sum + i.quantityRequested, 0)} نسخه
                      </td>
                      <td className="p-2.5 text-center font-mono text-emerald-400 print:text-black">
                        {res.items.reduce((sum, i) => sum + i.quantityDelivered, 0)} نسخه
                      </td>
                      <td className="p-2.5 text-center">{res.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === 'production' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 print:text-black">3. تقرير حالة المطبوعات والإنتاج بالمخزن</h3>
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-300 border-b border-slate-700 font-semibold">
                    <th className="p-2.5">السلسلة والمادة</th>
                    <th className="p-2.5">الصف والترم</th>
                    <th className="p-2.5 text-center">الكمية الإجمالية المطبوعة</th>
                    <th className="p-2.5 text-center">مسار ملف الـ PDF المحلي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {db.books.map((b) => (
                    <tr key={b.id}>
                      <td className="p-2.5 font-bold text-white print:text-black">[{b.series}] {b.subject}</td>
                      <td className="p-2.5">{b.grade} - {b.term}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-emerald-400 print:text-black">{b.quantityPrinted} نسخة</td>
                      <td className="p-2.5 font-mono text-slate-400 text-[10px] truncate max-w-[200px] print:text-black">{b.pdfPath}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === 'printing' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 print:text-black">4. سجل وتاريخ عمليات الطباعة الرقمية</h3>
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-300 border-b border-slate-700 font-semibold">
                    <th className="p-2.5">تاريخ الأمر</th>
                    <th className="p-2.5">الكتاب المطبوع</th>
                    <th className="p-2.5 text-center">الطابعة</th>
                    <th className="p-2.5 text-center">النسخ المطبوعة</th>
                    <th className="p-2.5 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {db.printHistory.map((h) => (
                    <tr key={h.id}>
                      <td className="p-2.5 text-slate-400 print:text-black font-mono">{new Date(h.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td className="p-2.5 font-bold text-white print:text-black">[{h.series}] {h.subject} ({h.grade})</td>
                      <td className="p-2.5 text-center font-mono">{h.printerId}</td>
                      <td className="p-2.5 text-center font-mono">{h.copies} نسخة</td>
                      <td className="p-2.5 text-center">{h.status === 'completed' ? 'ناجح ✓' : 'معلق'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === 'branches' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 print:text-black">5. كشف مديونيات وحسابات الفروع والوكلاء المعتمدين</h3>
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-300 border-b border-slate-700 font-semibold">
                    <th className="p-2.5">اسم الفرع / العميل</th>
                    <th className="p-2.5">نوع الحساب</th>
                    <th className="p-2.5 text-center">المديونية المستحقة (ج.م)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {db.branches.map((b) => (
                    <tr key={b.id}>
                      <td className="p-2.5 font-bold text-white print:text-black">{b.name}</td>
                      <td className="p-2.5">{b.type === 'main' ? 'الفرع الرئيسي التمويني' : b.type === 'sub' ? 'فرع فرعي' : 'عميل جملة'}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-amber-500 print:text-black">{b.debt} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === 'employees' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 print:text-black">6. تقرير إنتاجية ومسؤولية الموظفين بالخزينة والطباعة</h3>
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-300 border-b border-slate-700 font-semibold">
                    <th className="p-2.5">الموظف</th>
                    <th className="p-2.5">الوظيفة والصلاحية</th>
                    <th className="p-2.5 text-center">الحجوزات التي أنشأها</th>
                    <th className="p-2.5 text-center">التوريدات التي سلمها</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {db.employees.map((emp) => {
                    const createdCount = db.reservations.filter(r => r.employeeId === emp.id).length;
                    const deliveredCount = db.reservations.filter(r => r.deliveryEmployeeId === emp.id).length;
                    return (
                      <tr key={emp.id}>
                        <td className="p-2.5 font-bold text-white print:text-black">{emp.name}</td>
                        <td className="p-2.5">{emp.role === 'admin' ? 'مدير النظام' : emp.role === 'sales' ? 'مبيعات' : emp.role === 'printer' ? 'مشغل طابعة' : 'تسليم'}</td>
                        <td className="p-2.5 text-center font-mono">{createdCount} فاتورة</td>
                        <td className="p-2.5 text-center font-mono text-emerald-400 print:text-black">{deliveredCount} طلب توريد</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report Paper Footer */}
        <div className="pt-8 border-t border-slate-700/60 flex justify-between text-[11px] text-slate-500 print:border-black print:text-black">
          <div>توقيع المدير المسؤول بالمطبعة: _________________</div>
          <div>الختم الرسمي للمؤسسة: _________________</div>
        </div>
      </div>
    </div>
  );
}
