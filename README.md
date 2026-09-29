# Claude Builder Club — AOU Egypt
## Founding Team Recruitment Website

Official-launch-ready recruitment system for the club founding team.

**Public site target:** `https://mhmdwaelanwr.github.io/form/`

The site is intentionally **closed by default**. It can be published now as a staging/coming-soon page, while real applications stay blocked until launch.

## Architecture

```
Applicant
   ↓
GitHub Pages
   ↓ cross-origin form transport
Google Apps Script Web App
   ↓
Google Sheet: CBC AOU Egypt — Recruitment 2026
```

The Google Apps Script `/exec` URL is a public web endpoint used by the form. It is not a password or secret.

## Included

- Responsive recruitment website
- 5-step multi-role application form
- Team-specific dynamic questions
- Required-field validation
- Consent capture
- Honeypot spam field
- Duplicate protection by Student ID / email
- Unique Application IDs
- Google Sheets applicant database
- Review workflow: New → Shortlisted → Interview → Accepted / Waitlist / Rejected
- Reviewer, score and notes columns
- Applicant confirmation email
- Club inbox notification support
- Server-side OPEN/CLOSED switch
- Formula-injection protection
- GitHub Pages deployment workflow
- Staging / official-launch switch

## Official club contact

`claudebuilder.aou@gmail.com`

## Repository files

- `index.html` — website
- `styles.css` — UI
- `app.js` — application flow
- `config.js` — public launch configuration
- `apps-script/Code.gs` — Google Apps Script backend
- `apps-script/appsscript.json` — Apps Script manifest
- `.github/workflows/pages.yml` — GitHub Pages deployment
- `LAUNCH_GUIDE.md` — final setup instructions

## Before official launch

1. Enable GitHub Pages with **Source = GitHub Actions**.
2. Deploy `apps-script/Code.gs` as a Google Apps Script Web App.
3. Put the returned `/exec` URL in `config.js`.
4. Submit one end-to-end test application.
5. Verify the Sheet row and applicant receipt email.
6. Keep `IS_LIVE: false` until the official launch.
7. On launch day, switch it to `true`.

Never commit passwords, OAuth tokens, recovery codes, or private credentials.
