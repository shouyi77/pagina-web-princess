# La Palma Princess

## Local development

1. Copy `.env.example` to `.env`. Add SMTP settings if you want confirmation emails to be delivered.
2. Install the backend dependencies with `py -m pip install -r requirements.txt`.
3. In one terminal, start the API with `py servidor.py`.
4. In another terminal, serve this folder with `py -m http.server 8000`, then open `http://localhost:8000`.

The API stores booking requests, service appointments and newsletter consent in `reservas.sqlite3`. Keep that file on a persistent disk when deploying; it contains personal data and is excluded from Git. Configure `CORS_ORIGINS` with the exact website origin and `PUBLIC_BASE_URL` with the public website URL. The frontend defaults to the existing API host in `script.js`; set `window.PRINCESS_API_BASE` before loading `script.js` if deploying the API elsewhere.

SMTP is optional for local testing. Requests are still stored when email is not configured, and the website reports the delivery state instead of claiming an email was sent. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, and the TLS settings in `.env` to send confirmations and newsletter messages.

Room rates, room inventory, service capacities and appointment times are demonstration values in `servidor.py`, not hotel rates or live hotel inventory. Replace them with an authorized booking system before accepting real hotel bookings.

The language selector supports Spanish, English and German for the website's main content. Excursion durations and difficulty are estimates; check current access and safety notices before travelling.
