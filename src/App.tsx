/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { loadDatabase, DatabaseState, saveDatabase } from './dbStore';

// Component imports
import Dashboard from './components/Dashboard';
import BooksManagement from './components/BooksManagement';
import ReservationsManagement from './components/ReservationsManagement';
import Production from './components/Production';
import PrintingCenter from './components/PrintingCenter';
import Branches from './components/Branches';
import Employees from './components/Employees';
import Accounts from './components/Accounts';
import Reports from './components/Reports';
import Settings from './components/Settings';

// Icon imports
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Hammer,
  Printer,
  Building2,
  Users,
  CircleDollarSign,
  FileText,
  Settings as SettingsIcon,
  Circle,
  Minus,
  Square,
  X,
  Clock,
  HardDrive
} from 'lucide-react';

export default function App() {
  const [db, setDb] = useState<DatabaseState | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [time, setTime] = useState<string>('');

  // Synchronous initial load of simulated SQL database
  useEffect(() => {
    const loadedDb = loadDatabase();
    setDb(loadedDb);

    // Keep clock in sync
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync state handler to keep database save transparent
  const handleUpdateDb = (newDb: DatabaseState) => {
    setDb(newDb);
    saveDatabase(newDb);
  };

  if (!db) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-200" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-sans text-sm font-semibold text-zinc-400">جاري تشغيل محاكي المحرك المحلي SQLite...</span>
        </div>
      </div>
    );
  }

  // Find currently active simulated employee name
  const activeEmployee = db.employees.find(e => e.id === db.activeEmployeeId) || db.employees[0];

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col font-sans select-none overflow-x-hidden antialiased" dir="rtl">
      {/* 1. Simulated Electron Windows Frame Top Bar */}
      <div className="bg-[#18181b] border-b border-[#27272a] px-4 py-2 flex justify-between items-center select-none shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          {/* Simulated App Icon */}
          <div className="w-5 h-5 bg-gradient-to-tr from-blue-600 to-blue-400 rounded flex items-center justify-center font-bold text-[10px] text-white">
            BF
          </div>
          <span className="text-xs font-bold text-zinc-200 tracking-tight">BookFlow Pro - بوك فلو برو v1.0.0</span>
          <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
            أوفلاين بالكامل (SQLite Local)
          </span>
        </div>

        {/* Windows Window Controls */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/60 px-2.5 py-1 rounded border border-[#27272a]">
            قاعدة البيانات: {db.books.length} كُتب / {db.reservations.length} حجوزات
          </span>
          <div className="flex items-center">
            <button className="p-1 hover:bg-zinc-800 rounded text-zinc-400 transition" title="تصغير">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 hover:bg-zinc-800 rounded text-zinc-400 transition" title="تكبير">
              <Square className="w-3 h-3" />
            </button>
            <button className="p-1 hover:bg-red-600 hover:text-white rounded text-zinc-400 transition" title="إغلاق">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Desktop Layout Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Right Sidebar navigation (Arabic RTL Layout!) */}
        <aside className="w-64 bg-[#18181b] border-l border-[#27272a] flex flex-col justify-between shrink-0 print:hidden">
          <div className="p-4 space-y-6">
            {/* Publisher logo */}
            <div className="p-3 bg-zinc-900/60 border border-[#27272a] rounded-lg text-center">
              <h2 className="text-sm font-extrabold text-blue-500">المطبعة السلفية</h2>
              <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">مؤسسة طباعة ونشر المناهج</p>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-500 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-800 rounded-md hover:text-zinc-200'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                لوحة التحكم الرئيسية
              </button>

              <button
                onClick={() => setActiveTab('books')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'books'
                    ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-500 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-800 rounded-md hover:text-zinc-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                مستودع الكتب والمناهج
              </button>

              <button
                onClick={() => setActiveTab('reservations')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'reservations'
                    ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-500 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-800 rounded-md hover:text-zinc-200'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                حجوزات وتوريد الكتب
              </button>

              <button
                onClick={() => setActiveTab('production')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'production'
                    ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-500 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-800 rounded-md hover:text-zinc-200'
                }`}
              >
                <Hammer className="w-4 h-4" />
                متابعة خطوط الإنتاج والفرز
              </button>

              <button
                onClick={() => setActiveTab('printing')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'printing'
                    ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-500 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-800 rounded-md hover:text-zinc-200'
                }`}
              >
                <Printer className="w-4 h-4" />
                مركز وجدولة الطباعة
              </button>

              <button
                onClick={() => setActiveTab('branches')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'branches'
                    ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-500 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-800 rounded-md hover:text-zinc-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                حسابات وفروع التوزيع
              </button>

              <button
                onClick={() => setActiveTab('employees')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'employees'
                    ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-500 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-800 rounded-md hover:text-zinc-200'
                }`}
              >
                <Users className="w-4 h-4" />
                الموظفون والصلاحيات
              </button>

              <button
                onClick={() => setActiveTab('accounts')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'accounts'
                    ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-500 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-800 rounded-md hover:text-zinc-200'
                }`}
              >
                <CircleDollarSign className="w-4 h-4" />
                الخزينة والمحاسبة المالية
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'reports'
                    ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-500 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-800 rounded-md hover:text-zinc-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                مركز التقارير المحاسبية
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'settings'
                    ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-500 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-800 rounded-md hover:text-zinc-200'
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                إعدادات وتصنيفات النظام
              </button>
            </nav>
          </div>

          {/* Sidebar bottom status indicator */}
          <div className="p-4 border-t border-[#27272a] bg-[#1c1c1f] text-xs text-zinc-400 space-y-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-blue-500" />
              <span>المساحة المحلية: 100% حرة</span>
            </div>
            <div className="text-[10px] text-zinc-500">مزامنة البيانات: محلية أوفلاين كلياً</div>
          </div>
        </aside>

        {/* Content Viewer viewport */}
        <main className="flex-1 bg-[#09090b] overflow-y-auto p-6 md:p-8 print:p-0 print:bg-white print:text-black">
          {activeTab === 'dashboard' && <Dashboard db={db} setActiveTab={setActiveTab} />}
          {activeTab === 'books' && <BooksManagement db={db} setDb={handleUpdateDb} />}
          {activeTab === 'reservations' && <ReservationsManagement db={db} setDb={handleUpdateDb} />}
          {activeTab === 'production' && <Production db={db} setDb={handleUpdateDb} setActiveTab={setActiveTab} />}
          {activeTab === 'printing' && <PrintingCenter db={db} setDb={handleUpdateDb} />}
          {activeTab === 'branches' && <Branches db={db} setDb={handleUpdateDb} />}
          {activeTab === 'employees' && <Employees db={db} setDb={handleUpdateDb} />}
          {activeTab === 'accounts' && <Accounts db={db} setDb={handleUpdateDb} />}
          {activeTab === 'reports' && <Reports db={db} />}
          {activeTab === 'settings' && <Settings db={db} setDb={handleUpdateDb} />}
        </main>
      </div>

      {/* 3. Simulated Desktop App Status Footer */}
      <footer className="bg-[#18181b] border-t border-[#27272a] py-1.5 px-4 flex justify-between items-center text-[11px] text-zinc-500 shrink-0 print:hidden select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Circle className="w-2 h-2 text-blue-500 fill-blue-500" />
            اتصال محرك SQLite: نشط
          </span>
          <span>|</span>
          <span>المستخدم النشط: {activeEmployee ? `${activeEmployee.name} (${activeEmployee.role === 'admin' ? 'مدير عام' : activeEmployee.role === 'printer' ? 'مشغل طابعة' : activeEmployee.role === 'sales' ? 'مبيعات' : 'موظف تسليم'})` : 'أحمد عبد الرحمن'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-mono text-xs">{time}</span>
        </div>
      </footer>
    </div>
  );
}
