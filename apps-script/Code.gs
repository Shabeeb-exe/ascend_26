/**
 * ASCEND '26 — registration backend (Google Apps Script, bound to the registrations sheet).
 *
 * ONE-TIME SETUP (after pasting this file):
 *   1. Select the function  setupAll  in the editor toolbar and click Run. Approve the permission prompts
 *      (it needs permission to send email and to create the "on edit" trigger).
 *   2. Deploy > Manage deployments > pencil icon > Version: "New version" > Deploy.
 *      (Execute as: Me, Who has access: Anyone. The /exec URL stays the same.)
 *
 * WHAT IT DOES
 *   - one row per Reference ID (the first POST creates it, "I have paid" updates the same row)
 *   - saves Total Fee, Fee Breakdown, Payment Status and UTR; flags a UTR already used by someone else
 *   - column R "Verified by desk" is a YES/NO dropdown for the desk. Setting it emails the delegate:
 *       YES -> "Registration confirmed"      NO -> "We could not verify your payment"
 *     Column T records what was sent (an email is never sent twice for the same decision).
 *   - column U "Checked in (desk)" is for the event day
 *   - a "Summary" tab with live counts and money (rebuild any time with setupSummary)
 *   - the website's "Check status" box reads this sheet (Reference ID + mobile number must both match)
 *   - formula-injection protection, locking, Reference ID validation
 */

// ---------- SETTINGS (edit here) ----------
var EVENT_DATES_TEXT = 'January 18 & 19, 2027 (tentative — final dates will be confirmed)';
var SITE_URL = 'https://ascend26.vercel.app/#register';
var DESK_WHATSAPP = 'https://wa.me/919188007846';
var VENUE_TEXT = 'DCMS, University of Calicut, Thenhipalam, Malappuram, Kerala – 673635';
var REGISTRATION_OPEN = true;        // false = reject NEW registrations here too (the website also has a switch)
var REGISTRATION_CLOSES_AT = '';     // e.g. '2027-01-10T23:59:00+05:30' ('' = no deadline)
var EVENT_TITLES = [
  'Best Manager', 'Best Management Team', 'Finance Game', 'Marketing Game', 'HR Game',
  'Business Quiz', 'IPL Auction', 'Treasure Hunt', 'Reel Making', 'E Football/PES'
];
// -------------------------------------------

var HEADERS = [
  'Timestamp', 'Reference ID', 'Full Name', 'Email', 'Phone', 'College', 'Program', 'Year',
  'Selected Events', 'Team Members', 'Accommodation', 'Dietary', 'Notes', 'Total Fee',
  'Fee Breakdown', 'Payment Status', 'UTR', 'Verified by desk', 'Last Updated',
  'Confirmation Email', 'Checked in (desk)'
];
var COL = { REF: 2, EMAIL_ADDR: 4, PHONE: 5, STATUS: 16, UTR: 17, VERIFIED: 18, UPDATED: 19, MAIL: 20, CHECKIN: 21 };

function clean_(v, max) {
  var s = String(v == null ? '' : v).slice(0, max || 500);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName('Sheet1') || ss.getSheets()[0];
}

function registrationClosed_() {
  if (!REGISTRATION_OPEN) return true;
  return !!REGISTRATION_CLOSES_AT && new Date().getTime() > new Date(REGISTRATION_CLOSES_AT).getTime();
}

// =============== website -> sheet ===============
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
      applyFormatting_(sh);
    }

    var last = sh.getLastRow();
    var refs = last > 1 ? sh.getRange(2, COL.REF, last - 1, 1).getValues() : [];
    var utrs = last > 1 ? sh.getRange(2, COL.UTR, last - 1, 1).getValues() : [];

    var rowIdx = -1;
    for (var i = 0; i < refs.length; i++) if (refs[i][0] === d.refId) { rowIdx = i + 2; break; }

    // New registrations are refused after the deadline; people already registered can still update/pay.
    if (rowIdx === -1 && registrationClosed_()) return out_({ result: 'closed' });

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
      sh.appendRow(values.concat(['', now, '', '']));      // R verified, S updated, T mail, U check-in
      var r = sh.getLastRow();
      sh.getRange(r, COL.PHONE).setNumberFormat('@').setValue(values[4]);
      sh.getRange(r, 14).setNumberFormat('0');
      sh.getRange(r, COL.UTR).setNumberFormat('@').setValue(utr);
    } else {
      values[0] = sh.getRange(rowIdx, 1).getValue() || now;
      var alreadyVerified = String(sh.getRange(rowIdx, COL.VERIFIED).getValue()).toUpperCase() === 'YES';
      if (alreadyVerified) values[COL.STATUS - 1] = sh.getRange(rowIdx, COL.STATUS).getValue();
      sh.getRange(rowIdx, 1, 1, values.length).setValues([values]);   // never touches R–U
      sh.getRange(rowIdx, COL.PHONE).setNumberFormat('@').setValue(values[4]);
      sh.getRange(rowIdx, 14).setNumberFormat('0');
      sh.getRange(rowIdx, COL.UTR).setNumberFormat('@').setValue(utr);
      sh.getRange(rowIdx, COL.UPDATED).setValue(now);
    }
    return out_({ result: 'success' });
  } catch (err) {
    return out_({ result: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// =============== sheet -> website (status check) ===============
/**
 * GET ...?action=status&ref=ASC26-XXXXXXX&phone=9876543210
 *   Verified = YES -> "confirmed" | NO -> "rejected" | blank + paid -> "pending" | blank + not paid -> "unpaid"
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'status') {
    return out_(status_(String(p.ref || '').toUpperCase().trim(), String(p.phone || '').replace(/\D/g, '').slice(-10)));
  }
  return out_({ result: 'ASCEND 26 endpoint is running' });
}

function status_(ref, phone) {
  if (!/^ASC26-[0-9A-Z]{7}$/.test(ref) || phone.length !== 10) return { found: false };
  var sh = getSheet_();
  var last = sh.getLastRow();
  if (last < 2) return { found: false };
  var rows = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  for (var i = rows.length - 1; i >= 0; i--) {
    var r = rows[i];
    if (r[1] === ref && String(r[4]).replace(/\D/g, '').slice(-10) === phone) {
      var v = String(r[COL.VERIFIED - 1]).trim().toUpperCase();
      var paid = String(r[COL.STATUS - 1]).indexOf('Paid') === 0 || String(r[COL.STATUS - 1]).indexOf('DUPLICATE') === 0;
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

// =============== desk: confirmation emails ===============
/** Installable "on edit" trigger (created by setupAll). Fires when the desk edits the Verified column. */
function onDeskEdit(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  if (sh.getSheetId() !== getSheet_().getSheetId()) return;
  if (COL.VERIFIED < e.range.getColumn() || COL.VERIFIED > e.range.getLastColumn()) return;
  var r1 = Math.max(e.range.getRow(), 2), r2 = e.range.getLastRow();
  for (var r = r1; r <= r2; r++) sendDeskEmail_(sh, r);
}

function esc_(v) {
  return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sendDeskEmail_(sh, r) {
  var row = sh.getRange(r, 1, 1, HEADERS.length).getValues()[0];
  var verdict = String(row[COL.VERIFIED - 1]).trim().toUpperCase();
  if (verdict !== 'YES' && verdict !== 'NO') return;
  var cell = sh.getRange(r, COL.MAIL);
  if (String(row[COL.MAIL - 1]).indexOf('Sent ' + verdict) === 0) return;   // never email twice for the same decision

  var to = String(row[COL.EMAIL_ADDR - 1]).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) { cell.setValue('NO VALID EMAIL — contact manually'); return; }
  if (MailApp.getRemainingDailyQuota() < 1) { cell.setValue('EMAIL QUOTA FULL — send manually'); return; }

  var ref = row[1], name = row[2], events = row[8], team = row[9], fee = row[13];
  var subject, html;
  if (verdict === 'YES') {
    subject = "ASCEND '26 — Registration confirmed (" + ref + ')';
    html =
      '<p>Hi ' + esc_(name) + ',</p>' +
      '<p>Your payment is verified and your registration for <strong>ASCEND \'26</strong> is <strong>confirmed</strong>.</p>' +
      '<table cellpadding="4" style="border-collapse:collapse">' +
      '<tr><td><b>Reference ID</b></td><td>' + esc_(ref) + '</td></tr>' +
      '<tr><td><b>Event(s)</b></td><td>' + esc_(events) + '</td></tr>' +
      (team ? '<tr><td><b>Team</b></td><td>' + esc_(team) + '</td></tr>' : '') +
      '<tr><td><b>Fee paid</b></td><td>₹' + esc_(fee) + '</td></tr>' +
      '<tr><td><b>Dates</b></td><td>' + esc_(EVENT_DATES_TEXT) + '</td></tr>' +
      '<tr><td><b>Venue</b></td><td>' + esc_(VENUE_TEXT) + '</td></tr></table>' +
      '<p>You can open your confirmed pass any time: <a href="' + SITE_URL + '">' + SITE_URL + '</a> — enter your Reference ID and registered mobile number. ' +
      'Please carry it with your college ID to the registration desk.</p>' +
      '<p>Questions? WhatsApp the ASCEND desk: <a href="' + DESK_WHATSAPP + '">' + DESK_WHATSAPP + '</a></p>' +
      '<p>— ASCEND \'26 Desk, DCMS, University of Calicut</p>';
  } else {
    subject = "ASCEND '26 — We could not verify your payment (" + ref + ')';
    html =
      '<p>Hi ' + esc_(name) + ',</p>' +
      '<p>We could not match a payment to your ASCEND \'26 registration <strong>' + esc_(ref) + '</strong> (amount ₹' + esc_(fee) + ').</p>' +
      '<p>Please WhatsApp the desk with your payment screenshot and the UPI transaction ID so we can check it again: ' +
      '<a href="' + DESK_WHATSAPP + '">' + DESK_WHATSAPP + '</a></p>' +
      '<p>— ASCEND \'26 Desk, DCMS, University of Calicut</p>';
  }
  try {
    MailApp.sendEmail({ to: to, subject: subject, htmlBody: html, name: "ASCEND '26 Desk" });
    cell.setValue('Sent ' + verdict + ' · ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM HH:mm'));
  } catch (err) {
    cell.setValue('FAILED: ' + String(err).slice(0, 80));
  }
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onDeskEdit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onDeskEdit').forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onEdit().create();
}

// =============== formatting, dropdowns, summary ===============
function applyFormatting_(sh) {
  sh.setFrozenRows(1);
  var yesNo = SpreadsheetApp.newDataValidation().requireValueInList(['YES', 'NO'], true).setAllowInvalid(false).build();
  var yesOnly = SpreadsheetApp.newDataValidation().requireValueInList(['YES'], true).setAllowInvalid(false).build();
  sh.getRange(2, COL.VERIFIED, 2000, 1).setDataValidation(yesNo);
  sh.getRange(2, COL.CHECKIN, 2000, 1).setDataValidation(yesOnly);
  sh.getRange(2, 14, 2000, 1).setNumberFormat('0');

  var pay = sh.getRange(2, COL.STATUS, 2000, 1);
  var ver = sh.getRange(2, COL.VERIFIED, 2000, 1);
  var chk = sh.getRange(2, COL.CHECKIN, 2000, 1);
  var rules = [
    SpreadsheetApp.newConditionalFormatRule().whenTextContains('DUPLICATE').setBackground('#f4c7c3').setRanges([pay]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('Paid').setBackground('#fff2cc').setRanges([pay]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('YES').setBackground('#b7e1cd').setRanges([ver, chk]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('NO').setBackground('#f4c7c3').setRanges([ver]).build()
  ];
  sh.setConditionalFormatRules(rules);
}

function setupSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = getSheet_();
  var n = "'" + data.getName() + "'!";
  var rng = function (col) { return n + col + '2:' + col + '2000'; };
  var sum = ss.getSheetByName('Summary') || ss.insertSheet('Summary');
  sum.clear();

  sum.getRange(1, 1).setValue("ASCEND '26 — registration summary (live)").setFontWeight('bold').setFontSize(14);
  var metrics = [
    ['Total registrations', '=COUNTA(' + rng('B') + ')'],
    ['Verified by desk (YES)', '=COUNTIF(' + rng('R') + ',"YES")'],
    ['Paid by delegate — awaiting verification', '=COUNTIFS(' + rng('P') + ',"Paid*",' + rng('R') + ',"")'],
    ['Payment rejected (NO)', '=COUNTIF(' + rng('R') + ',"NO")'],
    ['Registered but not paid yet', '=COUNTIF(' + rng('P') + ',"Unpaid")'],
    ['Duplicate UTR — review', '=COUNTIF(' + rng('P') + ',"DUPLICATE*")'],
    ['Money verified (₹)', '=SUMIFS(' + rng('N') + ',' + rng('R') + ',"YES")'],
    ['Money awaiting verification (₹)', '=SUMIFS(' + rng('N') + ',' + rng('P') + ',"Paid*",' + rng('R') + ',"")'],
    ['Checked in at the desk', '=COUNTIF(' + rng('U') + ',"YES")'],
    ['Campus accommodation requests', '=COUNTIF(' + rng('K') + ',"Yes*")']
  ];
  for (var i = 0; i < metrics.length; i++) {
    sum.getRange(3 + i, 1).setValue(metrics[i][0]);
    sum.getRange(3 + i, 2).setFormula(metrics[i][1]);
  }

  var top = 3 + metrics.length + 2;
  sum.getRange(top, 1, 1, 5).setValues([['Event', 'Registrations', 'Verified', 'Awaiting verification', 'Checked in']]).setFontWeight('bold');
  for (var k = 0; k < EVENT_TITLES.length; k++) {
    var row = top + 1 + k;
    var m = '"*"&A' + row + '&"*"';
    sum.getRange(row, 1).setValue(EVENT_TITLES[k]);
    sum.getRange(row, 2).setFormula('=COUNTIF(' + rng('I') + ',' + m + ')');
    sum.getRange(row, 3).setFormula('=COUNTIFS(' + rng('I') + ',' + m + ',' + rng('R') + ',"YES")');
    sum.getRange(row, 4).setFormula('=COUNTIFS(' + rng('I') + ',' + m + ',' + rng('P') + ',"Paid*",' + rng('R') + ',"")');
    sum.getRange(row, 5).setFormula('=COUNTIFS(' + rng('I') + ',' + m + ',' + rng('U') + ',"YES")');
  }
  sum.setColumnWidth(1, 330);
  sum.setColumnWidths(2, 4, 150);
}

/** Run ONCE from the editor (and again if you ever change the settings above). */
function setupAll() {
  var sh = getSheet_();
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  applyFormatting_(sh);
  setupSummary();
  installTriggers();
}

function setup() { setupAll(); }   // old name still works
