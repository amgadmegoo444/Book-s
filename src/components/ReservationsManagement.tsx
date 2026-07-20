/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DatabaseState, saveDatabase, generateInvoiceNumber } from '../dbStore';
import { Reservation, ReservationItem, ReservationStatus } from '../types';
import { Search, Plus, Calendar, FileText, CheckCircle2, AlertTriangle, AlertCircle, X, DollarSign, Truck, RotateCcw, Printer, Edit2, Trash2 } from 'lucide-react';

interface ReservationsManagementProps {
  db: DatabaseState;
  setDb: (db: DatabaseState) => void;
}

export default function ReservationsManagement({ db, setDb }: ReservationsManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReservationStatus>('all');

  // Modal Control
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);

  // New Reservation Form States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerType, setCustomerType] = useState<'regular' | 'branch' | 'wholesale'>('regular');
  const [branchId, setBranchId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [deposit, setDeposit] = useState(0);

  // Added items in the creation form
  const [formItems, setFormItems] = useState<Array<{ bookId: string; quantity: number }>>([]);
  const [currentSelectedBookId, setCurrentSelectedBookId] = useState('');
  const [currentSelectedQty, setCurrentSelectedQty] = useState(1);

  // Partial Action States for existing reservation
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [deliveryInputs, setDeliveryInputs] = useState<Record<string, number>>({});
  const [returnInputs, setReturnInputs] = useState<Record<string, number>>({});

  // Clean form
  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerType('regular');
    setBranchId(db.branches[0]?.id || 'br-main');
    setDiscount(0);
    setDeposit(0);
    setFormItems([]);
    setCurrentSelectedBookId(db.books[0]?.id || '');
    setCurrentSelectedQty(1);
  };

  // Open add modal
  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Helper: Get price of book based on customer type
  const getBookPriceForType = (bookId: string, type: 'regular' | 'branch' | 'wholesale') => {
    const book = db.books.find(b => b.id === bookId);
    if (!book) return 0;
    if (type === 'branch') return book.branchPrice;
    if (type === 'wholesale') return book.wholesalePrice;
    return book.customerPrice;
  };

  // Add Item to creation list
  const handleAddItemToForm = () => {
    if (!currentSelectedBookId) return;
    const existingIndex = formItems.findIndex(item => item.bookId === currentSelectedBookId);
    if (existingIndex > -1) {
      const updated = [...formItems];
      updated[existingIndex].quantity += Number(currentSelectedQty);
      setFormItems(updated);
    } else {
      setFormItems([...formItems, { bookId: currentSelectedBookId, quantity: Number(currentSelectedQty) }]);
    }
    setCurrentSelectedQty(1);
  };

  // Remove Item from creation list
  const handleRemoveItemFromForm = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  // Calculate totals for Form
  const formSubtotal = formItems.reduce((acc, item) => {
    const price = getBookPriceForType(item.bookId, customerType);
    return acc + (price * item.quantity);
  }, 0);
  const formNetAmount = Math.max(0, formSubtotal - Number(discount));
  const formRemaining = Math.max(0, formNetAmount - Number(deposit));

  // Save Reservation
  const handleSaveReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.length === 0) {
      alert('يجب إضافة كتاب واحد على الأقل لإتمام عملية الحجز');
      return;
    }
    if (!customerName || !customerPhone) {
      alert('يرجى ملء اسم العميل ورقم هاتفه');
      return;
    }

    const items: ReservationItem[] = formItems.map(item => {
      const book = db.books.find(b => b.id === item.bookId)!;
      return {
        bookId: item.bookId,
        series: book.series,
        subject: book.subject,
        grade: book.grade,
        term: book.term,
        quantityRequested: item.quantity,
        quantityDelivered: 0,
        pricePerUnit: getBookPriceForType(item.bookId, customerType)
      };
    });

    const newInvoiceNum = generateInvoiceNumber(db.reservations);

    const newReservation: Reservation = {
      id: `res-${Date.now()}`,
      invoiceNumber: newInvoiceNum,
      customerName,
      customerPhone,
      customerType,
      branchId: customerType === 'regular' ? 'br-main' : branchId,
      employeeId: db.activeEmployeeId,
      items,
      totalAmount: formSubtotal,
      discount: Number(discount),
      netAmount: formNetAmount,
      deposit: Number(deposit),
      paidAmount: Number(deposit),
      remainingBalance: formRemaining,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // If client is a branch or wholesale, let's update their debt accordingly if there is a remaining balance
    let updatedBranches = [...db.branches];
    if (customerType !== 'regular' && formRemaining > 0) {
      const targetBranchId = customerType === 'branch' ? branchId : 'br-wholesale-hoda';
      updatedBranches = updatedBranches.map(br => {
        if (br.id === targetBranchId) {
          return { ...br, debt: br.debt + formRemaining };
        }
        return br;
      });
    }

    const newState = {
      ...db,
      reservations: [newReservation, ...db.reservations],
      branches: updatedBranches
    };

    setDb(newState);
    saveDatabase(newState);
    setIsAddModalOpen(false);
    resetForm();
  };

  // Manage existing reservation actions
  const handleRecordPayment = () => {
    if (!selectedRes || paymentAmount <= 0) return;

    const updatedRes = db.reservations.map(r => {
      if (r.id === selectedRes.id) {
        const newPaid = Math.min(r.netAmount, r.paidAmount + paymentAmount);
        const newRemaining = Math.max(0, r.netAmount - newPaid);
        return {
          ...r,
          paidAmount: newPaid,
          remainingBalance: newRemaining,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    // Reduce debt if branch/wholesale
    let updatedBranches = [...db.branches];
    if (selectedRes.customerType !== 'regular') {
      const targetBranchId = selectedRes.customerType === 'branch' ? selectedRes.branchId : 'br-wholesale-hoda';
      updatedBranches = updatedBranches.map(br => {
        if (br.id === targetBranchId) {
          return { ...br, debt: Math.max(0, br.debt - paymentAmount) };
        }
        return br;
      });
    }

    const newState = { ...db, reservations: updatedRes, branches: updatedBranches };
    setDb(newState);
    saveDatabase(newState);
    setSelectedRes(newState.reservations.find(r => r.id === selectedRes.id) || null);
    setPaymentAmount(0);
    alert('تم تسجيل الدفعة المالية بنجاح وتحديث حسابات الفواتير والمديونية!');
  };

  const handleProcessDelivery = () => {
    if (!selectedRes) return;

    let totalDeliveredItemsChange = false;

    const updatedRes = db.reservations.map(r => {
      if (r.id === selectedRes.id) {
        const newItems = r.items.map(item => {
          const toDeliver = Number(deliveryInputs[item.bookId] || 0);
          if (toDeliver > 0) {
            totalDeliveredItemsChange = true;
            const currentDel = item.quantityDelivered;
            const newDel = Math.min(item.quantityRequested, currentDel + toDeliver);
            return { ...item, quantityDelivered: newDel };
          }
          return item;
        });

        // Determine new overall status
        const allCompleted = newItems.every(i => i.quantityDelivered === i.quantityRequested);
        const anyCompleted = newItems.some(i => i.quantityDelivered > 0);
        let nextStatus: ReservationStatus = 'pending';
        if (allCompleted) {
          nextStatus = 'completed';
        } else if (anyCompleted) {
          nextStatus = 'partial';
        }

        return {
          ...r,
          items: newItems,
          status: nextStatus,
          deliveryEmployeeId: db.activeEmployeeId,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    if (!totalDeliveredItemsChange) {
      alert('الرجاء إدخال الكميات المسلّمة للكتب المراد تسليمها أولاً');
      return;
    }

    // Also increase global quantity printed and adjust track if needed
    const newState = { ...db, reservations: updatedRes };
    setDb(newState);
    saveDatabase(newState);
    setSelectedRes(newState.reservations.find(r => r.id === selectedRes.id) || null);
    setDeliveryInputs({});
    alert('تم إثبات تسليم الكتب المحددة جزئياً للعميل بنجاح!');
  };

  const handleProcessReturn = () => {
    if (!selectedRes) return;

    let returnExecuted = false;
    let totalReturnCredit = 0;

    const updatedRes = db.reservations.map(r => {
      if (r.id === selectedRes.id) {
        const newItems = r.items.map(item => {
          const qtyToReturn = Number(returnInputs[item.bookId] || 0);
          if (qtyToReturn > 0 && qtyToReturn <= item.quantityDelivered) {
            returnExecuted = true;
            const creditValue = qtyToReturn * item.pricePerUnit;
            totalReturnCredit += creditValue;

            return {
              ...item,
              quantityRequested: Math.max(0, item.quantityRequested - qtyToReturn),
              quantityDelivered: Math.max(0, item.quantityDelivered - qtyToReturn)
            };
          }
          return item;
        }).filter(item => item.quantityRequested > 0); // Keep items with remaining request

        const subtotal = newItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantityRequested), 0);
        const netAmount = Math.max(0, subtotal - r.discount);
        // Recalculate paid and remaining balances
        const newRemaining = Math.max(0, netAmount - r.paidAmount);

        return {
          ...r,
          items: newItems,
          totalAmount: subtotal,
          netAmount,
          remainingBalance: newRemaining,
          status: newItems.length === 0 ? 'cancelled' : (newItems.every(i => i.quantityDelivered === i.quantityRequested) ? 'completed' : 'partial'),
          updatedAt: new Date().toISOString()
        } as Reservation;
      }
      return r;
    });

    if (!returnExecuted) {
      alert('يرجى إدخال كمية مرتجعات صالحة لا تزيد عن الكمية التي تم تسليمها بالفعل');
      return;
    }

    // Update branch debts if branch/wholesale
    let updatedBranches = [...db.branches];
    if (selectedRes.customerType !== 'regular' && totalReturnCredit > 0) {
      const targetBranchId = selectedRes.customerType === 'branch' ? selectedRes.branchId : 'br-wholesale-hoda';
      updatedBranches = updatedBranches.map(br => {
        if (br.id === targetBranchId) {
          return { ...br, debt: Math.max(0, br.debt - totalReturnCredit) };
        }
        return br;
      });
    }

    const newState = { ...db, reservations: updatedRes, branches: updatedBranches };
    setDb(newState);
    saveDatabase(newState);
    setSelectedRes(newState.reservations.find(r => r.id === selectedRes.id) || null);
    setReturnInputs({});
    alert(`تم تسجيل إرجاع الكتب بنجاح. قيمة المرتجعات المستردة: ${totalReturnCredit} ج.م وتم تعديل الفاتورة ومديونيات العميل.`);
  };

  const handleCancelReservation = (resId: string) => {
    if (confirm('هل أنت متأكد من إلغاء هذا الحجز بالكامل؟ سيتم تصفير المبالغ المتبقية وإرجاع ديون الفرع المرتبطة.')) {
      const reservation = db.reservations.find(r => r.id === resId);
      if (!reservation) return;

      const updatedRes = db.reservations.map(r => {
        if (r.id === resId) {
          return {
            ...r,
            status: 'cancelled' as ReservationStatus,
            remainingBalance: 0,
            updatedAt: new Date().toISOString()
          };
        }
        return r;
      });

      // Adjust branch debts
      let updatedBranches = [...db.branches];
      if (reservation.customerType !== 'regular' && reservation.remainingBalance > 0) {
        const targetBranchId = reservation.customerType === 'branch' ? reservation.branchId : 'br-wholesale-hoda';
        updatedBranches = updatedBranches.map(br => {
          if (br.id === targetBranchId) {
            return { ...br, debt: Math.max(0, br.debt - reservation.remainingBalance) };
          }
          return br;
        });
      }

      const newState = { ...db, reservations: updatedRes, branches: updatedBranches };
      setDb(newState);
      saveDatabase(newState);
      setSelectedRes(newState.reservations.find(r => r.id === resId) || null);
      alert('تم إلغاء الحجز بالكامل وتصفية الالتزامات المالية.');
    }
  };

  // Filter reservations
  const filteredReservations = db.reservations.filter(res => {
    const matchesSearch =
      res.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || res.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 font-sans tracking-tight">نظام إدارة طلبات وحجوزات الكتب</h1>
          <p className="text-zinc-400 text-xs mt-1">إصدار الفواتير، استلام العربونات، متابعة المبالغ المتبقية، والتسليم التدريجي للمطبوعات.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition duration-200 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          فاتورة حجز جديدة (عربون)
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="البحث برقم الفاتورة، اسم العميل أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20 font-sans"
          />
        </div>

        {/* Tab filters */}
        <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto p-0.5">
          {(['all', 'pending', 'partial', 'completed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition duration-200 ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#09090b] border border-[#27272a] hover:bg-[#27272a]/40 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {status === 'all' && 'كل الحجوزات'}
              {status === 'pending' && 'قيد الانتظار'}
              {status === 'partial' && 'تسليم جزئي'}
              {status === 'completed' && 'مكتمل المسلم'}
              {status === 'cancelled' && 'ملغي'}
            </button>
          ))}
        </div>
      </div>

      {/* Table list */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
        {filteredReservations.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-2">
            <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm">لم يتم العثور على أي فواتير حجز مطابقة للمعايير.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-[#1c1c1f] border-b border-[#27272a] text-zinc-300 text-xs font-medium">
                  <th className="p-3.5 font-medium">رقم الفاتورة</th>
                  <th className="p-3.5 font-medium">اسم العميل والجهة</th>
                  <th className="p-3.5 text-center font-medium">الكتب المطلوبة</th>
                  <th className="p-3.5 text-center font-medium">صافي الفاتورة</th>
                  <th className="p-3.5 text-center font-medium">المدفوع / العربون</th>
                  <th className="p-3.5 text-center font-medium">المتبقي</th>
                  <th className="p-3.5 text-center font-medium">الحالة</th>
                  <th className="p-3.5 text-center font-medium">التاريخ</th>
                  <th className="p-3.5 text-center font-medium">العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/40">
                {filteredReservations.map((res) => {
                  const totalBooksCount = res.items.reduce((sum, i) => sum + i.quantityRequested, 0);
                  const totalDeliveredCount = res.items.reduce((sum, i) => sum + i.quantityDelivered, 0);
                  const branchName = db.branches.find(b => b.id === res.branchId)?.name || 'مكتب الزبائن';

                  return (
                    <tr key={res.id} className="hover:bg-[#27272a]/20 transition duration-150">
                      <td className="p-3.5 font-mono font-medium text-blue-400">
                        {res.invoiceNumber}
                      </td>
                      <td className="p-3.5">
                        <div>
                          <div className="font-medium text-zinc-200">{res.customerName}</div>
                          <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                            <span>{res.customerPhone}</span>
                            <span>•</span>
                            <span className="text-blue-400/90">{branchName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="text-zinc-200 font-medium">
                          {totalDeliveredCount} / {totalBooksCount} <span className="text-xs text-zinc-500">نسخة</span>
                        </div>
                        <div className="w-20 bg-[#09090b] h-1.5 rounded-full mx-auto overflow-hidden mt-2 border border-[#27272a]/40">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${(totalDeliveredCount / (totalBooksCount || 1)) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-mono font-medium text-zinc-100">
                        {res.netAmount} ج.م
                      </td>
                      <td className="p-3.5 text-center font-mono text-emerald-400/90">
                        {res.paidAmount} ج.م
                      </td>
                      <td className="p-3.5 text-center font-mono font-medium text-amber-500/90">
                        {res.remainingBalance} ج.م
                      </td>
                      <td className="p-3.5 text-center">
                        {res.status === 'pending' && (
                          <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                            قيد الانتظار
                          </span>
                        )}
                        {res.status === 'partial' && (
                          <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                            تسليم جزئي
                          </span>
                        )}
                        {res.status === 'completed' && (
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            مكتمل التسليم
                          </span>
                        )}
                        {res.status === 'cancelled' && (
                          <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-700">
                            ملغي
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center text-xs text-zinc-500 font-mono">
                        {new Date(res.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setSelectedRes(res)}
                          className="px-2.5 py-1 bg-[#09090b] hover:bg-[#27272a]/60 border border-[#27272a] rounded text-xs font-medium text-zinc-200 transition duration-150"
                        >
                          إدارة الفاتورة
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Management/Details Modal */}
      {selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl text-right my-8">
            <div className="flex justify-between items-center bg-[#1c1c1f] p-4 border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">إدارة فاتورة الحجز: {selectedRes.invoiceNumber}</h3>
                  <p className="text-[11px] text-zinc-400">تاريخ الإنشاء: {new Date(selectedRes.createdAt).toLocaleString('ar-EG')}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRes(null)} className="text-zinc-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1 & 2: Book items list and delivery action */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-300 mb-3">تفاصيل الكتب والكميات بالحجز الحالي:</h4>
                  <div className="bg-[#09090b] border border-[#27272a] rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#1c1c1f] text-zinc-300 font-medium border-b border-[#27272a]">
                          <th className="p-2.5">بيان الكتاب</th>
                          <th className="p-2.5 text-center">المطلوب</th>
                          <th className="p-2.5 text-center">المسلم سابقاً</th>
                          <th className="p-2.5 text-center">سعر الوحدة</th>
                          <th className="p-2.5 text-center">التسليم (نسخة)</th>
                          <th className="p-2.5 text-center">المرتجع (نسخة)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#27272a]/40">
                        {selectedRes.items.map((item) => {
                          const maxToDeliver = item.quantityRequested - item.quantityDelivered;
                          return (
                            <tr key={item.bookId} className="hover:bg-[#18181b]/40">
                              <td className="p-2.5">
                                <span className="font-semibold text-zinc-100 block">{item.series} - {item.subject}</span>
                                <span className="text-[10px] text-zinc-500">{item.grade} • {item.term}</span>
                              </td>
                              <td className="p-2.5 text-center font-mono font-medium text-zinc-100">{item.quantityRequested}</td>
                              <td className="p-2.5 text-center font-mono text-emerald-400">{item.quantityDelivered}</td>
                              <td className="p-2.5 text-center font-mono text-zinc-300">{item.pricePerUnit} ج.م</td>
                              <td className="p-2.5 text-center">
                                <input
                                  type="number"
                                  placeholder="0"
                                  min="0"
                                  max={maxToDeliver}
                                  value={deliveryInputs[item.bookId] || ''}
                                  onChange={(e) => setDeliveryInputs({
                                    ...deliveryInputs,
                                    [item.bookId]: Math.min(maxToDeliver, Math.max(0, Number(e.target.value)))
                                  })}
                                  disabled={maxToDeliver <= 0 || selectedRes.status === 'cancelled'}
                                  className="w-14 bg-[#18181b] border border-[#27272a] text-zinc-100 font-mono text-center rounded p-1 focus:outline-none focus:border-blue-500 disabled:opacity-40"
                                />
                              </td>
                              <td className="p-2.5 text-center">
                                <input
                                  type="number"
                                  placeholder="0"
                                  min="0"
                                  max={item.quantityDelivered}
                                  value={returnInputs[item.bookId] || ''}
                                  onChange={(e) => setReturnInputs({
                                    ...returnInputs,
                                    [item.bookId]: Math.min(item.quantityDelivered, Math.max(0, Number(e.target.value)))
                                  })}
                                  disabled={item.quantityDelivered <= 0 || selectedRes.status === 'cancelled'}
                                  className="w-14 bg-[#18181b] border border-[#27272a] text-zinc-100 font-mono text-center rounded p-1 focus:outline-none focus:border-red-500 disabled:opacity-40"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sub-actions for Delivery and Returns */}
                {selectedRes.status !== 'cancelled' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Delivery Button */}
                    <div className="bg-[#1c1c1f]/50 p-4 border border-[#27272a] rounded-xl space-y-2">
                      <h5 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-blue-400" />
                        صرف وإثبات كميات كتب مسلمة:
                      </h5>
                      <p className="text-[10px] text-zinc-400">إثبات تسليم الكتب المحددة في الجدول للعميل في الوقت الحالي.</p>
                      <button
                        onClick={handleProcessDelivery}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition duration-200"
                      >
                        تأكيد تسليم الكتب الحالية
                      </button>
                    </div>

                    {/* Returns Button */}
                    <div className="bg-[#1c1c1f]/50 p-4 border border-[#27272a] rounded-xl space-y-2">
                      <h5 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <RotateCcw className="w-4 h-4 text-red-400" />
                        مرتجعات كتب من العميل:
                      </h5>
                      <p className="text-[10px] text-zinc-400">إرجاع الكتب المسلمة سابقاً، وتقليل قيمة الفاتورة ورد المديونية.</p>
                      <button
                        onClick={handleProcessReturn}
                        className="w-full py-1.5 bg-red-900 hover:bg-red-800 text-white rounded text-xs font-medium transition duration-200"
                      >
                        معالجة مرتجع الكتب المحددة
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Column 3: Billing Info, Payments, Status */}
              <div className="bg-[#09090b] p-4 rounded-xl border border-[#27272a] flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-zinc-300 border-b border-[#27272a] pb-1.5">الملخص المالي والتحصيل:</h4>

                  {/* Customer detail card */}
                  <div className="bg-[#1c1c1f] p-3 rounded-lg border border-[#27272a] space-y-1">
                    <div className="text-xs font-semibold text-zinc-200">{selectedRes.customerName}</div>
                    <div className="text-[11px] text-zinc-400">{selectedRes.customerPhone}</div>
                    <div className="text-[11px] text-blue-400 bg-blue-500/10 inline-block px-1.5 py-0.5 rounded mt-1">
                      {selectedRes.customerType === 'regular' ? 'مشتري مفرق' : selectedRes.customerType === 'branch' ? 'فرع فرعي' : 'تاجر جملة'}
                    </div>
                  </div>

                  {/* Pricing breakdown */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>إجمالي الفاتورة:</span>
                      <span className="font-mono">{selectedRes.totalAmount} ج.م</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>قيمة الخصم الممنوح:</span>
                      <span className="font-mono text-red-400">-{selectedRes.discount} ج.م</span>
                    </div>
                    <hr className="border-[#27272a]" />
                    <div className="flex justify-between font-medium text-zinc-100">
                      <span>الصافي المطلوب:</span>
                      <span className="font-mono text-blue-400">{selectedRes.netAmount} ج.م</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>المدفوع / المقبوض سابقاً:</span>
                      <span className="font-mono text-emerald-400">{selectedRes.paidAmount} ج.م</span>
                    </div>
                    <div className="flex justify-between font-medium text-amber-500 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                      <span>المبلغ المتبقي:</span>
                      <span className="font-mono">{selectedRes.remainingBalance} ج.م</span>
                    </div>
                  </div>

                  {/* Process payment field */}
                  {selectedRes.status !== 'cancelled' && selectedRes.remainingBalance > 0 && (
                    <div className="pt-2 border-t border-[#27272a] space-y-2">
                      <label className="block text-[11px] text-zinc-400">تحصيل دفعة نقدية جديدة (ج.م):</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={paymentAmount || ''}
                          max={selectedRes.remainingBalance}
                          min="1"
                          onChange={(e) => setPaymentAmount(Math.min(selectedRes.remainingBalance, Math.max(0, Number(e.target.value))))}
                          className="flex-1 bg-[#18181b] border border-[#27272a] font-mono text-sm text-white rounded px-2.5 py-1 focus:outline-none focus:border-blue-500"
                          placeholder="المبلغ"
                        />
                        <button
                          onClick={handleRecordPayment}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded text-xs transition duration-150"
                        >
                          تحصيل
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer buttons (Cancel / Back) */}
                <div className="pt-6 border-t border-[#27272a] space-y-2">
                  {selectedRes.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelReservation(selectedRes.id)}
                      className="w-full py-1.5 bg-red-950/20 hover:bg-red-950 text-red-400 border border-red-900/40 hover:border-red-900 rounded text-xs font-medium transition duration-150 flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      إلغاء الحجز بالكامل
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedRes(null)}
                    className="w-full py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 rounded text-xs transition duration-150 font-medium"
                  >
                    إغلاق التفاصيل
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Reservation Invoice Dialog Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl text-right my-8">
            <div className="flex justify-between items-center bg-[#1c1c1f] p-4 border-b border-[#27272a]">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                إنشاء فاتورة حجز وتوريد جديدة (طلب مسبق وعربون)
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReservation} className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1 & 2: Form Inputs & Item Builder */}
              <div className="lg:col-span-2 space-y-6">
                {/* Section A: Customer Details */}
                <div className="bg-[#1c1c1f]/40 p-4 rounded-xl border border-[#27272a] space-y-4">
                  <h4 className="text-xs font-semibold text-zinc-300 border-b border-[#27272a]/40 pb-1.5">بيانات العميل أو الفرع:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">اسم العميل بالكامل *</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                        placeholder="مثال: مدرسة الأورمان، الأستاذ مصطفى..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">رقم الهاتف للتواصل *</label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                        placeholder="01xxxxxxxxx"
                        required
                      />
                    </div>

                    {/* Customer Category Tiers */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">فئة التسعير / نوع العميل *</label>
                      <select
                        value={customerType}
                        onChange={(e) => setCustomerType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="regular">زبون مفرق عادي (سعر الزبون)</option>
                        <option value="branch">فرع تابع للمطبعة (سعر الفرع)</option>
                        <option value="wholesale">تاجر كبار الجملة (سعر الجملة)</option>
                      </select>
                    </div>

                    {/* Associated Branch */}
                    {customerType === 'branch' && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">اختر الفرع المستلم *</label>
                        <select
                          value={branchId}
                          onChange={(e) => setBranchId(e.target.value)}
                          className="w-full px-3 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                          required
                        >
                          <option value="">-- اختر الفرع --</option>
                          {db.branches.filter(b => b.type === 'sub').map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section B: Multi-Item Book Selector */}
                <div className="bg-[#1c1c1f]/40 p-4 rounded-xl border border-[#27272a] space-y-4">
                  <h4 className="text-xs font-semibold text-zinc-300 border-b border-[#27272a]/40 pb-1.5">إضافة المطبوعات والكتب للحجز:</h4>
                  <div className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">اختر الكتاب من المستودع</label>
                      <select
                        value={currentSelectedBookId}
                        onChange={(e) => setCurrentSelectedBookId(e.target.value)}
                        className="w-full px-3 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- اختر كتاباً --</option>
                        {db.books.map(b => (
                          <option key={b.id} value={b.id}>
                            [{b.series}] {b.subject} - {b.grade} ({b.term}) - سعر {customerType === 'regular' ? b.customerPrice : customerType === 'branch' ? b.branchPrice : b.wholesalePrice} ج.م
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">الكمية</label>
                      <input
                        type="number"
                        min="1"
                        value={currentSelectedQty}
                        onChange={(e) => setCurrentSelectedQty(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-sm text-white text-center font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddItemToForm}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition duration-200 h-10"
                    >
                      إضافة للطلب
                    </button>
                  </div>

                  {/* Selected items table inside form */}
                  <div className="border border-[#27272a] rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#1c1c1f] text-zinc-400 border-b border-[#27272a]">
                          <th className="p-2.5 font-medium">بيان الكتاب</th>
                          <th className="p-2.5 text-center font-medium">الكمية</th>
                          <th className="p-2.5 text-center font-medium">السعر المعتمد</th>
                          <th className="p-2.5 text-center font-medium">الإجمالي</th>
                          <th className="p-2.5 text-center font-medium">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#27272a]/40">
                        {formItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-zinc-500">
                              لم يتم إضافة أي كتب للحجز الحالي بعد.
                            </td>
                          </tr>
                        ) : (
                          formItems.map((item, idx) => {
                            const book = db.books.find(b => b.id === item.bookId)!;
                            const price = getBookPriceForType(item.bookId, customerType);
                            return (
                              <tr key={idx} className="hover:bg-[#27272a]/20">
                                <td className="p-2.5">
                                  <span className="font-semibold text-zinc-200">[{book.series}] {book.subject}</span>
                                  <span className="text-[10px] text-zinc-500 block">{book.grade} ({book.term})</span>
                                </td>
                                <td className="p-2.5 text-center font-mono font-medium text-zinc-200">{item.quantity}</td>
                                <td className="p-2.5 text-center font-mono text-zinc-400">{price} ج.م</td>
                                <td className="p-2.5 text-center font-mono text-emerald-400 font-medium">
                                  {price * item.quantity} ج.م
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItemFromForm(idx)}
                                    className="p-1 hover:bg-red-950 text-red-400 rounded transition duration-150"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Column 3: Billing Calculations */}
              <div className="bg-[#09090b] p-4 rounded-xl border border-[#27272a] flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-zinc-300 border-b border-[#27272a] pb-1.5">الحسابات والخصومات:</h4>

                  <div className="space-y-3">
                    {/* Subtotal */}
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">الإجمالي المبدئي:</span>
                      <span className="font-mono text-zinc-200 font-medium">{formSubtotal} ج.م</span>
                    </div>

                    {/* Discount Input */}
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">الخصم الممنوح (ج.م):</label>
                      <input
                        type="number"
                        min="0"
                        value={discount}
                        onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2.5 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <hr className="border-[#27272a]" />

                    {/* Net Amount */}
                    <div className="flex justify-between font-medium text-sm text-white">
                      <span>الصافي المطلوب:</span>
                      <span className="font-mono text-blue-400">{formNetAmount} ج.م</span>
                    </div>

                    {/* Deposit / Paid Input */}
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">المقبوض نقداً / العربون (ج.م):</label>
                      <input
                        type="number"
                        min="0"
                        max={formNetAmount}
                        value={deposit}
                        onChange={(e) => setDeposit(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2.5 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Remaining */}
                    <div className="bg-amber-500/10 p-3 rounded border border-amber-500/20 flex justify-between font-medium text-xs text-amber-500">
                      <span>المبلغ المتبقي دين بالذمة:</span>
                      <span className="font-mono text-sm">{formRemaining} ج.م</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#27272a] space-y-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition duration-200 shadow-sm"
                  >
                    حفظ الحجز وإصدار الفاتورة
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="w-full py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 rounded-lg text-xs transition duration-150 font-medium"
                  >
                    إلغاء وإغلاق
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
