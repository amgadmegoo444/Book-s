export type ReservationStatus = 'pending' | 'partial' | 'completed' | 'cancelled';
export type PrinterId = 'HP-1' | 'HP-2' | 'Canon-1' | 'Epson-1';

export interface Book {
  id: string; series: string; subject: string; stage: string; grade: string; term: string;
  customerPrice: number; branchPrice: number; wholesalePrice: number; pdfPath: string;
  printingStatus: 'idle' | 'printing' | 'completed'; quantityPrinted: number;
}
export interface ReservationItem {
  bookId: string; series: string; subject: string; grade: string; term: string;
  quantityRequested: number; quantityDelivered: number; pricePerUnit: number;
}
export interface Reservation {
  id: string; invoiceNumber: string; customerName: string; customerPhone: string;
  customerType: 'regular' | 'branch' | 'wholesale'; branchId: string; employeeId: string; deliveryEmployeeId?: string;
  items: ReservationItem[]; totalAmount: number; discount: number; netAmount: number;
  deposit: number; paidAmount: number; remainingBalance: number; status: ReservationStatus;
  createdAt: string; updatedAt: string;
}
export interface Branch { id: string; name: string; type: 'main' | 'sub' | 'wholesale'; debt: number; }
export interface Employee { id: string; name: string; role: 'admin' | 'printer' | 'sales' | 'delivery'; phone: string; }
export interface Expense { id: string; title: string; amount: number; employeeId: string; date: string; }
export interface Printer { id: PrinterId; name: string; status: 'idle' | 'printing' | 'offline'; currentJobId?: string; progress?: number; }
export interface PrintJob {
  id: string; bookId: string; series: string; subject: string; grade: string; printerId: PrinterId;
  layout: 'portrait' | 'landscape'; pagesPerSheet: '1-up' | '2-up' | '4-up'; duplex: boolean;
  copies: number; status: 'pending' | 'printing' | 'completed' | 'failed'; createdAt: string; completedAt?: string;
}
