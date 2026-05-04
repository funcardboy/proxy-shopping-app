
import { getGoogleSheetsClient } from './src/lib/google-sheets/client.ts';
import { getGoogleDriveClient, getDriveFolderId } from './src/lib/google-drive/client.ts';
import * as dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config({ path: '.env.local' });

async function diagnose() {
  console.log('--- Diagnosis Start ---');
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  console.log('Sheet ID:', sheetId);
  console.log('Drive Folder ID:', folderId);

  // 1. Test Sheets
  try {
    console.log('\nTesting Google Sheets Connection...');
    const sheets = await getGoogleSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Items!A1:Z1',
    });
    console.log('Sheets Connection SUCCESS. Header found:', res.data.values?.[0]);
  } catch (err: any) {
    console.error('Sheets Connection FAILED:', err.message);
  }

  // 2. Test Drive Folder Access
  try {
    console.log('\nTesting Google Drive Folder Access...');
    const drive = await getGoogleDriveClient();
    const folder = await drive.files.get({
      fileId: folderId!,
      fields: 'id, name, capabilities, owners',
    });
    console.log(`Folder Access SUCCESS. Name: "${folder.data.name}"`);
    console.log('Owners:', folder.data.owners?.map(o => o.emailAddress));
    console.log('Capabilities:', folder.data.capabilities);

    console.log('\nTesting Google Drive Upload...');
    const buffer = Buffer.from('connection test ' + new Date().toISOString());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const driveRes = await drive.files.create({
      requestBody: {
        name: `connection-test-${Date.now()}.txt`,
        parents: [folderId!],
      },
      media: {
        mimeType: 'text/plain',
        body: stream,
      },
      fields: 'id',
    });
    console.log('Drive Upload SUCCESS. File ID:', driveRes.data.id);
  } catch (err: any) {
    console.error('Drive Error:', err.message);
    if (err.response?.data) {
      console.error('Full Error Detail:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

diagnose();
