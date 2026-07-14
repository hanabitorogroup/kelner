/**
 * KING LONG – odbiór odpowiedzi z ankiety rekrutacyjnej.
 *
 * Ten kod wklejasz w Google Apps Script (Rozszerzenia -> Apps Script)
 * w arkuszu Google Sheets, do którego mają trafiać zgłoszenia.
 * Następnie: Wdróż -> Nowe wdrożenie -> Aplikacja internetowa
 *   - Wykonaj jako: Ja
 *   - Dostęp: Wszyscy (Anyone)
 * Skopiuj wygenerowany URL ".../exec" i wklej go do assets/config.js.
 */

var SHEET_NAME = 'Odpowiedzi';

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    var payload = JSON.parse(e.postData.contents);
    var record = payload.record || {};
    var keys = Object.keys(record);

    // Nagłówki – tworzone przy pierwszym zgłoszeniu na podstawie kluczy rekordu.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(keys);
      sheet.getRange(1, 1, 1, keys.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Dopasowanie wartości do istniejących kolumn (odporne na zmianę kolejności).
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headers.map(function (h) {
      return record[h] !== undefined ? record[h] : '';
    });
    sheet.appendRow(row);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput(
    'KING LONG – endpoint rekrutacyjny dziala. Uzyj metody POST.'
  );
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
