/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GOOGLE_CLIENT_SECRET: string;
  readonly VITE_GOOGLE_REDIRECT_URI: string;
  readonly VITE_GOOGLE_SHEET_ID: string;
  readonly VITE_GOOGLE_DRIVE_FOLDER_ID: string;
  readonly VITE_APP_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
