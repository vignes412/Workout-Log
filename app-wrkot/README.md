# Personal Thing Tracker

A web application for tracking personal items using React, TypeScript, and Google Sheets as a backend.

## Features

### Progressive Web App (PWA)

This application is built as a Progressive Web App with the following capabilities:

- **Offline Support**: Continue using the app even when offline
- **Installable**: Add to your home screen on mobile devices or desktop
- **Background Sync**: Data is saved locally when offline and synced when connection returns
- **Push Notifications**: Receive updates and reminders (requires user permission)
- **App-like Experience**: Runs in a standalone window without browser UI

- Google Authentication (OAuth 2.0)
- Store and manage your personal items
- Data stored in Google Sheets
- Responsive UI with modern design

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Google Cloud Platform account with OAuth 2.0 credentials

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Google API credentials

```bash
# Google OAuth 2.0 Credentials
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_GOOGLE_CLIENT_SECRET=your-client-secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173

# Google Sheets API
VITE_GOOGLE_SHEET_ID=your-spreadsheet-id

# Google Drive API
VITE_GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

4. Start the development server:

```bash
npm run dev
```

## Google Authentication Flow

This application uses the OAuth 2.0 Authorization Code flow:

1. User clicks the "Sign in with Google" button
2. User is redirected to Google's consent screen
3. After granting permission, Google redirects back with an authorization code
4. The app exchanges this code for access and refresh tokens
5. The app uses these tokens to make API calls to Google Sheets and Drive

## Setting Up Google API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Sheets API and Google Drive API
4. Configure the OAuth consent screen
5. Create OAuth 2.0 credentials (Web application type)
6. Add your app's URL to the authorized redirect URIs
7. Copy the client ID and client secret to your .env.local file
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
