/*
Claude Builder Club — AOU Egypt
Recruitment backend for Google Sheets + Apps Script.

SETUP:
1. Create a new Google Sheet.
2. Extensions → Apps Script.
3. Paste this file into Code.gs.
4. Run setup() once and authorize.
5. Deploy → New deployment → Web app.
6. Execute as: Me.
7. Choose an access setting appropriate for your recruitment flow.
8. Copy the Web App /exec URL into the Vercel environment variable GOOGLE_APPS_SCRIPT_URL.

Do not put private secrets in the front-end.
*/

const SETTINGS = {
  APPLICATIONS_SHEET: "Applications",
  CONFIG_SHEET: "Config",
  SEND_APPLICANT_EMAIL: true,
  CLUB_NAME: "Claude Builder Club — AOU Egypt",
  CLUB_EMAIL: "claudebuilder.aou@gmail.com",
  WHATSAPP_URL: "https://chat.whatsapp.com/GwiXzxyBXTBDsBqeenPYP8"
};

const HEADERS = [
  "server_received_at",
  "application_id",
  "status",
  "reviewer",
  "review_score",
  "review_notes",
  "full_name",
  "student_id",
  "email",
  "phone",
  "major",
  "academic_year",
  "team_first",
  "team_second",
  "preferred_role",
  "availability",
  "in_person",
  "linkedin",
  "portfolio",
  "design_portfolio",
  "other_link",
  "evidence",
  "motivation",
  "scenario",
  "campus_impact",
  "notes",
  "commitment",
  "accuracy",
  "privacy",
  "leadership_exp",
  "vp_priority",
  "coord_exp",
  "finance_exp",
  "technical_stack",
  "technical_demo",
  "event_exp",
  "ops_strength",
  "marketing_sample",
  "campaign_idea",
  "outreach_exp",
  "partner_target",
  "community_idea",
  "member_support",
  "hackathon_exp",
  "project_system",
  "people_exp",
  "conflict",
  "volunteer_interest",
  "client_submitted_at",
  "form_version",
  "user_agent",
  "faculty",
  "programme_major",
  "university_email",
  "preferred_role_first",
  "preferred_role_second",
  "submission_reference",
  "last_submitted_at"
];

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let apps = ss.getSheetByName(SETTINGS.APPLICATIONS_SHEET);
  if (!apps) apps = ss.insertSheet(SETTINGS.APPLICATIONS_SHEET);

  ensureSchema_(apps);
  apps.setFrozenRows(1);
  const headers = getHeaders_(apps);
  apps.getRange(1,1,1,headers.length)
    .setFontWeight("bold")
    .setBackground("#27221E")
    .setFontColor("#FFFFFF");

  let cfg = ss.getSheetByName(SETTINGS.CONFIG_SHEET);
  if (!cfg) cfg = ss.insertSheet(SETTINGS.CONFIG_SHEET);
  ensureConfigRow_(cfg, "Club Name", SETTINGS.CLUB_NAME);
  ensureConfigRow_(cfg, "Recruitment Status", "CLOSED");
  ensureConfigRow_(cfg, "Internal Notification Email", SETTINGS.CLUB_EMAIL);
  ensureConfigRow_(cfg, "Notes", "Set Recruitment Status to CLOSED to stop submissions.");
  cfg.getRange("A1:B1").setFontWeight("bold").setBackground("#DA6D3D").setFontColor("#FFFFFF");
}

function doGet() {
  return json_({
    ok: true,
    service: SETTINGS.CLUB_NAME + " Recruitment API",
    status: recruitmentIsOpen_() ? "OPEN" : "CLOSED"
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let data = {};

  try {
    lock.waitLock(10000);
    data = parseBody_(e);

    if (!recruitmentIsOpen_()) {
      return reply_({ok:false,message:"Applications are closed."}, data);
    }

    const required = ["full_name","student_id","email","university_email","phone","major","academic_year","team_first","team_second","preferred_role","availability","in_person","evidence","motivation","scenario","campus_impact"];
    for (const key of required) {
      if (!String(data[key] || "").trim()) {
        return reply_({ok:false,message:"Missing required field: " + key}, data);
      }
    }

    if (!isValidEmail_(data.email)) {
      return reply_({ok:false,message:"Invalid personal email address."}, data);
    }

    if (!isValidAouEmail_(data.university_email)) {
      return reply_({ok:false,message:"Use a valid AOU email ending with @std.aou.edu.eg."}, data);
    }

    if (!isTrue_(data.commitment) || !isTrue_(data.accuracy) || !isTrue_(data.privacy)) {
      return reply_({ok:false,message:"Required acknowledgements were not accepted."}, data);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SETTINGS.APPLICATIONS_SHEET);
    if (!sheet) throw new Error("Applications sheet not found. Run setup() first.");
    ensureSchema_(sheet);

    const existing = findDuplicate_(sheet, String(data.student_id).trim(), String(data.email).trim().toLowerCase());
    if (existing) {
      const existingRecord = getRowRecord_(sheet, existing.row);
      const applicationId = existingRecord.application_id || makeApplicationId_();
      const updatedRecord = Object.assign({}, existingRecord, data, {
        application_id: applicationId,
        server_received_at: existingRecord.server_received_at || new Date(),
        last_submitted_at: new Date()
      });

      writeRecordToRow_(sheet, existing.row, updatedRecord);

      try { sendApplicantReceipt_(updatedRecord, true); } catch (mailErr) { console.error(mailErr); }

      const internalEmail = getInternalNotificationEmail_();
      if (internalEmail) {
        try { sendInternalNotification_(updatedRecord, internalEmail, true); } catch (mailErr) { console.error(mailErr); }
      }

      return reply_({
        ok:true,
        duplicate:true,
        updated:true,
        application_id:applicationId,
        message:"Your existing application was updated."
      }, data);
    }

    const applicationId = makeApplicationId_();
    const record = Object.assign({}, data, {
      server_received_at: new Date(),
      last_submitted_at: new Date(),
      application_id: applicationId,
      status: "New",
      reviewer: "",
      review_score: "",
      review_notes: ""
    });

    appendRecord_(sheet, record);

    if (SETTINGS.SEND_APPLICANT_EMAIL) {
      try { sendApplicantReceipt_(record, false); } catch (mailErr) { console.error(mailErr); }
    }

    const internalEmail = getInternalNotificationEmail_();
    if (internalEmail) {
      try { sendInternalNotification_(record, internalEmail, false); } catch (mailErr) { console.error(mailErr); }
    }

    return reply_({ok:true,duplicate:false,application_id:applicationId}, data);
  } catch (err) {
    console.error(err);
    return reply_({ok:false,message:"Server error. Please try again later."}, data);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function parseBody_(e) {
  if (!e) return {};

  if (e.parameter && e.parameter.application_payload) {
    try { return JSON.parse(e.parameter.application_payload); } catch (_) {}
  }

  const raw = e.postData && e.postData.contents ? e.postData.contents : "";
  if (raw) {
    try { return JSON.parse(raw); } catch (_) {}
  }

  return e.parameter || {};
}

function reply_(obj, data) {
  if (data && data._transport === "iframe" && data._nonce) {
    const message = Object.assign({
      type: "CBC_APPLICATION_RESULT",
      nonce: String(data._nonce)
    }, obj);

    const json = JSON.stringify(message).replace(/</g, "\\u003c");
    const targetOrigin = "https://mhmdwaelanwr.github.io";

    return HtmlService
      .createHtmlOutput(
        "<!doctype html><html><body><script>" +
        "window.parent.postMessage(" + json + "," + JSON.stringify(targetOrigin) + ");" +
        "</script></body></html>"
      )
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return json_(obj);
}

function ensureSchema_(sheet) {
  const currentLastColumn = Math.max(sheet.getLastColumn(), 1);
  const current = sheet.getRange(1,1,1,currentLastColumn).getValues()[0]
    .map(v => String(v || "").trim());

  if (!current.some(Boolean)) {
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    return;
  }

  const missing = HEADERS.filter(h => !current.includes(h));
  if (!missing.length) return;

  const startCol = currentLastColumn + 1;
  const neededLastCol = startCol + missing.length - 1;
  if (sheet.getMaxColumns() < neededLastCol) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), neededLastCol - sheet.getMaxColumns());
  }
  sheet.getRange(1,startCol,1,missing.length).setValues([missing]);
}

function getHeaders_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];
  return sheet.getRange(1,1,1,lastCol).getValues()[0]
    .map(v => String(v || "").trim());
}

function appendRecord_(sheet, record) {
  const headers = getHeaders_(sheet);
  sheet.appendRow(headers.map(h => sanitize_(record[h])));
}

function getRowRecord_(sheet, rowNumber) {
  const headers = getHeaders_(sheet);
  const values = sheet.getRange(rowNumber,1,1,headers.length).getValues()[0];
  const out = {};
  headers.forEach((h,i)=>{ if(h) out[h] = values[i]; });
  return out;
}

function writeRecordToRow_(sheet, rowNumber, record) {
  const headers = getHeaders_(sheet);
  const current = sheet.getRange(rowNumber,1,1,headers.length).getValues()[0];
  const protectedFields = new Set(["status","reviewer","review_score","review_notes"]);

  const values = headers.map((h,i)=>{
    if (protectedFields.has(h) && current[i] !== "" && current[i] !== null) return current[i];
    if (Object.prototype.hasOwnProperty.call(record,h)) return sanitize_(record[h]);
    return current[i];
  });

  sheet.getRange(rowNumber,1,1,headers.length).setValues([values]);
}

function ensureConfigRow_(cfg, key, defaultValue) {
  const last = Math.max(cfg.getLastRow(),1);
  const values = cfg.getRange(1,1,last,2).getValues();
  const found = values.some(r => String(r[0]).trim() === key);
  if (!found) cfg.appendRow([key, defaultValue]);
}

function getInternalNotificationEmail_() {
  const configured = getConfigValue_("Internal Notification Email");
  if (configured && isValidEmail_(configured)) return configured;
  return SETTINGS.CLUB_EMAIL;
}

function getConfigValue_(key) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cfg = ss.getSheetByName(SETTINGS.CONFIG_SHEET);
  if (!cfg || cfg.getLastRow() < 1) return "";
  const values = cfg.getRange(1,1,cfg.getLastRow(),2).getValues();
  const row = values.find(r => String(r[0]).trim() === key);
  return row ? String(row[1] || "").trim() : "";
}

function recruitmentIsOpen_() {
  const value = getConfigValue_("Recruitment Status");
  return !value || value.toUpperCase() === "OPEN";
}

function isTrue_(value) {
  return value === true || String(value).toLowerCase() === "true" || String(value).toLowerCase() === "on";
}

function findDuplicate_(sheet, studentId, email) {
  const last = sheet.getLastRow();
  if (last < 2) return null;

  const headers = getHeaders_(sheet);
  const idCol = headers.indexOf("student_id");
  const emailCol = headers.indexOf("email");
  if (idCol < 0 || emailCol < 0) return null;

  const rows = sheet.getRange(2,1,last-1,headers.length).getValues();

  for (let i=0;i<rows.length;i++) {
    const rowId = String(rows[i][idCol] || "").trim();
    const rowEmail = String(rows[i][emailCol] || "").trim().toLowerCase();
    if (rowId === studentId || rowEmail === email) {
      return {row:i+2};
    }
  }
  return null;
}


function makeApplicationId_() {
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Africa/Cairo", "yyyyMMdd");
  const rand = Utilities.getUuid().replace(/-/g,"").slice(0,6).toUpperCase();
  return "CBC-AOU-" + date + "-" + rand;
}

function sanitize_(value) {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) return value;
  const s = String(value).trim();
  // Prevent formula injection in Sheets.
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function isValidAouEmail_(email) {
  return /^[^\s@]+@std\.aou\.edu\.eg$/i.test(String(email || "").trim());
}

function sendApplicantReceipt_(record, updated) {
  if (!SETTINGS.SEND_APPLICANT_EMAIL) return;

  const title = updated ? "Application updated" : "Application received";
  const action = updated ? "updated" : "received";

  MailApp.sendEmail({
    to: record.email,
    name: SETTINGS.CLUB_NAME,
    replyTo: SETTINGS.CLUB_EMAIL,
    subject: SETTINGS.CLUB_NAME + " — " + title,
    htmlBody:
      emailShell_(
        "<p style='margin:0 0 16px'>Hi <b>" + escapeHtml_(record.full_name) + "</b>,</p>" +
        "<h2 style='margin:0 0 10px;font-size:24px'>" + title + ".</h2>" +
        "<p style='margin:0 0 18px;color:#625d57'>Your founding team application has been " + action + " successfully.</p>" +
        detailRow_("Application ID", record.application_id) +
        detailRow_("First preference", record.team_first) +
        detailRow_("Preferred role", record.preferred_role_first || record.preferred_role) +
        "<p style='margin:20px 0 8px'><b>What happens next?</b></p>" +
        "<p style='margin:0;color:#625d57'>Our recruitment team will review your application. If shortlisted, we’ll contact you using the details you submitted.</p>" +
        "<p style='margin:22px 0 0'><a href='" + SETTINGS.WHATSAPP_URL + "' style='display:inline-block;padding:11px 16px;background:#1f8f55;color:#fff;text-decoration:none;border-radius:10px;font-weight:700'>Follow recruitment updates on WhatsApp</a></p>"
      )
  });
}

function sendInternalNotification_(record, recipient, updated) {
  const action = updated ? "Updated application" : "New application";

  MailApp.sendEmail({
    to: recipient,
    name: SETTINGS.CLUB_NAME,
    replyTo: record.email,
    subject: action + " — " + record.full_name,
    htmlBody:
      emailShell_(
        "<h2 style='margin:0 0 14px;font-size:22px'>" + escapeHtml_(action) + "</h2>" +
        detailRow_("Applicant", record.full_name) +
        detailRow_("Application ID", record.application_id) +
        detailRow_("Personal email", record.email) +
        detailRow_("AOU email", record.university_email) +
        detailRow_("Phone", record.phone) +
        detailRow_("First preference", record.team_first) +
        detailRow_("First role", record.preferred_role_first || record.preferred_role) +
        detailRow_("Second preference", record.team_second) +
        detailRow_("Second role", record.preferred_role_second) +
        "<p style='margin:18px 0 0;color:#625d57'>Open the Applications sheet to review the full submission.</p>"
      )
  });
}

function detailRow_(label, value) {
  return "<div style='padding:10px 0;border-bottom:1px solid #e7e0d8'>" +
    "<div style='font-size:11px;color:#8a8179;text-transform:uppercase;letter-spacing:.05em'>" +
    escapeHtml_(label) + "</div>" +
    "<div style='margin-top:3px;font-weight:600'>" + escapeHtml_(value || "—") + "</div>" +
    "</div>";
}

function emailShell_(body) {
  return "<div style='font-family:Arial,sans-serif;background:#f7f4ed;padding:24px;color:#1b1917'>" +
    "<div style='max-width:620px;margin:auto;background:#fff;border:1px solid #e5ded6;border-radius:16px;padding:26px'>" +
    "<div style='font-size:12px;color:#c96442;font-weight:700;margin-bottom:18px'>CLAUDE BUILDER CLUB — AOU EGYPT</div>" +
    body +
    "<div style='margin-top:26px;padding-top:16px;border-top:1px solid #e7e0d8;font-size:12px;color:#8a8179'>" +
    "Questions? Reply to this email or contact " + escapeHtml_(SETTINGS.CLUB_EMAIL) + "." +
    "</div></div></div>";
}

function escapeHtml_(s) {
  return String(s || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
