/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DatabaseState, saveDatabase } from '../dbStore';
import { Employee } from '../types';
import { isDesktopApp } from '../api/electron';
import { Users, Search, Plus, Trash2, Edit3, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface EmployeesProps {
  db: DatabaseState;
  setDb: (db: DatabaseState) => void;
}

export default function Employees({ db, setDb }: EmployeesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'printer' | 'sales' | 'delivery'>('sales');
  const [phone, setPhone] = useState('');

  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);

  const filteredEmployees = db.employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.phone.includes(searchTerm)
  );

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const employee: Employee = { id: editingEmpId ?? `emp-${Date.now()}`, name, role, phone };
    try {
      const saved = isDesktopApp()
        ? await (editingEmpId ? window.electron!.employees.update(employee) : window.electron!.employees.create(employee))
        : employee;
      const updatedEmployees = editingEmpId
        ? db.employees.map((item) => item.id === saved.id ? saved : item)
        : [...db.employees, saved];
      const newState = { ...db, employees: updatedEmployees };
      setDb(newState);
      if (!isDesktopApp()) saveDatabase(newState);
      setEditingEmpId(null);
    } catch (error) {
      console.error('Unable to save employee:', error);
      alert('تعذر حفظ بيانات الموظف.');
      return;
    }

    // Reset Form
    setName('');
    setPhone('');
    setRole('sales');
    setShowAddForm(false);
    alert('تم حفظ كود بيانات الموظف بنجاح في السجل!');
  };

  const handleEditClick = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setName(emp.name);
    setPhone(emp.phone);
    setRole(emp.role);
    setShowAddForm(true);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (id === db.activeEmployeeId) {
      alert('لا يمكنك حذف الموظف النشط حالياً في الجلسة المحاكاة!');
      return;
    }
    if (confirm('هل ترغب بتأكيد حذف هذا الموظف من قاعدة البيانات؟')) {
      try {
        if (isDesktopApp()) await window.electron!.employees.remove(id);
        const newState = { ...db, employees: db.employees.filter(emp => emp.id !== id) };
        setDb(newState);
        if (!isDesktopApp()) saveDatabase(newState);
      } catch (error) {
        console.error('Unable to delete employee:', error);
        alert('تعذر حذف الموظف.');
      }
    }
  };

  const handleSwitchActiveEmployee = (id: string) => {
    const newState = {
      ...db,
      activeEmployeeId: id
    };
    setDb(newState);
    saveDatabase(newState);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 font-sans tracking-tight">إدارة شؤون الموظفين والصلاحيات</h1>
          <p className="text-zinc-400 text-xs mt-1">تعريف الموظفين (المبيعات، مشغلي الطابعات، موظفي التسليم) لمراقبة وإثبات العمليات المالية والمطبعية.</p>
        </div>
        <button
          onClick={() => {
            setEditingEmpId(null);
            setName('');
            setPhone('');
            setRole('sales');
            setShowAddForm(!showAddForm);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition duration-200 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {editingEmpId ? 'تعديل موظف حالي' : 'تعريف موظف جديد'}
        </button>
      </div>

      {/* Session simulation role indicator card */}
      <div className="bg-[#18181b] border border-blue-500/20 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            محاكي الجلسة الحالية بالمطبعة:
          </h3>
          <p className="text-xs text-zinc-400">
            يمكنك تبديل حساب الموظف النشط أدناه لمحاكاة من يقوم بإصدار الفواتير أو تسليم المطبوعات حالياً.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">الموظف النشط:</span>
          <select
            value={db.activeEmployeeId}
            onChange={(e) => handleSwitchActiveEmployee(e.target.value)}
            className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-xs font-semibold text-blue-400 focus:outline-none"
          >
            {db.employees.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.role === 'admin' ? 'مدير النظام' : e.role === 'printer' ? 'مشغل طابعة' : e.role === 'sales' ? 'مبيعات' : 'موظف تسليم'})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Collapse Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddEmployee} className="bg-[#18181b] border border-[#27272a] p-5 rounded-xl space-y-4 animate-fade-in text-right shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-200">{editingEmpId ? 'تعديل بيانات ملف الموظف' : 'تسجيل وتوظيف موظف جديد بالمطبعة'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">الاسم ثلاثي *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: محمد أحمد علي..."
                className="w-full px-3 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">الموقع الوظيفي والصلاحية *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                <option value="admin">مدير عام للنظام (Full Admin)</option>
                <option value="sales">مدخل مبيعات وفواتير (Sales Clerk)</option>
                <option value="printer">مشغل طابعات فرز (Printer Operator)</option>
                <option value="delivery">موظف شحن وتسليم (Delivery / Logistics)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">رقم الهاتف للاتصال *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                placeholder="01xxxxxxxxx"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setEditingEmpId(null);
                setShowAddForm(false);
              }}
              className="px-4 py-2 bg-[#09090b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 text-xs rounded-lg cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition duration-150 cursor-pointer"
            >
              تأكيد وإثبات ملف الموظف
            </button>
          </div>
        </form>
      )}

      {/* Table list */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-4 shadow-sm">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="البحث السريع باسم الموظف أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#1c1c1f] text-zinc-400 border-b border-[#27272a] font-medium">
                <th className="p-3.5">اسم الموظف</th>
                <th className="p-3.5">الصلاحية والوظيفة</th>
                <th className="p-3.5">رقم الهاتف والتواصل</th>
                <th className="p-3.5 text-center">حالة الجلسة</th>
                <th className="p-3.5 text-center">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]/40 text-zinc-300 text-sm">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#27272a]/20 transition duration-150">
                  <td className="p-3.5 font-semibold text-zinc-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    {emp.name}
                  </td>
                  <td className="p-3.5">
                    {emp.role === 'admin' && <span className="text-xs bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full border border-red-500/20 font-semibold">مدير نظام</span>}
                    {emp.role === 'printer' && <span className="text-xs bg-purple-500/10 text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20 font-semibold">مشغل طابعة</span>}
                    {emp.role === 'sales' && <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-semibold">مبيعات وفواتير</span>}
                    {emp.role === 'delivery' && <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 font-semibold">تسليم ولوجستيات</span>}
                  </td>
                  <td className="p-3.5 font-mono text-xs text-zinc-300">{emp.phone}</td>
                  <td className="p-3.5 text-center">
                    {emp.id === db.activeEmployeeId ? (
                      <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2.5 py-0.5 rounded-lg flex items-center gap-1 justify-center w-max mx-auto font-medium animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5" /> النشط حالياً
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSwitchActiveEmployee(emp.id)}
                        className="text-xs hover:bg-[#27272a] text-zinc-400 hover:text-white px-2.5 py-0.5 rounded-lg border border-[#27272a] transition duration-150 cursor-pointer"
                      >
                        تبديل إليه
                      </button>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(emp)}
                        className="p-1 hover:bg-[#27272a] text-zinc-300 rounded cursor-pointer transition duration-150"
                        title="تعديل بيانات الموظف"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="p-1 hover:bg-red-950/40 text-red-400 rounded cursor-pointer transition duration-150"
                        title="حذف الموظف"
                        disabled={emp.id === db.activeEmployeeId}
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
      </div>
    </div>
  );
}
