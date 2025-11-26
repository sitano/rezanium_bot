import path from 'node:path';
import process from 'node:process';
import {authenticate} from '@google-cloud/local-auth';
import {google} from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const CREDENTIALS_PATH = path.join(process.cwd(), '.creds.json');

const DOC_ID = process.env.DOC_ID;
const COFE_PAGE = "'Кофе абонементы'";
const TG_PAGE = "'Telegram профили'";
const TG_ROWS = 100; // telegram profiles rows to scan 1:TG_ROWS
const TG_IX_COL = "C"; // column index column
const TG_NK_COL = "E"; // telegram nickname column
const TG_COFE_MONTH_ROW_INDEX = "G1"; // current month row index cell
const TG_COFE_MONTH_DATE_INDEX = "H1"; // current month date index cell

// TODO: move to service account for server use?
// https://github.com/googleapis/google-api-nodejs-client/
const auth = await authenticate({
  scopes: SCOPES,
  keyfilePath: CREDENTIALS_PATH,
});

google.options({auth: auth});

const client = google.sheets({version: 'v4', auth});

var monthRow = 0;
var monthDate = '';
var tg2col = {};

async function loadMaps(month_row = true, mapping = true) {
  if (month_row) {
    console.log('Loading month row...');

    const month_row_req = await client.spreadsheets.values.get({
      spreadsheetId: DOC_ID,
      range: `${TG_PAGE}!${TG_COFE_MONTH_ROW_INDEX}:${TG_COFE_MONTH_DATE_INDEX}`,
    });

    monthRow = Number(month_row_req.data.values[0][0]);
    monthDate = String(month_row_req.data.values[0][month_row_req.data.values[0].length - 1]);

    console.log(`Month row: ${monthRow}, date: ${monthDate}`);
  }

  if (mapping) {
    console.log('Loading telegram to names mapping...');

    const col_ix_req = await client.spreadsheets.values.get({
      spreadsheetId: DOC_ID,
      range: `${TG_PAGE}!${TG_IX_COL}1:${TG_IX_COL}${TG_ROWS}`,
    });

    const nk_req = await client.spreadsheets.values.get({
      spreadsheetId: DOC_ID,
      range: `${TG_PAGE}!${TG_NK_COL}1:${TG_NK_COL}${TG_ROWS}`,
    });

    col_ix_req.data.values.forEach((row, index) => {
      if (index >= nk_req.data.values.length) {
        return;
      }

      const col = row[0];
      const tg = nk_req.data.values[index][0];

      if (tg && col) {
        tg2col[tg] = col;
      }
    });
  }

  return tg2col;
}

async function getDebt(tg, retry = 1) {
  const col = tg2col[tg];

  if (!col) {
    if (retry > 0) {
      if (retry == 1) {
        console.log(`Telegram nick ${tg} not found in mapping, reloading mapping and retrying...`);
        const newMap = await loadMaps(true, true);
        console.log(`New mapping loaded: ${JSON.stringify(newMap)}`);
      }

      return getDebt(tg, retry - 1);
    }

    throw new Error(`tg account ${tg} is not registered`);
  }

  const range = `${COFE_PAGE}!${col}${monthRow}:${col}${monthRow}`;
  const result = await client.spreadsheets.values.get({
    spreadsheetId: DOC_ID,
    range: range,
  });

  const rows = result.data.values;

  if (!rows || rows.length === 0) {
    if (retry > 0) {
      console.log(`Debt cell ${range} is empty, reloading current date row and retrying...`);
      await loadMaps(true, false);

      return getDebt(tg, retry - 1);
    }

    const s = JSON.stringify(result, null, 2);
    throw new Error(`debt cell ${range} is empty: ${s}`);
  }

  const val = Number(rows[0][0]);

  return val;
}

function getMonthDate() {
  return monthDate;
}

function getMonthRow() {
  return monthRow;
}

export default {
  getDebt,
  getMonthDate,
  getMonthRow,
  loadMaps,
};