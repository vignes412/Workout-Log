/* eslint-disable @typescript-eslint/no-explicit-any */
import {  sheets_v4 } from 'googleapis';
import type { WorkoutLogEntry } from '../types/Workout_Log';
import type { BodyWeightEntry } from '../types/Body_Weight';
import type { Exercise } from '../types/Exercises';
import type { WorkoutTemplate } from '../types/Workout_Templates';
import type { WorkoutSession } from '../types/Workout_Sessions';
import { googleConfig } from '@/config/google.config';

const SPREADSHEET_ID = googleConfig.sheets.spreadsheetId; // <<< --- ACTION REQUIRED: Replace with your Spreadsheet ID

async function getSheetsService(): Promise<sheets_v4.Sheets> {
  // ACTION REQUIRED: Implement Google API authentication (OAuth 2.0 or Service Account)
  // Example (conceptual - adapt to your auth flow):
  // const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  // auth.setCredentials({ refresh_token: USER_REFRESH_TOKEN });
  // await auth.getAccessToken(); // Ensure token is valid
  // return google.sheets({ version: 'v4', auth });

  console.error(
    'getSheetsService is not implemented. ' +
    'You must configure Google API authentication (OAuth 2.0 or Service Account) ' +
    'and provide the SPREADSHEET_ID to use these spreadsheet functions.'
  );
  throw new Error('Google Sheets API client not configured.');
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
  | 'Workout_Templates'
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
      requestBody: {
        values: values,
      },
    });
    return { success: true, rowId: response.data.updates?.updatedRange };
  } catch (err) {
    const error = err as Error;
    console.error(`Error creating row in sheet "${sheetName}":`, error);
    const errorMessage = (error as any).response?.data?.error?.message || error.message || 'Failed to create spreadsheet row.';
    return { success: false, error: errorMessage };
  }
}

export async function readSpreadsheetData<T extends GenericSheetRowData = GenericSheetRowData>(
  sheetName: KnownSheetName | string,
  _query?: unknown // Query parameter not used in this basic implementation
): Promise<{ success: boolean; data?: T[]; error?: string }> {

  try {
    const sheets = await getSheetsService();
    const range = sheetName;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    const rows = response.data.values;
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
    const error = err as Error;
    console.error(`Error reading sheet "${sheetName}":`, error);
    const errorMessage = (error as any).response?.data?.error?.message || error.message || 'Failed to read spreadsheet data.';
    return { success: false, error: errorMessage };
  }
}

export async function updateSpreadsheetRow<T extends GenericSheetRowData = GenericSheetRowData>(
  sheetName: KnownSheetName | string,
  identifier: RowIdentifier,
  newData: Partial<T>
): Promise<{ success: boolean; error?: string }> {

  try {
    const sheets = await getSheetsService(); // Initialize sheets service
    // Full implementation is complex and depends on how you identify rows.
    // 1. Find the row: If identifier is a number, it's a 1-based row index.
    //    If it's an object, you'll need to read the sheet, find the matching row, and get its 0-based index.
    // 2. Construct the range string for the update (e.g., 'SheetName!A5:C5').
    // 3. Prepare the values array in the correct column order.

    console.error(
      `updateSpreadsheetRow for sheet "${sheetName}" (identifier: ${JSON.stringify(identifier)}) ` +
      `is not fully implemented. You need to determine the exact row and range to update. ` +
      `Data to update:`, newData, `Sheets service initialized:`, !!sheets
    );
    // Placeholder: return error until implemented
    return {
      success: false,
      error: 'updateSpreadsheetRow is not fully implemented. Check console for details.'
    };

    // Conceptual: After finding rowIndex (0-based) and preparing orderedValues:
    // const rangeToUpdate = `${sheetName}!A${rowIndex + 1}`;
    // const response = await sheets.spreadsheets.values.update({
    //   spreadsheetId: SPREADSHEET_ID,
    //   range: rangeToUpdate, // This should be specific, e.g., 'Sheet1!A5' or 'Sheet1!A5:C5'
    //   valueInputOption: 'USER_ENTERED',
    //   requestBody: {
    //     values: [orderedValues], // values should be an array of arrays
    //   },
    // });
    // return { success: true };

  } catch (err) {
    const error = err as Error;
    console.error(`Error updating row in sheet "${sheetName}":`, error);
    const errorMessage = (error as any).response?.data?.error?.message || error.message || 'Failed to update spreadsheet row.';
    return { success: false, error: errorMessage };
  }
}

async function getSheetIdByTitle(
  sheetsService: sheets_v4.Sheets,
  spreadsheetId: string,
  title: string
): Promise<number | undefined> {
  try {
    const response = await sheetsService.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: 'sheets(properties(sheetId,title))',
    });
    const sheet = response.data.sheets?.find(s => s.properties?.title === title);
    return sheet?.properties?.sheetId;
  } catch (err) {
    const error = err as Error;
    console.error(`Error fetching sheetId for title "${title}":`, error);
    return undefined;
  }
}

export async function deleteSpreadsheetRow(
  sheetName: KnownSheetName | string,
  identifier: RowIdentifier
): Promise<{ success: boolean; error?: string }> {

  try {
    const sheets = await getSheetsService();
    // Full implementation is complex.
    // 1. Find the 0-based row index to delete based on 'identifier'.
    // 2. Get the numeric sheetId for the given sheetName.

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
    // Placeholder: return error until implemented
    return {
      success: false,
      error: 'deleteSpreadsheetRow is not fully implemented. Check console for details.'
    };

    // Conceptual: After finding rowIndexToDelete (0-based):
    // const requests: sheets_v4.Schema$Request[] = [
    //   {
    //     deleteDimension: {
    //       range: {
    //         sheetId: currentSheetId,
    //         dimension: 'ROWS',
    //         startIndex: rowIndexToDelete, // 0-indexed
    //         endIndex: rowIndexToDelete + 1, // Deletes one row
    //       },
    //     },
    //   },
    // ];
    // await sheets.spreadsheets.batchUpdate({
    //   spreadsheetId: SPREADSHEET_ID,
    //   requestBody: {
    //     requests: requests,
    //   },
    // });
    // return { success: true };

  } catch (err) {
    const error = err as Error;
    console.error(`Error deleting row in sheet "${sheetName}":`, error);
    const errorMessage = (error as any).response?.data?.error?.message || error.message || 'Failed to delete spreadsheet row.';
    return { success: false, error: errorMessage };
  }
}

console.log('Spreadsheet API module (Google Sheets version) loaded. Ensure SPREADSHEET_ID and getSheetsService are configured.');