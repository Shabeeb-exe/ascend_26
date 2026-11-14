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
 *       YES -> "Registration confirmed" with a professional branded email, banner, inline pass card,
 *              custom ASCEND '26 signature, and an attached official Delegate Pass PDF.
 *       NO  -> "Payment verification required" with payment matching details, direct WhatsApp resolution button,
 *              and custom signature.
 *     Column T records what was sent (an email is never sent twice for the same decision).
 *   - column U "Checked in (desk)" is for the event day
 *   - a "Summary" tab with live counts and money (rebuild any time with setupSummary)
 *   - the website's "Check status" box reads this sheet (Reference ID + mobile number must both match)
 *   - formula-injection protection, locking, Reference ID validation
 */

// ---------- SETTINGS (edit here) ----------
var EVENT_DATES_TEXT = 'January 18 & 19, 2027 (tentative — final dates will be confirmed)';
var SITE_URL = 'https://ascend26.vercel.app/#register';
var BANNER_IMG_URL = 'https://ascend26.vercel.app/og-image.png';
var LOGO_IMG_URL = 'https://ascend26.vercel.app/apple-touch-icon.png';

// Delegate Helpdesk WhatsApp:
// Currently set to Muhammed Shabeeb K T (+91 97440 11164).
// Future replacement: Program Co-ordinator Aswathi A K (+91 80863 82375).
var DESK_WHATSAPP_NUMBER = '919744011164';
var DESK_WHATSAPP = 'https://wa.me/' + DESK_WHATSAPP_NUMBER;
var DESK_CONTACT_NAME = 'Muhammed Shabeeb K T';
var DESK_CONTACT_DISPLAY = '+91 97440 11164';

var OFFICIAL_EMAIL = 'dcms.ascend26@gmail.com';
var FEST_EMAIL = OFFICIAL_EMAIL;  // Replies go here; mail is sent by the Google account that owns this script.
var INSTAGRAM_URL = 'https://instagram.com/ascend.dcms';
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
      clean_(d.teamMembers, 1500), clean_(d.accommodation, 80), clean_(d.dietary, 150), clean_(d.notes, 500),
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
    var cleanPhone = p.phone ? String(p.phone).replace(/\D/g, '').slice(-10) : '';
    return out_(status_(String(p.ref || '').toUpperCase().trim(), cleanPhone));
  }
  return out_({ result: 'ASCEND 26 endpoint is running' });
}

function status_(ref, phone) {
  if (!/^ASC26-[0-9A-Z]{7}$/.test(ref) || !/^[6-9]\d{9}$/.test(phone)) return { found: false };
  var sh = getSheet_();
  var last = sh.getLastRow();
  if (last < 2) return { found: false };
  var rows = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  for (var i = rows.length - 1; i >= 0; i--) {
    var r = rows[i];
    var refMatches = String(r[1] || '').trim().toUpperCase() === ref;
    var rowPhone = String(r[4] || '').replace(/\D/g, '').slice(-10);
    var phoneMatches = rowPhone === phone;
    if (refMatches && phoneMatches) {
      var v = String(r[COL.VERIFIED - 1]).trim().toUpperCase();
      var paid = String(r[COL.STATUS - 1]).indexOf('Paid') === 0 || String(r[COL.STATUS - 1]).indexOf('DUPLICATE') === 0;
      return {
        found: true,
        state: v === 'YES' ? 'confirmed' : v === 'NO' ? 'rejected' : paid ? 'pending' : 'unpaid',
        refId: r[1], name: r[2], college: r[5], program: r[6], year: r[7], events: r[8], team: r[9],
        accommodation: r[10], dietary: r[11], total: r[13], breakdown: r[14],
        phone: rowPhone
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

  var ref = String(row[1] || '').trim();
  var name = String(row[2] || '').trim();
  var phone = String(row[COL.PHONE - 1] || '').trim();
  var college = String(row[5] || '').trim();
  var program = String(row[6] || '').trim();
  var year = String(row[7] || '').trim();
  var events = String(row[8] || '').trim();
  var team = String(row[9] || '').trim();
  var accommodation = String(row[10] || '').trim();
  var dietary = String(row[11] || '').trim();
  var fee = String(row[13] || '0').trim();
  var utr = String(row[COL.UTR - 1] || '').trim();
  var cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
  var passLiveUrl = 'https://ascend26.vercel.app/?pass=' + encodeURIComponent(ref) + (cleanPhone ? '&phone=' + encodeURIComponent(cleanPhone) : '') + '#register';

  var passData = {
    ref: ref,
    name: name,
    email: to,
    phone: phone,
    cleanPhone: cleanPhone,
    college: college,
    program: program,
    year: year,
    events: events,
    team: team,
    accommodation: accommodation,
    dietary: dietary,
    fee: fee,
    utr: utr,
    portalUrl: passLiveUrl
  };

  var subject, htmlBody;
  var attachments = [];

  if (verdict === 'YES') {
    subject = "ASCEND '26 — Registration Confirmed & Official Delegate Pass (" + ref + ")";

    // Generate Pass PDF attachment
    try {
      var pdfBlob = buildPassPdfBlob_(passData);
      if (pdfBlob) {
        attachments.push(pdfBlob);
      }
    } catch (pdfErr) {
      Logger.log('PDF generation failed: ' + pdfErr);
    }

    htmlBody = buildConfirmedEmailHtml_(passData, attachments.length > 0);
  } else {
    subject = "ASCEND '26 — Payment Verification Required (" + ref + ")";
    htmlBody = buildPaymentRejectedEmailHtml_(passData);
  }

  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: htmlBody,
      name: "ASCEND '26 Desk",
      replyTo: FEST_EMAIL,
      attachments: attachments
    });
    var stamp = 'Sent ' + verdict + (attachments.length ? ' (+PDF)' : '') + ' · ' +
                Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM HH:mm');
    cell.setValue(stamp);
  } catch (err) {
    cell.setValue('FAILED: ' + String(err).slice(0, 80));
  }
}

/** Official ASCEND '26 executive signature block */
function buildEmailSignatureHtml_() {
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px; padding-top:20px; border-top:2px solid #e2e8f0; font-family:-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Arial, sans-serif;">' +
      '<tr>' +
        '<td style="vertical-align:top; width:56px; padding-right:14px;">' +
          '<a href="https://ascend26.vercel.app/" target="_blank" style="display:block; text-decoration:none;">' +
            '<img src="' + LOGO_IMG_URL + '" alt="ASCEND \'26 Logo" width="52" height="52" border="0" style="width:52px; height:52px; border-radius:10px; border:1.5px solid #C89B2B; display:block; outline:none; background-color:#090A0F;" />' +
          '</a>' +
        '</td>' +
        '<td style="vertical-align:top;">' +
          '<div style="font-size:14px; font-weight:800; color:#0f172a; letter-spacing:0.3px;">Executive Organizing Committee</div>' +
          '<div style="font-size:12.5px; font-weight:700; color:#B45309; margin-top:2px;">ASCEND \'26 — 27th National Level Management Fest</div>' +
          '<div style="font-size:11.5px; color:#475569; margin-top:2px;">Department of Commerce and Management Studies (DCMS)</div>' +
          '<div style="font-size:11.5px; color:#64748b;">University of Calicut, Thenhipalam, Malappuram, Kerala – 673635</div>' +
          '<div style="margin-top:10px; font-size:11.5px; line-height:1.7; color:#334155;">' +
            '<span>💬 <strong>Desk WhatsApp:</strong> <a href="' + DESK_WHATSAPP + '" style="color:#0f766e; text-decoration:none; font-weight:600;">' + DESK_CONTACT_DISPLAY + '</a> (' + esc_(DESK_CONTACT_NAME) + ')</span><br/>' +
            '<span>✉️ <strong>Official Email:</strong> <a href="mailto:' + OFFICIAL_EMAIL + '" style="color:#0f766e; text-decoration:none;">' + OFFICIAL_EMAIL + '</a></span> &nbsp;|&nbsp; ' +
            '<span>🌐 <strong>Web:</strong> <a href="https://ascend26.vercel.app/" style="color:#0f766e; text-decoration:none;">ascend26.vercel.app</a></span> &nbsp;|&nbsp; ' +
            '<span>📸 <strong>Instagram:</strong> <a href="' + INSTAGRAM_URL + '" style="color:#0f766e; text-decoration:none;">@ascend.dcms</a></span>' +
          '</div>' +
        '</td>' +
      '</tr>' +
      '<tr>' +
        '<td colspan="2" style="padding-top:14px;">' +
          '<div style="font-size:10px; color:#94a3b8; line-height:1.45; border-top:1px dashed #e2e8f0; padding-top:10px;">' +
            '<em>Official communication from ASCEND \'26 Executive Committee. Please carry your valid Institutional ID card along with your Delegate Pass for campus entry and arena reporting.</em>' +
          '</div>' +
        '</td>' +
      '</tr>' +
    '</table>'
  );
}

/** Professional Registration Confirmed HTML Email */
function buildConfirmedEmailHtml_(d, hasPdf) {
  var waHelpUrl = 'https://wa.me/' + DESK_WHATSAPP_NUMBER + '?text=' + encodeURIComponent("Hello ASCEND '26 Desk, I have a query regarding my confirmed pass. Reference ID: " + d.ref);

  return (
    '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>ASCEND \'26 Registration Confirmed</title>' +
    '</head>' +
    '<body style="margin:0; padding:0; background-color:#0d111a; font-family:-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color:#1e293b;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d111a; padding:20px 10px;">' +
        '<tr>' +
          '<td align="center">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.4); border:1px solid #1e2538;">' +
              '<!-- Top Banner Image -->' +
              '<tr>' +
                '<td style="padding:0; background-color:#090A0F; text-align:center;">' +
                  '<a href="https://ascend26.vercel.app/" target="_blank" style="display:block; text-decoration:none;">' +
                    '<img src="' + BANNER_IMG_URL + '" alt="ASCEND \'26 Banner" width="620" border="0" style="width:100%; max-width:620px; height:auto; display:block; outline:none; border:none;" />' +
                  '</a>' +
                '</td>' +
              '</tr>' +
              '<!-- Gold Accent Line -->' +
              '<tr>' +
                '<td style="height:4px; background:linear-gradient(90deg, #9E7312 0%, #E6BE53 50%, #C89B2B 100%); background-color:#C89B2B; font-size:1px; line-height:1px;">&nbsp;</td>' +
              '</tr>' +
              '<!-- Header Sub-Bar -->' +
              '<tr>' +
                '<td style="background-color:#0f172a; padding:10px 20px; text-align:center;">' +
                  '<span style="color:#E6BE53; font-size:10.5px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;">27th National Level Management Fest • DCMS, University of Calicut</span>' +
                '</td>' +
              '</tr>' +
              '<!-- Content Body -->' +
              '<tr>' +
                '<td style="padding:28px 24px 20px 24px;">' +
                  '<!-- Status Pill -->' +
                  '<div style="display:inline-block; padding:4px 12px; background-color:#ecfdf5; border:1px solid #a7f3d0; border-radius:9999px; font-size:11px; font-weight:700; color:#065f46; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:14px;">' +
                    '✓ Payment Verified &amp; Registration Confirmed' +
                  '</div>' +
                  '<h1 style="margin:0 0 12px 0; font-size:21px; font-weight:800; color:#0f172a; line-height:1.3;">' +
                    'Welcome to ASCEND \'26!' +
                  '</h1>' +
                  '<p style="margin:0 0 14px 0; font-size:13.5px; line-height:1.6; color:#334155;">' +
                    'Dear <strong>' + esc_(d.name) + '</strong>,' +
                  '</p>' +
                  '<p style="margin:0 0 18px 0; font-size:13.5px; line-height:1.6; color:#334155;">' +
                    'Your payment has been verified by our executive desk, and your registration for <strong>ASCEND \'26</strong> is officially <strong>CONFIRMED</strong>. Your delegate pass is issued below.' +
                  '</p>' +

                  '<!-- Delegate Pass Card in Email -->' +
                  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc; border:2px solid #C89B2B; border-radius:10px; margin-bottom:20px; overflow:hidden;">' +
                    '<tr>' +
                      '<td style="background-color:#0f172a; padding:12px 18px; border-bottom:1px solid #C89B2B;">' +
                        '<table width="100%" cellpadding="0" cellspacing="0" border="0">' +
                          '<tr>' +
                            '<td style="font-size:11.5px; font-weight:800; color:#E6BE53; text-transform:uppercase; letter-spacing:1px;">OFFICIAL DELEGATE PASS</td>' +
                            '<td align="right" style="font-size:11px; font-weight:700; color:#34D399; text-transform:uppercase;">STATUS: CONFIRMED</td>' +
                          '</tr>' +
                        '</table>' +
                      '</td>' +
                    '</tr>' +
                    '<tr>' +
                      '<td style="padding:16px 18px;">' +
                        '<div style="font-size:10px; text-transform:uppercase; color:#64748b; font-weight:700; letter-spacing:0.5px;">Reference ID</div>' +
                        '<div style="font-size:22px; font-weight:800; color:#B45309; letter-spacing:1.5px; margin:2px 0 12px 0; font-family:monospace;">' + esc_(d.ref) + '</div>' +
                        '<table width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size:12.5px; color:#334155; border-collapse:collapse;">' +
                          '<tr style="border-top:1px solid #e2e8f0;"><td style="color:#64748b; width:34%; font-weight:600;">Lead Delegate</td><td style="font-weight:700; color:#0f172a;">' + esc_(d.name) + '</td></tr>' +
                          '<tr style="border-top:1px solid #e2e8f0;"><td style="color:#64748b; font-weight:600;">Institution</td><td>' + esc_(d.college) + '</td></tr>' +
                          (d.program ? '<tr style="border-top:1px solid #e2e8f0;"><td style="color:#64748b; font-weight:600;">Program / Year</td><td>' + esc_(d.program) + (d.year ? ' (' + esc_(d.year) + ')' : '') + '</td></tr>' : '') +
                          '<tr style="border-top:1px solid #e2e8f0;"><td style="color:#64748b; font-weight:600;">Registered Event(s)</td><td style="font-weight:600; color:#0f172a;">' + esc_(d.events) + '</td></tr>' +
                          (d.team ? '<tr style="border-top:1px solid #e2e8f0;"><td style="color:#64748b; font-weight:600;">Team Members</td><td>' + esc_(d.team) + '</td></tr>' : '') +
                          '<tr style="border-top:1px solid #e2e8f0;"><td style="color:#64748b; font-weight:600;">Fee Paid</td><td style="font-weight:700; color:#059669;">₹' + esc_(d.fee) + ' (Verified)</td></tr>' +
                          (d.utr ? '<tr style="border-top:1px solid #e2e8f0;"><td style="color:#64748b; font-weight:600;">UTR / Txn ID</td><td style="font-family:monospace;">' + esc_(d.utr) + '</td></tr>' : '') +
                          (d.accommodation ? '<tr style="border-top:1px solid #e2e8f0;"><td style="color:#64748b; font-weight:600;">Accommodation</td><td>' + esc_(d.accommodation) + '</td></tr>' : '') +
                          '<tr style="border-top:1px solid #e2e8f0;"><td style="color:#64748b; font-weight:600;">Dates</td><td>' + esc_(EVENT_DATES_TEXT) + '</td></tr>' +
                          '<tr style="border-top:1px solid #e2e8f0;"><td style="color:#64748b; font-weight:600;">Venue</td><td>' + esc_(VENUE_TEXT) + '</td></tr>' +
                        '</table>' +
                      '</td>' +
                    '</tr>' +
                  '</table>' +

                  (hasPdf ?
                    '<div style="background-color:#f0fdf4; border-left:4px solid #10b981; padding:12px 14px; border-radius:4px; margin-bottom:18px; font-size:12.5px; color:#065f46; line-height:1.5;">' +
                      '📎 <strong>PDF Pass Attached:</strong> Your official printable <strong>ASCEND \'26 Delegate Pass (PDF)</strong> is attached to this email. You can save it to your phone or take a printout.' +
                    '</div>' : '') +

                  '<div style="background-color:#eff6ff; border-left:4px solid #3b82f6; padding:12px 14px; border-radius:4px; margin-bottom:20px; font-size:12px; color:#1e40af; line-height:1.5;">' +
                    '💡 <strong>Reporting Checklist:</strong> Please carry your valid College / University ID card along with this pass to the registration desk on arrival. Event-wise reporting timings and room allocations will be announced on the web portal.' +
                  '</div>' +

                  '<!-- Action Buttons -->' +
                  '<div style="margin-bottom:20px;">' +
                    '<a href="' + (d.portalUrl || SITE_URL) + '" target="_blank" style="display:inline-block; padding:11px 20px; background:linear-gradient(135deg, #C89B2B 0%, #9E7312 100%); background-color:#C89B2B; color:#ffffff; font-size:12.5px; font-weight:700; text-decoration:none; border-radius:6px; margin-right:8px; margin-bottom:8px;">Open Live Pass on Portal ↗</a>' +
                    '<a href="' + waHelpUrl + '" target="_blank" style="display:inline-block; padding:11px 20px; background-color:#25D366; color:#ffffff; font-size:12.5px; font-weight:700; text-decoration:none; border-radius:6px; margin-bottom:8px;">WhatsApp Helpdesk ↗</a>' +
                  '</div>' +

                  '<!-- Custom Signature -->' +
                  buildEmailSignatureHtml_() +
                '</td>' +
              '</tr>' +
            '</table>' +
          '</td>' +
        '</tr>' +
      '</table>' +
    '</body>' +
    '</html>'
  );
}

/** Professional Payment Rejected / Action Required HTML Email */
function buildPaymentRejectedEmailHtml_(d) {
  var rejectWaText = "Hello ASCEND '26 Desk, my payment could not be verified for Reference ID: " + d.ref + " (Amount: ₹" + d.fee + "). Here is my payment screenshot and transaction details:";
  var rejectWaUrl = 'https://wa.me/' + DESK_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(rejectWaText);

  return (
    '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>ASCEND \'26 Payment Verification Notice</title>' +
    '</head>' +
    '<body style="margin:0; padding:0; background-color:#0d111a; font-family:-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color:#1e293b;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d111a; padding:20px 10px;">' +
        '<tr>' +
          '<td align="center">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.4); border:1px solid #1e2538;">' +
              '<!-- Top Banner Image -->' +
              '<tr>' +
                '<td style="padding:0; background-color:#090A0F; text-align:center;">' +
                  '<a href="https://ascend26.vercel.app/" target="_blank" style="display:block; text-decoration:none;">' +
                    '<img src="' + BANNER_IMG_URL + '" alt="ASCEND \'26 Banner" width="620" border="0" style="width:100%; max-width:620px; height:auto; display:block; outline:none; border:none;" />' +
                  '</a>' +
                '</td>' +
              '</tr>' +
              '<!-- Gold Accent Line -->' +
              '<tr>' +
                '<td style="height:4px; background:linear-gradient(90deg, #9E7312 0%, #E6BE53 50%, #C89B2B 100%); background-color:#C89B2B; font-size:1px; line-height:1px;">&nbsp;</td>' +
              '</tr>' +
              '<!-- Header Sub-Bar -->' +
              '<tr>' +
                '<td style="background-color:#0f172a; padding:10px 20px; text-align:center;">' +
                  '<span style="color:#E6BE53; font-size:10.5px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;">Department of Commerce and Management Studies • University of Calicut</span>' +
                '</td>' +
              '</tr>' +
              '<!-- Content Body -->' +
              '<tr>' +
                '<td style="padding:28px 24px 20px 24px;">' +
                  '<!-- Status Pill -->' +
                  '<div style="display:inline-block; padding:4px 12px; background-color:#fef2f2; border:1px solid #fecaca; border-radius:9999px; font-size:11px; font-weight:700; color:#991b1b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:14px;">' +
                    'Action Required • Payment Verification Pending' +
                  '</div>' +
                  '<h1 style="margin:0 0 12px 0; font-size:21px; font-weight:800; color:#0f172a; line-height:1.3;">' +
                    'Payment Verification Notice' +
                  '</h1>' +
                  '<p style="margin:0 0 14px 0; font-size:13.5px; line-height:1.6; color:#334155;">' +
                    'Dear <strong>' + esc_(d.name) + '</strong>,' +
                  '</p>' +
                  '<p style="margin:0 0 16px 0; font-size:13.5px; line-height:1.6; color:#334155;">' +
                    'Thank you for registering for <strong>ASCEND \'26</strong>. Our verification desk was unable to match or confirm a completed UPI payment for your registration:' +
                  '</p>' +

                  '<!-- Reference Summary Box -->' +
                  '<div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px 16px; margin-bottom:18px;">' +
                    '<table width="100%" cellpadding="4" cellspacing="0" border="0" style="font-size:12.5px; color:#334155;">' +
                      '<tr><td style="color:#64748b; width:34%; font-weight:600;">Reference ID</td><td style="font-weight:800; color:#B45309; font-family:monospace; font-size:14px;">' + esc_(d.ref) + '</td></tr>' +
                      '<tr><td style="color:#64748b; font-weight:600;">Event(s)</td><td style="font-weight:600;">' + esc_(d.events) + '</td></tr>' +
                      '<tr><td style="color:#64748b; font-weight:600;">Registration Fee</td><td style="font-weight:700; color:#b91c1c;">₹' + esc_(d.fee) + '</td></tr>' +
                      (d.utr ? '<tr><td style="color:#64748b; font-weight:600;">Submitted UTR</td><td style="font-family:monospace;">' + esc_(d.utr) + '</td></tr>' : '') +
                    '</table>' +
                  '</div>' +

                  '<!-- Instructions -->' +
                  '<div style="background-color:#fffbeb; border-left:4px solid #f59e0b; padding:14px 16px; border-radius:4px; margin-bottom:20px; font-size:12.5px; line-height:1.6; color:#92400e;">' +
                    '<strong>How to resolve this:</strong>' +
                    '<ul style="margin:6px 0 0 0; padding-left:18px;">' +
                      '<li><strong>If you have already paid:</strong> Click the button below to WhatsApp your payment screenshot and 12-digit UPI transaction number (UTR) to our desk. We will immediately check bank records and confirm your pass.</li>' +
                      '<li style="margin-top:4px;"><strong>If you have not paid yet:</strong> Visit our registration portal, complete the UPI payment using the QR code or UPI ID (<code>muhammedshabeebkt2016@oksbi</code>), and submit your UTR.</li>' +
                    '</ul>' +
                  '</div>' +

                  '<!-- Action Buttons -->' +
                  '<div style="margin-bottom:20px;">' +
                    '<a href="' + rejectWaUrl + '" target="_blank" style="display:inline-block; padding:12px 22px; background-color:#25D366; color:#ffffff; font-size:13px; font-weight:700; text-decoration:none; border-radius:6px; margin-right:8px; margin-bottom:8px;">WhatsApp Payment Screenshot to Desk ↗</a>' +
                    '<a href="' + (d.portalUrl || SITE_URL) + '" target="_blank" style="display:inline-block; padding:12px 20px; background-color:#0f172a; color:#ffffff; font-size:13px; font-weight:700; text-decoration:none; border-radius:6px; margin-bottom:8px;">Check / Pay on Portal ↗</a>' +
                  '</div>' +

                  '<!-- Custom Signature -->' +
                  buildEmailSignatureHtml_() +
                '</td>' +
              '</tr>' +
            '</table>' +
          '</td>' +
        '</tr>' +
      '</table>' +
    '</body>' +
    '</html>'
  );
}

/** Generates PDF blob for confirmed delegate pass */
function buildPassPdfBlob_(d) {
  try {
    var html = buildPassPdfHtml_(d);
    var blob = Utilities.newBlob(html, 'text/html', 'ASCEND26_Delegate_Pass_' + d.ref + '.html');
    return blob.getAs('application/pdf').setName('ASCEND26_Delegate_Pass_' + d.ref + '.pdf');
  } catch (err) {
    Logger.log('Error creating PDF blob: ' + err);
    return null;
  }
}

/** Official Printable A4 Delegate Pass HTML (for PDF engine) */
function buildPassPdfHtml_(d) {
  var cleanPhone = String(d.cleanPhone || d.phone || '').replace(/\D/g, '').slice(-10);
  var passLiveUrl = 'https://ascend26.vercel.app/?pass=' + encodeURIComponent(d.ref) + (cleanPhone ? '&phone=' + encodeURIComponent(cleanPhone) : '') + '#register';
  var qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=0&data=' + encodeURIComponent(passLiveUrl);

  return (
    '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
      '<meta charset="utf-8">' +
      '<title>ASCEND \'26 Delegate Pass - ' + esc_(d.ref) + '</title>' +
      '<style>' +
        '@page { size: A4 portrait; margin: 12mm 14mm; }' +
        'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color:#0f172a; background:#ffffff; margin:0; padding:0; font-size:12px; line-height:1.45; }' +
        '.pass-container { border: 2.5px solid #C89B2B; border-radius: 12px; padding: 22px 24px; background: #ffffff; }' +
        '.top-header { width: 100%; border-bottom: 2px solid #E6BE53; padding-bottom: 12px; margin-bottom: 14px; }' +
        '.dept-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }' +
        '.main-title { font-size: 26px; font-weight: 900; color: #9E7312; letter-spacing: 2px; margin: 3px 0 0 0; line-height: 1.1; }' +
        '.sub-title { font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }' +
        '.badge-verified { display: inline-block; background-color: #ecfdf5; border: 1.5px solid #059669; color: #065f46; font-size: 11px; font-weight: 800; padding: 5px 12px; border-radius: 6px; letter-spacing: 1px; text-transform: uppercase; }' +
        '.pass-grid { width: 100%; border-collapse: collapse; margin-bottom: 14px; }' +
        '.pass-grid td { padding: 6px 8px; vertical-align: top; font-size: 11.5px; border-bottom: 1px solid #f1f5f9; }' +
        '.col-label { width: 28%; font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.5px; }' +
        '.col-value { font-weight: 600; color: #0f172a; }' +
        '.ref-box { background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; }' +
        '.ref-num { font-size: 22px; font-weight: 900; color: #B45309; font-family: monospace; letter-spacing: 2px; }' +
        '.instructions-box { background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; font-size: 10.5px; color: #78350f; line-height: 1.5; margin-top: 12px; }' +
        '.instructions-box h4 { margin: 0 0 4px 0; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #92400e; }' +
        '.instructions-box ol { margin: 0; padding-left: 16px; }' +
        '.instructions-box li { margin-bottom: 2px; }' +
        '.footer-sign { width: 100%; border-top: 1.5px solid #e2e8f0; margin-top: 18px; padding-top: 10px; font-size: 10px; color: #64748b; }' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<div class="pass-container">' +
        '<table class="top-header" cellpadding="0" cellspacing="0" border="0">' +
          '<tr>' +
            '<td>' +
              '<div class="dept-title">Department of Commerce and Management Studies • University of Calicut</div>' +
              '<div class="main-title">ASCEND \'26</div>' +
              '<div class="sub-title">27th National Level Management Fest</div>' +
            '</td>' +
            '<td align="right" valign="top">' +
              '<div class="badge-verified">✓ CONFIRMED DELEGATE PASS</div>' +
            '</td>' +
          '</tr>' +
        '</table>' +

        '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">' +
          '<tr>' +
            '<td valign="middle" style="width:72%;">' +
              '<div class="ref-box">' +
                '<div style="font-size:9.5px; text-transform:uppercase; letter-spacing:1px; color:#64748b; font-weight:700;">Official Reference ID</div>' +
                '<div class="ref-num">' + esc_(d.ref) + '</div>' +
              '</div>' +
            '</td>' +
            '<td align="right" valign="middle" style="padding-left:14px;">' +
              '<img src="' + qrCodeUrl + '" width="92" height="92" style="border:1px solid #C89B2B; border-radius:6px; padding:3px; background:#fff; display:block;" alt="QR Code" />' +
              '<div style="font-size:8.5px; color:#64748b; text-align:center; margin-top:3px;">Scan to Verify</div>' +
            '</td>' +
          '</tr>' +
        '</table>' +

        '<table class="pass-grid" cellpadding="0" cellspacing="0">' +
          '<tr><td class="col-label">Lead Delegate</td><td class="col-value" style="font-size:13px; font-weight:800; color:#0f172a;">' + esc_(d.name) + '</td></tr>' +
          '<tr><td class="col-label">Institution / College</td><td class="col-value">' + esc_(d.college) + '</td></tr>' +
          (d.program ? '<tr><td class="col-label">Program &amp; Year</td><td class="col-value">' + esc_(d.program) + (d.year ? ' (' + esc_(d.year) + ')' : '') + '</td></tr>' : '') +
          '<tr><td class="col-label">Mobile &amp; Email</td><td class="col-value">' + esc_(d.phone) + ' &nbsp;|&nbsp; ' + esc_(d.email) + '</td></tr>' +
          '<tr><td class="col-label">Registered Event(s)</td><td class="col-value" style="font-weight:700; color:#9E7312;">' + esc_(d.events) + '</td></tr>' +
          (d.team ? '<tr><td class="col-label">Team Members</td><td class="col-value">' + esc_(d.team) + '</td></tr>' : '') +
          '<tr><td class="col-label">Registration Fee</td><td class="col-value" style="font-weight:800; color:#059669;">₹' + esc_(d.fee) + ' (Verified &amp; Paid)</td></tr>' +
          (d.utr ? '<tr><td class="col-label">UPI Transaction UTR</td><td class="col-value" style="font-family:monospace;">' + esc_(d.utr) + '</td></tr>' : '') +
          (d.accommodation ? '<tr><td class="col-label">Campus Accommodation</td><td class="col-value">' + esc_(d.accommodation) + '</td></tr>' : '') +
          '<tr><td class="col-label">Event Dates</td><td class="col-value">' + esc_(EVENT_DATES_TEXT) + '</td></tr>' +
          '<tr><td class="col-label">Event Venue</td><td class="col-value">' + esc_(VENUE_TEXT) + '</td></tr>' +
        '</table>' +

        '<div class="instructions-box">' +
          '<h4>Delegate Guidelines &amp; Entry Requirements:</h4>' +
          '<ol>' +
            '<li><strong>Identification:</strong> Every participant must present this pass (printed or digital) along with their valid College/University Identity Card at the verification counter.</li>' +
            '<li><strong>Reporting:</strong> Specific event schedules, reporting times, and room allocations will be announced on the official portal (<a href="https://ascend26.vercel.app/" style="color:#92400e; font-weight:700;">ascend26.vercel.app</a>).</li>' +
            '<li><strong>Dress Code:</strong> Formal / business attire is mandatory for all management competitive arenas.</li>' +
            '<li><strong>Food &amp; Accommodation:</strong> Complimentary lunch is provided for registered flagship events (excluding Reel Making and E-Football/PES). Complimentary campus stay is provided for outstation delegates who qualify in Day 1 elimination rounds and advance to Day 2. Paid campus stay is available for outstation delegates at ₹100/person.</li>' +
            '<li><strong>Helpdesk:</strong> For accommodation, travel, or event clarifications, WhatsApp the Desk: <strong>' + esc_(DESK_CONTACT_DISPLAY) + '</strong> (' + esc_(DESK_CONTACT_NAME) + ').</li>' +
          '</ol>' +
        '</div>' +

        '<table class="footer-sign" cellpadding="0" cellspacing="0" border="0">' +
          '<tr>' +
            '<td valign="bottom" style="width:60%;">' +
              '<div><strong>Executive Desk Seal:</strong> VERIFIED [Auto-stamped by System]</div>' +
              '<div style="margin-top:2px; font-size:9px; color:#94a3b8;">Department of Commerce and Management Studies, University of Calicut</div>' +
            '</td>' +
            '<td align="right" valign="bottom" style="width:40%;">' +
              '<div style="font-weight:700; color:#0f172a;">Executive Organizing Committee</div>' +
              '<div style="font-size:9.5px; color:#C89B2B; font-weight:600;">ASCEND \'26 | DCMS Calicut</div>' +
            '</td>' +
          '</tr>' +
        '</table>' +
      '</div>' +
    '</body>' +
    '</html>'
  );
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
