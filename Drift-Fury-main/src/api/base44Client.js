import { createClient } from "@base44/sdk";
import { appBaseUrl, appId, functionsVersion, token } from "../lib/app-params.js";

// The game runs fully client-side; this client only backs the optional sign-in checks.
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: "",
  appBaseUrl,
});
