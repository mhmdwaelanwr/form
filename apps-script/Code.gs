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

  // Safe/idempotent setup: do not destroy existing applications.
  if (apps.getLastRow() > 1) {
    throw new Error("Applications already exist. setup() will not overwrite applicant data.");
  }
  apps.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  apps.setFrozenRows(1);
  apps.getRange(1,1,1,HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#27221E")
    .setFontColor("#FFFFFF");
  apps.autoResizeColumns(1, HEADERS.length);

  const statusCol = HEADERS.indexOf("status") + 1;
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["New","Shortlisted","Interview","Accepted","Waitlist","Rejected"], true)
    .setAllowInvalid(false)
    .build();
  apps.getRange(2,statusCol,Math.max(apps.getMaxRows()-1,1),1).setDataValidation(statusRule);

  const scoreCol = HEADERS.indexOf("review_score") + 1;
  const scoreRule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(0,100)
    .setAllowInvalid(true)
    .build();
  apps.getRange(2,scoreCol,Math.max(apps.getMaxRows()-1,1),1).setDataValidation(scoreRule);

  let cfg = ss.getSheetByName(SETTINGS.CONFIG_SHEET);
  if (!cfg) cfg = ss.insertSheet(SETTINGS.CONFIG_SHEET);
  cfg.clear();
  cfg.getRange("A1:B5").setValues([
    ["Setting","Value"],
    ["Club Name", SETTINGS.CLUB_NAME],
    ["Recruitment Status","CLOSED"],
    ["Internal Notification Email", ""],
    ["Notes","Set Recruitment Status to CLOSED to stop submissions."]
  ]);
  cfg.getRange("A1:B1").setFontWeight("bold").setBackground("#DA6D3D").setFontColor("#FFFFFF");
  cfg.autoResizeColumns(1,2);
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

    const required = ["full_name","student_id","email","phone","major","academic_year","team_first","team_second","preferred_role","availability","in_person","evidence","motivation","scenario","campus_impact"];
    for (const key of required) {
      if (!String(data[key] || "").trim()) {
        return reply_({ok:false,message:"Missing required field: " + key}, data);
      }
    }

    if (!isValidEmail_(data.email)) {
      return reply_({ok:false,message:"Invalid email address."}, data);
    }

    if (!isTrue_(data.commitment) || !isTrue_(data.accuracy) || !isTrue_(data.privacy)) {
      return reply_({ok:false,message:"Required acknowledgements were not accepted."}, data);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SETTINGS.APPLICATIONS_SHEET);
    if (!sheet) throw new Error("Applications sheet not found. Run setup() first.");

    const existing = findDuplicate_(sheet, String(data.student_id).trim(), String(data.email).trim().toLowerCase());
    if (existing) {
      return reply_({
        ok:true,
        duplicate:true,
        application_id: existing.application_id,
        message:"An application already exists for this student ID or email."
      }, data);
    }

    const applicationId = makeApplicationId_();
    const record = Object.assign({}, data, {
      server_received_at: new Date(),
      application_id: applicationId,
      status: "New",
      reviewer: "",
      review_score: "",
      review_notes: ""
    });

    const row = HEADERS.map(h => sanitize_(record[h]));
    sheet.appendRow(row);

    if (SETTINGS.SEND_APPLICANT_EMAIL) {
      try { sendApplicantReceipt_(record); } catch (mailErr) { console.error(mailErr); }
    }

    const internalEmail = getConfigValue_("Internal Notification Email");
    if (internalEmail && isValidEmail_(internalEmail)) {
      try { sendInternalNotification_(record, internalEmail); } catch (mailErr) { console.error(mailErr); }
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

  const idCol = HEADERS.indexOf("student_id") + 1;
  const emailCol = HEADERS.indexOf("email") + 1;
  const appIdCol = HEADERS.indexOf("application_id") + 1;

  const ids = sheet.getRange(2,idCol,last-1,1).getValues().flat().map(v=>String(v).trim());
  const emails = sheet.getRange(2,emailCol,last-1,1).getValues().flat().map(v=>String(v).trim().toLowerCase());

  for (let i=0;i<ids.length;i++) {
    if (ids[i] === studentId || emails[i] === email) {
      return {application_id: sheet.getRange(i+2,appIdCol).getValue()};
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

function sendApplicantReceipt_(record) {
  MailApp.sendEmail({
    to: record.email,
    subject: SETTINGS.CLUB_NAME + " — Application received",
    htmlBody:
      "<p>Hi " + escapeHtml_(record.full_name) + ",</p>" +
      "<p>Your founding team application has been received.</p>" +
      "<p><b>Application ID:</b> " + escapeHtml_(record.application_id) + "</p>" +
      "<p><b>First preference:</b> " + escapeHtml_(record.team_first) + "</p>" +
      "<p>Keep this ID for reference. If you are shortlisted, the recruitment team will contact you.</p>" +
      "<p>— " + escapeHtml_(SETTINGS.CLUB_NAME) + "</p>"
  });
}

function sendInternalNotification_(record, recipient) {
  MailApp.sendEmail({
    to: recipient,
    subject: "New application — " + record.full_name,
    htmlBody:
      "<p><b>" + escapeHtml_(record.full_name) + "</b> submitted a new application.</p>" +
      "<p><b>ID:</b> " + escapeHtml_(record.application_id) + "<br>" +
      "<b>Team:</b> " + escapeHtml_(record.team_first) + "<br>" +
      "<b>Role:</b> " + escapeHtml_(record.preferred_role) + "</p>"
  });
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
