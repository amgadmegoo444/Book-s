declare global {
    interface Window {
        electron?: {
            ping: () => Promise<string>;
            databaseStatus: () => Promise<{ connected: boolean }>;
            books: {
                list: (search?: string) => Promise<import('../types').Book[]>;
                create: (book: import('../types').Book) => Promise<import('../types').Book>;
                update: (book: import('../types').Book) => Promise<import('../types').Book>;
                remove: (id: string) => Promise<{ changes: number }>;
            };
            branches: CrudApi<import('../types').Branch>;
            employees: CrudApi<import('../types').Employee>;
            reservations: {
                list: () => Promise<import('../types').Reservation[]>;
                create: (reservation: import('../types').Reservation) => Promise<{ reservation: import('../types').Reservation; branch: import('../types').Branch | null }>;
                recordPayment: (payment: { reservationId: string; amount: number; employeeId: string; createdAt: string }) => Promise<{ reservation: import('../types').Reservation; branch: import('../types').Branch | null }>;
                deliver: (delivery: { reservationId: string; deliveries: Record<string, number>; employeeId: string; updatedAt: string }) => Promise<import('../types').Reservation>;
                processReturn: (payload: { reservationId: string; returns: Record<string, number>; updatedAt: string }) => Promise<{ reservation: import('../types').Reservation; branch: import('../types').Branch | null }>;
                cancel: (payload: { reservationId: string; updatedAt: string }) => Promise<{ reservation: import('../types').Reservation; branch: import('../types').Branch | null }>;
            };
            accounts: { list: () => Promise<AccountEntry[]> };
            production: { log: (entry: { id: string; bookId: string; quantity: number; rejectedQuantity: number; employeeId: string; createdAt: string }) => Promise<{ book: import('../types').Book; job: import('../types').PrintJob }> };
            printing: { list: () => Promise<import('../types').PrintJob[]>; queue: (job: import('../types').PrintJob) => Promise<import('../types').PrintJob> };
        };
    }
}

interface CrudApi<T> {
  list: () => Promise<T[]>;
  create: (value: T) => Promise<T>;
  update: (value: T) => Promise<T>;
  remove: (id: string) => Promise<{ changes: number }>;
}

export interface AccountEntry {
  id: string; entryType: 'income' | 'expense'; amount: number; description: string;
  referenceType?: string; referenceId?: string; employeeId?: string; createdAt: string;
}

export function isDesktopApp(): boolean {
  return Boolean(window.electron);
}
