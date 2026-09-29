/*
  LAUNCH CONFIGURATION
  Keep IS_LIVE = false while preparing the site.
  After official approval:
  1) deploy the Apps Script backend,
  2) paste its Web App URL below,
  3) set IS_LIVE = true,
  4) deploy the website.

  This file is client-side. Never place secrets or passwords here.
*/
window.CLUB_CONFIG = {
  IS_LIVE: false,

  // Example: "https://script.google.com/macros/s/XXXXXXXXXXXX/exec"
  SUBMISSION_ENDPOINT: "",

  // Optional ISO timestamp. Leave blank if you do not want an automatic close.
  APPLICATIONS_CLOSE_AT: "",

  // Optional public contact address shown in the footer.
  CONTACT_EMAIL: ""
};
