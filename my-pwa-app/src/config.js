// src/config.js
const config = {
  google: {
    API_KEY: "AIzaSyAEOr-6nIoOfiKiN_EbMyeZxuagJWpzCrQ",
    CLIENT_ID:
      "25723638150-gbnd67r57fl8o0vhvqjguedcjnii25aj.apps.googleusercontent.com",
    SPREADSHEET_ID: "1Tll9R5KtdfZO7-w8Sn2KrZx8PG3_nTSiJpkRYOXl9Sk",
    DISCOVERY_DOCS: [
      "https://sheets.googleapis.com/$discovery/rest?version=v4",
    ],
    SCOPES:
      "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/spreadsheets",
  },
  cache: {
    DATA_CACHE_NAME: "fitness-cache",
  },
};

export default config;
