# Claude Builder Club — AOU Egypt
## Production-ready Founding Team Recruitment Website

This repository contains the official-launch-ready recruitment website for the founding team of Claude Builder Club — AOU Egypt.

The public form is intentionally disabled by default. It only becomes active when the launch configuration is switched to live and the Google Apps Script backend is connected.

### Included
- Responsive recruitment website
- Founding teams and role descriptions
- 5-step multi-role application form
- Dynamic questions based on selected team
- Required-field validation
- Duplicate prevention by Student ID or email
- Unique Application IDs
- Google Sheets application database
- Review workflow: New → Shortlisted → Interview → Accepted / Waitlist / Rejected
- Reviewer, score and notes columns
- Applicant confirmation email
- Optional internal notification email
- Server-side OPEN/CLOSED switch
- Formula-injection protection for Sheets
- Automatic Google Sheet setup

## Files
- `index.html` — website
- `styles.css` — styling
- `app.js` — client logic
- `config.js` — launch configuration
- `apps-script/Code.gs` — Google Apps Script backend
- `apps-script/appsscript.json` — Apps Script manifest
- `LAUNCH_GUIDE.md` — launch instructions

## Launch checklist
Do not set `IS_LIVE: true` until:
1. the club is authorized to launch,
2. the Apps Script backend is deployed,
3. the Web App `/exec` URL is added to `config.js`,
4. one end-to-end test application has succeeded.

No private keys or passwords belong in the browser code.
