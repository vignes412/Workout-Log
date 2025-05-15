/* eslint-disable @typescript-eslint/no-explicit-any */
import { gapi } from 'gapi-script'; // Use gapi-script for browser environment
import type { WorkoutLogEntry } from '../types/Workout_Log';
import type { BodyWeightEntry } from '../types/Body_Weight';
import type { Exercise } from '../types/Exercises';
import type { WorkoutTemplate } from '../types/Workout_Templates';
import type { WorkoutSession } from '../types/Workout_Sessions';
import { googleConfig } from '@/config/google.config';

const SPREADSHEET_ID = googleConfig.sheets.spreadsheetId;

async function getSheetsService(): Promise<any> { // Return type any for gapi.client.sheets
  if (!gapi || !gapi.auth2 || !gapi.auth2.getAuthInstance()) {
    console.error('Google Auth (gapi.auth2) not initialized. Ensure AuthProvider has initialized gapi.');
    throw new Error('Google Auth (gapi.auth2) not initialized.');
  }

  const authInstance = gapi.auth2.getAuthInstance();
  if (!authInstance.isSignedIn.get()) {
    console.error('User is not signed in via Google Auth.');
    throw new Error('User not authenticated for Google Sheets API.');
  }

  // Ensure gapi.client is loaded. AuthContext initializes client:auth2.
  // Loading 'client' ensures gapi.client object is ready for other APIs.
  if (!gapi.client || typeof gapi.client.load !== 'function') {
    await new Promise<void>((resolve, reject) => {
      gapi.load('client', (err?: any) => { 
        if (err || !gapi.client) {
          console.error('Failed to load gapi.client:', err);
          reject(err || new Error('Failed to load gapi.client'));
        } else {
          resolve();
        }
      });
    });
  }

  // Load the Sheets API if not already loaded (gapi.client.sheets will be undefined initially)
  if (!gapi.client.sheets) {
    try {
      await new Promise<void>((resolve, reject) => {
        gapi.client.load('sheets', 'v4')
          .then(
            () => { // onFulfilled
              if (gapi.client.sheets) {
                resolve();
              } else {
                console.error('gapi.client.sheets not available after load call.');
                reject(new Error('gapi.client.sheets not available after load call.'));
              }
            },
            (err: any) => { // onRejected
              console.error('Error in gapi.client.load(\'sheets\', \'v4\'):', err);
              reject(err);
            }
          );
      });
    } catch (error) {
      console.error('Error loading Google Sheets API (wrapped promise):', error);
      throw new Error('Failed to load Google Sheets API.');
    }
  }
  
  if (!gapi.client.sheets) { // Final check
      console.error('gapi.client.sheets is critically unavailable after loading attempts.');
      throw new Error('Google Sheets API (gapi.client.sheets) is critically unavailable.');
  }

  return gapi.client.sheets;
}

export type SheetSpecificData =
  | WorkoutLogEntry
  | BodyWeightEntry
  | Exercise
  | WorkoutTemplate
  | WorkoutSession;

export type GenericSheetRowData = Record<string, unknown>;

export type RowIdentifier = number | Partial<SheetSpecificData> | GenericSheetRowData;

export type KnownSheetName =
  | 'Workout_Log'
  | 'Body_Weight'
  | 'Exercises'
  | 'WorkoutTemplates'
  | 'Workout_Sessions';

export async function createSpreadsheetRow<T extends GenericSheetRowData = GenericSheetRowData>(
  sheetName: KnownSheetName | string,
  rowData: T
): Promise<{ success: boolean; rowId?: string | null; error?: string }> {
  try {
    const sheets = await getSheetsService();
    const values = [Object.values(rowData)];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      resource: { // gapi uses 'resource' for requestBody
        values: values,
      },
    });
    return { success: true, rowId: response.result.updates?.updatedRange }; // gapi response is in response.result
  } catch (err) {
    const error = err as any;
    console.error(`Error creating row in sheet "${sheetName}":`, error);
    const errorMessage = error.result?.error?.message || error.message || 'Failed to create spreadsheet row.';
    return { success: false, error: errorMessage };
  }
}

export async function readSpreadsheetData<T extends GenericSheetRowData = GenericSheetRowData>(
  sheetName: KnownSheetName | string
): Promise<{ success: boolean; data?: T[]; error?: string }> {
  try {
    const sheets = await getSheetsService();
    const range = sheetName;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    const rows = response.result.values; // gapi response is in response.result
    if (rows && rows.length > 0) {
      const headers = rows[0].map(String);
      const data = rows.slice(1).map((rowArray: unknown[]) => {
        const rowObject: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          rowObject[header] = rowArray[index];
        });
        return rowObject as T;
      });
      return { success: true, data };
    } else {
      return { success: true, data: [] };
    }
  } catch (err) {
    const error = err as any;
    console.error(`Error reading sheet "${sheetName}":`, error);
    const errorMessage = error.result?.error?.message || error.message || 'Failed to read spreadsheet data.';
    return { success: false, error: errorMessage };
  }
}

export async function updateSpreadsheetRow<T extends GenericSheetRowData = GenericSheetRowData>(
  sheetName: KnownSheetName | string,
  identifier: RowIdentifier,
  newData: Partial<T>
): Promise<{ success: boolean; error?: string }> {
  try {
    const sheets = await getSheetsService();
    console.error(
      `updateSpreadsheetRow for sheet "${sheetName}" (identifier: ${JSON.stringify(identifier)}) ` +
      `is not fully implemented. You need to determine the exact row and range to update. ` +
      `Data to update:`, newData, `Sheets service initialized:`, !!sheets
    );
    return {
      success: false,
      error: 'updateSpreadsheetRow is not fully implemented. Check console for details.'
    };
    // Conceptual gapi adaptation:
    // const rowIndex = 0; /* Determine 0-based row index */
    // const orderedValues = Object.values(newData); /* This needs to map to sheet columns */
    // const rangeToUpdate = `${sheetName}!A${rowIndex + 1}`;
    // const response = await sheets.spreadsheets.values.update({
    //   spreadsheetId: SPREADSHEET_ID,
    //   range: rangeToUpdate,
    //   valueInputOption: 'USER_ENTERED',
    //   resource: {
    //     values: [orderedValues],
    //   },
    // });
    // return { success: true };

  } catch (err) {
    const error = err as any;
    console.error(`Error updating row in sheet "${sheetName}":`, error);
    const errorMessage = error.result?.error?.message || error.message || 'Failed to update spreadsheet row.';
    return { success: false, error: errorMessage };
  }
}

async function getSheetIdByTitle(
  sheetsService: any, 
  spreadsheetId: string,
  title: string
): Promise<number | undefined> {
  try {
    const response = await sheetsService.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: 'sheets(properties(sheetId,title))',
    });
    const sheet = response.result.sheets?.find((s: any) => s.properties?.title === title);
    return sheet?.properties?.sheetId;
  } catch (err) {
    const error = err as any;
    console.error(`Error fetching sheetId for title "${title}":`, error);
    const errorMessage = error.result?.error?.message || error.message || `Failed to fetch sheetId for title "${title}".`;
    throw new Error(errorMessage); // Re-throw to be caught by calling function
  }
}

export async function deleteSpreadsheetRow(
  sheetName: KnownSheetName | string,
  identifier: RowIdentifier
): Promise<{ success: boolean; error?: string }> {
  try {
    const sheets = await getSheetsService();
    const currentSheetId = await getSheetIdByTitle(sheets, SPREADSHEET_ID, sheetName);

    if (currentSheetId === undefined) {
      return {
        success: false,
        error: `Could not find sheetId for sheet name "${sheetName}". Deletion failed.`
      };
    }
    console.error(
      `deleteSpreadsheetRow for sheet "${sheetName}" (identifier: ${JSON.stringify(identifier)}) ` +
      `is not fully implemented. You need to determine the exact 0-based rowIndex to delete. ` +
      `SheetId found: ${currentSheetId}`
    );
    return {
      success: false,
      error: 'deleteSpreadsheetRow is not fully implemented. Check console for details.'
    };
    // Conceptual gapi adaptation:
    // const rowIndexToDelete = 0; /* Determine 0-based row index to delete */
    // const requests = [
    //   {
    //     deleteDimension: {
    //       range: {
    //         sheetId: currentSheetId,
    //         dimension: 'ROWS',
    //         startIndex: rowIndexToDelete,
    //         endIndex: rowIndexToDelete + 1,
    //       },
    //     },
    //   },
    // ];
    // await sheets.spreadsheets.batchUpdate({
    //   spreadsheetId: SPREADSHEET_ID,
    //   resource: { 
    //     requests: requests,
    //   },
    // });
    // return { success: true };

  } catch (err) {
    const error = err as any;
    console.error(`Error deleting row in sheet "${sheetName}":`, error);
    const errorMessage = error.result?.error?.message || error.message || 'Failed to delete spreadsheet row.';
    return { success: false, error: errorMessage };
  }
}

console.log('Spreadsheet API module (Google Sheets GAPI client version) loaded.');