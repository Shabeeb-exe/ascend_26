# Ascend '26 — Official Web Portal

Official website for **Ascend '26** (16–17 November 2026), the 27th national-level management fest of the
**Department of Commerce and Management Studies (DCMS), University of Calicut, Kerala**.

Live: https://ascend26.vercel.app/

## Tech stack
* **Markup:** HTML5 (`index.html`) — single page, views switch via URL hash (`#events`, `#register`, …)
* **Styling:** Tailwind CSS v3 (pre-built to `css/tailwind.css`) + custom CSS (`css/styles.css`)
* **Logic & data:** vanilla JavaScript (`js/app.js`, `js/data.js`), QR via `js/vendor/qrcode.js`
* **Registrations:** Google Apps Script → Google Sheet (`apps-script/Code.gs`)

## Run locally
No build step is needed to view the site — just serve the folder:
```bash
npx serve .
```

## Editing
* **Event details, fees, team sizes, UPI ID, sheet URL, WhatsApp number:** `js/data.js` (`SITE_CONFIG` + `EVENTS_DATA`)
* **Fee mode:** `SITE_CONFIG.feePerPerson` — `true` = fee × team members, `false` = flat per event
* **If you add/change Tailwind classes in HTML or JS**, rebuild the CSS and commit it:
  ```bash
  npm install
  npm run build:css
  ```

## Registration flow
1. Delegate fills the form → a Ref ID is generated, the row is saved to the Google Sheet as **Unpaid**.
2. Delegate pays by UPI (QR / button) quoting the Ref ID and clicks **I Have Paid**.
3. The same row becomes **Paid by delegate — pending verification** (UTR saved; a UTR already used by another
   registration is flagged **DUPLICATE UTR**).
4. The desk matches amount + UTR against the bank / UPI app history and types **YES** in the
   *Verified by desk* column (column R, a YES/NO dropdown). The script never overwrites that column.
5. The delegate opens **Register → Check status**, enters Ref ID + mobile number, and sees the confirmed pass
   (also restored automatically after a refresh on the same device).

## Deploying the Apps Script
See the instructions at the top of `apps-script/Code.gs`. Redeploy as a **new version** after any change.

## Deploy
Pushed to GitHub → auto-deployed on Vercel (static site, no build command, output directory = repo root).
