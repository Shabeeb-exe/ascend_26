/**
 * ASCEND '26 — registration endpoint (Google Apps Script).
 *
 * Setup: open the Google Sheet > Extensions > Apps Script > paste this file >
 * Deploy > Manage deployments > edit the existing Web app > Version: "New version"
 * (Execute as: Me, Who has access: Anyone). The /exec URL stays the same.
 *
 * What it does vs. a plain "append row" script:
 *  - one row per Ref ID (resubmits / "I have paid" update the same row, no duplicates)
 *  - neutralises spreadsheet formula injection (cells starting with = + - @)
 *  - validates the Ref ID format and field lengths
 *  - serialises writes with a lock so simultaneous registrations can't clash
 */
const SHEET_NAME = 'Registrations';
const HEADERS = [
  'Ref ID', 'First Submitted', 'Last Updated', 'Name', 'Email', 'Phone', 'College', 'Program', 'Year',
  'Events', 'Fee Breakdown', 'Total Fee (INR)', 'Team Members', 'Accommodation', 'Dietary', 'Notes',
  'Payment Status', 'UTR', 'Verified by desk (fill manually)'
];

function clean_(v, max) {
  var s = String(v == null ? '' : v).slice(0, max || 500);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (!/^ASC26-[0-9A-Z]{7}$/.test(d.refId || '')) return out_('bad ref');

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS);
      sh.setFrozenRows(1);
    }

    var now = new Date();
    var row = [
      d.refId, now, now, clean_(d.name, 120), clean_(d.email, 160), clean_(d.phone, 15), clean_(d.college, 200),
      clean_(d.program, 60), clean_(d.year, 40), clean_(d.events, 300), clean_(d.feeBreakdown, 500),
      Number(d.totalFee) || 0, clean_(d.teamMembers, 400), clean_(d.accommodation, 80), clean_(d.dietary, 60),
      clean_(d.notes, 500), clean_(d.paymentStatus, 80), clean_(d.utr, 20)
    ];

    var found = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1)
      .createTextFinder(d.refId).matchEntireCell(true).findNext();

    if (found) {
      var r = found.getRow();
      var first = sh.getRange(r, 2).getValue();
      row[1] = first || now;
      sh.getRange(r, 1, 1, row.length).setValues([row]); // keeps the manual "Verified" column untouched
    } else {
      sh.appendRow(row);
    }
    return out_('ok');
  } catch (err) {
    return out_('error');
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return out_('ASCEND 26 endpoint is running'); }

function out_(msg) {
  return ContentService.createTextOutput(msg).setMimeType(ContentService.MimeType.TEXT);
}
