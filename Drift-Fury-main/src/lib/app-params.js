import { getAccessToken } from "@base44/sdk";
const isBrowser = typeof window !== "undefined";
// ?clear_access_token=true signs the visitor out before anything else reads the token.
if (isBrowser && new URLSearchParams(window.location.search).get("clear_access_token") === "true") {
  window.localStorage.removeItem("base44_access_token");
  window.localStorage.removeItem("token");
}
export const appParams = {
  appId: "6abf112b741fbf2e10f325d2",
  token: getAccessToken(),
  functionsVersion: "prod",
  appBaseUrl: undefined,
};
export const { appId, token, functionsVersion, appBaseUrl } = appParams;
