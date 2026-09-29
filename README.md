# Claude Builder Club — AOU Egypt
## Founding Team Recruitment Website

Production-ready recruitment system prepared for the official launch.

The public application is **disabled by default**. The site can be deployed in staging now, but nobody can submit until `IS_LIVE` is switched on.

## Architecture

```
Applicant
   ↓
Vercel website
   ↓ same-origin POST
/api/submit
   ↓ server-side proxy
Google Apps Script Web App
   ↓
Google Sheet: CBC AOU Egypt — Recruitment 2026
```

The Apps Script URL is stored server-side in Vercel as `GOOGLE_APPS_SCRIPT_URL`; it is not exposed in browser code.

## Included

- Responsive recruitment site
- 5-step application flow
- Team-specific dynamic questions
- Required-field validation + consent capture
- Honeypot spam field
- Duplicate prevention by Student ID/email
- Unique application IDs
- Google Sheets application database
- Review workflow: New → Shortlisted → Interview → Accepted / Waitlist / Rejected
- Reviewer, score and notes columns
- Applicant confirmation email
- Optional internal notification email controlled from the Config sheet
- Server-side OPEN/CLOSED switch
- Formula-injection protection
- Vercel security headers
- Staging/launch switch

## Files

- `index.html` — website
- `styles.css` — UI
- `app.js` — form and application logic
- `config.js` — public launch switch
- `api/submit.js` — Vercel serverless proxy
- `vercel.json` — deployment/security configuration
- `apps-script/Code.gs` — Google Apps Script backend
- `apps-script/appsscript.json` — Apps Script manifest
- `LAUNCH_GUIDE.md` — final setup steps

## Launch checklist

Before setting `IS_LIVE: true`:

1. receive the authorization needed to launch the club,
2. deploy `apps-script/Code.gs` as a Google Apps Script Web App,
3. add its `/exec` URL to Vercel as `GOOGLE_APPS_SCRIPT_URL`,
4. submit one end-to-end test application,
5. verify the Sheet row + confirmation email,
6. then switch `IS_LIVE` to `true`.

Never commit passwords, OAuth tokens, or private credentials to this repository.
