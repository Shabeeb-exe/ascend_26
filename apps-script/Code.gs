/**
 * ASCEND '26 — registration endpoint (Google Apps Script), matched to the existing sheet layout.
 *
 * Columns A–N are exactly your current sheet; O–S are new and are added to the header row automatically.
 *
 * Setup: open the Google Sheet > Extensions > Apps Script > replace the old code with this file >
 * Deploy > Manage deployments > pencil icon > Version: "New version" > Deploy.
 * (Execute as: Me, Who has access: Anyone.) The /exec URL stays the same.
 *
 * What it does:
 *  - ONE row per Reference ID: the first POST creates it, the "I have paid" POST updates the same row
 *  - saves Total Fee, Fee Breakdown, Payment Status and UTR (the old script dropped them)
 *  - flags a UTR that was already used by another registration
 *  - never overwrites column R ("Verified by desk") — that one is yours to fill in manually
 *  - neutralises spreadsheet formula injection (text starting with = + - @)
 */
var HEADERS = [
  'Timestamp', 'Reference ID', 'Full Name', 'Email', 'Phone', 'College', 'Program', 'Year',
  'Selected Events', 'Team Members', 'Accommodation', 'Dietary', 'Notes', 'Total Fee',
  'Fee Breakdown', 'Payment Status', 'UTR', 'Verified by desk (type YES)', 'Last Updated'
];
var COL = { REF: 2, STATUS: 16, UTR: 17, VERIFIED: 18 };

function clean_(v, max) {
  var s = String(v == null ? '' : v).slice(0, max || 500);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName('Sheet1') || ss.getSheets()[0];
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (!/^ASC26-[0-9A-Z]{7}$/.test(d.refId || '')) return out_({ result: 'error', message: 'bad ref' });

    var sh = getSheet_();
    var head = sh.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    if (head.join('|') !== HEADERS.join('|')) {
      sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      // YES / NO dropdown for the desk in column R
      sh.getRange(2, COL.VERIFIED, 1000, 1).setDataValidation(
        SpreadsheetApp.newDataValidation().requireValueInList(['YES', 'NO'], true).setAllowInvalid(false).build()
      );
    }

    var last = sh.getLastRow();
    var refs = last > 1 ? sh.getRange(2, COL.REF, last - 1, 1).getValues() : [];
    var utrs = last > 1 ? sh.getRange(2, COL.UTR, last - 1, 1).getValues() : [];

    var rowIdx = -1;
    for (var i = 0; i < refs.length; i++) if (refs[i][0] === d.refId) { rowIdx = i + 2; break; }

    var utr = String(d.utr || '').replace(/\D/g, '').slice(0, 12);
    var status = clean_(d.paymentStatus, 80);
    if (utr) {
      for (var j = 0; j < utrs.length; j++) {
        if (String(utrs[j][0]) === utr && (j + 2) !== rowIdx) { status = 'DUPLICATE UTR — check manually'; break; }
      }
    }

    var now = new Date();
    var values = [
      now, d.refId, clean_(d.name, 120), clean_(d.email, 160), String(d.phone || '').replace(/\D/g, '').slice(0, 12),
      clean_(d.college, 200), clean_(d.program, 60), clean_(d.year, 40), clean_(d.events, 300),
      clean_(d.teamMembers, 400), clean_(d.accommodation, 80), clean_(d.dietary, 60), clean_(d.notes, 500),
      Number(d.totalFee) || 0, clean_(d.feeBreakdown, 500), status, utr
    ];

    if (rowIdx === -1) {
      sh.appendRow(values.concat(['', now]));
      var r = sh.getLastRow();
      sh.getRange(r, 5).setNumberFormat('@').setValue(values[4]); // keep phone as text
      sh.getRange(r, 17).setNumberFormat('@').setValue(utr);      // keep UTR as text (no 4.1E+11)
    } else {
      var firstSeen = sh.getRange(rowIdx, 1).getValue() || now;
      values[0] = firstSeen;
      var alreadyVerified = String(sh.getRange(rowIdx, COL.VERIFIED).getValue()).toUpperCase() === 'YES';
      if (alreadyVerified) values[COL.STATUS - 1] = sh.getRange(rowIdx, COL.STATUS).getValue();
      sh.getRange(rowIdx, 1, 1, values.length).setValues([values]);
      sh.getRange(rowIdx, 5).setNumberFormat('@').setValue(values[4]);
      sh.getRange(rowIdx, 17).setNumberFormat('@').setValue(utr);
      sh.getRange(rowIdx, HEADERS.length).setValue(now);
    }
    return out_({ result: 'success' });
  } catch (err) {
    return out_({ result: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Status lookup used by the website ("Check status / get my pass").
 * GET ...?action=status&identifier=ASC26-XXXXXXX&phone=9876543210
 * identifier may be a Reference ID or 12-digit UPI Transaction ID / UTR.
 * The identifier and registered mobile number must both match.
 *   Verified column = YES  -> "confirmed"   (the delegate can now see/print the confirmed pass)
 *   Verified column = NO   -> "rejected"    (payment could not be verified, contact desk)
 *   blank + payment claimed -> "pending"; blank + not paid -> "unpaid"
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'status') {
    return out_(status_(String(p.identifier || '').toUpperCase().trim(), String(p.phone || '').replace(/\D/g, '').slice(-10)));
  }
  return out_({ result: 'ASCEND 26 endpoint is running' });
}

function status_(identifier, phone) {
  var isReferenceId = /^ASC26-[0-9A-Z]{7}$/.test(identifier);
  var isUtr = /^\d{12}$/.test(identifier);
  if ((!isReferenceId && !isUtr) || phone.length !== 10) return { found: false };
  var sh = getSheet_();
  var last = sh.getLastRow();
  if (last < 2) return { found: false };
  var rows = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  for (var i = rows.length - 1; i >= 0; i--) {
    var r = rows[i];
    var matchesIdentifier = isReferenceId
      ? r[1] === identifier
      : String(r[16]).replace(/\D/g, '') === identifier;
    if (matchesIdentifier && String(r[4]).replace(/\D/g, '').slice(-10) === phone) {
      var v = String(r[17]).trim().toUpperCase();
      var paid = String(r[15]).indexOf('Paid') === 0 || String(r[15]).indexOf('DUPLICATE') === 0;
      return {
        found: true,
        state: v === 'YES' ? 'confirmed' : v === 'NO' ? 'rejected' : paid ? 'pending' : 'unpaid',
        refId: r[1], name: r[2], college: r[5], program: r[6], year: r[7], events: r[8], team: r[9],
        accommodation: r[10], dietary: r[11], total: r[13], breakdown: r[14]
      };
    }
  }
  return { found: false };
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
