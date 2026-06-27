# Office Dino Global Leaderboard MVP

Use [office-dino-leaderboard.gs](/D:/SiamSmile_Work/Workshop/json-diff/apps-script/office-dino-leaderboard.gs) as the Google Apps Script backend for the shared leaderboard.

## Quick setup

1. Create a Google Sheet for the leaderboard.
2. Create a new Apps Script project.
3. Copy the script from `office-dino-leaderboard.gs`.
4. In Apps Script project settings, add script property `SPREADSHEET_ID` with your Google Sheet ID.
5. Deploy the script as a web app.
6. Set access so anyone with the link can use it.
7. Copy the `/exec` web app URL.
8. Paste that URL into:
   - [index.html](/D:/SiamSmile_Work/Workshop/json-diff/index.html) meta `office-dino-global-endpoint`
   - [office-dino.html](/D:/SiamSmile_Work/Workshop/json-diff/pages/office-dino.html) meta `office-dino-global-endpoint`

## Behavior

- Each submitted run is appended to the sheet.
- The API returns the best score per player name for the requested speed mode.
- The frontend shows only the top 20 rows.
- Existing rows without a speed mode are treated as `normal`.
- After updating `office-dino-leaderboard.gs`, redeploy the Apps Script web app as a new version so the `/exec` URL uses the latest code.

## Endpoints

- `GET ?action=leaderboard&limit=20&speedMode=normal&callback=...`
  Returns JSONP for the shared leaderboard filtered by `baby`, `easy`, `normal`, or `hard`.
- `POST action=submit`
  Accepts `name`, `score`, `level`, `speedMode`, `speedLabel`, and `timestamp`.
