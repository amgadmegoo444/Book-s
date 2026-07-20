/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseState } from '../dbStore';
import { BookOpen, Calendar, CircleDollarSign, Printer, TrendingUp, Users, AlertCircle, Building2 } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  db: DatabaseState;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ db, setActiveTab }: DashboardProps) {
  // Calculations
  const totalBooks = db.books.length;
  const totalPrintedQty = db.books.reduce((acc, book) => acc + book.quantityPrinted, 0);
  const totalReservations = db.reservations.length;

  // Today's Date (from metadata: 2026-07-20)
  const TODAY_STR = '2026-07-20';
  const todayReservations = db.reservations.filter(r => r.createdAt.startsWith(TODAY_STR));
  const todayDeposits = todayReservations.reduce((acc, r) => acc + r.deposit, 0);
  const totalIncomeToday = todayReservations.reduce((acc, r) => acc + r.paidAmount, 0); // All payments received today

  // Books ready for delivery (total quantity requested in non-completed reservations that hasn't been delivered)
  let totalReadyForDelivery = 0;
  db.reservations.forEach(r => {
    if (r.status !== 'completed' && r.status !== 'cancelled') {
      r.items.forEach(item => {
        const remaining = item.quantityRequested - item.quantityDelivered;
        if (remaining > 0) {
          totalReadyForDelivery += remaining;
        }
      });
    }
  });

  // Books under printing (number of book models with status 'printing')
  const booksUnderPrinting = db.books.filter(b => b.printingStatus === 'printing').length;

  // Total branch debts
  const totalBranchDebts = db.branches.reduce((acc, b) => acc + b.debt, 0);

  // Active printer info
  const activePrinters = Object.values(db.printers).filter(p => p.status === 'printing').length;

  // Chart data: Debts per branch
  const branchDebtsData = db.branches.map(b => ({
    name: b.name.replace(' (الرئيسي)', '').replace('فرع ', ''),
    debt: b.debt
  })).filter(b => b.debt > 0);

  // Chart data: Printed qty by Series
  const seriesDataMap: Record<string, number> = {};
  db.books.forEach(b => {
    seriesDataMap[b.series] = (seriesDataMap[b.series] || 0) + b.quantityPrinted;
  });
  const seriesData = Object.entries(seriesDataMap).map(([name, qty]) => ({ name, qty }));

  const maxDebt = Math.max(...branchDebtsData.map(b => b.debt), 1000);
  const maxQty = Math.max(...seriesData.map(s => s.qty), 100);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Upper Welcome Panel */}
      <div className="bg-[#18181b] border border-[#27272a] p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-500">مرحباً بك في بوك فلو برو | BookFlow Pro</h1>
          <p className="text-zinc-400 mt-1 text-sm">
            نظام إدارة المطبوعات والمبيعات المتكامل للمطبعة والمكتبة. وضع العمل: <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-xs">أوفلاين بالكامل (نشط)</span>
          </p>
        </div>
        <div className="text-left md:text-right font-mono text-xs text-zinc-400 bg-zinc-900/60 p-3 rounded-lg border border-[#27272a]">
          <div>التوقيت المحلي: 2026-07-20 03:33 م</div>
          <div className="text-blue-400">المشغل الحالي: {db.employees.find(e => e.id === db.activeEmployeeId)?.name || 'أحمد عبد الرحمن'}</div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Books KPI */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-[#18181b] border border-[#27272a] p-5 rounded-xl cursor-pointer"
          onClick={() => setActiveTab('books')}
        >
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 text-sm font-medium">إجمالي الكتب المسجلة</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white font-mono">{totalBooks} <span className="text-xs font-sans text-zinc-500">(عناوين)</span></h3>
            <p className="text-xs text-blue-400 mt-1 font-mono">إجمالي المطبوع: {totalPrintedQty} نسخة</p>
          </div>
        </motion.div>

        {/* Reservations KPI */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-[#18181b] border border-[#27272a] p-5 rounded-xl cursor-pointer"
          onClick={() => setActiveTab('reservations')}
        >
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 text-sm font-medium">إجمالي طلبات الحجز</span>
            <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white font-mono">{totalReservations} <span className="text-xs font-sans text-zinc-500">(طلبات)</span></h3>
            <p className="text-xs text-yellow-500 mt-1">حجوزات نشطة وتوريدات قيد المتابعة</p>
          </div>
        </motion.div>

        {/* Deposits / Payments KPI */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-[#18181b] border border-[#27272a] p-5 rounded-xl cursor-pointer"
          onClick={() => setActiveTab('accounts')}
        >
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 text-sm font-medium">مقبوضات اليوم</span>
            <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white font-mono">{totalIncomeToday} ج.م</h3>
            <p className="text-xs text-green-500 mt-1 font-mono">منها عربونات اليوم: {todayDeposits} ج.م</p>
          </div>
        </motion.div>

        {/* Ready for Delivery / Printing KPI */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-[#18181b] border border-[#27272a] p-5 rounded-xl cursor-pointer"
          onClick={() => setActiveTab('production')}
        >
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 text-sm font-medium">جاهز للتسليم / قيد الطباعة</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white font-mono">{totalReadyForDelivery} <span className="text-xs font-sans text-zinc-500">نسخة معلقة</span></h3>
            <p className="text-xs text-purple-400 mt-1">
              {booksUnderPrinting} كتب قيد الطباعة حالياً ({activePrinters} طابعات تعمل)
            </p>
          </div>
        </motion.div>
      </div>

      {/* Analytics & Branch stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts and visualization */}
        <div className="lg:col-span-2 bg-[#18181b] border border-[#27272a] p-6 rounded-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            تحليلات الإنتاج والمبيعات
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 1: Debts per Branch (Pure SVG) */}
            <div className="bg-zinc-900/40 p-4 rounded-lg border border-[#27272a]">
              <h3 className="text-xs font-semibold text-zinc-300 mb-4 flex justify-between items-center">
                <span>مديونيات الفروع والعملاء (ج.م)</span>
                <span className="text-[10px] text-zinc-500 font-mono">الإجمالي: {totalBranchDebts} ج.م</span>
              </h3>
              {branchDebtsData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-zinc-500 text-xs">لا يوجد مديونيات فروع</div>
              ) : (
                <div className="space-y-3">
                  {branchDebtsData.map((b, i) => {
                    const pct = (b.debt / maxDebt) * 100;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">{b.name}</span>
                          <span className="text-white font-mono font-bold">{b.debt} ج.م</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chart 2: Quantity printed by Series (Pure SVG) */}
            <div className="bg-zinc-900/40 p-4 rounded-lg border border-[#27272a]">
              <h3 className="text-xs font-semibold text-zinc-300 mb-4 flex justify-between items-center">
                <span>الكميات المطبوعة حسب السلسلة (نسخة)</span>
                <span className="text-[10px] text-zinc-500 font-mono">الإجمالي: {totalPrintedQty}</span>
              </h3>
              {seriesData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-zinc-500 text-xs">لا توجد بيانات مطبوعات</div>
              ) : (
                <div className="space-y-3">
                  {seriesData.map((s, i) => {
                    const pct = (s.qty / maxQty) * 100;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">{s.name}</span>
                          <span className="text-white font-mono font-bold">{s.qty} نسخة</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Branches and Debts summary list */}
        <div className="bg-[#18181b] border border-[#27272a] p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            حالة الفروع والتوزيع
          </h2>

          <div className="divide-y divide-zinc-800/80 max-h-[300px] overflow-y-auto pr-1">
            {db.branches.map((br) => (
              <div key={br.id} className="py-3 flex justify-between items-center gap-2 border-b border-[#27272a]/40 last:border-none">
                <div>
                  <h4 className="text-sm font-semibold text-white">{br.name}</h4>
                  <span className="text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-[#27272a]/60">
                    {br.type === 'main' ? 'الفرع الرئيسي' : br.type === 'wholesale' ? 'عميل جملة' : 'فرع فرعي'}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold font-mono ${br.debt > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                    {br.debt} ج.م
                  </div>
                  <span className="text-[10px] text-zinc-500">مديونية</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab('branches')}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] text-xs rounded-lg text-zinc-300 font-medium transition"
            >
              عرض تفاصيل وحسابات الفروع ←
            </button>
          </div>
        </div>
      </div>

      {/* Fast Shortcuts Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
        <button
          onClick={() => setActiveTab('books')}
          className="p-3 bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] rounded-lg text-xs font-semibold text-zinc-300 transition text-center flex flex-col items-center gap-2 cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-blue-500" />
          إضافة / بحث كتاب جديد
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className="p-3 bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] rounded-lg text-xs font-semibold text-zinc-300 transition text-center flex flex-col items-center gap-2 cursor-pointer"
        >
          <Calendar className="w-4 h-4 text-yellow-500" />
          فاتورة حجز جديدة
        </button>
        <button
          onClick={() => setActiveTab('printing')}
          className="p-3 bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] rounded-lg text-xs font-semibold text-zinc-300 transition text-center flex flex-col items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-purple-400" />
          تشغيل أمر طباعة PDF
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className="p-3 bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] rounded-lg text-xs font-semibold text-zinc-300 transition text-center flex flex-col items-center gap-2 cursor-pointer"
        >
          <CircleDollarSign className="w-4 h-4 text-green-500" />
          قيد مصروف أو تحصيل
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className="col-span-2 sm:col-span-1 p-3 bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] rounded-lg text-xs font-semibold text-zinc-300 transition text-center flex flex-col items-center gap-2 cursor-pointer"
        >
          <Users className="w-4 h-4 text-cyan-400" />
          تصدير تقرير المبيعات
        </button>
      </div>
    </div>
  );
}
