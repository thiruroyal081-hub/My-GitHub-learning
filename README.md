# Ganesh Utsav Village Website

A dependency-free, responsive website for a village Ganesh Utsav. It includes a celebration plan, event schedule, memory wall, countdown, and participation form.

## Run the website

You need Python 3. From this folder, run:

```bash
python3 server.py
```

Then open this address in a browser:

```text
http://127.0.0.1:4173
```

To use another port:

```bash
PORT=8080 python3 server.py
```

## Participation form

The form works without a database: it opens the visitor's default email application with their selected contribution pre-filled. Change `ganeshutsav@example.com` in `script.js` to the village organiser's real email address before publishing.

## Publish online with GitHub Pages

This repository includes a GitHub Actions deployment workflow in `.github/workflows/deploy-pages.yml`.

1. Push this branch and merge it into `main` on GitHub.
2. In the GitHub repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. Open the **Actions** tab and wait for **Deploy Ganesh Utsav website to GitHub Pages** to finish.
5. GitHub will show the public URL in that workflow’s deployment summary. It will normally be:

```text
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY-NAME/
```

After deployment, the website works from any phone or computer with internet access. `server.py` remains available only for local previews.

## Donation records

The donation ledger includes previous contribution entries, a total, and a CSV export button. New entries are saved in the browser's local storage, so they remain available after refresh on the same phone or computer. Download the CSV after updates and keep it with the village committee's records. For one shared record across every device, connect the form to a secure database before relying on it for official accounts.

## Temple donation management demo

The **Temple Donations / ఆలయ విరాళాలు** section is a frontend demo designed to be connected to Flask + SQLite later. It gives each donation a unique yearly receipt number, keeps new entries pending until an admin verifies them, and shows only verified records in the public temple ledger. Transaction IDs are masked in public views and CSV exports. The form data is stored only in the current browser's local storage, so it is not yet a secure multi-admin accounting system; use a server-side database and authentication before using it for official financial records.
