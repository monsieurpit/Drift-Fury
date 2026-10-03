# Drift-Fury

Static Drift Fury site snapshot.

The game runs client-side and does not require Base44 authentication or API services.

On phones, start a session to show the on-screen driving controls. Mobile browsers enable game audio from the session-start tap; touching a driving control also resumes audio if the browser suspended it.

## Run locally

Requires Node.js 20 or newer.

```sh
npm start
```

Railway detects the `start` script and supplies the port through `PORT`.
