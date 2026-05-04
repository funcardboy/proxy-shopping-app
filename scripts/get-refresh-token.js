
const { google } = require('googleapis');
const readline = require('readline');

// 請填寫你的 OAuth2 Credentials (從 Google Cloud Console 下載)
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground'; // 或者 http://localhost:3000/api/auth/callback

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets'
];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // 強制獲取 refresh_token
  scope: SCOPES,
  prompt: 'consent'
});

console.log('1. 請訪問此 URL 進行授權:');
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\n2. 授權後，請將網址列中的 "code" 參數粘貼到這裡: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ 成功獲取 Tokens!');
    console.log('---------------------------');
    console.log('GOOGLE_REFRESH_TOKEN:', tokens.refresh_token);
    console.log('---------------------------');
    console.log('請將此 Token 填入你的 .env.local 或 Vercel 環境變數中。');
  } catch (err) {
    console.error('獲取 Token 失敗:', err.message);
  }
  rl.close();
});
