# Claude Builder Club — AOU Egypt
# Final Launch Guide

## Already prepared

- GitHub repository and website
- GitHub Pages deployment workflow
- Google Sheet applicant database
- Applications + Config tabs
- Review status workflow
- Official club email in the website
- Recruitment closed by default

Target public URL:

`https://mhmdwaelanwr.github.io/form/`

## 1. One-time GitHub Pages switch

GitHub requires the repository owner to enable Pages once:

**Repository → Settings → Pages → Build and deployment → Source → GitHub Actions**

After that, open **Actions → Deploy to GitHub Pages → Run workflow** if the latest deployment did not rerun automatically.

## 2. Deploy Google Apps Script

Open the recruitment Google Sheet and choose:

**Extensions → Apps Script**

Paste the repository file:

`apps-script/Code.gs`

Then:

1. Run `setup()` once.
2. Approve Google's authorization.
3. **Deploy → New deployment**
4. Type: **Web app**
5. Execute as: **Me**
6. Choose an access level that allows your intended applicants to submit.
7. Deploy.
8. Copy the URL ending in `/exec`.

Do not share your Google password, OAuth token, recovery code or any private credential.

## 3. Give me only the /exec URL

Put that URL into `config.js` as:

```js
SUBMISSION_ENDPOINT: "https://script.google.com/macros/s/.../exec"
```

The public form will then be technically connected, but still closed because:

```js
IS_LIVE: false
```

## 4. Test

Temporarily set `IS_LIVE: true`, submit one test application, and verify:

- row appears in Applications,
- application ID is returned,
- applicant confirmation email arrives,
- duplicate Student ID/email does not create a second row,
- club inbox receives a notification if configured.

Then set `IS_LIVE: false` again until launch.

## 5. Official launch

On the launch day:

```js
IS_LIVE: true
```

Optional:

```js
APPLICATIONS_CLOSE_AT: "2026-10-15T23:59:59+03:00"
```

## Emergency stop

In the Google Sheet → `Config`:

Change:

`Recruitment Status | OPEN`

to:

`Recruitment Status | CLOSED`

This stops new applications from the backend even if an older website build remains online.

## Review columns

- `status`
- `reviewer`
- `review_score`
- `review_notes`

Suggested scoring:

| Area | Points |
|---|---:|
| Evidence / previous work | 30 |
| Ownership / scenario thinking | 25 |
| Role-specific fit | 20 |
| Communication | 15 |
| Availability / reliability | 10 |
| **Total** | **100** |
