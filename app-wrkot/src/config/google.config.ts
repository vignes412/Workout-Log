/**
 * Google Authentication Configuration
 * Replace placeholder values with your actual Google Cloud credentials
 */
export const googleConfig = {
  // OAuth 2.0 credentials from Google Cloud Console
  auth: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '25723638150-fda1h3p3e1bm8s65m90a03vkvpscfnb9.apps.googleusercontent.com',
    clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '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',
    redirectUri:  "https://vignes412.github.io/PA/",
  },
  // Google Sheets API configuration
  sheets: {
    spreadsheetId: import.meta.env.VITE_GOOGLE_SHEET_ID || '1Tll9R5KtdfZO7-w8Sn2KrZx8PG3_nTSiJpkRYOXl9Sk',
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ]
  },  // Google Drive API configuration
  drive: {
    folderId: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '18oce2L5-EfDo6rY1-zzAdjTXHfZnjtnx',
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata'
    ]
  }
};
