import { getAccessToken } from "@base44/sdk";
export const appParams = {
  ...(!(typeof window === "undefined") &&
    new URLSearchParams(window.location.search).get("clear_access_token") ===
      "true" &&
    (window.localStorage.removeItem("base44_access_token"),
    window.localStorage.removeItem("token")),
  {
    appId: "6abf112b741fbf2e10f325d2",
    token: getAccessToken(),
    functionsVersion: "prod",
    appBaseUrl: undefined,
  }),
};
export const {
  appId: appId,
  token: token,
  functionsVersion: functionsVersion,
  appBaseUrl: appBaseUrl,
} = appParams;
