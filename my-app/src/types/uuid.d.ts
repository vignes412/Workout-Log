declare module 'uuid' {
  export const v1: () => string;
  export const v3: () => string;
  export const v4: () => string;
  export const v5: () => string;
  export const NIL: string;
  export const version: () => string;
  export const validate: (uuid: string) => boolean;
  export const stringify: (arr: Uint8Array) => string;
  export const parse: (uuid: string) => Uint8Array;
}