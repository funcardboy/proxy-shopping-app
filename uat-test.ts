import { addCustomer, addItem, addPayment, getCustomers, getItems, getPayments } from './src/lib/google-sheets/api';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local manually to ensure it's available for the imported modules
const envPath = path.resolve(__dirname, '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

async function runUAT() {
  console.log('--- Starting UAT ---');
  console.log('SHEET_ID:', process.env.GOOGLE_SHEET_ID);

  try {
    // 1. Add dummy data
    console.log('Adding dummy customer...');
    const customerName = 'UAT Tester ' + Date.now();
    await addCustomer({
      name: customerName,
      contactInfo: 'uat@example.com',
    });

    // Fetch the customer to get the ID
    const customers = await getCustomers();
    const customer = customers.find(c => c.name === customerName);
    
    if (!customer) {
      throw new Error('Failed to find the added customer');
    }
    console.log(`Customer added with ID: ${customer.id}`);

    console.log('Adding dummy item...');
    await addItem({
      customerId: customer.id,
      description: 'UAT Test Item',
      imageUrl: 'https://example.com/item.jpg',
      costJpy: 1000,
      exchangeRate: 0.052,
      status: 'Ordered',
      purchaseDate: new Date().toISOString().split('T')[0],
    });

    console.log('Adding partial payment...');
    await addPayment({
      customerId: customer.id,
      amountHkd: 20,
      paymentDate: new Date().toISOString().split('T')[0],
      method: 'FPS',
      note: 'UAT Payment',
    });

    // 2. Verify data
    console.log('\n--- Verifying Data ---');
    
    const allItems = await getItems();
    const customerItems = allItems.filter(i => i.customerId === customer.id);
    console.log(`Items found for customer: ${customerItems.length}`);
    customerItems.forEach(i => {
      console.log(`- Item: ${i.description}, Cost: JPY ${i.costJpy}, HKD ${i.costHkd}`);
    });

    const allPayments = await getPayments();
    const customerPayments = allPayments.filter(p => p.customerId === customer.id);
    console.log(`Payments found for customer: ${customerPayments.length}`);
    customerPayments.forEach(p => {
      console.log(`- Payment: HKD ${p.amountHkd}, Method: ${p.method}`);
    });

    // Calculation Check
    const totalCost = customerItems.reduce((sum, i) => sum + i.costHkd, 0);
    const totalPaid = customerPayments.reduce((sum, p) => sum + p.amountHkd, 0);
    const balance = totalCost - totalPaid;

    console.log(`\nSummary:`);
    console.log(`Total Cost: HKD ${totalCost}`);
    console.log(`Total Paid: HKD ${totalPaid}`);
    console.log(`Outstanding Balance: HKD ${balance}`);

    if (totalCost === 52 && totalPaid === 20 && balance === 32) {
      console.log('\n✅ UAT SUCCESS: Calculations match expected values.');
    } else {
      console.log('\n❌ UAT FAILED: Calculation mismatch.');
    }

  } catch (error) {
    console.error('UAT Error:', error);
  }
}

runUAT();
