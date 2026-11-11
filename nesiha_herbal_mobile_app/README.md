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

| Role | Tabs | Under "More" |
|---|---|---|
| Doctor | Home · Queue · Patients · Visits | Booking requests · Appointments · Medicines |
| Data clerk | Home · Patients · Visits · Bookings | Appointments · Medicines |
| Cashier | Home · Cashier · Patients | — |
| Super admin / Staff manager | Home · Staff | — |

Every role also gets profile, light/dark/system theme, change password
and sign out under **More**.

- **Dashboard**: a per-role summary with a progress ring, today's insight
  and live tiles (same data as the web dashboard).
- **Patients**: search, details with allergy and chronic-disease alerts,
  visit history, and registration (with the 200 ETB fee) or editing.
- **Visits & appointments**: walk-ins go straight to the doctor's queue,
  appointments are scheduled ahead, and patients are checked in on the day.
- **Doctor's queue → consultation**: notes save themselves as you type,
  herbal prescriptions come from stock, past visits are one tab away, and
  completing a visit sends it to the cashier when anything is unpaid.
- **Cashier**: pending bills, payment by cash, transfer or mobile money,
  and recent payments.
- **Booking requests**: requests from the website can be marked
  contacted, declined, or registered as patients (the form opens
  pre-filled).
- **Staff**: a directory where accounts can be activated or deactivated.
- **Real time**: Socket.IO over HTTP long-polling, the same as the web
  portal, because the host can't upgrade to WebSockets. Lists also poll
  every so often as a backup.

## Code layout

```
lib/
  core/       config, API client (token refresh), socket, formatting, list-state helpers
  data/       clinic_api.dart: every backend call in one place
  models/     tolerant JSON wrappers (MySQL decimals arrive as strings, etc.)
  state/      auth + theme controllers (provider)
  theme/      brand colors and light/dark palettes (from Frontend/src/index.css)
  widgets/    glass cards, buttons, pills, toasts, page frame
  features/   one folder per screen
test/         widget tests per role against a fake API (test/support/fake_api.dart)
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

## Not ported yet

Vital signs and investigations in the consultation, laboratory and
pharmacy pages, reports, settings, website content management, adding and
editing medicines and staff, file attachments, printing prescriptions and
receipts, and the four interface languages (en/om/am/ar).
