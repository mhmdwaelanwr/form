# Launch Guide

Most of the system is already prepared.

The Google Sheet **CBC AOU Egypt — Recruitment 2026** already exists with:
- Applications sheet
- Config sheet
- review status workflow
- reviewer / score / notes fields

The only Google-side step that must be done manually is deploying the Apps Script Web App, because that action requires your Google authorization.

## Step 1 — Attach the Apps Script backend

1. Open the recruitment Google Sheet.
2. Choose **Extensions → Apps Script**.
3. Replace the default `Code.gs` with the repository file:
   `apps-script/Code.gs`
4. If you use the manifest editor, use:
   `apps-script/appsscript.json`
5. Run `setup()` once and approve Google's authorization prompts.

> `setup()` refuses to overwrite the sheet after real applications exist.

## Step 2 — Deploy it

1. **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Select an access level that allows the intended AOU applicants to submit.
5. Deploy.
6. Copy the URL ending in `/exec`.

Do not send any password or Google credential. The `/exec` URL is enough.

## Step 3 — Connect Vercel

The website submits to `/api/submit`, so the Google Apps Script URL stays server-side.

In the Vercel project add this environment variable:

- Name: `GOOGLE_APPS_SCRIPT_URL`
- Value: the Apps Script `/exec` URL

Apply it to the environments you intend to use and redeploy.

## Step 4 — End-to-end test

Keep `IS_LIVE: false` while configuring.

For the test, change `config.js` to:

```js
IS_LIVE: true
```

Submit one test application and confirm:

- a row appears in `Applications`,
- an ID such as `CBC-AOU-YYYYMMDD-XXXXXX` is returned,
- the applicant confirmation email arrives,
- a duplicate Student ID/email does not create another row.

After testing, switch back to `false` until official launch.

## Step 5 — Official launch

When the club is ready to go public:

```js
IS_LIVE: true
```

Optionally set:

```js
APPLICATIONS_CLOSE_AT: "2026-10-15T23:59:59+03:00"
CONTACT_EMAIL: "your-public-club-email@example.com"
```

## Emergency close

The Google Sheet has a `Config` tab.

Change:

`Recruitment Status | OPEN`

to:

`Recruitment Status | CLOSED`

The backend will reject new applications even if an old public website build is still available.

## Internal notifications

In the `Config` sheet, put a valid address beside:

`Internal Notification Email`

Every successful new application will then send a notification to that address.

## Review workflow

Use these columns in `Applications`:

- `status`
- `reviewer`
- `review_score`
- `review_notes`

Suggested scoring model:

| Area | Points |
|---|---:|
| Evidence / previous work | 30 |
| Ownership / scenario thinking | 25 |
| Role-specific fit | 20 |
| Communication | 15 |
| Availability / reliability | 10 |
| **Total** | **100** |

Choose the shortlist threshold after seeing the applicant pool rather than hard-coding it before recruitment.
