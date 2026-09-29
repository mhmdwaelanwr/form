# Launch Guide — 10 minutes

## 1. Create the applications database
1. Go to Google Sheets and create a new spreadsheet.
2. Suggested name: `CBC AOU Egypt — Recruitment 2026`.
3. Open **Extensions → Apps Script**.
4. Replace the default code with `apps-script/Code.gs`.
5. In Apps Script, open **Project Settings** and confirm the time zone is Cairo, or add the included `appsscript.json`.
6. Select the `setup` function and click **Run**.
7. Approve the requested permissions.
8. Return to the Sheet. You will now have:
   - `Applications`
   - `Config`

## 2. Deploy the backend
1. In Apps Script click **Deploy → New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Choose the access setting that lets your intended applicants submit.
5. Deploy.
6. Copy the URL ending in `/exec`.

## 3. Connect the website
Open `config.js` and paste the `/exec` URL:

```js
window.CLUB_CONFIG = {
  IS_LIVE: false,
  SUBMISSION_ENDPOINT: "PASTE_YOUR_EXEC_URL_HERE",
  APPLICATIONS_CLOSE_AT: "",
  CONTACT_EMAIL: ""
};
```

Keep `IS_LIVE: false` while testing.

## 4. Test before launch
Temporarily set:
```js
IS_LIVE: true
```
Open the website and submit one test application.

Check:
- A new row appears in `Applications`
- Application ID was generated
- Applicant email receipt arrived
- Duplicate submission returns the same application ID

Then delete the test row if you want.

## 5. Official launch
When you are ready:
```js
IS_LIVE: true
```

Deploy the website folder to Vercel, Netlify, GitHub Pages or Cloudflare Pages.

## 6. Close recruitment
You have two options.

### Website-side close
Set an automatic date in `config.js`:
```js
APPLICATIONS_CLOSE_AT: "2026-10-15T23:59:59+03:00"
```

### Server-side emergency close
In the Google Sheet, open `Config` and change:
`Recruitment Status` from `OPEN` to `CLOSED`.

The server will reject new applications even if an old website copy is still online.

## Suggested reviewing workflow
Use the `Applications` sheet columns:
- `status`
- `reviewer`
- `review_score`
- `review_notes`

Recommended score:
- Evidence / previous work — 30
- Ownership / scenario thinking — 25
- Role-specific fit — 20
- Communication — 15
- Availability / reliability — 10
Total — 100

Suggested shortlist threshold: decide after seeing the applicant pool; don't hard-code it before applications arrive.
