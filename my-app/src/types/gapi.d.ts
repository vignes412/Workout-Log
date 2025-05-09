// TypeScript declarations for Google API client
interface GapiWindow extends Window {
  gapi: {
    load: (apiName: string, callback: () => void) => void;
    client: {
      init: (config: any) => Promise<any>;
      sheets: {
        spreadsheets: {
          values: {
            get: (params: any) => Promise<any>;
            update: (params: any) => Promise<any>;
            append: (params: any) => Promise<any>;
            clear: (params: any) => Promise<any>;
          };
        };
      };
      [key: string]: any;
    };
    auth: {
      getToken: () => { access_token: string };
      authorize: (params: any) => Promise<any>;
      signOut: () => void;
      [key: string]: any;
    };
    [key: string]: any;
  };
  refreshAccessToken?: () => Promise<void>;
}

// Make this available globally
declare global {
  interface Window {
    gapi: {
      load: (apiName: string, callback: () => void) => void;
      client: {
        init: (config: any) => Promise<any>;
        sheets: {
          spreadsheets: {
            values: {
              get: (params: any) => Promise<any>;
              update: (params: any) => Promise<any>;
              append: (params: any) => Promise<any>;
              clear: (params: any) => Promise<any>;
            };
          };
        };
        [key: string]: any;
      };
      auth: {
        getToken: () => { access_token: string };
        authorize: (params: any) => Promise<any>;
        signOut: () => void;
        [key: string]: any;
      };
      [key: string]: any;
    };
    refreshAccessToken?: () => Promise<void>;
  }
}

export {};