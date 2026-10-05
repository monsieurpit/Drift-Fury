import { createClient } from "@base44/sdk";
import {
  appBaseUrl,
  appId,
  functionsVersion,
  token,
} from "../lib/app-params.js";
export const base44 = createClient({
  appId: appId,
  token: token,
  functionsVersion: functionsVersion,
  serverUrl: "",
  appBaseUrl: appBaseUrl,
});
