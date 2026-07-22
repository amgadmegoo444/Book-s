const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld('electron', {
  ping: () => ipcRenderer.invoke('app:ping'),
  databaseStatus: () => ipcRenderer.invoke('database:status'),
  books: {
    list: (search) => ipcRenderer.invoke('books:list', search),
    create: (book) => ipcRenderer.invoke('books:create', book),
    update: (book) => ipcRenderer.invoke('books:update', book),
    remove: (id) => ipcRenderer.invoke('books:delete', id)
  },
  branches: {
    list: () => ipcRenderer.invoke('branches:list'),
    create: (branch) => ipcRenderer.invoke('branches:create', branch),
    update: (branch) => ipcRenderer.invoke('branches:update', branch),
    remove: (id) => ipcRenderer.invoke('branches:delete', id)
  },
  employees: {
    list: () => ipcRenderer.invoke('employees:list'),
    create: (employee) => ipcRenderer.invoke('employees:create', employee),
    update: (employee) => ipcRenderer.invoke('employees:update', employee),
    remove: (id) => ipcRenderer.invoke('employees:delete', id)
  },
  reservations: {
    list: () => ipcRenderer.invoke('reservations:list'),
    create: (reservation) => ipcRenderer.invoke('reservations:create', reservation),
    recordPayment: (payment) => ipcRenderer.invoke('reservations:record-payment', payment),
    deliver: (delivery) => ipcRenderer.invoke('reservations:deliver', delivery),
    processReturn: (payload) => ipcRenderer.invoke('reservations:return', payload),
    cancel: (payload) => ipcRenderer.invoke('reservations:cancel', payload)
  },
  accounts: {
    list: () => ipcRenderer.invoke('accounts:list')
  },
  production: {
    log: (entry) => ipcRenderer.invoke('production:log', entry)
  },
  printing: {
    list: () => ipcRenderer.invoke('printing:list'),
    queue: (job) => ipcRenderer.invoke('printing:queue', job)
  }
});
