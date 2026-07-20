/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DatabaseState, saveDatabase } from '../dbStore';
import { Settings as SettingsIcon, Plus, Download, Upload, AlertCircle, RefreshCw } from 'lucide-react';

interface SettingsProps {
  db: DatabaseState;
  setDb: (db: DatabaseState) => void;
}

export default function Settings({ db, setDb }: SettingsProps) {
  // Input states for adding categories
  const [newSeries, setNewSeries] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newStage, setNewStage] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newTerm, setNewTerm] = useState('');

  // Backup & Restore
  const handleBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `bookflow_pro_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Failed to export backup:', e);
      alert('فشل تصدير النسخة الاحتياطية!');
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.books && parsed.reservations && parsed.settings) {
            setDb(parsed);
            saveDatabase(parsed);
            alert('تم استعادة قاعدة بيانات النظام بالكامل بنجاح من ملف النسخة الاحتياطية!');
          } else {
            alert('ملف النسخ الاحتياطي غير صالح أو تالف!');
          }
        } catch (error) {
          alert('خطأ أثناء قراءة ملف النسخة الاحتياطية!');
        }
      };
    }
  };

  // Add Item Helpers
  const handleAddCategoryItem = (field: 'series' | 'subjects' | 'stages' | 'grades' | 'terms', value: string, setter: (val: string) => void) => {
    if (!value) return;
    if (db.settings[field].includes(value)) {
      alert('هذا البند موجود بالفعل مسبقاً!');
      return;
    }

    const updatedSettings = {
      ...db.settings,
      [field]: [...db.settings[field], value]
    };

    const newState = {
      ...db,
      settings: updatedSettings
    };

    setDb(newState);
    saveDatabase(newState);
    setter('');
  };

  // Remove Item Helpers
  const handleRemoveCategoryItem = (field: 'series' | 'subjects' | 'stages' | 'grades' | 'terms', value: string) => {
    if (confirm(`هل أنت متأكد من حذف البند "${value}"؟ سيؤثر هذا على إدخالات الكتب الجديدة.`)) {
      const updatedSettings = {
        ...db.settings,
        [field]: db.settings[field].filter(item => item !== value)
      };

      const newState = {
        ...db,
        settings: updatedSettings
      };

      setDb(newState);
      saveDatabase(newState);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('هل ترغب حقاً في مسح كافة البيانات المسجلة بالقرص والعودة إلى الإعدادات الافتراضية التجريبية؟ لا يمكن التراجع عن هذا الإجراء.')) {
      localStorage.removeItem('bookflow_pro_db_v1');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 font-sans tracking-tight">إعدادات لوحة التحكم وتصنيف المناهج</h1>
          <p className="text-zinc-400 text-xs mt-1">تعديل فئات المناهج والصفوف والسلاسل، وتصدير/استيراد نسخ قاعدة البيانات الاحتياطية للكمبيوتر.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Categorization lists */}
        <div className="lg:col-span-2 bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-6 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 border-b border-[#27272a] pb-2.5">
            <SettingsIcon className="w-4 h-4 text-emerald-400" />
            تعديل وتحديث فئات المناهج والكتب
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Series */}
            <div className="space-y-3 p-4 bg-zinc-900/40 border border-[#27272a] rounded-lg">
              <h4 className="text-xs font-semibold text-zinc-300">السلاسل المعتمدة (الأضواء، المعاصر...)</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSeries}
                  onChange={(e) => setNewSeries(e.target.value)}
                  placeholder="سلسلة جديدة"
                  className="flex-1 px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleAddCategoryItem('series', newSeries, setNewSeries)}
                  className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white cursor-pointer transition duration-150"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-[120px] overflow-y-auto">
                {db.settings.series.map(s => (
                  <span key={s} className="bg-[#09090b] border border-[#27272a] text-[11px] text-zinc-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                    {s}
                    <button onClick={() => handleRemoveCategoryItem('series', s)} className="text-red-400 hover:text-red-300 cursor-pointer">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* 2. Subjects */}
            <div className="space-y-3 p-4 bg-zinc-900/40 border border-[#27272a] rounded-lg">
              <h4 className="text-xs font-semibold text-zinc-300">المواد الدراسية (رياضيات، لغة عربية...)</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="مادة جديدة"
                  className="flex-1 px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleAddCategoryItem('subjects', newSubject, setNewSubject)}
                  className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white cursor-pointer transition duration-150"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-[120px] overflow-y-auto">
                {db.settings.subjects.map(s => (
                  <span key={s} className="bg-[#09090b] border border-[#27272a] text-[11px] text-zinc-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                    {s}
                    <button onClick={() => handleRemoveCategoryItem('subjects', s)} className="text-red-400 hover:text-red-300 cursor-pointer">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* 3. Stages */}
            <div className="space-y-3 p-4 bg-zinc-900/40 border border-[#27272a] rounded-lg">
              <h4 className="text-xs font-semibold text-zinc-300">المراحل التعليمية</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  placeholder="مرحلة جديدة"
                  className="flex-1 px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleAddCategoryItem('stages', newStage, setNewStage)}
                  className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white cursor-pointer transition duration-150"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-[120px] overflow-y-auto">
                {db.settings.stages.map(s => (
                  <span key={s} className="bg-[#09090b] border border-[#27272a] text-[11px] text-zinc-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                    {s}
                    <button onClick={() => handleRemoveCategoryItem('stages', s)} className="text-red-400 hover:text-red-300 cursor-pointer">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* 4. Grades */}
            <div className="space-y-3 p-4 bg-zinc-900/40 border border-[#27272a] rounded-lg">
              <h4 className="text-xs font-semibold text-zinc-300">الصفوف الدراسية</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  placeholder="صف جديد"
                  className="flex-1 px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleAddCategoryItem('grades', newGrade, setNewGrade)}
                  className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white cursor-pointer transition duration-150"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-[120px] overflow-y-auto">
                {db.settings.grades.map(s => (
                  <span key={s} className="bg-[#09090b] border border-[#27272a] text-[11px] text-zinc-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                    {s}
                    <button onClick={() => handleRemoveCategoryItem('grades', s)} className="text-red-400 hover:text-red-300 cursor-pointer">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Backup, Restore & Reset */}
        <div className="bg-[#18181b] border border-[#27272a] p-6 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 border-b border-[#27272a] pb-2.5">
              حفظ واستيراد البيانات (أوفلاين)
            </h3>
            <p className="text-xs text-zinc-400">بما أن النظام يعمل بالكامل أوفلاين دون سحابة إلكترونية، يرجى الاستمرار في عمل نسخ احتياطية دورية لحفظ الفواتير من الضياع.</p>

            <div className="space-y-3 pt-2">
              {/* Backup Button */}
              <button
                onClick={handleBackup}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                تصدير نسخة احتياطية (.json)
              </button>

              {/* Restore Button */}
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  id="restore-file"
                  className="hidden"
                />
                <label
                  htmlFor="restore-file"
                  className="w-full py-2.5 bg-zinc-900 hover:bg-[#27272a] text-zinc-300 border border-[#27272a] rounded-lg text-xs font-semibold transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  استيراد واستعادة البيانات (.json)
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#27272a]/60 space-y-3 mt-6">
            <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-[11px] text-red-400 space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                خطر التصفير الكامل:
              </div>
              <p>يؤدي تصفير النظام إلى مسح كافة المناهج، الفواتير، ديون الفروع، وحسابات الموظفين والعودة للملفات الافتراضية الأولى.</p>
            </div>

            <button
              onClick={handleResetToDefault}
              className="w-full py-2 bg-red-950/40 hover:bg-red-950/80 text-red-400 border border-red-900/50 rounded-lg text-xs font-semibold transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              تصفير قاعدة البيانات للوضع البدائي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
