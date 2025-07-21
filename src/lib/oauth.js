import { google } from 'googleapis';

export async function getUserOAuthClient(tokens) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: new Date(tokens.expiry_date).getTime(),
  });

  const now = Date.now();
  if (tokens.expiry_date && new Date(tokens.expiry_date).getTime() < now + 60000) {
    const { credentials } = await oauth2.refreshAccessToken();
    oauth2.setCredentials(credentials);
  }

  return oauth2;
}

