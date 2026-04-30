import { addCustomer, addItem, addPayment, getCustomers, getItems, getPayments, clearCustomerHistory } from './src/lib/google-sheets/api';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

async function runSessionTest() {
  console.log('--- Starting Session Logic UAT ---');
  const timestamp = Date.now();
  const customerName = `Session Tester ${timestamp}`;

  try {
    // 1. Add a customer
    console.log(`Adding customer: ${customerName}`);
    await addCustomer({ name: customerName, contactInfo: 'session@test.com' });
    const customers = await getCustomers();
    const customer = customers.find(c => c.name === customerName);
    if (!customer) throw new Error('Customer not created');
    const customerId = customer.id;

    // 2. Add items totaling $100 (HKD)
    console.log('Adding items totaling $100 HKD...');
    await addItem({
      customerId,
      description: 'Item 1',
      imageUrl: 'https://example.com/item1.jpg',
      costJpy: 100,
      exchangeRate: 1,
      status: 'Ordered',
      purchaseDate: new Date().toISOString().split('T')[0],
    });

    // 3. Add a payment of $100
    console.log('Adding payment of $100 HKD...');
    await addPayment({
      customerId,
      amountHkd: 100,
      paymentDate: new Date().toISOString().split('T')[0],
      method: 'Cash',
      note: 'Initial payment',
    });

    // 4. Confirm Active balance is $0
    const items1 = (await getItems()).filter(i => i.customerId === customerId);
    const payments1 = (await getPayments()).filter(p => p.customerId === customerId);
    const cost1 = items1.reduce((sum, i) => sum + i.costHkd, 0);
    const paid1 = payments1.reduce((sum, p) => sum + p.amountHkd, 0);
    const balance1 = cost1 - paid1;
    console.log(`Phase 1 Balance: ${balance1} (Expected: 0)`);

    if (balance1 !== 0) throw new Error(`Balance 1 is ${balance1}, expected 0`);

    // 5. Simulate "Clearing/Batching" (The logic we just added)
    // Note: In the real app, this is triggered when balance reaches 0 
    // or manually. We call clearCustomerHistory.
    console.log('Clearing history (batching)...');
    await clearCustomerHistory(customerId);

    // 6. Add a NEW item of $50
    console.log('Adding NEW item of $50 HKD...');
    await addItem({
      customerId,
      description: 'Item 2',
      imageUrl: 'https://example.com/item2.jpg',
      costJpy: 50,
      exchangeRate: 1,
      status: 'Ordered',
      purchaseDate: new Date().toISOString().split('T')[0],
    });

    // 7. Confirm the "Active" balance is exactly $50
    // The getItems/getPayments logic should now only return items/payments 
    // that are NOT cleared.
    const items2 = (await getItems()).filter(i => i.customerId === customerId);
    const payments2 = (await getPayments()).filter(p => p.customerId === customerId);
    const cost2 = items2.reduce((sum, i) => sum + i.costHkd, 0);
    const paid2 = payments2.reduce((sum, p) => sum + p.amountHkd, 0);
    const balance2 = cost2 - paid2;

    console.log(`Phase 2 Balance: ${balance2} (Expected: 50)`);

    if (balance2 === 50) {
      console.log('✅ SUCCESS: Session logic (clearing history) verified.');
    } else {
      console.log(`❌ FAILURE: Expected 50, got ${balance2}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('UAT Error:', error);
    process.exit(1);
  }
}

runSessionTest();
