import { getGoogleSheetsClient, getSheetId } from './client';

export interface Customer {
  id: string;
  name: string;
  contactInfo: string;
  createdAt: string;
}

export interface Item {
  id: string;
  customerId: string;
  description: string;
  imageUrl: string;
  costJpy: number;
  exchangeRate: number;
  costHkd: number;
  status: 'Ordered' | 'Received' | 'Delivered';
  purchaseDate: string;
}

export interface Payment {
  id: string;
  customerId: string;
  amountHkd: number;
  paymentDate: string;
  method: string;
  note: string;
}

export async function getCustomers(): Promise<Customer[]> {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: 'Customers!A2:D',
  });

  const rows = response.data.values || [];
  return rows.map((row) => ({
    id: row[0],
    name: row[1],
    contactInfo: row[2],
    createdAt: row[3],
  }));
}

export async function getItems(): Promise<Item[]> {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: 'Items!A2:I',
  });

  const rows = response.data.values || [];
  return rows.map((row) => ({
    id: row[0],
    customerId: row[1],
    description: row[2],
    imageUrl: row[3],
    costJpy: Number(row[4]),
    exchangeRate: Number(row[5]),
    costHkd: Number(row[6]),
    status: row[7],
    purchaseDate: row[8],
  }));
}

export async function getPayments(): Promise<Payment[]> {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: 'Payments!A2:F',
  });

  const rows = response.data.values || [];
  return rows.map((row) => ({
    id: row[0],
    customerId: row[1],
    amountHkd: Number(row[2]),
    paymentDate: row[3],
    method: row[4],
    note: row[5],
  }));
}

export async function addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>) {
  const sheets = await getGoogleSheetsClient();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: 'Customers!A:D',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[id, customer.name, customer.contactInfo, createdAt]],
    },
  });
}

export async function addItem(item: Omit<Item, 'id' | 'costHkd'>) {
  const sheets = await getGoogleSheetsClient();
  const id = crypto.randomUUID();
  const costHkd = item.costJpy * item.exchangeRate;
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: 'Items!A:I',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        id, 
        item.customerId, 
        item.description, 
        item.imageUrl, 
        item.costJpy, 
        item.exchangeRate, 
        costHkd, 
        item.status, 
        item.purchaseDate
      ]],
    },
  });
}

export async function addPayment(payment: Omit<Payment, 'id'>) {
  const sheets = await getGoogleSheetsClient();
  const id = crypto.randomUUID();
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: 'Payments!A:F',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        id,
        payment.customerId,
        payment.amountHkd,
        payment.paymentDate,
        payment.method,
        payment.note
      ]],
    },
  });
}
