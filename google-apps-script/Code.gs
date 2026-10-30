/**
 * Script da creare all'interno del Google Sheet delle risposte.
 * Pubblicare come app web eseguita dal proprietario e accessibile a chiunque.
 */
const SHEET_NAME = 'Risposte';
// Cambiare questo ID per ogni copia dello script collegata a un evento.
const EVENT_ID = 'halloween-2026';
const HEADERS = [
  'ID risposta', 'Data e ora (UTC)', 'ID evento', 'Evento',
  'Gradimento generale', 'Organizzazione', 'Attività',
  'Parteciperebbe ancora', 'Cosa è piaciuto', 'Cosa migliorare'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    if (data.website) return reply_('IGNORED'); // campo anti-spam
    if (!isValid_(data)) return reply_('INVALID');
    if (data.eventId !== EVENT_ID) return reply_('WRONG_EVENT');

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

    // L'ID evita doppioni se lo stesso invio viene ripetuto.
    if (sheet.getLastRow() > 1) {
      const found = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
        .createTextFinder(data.id).matchEntireCell(true).findNext();
      if (found) return reply_('DUPLICATE');
    }

    sheet.appendRow([
      data.id,
      data.submittedAt,
      safeText_(data.eventId),
      safeText_(data.eventName),
      Number(data.overall),
      Number(data.organization),
      Number(data.activities),
      safeText_(data.returnIntent),
      safeText_(data.liked || ''),
      safeText_(data.improve || '')
    ]);
    return reply_('OK');
  } catch (error) {
    console.error(error);
    return reply_('ERROR');
  } finally {
    lock.releaseLock();
  }
}

function isValid_(data) {
  const scoreIsValid = (value) => Number.isInteger(value) && value >= 1 && value <= 5;
  return typeof data.id === 'string' && /^[0-9a-f-]{36}$/i.test(data.id) &&
    typeof data.submittedAt === 'string' && !Number.isNaN(Date.parse(data.submittedAt)) &&
    typeof data.eventId === 'string' && data.eventId.length <= 80 &&
    typeof data.eventName === 'string' && data.eventName.length <= 160 &&
    scoreIsValid(data.overall) && scoreIsValid(data.organization) && scoreIsValid(data.activities) &&
    ['Sì', 'Forse', 'No'].includes(data.returnIntent) &&
    typeof data.liked === 'string' && data.liked.length <= 1000 &&
    typeof data.improve === 'string' && data.improve.length <= 1000;
}

function safeText_(value) {
  // Impedisce che i commenti vengano interpretati come formule nel foglio.
  return /^[=+@-]/.test(value.trimStart()) ? "'" + value : value;
}

function reply_(message) {
  return ContentService.createTextOutput(message);
}
