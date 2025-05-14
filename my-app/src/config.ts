// src/config.ts
interface GoogleConfig {
  API_KEY: string;
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  SPREADSHEET_ID: string;
  DISCOVERY_DOCS: string[];
  SCOPES: string;
  TOKEN_ENDPOINT: string;
  AUTH_ENDPOINT: string;
  REDIRECT_URI: string;
}

interface CacheConfig {
  DATA_CACHE_NAME: string;
}

interface Config {
  google: GoogleConfig;
  cache: CacheConfig;
}

const config: Config = {
  google: {
    API_KEY: "AIzaSyAEOr-6nIoOfiKiN_EbMyeZxuagJWpzCrQ",
    CLIENT_ID:
      "25723638150-gbnd67r57fl8o0vhvqjguedcjnii25aj.apps.googleusercontent.com",
    CLIENT_SECRET:"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",
    SPREADSHEET_ID: "1Tll9R5KtdfZO7-w8Sn2KrZx8PG3_nTSiJpkRYOXl9Sk",
    DISCOVERY_DOCS: [
      "https://sheets.googleapis.com/$discovery/rest?version=v4",
    ],
    SCOPES:
      "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/spreadsheets",
    TOKEN_ENDPOINT: "https://oauth2.googleapis.com/token",
    AUTH_ENDPOINT: "https://accounts.google.com/o/oauth2/v2/auth",
    REDIRECT_URI: window.location.origin
  },
  cache: {
    DATA_CACHE_NAME: "fitness-cache",
  },
};

export default config;