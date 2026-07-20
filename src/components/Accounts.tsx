/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DatabaseState, saveDatabase } from '../dbStore';
import { Expense } from '../types';
import { CircleDollarSign, Plus, Calculator, Wallet, ArrowUpRight, ArrowDownRight, Receipt, Trash2 } from 'lucide-react';

interface AccountsProps {
  db: DatabaseState;
  setDb: (db: DatabaseState) => void;
}

export default function Accounts({ db, setDb }: AccountsProps) {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(100);

  // Financial calculations
  const TODAY_STR = '2026-07-20';

  // 1. Deposits received today
  const reservationsToday = db.reservations.filter(r => r.createdAt.startsWith(TODAY_STR));
  const todayDeposits = reservationsToday.reduce((sum, r) => sum + r.deposit, 0);

  // 2. All money paid/collected today (including deposits and other payments)
  const todayPaymentsCollected = reservationsToday.reduce((sum, r) => sum + r.paidAmount, 0);

  // 3. Outstanding Balances on active reservations (Customer Debts)
  const totalCustomerDebts = db.reservations
    .filter(r => r.customerType === 'regular' && r.status !== 'cancelled')
    .reduce((sum, r) => sum + r.remainingBalance, 0);

  // 4. Branch Debts
  const totalBranchDebts = db.branches
    .filter(b => b.type === 'sub')
    .reduce((sum, b) => sum + b.debt, 0);

  // 5. Wholesale Debts
  const totalWholesaleDebts = db.branches
    .filter(b => b.type === 'wholesale')
    .reduce((sum, b) => sum + b.debt, 0);

  // 6. Total Discounts granted
  const totalDiscounts = db.reservations
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + r.discount, 0);

  // 7. Expenses
  const totalExpenses = db.expenses.reduce((sum, e) => sum + e.amount, 0);

  // 8. Total gross sales (net amount of all non-cancelled reservations)
  const totalGrossSales = db.reservations
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + r.netAmount, 0);

  // 9. Profit = Money Collected - Expenses
  const totalMoneyCollected = db.reservations
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + r.paidAmount, 0);

  const netBalance = totalMoneyCollected - totalExpenses;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || expenseAmount <= 0) return;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      title: expenseTitle,
      amount: Number(expenseAmount),
      employeeId: db.activeEmployeeId,
      date: TODAY_STR
    };

    const newState = {
      ...db,
      expenses: [newExpense, ...db.expenses]
    };

    setDb(newState);
    saveDatabase(newState);
    setExpenseTitle('');
    setExpenseAmount(100);
    setShowExpenseForm(false);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('هل ترغب في حذف بند المصروفات هذا من السجلات دفترياً؟')) {
      const newState = {
        ...db,
        expenses: db.expenses.filter(e => e.id !== id)
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
          <h1 className="text-xl font-semibold text-zinc-100 font-sans tracking-tight">الخزينة والمحاسبة المالية الموحدة</h1>
          <p className="text-zinc-400 text-xs mt-1">كشف حركة النقدية اليومية، المبيعات الإجمالية، الديون بالذمة للفروع والزبائن والمصروفات النقدية للمطبعة.</p>
        </div>
      </div>

      {/* Grid counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Money In today */}
        <div className="bg-[#18181b] border border-emerald-500/20 p-5 rounded-xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-emerald-400">
            <span className="text-xs font-medium">متحصلات المقبوضات اليوم</span>
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-100 font-sans tracking-tight">{todayPaymentsCollected} ج.م</h3>
          <p className="text-[10px] text-emerald-500 font-medium">منها عربونات الحجوزات اليوم: {todayDeposits} ج.م</p>
        </div>

        {/* Expenses */}
        <div className="bg-[#18181b] border border-red-500/20 p-5 rounded-xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-red-400">
            <span className="text-xs font-medium">إجمالي المصروفات التشغيلية</span>
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-100 font-sans tracking-tight">{totalExpenses} ج.م</h3>
          <p className="text-[10px] text-red-400 font-medium">تشمل المواد الخام والتجليد والأوراق</p>
        </div>

        {/* Branch Outstanding */}
        <div className="bg-[#18181b] border border-[#27272a] p-5 rounded-xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-amber-400">
            <span className="text-xs font-medium">ديون الفروع والوكلاء بالذمة</span>
            <Wallet className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-100 font-sans tracking-tight">{totalBranchDebts + totalWholesaleDebts} ج.م</h3>
          <p className="text-[10px] text-zinc-500">منها وكلاء جملة: {totalWholesaleDebts} ج.م</p>
        </div>

        {/* Customer Debts */}
        <div className="bg-[#18181b] border border-[#27272a] p-5 rounded-xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-blue-400">
            <span className="text-xs font-medium">ديون ومتبقي الزبائن العادية</span>
            <Receipt className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-100 font-sans tracking-tight">{totalCustomerDebts} ج.م</h3>
          <p className="text-[10px] text-zinc-500">مبالغ متبقية على فواتير لم تسلم بالكامل</p>
        </div>
      </div>

      {/* Ledger details split view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Balance Sheet Summary (Column 1) */}
        <div className="bg-[#18181b] border border-[#27272a] p-6 rounded-xl space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 border-b border-[#27272a] pb-2.5">
            <Calculator className="w-4 h-4 text-blue-400" />
            الميزانية التشغيلية النقدية الصافية
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>إجمالي المقبوضات المحصلة نقداً:</span>
              <span className="font-mono text-emerald-400 font-semibold">+{totalMoneyCollected} ج.م</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>إجمالي المصروفات المنفقة:</span>
              <span className="font-mono text-red-400 font-semibold">-{totalExpenses} ج.م</span>
            </div>
            <hr className="border-[#27272a]" />
            <div className="flex justify-between items-center bg-[#09090b] p-3 rounded-lg border border-[#27272a]">
              <span className="font-semibold text-zinc-300">السيولة النقدية بالخزينة:</span>
              <span className={`font-mono text-sm font-semibold ${netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {netBalance} ج.م
              </span>
            </div>

            <div className="pt-2.5 space-y-2.5 border-t border-[#27272a]/60 text-[11px] text-zinc-500">
              <div className="flex justify-between">
                <span>إجمالي الخصومات المعطاة للزبائن:</span>
                <span className="font-mono text-red-400">{totalDiscounts} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span>إجمالي مبيعات المناهج المحجوزة:</span>
                <span className="font-mono text-blue-400">{totalGrossSales} ج.م</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Register (Column 2 & 3) */}
        <div className="lg:col-span-2 bg-[#18181b] border border-[#27272a] rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#27272a] pb-2.5">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-red-400" />
                دفتر قيد المصروفات والمشتريات التشغيلية
              </h3>
              <button
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="px-3 py-1.5 bg-[#09090b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 text-xs font-medium rounded-lg transition duration-150 cursor-pointer"
              >
                + قيد مصروف جديد
              </button>
            </div>

            {/* Collapse Add Expense */}
            {showExpenseForm && (
              <form onSubmit={handleAddExpense} className="p-4 bg-[#09090b] border border-[#27272a] rounded-lg space-y-3 animate-fade-in shadow-inner">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">بيان المصروف (البند) *</label>
                    <input
                      type="text"
                      value={expenseTitle}
                      onChange={(e) => setExpenseTitle(e.target.value)}
                      placeholder="مثال: شراء أحبار HP-1، ورق تجليد..."
                      className="w-full px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg text-zinc-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-medium">المبلغ المصروف (ج.م) *</label>
                    <input
                      type="number"
                      min="1"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowExpenseForm(false)}
                    className="px-3.5 py-1.5 bg-[#18181b] hover:bg-[#27272a] text-zinc-400 text-[11px] rounded-lg transition duration-150 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium rounded-lg transition duration-150 cursor-pointer"
                  >
                    تثبيت المصروف بالخزينة
                  </button>
                </div>
              </form>
            )}

            {/* Expenses Table */}
            <div className="max-h-[220px] overflow-y-auto pr-1">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-zinc-400 font-medium border-b border-[#27272a]">
                    <th className="p-2.5">بيان البند والنفقة</th>
                    <th className="p-2.5 text-center">المسؤول</th>
                    <th className="p-2.5 text-center">القيمة المنفقة</th>
                    <th className="p-2.5 text-center">التاريخ</th>
                    <th className="p-2.5 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]/30 text-zinc-300">
                  {db.expenses.map((e) => {
                    const empName = db.employees.find(emp => emp.id === e.employeeId)?.name || 'المدير';
                    return (
                      <tr key={e.id} className="hover:bg-[#27272a]/10 transition duration-150">
                        <td className="p-2.5 font-medium text-zinc-200">{e.title}</td>
                        <td className="p-2.5 text-center text-zinc-400">{empName}</td>
                        <td className="p-2.5 text-center font-mono font-semibold text-red-400">{e.amount} ج.م</td>
                        <td className="p-2.5 text-center text-[10px] text-zinc-500 font-mono">{e.date}</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="p-1 hover:bg-red-950/40 text-red-400 rounded cursor-pointer transition duration-150"
                            title="حذف بند المصروفات"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
