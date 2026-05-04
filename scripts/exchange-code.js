
const { google } = require('googleapis');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const code = '4/0AeoWuM_-XBbzNONUTYJRhRrp71aIi7HyPCu28iyf7ITUdfFNNfw4X3sEmjEhT2h66Z_9JA';

async function getRefreshToken() {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ 成功獲取 Tokens!');
    console.log('---------------------------');
    console.log('GOOGLE_REFRESH_TOKEN:', tokens.refresh_token);
    console.log('---------------------------');
  } catch (err) {
    console.error('獲取 Token 失敗:', err.message);
  }
}

getRefreshToken();
