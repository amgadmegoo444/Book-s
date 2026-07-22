const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { initializeDatabase, closeDatabase, booksRepository, branchesRepository, employeesRepository, reservationsRepository, accountsRepository, productionRepository, printingRepository } = require("./database.cjs");

function registerIpcHandlers() {
  ipcMain.handle('app:ping', async () => 'BookFlow Connected');
  ipcMain.handle('database:status', async () => ({ connected: true }));
  ipcMain.handle('books:list', async (_event, search) => booksRepository.list(search));
  ipcMain.handle('books:create', async (_event, book) => booksRepository.create(book));
  ipcMain.handle('books:update', async (_event, book) => booksRepository.update(book));
  ipcMain.handle('books:delete', async (_event, id) => booksRepository.remove(id));
  ipcMain.handle('branches:list', async () => branchesRepository.list());
  ipcMain.handle('branches:create', async (_event, branch) => branchesRepository.create(branch));
  ipcMain.handle('branches:update', async (_event, branch) => branchesRepository.update(branch));
  ipcMain.handle('branches:delete', async (_event, id) => branchesRepository.remove(id));
  ipcMain.handle('employees:list', async () => employeesRepository.list());
  ipcMain.handle('employees:create', async (_event, employee) => employeesRepository.create(employee));
  ipcMain.handle('employees:update', async (_event, employee) => employeesRepository.update(employee));
  ipcMain.handle('employees:delete', async (_event, id) => employeesRepository.remove(id));
  ipcMain.handle('reservations:list', async () => reservationsRepository.list());
  ipcMain.handle('reservations:create', async (_event, reservation) => reservationsRepository.create(reservation));
  ipcMain.handle('reservations:record-payment', async (_event, payment) => reservationsRepository.recordPayment(payment));
  ipcMain.handle('reservations:deliver', async (_event, delivery) => reservationsRepository.deliver(delivery));
  ipcMain.handle('reservations:return', async (_event, payload) => reservationsRepository.processReturn(payload));
  ipcMain.handle('reservations:cancel', async (_event, payload) => reservationsRepository.cancel(payload));
  ipcMain.handle('accounts:list', async () => accountsRepository.list());
  ipcMain.handle('production:log', async (_event, entry) => productionRepository.log(entry));
  ipcMain.handle('printing:list', async () => printingRepository.list());
  ipcMain.handle('printing:queue', async (_event, job) => printingRepository.queue(job));
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1600,
        height: 900,
        autoHideMenuBar: true,
        webPreferences: {

    preload: path.join(__dirname, "preload.cjs"),

    contextIsolation: true,

    nodeIntegration: false

}
    });

    if (app.isPackaged) {
        win.loadFile(path.join(__dirname, "../dist/index.html"));
    } else {
        win.loadURL("http://localhost:3000");
    }
}

app.whenReady().then(async () => {
  await initializeDatabase(app.getPath('userData'));
  registerIpcHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on('before-quit', closeDatabase);
