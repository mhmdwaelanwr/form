/*
  GITHUB PAGES LAUNCH CONFIGURATION

  Keep IS_LIVE = false while preparing the club.
  After the Google Apps Script Web App is deployed:
  1) paste its /exec URL into SUBMISSION_ENDPOINT,
  2) test one application,
  3) keep IS_LIVE false until the official launch,
  4) switch IS_LIVE to true on launch day.

  The Apps Script /exec URL is a public web endpoint, not a password or private key.
*/
window.CLUB_CONFIG = {
  IS_LIVE: true,

  // Paste the Google Apps Script Web App URL ending in /exec here.
  SUBMISSION_ENDPOINT: "https://script.google.com/macros/s/AKfycbzH7s_5RU_h40YDqd57pbPo1jMJ-FOMXtFRvHTFHhLJXQrbvoqf3N3gq1L-VmwTK2i83Q/exec",

  // Optional ISO timestamp. Leave blank if you do not want an automatic close.
  APPLICATIONS_CLOSE_AT: "",

  // Official club contact email.
  CONTACT_EMAIL: "claudebuilder.aou@gmail.com"
};
