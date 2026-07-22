const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let database;

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    database.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    database.get(sql, params, (error, row) => error ? reject(error) : resolve(row));
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    database.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
  });
}

const schema = [
  `CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY, series TEXT NOT NULL, subject TEXT NOT NULL, stage TEXT NOT NULL,
    grade TEXT NOT NULL, term TEXT NOT NULL, customer_price REAL NOT NULL DEFAULT 0,
    branch_price REAL NOT NULL DEFAULT 0, wholesale_price REAL NOT NULL DEFAULT 0,
    pdf_path TEXT NOT NULL DEFAULT '', printing_status TEXT NOT NULL DEFAULT 'idle',
    quantity_printed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, debt REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, phone TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY, invoice_number TEXT NOT NULL UNIQUE, customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL, customer_type TEXT NOT NULL, branch_id TEXT, employee_id TEXT NOT NULL,
    delivery_employee_id TEXT, total_amount REAL NOT NULL DEFAULT 0, discount REAL NOT NULL DEFAULT 0,
    net_amount REAL NOT NULL DEFAULT 0, deposit REAL NOT NULL DEFAULT 0, paid_amount REAL NOT NULL DEFAULT 0,
    remaining_balance REAL NOT NULL DEFAULT 0, status TEXT NOT NULL, created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL, FOREIGN KEY(branch_id) REFERENCES branches(id),
    FOREIGN KEY(employee_id) REFERENCES employees(id)
  )`,
  `CREATE TABLE IF NOT EXISTS reservation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, reservation_id TEXT NOT NULL, book_id TEXT NOT NULL,
    series TEXT NOT NULL, subject TEXT NOT NULL, grade TEXT NOT NULL, term TEXT NOT NULL,
    quantity_requested INTEGER NOT NULL, quantity_delivered INTEGER NOT NULL DEFAULT 0,
    price_per_unit REAL NOT NULL, FOREIGN KEY(reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY(book_id) REFERENCES books(id)
  )`,
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, entry_type TEXT NOT NULL, amount REAL NOT NULL, description TEXT NOT NULL,
    reference_type TEXT, reference_id TEXT, employee_id TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS production (
    id TEXT PRIMARY KEY, book_id TEXT NOT NULL, quantity INTEGER NOT NULL, rejected_quantity INTEGER NOT NULL DEFAULT 0,
    employee_id TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(book_id) REFERENCES books(id)
  )`,
  `CREATE TABLE IF NOT EXISTS printing (
    id TEXT PRIMARY KEY, book_id TEXT NOT NULL, printer_id TEXT NOT NULL, layout TEXT NOT NULL,
    pages_per_sheet TEXT NOT NULL, duplex INTEGER NOT NULL DEFAULT 0, copies INTEGER NOT NULL,
    status TEXT NOT NULL, created_at TEXT NOT NULL, completed_at TEXT, FOREIGN KEY(book_id) REFERENCES books(id)
  )`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  'CREATE INDEX IF NOT EXISTS idx_books_search ON books(series, subject, grade)',
  'CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at)'
];

function toBook(row) {
  return {
    id: row.id, series: row.series, subject: row.subject, stage: row.stage, grade: row.grade, term: row.term,
    customerPrice: row.customer_price, branchPrice: row.branch_price, wholesalePrice: row.wholesale_price,
    pdfPath: row.pdf_path, printingStatus: row.printing_status, quantityPrinted: row.quantity_printed
  };
}

const booksRepository = {
  async list(search = '') {
    const text = `%${search.trim()}%`;
    const rows = await all(`SELECT * FROM books WHERE series LIKE ? OR subject LIKE ? OR grade LIKE ? ORDER BY created_at DESC`, [text, text, text]);
    return rows.map(toBook);
  },
  async create(book) {
    await run(`INSERT INTO books (id, series, subject, stage, grade, term, customer_price, branch_price, wholesale_price, pdf_path, printing_status, quantity_printed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [book.id, book.series, book.subject, book.stage, book.grade, book.term, book.customerPrice, book.branchPrice, book.wholesalePrice, book.pdfPath, book.printingStatus || 'idle', book.quantityPrinted || 0]);
    return this.byId(book.id);
  },
  async update(book) {
    await run(`UPDATE books SET series=?, subject=?, stage=?, grade=?, term=?, customer_price=?, branch_price=?, wholesale_price=?, pdf_path=?, printing_status=?, quantity_printed=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [book.series, book.subject, book.stage, book.grade, book.term, book.customerPrice, book.branchPrice, book.wholesalePrice, book.pdfPath, book.printingStatus, book.quantityPrinted, book.id]);
    return this.byId(book.id);
  },
  async remove(id) { return run('DELETE FROM books WHERE id = ?', [id]); },
  async byId(id) { const row = await get('SELECT * FROM books WHERE id = ?', [id]); return row ? toBook(row) : null; }
};

const branchesRepository = {
  list: () => all('SELECT id, name, type, debt FROM branches ORDER BY name'),
  async create(branch) {
    await run('INSERT INTO branches (id, name, type, debt) VALUES (?, ?, ?, ?)', [branch.id, branch.name, branch.type, branch.debt]);
    return get('SELECT id, name, type, debt FROM branches WHERE id=?', [branch.id]);
  },
  async update(branch) {
    await run('UPDATE branches SET name=?, type=?, debt=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [branch.name, branch.type, branch.debt, branch.id]);
    return get('SELECT id, name, type, debt FROM branches WHERE id=?', [branch.id]);
  },
  remove: (id) => run('DELETE FROM branches WHERE id=?', [id])
};

const employeesRepository = {
  list: () => all('SELECT id, name, role, phone FROM employees WHERE is_active=1 ORDER BY name'),
  async create(employee) {
    await run('INSERT INTO employees (id, name, role, phone) VALUES (?, ?, ?, ?)', [employee.id, employee.name, employee.role, employee.phone]);
    return get('SELECT id, name, role, phone FROM employees WHERE id=?', [employee.id]);
  },
  async update(employee) {
    await run('UPDATE employees SET name=?, role=?, phone=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [employee.name, employee.role, employee.phone, employee.id]);
    return get('SELECT id, name, role, phone FROM employees WHERE id=?', [employee.id]);
  },
  remove: (id) => run('UPDATE employees SET is_active=0, updated_at=CURRENT_TIMESTAMP WHERE id=?', [id])
};

async function toReservation(row) {
  const items = await all(`SELECT book_id AS bookId, series, subject, grade, term,
    quantity_requested AS quantityRequested, quantity_delivered AS quantityDelivered,
    price_per_unit AS pricePerUnit FROM reservation_items WHERE reservation_id=? ORDER BY id`, [row.id]);
  return {
    id: row.id, invoiceNumber: row.invoice_number, customerName: row.customer_name,
    customerPhone: row.customer_phone, customerType: row.customer_type, branchId: row.branch_id,
    employeeId: row.employee_id, deliveryEmployeeId: row.delivery_employee_id || undefined, items,
    totalAmount: row.total_amount, discount: row.discount, netAmount: row.net_amount, deposit: row.deposit,
    paidAmount: row.paid_amount, remainingBalance: row.remaining_balance, status: row.status,
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}

const reservationsRepository = {
  async list() {
    const rows = await all('SELECT * FROM reservations ORDER BY created_at DESC');
    return Promise.all(rows.map(toReservation));
  },
  async create(reservation) {
    await run('BEGIN IMMEDIATE TRANSACTION');
    try {
      await run(`INSERT INTO reservations (id, invoice_number, customer_name, customer_phone, customer_type, branch_id, employee_id, total_amount, discount, net_amount, deposit, paid_amount, remaining_balance, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reservation.id, reservation.invoiceNumber, reservation.customerName, reservation.customerPhone,
        reservation.customerType, reservation.branchId, reservation.employeeId, reservation.totalAmount,
        reservation.discount, reservation.netAmount, reservation.deposit, reservation.paidAmount,
        reservation.remainingBalance, reservation.status, reservation.createdAt, reservation.updatedAt]);
      for (const item of reservation.items) {
        await run(`INSERT INTO reservation_items (reservation_id, book_id, series, subject, grade, term, quantity_requested, quantity_delivered, price_per_unit)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [reservation.id, item.bookId, item.series, item.subject,
          item.grade, item.term, item.quantityRequested, item.quantityDelivered, item.pricePerUnit]);
      }
      let branch = null;
      if (reservation.customerType !== 'regular' && reservation.remainingBalance > 0) {
        await run('UPDATE branches SET debt = debt + ?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [reservation.remainingBalance, reservation.branchId]);
        branch = await get('SELECT id, name, type, debt FROM branches WHERE id=?', [reservation.branchId]);
      }
      if (reservation.deposit > 0) {
        await run(`INSERT INTO accounts (id, entry_type, amount, description, reference_type, reference_id, employee_id, created_at)
          VALUES (?, 'income', ?, ?, 'reservation', ?, ?, ?)`,
          [`acc-${Date.now()}`, reservation.deposit, `دفعة حجز ${reservation.invoiceNumber}`, reservation.id, reservation.employeeId, reservation.createdAt]);
      }
      await run('COMMIT');
      const row = await get('SELECT * FROM reservations WHERE id=?', [reservation.id]);
      return { reservation: await toReservation(row), branch };
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  },
  async recordPayment({ reservationId, amount, employeeId, createdAt }) {
    await run('BEGIN IMMEDIATE TRANSACTION');
    try {
      const row = await get('SELECT * FROM reservations WHERE id=?', [reservationId]);
      if (!row) throw new Error('Reservation not found');
      const collected = Math.min(row.net_amount - row.paid_amount, Number(amount));
      if (collected <= 0) throw new Error('Payment amount is not valid');
      const paidAmount = row.paid_amount + collected;
      const remainingBalance = Math.max(0, row.net_amount - paidAmount);
      await run('UPDATE reservations SET paid_amount=?, remaining_balance=?, updated_at=? WHERE id=?', [paidAmount, remainingBalance, createdAt, reservationId]);
      let branch = null;
      if (row.customer_type !== 'regular') {
        await run('UPDATE branches SET debt=MAX(0, debt-?), updated_at=CURRENT_TIMESTAMP WHERE id=?', [collected, row.branch_id]);
        branch = await get('SELECT id, name, type, debt FROM branches WHERE id=?', [row.branch_id]);
      }
      await run(`INSERT INTO accounts (id, entry_type, amount, description, reference_type, reference_id, employee_id, created_at)
        VALUES (?, 'income', ?, ?, 'reservation-payment', ?, ?, ?)`,
        [`acc-${Date.now()}`, collected, `دفعة فاتورة ${row.invoice_number}`, reservationId, employeeId, createdAt]);
      await run('COMMIT');
      return { reservation: await toReservation(await get('SELECT * FROM reservations WHERE id=?', [reservationId])), branch };
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  },
  async deliver({ reservationId, deliveries, employeeId, updatedAt }) {
    await run('BEGIN IMMEDIATE TRANSACTION');
    try {
      const reservation = await get('SELECT id FROM reservations WHERE id=?', [reservationId]);
      if (!reservation) throw new Error('Reservation not found');
      let changed = false;
      for (const [bookId, value] of Object.entries(deliveries)) {
        const quantity = Number(value);
        if (!Number.isFinite(quantity) || quantity <= 0) continue;
        const item = await get('SELECT quantity_requested, quantity_delivered FROM reservation_items WHERE reservation_id=? AND book_id=?', [reservationId, bookId]);
        if (!item) continue;
        const next = Math.min(item.quantity_requested, item.quantity_delivered + quantity);
        if (next !== item.quantity_delivered) {
          await run('UPDATE reservation_items SET quantity_delivered=? WHERE reservation_id=? AND book_id=?', [next, reservationId, bookId]);
          changed = true;
        }
      }
      if (!changed) throw new Error('No valid delivery quantity');
      const items = await all('SELECT quantity_requested, quantity_delivered FROM reservation_items WHERE reservation_id=?', [reservationId]);
      const status = items.every((item) => item.quantity_delivered === item.quantity_requested) ? 'completed' : 'partial';
      await run('UPDATE reservations SET status=?, delivery_employee_id=?, updated_at=? WHERE id=?', [status, employeeId, updatedAt, reservationId]);
      await run('COMMIT');
      return toReservation(await get('SELECT * FROM reservations WHERE id=?', [reservationId]));
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  },
  async processReturn({ reservationId, returns, updatedAt }) {
    await run('BEGIN IMMEDIATE TRANSACTION');
    try {
      const row = await get('SELECT * FROM reservations WHERE id=?', [reservationId]);
      if (!row) throw new Error('Reservation not found');
      let credit = 0;
      for (const [bookId, value] of Object.entries(returns)) {
        const quantity = Number(value);
        if (!Number.isFinite(quantity) || quantity <= 0) continue;
        const item = await get('SELECT id, quantity_requested, quantity_delivered, price_per_unit FROM reservation_items WHERE reservation_id=? AND book_id=?', [reservationId, bookId]);
        if (!item || quantity > item.quantity_delivered) continue;
        credit += quantity * item.price_per_unit;
        const requested = item.quantity_requested - quantity;
        const delivered = item.quantity_delivered - quantity;
        if (requested === 0) await run('DELETE FROM reservation_items WHERE id=?', [item.id]);
        else await run('UPDATE reservation_items SET quantity_requested=?, quantity_delivered=? WHERE id=?', [requested, delivered, item.id]);
      }
      if (credit <= 0) throw new Error('No valid return quantity');
      const items = await all('SELECT quantity_requested, quantity_delivered, price_per_unit FROM reservation_items WHERE reservation_id=?', [reservationId]);
      const totalAmount = items.reduce((sum, item) => sum + item.quantity_requested * item.price_per_unit, 0);
      const netAmount = Math.max(0, totalAmount - row.discount);
      const remainingBalance = Math.max(0, netAmount - row.paid_amount);
      const status = items.length === 0 ? 'cancelled' : (items.every((item) => item.quantity_delivered === item.quantity_requested) ? 'completed' : 'partial');
      await run('UPDATE reservations SET total_amount=?, net_amount=?, remaining_balance=?, status=?, updated_at=? WHERE id=?', [totalAmount, netAmount, remainingBalance, status, updatedAt, reservationId]);
      let branch = null;
      if (row.customer_type !== 'regular') {
        await run('UPDATE branches SET debt=MAX(0, debt-?), updated_at=CURRENT_TIMESTAMP WHERE id=?', [credit, row.branch_id]);
        branch = await get('SELECT id, name, type, debt FROM branches WHERE id=?', [row.branch_id]);
      }
      await run('COMMIT');
      return { reservation: await toReservation(await get('SELECT * FROM reservations WHERE id=?', [reservationId])), branch };
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  },
  async cancel({ reservationId, updatedAt }) {
    await run('BEGIN IMMEDIATE TRANSACTION');
    try {
      const row = await get('SELECT * FROM reservations WHERE id=?', [reservationId]);
      if (!row) throw new Error('Reservation not found');
      let branch = null;
      if (row.customer_type !== 'regular' && row.remaining_balance > 0) {
        await run('UPDATE branches SET debt=MAX(0, debt-?), updated_at=CURRENT_TIMESTAMP WHERE id=?', [row.remaining_balance, row.branch_id]);
        branch = await get('SELECT id, name, type, debt FROM branches WHERE id=?', [row.branch_id]);
      }
      await run(`UPDATE reservations SET status='cancelled', remaining_balance=0, updated_at=? WHERE id=?`, [updatedAt, reservationId]);
      await run('COMMIT');
      return { reservation: await toReservation(await get('SELECT * FROM reservations WHERE id=?', [reservationId])), branch };
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  }
};

const accountsRepository = {
  list: () => all('SELECT id, entry_type AS entryType, amount, description, reference_type AS referenceType, reference_id AS referenceId, employee_id AS employeeId, created_at AS createdAt FROM accounts ORDER BY created_at DESC')
};

function toPrintJob(row) {
  return {
    id: row.id, bookId: row.book_id, series: row.series || '', subject: row.subject || '', grade: row.grade || '',
    printerId: row.printer_id, layout: row.layout, pagesPerSheet: row.pages_per_sheet,
    duplex: Boolean(row.duplex), copies: row.copies, status: row.status, createdAt: row.created_at,
    completedAt: row.completed_at || undefined
  };
}

const productionRepository = {
  async log({ id, bookId, quantity, rejectedQuantity, employeeId, createdAt }) {
    await run('BEGIN IMMEDIATE TRANSACTION');
    try {
      const book = await get('SELECT * FROM books WHERE id=?', [bookId]);
      if (!book) throw new Error('Book not found');
      await run('INSERT INTO production (id, book_id, quantity, rejected_quantity, employee_id, created_at) VALUES (?, ?, ?, ?, ?, ?)', [id, bookId, quantity, rejectedQuantity, employeeId, createdAt]);
      await run(`INSERT INTO printing (id, book_id, printer_id, layout, pages_per_sheet, duplex, copies, status, created_at, completed_at)
        VALUES (?, ?, 'HP-2', 'portrait', '1-up', 1, ?, 'completed', ?, ?)`, [`pj-${id}`, bookId, quantity, createdAt, createdAt]);
      await run(`UPDATE books SET quantity_printed=quantity_printed+?, printing_status='completed', updated_at=CURRENT_TIMESTAMP WHERE id=?`, [quantity, bookId]);
      await run('COMMIT');
      return { book: toBook(await get('SELECT * FROM books WHERE id=?', [bookId])), job: toPrintJob(await get('SELECT p.*, b.series, b.subject, b.grade FROM printing p JOIN books b ON b.id=p.book_id WHERE p.id=?', [`pj-${id}`])) };
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  }
};

const printingRepository = {
  async list() {
    const rows = await all('SELECT p.*, b.series, b.subject, b.grade FROM printing p JOIN books b ON b.id=p.book_id ORDER BY p.created_at DESC');
    return rows.map(toPrintJob);
  },
  async queue(job) {
    await run(`INSERT INTO printing (id, book_id, printer_id, layout, pages_per_sheet, duplex, copies, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`, [job.id, job.bookId, job.printerId, job.layout, job.pagesPerSheet, job.duplex ? 1 : 0, job.copies, job.createdAt]);
    const row = await get('SELECT p.*, b.series, b.subject, b.grade FROM printing p JOIN books b ON b.id=p.book_id WHERE p.id=?', [job.id]);
    return toPrintJob(row);
  }
};

async function initializeDatabase(userDataPath) {
  fs.mkdirSync(userDataPath, { recursive: true });
  database = new sqlite3.Database(path.join(userDataPath, 'database.db'));
  await run('PRAGMA foreign_keys = ON');
  for (const statement of schema) await run(statement);
  return path.join(userDataPath, 'database.db');
}

function closeDatabase() {
  if (database) database.close();
}

module.exports = { initializeDatabase, closeDatabase, booksRepository, branchesRepository, employeesRepository, reservationsRepository, accountsRepository, productionRepository, printingRepository };
