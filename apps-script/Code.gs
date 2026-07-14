/**
 * KING LONG – odbiór odpowiedzi z ankiety rekrutacyjnej.
 *
 * Ten kod wklejasz w Google Apps Script (Rozszerzenia -> Apps Script)
 * w arkuszu Google Sheets, do którego mają trafiać zgłoszenia.
 * Następnie: Wdróż -> Nowe wdrożenie -> Aplikacja internetowa
 *   - Wykonaj jako: Ja
 *   - Dostęp: Wszyscy (Anyone)
 * Skopiuj wygenerowany URL ".../exec" i wklej go do assets/config.js.
 *
 * Przesłane CV są zapisywane w folderze Google Drive (tworzonym automatycznie),
 * a link do pliku trafia do kolumny "CV" w arkuszu. Pliki pozostają prywatne
 * (dostępne dla właściciela konta) – nie są udostępniane publicznie.
 */

var SHEET_NAME = 'Odpowiedzi';
var CV_FOLDER_NAME = 'Rekrutacja KING LONG - CV';

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    var payload = JSON.parse(e.postData.contents);
    var record = payload.record || {};

    // Zapis CV do Drive (jeśli przesłano) i wstawienie linku do rekordu.
    if (payload.cv && payload.cv.data) {
      try {
        var folder = getCvFolder_();
        var bytes = Utilities.base64Decode(payload.cv.data);
        var safeName = buildFileName_(record, payload.cv.filename);
        var blob = Utilities.newBlob(bytes, payload.cv.mimeType || 'application/octet-stream', safeName);
        var file = folder.createFile(blob);
        record['CV'] = file.getUrl();
      } catch (cvErr) {
        record['CV'] = 'BŁĄD ZAPISU CV: ' + cvErr;
      }
    }

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

/** Znajduje (lub tworzy) folder na CV w Google Drive. */
function getCvFolder_() {
  var it = DriveApp.getFoldersByName(CV_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CV_FOLDER_NAME);
}

/** Buduje czytelną nazwę pliku: "Imię Nazwisko - oryginalna_nazwa". */
function buildFileName_(record, original) {
  var name = (record['Imię i nazwisko'] || 'kandydat').toString()
    .replace(/[\\/:*?"<>|]/g, ' ').trim();
  var orig = (original || 'cv').toString().replace(/[\\/:*?"<>|]/g, ' ').trim();
  return name + ' - ' + orig;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
