# Nesiha Clinic — staff mobile app

Flutter version of the web staff portal (`../Frontend`). It talks to the
same backend and database, with the same roles, endpoints and payloads,
and the same lavender look in light and dark mode.

## Run it

```bash
flutter pub get
flutter run                      # uses the production API by default
```

To point it at another backend (for example the local copy in `api/`):

```bash
# Android emulator → your PC's localhost is 10.0.2.2
flutter run --dart-define=API_URL=http://10.0.2.2:5000/api/v1 \
            --dart-define=SOCKET_URL=http://10.0.2.2:5000
```

Defaults live in `lib/core/config.dart`.

## What's in it

Everything in the web staff portal, for every role:

| Role | Tabs | Under "More" |
|---|---|---|
| Doctor | Home · Queue · Patients · Visits | Booking requests · Appointments · Medicines · Laboratory · Pharmacy · Reports |
| Data clerk | Home · Patients · Visits · Bookings | Appointments · Medicines · Laboratory · Pharmacy |
| Cashier | Home · Cashier · Patients | Pharmacy |
| Super admin | Home · Staff | Website content · Settings |
| Staff manager | Home · Staff | — |

Every role also gets profile, language, light/dark/system theme, change
password and sign out under **More**.

- **Dashboard**: a per-role summary with a progress ring, today's insight
  and live tiles (same data and wording as the web dashboard).
- **Patients**: search, details with allergy and chronic-disease alerts,
  recent prescriptions and test results, attachments (upload, open, and
  delete for doctors), visit history, registration (with the 200 ETB fee),
  editing, and deletion (doctors).
- **Visits & appointments**: walk-ins go straight to the doctor's queue,
  appointments are scheduled ahead, and patients are checked in on the day.
- **Doctor's queue → consultation**: five tabs. Notes save themselves as
  you type. Vital signs calculate BMI and flag out-of-range readings.
  Investigations can be requested and cancelled. Herbal prescriptions come
  from stock. The patient file shows the follow-up status, recent
  prescriptions, results and attachments. The prescription slip prints,
  and completing a visit sends it to the cashier when anything is unpaid.
- **Laboratory**: requests by status, start processing, enter results.
- **Pharmacy**: prescriptions by status; doctors and cashiers dispense from
  stock.
- **Cashier**: pending bills, payment by cash, transfer or mobile money,
  recent payments, and printable receipts.
- **Medicines**: stock with add, edit and delete (by role, as on the web).
- **Reports** (doctor): daily, weekly or monthly revenue with a by-day
  chart, payment-method breakdowns and transaction lists.
- **Booking requests**: requests from the website can be marked
  contacted, declined, or registered as patients (the form opens
  pre-filled).
- **Staff**: stats, search and role filter, create, edit, activate or
  deactivate, reset password, delete.
- **Website content** (super admin): testimonials, success stories, FAQs,
  team, partners, banners and services, with text in all four languages,
  images, publish/draft and reordering.
- **Settings** (super admin): clinic details, logo, website text in four
  languages, contact and social links, working hours and days, operations,
  legal.
- **Printing**: receipts and prescription slips are built as 80 mm PDFs and
  open the system print/share sheet.
- **Real time**: Socket.IO over HTTP long-polling, the same as the web
  portal, because the host can't upgrade to WebSockets. Every screen
  refreshes on the same events as its web page, and the same toasts appear.
  Lists also poll every so often as a backup.

## Languages

English, Afaan Oromoo, Amharic and Arabic (right-to-left), chosen under
**More → Language** or on the sign-in screen, and applied immediately.

- `assets/i18n/web/<code>.json` are copies of the web portal's
  `Frontend/src/i18n/locales/<code>/translation.json`, so both clients use
  the same keys and wording. After editing the web translations, re-copy them:

  ```bash
  dart run tool/sync_translations.dart
  ```

- `assets/i18n/mobile/<code>.json` hold the few strings that only exist on
  mobile (under `mobile.`). Keep the four files' keys identical.
- In code, use `tr('key', {'name': value})` for text and `trl('key')` for a
  web label used as a field label (it drops the web's trailing ` *`).

## Code layout

```
lib/
  core/       config, API client (token refresh), socket, formatting, printing, list-state helpers
  data/       clinic_api.dart: every backend call in one place (incl. uploads)
  i18n/       translation loader, language picker
  models/     tolerant JSON wrappers (MySQL decimals arrive as strings, etc.)
  state/      auth + theme controllers (provider)
  theme/      brand colors and light/dark palettes (from Frontend/src/index.css)
  widgets/    glass cards, buttons, pills, toasts, page frame, form fields
  features/   one folder per screen
test/         widget tests per role against a fake API (test/support/fake_api.dart)
tool/         sync_translations.dart
```

> Flutter 3.47 moved Material into the separate `material_ui` package.
> Import `package:material_ui/material_ui.dart`, not
> `package:flutter/material.dart`; mixing the two breaks types such as
> `TextTheme`.

## Tests

```bash
flutter analyze
flutter test
```

`test/socket_service_test.dart` checks the real-time client end to end and
is skipped unless `SOCKET_IT_URL` points at a Socket.IO server configured
like `Backend/src/config/socket.js` (polling only, JWT auth) that also serves
test tokens at `/token?role=…`.
