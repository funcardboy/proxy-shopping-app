const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function setupSheet() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = meta.data.sheets.map(s => s.properties.title);

    const requiredSheets = [
      { title: 'Customers', headers: ['customer_id', 'name', 'contact_info', 'created_at'] },
      { title: 'Items', headers: ['item_id', 'customer_id', 'description', 'image_url', 'cost_jpy', 'exchange_rate', 'cost_hkd', 'status', 'purchase_date'] },
      { title: 'Payments', headers: ['payment_id', 'customer_id', 'amount_hkd', 'payment_date', 'method', 'note'] }
    ];

    for (const sheet of requiredSheets) {
      if (!existingSheets.includes(sheet.title)) {
        console.log(`Creating sheet: ${sheet.title}`);
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: sheet.title } } }]
          }
        });
      }

      console.log(`Updating headers for: ${sheet.title}`);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheet.title}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [sheet.headers]
        }
      });
    }

    console.log('✅ Sheet setup complete!');
  } catch (error) {
    console.error('❌ Error setting up sheet:', error.message);
  }
}

setupSheet();
