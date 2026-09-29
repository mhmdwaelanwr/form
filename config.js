/*
  LAUNCH CONFIGURATION

  Keep IS_LIVE = false while preparing the site.

  Production flow:
  - Website is deployed on Vercel.
  - The browser submits to /api/submit (same origin).
  - Vercel securely forwards to Google Apps Script using the
    GOOGLE_APPS_SCRIPT_URL environment variable.
  - The Apps Script URL is never exposed in client-side code.
*/
window.CLUB_CONFIG = {
  IS_LIVE: false,

  // Same-origin Vercel serverless endpoint.
  SUBMISSION_ENDPOINT: "/api/submit",

  // Optional ISO timestamp. Leave blank if you do not want an automatic close.
  APPLICATIONS_CLOSE_AT: "",

  // Optional public contact address shown in the footer.
  CONTACT_EMAIL: ""
};
