
import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function listFolders() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

  const drive = google.drive({ version: 'v3', auth });

  try {
    console.log('Listing folders in your Drive...');
    const res = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id, name)',
      pageSize: 20
    });

    const folders = res.data.files;
    if (folders && folders.length > 0) {
      console.table(folders);
    } else {
      console.log('No folders found.');
    }
  } catch (err) {
    console.error('Error listing folders:', err.message);
  }
}

listFolders();
