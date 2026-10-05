import "./styles/index.css";
import React from "react";
import * as ReactDOM from "react-dom/client";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cva } from "class-variance-authority";

import {
  XIcon,
  ArrowUpRightIcon,
  CoinsIcon,
  Volume2Icon,
  VolumeXIcon,
  ChevronRightIcon,
  Settings2Icon,
  Building2Icon,
  MountainIcon,
  RouteIcon,
  ShieldAlertIcon,
  TrophyIcon,
  CheckIcon,
  LockKeyholeIcon,
  FuelIcon,
  PauseIcon,
  ShieldIcon,
  StarIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  LogOutIcon,
  PlayIcon,
} from "lucide-react";

import {
  QueryClient,
  useQuery,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  useLocation,
  useNavigationType,
  Route,
  Routes,
  BrowserRouter,
} from "react-router-dom";
import { createClient, getAccessToken } from "@base44/sdk";

import {
  Mesh,
  Matrix3,
  Vector3,
  Sphere,
  Matrix4,
  BufferAttribute,
  BufferGeometry,
  ExtrudeGeometry,
  Shape,
  BoxGeometry,
  Group,
  CylinderGeometry,
  TorusGeometry,
  CanvasTexture,
  Object3D,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  SpotLight,
  RepeatWrapping,
  Vector2,
  Quaternion,
  Float32BufferAttribute,
  InstancedMesh,
  PointsMaterial,
  Points,
  ConeGeometry,
  PointLight,
  Color,
  PerspectiveCamera,
  Fog,
  Scene,
  HemisphereLight,
  DirectionalLight,
  AmbientLight,
  PMREMGenerator,
  WebGLRenderer,
} from "three";

import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { VignetteShader } from "three/addons/shaders/VignetteShader.js";
var v = 20;
var y = 1000000; /* 1e6 */

var b = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

var x = 0;
function S() {
  x = (x + 1) % Number.MAX_VALUE;
  return x.toString();
}
var C = new Map();

var w = (e) => {
  if (C.has(e)) {
    return;
  }
  let t = setTimeout(() => {
    C.delete(e);

    O({
      type: b.REMOVE_TOAST,
      toastId: e,
    });
  }, y);
  C.set(e, t);
};

var T = (e, t) => {
  switch (t.type) {
    case b.ADD_TOAST: {
      return {
        ...e,
        toasts: [t.toast, ...e.toasts].slice(0, v),
      };
    }
    case b.UPDATE_TOAST: {
      return {
        ...e,
        toasts: e.toasts.map((e) => {
          return e.id === t.toast.id
            ? {
                ...e,
                ...t.toast,
              }
            : e;
        }),
      };
    }
    case b.DISMISS_TOAST: {
      let { toastId: n } = t;

      if (n) {
        w(n);
      } else {
        e.toasts.forEach((e) => {
          w(e.id);
        });
      }

      return {
        ...e,
        toasts: e.toasts.map((e) => {
          return e.id === n || n === undefined
            ? {
                ...e,
                open: false,
              }
            : e;
        }),
      };
    }
    case b.REMOVE_TOAST: {
      return t.toastId === undefined
        ? {
            ...e,
            toasts: [],
          }
        : {
            ...e,
            toasts: e.toasts.filter((e) => {
              return e.id !== t.toastId;
            }),
          };
    }
  }
};

var E = [];

var D = {
  toasts: [],
};

function O(e) {
  D = T(D, e);

  E.forEach((e) => {
    e(D);
  });
}
function k({ ...e }) {
  let t = S();

  let n = (e) => {
    return O({
      type: b.UPDATE_TOAST,
      toast: {
        ...e,
        id: t,
      },
    });
  };

  let r = () => {
    return O({
      type: b.DISMISS_TOAST,
      toastId: t,
    });
  };

  O({
    type: b.ADD_TOAST,
    toast: {
      ...e,
      id: t,
      open: true,
      onOpenChange: (e) => {
        if (!e) {
          r();
        }
      },
    },
  });

  return {
    id: t,
    dismiss: r,
    update: n,
  };
}
function A() {
  let [e, t] = React.useState(D);

  React.useEffect(() => {
    E.push(t);

    return () => {
      let e = E.indexOf(t);

      if (e > -1) {
        E.splice(e, 1);
      }
    };
  }, [e]);

  return {
    ...e,
    toast: k,
    dismiss: (e) => {
      return O({
        type: b.DISMISS_TOAST,
        toastId: e,
      });
    },
  };
}
function Hr(...e) {
  return twMerge(clsx(e));
}
window.self;
window.top;
var Ur = ToastPrimitives.Provider;

var Wr = React.forwardRef(({ className: e, ...t }, n) => {
  return (
    <ToastPrimitives.Viewport
      ref={n}
      className={Hr(
        "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
        e
      )}
      {...t}
    />
  );
});

Wr.displayName = ToastPrimitives.Viewport.displayName;

var Gr = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

var Kr = React.forwardRef(({ className: e, variant: t, ...n }, r) => {
  return (
    <ToastPrimitives.Root
      ref={r}
      className={Hr(
        Gr({
          variant: t,
        }),
        e
      )}
      {...n}
    />
  );
});

Kr.displayName = ToastPrimitives.Root.displayName;
var qr = React.forwardRef(({ className: e, ...t }, n) => {
  return (
    <ToastPrimitives.Action
      ref={n}
      className={Hr(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
        e
      )}
      {...t}
    />
  );
});
qr.displayName = ToastPrimitives.Action.displayName;
var Jr = React.forwardRef(({ className: e, ...t }, n) => {
  return (
    <ToastPrimitives.Close
      ref={n}
      className={Hr(
        "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
        e
      )}
      toast-close=""
      {...t}
    >
      {<XIcon className="h-4 w-4" />}
    </ToastPrimitives.Close>
  );
});
Jr.displayName = ToastPrimitives.Close.displayName;
var Yr = React.forwardRef(({ className: e, ...t }, n) => {
  return (
    <ToastPrimitives.Title
      ref={n}
      className={Hr("text-sm font-semibold", e)}
      {...t}
    />
  );
});
Yr.displayName = ToastPrimitives.Title.displayName;
var Xr = React.forwardRef(({ className: e, ...t }, n) => {
  return (
    <ToastPrimitives.Description
      ref={n}
      className={Hr("text-sm opacity-90", e)}
      {...t}
    />
  );
});
Xr.displayName = ToastPrimitives.Description.displayName;
function Zr() {
  let { toasts: e } = A();
  return (
    <Ur>
      {e.map(function ({ id: e, title: t, description: n, action: r, ...i }) {
        return (
          <Kr {...i} key={e}>
            <div className="grid gap-1">
              {t && <Yr>{t}</Yr>}
              {n && <Xr>{n}</Xr>}
            </div>
            {r}
            <Jr />
          </Kr>
        );
      })}
      <Wr />
    </Ur>
  );
}
var Sa = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

var zp = {
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

var { appId: Bp, token: Vp, functionsVersion: Hp, appBaseUrl: Up } = zp;

var Wp = createClient({
  appId: Bp,
  token: Vp,
  functionsVersion: Hp,
  serverUrl: "",
  appBaseUrl: Up,
});

function Gp({}) {
  let e = useLocation().pathname.substring(1);

  let { data: t, isFetched: n } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        return {
          user: await Wp.auth.me(),
          isAuthenticated: true,
        };
      } catch {
        return {
          user: null,
          isAuthenticated: false,
        };
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      {
        <div className="max-w-md w-full">
          {
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h1 className="text-7xl font-light text-slate-300">404</h1>
                <div className="h-0.5 w-16 bg-slate-200 mx-auto" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-medium text-slate-800">
                  Page Not Found
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {"The page "}
                  <span className="font-medium text-slate-700">"{e}"</span>
                  {" could not be found in this application."}
                </p>
              </div>
              {n && t.isAuthenticated && t.user?.role === "admin" && (
                <div className="mt-8 p-4 bg-slate-100 rounded-lg border border-slate-200">
                  {
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center mt-0.5">
                        {<div className="w-2 h-2 rounded-full bg-orange-400" />}
                      </div>
                      <div className="text-left space-y-1">
                        <p className="text-sm font-medium text-slate-700">
                          Admin Note
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          This could mean that the AI hasn't implemented this
                          page yet. Ask it to implement it in the chat.
                        </p>
                      </div>
                    </div>
                  }
                </div>
              )}
              <div className="pt-6">
                {
                  <button
                    onClick={() => {
                      return (window.location.href = "/");
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      }
                    </svg>
                    Go Home
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  );
}
var Kp = React.createContext();

var Qp_1 = ({ children: e }) => {
  let [t, n] = React.useState(null);
  let [r, i] = React.useState(false);
  let [a, o] = React.useState(true);
  let [s, c] = React.useState(true);
  let [l, u] = React.useState(null);
  let [d, f] = React.useState(false);
  let [p, m] = React.useState(null);
  React.useEffect(() => {
    h();
  }, []);

  let h = async () => {
    try {
      c(true);
      u(null);
      if (!Wp?.app || typeof Wp.app.getPublicSettings != "function") {
        console.warn(
          "Base44 app SDK unavailable; continuing without app metadata."
        );

        m(null);
        o(false);
        i(false);
        f(true);
        c(false);
        return;
      }
      try {
        let e = await Wp.app.getPublicSettings();
        m(e);

        if (zp.token) {
          await g();
        } else {
          o(false), i(false), f(true);
        }

        c(false);
      } catch (e) {
        let t = e?.status;
        let n = t === 404 || t === 405 || t === 410 || t === 500 || !t;
        if (n) {
          console.warn(
            "Base44 app state unavailable; falling back to local static app mode.",
            e
          );

          m(null);
          o(false);
          i(false);
          f(true);
          c(false);
          return;
        }
        console.error("App state check failed:", e);

        if (e.status === 403 && e.data?.extra_data?.reason) {
          let t = e.data.extra_data.reason;
          u(
            t === "auth_required"
              ? {
                  type: "auth_required",
                  message: "Authentication required",
                }
              : t === "user_not_registered"
              ? {
                  type: "user_not_registered",
                  message: "User not registered for this app",
                }
              : {
                  type: t,
                  message: e.message,
                }
          );
        } else {
          u({
            type: "unknown",
            message: e.message || "Failed to load app",
          });
        }

        c(false);
        o(false);
      }
    } catch (e) {
      console.error("Unexpected error:", e);

      u({
        type: "unknown",
        message: e.message || "An unexpected error occurred",
      });

      c(false);
      o(false);
    }
  };

  let g = async () => {
    try {
      if (!Wp?.auth || typeof Wp.auth.me != "function") {
        o(false);
        i(false);
        f(true);
        return;
      }
      o(true);
      let e = await Wp.auth.me();
      n(e);
      i(true);
      o(false);
      f(true);
    } catch (e) {
      console.warn(
        "User auth check unavailable in local mode; continuing without auth.",
        e
      );

      o(false);
      i(false);
      f(true);

      if (e.status === 401 || e.status === 403) {
        u({
          type: "auth_required",
          message: "Authentication required",
        });
      }
    }
  };

  return (
    <Kp.Provider
      value={{
        user: t,
        isAuthenticated: r,
        isLoadingAuth: a,
        isLoadingPublicSettings: s,
        authError: l,
        appPublicSettings: p,
        authChecked: d,
        logout: (e = true) => {
          n(null);
          i(false);

          if (e) {
            Wp.auth.logout(window.location.href);
          } else {
            Wp.auth.logout();
          }
        },
        navigateToLogin: () => {
          Wp.auth.redirectToLogin(window.location.href);
        },
        checkUserAuth: g,
        checkAppState: h,
      }}
    >
      {e}
    </Kp.Provider>
  );
};

var Jp = () => {
  let e = React.useContext(Kp);
  if (!e) {
    throw Error("useAuth must be used within an AuthProvider");
  }
  return e;
};

var Yp = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50">
      {
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100">
          {
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-orange-100">
                {
                  <svg
                    className="w-8 h-8 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    }
                  </svg>
                }
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                Access Restricted
              </h1>
              <p className="text-slate-600 mb-8">
                You are not registered to use this application. Please contact
                the app administrator to request access.
              </p>
              <div className="p-4 bg-slate-50 rounded-md text-sm text-slate-600">
                <p>If you believe this is an error, you can:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Verify you are logged in with the correct account</li>
                  <li>Contact the app administrator for access</li>
                  <li>Try logging out and back in again</li>
                </ul>
              </div>
            </div>
          }
        </div>
      }
    </div>
  );
};

var Xp = (e) => {
  let t = e.slice(1);
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
};

function Zp() {
  let { pathname: e, hash: t } = useLocation();
  let n = useNavigationType();

  React.useEffect(() => {
    if (n !== "POP") {
      if (t) {
        let e = Xp(t);

        let n = window.setTimeout(() => {
          document.getElementById(e)?.scrollIntoView({
            behavior: "smooth",
          });
        }, 50);

        return () => {
          return window.clearTimeout(n);
        };
      }
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }
  }, [e, t, n]);

  return null;
}

var Qp = [
  {
    id: "sakura",
    name: "Elfen 9R",
    tag: "GERMAN • COUPE",
    color: "#a9b7bf",
    price: 0,
    grip: 1,
    shape: "porsche",
    description: "Coupé à moteur arrière. Équilibre et précision légendaires.",
  },
  {
    id: "outlaw",
    name: "Outlaw R",
    tag: "AMERICAN • MUSCLE",
    color: "#bf583b",
    price: 0,
    grip: 0.86,
    shape: "muscle",
    description: "Muscle car V8. Long capot, caractère brut, couple massif.",
  },
  {
    id: "spectre",
    name: "Spectre RS",
    tag: "EUROPEAN • SUPERCAR",
    color: "#c6dc77",
    price: 0,
    grip: 1.12,
    shape: "super",
    description: "Supercar à moteur central. V12 hurlant, ligne pure.",
  },
  {
    id: "titan",
    name: "Titan X",
    tag: "HYPERCAR • EXTREME",
    color: "#8c87c7",
    price: 0,
    grip: 1.05,
    shape: "hyper",
    awd: true,
    description: "Hypercar W16. Puissance radicale, aérodynamique extrême.",
  },
];

var $p = {
  ratios: [3.5, 2.4, 1.75, 1.32, 1.05, 0.86, 0.72],
  reverse: -3.2,
  finalDrive: 3.4,
  wheel: 0.33,
  efficiency: 0.9,
};

var em = {
  V6: 7200,
  V8: 6000 /* 6e3 */,
  V12: 9000 /* 9e3 */,
  W16: 6800,
};

var tm = [
  {
    id: "V6",
    name: "V6 Twin Turbo",
    hp: 320,
    torque: 400,
    max: 52,
    acceleration: 17,
    consumption: 0.12,
    pitch: 95,
    price: 0,
    description: "Aigu et nerveux. Réponse rapide, drift précis.",
  },
  {
    id: "V8",
    name: "V8 Supercharged",
    hp: 510,
    torque: 680,
    max: 60,
    acceleration: 23,
    consumption: 0.18,
    pitch: 48,
    price: 0,
    description: "Grave et grondant. Un couple massif dès les bas régimes.",
  },
  {
    id: "V12",
    name: "V12 Atmosphérique",
    hp: 740,
    torque: 720,
    max: 79,
    acceleration: 25,
    consumption: 0.23,
    pitch: 145,
    price: 0,
    description: "Un hurlement de supercar. La ligne droite est votre terrain.",
  },
  {
    id: "W16",
    name: "W16 Quad Turbo",
    hp: 1200,
    torque: 1500,
    max: 87,
    acceleration: 34,
    consumption: 0.34,
    pitch: 36,
    price: 0,
    description:
      "Rauque et monstrueux. Accélération brute, consommation extrême.",
  },
];

var nm = [
  {
    x: -90,
    z: -5,
  },
  {
    x: 90,
    z: 45,
  },
  {
    x: -30,
    z: 45,
  },
];

function rm() {
  let e = {
    credits: 0,
    best: 0,
    car: "sakura",
    engine: "V6",
    cars: ["sakura", "outlaw", "spectre", "titan"],
    engines: ["V6", "V8", "V12", "W16"],
  };
  try {
    let t = JSON.parse(localStorage.getItem("nightshift-progress") || "{}");

    let n = {
      ...e,
      ...t,
    };

    n.cars = Array.from(new Set([...e.cars, ...(n.cars || [])]));
    n.engines = Array.from(new Set([...e.engines, ...(n.engines || [])]));
    return n;
  } catch {
    return e;
  }
}
function im(e) {
  localStorage.setItem("nightshift-progress", JSON.stringify(e));
}
var am = {
  speed: 0,
  rpm: 900,
  gear: 1,
  redline: 7200,
  shifting: false,
  shiftSerial: 0,
  fuel: 100,
  health: 100,
  score: 0,
  combo: 1,
  wanted: 0,
  arrest: 0,
  arrestTimer: 0,
  escape: 0,
  drifting: false,
  onFoot: false,
  station: -1,
  zone: "Centre-ville",
  x: 0,
  z: 0,
  heading: 0,
};
function Om({ progress: e, muted: t, onMute: n }) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-white/10 px-5 md:px-10">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c6dc77] text-[#192015]">
          {<ArrowUpRightIcon size={25} strokeWidth={3} />}
        </div>
        <span className="race-title text-[27px] tracking-[.035em]">
          NIGHTSHIFT<span className="ml-1 text-[#c6dc77]">.</span>
        </span>
        <span className="ml-5 hidden border-l border-white/15 pl-5 text-[10px] font-semibold tracking-[.2em] text-[#828b8e] md:block">
          DRIFT. ESCAPE. REPEAT.
        </span>
      </div>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-xs">
          <CoinsIcon size={15} className="text-[#c6dc77]" />
          <b>{e.credits.toLocaleString("fr-FR")}</b>
          <span className="hidden text-[#798184] sm:inline">CR</span>
        </div>
        <button
          onClick={n}
          aria-label={t ? "Activer le son" : "Couper le son"}
          className="text-[#9aa2a4]"
        >
          {t ? <VolumeXIcon size={19} /> : <Volume2Icon size={19} />}
        </button>
        <div className="hidden h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#23282b] text-[10px] font-bold sm:flex">
          NS
        </div>
      </div>
    </header>
  );
}
function Iw(e, t = new Set()) {
  let n = new Map();
  for (let r of [...e.children]) {
    if (!r.isMesh || r.name || t.has(r)) {
      continue;
    }
    r.updateMatrix();
    let i = r.geometry.index ? r.geometry.toNonIndexed() : r.geometry.clone();
    i.applyMatrix4(r.matrix);
    i.clearGroups();
    let a = n.get(r.material);

    if (!a) {
      n.set(
        r.material,
        (a = {
          geos: [],
          cast: false,
          receive: false,
        })
      );
    }

    a.geos.push(i);
    a.cast ||= r.castShadow;
    a.receive ||= r.receiveShadow;
    r.geometry.dispose();
    e.remove(r);
  }
  for (let [t, r] of n) {
    let n = r.geos.length === 1 ? r.geos[0] : mergeGeometries(r.geos);

    if (r.geos.length > 1) {
      r.geos.forEach((e) => {
        return e.dispose();
      });
    }

    let i = new Mesh(n, t);
    i.castShadow = r.cast;
    i.receiveShadow = r.receive;
    e.add(i);
  }
}
/* traffic and police cars never animate their parts, so each look is built and batched once, then cloned */
const dfcTrafficTemplates = new Map();
function dfcTrafficCar(color, shape, police = false) {
  const key = (police ? "police" : "traffic") + "|" + color + "|" + shape;
  let template = dfcTrafficTemplates.get(key);
  if (!template) {
    template = Vw(color, shape, police);
    template.userData = {};
    dfcBatchStatic(template, new Set(), Infinity);
    dfcTrafficTemplates.set(key, template);
  }
  const car = template.clone();
  car.userData = {
    sharedTemplate: true,
  };
  return car;
}
/* compile every shader the session can need before the first frame, so nothing stalls mid-drive */
function dfcWarmUp(renderer, scene, camera, extraColors = []) {
  for (const color of [...CT, ...extraColors]) {
    dfcTrafficCar(color, "coupe");
  }
  dfcTrafficCar("#ffffff", "coupe", true);
  try {
    renderer.compile(scene, camera);
    for (const template of dfcTrafficTemplates.values()) {
      renderer.compile(template, camera, scene);
    }
  } catch (error) {}
}
/* the player car keeps its moving parts (wheels, door, lamps) separate; everything else is batched */
function dfcBatchCar(car) {
  const data = car.userData;
  const skip = new Set([
    ...data.wheels,
    ...data.brakeLights,
    ...data.headlights,
    ...(data.headlightBeams || []),
  ]);

  if (data.accessDoor) {
    skip.add(data.accessDoor);
  }

  dfcBatchStatic(car, new Set(), Infinity, skip);
  data.wheels.forEach((wheel) => {
    return dfcBatchStatic(wheel, new Set(), Infinity);
  });

  if (data.accessDoor) {
    dfcBatchStatic(data.accessDoor, new Set(), Infinity);
  }

  return car;
}
/* ---- static batching: merge never-moving meshes that share an identical material into one draw per area ---- */
function dfcMaterialKey(material, ids) {
  const parts = [];
  for (const key of Object.keys(material).sort()) {
    if (
      key === "uuid" ||
      key === "name" ||
      key === "version" ||
      key === "userData" ||
      key === "_listeners"
    ) {
      continue;
    }
    const value = material[key];
    let token;
    if (
      value === null ||
      value === undefined ||
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "boolean"
    ) {
      token = String(value);
    } else if (value.isColor) {
      token = "c" + value.getHexString();
    } else if (value.isTexture) {
      token = "t" + value.uuid;
    } else if (value.isVector2 || value.isVector3 || value.isEuler) {
      token = "v" + value.toArray().join(",");
    } else if (key === "defines") {
      token = JSON.stringify(value);
    } else {
      if (!ids.has(value)) {
        ids.set(value, ids.size);
      }
      token = "o" + ids.get(value);
    }
    parts.push(key + "=" + token);
  }
  return parts.join("|");
}
function dfcBatchStatic(
  root,
  keepMaterials = new Set(),
  cellSize = 48,
  skip = new Set()
) {
  root.updateMatrixWorld(true);
  const canonical = new Map();
  const objectIds = new Map();
  const groups = new Map();
  const removed = new Set();
  const baseBeforeRender = Mesh.prototype.onBeforeRender;
  const canonicalMaterial = (material) => {
    if (keepMaterials.has(material)) {
      return material;
    }
    const key = dfcMaterialKey(material, objectIds);
    let hit = canonical.get(key);

    if (!hit) {
      canonical.set(key, (hit = material));
    }

    return hit;
  };
  const sphere = new Sphere();
  const rootInverse = root.matrixWorld.clone().invert();
  const relative = new Matrix4();
  const eligible = (object) => {
    if (
      object.name ||
      !object.isMesh ||
      object.type !== "Mesh" ||
      object.isInstancedMesh ||
      object.isSkinnedMesh
    ) {
      return false;
    }
    if (
      !object.frustumCulled ||
      object.layers.mask !== 1 ||
      object.onBeforeRender !== baseBeforeRender ||
      object.morphTargetInfluences
    ) {
      return false;
    }
    const geometry = object.geometry;
    if (
      !geometry.isBufferGeometry ||
      !geometry.attributes.position ||
      Object.keys(geometry.morphAttributes).length
    ) {
      return false;
    }
    if (
      geometry.drawRange.start !== 0 ||
      geometry.drawRange.count !== Infinity
    ) {
      return false;
    }
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    if (
      materials.some((material) => {
        return !material || material.transparent;
      })
    ) {
      return false;
    }
    if (Array.isArray(object.material) && !geometry.groups.length) {
      return false;
    }
    for (const name of Object.keys(geometry.attributes)) {
      const attribute = geometry.attributes[name];
      if (
        attribute.isInterleavedBufferAttribute ||
        !(attribute.array instanceof Float32Array) ||
        attribute.normalized
      ) {
        return false;
      }
      if (
        name !== "position" &&
        name !== "normal" &&
        name !== "uv" &&
        name !== "uv1" &&
        name !== "uv2" &&
        name !== "color"
      ) {
        return false;
      }
    }
    const positions = geometry.attributes.position.array;
    for (let index = 0; index < positions.length; index++) {
      if (!Number.isFinite(positions[index])) {
        return false;
      }
    }
    return true;
  };
  const visit = (object, visible) => {
    if (skip.has(object)) {
      return;
    }
    visible = visible && object.visible;
    for (const child of object.children) {
      visit(child, visible);
    }
    if (!visible || !eligible(object)) {
      return;
    }
    const geometry = object.geometry;
    const names = Object.keys(geometry.attributes).sort();
    const matrix = relative
      .multiplyMatrices(rootInverse, object.matrixWorld)
      .clone();

    if (!geometry.boundingSphere) {
      geometry.computeBoundingSphere();
    }

    sphere.copy(geometry.boundingSphere).applyMatrix4(matrix);
    const signature = names
      .map((name) => {
        return name + geometry.attributes[name].itemSize;
      })
      .join(",");
    const total = geometry.index
      ? geometry.index.count
      : geometry.attributes.position.count;
    const pieces = Array.isArray(object.material)
      ? geometry.groups.map((group) => {
          return {
            material: object.material[group.materialIndex],
            start: group.start,
            count: Math.min(group.count, total - group.start),
          };
        })
      : [
          {
            material: object.material,
            start: 0,
            count: total,
          },
        ];
    for (const piece of pieces) {
      if (!piece.material || piece.count <= 0) {
        continue;
      }
      const material = canonicalMaterial(piece.material);
      const key = [
        material.uuid,
        signature,
        object.castShadow ? 1 : 0,
        object.receiveShadow ? 1 : 0,
        object.renderOrder,
        Math.floor(sphere.center.x / cellSize),
        Math.floor(sphere.center.z / cellSize),
      ].join("/");
      let group = groups.get(key);

      if (!group) {
        groups.set(
          key,
          (group = {
            material,
            names,
            cast: object.castShadow,
            receive: object.receiveShadow,
            renderOrder: object.renderOrder,
            items: [],
            objects: new Set(),
            vertices: 0,
            indices: 0,
          })
        );
      }

      group.items.push({
        object,
        matrix,
        start: piece.start,
        count: piece.count,
      });
      group.objects.add(object);
      group.vertices += geometry.attributes.position.count;
      group.indices += piece.count;
    }
  };
  visit(root, true);
  const normalMatrix = new Matrix3();
  const vector = new Vector3();
  let merged = 0;
  let batches = 0;
  for (const group of groups.values()) {
    if (group.items.length < 2) {
      const { object } = group.items[0];

      if (!Array.isArray(object.material)) {
        object.material = group.material;
      }

      continue;
    }
    const arrays = {};
    for (const name of group.names) {
      arrays[name] = new Float32Array(
        group.vertices *
          group.items[0].object.geometry.attributes[name].itemSize
      );
    }
    const indices =
      group.vertices > 65535
        ? new Uint32Array(group.indices)
        : new Uint16Array(group.indices);
    let vertexOffset = 0;
    let indexOffset = 0;
    for (const { object, matrix, start, count: pieceCount } of group.items) {
      const geometry = object.geometry;
      const count = geometry.attributes.position.count;
      normalMatrix.getNormalMatrix(matrix);
      for (const name of group.names) {
        const source = geometry.attributes[name];
        const size = source.itemSize;
        const target = arrays[name];
        if (name === "position" || name === "normal") {
          for (let index = 0; index < count; index++) {
            vector.fromBufferAttribute(source, index);

            if (name === "position") {
              vector.applyMatrix4(matrix);
            } else {
              vector.applyMatrix3(normalMatrix).normalize();
            }

            target[(vertexOffset + index) * 3] = vector.x;
            target[(vertexOffset + index) * 3 + 1] = vector.y;
            target[(vertexOffset + index) * 3 + 2] = vector.z;
          }
        } else {
          target.set(
            source.array.subarray(0, count * size),
            vertexOffset * size
          );
        }
      }
      const flip = matrix.determinant() < 0;
      const source = geometry.index ? geometry.index.array : null;
      const at = (index) => {
        return source ? source[index] : index;
      };
      for (let index = start; index + 2 < start + pieceCount; index += 3) {
        indices[indexOffset++] = at(index) + vertexOffset;
        indices[indexOffset++] =
          at(flip ? index + 2 : index + 1) + vertexOffset;
        indices[indexOffset++] =
          at(flip ? index + 1 : index + 2) + vertexOffset;
      }
      vertexOffset += count;
    }
    const geometry = new BufferGeometry();
    for (const name of group.names) {
      geometry.setAttribute(
        name,
        new BufferAttribute(
          arrays[name],
          group.items[0].object.geometry.attributes[name].itemSize
        )
      );
    }
    geometry.setIndex(
      new BufferAttribute(
        indexOffset === indices.length
          ? indices
          : indices.slice(0, indexOffset),
        1
      )
    );
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    const mesh = new Mesh(geometry, group.material);
    mesh.castShadow = group.cast;
    mesh.receiveShadow = group.receive;
    mesh.renderOrder = group.renderOrder;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    root.add(mesh);
    group.objects.forEach((object) => {
      return removed.add(object);
    });
    merged += group.items.length;
    batches++;
  }
  // a multi-material mesh only goes away when every one of its pieces was merged
  for (const group of groups.values()) {
    if (group.items.length < 2) {
      group.objects.forEach((object) => {
        return removed.delete(object);
      });
    }
  }
  removed.forEach((object) => {
    return object.parent && object.parent.remove(object);
  });
  for (const group of groups.values()) {
    if (group.items.length >= 2) {
      for (const object of group.objects) {
        if (!removed.has(object) && Array.isArray(object.material)) {
          // partially merged multi-material mesh: hide the pieces now drawn by a batch
          const merged = new Set(
            group.items
              .filter((item) => {
                return item.object === object;
              })
              .map((item) => {
                return item.start;
              })
          );
          object.geometry = object.geometry.clone();
          object.geometry.groups = object.geometry.groups.filter((entry) => {
            return (
              !merged.has(entry.start) ||
              object.material[entry.materialIndex] === undefined
            );
          });
        }
      }
    }
  }
  const prune = (object) => {
    for (const child of [...object.children]) {
      prune(child);
    }
    if (object !== root && !object.children.length && object.type === "Group") {
      object.parent.remove(object);
    }
  };
  prune(root);
  const geometries = new Set();
  root.traverse((object) => {
    return object.geometry && geometries.add(object.geometry);
  });
  removed.forEach((object) => {
    return geometries.has(object.geometry) || object.geometry.dispose();
  });
  return {
    merged,
    batches,
  };
}
function Lw(e, t, n, r = 0.05) {
  let i = new ExtrudeGeometry(e, {
    depth: t,
    bevelEnabled: true,
    bevelThickness: r,
    bevelSize: r,
    bevelSegments: 5,
    steps: 1,
    curveSegments: 32,
  });
  i.translate(0, 0, -t / 2);
  i.rotateY(-Math.PI / 2);
  i.computeVertexNormals();
  let a = new Mesh(i, n);
  a.castShadow = true;
  a.receiveShadow = true;
  return a;
}
function Rw(e, t) {
  let n = new Shape();
  let r = -e / 2;
  let i = e / 2;
  let a = 0.3;

  let {
    belt: o,
    hood: s,
    rear: c,
    frontRise: l,
  } = {
    porsche: {
      belt: 0.74,
      hood: 0.6,
      rear: 0.74,
      frontRise: 0.5,
    },
    gtr: {
      belt: 0.78,
      hood: 0.66,
      rear: 0.66,
      frontRise: 0.52,
    },
    super: {
      belt: 0.7,
      hood: 0.64,
      rear: 0.7,
      frontRise: 0.46,
    },
    muscle: {
      belt: 0.74,
      hood: 0.67,
      rear: 0.66,
      frontRise: 0.52,
    },
    hyper: {
      belt: 0.72,
      hood: 0.62,
      rear: 0.7,
      frontRise: 0.48,
    },
  }[t] || {
    belt: 0.74,
    hood: 0.66,
    rear: 0.66,
    frontRise: 0.5,
  };

  n.moveTo(r, a);
  n.lineTo(r, l);
  n.quadraticCurveTo(r + 0.04, l + 0.1, r + 0.22, s);
  n.lineTo(r + 1.55, s + 0.005);
  n.quadraticCurveTo(r + 1.72, s + 0.02, r + 1.92, o);
  n.lineTo(i - 1.25, o + 0.005);
  n.quadraticCurveTo(i - 1.05, o - 0.01, i - 0.85, c + 0.02);
  n.lineTo(i - 0.22, c);
  n.quadraticCurveTo(i - 0.05, c - 0.02, i, 0.56);
  n.lineTo(i, a);
  n.lineTo(r, a);
  return n;
}
function zw(e, t) {
  let n = new Shape();
  let r = -e / 2;
  let i = e / 2;

  let {
    belt: a,
    roof: o,
    wsStart: s,
    roofEnd: c,
    rsEnd: l,
  } = {
    porsche: {
      belt: 0.74,
      roof: 1.14,
      wsStart: 1.78,
      roofEnd: 1.95,
      rsEnd: 1,
    },
    gtr: {
      belt: 0.78,
      roof: 1.22,
      wsStart: 1.85,
      roofEnd: 1.78,
      rsEnd: 1.4,
    },
    super: {
      belt: 0.7,
      roof: 1.18,
      wsStart: 1.78,
      roofEnd: 1.78,
      rsEnd: 1.3,
    },
    muscle: {
      belt: 0.74,
      roof: 1.24,
      wsStart: 1.8,
      roofEnd: 1.78,
      rsEnd: 1.35,
    },
    hyper: {
      belt: 0.72,
      roof: 1.12,
      wsStart: 1.7,
      roofEnd: 1.7,
      rsEnd: 1.25,
    },
  }[t] || {
    belt: 0.74,
    roof: 1.24,
    wsStart: 1.78,
    roofEnd: 1.78,
    rsEnd: 1.3,
  };

  n.moveTo(r + s, a);
  n.quadraticCurveTo(r + s + 0.24, a + 0.02, r + s + 0.34, o - 0.02);
  n.lineTo(i - c, o);
  n.quadraticCurveTo(i - l, o - 0.02, i - l + 0.2, a + 0.02);
  n.lineTo(r + s, a);
  return n;
}
function Bw(e) {
  let t = new Group();
  let n = 0.475;
  let r = 0.305;
  let i = new Mesh(new CylinderGeometry(n, n, r, 44), e.rubber);
  i.rotation.z = Math.PI / 2;
  i.castShadow = true;
  t.add(i);
  let a = new Mesh(new TorusGeometry(0.48, 0.05, 10, 44), e.tread);
  a.rotation.y = Math.PI / 2;
  t.add(a);
  for (let n of [-0.305 / 2, r / 2]) {
    let r = new Mesh(
      new TorusGeometry(0.44499999999999995, 0.035, 8, 36),
      e.rubber
    );
    r.rotation.y = Math.PI / 2;
    r.position.x = n;
    t.add(r);
  }
  let o = new Mesh(new CylinderGeometry(0.3, 0.3, 0.06, 40), e.rotor);
  o.rotation.z = Math.PI / 2;
  o.position.x = 0.02;
  t.add(o);
  for (let n = 0; n < 6; n++) {
    let r = new Mesh(new BoxGeometry(0.07, 0.02, 0.3), e.dark);
    r.rotation.x = (n / 6) * Math.PI * 2;
    r.position.x = 0.05;
    t.add(r);
  }
  for (let n = 0; n < 8; n++) {
    let r = (n / 8) * Math.PI * 2;
    let i = new Mesh(new CylinderGeometry(0.025, 0.025, 0.08, 8), e.dark);
    i.rotation.z = Math.PI / 2;
    i.position.set(0.02, Math.sin(r) * 0.22, Math.cos(r) * 0.22);
    t.add(i);
  }
  let s = new Mesh(new TorusGeometry(0.24, 0.02, 6, 28), e.dark);
  s.rotation.y = Math.PI / 2;
  s.position.x = 0.02;
  t.add(s);
  let c = new Mesh(new BoxGeometry(0.1, 0.16, 0.14), e.caliper);
  c.position.set(0.1, 0.2, 0);
  t.add(c);
  let l = new Mesh(new CylinderGeometry(0.33, 0.33, 0.28, 36), e.rim);
  l.rotation.z = Math.PI / 2;
  t.add(l);
  let u = e.rim;
  for (let e = 0; e < 10; e++) {
    let n = (e / 10) * Math.PI * 2;
    let r = new Mesh(new BoxGeometry(0.06, 0.56, 0.05), u);
    r.rotation.x = n;
    r.position.x = 0.13;
    t.add(r);
  }
  let d = new Mesh(new TorusGeometry(0.335, 0.025, 10, 40), e.rim);
  d.rotation.y = Math.PI / 2;
  d.position.x = 0.14;
  t.add(d);
  let f = new Mesh(new CylinderGeometry(0.09, 0.09, 0.3, 18), e.chrome);
  f.rotation.z = Math.PI / 2;
  f.position.x = 0.15;
  t.add(f);
  for (let n = 0; n < 5; n++) {
    let r = (n / 5) * Math.PI * 2;
    let i = new Mesh(new CylinderGeometry(0.018, 0.018, 0.06, 6), e.dark);
    i.rotation.z = Math.PI / 2;
    i.position.set(0.17, Math.sin(r) * 0.06, Math.cos(r) * 0.06);
    t.add(i);
  }
  return t;
}
/* ======================================================================
   DRIFT FURY - realistic car builder (replaces the old LEGO-style Vw)
   Smooth lofted bodywork, tinted glass greenhouse, pillars, wheel arches,
   lathe-turned tyres and alloy wheels, shaped lights, per-model details.
   ====================================================================== */
function dfcPchip(pts) {
  const n = pts.length;

  const xs = pts.map((p) => {
    return p[0];
  });

  const ys = pts.map((p) => {
    return p[1];
  });

  const h = [];
  const d = [];
  const m = new Array(n);
  for (let i = 0; i < n - 1; i++) {
    h[i] = xs[i + 1] - xs[i];
    d[i] = (ys[i + 1] - ys[i]) / h[i];
  }
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) {
      m[i] = 0;
    } else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  return (x) => {
    if (x <= xs[0]) {
      return ys[0];
    }
    if (x >= xs[n - 1]) {
      return ys[n - 1];
    }
    let i = 0;
    while (x > xs[i + 1]) {
      i++;
    }
    const t = (x - xs[i]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h[i] * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h[i] * m[i + 1]
    );
  };
}
const dfcClamp = (x, a, b) => {
  return Math.min(b, Math.max(a, x));
};
const dfcSmooth = (a, b, x) => {
  const t = dfcClamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const dfcShadowTextures = new Map();

/* Chaikin corner cutting on a closed polygon of [x, y, s] with s wrapping at sMax */
function dfcChaikin(P, iters, sMax) {
  let pts = P;
  for (let it = 0; it < iters; it++) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const sb = i === pts.length - 1 ? b[2] + sMax : b[2];
      out.push([
        a[0] * 0.75 + b[0] * 0.25,
        a[1] * 0.75 + b[1] * 0.25,
        a[2] * 0.75 + sb * 0.25,
      ]);
      out.push([
        a[0] * 0.25 + b[0] * 0.75,
        a[1] * 0.25 + b[1] * 0.75,
        a[2] * 0.25 + sb * 0.75,
      ]);
    }
    pts = out;
  }
  return pts.map((p) => {
    return [p[0], p[1], p[2] % sMax];
  });
}
function dfcBuf(pos, nor, idx) {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute(
    "uv",
    new BufferAttribute(new Float32Array((pos.length / 3) * 2), 2)
  );
  if (idx) {
    g.setIndex(idx);
  }
  return g;
}

/* normals for a (rows x cols) point matrix whose columns wrap */
function dfcNormals(P, nz, nr) {
  const N = new Float32Array(P.length);
  for (let i = 0; i < nz; i++) {
    const i0 = Math.max(0, i - 1);
    const i1 = Math.min(nz - 1, i + 1);
    for (let j = 0; j < nr; j++) {
      const j0 = (j + nr - 1) % nr;
      const j1 = (j + 1) % nr;
      const a = (i * nr + j) * 3;
      const A = (i * nr + j0) * 3;
      const B = (i * nr + j1) * 3;
      const C = (i0 * nr + j) * 3;
      const D = (i1 * nr + j) * 3;
      const ux = P[B] - P[A];
      const uy = P[B + 1] - P[A + 1];
      const uz = P[B + 2] - P[A + 2];
      const vx = P[D] - P[C];
      const vy = P[D + 1] - P[C + 1];
      const vz = P[D + 2] - P[C + 2];
      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz_ = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz_);
      if (l < 1e-12) {
        nx = 0;
        ny = 1;
        nz_ = 0;
      } else {
        nx /= l;
        ny /= l;
        nz_ /= l;
      }
      N[a] = nx;
      N[a + 1] = ny;
      N[a + 2] = nz_;
    }
  }
  return N;
}

/* build one geometry per category from a point-matrix grid */
function dfcGridGeos(P, N, nz, nr, cat) {
  const buckets = {};
  for (let i = 0; i < nz - 1; i++) {
    for (let j = 0; j < nr; j++) {
      const c = cat(i, j);
      if (!c) {
        continue;
      }
      const b =
        buckets[c] ||
        (buckets[c] = {
          pos: [],
          nor: [],
          idx: [],
          map: new Map(),
        });
      const j1 = (j + 1) % nr;
      const vid = (ii, jj) => {
        const k = ii * nr + jj;
        let v = b.map.get(k);
        if (v === undefined) {
          v = b.pos.length / 3;
          b.map.set(k, v);
          const a = k * 3;
          b.pos.push(P[a], P[a + 1], P[a + 2]);
          b.nor.push(N[a], N[a + 1], N[a + 2]);
        }
        return v;
      };
      const A = vid(i, j);
      const B = vid(i, j1);
      const C = vid(i + 1, j);
      const D = vid(i + 1, j1);
      b.idx.push(A, B, C, B, D, C);
    }
  }
  const out = {};
  for (const k in buckets) {
    out[k] = dfcBuf(buckets[k].pos, buckets[k].nor, buckets[k].idx);
  }
  return out;
}

/* flat polygon cap (convex-ish ring) with a fixed normal */
function dfcCap(ring, z, nz_) {
  const pos = [];
  const nor = [];
  const idx = [];
  let cx = 0;
  let cy_ = 0;
  ring.forEach((p) => {
    cx += p[0];
    cy_ += p[1];
  });
  cx /= ring.length;
  cy_ /= ring.length;
  pos.push(cx, cy_, z);
  nor.push(0, 0, nz_);
  ring.forEach((p) => {
    pos.push(p[0], p[1], z);
    nor.push(0, 0, nz_);
  });
  for (let j = 0; j < ring.length; j++) {
    const a = 1 + j;
    const b = 1 + ((j + 1) % ring.length);
    if (nz_ > 0) {
      idx.push(0, a, b);
    } else {
      idx.push(0, b, a);
    }
  }
  return dfcBuf(pos, nor, idx);
}

/* convex prism from a 2D polygon [r, t] (radial, tangential) rotated by phi around the x axis */
function dfcPrism(poly, x0, x1, phi, bevel) {
  const pos = [];
  const nor = [];
  const idx = [];
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  const W = (r, t, x) => {
    return [x, r * c - t * s, r * s + t * c];
  };
  const n = poly.length;
  const addTri = (a, b, d, nrm) => {
    const k = pos.length / 3;
    pos.push(...a, ...b, ...d);
    for (let i = 0; i < 3; i++) {
      nor.push(...nrm);
    }
    idx.push(k, k + 1, k + 2);
  };
  let cr = 0;
  let ct = 0;
  poly.forEach((p) => {
    cr += p[0];
    ct += p[1];
  });
  cr /= n;
  ct /= n;
  const nrmX1 = [1, 0, 0];
  const nrmX0 = [-1, 0, 0];
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    addTri(W(cr, ct, x1), W(a[0], a[1], x1), W(b[0], b[1], x1), nrmX1);
    addTri(W(cr, ct, x0), W(b[0], b[1], x0), W(a[0], a[1], x0), nrmX0);
    const dr = b[0] - a[0];
    const dt = b[1] - a[1];
    const l = Math.hypot(dr, dt) || 1;
    const nr_ = dt / l;
    const nt = -dr / l;
    const wn = [0, nr_ * c - nt * s, nr_ * s + nt * c];
    const q = pos.length / 3;
    pos.push(
      ...W(a[0], a[1], x0),
      ...W(b[0], b[1], x0),
      ...W(b[0], b[1], x1),
      ...W(a[0], a[1], x1)
    );
    for (let k = 0; k < 4; k++) {
      nor.push(...wn);
    }
    idx.push(q, q + 1, q + 2, q, q + 2, q + 3);
  }
  return dfcBuf(pos, nor, idx);
}

/* surface of revolution about the x axis. prof = [[x, r], ...] ordered so the outside faces out */
function dfcLathe(prof, seg) {
  const nz = prof.length;
  const nr = seg;
  const P = new Float32Array(nz * nr * 3);
  for (let i = 0; i < nz; i++) {
    for (let j = 0; j < nr; j++) {
      const th = (j / nr) * Math.PI * 2;
      const a = (i * nr + j) * 3;
      P[a] = prof[i][0];
      P[a + 1] = Math.cos(th) * prof[i][1];
      P[a + 2] = Math.sin(th) * prof[i][1];
    }
  }
  const N = dfcNormals(P, nz, nr);
  const pos = Array.from(P);
  const nor = Array.from(N);
  const idx = [];
  for (let i = 0; i < nz - 1; i++) {
    for (let j = 0; j < nr; j++) {
      const j1 = (j + 1) % nr;
      const A = i * nr + j;
      const B = i * nr + j1;
      const C = (i + 1) * nr + j;
      const D = (i + 1) * nr + j1;
      idx.push(A, B, C, B, D, C);
    }
  }
  return dfcBuf(pos, nor, idx);
}
function dfcSmoothProfile(ctrl, iters) {
  /* open Chaikin keeping the end points */
  let pts = ctrl;
  for (let it = 0; it < iters; it++) {
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}

/* ---------------------------------------------------------------- specs */
const DFC_SPECS = {
  coupe: {
    L: 4.55,
    axF: 0.92,
    axR: 3.64,
    R: 0.35,
    twF: 0.255,
    twR: 0.275,
    humpF: 0.045,
    humpR: 0.07,
    crown: 0.04,
    top: [
      [0, 0.6],
      [0.12, 0.66],
      [0.4, 0.74],
      [0.95, 0.78],
      [1.5, 0.84],
      [1.85, 0.9],
      [2.4, 0.94],
      [3.2, 0.95],
      [3.7, 0.95],
      [4.15, 0.93],
      [4.4, 0.86],
      [4.55, 0.76],
    ],
    bot: [
      [0, 0.32],
      [0.15, 0.22],
      [0.5, 0.18],
      [1.2, 0.17],
      [3.4, 0.17],
      [4 /* 4.0 */, 0.19],
      [4.4, 0.24],
      [4.55, 0.32],
    ],
    wid: [
      [0, 0.62],
      [0.07, 0.75],
      [0.22, 0.85],
      [0.55, 0.905],
      [0.95, 0.93],
      [1.9, 0.915],
      [2.8, 0.915],
      [3.55, 0.945],
      [4.05, 0.92],
      [4.38, 0.83],
      [4.55, 0.64],
    ],
    cab: {
      ws: 1.78,
      rf: 2.45,
      rr: 3.18,
      rg: 3.78,
      roof: 1.3,
      tum: 0.17,
      inset: 0.12,
      cp: 3.25,
      bp: 2.78,
      rgs: 5 /* 5.0 */,
    },
  },
  gtr: {
    L: 4.7,
    axF: 0.95,
    axR: 3.73,
    R: 0.355,
    twF: 0.265,
    twR: 0.285,
    humpF: 0.075,
    humpR: 0.09,
    crown: 0.04,
    top: [
      [0, 0.64],
      [0.12, 0.7],
      [0.45, 0.78],
      [1.1, 0.82],
      [1.7, 0.88],
      [2 /* 2.0 */, 0.93],
      [2.6, 0.97],
      [3.6, 0.99],
      [4.1, 0.99],
      [4.5, 0.93],
      [4.7, 0.84],
    ],
    bot: [
      [0, 0.33],
      [0.15, 0.23],
      [0.5, 0.19],
      [1.2, 0.18],
      [3.5, 0.18],
      [4.1, 0.2],
      [4.5, 0.25],
      [4.7, 0.33],
    ],
    wid: [
      [0, 0.66],
      [0.08, 0.8],
      [0.25, 0.9],
      [0.6, 0.97],
      [1 /* 1.0 */, 0.99],
      [2, 0.975],
      [2.9, 0.975],
      [3.7, 0.99],
      [4.2, 0.96],
      [4.5, 0.88],
      [4.7, 0.68],
    ],
    cab: {
      ws: 1.88,
      rf: 2.45,
      rr: 3.35,
      rg: 3.95,
      roof: 1.37,
      tum: 0.2,
      inset: 0.12,
      cp: 3.4,
      bp: 2.92,
      rgs: 5 /* 5.0 */,
    },
  },
  porsche: {
    L: 4.5,
    axF: 0.9,
    axR: 3.35,
    R: 0.35,
    twF: 0.245,
    twR: 0.295,
    humpF: 0.085,
    humpR: 0.095,
    crown: 0.04,
    top: [
      [0, 0.56],
      [0.1, 0.62],
      [0.35, 0.68],
      [0.9, 0.72],
      [1.45, 0.8],
      [1.65, 0.84],
      [2.2, 0.9],
      [3.4, 0.96],
      [3.9, 0.98],
      [4.25, 0.97],
      [4.4, 0.92],
      [4.5, 0.84],
    ],
    bot: [
      [0, 0.3],
      [0.15, 0.21],
      [0.5, 0.17],
      [1.2, 0.16],
      [3.4, 0.16],
      [4 /* 4.0 */, 0.19],
      [4.4, 0.24],
      [4.5, 0.3],
    ],
    wid: [
      [0, 0.6],
      [0.07, 0.73],
      [0.22, 0.83],
      [0.55, 0.895],
      [0.9, 0.915],
      [1.9, 0.905],
      [2.6, 0.915],
      [3.35, 0.965],
      [4 /* 4.0 */, 0.95],
      [4.3, 0.87],
      [4.5, 0.64],
    ],
    cab: {
      ws: 1.5,
      rf: 2.1,
      rr: 2.95,
      rg: 3.95,
      roof: 1.3,
      tum: 0.2,
      inset: 0.1,
      cp: 2.9,
      bp: null,
      rgs: 5.2,
    },
  },
  super: {
    L: 4.52,
    axF: 0.98,
    axR: 3.62,
    R: 0.355,
    twF: 0.255,
    twR: 0.31,
    humpF: 0.06,
    humpR: 0.08,
    crown: 0.04,
    top: [
      [0, 0.46],
      [0.12, 0.52],
      [0.5, 0.6],
      [1.2, 0.7],
      [1.62, 0.8],
      [2 /* 2.0 */, 0.86],
      [2.8, 0.95],
      [3.4, 0.97],
      [4 /* 4.0 */, 0.92],
      [4.35, 0.86],
      [4.52, 0.78],
    ],
    bot: [
      [0, 0.26],
      [0.15, 0.18],
      [0.5, 0.15],
      [1.2, 0.15],
      [3.4, 0.15],
      [4 /* 4.0 */, 0.18],
      [4.4, 0.23],
      [4.52, 0.3],
    ],
    wid: [
      [0, 0.62],
      [0.07, 0.78],
      [0.22, 0.9],
      [0.55, 0.97],
      [1 /* 1.0 */, 1 /* 1.0 */],
      [1.9, 0.98],
      [2.7, 1 /* 1.0 */],
      [3.5, 1.01],
      [4 /* 4.0 */, 0.96],
      [4.35, 0.86],
      [4.52, 0.64],
    ],
    cab: {
      ws: 1.62,
      rf: 2.28,
      rr: 2.75,
      rg: 3.35,
      roof: 1.13,
      tum: 0.22,
      inset: 0.13,
      cp: 2.8,
      bp: null,
      rgs: 5.4,
    },
  },
  muscle: {
    L: 4.75,
    axF: 0.95,
    axR: 3.8,
    R: 0.355,
    twF: 0.265,
    twR: 0.295,
    humpF: 0.06,
    humpR: 0.07,
    crown: 0.05,
    top: [
      [0, 0.78],
      [0.1, 0.84],
      [0.4, 0.92],
      [1 /* 1.0 */, 0.96],
      [2 /* 2.0 */, 0.99],
      [2.4, 1 /* 1.0 */],
      [3 /* 3.0 */, 1.02],
      [4.2, 1.03],
      [4.55, 0.99],
      [4.75, 0.92],
    ],
    bot: [
      [0, 0.36],
      [0.15, 0.25],
      [0.5, 0.2],
      [1.2, 0.19],
      [3.6, 0.19],
      [4.2, 0.21],
      [4.55, 0.26],
      [4.75, 0.34],
    ],
    wid: [
      [0, 0.66],
      [0.08, 0.8],
      [0.25, 0.9],
      [0.6, 0.955],
      [1 /* 1.0 */, 0.975],
      [2 /* 2.0 */, 0.96],
      [3 /* 3.0 */, 0.96],
      [3.8, 0.975],
      [4.3, 0.95],
      [4.6, 0.87],
      [4.75, 0.66],
    ],
    cab: {
      ws: 2.25,
      rf: 2.7,
      rr: 3.45,
      rg: 3.95,
      roof: 1.39,
      tum: 0.16,
      inset: 0.11,
      cp: 3.5,
      bp: 3 /* 3.0 */,
      rgs: 4.8,
    },
  },
  hyper: {
    L: 4.6,
    axF: 1 /* 1.0 */,
    axR: 3.7,
    R: 0.355,
    twF: 0.26,
    twR: 0.315,
    humpF: 0.065,
    humpR: 0.09,
    crown: 0.04,
    top: [
      [0, 0.48],
      [0.1, 0.54],
      [0.5, 0.64],
      [1.2, 0.72],
      [1.6, 0.82],
      [2 /* 2.0 */, 0.88],
      [2.6, 0.9],
      [3.2, 0.92],
      [4 /* 4.0 */, 0.9],
      [4.4, 0.82],
      [4.6, 0.72],
    ],
    bot: [
      [0, 0.26],
      [0.15, 0.18],
      [0.5, 0.15],
      [1.2, 0.15],
      [3.5, 0.15],
      [4.1, 0.18],
      [4.45, 0.23],
      [4.6, 0.3],
    ],
    wid: [
      [0, 0.62],
      [0.07, 0.78],
      [0.22, 0.91],
      [0.55, 0.98],
      [1 /* 1.0 */, 1.025],
      [1.9, 1 /* 1.0 */],
      [2.8, 1 /* 1.0 */],
      [3.7, 1.025],
      [4.2, 0.97],
      [4.45, 0.86],
      [4.6, 0.64],
    ],
    cab: {
      ws: 1.55,
      rf: 2.15,
      rr: 2.7,
      rg: 3.5,
      roof: 1.12,
      tum: 0.22,
      inset: 0.13,
      cp: 2.8,
      bp: null,
      rgs: 5.3,
    },
  },
};
function dfcBuildSpec(name) {
  const raw = DFC_SPECS[name] || DFC_SPECS.coupe;
  const sp = Object.assign({}, raw);
  sp.name = name in DFC_SPECS ? name : "coupe";
  sp.yTop = dfcPchip(raw.top);
  sp.yBot = dfcPchip(raw.bot);
  sp.hw = dfcPchip(raw.wid);
  sp.arch = sp.R + 0.065;
  sp.hump = (zf) => {
    let h = 0;
    for (const [za, amp] of [
      [sp.axF, sp.humpF],
      [sp.axR, sp.humpR],
    ]) {
      const t = (zf - za) / (sp.arch * 1.25);
      if (Math.abs(t) < 1) {
        h += amp * (1 - t * t) * (1 - t * t);
      }
    }
    return h;
  };
  sp.yEdge = (zf) => {
    let y = sp.yBot(zf) + 0.05;
    for (const za of [sp.axF, sp.axR]) {
      const dz = Math.abs(zf - za);
      if (dz <= sp.arch) {
        y = Math.max(y, sp.R + Math.sqrt(sp.arch * sp.arch - dz * dz));
      }
    }
    return y;
  };
  const c = sp.cab;
  const base = (zf) => {
    return sp.yTop(zf) - 0.05;
  };
  const bws = base(c.ws);
  const brg = base(c.rg);
  const midRoof = (c.rf + c.rr) / 2;
  const hiRoof = c.roof;
  sp.cabBase = base;
  sp.roofY = dfcPchip([
    [c.ws, bws],
    [c.ws + (c.rf - c.ws) * 0.3, bws + (hiRoof - 0.05 - bws) * 0.26],
    [c.ws + (c.rf - c.ws) * 0.65, bws + (hiRoof - 0.05 - bws) * 0.66],
    [c.rf, hiRoof - 0.045],
    [midRoof, hiRoof],
    [c.rr, hiRoof - 0.035],
    [
      c.rr + (c.rg - c.rr) * 0.35,
      hiRoof - 0.035 - (hiRoof - 0.035 - brg) * 0.3,
    ],
    [
      c.rr + (c.rg - c.rr) * 0.7,
      hiRoof - 0.035 - (hiRoof - 0.035 - brg) * 0.72,
    ],
    [c.rg, brg],
  ]);
  return sp;
}
function dfcGetShadowTexture(sp) {
  if (!dfcShadowTextures.has(sp.name)) {
    const width = 512;
    const height = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    const carWidth =
      Math.max(
        ...sp.wid.map(([, halfWidth]) => {
          return halfWidth;
        })
      ) * 2;
    const planeWidth = carWidth + 0.75;
    const planeLength = sp.L + 1;
    context.translate(width / 2, height / 2);
    context.scale(width / planeWidth, -height / planeLength);
    const drawBodyShadow = () => {
      context.beginPath();
      for (let sample = 0; sample <= 64; sample++) {
        const station = (sp.L * sample) / 64;
        const x = sp.hw(station);
        const z = station - sp.L / 2;

        if (sample === 0) {
          context.moveTo(x, z);
        } else {
          context.lineTo(x, z);
        }
      }
      for (let sample = 64; sample >= 0; sample--) {
        const station = (sp.L * sample) / 64;
        context.lineTo(-sp.hw(station), station - sp.L / 2);
      }
      context.closePath();
    };
    context.save();
    context.shadowColor = "rgba(0,0,0,.42)";
    context.shadowBlur = 22;
    context.fillStyle = "rgba(0,0,0,.13)";
    drawBodyShadow();
    context.fill();
    context.restore();
    context.save();
    context.shadowColor = "rgba(0,0,0,.22)";
    context.shadowBlur = 9;
    context.fillStyle = "rgba(0,0,0,.055)";
    drawBodyShadow();
    context.fill();
    context.restore();
    for (const [station, track, tireWidth] of [
      [sp.axF, sp.twF, 0.34],
      [sp.axR, sp.twR, 0.36],
    ]) {
      const wheelX = sp.hw(station) - track / 2 - 0.035;
      for (const side of [-1, 1]) {
        const x = side * wheelX;
        const z = station - sp.L / 2;
        const radius = context.createRadialGradient(x, z, 0.015, x, z, 0.48);
        radius.addColorStop(0, "rgba(0,0,0,.34)");
        radius.addColorStop(0.42, "rgba(0,0,0,.22)");
        radius.addColorStop(1, "rgba(0,0,0,0)");
        context.beginPath();
        context.ellipse(x, z, tireWidth / 2, 0.48, 0, 0, Math.PI * 2);
        context.fillStyle = radius;
        context.fill();
      }
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = "srgb";
    dfcShadowTextures.set(sp.name, texture);
  }
  return dfcShadowTextures.get(sp.name);
}

/* body cross-section ring at zf: [x, y, s] with s in 0..14 */
function dfcBodyRing(sp, zf) {
  const hw = sp.hw(zf);
  const yt = sp.yTop(zf);
  const yb = sp.yBot(zf);
  const ye = sp.yEdge(zf);
  const hump = sp.hump(zf);
  const endFade = dfcSmooth(0, 0.35, Math.min(zf, sp.L - zf));
  const cr = sp.crown * (0.4 + 0.6 * endFade);
  const yS = ye + (yt + hump * 0.8 - ye) * 0.5;
  const yU = yt + hump * 0.85 - cr - Math.min(0.1, (yt - ye) * 0.22);
  const R = [
    [0, yb],
    [hw * 0.74, yb],
    [hw * 0.93, ye],
    [hw, yS],
    [hw * 0.985, yU],
    [hw * 0.9, yt + hump * 0.6 - cr * 0.55 - 0.02],
    [hw * 0.5, yt + hump * 0.25 - cr * 0.1],
    [0, yt],
  ];
  const poly = [];
  R.forEach((p, i) => {
    return poly.push([p[0], p[1], i]);
  });
  for (let i = 6; i >= 1; i--) {
    poly.push([-R[i][0], R[i][1], 14 - i]);
  }
  return dfcChaikin(poly, 2, 14);
}

/* greenhouse cross-section at zf */
function dfcCabinRing(sp, zf) {
  const c = sp.cab;
  const yb = sp.cabBase(zf);
  const H = Math.max(0.006, sp.roofY(zf) - yb);
  const Hr = c.roof - sp.cabBase((c.rf + c.rr) / 2);
  const t = dfcClamp(H / Hr, 0, 1);
  const wb = sp.hw(zf) - c.inset - 0.02;
  const TU = c.tum * Math.pow(t, 0.8);
  const cr = 0.028 * t + 0.004;
  const R = [
    [0, yb],
    [wb, yb],
    [wb - TU * 0.16, yb + H * 0.3],
    [wb - TU * 0.72, yb + H * 0.84],
    [wb - TU, yb + H - cr * 0.5],
    [(wb - TU) * 0.55, yb + H - cr * 0.12],
    [0, yb + H],
  ];
  const poly = [];
  R.forEach((p, i) => {
    return poly.push([p[0], p[1], i]);
  });
  for (let i = 5; i >= 1; i--) {
    poly.push([-R[i][0], R[i][1], 12 - i]);
  }
  return dfcChaikin(poly, 2, 12);
}
function dfcRows(list, a, b, step) {
  const s = new Set(list);
  for (let z = a; z <= b + 0.000001 /* 1e-6 */; z += step) {
    s.add(Math.round(z * 10000 /* 1e4 */) / 10000 /* 1e4 */);
  }
  return [...s]
    .filter((z) => {
      return z >= a - 0.000001 /* 1e-6 */ && z <= b + 0.000001 /* 1e-6 */;
    })
    .sort((p, q) => {
      return p - q;
    });
}

/* ---------------------------------------------------------------- wheel */
function dfcWheel(mats, o) {
  const g = new Group();
  const R = o.R;
  const tw = o.tw;
  const hw_ = tw / 2;
  const rimR = R * 0.66;
  // tyre
  const tp = dfcSmoothProfile(
    [
      [-hw_ * 0.86, rimR - 0.004],
      [-hw_ * 0.98, rimR + 0.035],
      [-hw_ * 1 /* 1.0 */, R * 0.84],
      [-hw_ * 0.93, R * 0.955],
      [-hw_ * 0.78, R * 0.993],
      [-hw_ * 0.5, R],
      [-hw_ * 0.17, R * 0.995],
      [-hw_ * 0.1, R * 0.985],
      [hw_ * 0.1, R * 0.985],
      [hw_ * 0.17, R * 0.995],
      [hw_ * 0.5, R],
      [hw_ * 0.78, R * 0.993],
      [hw_ * 0.93, R * 0.955],
      [hw_ * 1 /* 1.0 */, R * 0.84],
      [hw_ * 0.98, rimR + 0.035],
      [hw_ * 0.86, rimR - 0.004],
    ],
    1
  );
  const tyre = new Mesh(dfcLathe(tp, o.seg), mats.rubber);
  tyre.castShadow = true;
  g.add(tyre);
  // rim barrel + lip
  const xo = hw_ * 0.9;
  // outside lip surface + face (dish)
  const face = dfcSmoothProfile(
    [
      [xo * 0.98, rimR + 0.002],
      [xo * 0.93, rimR - 0.012],
      [xo * 0.78, rimR - 0.035],
      [xo * 0.5, rimR * 0.72],
      [xo * 0.42, rimR * 0.5],
      [xo * 0.5, rimR * 0.26],
      [xo * 0.62, rimR * 0.13],
      [xo * 0.66, 0],
    ],
    1
  );
  const rim = new Mesh(dfcLathe(face, o.seg), mats.rim);
  g.add(rim);
  // inner barrel (dark, seen through the spokes)
  const barrel = new Mesh(
    dfcLathe(
      [
        [xo * 0.93, rimR - 0.012],
        [xo * 0.1, rimR - 0.052],
        [-xo * 0.85, rimR - 0.05],
        [-xo * 0.95, rimR - 0.01],
      ],
      o.seg
    ),
    mats.dark
  );
  g.add(barrel);
  // spokes (double spokes)
  const n = o.spokes;
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2;
    for (const side of [-1, 1]) {
      const ph = a0 + side * 0.105 * (6 / n);
      const poly = [
        [rimR * 0.17, -0.021],
        [rimR * 0.17, 0.021],
        [rimR * 0.93, 0.014 * 1 /* 1.0 */],
        [rimR * 0.93, -0.014],
      ];
      g.add(new Mesh(dfcPrism(poly, xo * 0.56, xo * 0.78, ph), mats.rim));
    }
  }
  // centre cap and lugs
  const cap = new Mesh(
    dfcLathe(
      [
        [xo * 0.6, 0],
        [xo * 0.74, rimR * 0.06],
        [xo * 0.76, rimR * 0.15],
        [xo * 0.68, rimR * 0.2],
        [xo * 0.6, rimR * 0.2],
      ],
      20
    ),
    mats.chrome
  );
  g.add(cap);
  for (let k = 0; k < 5; k++) {
    const th = (k / 5) * Math.PI * 2;
    const lug = new Mesh(
      new CylinderGeometry(0.011, 0.011, 0.02, 6),
      mats.dark
    );
    lug.rotation.z = Math.PI / 2;
    lug.position.set(
      xo * 0.66,
      Math.sin(th) * rimR * 0.27,
      Math.cos(th) * rimR * 0.27
    );
    g.add(lug);
  }
  // brake disc + caliper behind the spokes
  const disc = new Mesh(
    dfcLathe(
      [
        [xo * 0.12, rimR * 0.84],
        [xo * 0.16, rimR * 0.86],
        [xo * 0.16, rimR * 0.5],
        [xo * 0.12, rimR * 0.5],
      ],
      o.seg
    ),
    mats.rotor
  );
  g.add(disc);
  const cal = [
    [rimR * 0.5, -0.075],
    [rimR * 0.84, -0.07],
    [rimR * 0.84, 0.07],
    [rimR * 0.5, 0.075],
  ];
  g.add(new Mesh(dfcPrism(cal, xo * 0.08, xo * 0.4, o.calAng), mats.caliper));
  return g;
}

/* ---- surface helpers (points on the body skin) ---- */
function dfcRightHalf(ring) {
  const out = [];
  for (let j = 0; j < ring.length; j++) {
    if (ring[j][2] <= 7.0001 && ring[j][2] >= 0) {
      out.push(ring[j]);
    }
  }
  return out;
}
function dfcPointAt(half, sf) {
  for (let k = 0; k < half.length - 1; k++) {
    const a = half[k];
    const b = half[k + 1];
    if (sf >= a[2] && sf <= b[2]) {
      const t = (sf - a[2]) / (b[2] - a[2] || 1);
      return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
        b[0] - a[0],
        b[1] - a[1],
      ];
    }
  }
  const a = half[half.length - 2];
  const b = half[half.length - 1];
  return [b[0], b[1], b[2], b[0] - a[0], b[1] - a[1]];
}
/* position + outward normal on the body skin; side = +1 (right) / -1 (left) */
function dfcSurf(sp, zf, sf, side) {
  const h0 = dfcRightHalf(dfcBodyRing(sp, zf));
  const p = dfcPointAt(h0, sf);
  const h1 = dfcRightHalf(dfcBodyRing(sp, zf - 0.03));
  const h2 = dfcRightHalf(dfcBodyRing(sp, zf + 0.03));
  const q1 = dfcPointAt(h1, sf);
  const q2 = dfcPointAt(h2, sf);
  const dx = p[3];
  const dy = p[4];
  const a = (q2[0] - q1[0]) / 0.06;
  const b = (q2[1] - q1[1]) / 0.06;
  let nx = dy;
  let ny = -dx;
  let nz = dx * b - dy * a;
  const l = Math.hypot(nx, ny, nz) || 1;
  nx /= l;
  ny /= l;
  nz /= l;
  return {
    x: side * p[0],
    y: p[1],
    z: zf,
    nx: side * nx,
    ny,
    nz,
  };
}
/* thin ribbon laid on the body (door cuts, hood cuts, stripes) */
function dfcRibbonZ(sp, zf, sa, sb, w, off, side, hl) {
  const A = dfcBodyRing(sp, zf - w / 2);
  const B = dfcBodyRing(sp, zf + w / 2);
  const hA = dfcRightHalf(A);
  const hB = dfcRightHalf(B);
  const pos = [];
  const nor = [];
  const idx = [];
  const steps = 14;
  let prev = null;
  for (let k = 0; k <= steps; k++) {
    const sf = sa + ((sb - sa) * k) / steps;
    const a = dfcPointAt(hA, sf);
    const b = dfcPointAt(hB, sf);
    let nx = a[4];
    let ny = -a[3];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    const base = pos.length / 3;
    pos.push(
      side * (a[0] + nx * off),
      a[1] + ny * off,
      zf - w / 2 - hl,
      side * (b[0] + nx * off),
      b[1] + ny * off,
      zf + w / 2 - hl
    );
    nor.push(side * nx, ny, 0, side * nx, ny, 0);
    if (k > 0) {
      if (side > 0) {
        idx.push(base - 2, base - 1, base, base - 1, base + 1, base);
      } else {
        idx.push(base - 2, base, base - 1, base - 1, base, base + 1);
      }
    }
  }
  return dfcBuf(pos, nor, idx);
}
function dfcRibbonS(sp, sf0, sw, za, zb, off, side, hl) {
  const pos = [];
  const nor = [];
  const idx = [];
  const n = Math.max(2, Math.round((zb - za) / 0.06));
  for (let k = 0; k <= n; k++) {
    const zf = za + ((zb - za) * k) / n;
    const h = dfcRightHalf(dfcBodyRing(sp, zf));
    const a = dfcPointAt(h, sf0 - sw / 2);
    const b = dfcPointAt(h, sf0 + sw / 2);
    let nxA = a[4];
    let nyA = -a[3];
    const la = Math.hypot(nxA, nyA) || 1;
    nxA /= la;
    nyA /= la;
    let nxB = b[4];
    let nyB = -b[3];
    const lb = Math.hypot(nxB, nyB) || 1;
    nxB /= lb;
    nyB /= lb;
    const base = pos.length / 3;
    pos.push(
      side * (a[0] + nxA * off),
      a[1] + nyA * off,
      zf - hl,
      side * (b[0] + nxB * off),
      b[1] + nyB * off,
      zf - hl
    );
    nor.push(side * nxA, nyA, 0, side * nxB, nyB, 0);
    if (k > 0) {
      if (side > 0) {
        idx.push(base - 2, base - 1, base, base - 1, base + 1, base);
      } else {
        idx.push(base - 2, base, base - 1, base - 1, base, base + 1);
      }
    }
  }
  return dfcBuf(pos, nor, idx);
}

/* ---------------------------------------------------------------- the car */
function Vw(e = "#a9b7bf", t = "coupe", n = false, r = false, hi = false) {
  const i = new Group();
  const sp = dfcBuildSpec(t);
  const L = sp.L;
  const hl = L / 2;
  const detail = !!(r || hi);
  const segW = detail ? 44 : 26;
  const kind = sp.name;
  const bodyColor = n ? "#eef0f2" : e;
  const hwMax = Math.max(sp.hw(sp.axF), sp.hw(sp.axR), sp.hw(L / 2));
  const doorA = sp.axF + sp.arch + 0.1;
  const doorC = sp.axR - sp.arch - 0.08;

  /* ---- materials ---- */
  const paint = new MeshPhysicalMaterial({
    color: bodyColor,
    metalness: 0.55,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 2 /* 2.0 */,
    sheen: 0.25,
    sheenRoughness: 0.3,
    sheenColor: "#fff6e8",
  });
  const glass = new MeshPhysicalMaterial({
    color: "#04080c",
    metalness: 0.05,
    roughness: 0.03,
    transparent: true,
    opacity: 0.84,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2.4,
    ior: 1.45,
  });
  const trim = new MeshStandardMaterial({
    color: "#0a0c0e",
    metalness: 0.3,
    roughness: 0.5,
  });
  const matte = new MeshStandardMaterial({
    color: "#060708",
    roughness: 0.85,
    metalness: 0.1,
  });
  const linerMat = new MeshStandardMaterial({
    color: "#050607",
    roughness: 0.9,
    metalness: 0,
    side: 2,
  });
  const chrome = new MeshStandardMaterial({
    color: "#d6dade",
    metalness: 1,
    roughness: 0.08,
    envMapIntensity: 1.6,
  });
  const wm = {
    rubber: new MeshStandardMaterial({
      color: "#0b0b0c",
      roughness: 0.88,
      metalness: 0.02,
    }),
    rim: new MeshStandardMaterial({
      color: "#c9ced2",
      metalness: 1,
      roughness: 0.18,
      envMapIntensity: 1.6,
      side: 2,
    }),
    dark: new MeshStandardMaterial({
      color: "#0d0f11",
      metalness: 0.6,
      roughness: 0.5,
      side: 2,
    }),
    chrome,
    rotor: new MeshStandardMaterial({
      color: "#7a7f84",
      metalness: 0.9,
      roughness: 0.35,
      side: 2,
    }),
    caliper: new MeshStandardMaterial({
      color: kind === "muscle" || kind === "coupe" ? "#c4271a" : "#d8b400",
      metalness: 0.4,
      roughness: 0.4,
    }),
  };
  const lampMat = new MeshStandardMaterial({
    color: "#fffdf4",
    emissive: "#fff6cf",
    emissiveIntensity: 1.7,
    roughness: 0.12,
  });
  const lensMat = new MeshPhysicalMaterial({
    color: "#cfe0ff",
    transparent: true,
    opacity: 0.4,
    roughness: 0.05,
    clearcoat: 1,
    envMapIntensity: 1.4,
  });
  const amber = new MeshStandardMaterial({
    color: "#2a1600",
    emissive: "#ff9a1a",
    emissiveIntensity: 1.3,
    roughness: 0.4,
  });
  const addMesh = (geo, mat, cast = true, recv = true) => {
    const m = new Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = recv;
    i.add(m);
    return m;
  };

  /* soft contact shadow */
  const sh = new Mesh(
    new PlaneGeometry(hwMax * 2 + 0.75, L + 1),
    new MeshBasicMaterial({
      map: dfcGetShadowTexture(sp),
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      toneMapped: false,
    })
  );
  sh.rotation.x = -Math.PI / 2;
  sh.position.y = -0.01;
  sh.renderOrder = 1;
  i.add(sh);

  /* ---- lower body loft ---- */
  const bz = [0, 0.012, 0.03, 0.055, 0.09, 0.13, 0.18, 0.24, 0.31];
  const rowsB = new Set(bz);
  bz.forEach((z) => {
    return rowsB.add(Math.round((L - z) * 10000 /* 1e4 */) / 10000 /* 1e4 */);
  });
  for (let z = 0.4; z < L - 0.3; z += 0.09) {
    rowsB.add(Math.round(z * 10000 /* 1e4 */) / 10000 /* 1e4 */);
  }
  for (const za of [sp.axF, sp.axR]) {
    const ar = sp.arch;
    for (let d = -ar - 0.05; d <= ar + 0.05; d += 0.03) {
      rowsB.add(Math.round((za + d) * 10000 /* 1e4 */) / 10000 /* 1e4 */);
    }
    rowsB.add(
      Math.round((za - ar - 0.004) * 10000 /* 1e4 */) / 10000 /* 1e4 */
    );
    rowsB.add(Math.round((za - ar) * 10000 /* 1e4 */) / 10000 /* 1e4 */);
    rowsB.add(Math.round((za + ar) * 10000 /* 1e4 */) / 10000 /* 1e4 */);
    rowsB.add(
      Math.round((za + ar + 0.004) * 10000 /* 1e4 */) / 10000 /* 1e4 */
    );
  }
  const rb = [...rowsB]
    .filter((z) => {
      return z >= 0 && z <= L;
    })
    .sort((p, q) => {
      return p - q;
    });
  const ring0 = dfcBodyRing(sp, rb[0]);
  const nr = ring0.length;
  const nzB = rb.length;
  const PB = new Float32Array(nzB * nr * 3);
  const ringsB = rb.map((z) => {
    return dfcBodyRing(sp, z);
  });
  ringsB.forEach((ring, ii) => {
    return ring.forEach((p, j) => {
      const a = (ii * nr + j) * 3;
      PB[a] = p[0];
      PB[a + 1] = p[1];
      PB[a + 2] = rb[ii] - hl;
    });
  });
  const NB = dfcNormals(PB, nzB, nr);
  const fold14 = (s) => {
    return s <= 7 ? s : 14 - s;
  };
  const sfB = ring0.map((p) => {
    return fold14(p[2]);
  });
  const inArch = (z) => {
    return (
      Math.abs(z - sp.axF) < sp.arch + 0.03 ||
      Math.abs(z - sp.axR) < sp.arch + 0.03
    );
  };
  const bodyGeos = dfcGridGeos(PB, NB, nzB, nr, (ii, j) => {
    const zf = (rb[ii] + rb[ii + 1]) / 2;
    const j1 = (j + 1) % nr;
    const sf = (sfB[j] + sfB[j1]) / 2;
    if (
      detail &&
      zf > doorA &&
      zf < doorC &&
      sf >= 2.35 &&
      sf <= 4.9 &&
      ring0[j][0] + ring0[j1][0] < -0.05
    ) {
      return null;
    }
    if (sf < 1.5) {
      return "trim";
    }
    if (sf < (inArch(zf) ? 2 /* 2.0 */ : 2.28)) {
      return "trim";
    }
    return "paint";
  });
  if (bodyGeos.paint) {
    addMesh(bodyGeos.paint, paint);
  }
  if (bodyGeos.trim) {
    addMesh(bodyGeos.trim, trim);
  }
  addMesh(
    dfcCap(
      ringsB[0].map((p) => {
        return [p[0], p[1]];
      }),
      rb[0] - hl,
      -1
    ),
    trim
  );
  addMesh(
    dfcCap(
      ringsB[nzB - 1].map((p) => {
        return [p[0], p[1]];
      }),
      rb[nzB - 1] - hl,
      1
    ),
    paint
  );

  /* ---- greenhouse loft ---- */
  const cb = sp.cab;
  const cz = new Set([cb.ws, cb.rf, cb.rr, cb.rg]);
  if (cb.bp) {
    cz.add(cb.bp - 0.05);
    cz.add(cb.bp - 0.02);
    cz.add(cb.bp + 0.02);
    cz.add(cb.bp + 0.05);
  }
  [0.015, 0.04, 0.08, 0.13].forEach((d) => {
    cz.add(cb.ws + d);
    cz.add(cb.rg - d);
  });
  for (let z = cb.ws; z < cb.rg; z += 0.07) {
    cz.add(Math.round(z * 10000 /* 1e4 */) / 10000 /* 1e4 */);
  }
  const rc = [...cz]
    .filter((z) => {
      return (
        z >= cb.ws - 0.000001 /* 1e-6 */ && z <= cb.rg + 0.000001 /* 1e-6 */
      );
    })
    .sort((p, q) => {
      return p - q;
    });
  const ringC0 = dfcCabinRing(sp, rc[0]);
  const ncr = ringC0.length;
  const nzC = rc.length;
  const PC = new Float32Array(nzC * ncr * 3);
  rc.forEach((z, ii) => {
    return dfcCabinRing(sp, z).forEach((p, j) => {
      const a = (ii * ncr + j) * 3;
      PC[a] = p[0];
      PC[a + 1] = p[1];
      PC[a + 2] = z - hl;
    });
  });
  const NC = dfcNormals(PC, nzC, ncr);
  const fold12 = (s) => {
    return s <= 6 ? s : 12 - s;
  };
  const sfC = ringC0.map((p) => {
    return fold12(p[2]);
  });
  const cabGeos = dfcGridGeos(PC, NC, nzC, ncr, (ii, j) => {
    const zf = (rc[ii] + rc[ii + 1]) / 2;
    const j1 = (j + 1) % ncr;
    const sf = (sfC[j] + sfC[j1]) / 2;
    if (
      detail &&
      zf > doorA &&
      zf < doorC &&
      sf >= 2 &&
      sf <= 4.5 &&
      ringC0[j][0] + ringC0[j1][0] < -0.05
    ) {
      return null;
    }
    if (sf < 1.3) {
      return null;
    }
    // belt molding
    if (sf < 2 /* 2.0 */) {
      return "trim";
    }
    // B pillar
    if (cb.bp && Math.abs(zf - cb.bp) < 0.05 && sf < 4.45) {
      return "trim";
    }
    // sail panel / C pillar
    if (zf >= cb.cp && sf < 4.55) {
      return "paint";
    }
    // A pillar
    if (zf <= cb.rf + 0.02 && sf >= 3.45 && sf < 4.45) {
      return "paint";
    }
    // roof panel
    if (zf > cb.rf - 0.01 && zf < cb.rr && sf >= 4.45) {
      return "paint";
    }
    // rear glass vs rear quarter bands
    if (zf >= cb.rr && sf >= 4.45 && sf < cb.rgs) {
      return "paint";
    }
    return "glass";
  });
  if (cabGeos.glass) {
    addMesh(cabGeos.glass, glass, false, false);
  }
  if (cabGeos.paint) {
    addMesh(cabGeos.paint, paint);
  }
  if (cabGeos.trim) {
    addMesh(cabGeos.trim, trim);
  }
  if (detail) {
    const cabin = new Group();
    i.add(cabin);
    const upholstery = new MeshStandardMaterial({
      color: "#171a1e",
      roughness: 0.82,
      metalness: 0.02,
    });
    const softLeather = new MeshStandardMaterial({
      color: "#25292d",
      roughness: 0.76,
      metalness: 0.025,
    });
    const carpet = new MeshStandardMaterial({
      color: "#090b0d",
      roughness: 0.98,
      metalness: 0,
    });
    const cabinMetal = new MeshStandardMaterial({
      color: "#555d64",
      roughness: 0.35,
      metalness: 0.78,
    });
    const cabinChrome = new MeshStandardMaterial({
      color: "#aeb5b9",
      roughness: 0.22,
      metalness: 0.92,
    });
    const display = new MeshStandardMaterial({
      color: "#08151b",
      emissive: "#26758a",
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.18,
    });
    const cabinBox = (material, size, pos, rot = null, parent = cabin) => {
      const mesh = new Mesh(new BoxGeometry(...size), material);
      mesh.position.set(...pos);
      if (rot) {
        mesh.rotation.set(...rot);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const cabinCylinder = (
      material,
      radius,
      length,
      pos,
      rot = null,
      parent = cabin
    ) => {
      const mesh = new Mesh(
        new CylinderGeometry(radius, radius, length, 20),
        material
      );
      mesh.position.set(...pos);
      if (rot) {
        mesh.rotation.set(...rot);
      }
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };
    cabinBox(carpet, [1.46, 0.035, 2.2], [0, 0.205, 0.2]);
    cabinBox(upholstery, [1.48, 0.16, 0.25], [0, 0.72, cb.ws - hl + 0.08]);
    cabinBox(softLeather, [1.45, 0.075, 0.14], [0, 0.81, cb.ws - hl + 0.13]);
    cabinBox(upholstery, [0.13, 0.19, 1.05], [-0.725, 0.55, 0.25]);
    cabinBox(upholstery, [0.13, 0.19, 1.05], [0.725, 0.55, 0.25]);
    for (const side of [-1, 1]) {
      const seat = new Group();
      seat.position.set(side * 0.4, 0, 0.35);
      cabin.add(seat);
      cabinBox(upholstery, [0.5, 0.13, 0.53], [0, 0.32, 0], null, seat);
      cabinBox(softLeather, [0.4, 0.09, 0.4], [0, 0.39, -0.025], null, seat);
      cabinBox(
        upholstery,
        [0.48, 0.47, 0.13],
        [0, 0.61, 0.205],
        [-0.08, 0, 0],
        seat
      );
      cabinBox(
        softLeather,
        [0.34, 0.32, 0.025],
        [0, 0.62, 0.132],
        [-0.08, 0, 0],
        seat
      );
      for (const sx of [-1, 1]) {
        cabinBox(
          softLeather,
          [0.07, 0.42, 0.17],
          [sx * 0.205, 0.61, 0.19],
          [-0.08, 0, 0],
          seat
        );
        cabinBox(
          upholstery,
          [0.075, 0.17, 0.38],
          [sx * 0.215, 0.39, 0],
          null,
          seat
        );
      }
      cabinBox(upholstery, [0.24, 0.15, 0.12], [0, 0.91, 0.24], null, seat);
      for (const sx of [-1, 1]) {
        cabinCylinder(
          cabinMetal,
          0.012,
          0.13,
          [sx * 0.075, 0.84, 0.24],
          null,
          seat
        );
      }
    }
    const dashZ = cb.ws - hl + 0.02;
    cabinBox(
      upholstery,
      [1.53, 0.19, 0.25],
      [0, 0.69, dashZ + 0.2],
      [-0.12, 0, 0]
    );
    cabinBox(
      softLeather,
      [1.46, 0.035, 0.19],
      [0, 0.8, dashZ + 0.2],
      [-0.12, 0, 0]
    );
    cabinBox(
      cabinMetal,
      [0.39, 0.105, 0.018],
      [0.35, 0.73, dashZ + 0.065],
      [-0.1, 0, 0]
    );
    cabinBox(
      display,
      [0.34, 0.075, 0.014],
      [0.35, 0.74, dashZ + 0.052],
      [-0.1, 0, 0]
    );
    cabinBox(cabinChrome, [0.49, 0.018, 0.018], [0.35, 0.665, dashZ + 0.05]);
    for (const side of [-1, 1]) {
      const dial = new Mesh(new TorusGeometry(0.064, 0.009, 8, 24), cabinMetal);
      dial.position.set(-0.4 + side * 0.085, 0.735, dashZ + 0.045);
      dial.rotation.y = Math.PI;
      cabin.add(dial);
      const face = new Mesh(new TorusGeometry(0.052, 0.006, 8, 24), display);
      face.position.set(-0.4 + side * 0.085, 0.735, dashZ + 0.035);
      face.rotation.y = Math.PI;
      cabin.add(face);
    }
    const steering = new Group();
    steering.position.set(-0.4, 0.665, dashZ + 0.48);
    steering.rotation.y = Math.PI;
    cabin.add(steering);
    steering.add(new Mesh(new TorusGeometry(0.17, 0.021, 10, 36), upholstery));
    cabinCylinder(
      cabinChrome,
      0.038,
      0.045,
      [0, 0, 0],
      [Math.PI / 2, 0, 0],
      steering
    );
    for (let spoke = 0; spoke < 3; spoke++) {
      const bar = cabinBox(
        cabinChrome,
        [0.016, 0.135, 0.014],
        [0, 0, 0],
        null,
        steering
      );
      bar.rotation.z = (spoke * Math.PI * 2) / 3;
    }
    cabinBox(
      upholstery,
      [0.09, 0.09, 0.24],
      [-0.4, 0.56, dashZ + 0.56],
      [-0.27, 0, 0]
    );
    cabinBox(upholstery, [0.3, 0.105, 0.98], [0.05, 0.34, 0.26], [-0.06, 0, 0]);
    cabinBox(
      softLeather,
      [0.28, 0.035, 0.68],
      [0.05, 0.405, 0.22],
      [-0.06, 0, 0]
    );
    const gearLever = new Group();
    gearLever.position.set(0.13, 0.4, 0.12);
    cabin.add(gearLever);
    cabinCylinder(
      cabinChrome,
      0.014,
      0.16,
      [0, 0.075, 0],
      [-0.32, 0, 0],
      gearLever
    );
    const gearKnob = new Mesh(new SphereGeometry(0.043, 14, 10), upholstery);
    gearKnob.position.set(0, 0.15, -0.025);
    gearLever.add(gearKnob);
    const handbrake = new Group();
    handbrake.position.set(-0.1, 0.4, 0.25);
    cabin.add(handbrake);
    cabinCylinder(cabinMetal, 0.013, 0.2, [0, 0.1, 0], [-0.3, 0, 0], handbrake);
    cabinBox(
      upholstery,
      [0.065, 0.04, 0.095],
      [0, 0.2, -0.045],
      null,
      handbrake
    );
    for (const [px, width] of [
      [-0.59, 0.085],
      [-0.43, 0.105],
      [-0.27, 0.09],
    ]) {
      const pedal = new Group();
      pedal.position.set(px, 0.245, dashZ + 0.53);
      cabin.add(pedal);
      cabinBox(
        cabinMetal,
        [width, 0.13, 0.025],
        [0, 0, -0.025],
        [-0.2, 0, 0],
        pedal
      );
      for (let line = -1; line <= 1; line++) {
        cabinBox(
          upholstery,
          [width * 0.68, 0.009, 0.008],
          [0, line * 0.033, -0.041],
          null,
          pedal
        );
      }
    }
  }
  let accessDoor = null;
  if (detail) {
    const hingeSf = 3.35;
    const hingeP = dfcPointAt(dfcRightHalf(dfcBodyRing(sp, doorA)), hingeSf);
    let hx = hingeP[4];
    let hy = -hingeP[3];
    let hn = Math.hypot(hx, hy) || 1;
    hx /= hn;
    hy /= hn;
    accessDoor = new Group();
    accessDoor.position.set(
      -(hingeP[0] + hx * 0.008),
      hingeP[1] + hy * 0.008,
      doorA - hl
    );
    i.add(accessDoor);
    const buildDoorSurface = (
      zStart,
      zEnd,
      sfStart,
      sfEnd,
      cabinSurface,
      material,
      offset
    ) => {
      const nz = 18;
      const ns = 12;
      const positions = [];
      const normals = [];
      const indices = [];
      for (let zi = 0; zi <= nz; zi++) {
        const zf = zStart + ((zEnd - zStart) * zi) / nz;
        const ring = cabinSurface ? dfcCabinRing(sp, zf) : dfcBodyRing(sp, zf);
        const half = dfcRightHalf(ring);
        for (let si = 0; si <= ns; si++) {
          const sf = sfStart + ((sfEnd - sfStart) * si) / ns;
          const p = dfcPointAt(half, sf);
          let nx = p[4];
          let ny = -p[3];
          let length = Math.hypot(nx, ny) || 1;
          nx /= length;
          ny /= length;
          positions.push(
            -(p[0] + nx * offset) - accessDoor.position.x,
            p[1] + ny * offset - accessDoor.position.y,
            zf - hl - accessDoor.position.z
          );
          normals.push(-nx, ny, 0);
        }
      }
      for (let zi = 0; zi < nz; zi++) {
        for (let si = 0; si < ns; si++) {
          const a = zi * (ns + 1) + si;
          const b = a + ns + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
      const geometry = dfcBuf(positions, normals, indices);
      const mesh = new Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      accessDoor.add(mesh);
    };
    buildDoorSurface(
      doorA + 0.015,
      doorC - 0.015,
      2.38,
      4.62,
      false,
      paint,
      0.014
    );
    buildDoorSurface(
      doorA + 0.045,
      doorC - 0.045,
      2.35,
      4.42,
      true,
      new MeshPhysicalMaterial({
        color: "#17232b",
        metalness: 0.18,
        roughness: 0.12,
        transparent: true,
        opacity: 0.62,
        side: 2,
        depthWrite: false,
      }),
      0.023
    );
    const handlePoint = dfcPointAt(
      dfcRightHalf(dfcBodyRing(sp, doorC - 0.3)),
      4.15
    );
    let handleNx = handlePoint[4];
    let handleNy = -handlePoint[3];
    let handleLength = Math.hypot(handleNx, handleNy) || 1;
    handleNx /= handleLength;
    handleNy /= handleLength;
    const doorHandle = new Mesh(new BoxGeometry(0.17, 0.025, 0.035), chrome);
    doorHandle.position.set(
      -(handlePoint[0] + handleNx * 0.035) - accessDoor.position.x,
      handlePoint[1] + handleNy * 0.035 - accessDoor.position.y,
      doorC - 0.3 - hl - accessDoor.position.z
    );
    accessDoor.add(doorHandle);
  }

  /* ---- wheels and arches ---- */
  const ae = [];
  for (const [za, tw, sx] of [
    [sp.axF, sp.twF, -1],
    [sp.axF, sp.twF, 1],
    [sp.axR, sp.twR, -1],
    [sp.axR, sp.twR, 1],
  ]) {
    const x = sx * (sp.hw(za) - tw / 2 - 0.035);
    const w = dfcWheel(wm, {
      R: sp.R,
      tw,
      seg: segW,
      spokes: 5,
      calAng: 0 /* 0.0 */,
    });
    w.position.set(x, sp.R, za - hl);
    if (sx < 0) {
      w.rotation.y = Math.PI;
    }
    i.add(w);
    ae.push(w);
    const outer = sp.hw(za) * 0.925 - 0.01;
    const wid = 0.5;
    const liner = new Mesh(
      new CylinderGeometry(
        sp.arch - 0.012,
        sp.arch - 0.012,
        wid,
        30,
        1,
        true,
        -0.6,
        Math.PI + 1.2
      ),
      linerMat
    );
    liner.rotation.z = Math.PI / 2;
    liner.position.set(sx * (outer - wid / 2), sp.R, za - hl);
    i.add(liner);
  }

  /* ================= details ================= */
  const brake = [];

  const heads = [];
  const beamList = [];
  const carbon = new MeshStandardMaterial({
    color: "#0b0d10",
    metalness: 0.55,
    roughness: 0.38,
  });
  const lineMat = new MeshStandardMaterial({
    color: "#06080a",
    roughness: 0.6,
    metalness: 0.2,
  });
  const place = (geo, mat, S, off = 0, cast = false) => {
    const m = new Mesh(geo, mat);
    i.add(m);
    m.position.set(S.x + S.nx * off, S.y + S.ny * off, S.z - hl + S.nz * off);
    m.lookAt(m.position.x + S.nx, m.position.y + S.ny, m.position.z + S.nz);
    m.castShadow = cast;
    m.receiveShadow = true;
    return m;
  };
  const unitSph = new SphereGeometry(1, 18, 12);
  const front = -hl;
  const rear = hl;
  const cbz = sp.cab;
  const lamp = Object.assign(
    {
      hz: 0.2,
      hs: 4.55,
      hw: 0.21,
      hh: 0.07,
      tz: L - 0.13,
      ts: 4.5,
      tw: 0.26,
      th: 0.065,
    },
    sp.lamp || {}
  );

  /* shut lines and hood cuts */
  for (const sd of [-1, 1]) {
    if (!(detail && sd < 0)) {
      for (const zl of [doorA, doorC]) {
        addMesh(
          dfcRibbonZ(sp, zl, 2.35, 4.9, 0.012, 0.0025, sd, hl),
          lineMat,
          false,
          false
        );
      }
    }
    addMesh(
      dfcRibbonS(sp, 5.6, 0.05, 0.45, cbz.ws - 0.03, 0.002, sd, hl),
      lineMat,
      false,
      false
    );
    // door handle
    if (!(detail && sd < 0)) {
      const hS = dfcSurf(sp, doorC - 0.3, 4.15, sd);
      place(new BoxGeometry(0.17, 0.02, 0.03), chrome, hS, -0.004);
    }

    // mirrors
    const zM = cbz.ws + 0.28;

    const wbM = sp.hw(zM) - cbz.inset - 0.02;
    const yM = sp.cabBase(zM) + 0.12;
    const mirror = new Mesh(unitSph, paint);
    i.add(mirror);
    mirror.scale.set(0.055, 0.048, 0.1);
    mirror.position.set(sd * (wbM + 0.13), yM + 0.045, zM - hl - 0.02);
    mirror.castShadow = true;
    const stalk = new Mesh(new BoxGeometry(0.12, 0.018, 0.04), trim);
    i.add(stalk);
    stalk.position.set(sd * (wbM + 0.07), yM, zM - hl);
  }
  addMesh(
    dfcRibbonZ(sp, 0.55, 5 /* 5.0 */, 7 /* 7.0 */, 0.01, 0.002, 1, hl),
    lineMat,
    false,
    false
  );
  addMesh(
    dfcRibbonZ(sp, 0.55, 5 /* 5.0 */, 7 /* 7.0 */, 0.01, 0.002, -1, hl),
    lineMat,
    false,
    false
  );

  /* headlights */
  for (const sd of [-1, 1]) {
    const S = dfcSurf(sp, lamp.hz, lamp.hs, sd);
    const lens = place(unitSph, lensMat, S, 0.004);
    lens.scale.set(lamp.hw, lamp.hh, 0.04);
    const core = place(unitSph, lampMat, S, -0.004);
    core.scale.set(lamp.hw * 0.8, lamp.hh * 0.55, 0.03);
    heads.push(core);
    const drl = place(
      new BoxGeometry(lamp.hw * 1.5, 0.012, 0.012),
      new MeshBasicMaterial({
        color: "#e8f4ff",
      }),
      S,
      0.018
    );
    drl.translateY(-lamp.hh * 0.7);
    // front indicator
    const ind = dfcSurf(sp, lamp.hz + 0.06, lamp.hs - 1.7, sd);
    const lens2 = place(unitSph, amber, ind, 0.002);
    lens2.scale.set(0.07, 0.022, 0.02);
  }
  /* tail lights */
  for (const sd of [-1, 1]) {
    const S = dfcSurf(sp, lamp.tz, lamp.ts, sd);
    const m = new MeshStandardMaterial({
      color: "#a30f0f",
      emissive: "#ff2020",
      emissiveIntensity: 0.15,
      roughness: 0.3,
    });
    const tl = place(unitSph, m, S, -0.004);
    tl.scale.set(lamp.tw, lamp.th, 0.03);
    brake.push(tl);
  }
  {
    const bar = new MeshStandardMaterial({
      color: "#1a0404",
      emissive: "#ff3030",
      emissiveIntensity: 0.5,
      roughness: 0.4,
    });
    const yB = (sp.yBot(L) + sp.yTop(L)) / 2 + 0.1;
    const strip = new Mesh(
      new BoxGeometry(hwMax * 1 /* 1.0 */, 0.02, 0.012),
      bar
    );
    i.add(strip);
    strip.position.set(0, yB, hl + 0.006);
    const rev = new Mesh(
      new BoxGeometry(0.14, 0.03, 0.012),
      new MeshStandardMaterial({
        color: "#dfe6ea",
        emissive: "#ffffff",
        emissiveIntensity: 0.35,
        roughness: 0.3,
      })
    );
    i.add(rev);
  }

  /* focused player headlight spotlights */
  if (r) {
    const hz = lamp.hz;
    for (const sd of [-1, 1]) {
      const S = dfcSurf(sp, hz, lamp.hs, sd);
      const sl = new SpotLight("#fff0d8", 10, 56, 0.27, 0.72, 2);
      sl.position.set(S.x, S.y, S.z - hl - 0.05);
      const tg = new Object3D();
      tg.position.set(sd * 0.28, -1.35, -hl - 32);
      i.add(tg);
      sl.target = tg;
      i.add(sl);
      beamList.push(sl);
    }
  }

  /* police package: roof light bar, dark door panels, push bar */
  if (n) {
    const zc = (cbz.rf + cbz.rr) / 2;
    const yr = sp.roofY(zc) + 0.03;
    const barBase = new Mesh(new BoxGeometry(0.62, 0.07, 0.3), trim);
    barBase.position.set(0, yr + 0.035, zc - hl);
    i.add(barBase);
    for (const ex of [-0.17, 0.17]) {
      const lm = new MeshBasicMaterial({
        color: ex < 0 ? "#3a8eff" : "#ff3434",
      });
      const lb = new Mesh(new BoxGeometry(0.3, 0.1, 0.26), lm);
      lb.position.set(ex, yr + 0.115, zc - hl);
      lb.name = ex < 0 ? "blue" : "red";
      i.add(lb);
    }
    const glow = new Mesh(
      new BoxGeometry(0.12, 0.05, 0.12),
      new MeshBasicMaterial({
        color: "#fff8a0",
      })
    );
    glow.position.set(0, yr + 0.1, zc - hl);
    i.add(glow);
    for (const sd of [-1, 1]) {
      addMesh(
        dfcRibbonS(
          sp,
          3.3,
          1 /* 1.0 */,
          doorA + 0.02,
          doorC - 0.02,
          0.004,
          sd,
          hl
        ),
        trim,
        false,
        false
      );
    }
    const pb = new Mesh(new BoxGeometry(hwMax * 1.15, 0.07, 0.05), chrome);
    pb.position.set(0, sp.yBot(0) + 0.1, front - 0.05);
    i.add(pb);
  }

  /* grille bars + plates */
  {
    const y0 = sp.yBot(0) + 0.05;
    const y1 = sp.yTop(0) - 0.05;
    const wG = sp.hw(0) * 1.15;
    for (let k = 0; k < 4; k++) {
      const gb = new Mesh(new BoxGeometry(wG, 0.012, 0.012), chrome);
      i.add(gb);
      gb.position.set(0, y0 + ((y1 - y0) * (k + 0.5)) / 4, front - 0.004);
    }
    const plateTex =
      Vw._plateTex ||
      (Vw._plateTex = (() => {
        const cv = document.createElement("canvas");
        cv.width = 256;
        cv.height = 64;
        const q = cv.getContext("2d");
        q.fillStyle = "#f1efe4";
        q.fillRect(0, 0, 256, 64);
        q.fillStyle = "#1b3a8a";
        q.fillRect(0, 0, 22, 64);
        q.fillStyle = "#ffffff";
        q.font = "bold 11px monospace";
        q.textAlign = "center";
        q.fillText("DF", 11, 54);
        q.fillStyle = "#16181c";
        q.font = "bold 40px monospace";
        q.fillText("FURY 77", 140, 47);
        q.strokeStyle = "#16181c";
        q.lineWidth = 3;
        q.strokeRect(1.5, 1.5, 253, 61);
        const tx = new CanvasTexture(cv);
        tx.anisotropy = 8;
        return tx;
      })());
    const plateMat =
      Vw._plateMat ||
      (Vw._plateMat = new MeshStandardMaterial({
        map: plateTex,
        roughness: 0.4,
        metalness: 0.1,
      }));
    const fp = new Mesh(new PlaneGeometry(0.5, 0.125), plateMat);
    fp.rotation.y = Math.PI;
    fp.position.set(0, (sp.yBot(0) + sp.yTop(0)) / 2 - 0.03, front - 0.012);
    i.add(fp);
    const rp = new Mesh(new PlaneGeometry(0.5, 0.125), plateMat);
    rp.position.set(0, (sp.yBot(L) + sp.yTop(L)) / 2 - 0.02, rear + 0.012);
    i.add(rp);
  }

  /* exhaust */
  {
    const xs =
      kind === "gtr" || kind === "hyper"
        ? [-0.62, -0.46, 0.46, 0.62]
        : [-0.5, 0.5];
    for (const x of xs) {
      const tip = new Mesh(
        new CylinderGeometry(0.05, 0.05, 0.2, 20, 1, true),
        chrome
      );
      tip.material.side = 2;
      tip.rotation.x = Math.PI / 2;
      tip.position.set(x, sp.yBot(L) + 0.07, rear + 0.015);
      i.add(tip);
      const inner = new Mesh(
        new CylinderGeometry(0.042, 0.042, 0.02, 16),
        matte
      );
      inner.rotation.x = Math.PI / 2;
      inner.position.set(x, sp.yBot(L) + 0.07, rear - 0.06);
      i.add(inner);
    }
  }

  /* aero: spoilers and wings */
  {
    const mkShape = (pts) => {
      const sh_ = new Shape();
      sh_.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) {
        sh_.lineTo(pts[k][0], pts[k][1]);
      }
      sh_.closePath ? sh_.closePath() : 0;
      return sh_;
    };
    const wingPack = (chord, hgt, span, zc, thick) => {
      const yD = sp.yTop(zc) - 0.02;
      const yW = yD + hgt;
      const zc_ = zc - hl;
      const blade = mkShape([
        [zc_ - chord / 2, yW + thick * 0.3],
        [zc_ - chord * 0.3, yW + thick],
        [zc_ + chord / 2, yW + thick * 0.25],
        [zc_ + chord / 2, yW],
        [zc_ - chord * 0.2, yW - thick * 0.3],
        [zc_ - chord / 2, yW + thick * 0.1],
      ]);
      i.add(Lw(blade, span, carbon, 0.006));
      for (const sx of [-1, 1]) {
        const stand = mkShape([
          [zc_ - 0.05, yD],
          [zc_ + 0.06, yD],
          [zc_ + 0.03, yW - 0.005],
          [zc_ - 0.05, yW - 0.005],
        ]);
        const m = Lw(stand, 0.035, carbon, 0.004);
        m.position.x = sx * span * 0.27;
        i.add(m);
        const plate = mkShape([
          [zc_ - chord / 2 - 0.02, yW - 0.08],
          [zc_ + chord / 2 + 0.03, yW - 0.04],
          [zc_ + chord / 2 + 0.03, yW + 0.1],
          [zc_ - chord / 2 - 0.02, yW + 0.06],
        ]);
        const pm = Lw(plate, 0.016, carbon, 0.004);
        pm.position.x = sx * (span / 2 + 0.008);
        i.add(pm);
      }
    };
    const lip = (z1, z2, h, span) => {
      const y0 = sp.yTop(z1) - 0.02;
      const a = z1 - hl;
      const b = z2 - hl;
      const shp = mkShape([
        [a, y0],
        [b - 0.03, y0 + h],
        [b, y0 + h],
        [b, y0 + h * 0.55],
        [b - 0.1, y0],
      ]);
      i.add(Lw(shp, span, paint, 0.008));
    };
    if (kind === "gtr") {
      wingPack(0.34, 0.3, hwMax * 1.82, L - 0.42, 0.04);
    } else if (kind === "hyper") {
      wingPack(0.42, 0.42, hwMax * 1.8, L - 0.5, 0.05);
    } else if (kind === "super") {
      lip(L - 0.75, L - 0.1, 0.1, hwMax * 1.5);
    } else if (kind === "porsche") {
      lip(L - 0.75, L - 0.12, 0.13, hwMax * 1.4);
    } else if (kind === "muscle") {
      lip(L - 0.55, L - 0.08, 0.07, hwMax * 1.6);
    } else {
      lip(L - 0.55, L - 0.08, 0.07, hwMax * 1.55);
    }
  }
  ae.forEach((w) => {
    return Iw(w);
  });
  Iw(i, new Set([...brake, ...heads]));
  i.userData = {
    wheels: ae,
    brakeLights: brake,
    headlights: heads,
    headlightBeams: beamList,
    accessDoor,
  };
  return i;
}

var Hw = (e) => {
  return -25 + Math.sin((e + 170) / 45) * 58;
};

var Uw = (e, t) => {
  return t < -150 && e < 120 ? Math.min(42, (-t - 150) * 0.14) : 0;
};

function Ww(e) {
  let t = e >>> 0;
  return () => {
    t = (t + 1831565813) >>> 0;
    let e = t;
    e = Math.imul(e ^ (e >>> 15), e | 1);
    e ^= e + Math.imul(e ^ (e >>> 7), e | 61);
    return ((e ^ (e >>> 14)) >>> 0) / 4294967296;
  };
}
function Gw(e, t, n, r, i) {
  let a = Ww(i);
  let o = new Float32Array(t * t);
  let s = 1;
  let c = 0;
  for (let e = 0; e < n; e++) {
    let n = 2 ** e;
    t / n;
    let i = new Float32Array((n + 1) * (n + 1));
    for (let e = 0; e < i.length; e++) {
      i[e] = a();
    }
    for (let e = 0; e < t; e++) {
      for (let r = 0; r < t; r++) {
        let a = (r / t) * n;
        let c = (e / t) * n;
        let l = Math.floor(a);
        let u = Math.floor(c);
        let d = a - l;
        let f = c - u;
        let p = i[u * (n + 1) + l];
        let m = i[u * (n + 1) + l + 1];
        let h = i[(u + 1) * (n + 1) + l];
        let g = i[(u + 1) * (n + 1) + l + 1];
        let _ = d * d * (3 - 2 * d);
        let v = f * f * (3 - 2 * f);
        o[e * t + r] +=
          (p * (1 - _) * (1 - v) +
            m * _ * (1 - v) +
            h * (1 - _) * v +
            g * _ * v) *
          s;
      }
    }
    c += s;
    s *= r;
  }
  return {
    grid: o,
    max: c,
  };
}
function Kw(e = 6) {
  let t = document.createElement("canvas");
  t.width = 256;
  t.height = 256;
  let n = t.getContext("2d");
  let { grid: r, max: i } = Gw(n, 256, 5, 0.55, 1337);
  let a = n.createImageData(256, 256);
  for (let e = 0; e < 65536; e++) {
    let t = 36 + (r[e] / i) * 26;
    a.data[e * 4] = t;
    a.data[e * 4 + 1] = t + 2;
    a.data[e * 4 + 2] = t + 4;
    a.data[e * 4 + 3] = 255;
  }
  n.putImageData(a, 0, 0);
  n.strokeStyle = "rgba(0,0,0,0.5)";
  n.lineWidth = 1;
  for (let e = 0; e < 14; e++) {
    n.beginPath();
    let e = Math.random() * 256;
    let t = Math.random() * 256;
    n.moveTo(e, t);
    for (let r = 0; r < 18; r++) {
      e += (Math.random() - 0.5) * 26;
      t += (Math.random() - 0.5) * 26;
      n.lineTo(e, t);
    }
    n.stroke();
  }
  for (let e = 0; e < 10; e++) {
    let e = n.createRadialGradient(
      Math.random() * 256,
      Math.random() * 256,
      0,
      Math.random() * 256,
      Math.random() * 256,
      14
    );
    e.addColorStop(0, "rgba(10,10,12,0.5)");
    e.addColorStop(1, "rgba(10,10,12,0)");
    n.fillStyle = e;
    n.fillRect(0, 0, 256, 256);
  }
  for (let e = 0; e < 1800; e++) {
    n.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
    n.fillRect(Math.random() * 256, Math.random() * 256, 1.4, 1.4);
  }
  let o = new CanvasTexture(t);
  o.wrapS = RepeatWrapping;
  o.wrapT = RepeatWrapping;
  o.anisotropy = 8;
  o.repeat.set(e, e);
  return o;
}
function qw(e, t = 2.4) {
  const sourceCanvas = e.image || e;
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const source = sourceCanvas
    .getContext("2d")
    .getImageData(0, 0, width, height).data;
  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = width;
  normalCanvas.height = height;
  const context = normalCanvas.getContext("2d");
  const image = context.createImageData(width, height);
  const sample = (x, y) => {
    return (
      source[
        (Math.min(height - 1, Math.max(0, y)) * width +
          Math.min(width - 1, Math.max(0, x))) *
          4
      ] / 255
    );
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) * t;
      const dy = (sample(x, y + 1) - sample(x, y - 1)) * t;
      const length = Math.hypot(dx, dy, 1) || 1;
      const index = (y * width + x) * 4;
      image.data[index] = ((dx / length) * 0.5 + 0.5) * 255;
      image.data[index + 1] = ((dy / length) * 0.5 + 0.5) * 255;
      image.data[index + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const normalMap = new CanvasTexture(normalCanvas);
  normalMap.wrapS = RepeatWrapping;
  normalMap.wrapT = RepeatWrapping;
  normalMap.anisotropy = 8;
  return normalMap;
}
function Jw(e = 6) {
  const S = 512;
  const mk = () => {
    const cv = document.createElement("canvas");
    cv.width = S;
    cv.height = S;
    return cv;
  };
  const rnd = Ww(4242 + e);
  const A = mk();
  const H = mk();
  const R = mk();
  const a = A.getContext("2d");
  const h = H.getContext("2d");
  const r = R.getContext("2d");
  const wrap = (fn) => {
    for (const ox of [-S, 0, S]) {
      for (const oy of [-S, 0, S]) {
        for (const c of [a, h, r]) {
          c.save();
          c.translate(ox, oy);
        }
        fn();
        for (const c of [a, h, r]) {
          c.restore();
        }
      }
    }
  };
  a.fillStyle = "#45494e";
  a.fillRect(0, 0, S, S);
  h.fillStyle = "#808080";
  h.fillRect(0, 0, S, S);
  r.fillStyle = "#c4c4c4";
  r.fillRect(0, 0, S, S);
  // broad tonal variation
  for (let q = 0; q < 95; q++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const rad = 24 + rnd() * 82;
    const dark = rnd() > 0.5;
    wrap(() => {
      const gr = a.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(
        0,
        dark ? "rgba(12,14,17,0.09)" : "rgba(185,192,198,0.055)"
      );
      gr.addColorStop(1, "rgba(0,0,0,0)");
      a.fillStyle = gr;
      a.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    });
  }
  // aggregate: fine stones, they carry the bump and the sparkle
  for (let q = 0; q < 56000; q++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const sz = 0.6 + rnd() * 1; /* 1.0 */
    const t = rnd();
    a.fillStyle =
      t > 0.68
        ? `rgba(151,158,164,${0.1 + rnd() * 0.2})`
        : t > 0.28
        ? `rgba(18,21,24,${0.14 + rnd() * 0.24})`
        : `rgba(91,94,97,${0.1 + rnd() * 0.19})`;
    a.fillRect(x, y, sz, sz);
    h.fillStyle =
      t > 0.68
        ? `rgba(255,255,255,${0.16 + rnd() * 0.22})`
        : `rgba(0,0,0,${0.12 + rnd() * 0.22})`;
    h.fillRect(x, y, sz, sz);
  }
  // old repair patches
  for (let q = 0; q < 2; q++) {
    const x = rnd() * S * 0.8;
    const y = rnd() * S * 0.8;
    const pw = 60 + rnd() * 120;
    const ph = 40 + rnd() * 90;
    wrap(() => {
      a.fillStyle = "rgba(14,15,18,0.13)";
      a.fillRect(x, y, pw, ph);
      a.strokeStyle = "rgba(5,5,6,0.22)";
      a.lineWidth = 1.2;
      a.strokeRect(x, y, pw, ph);
      h.strokeStyle = "rgba(0,0,0,0.45)";
      h.lineWidth = 1.5;
      h.strokeRect(x, y, pw, ph);
      r.fillStyle = "rgba(170,170,170,0.35)";
      r.fillRect(x, y, pw, ph);
    });
  }
  // thin cracks
  for (let q = 0; q < 7; q++) {
    let x = rnd() * S;
    let y = rnd() * S;
    const pts = [[x, y]];
    for (let k = 0; k < 24; k++) {
      x += (rnd() - 0.5) * 18;
      y += (rnd() - 0.35) * 18;
      pts.push([x, y]);
    }
    wrap(() => {
      for (const [c, col, lw] of [
        [a, "rgba(4,4,5,0.75)", 1.1],
        [h, "rgba(0,0,0,0.9)", 2.4],
      ]) {
        c.strokeStyle = col;
        c.lineWidth = lw;
        c.beginPath();
        pts.forEach(([px, py], k) => {
          return k ? c.lineTo(px, py) : c.moveTo(px, py);
        });
        c.stroke();
      }
    });
  }
  // oil drips: darker and glossier
  for (let q = 0; q < 8; q++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const rad = 12 + rnd() * 30;
    wrap(() => {
      let gr = a.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, "rgba(6,6,8,0.55)");
      gr.addColorStop(1, "rgba(6,6,8,0)");
      a.fillStyle = gr;
      a.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      gr = r.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, "rgba(70,70,70,0.9)");
      gr.addColorStop(1, "rgba(70,70,70,0)");
      r.fillStyle = gr;
      r.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    });
  }
  const tex = (cv, srgb) => {
    const t = new CanvasTexture(cv);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.anisotropy = 8;

    if (srgb) {
      t.colorSpace = "srgb";
    }

    return t;
  };
  const mat = new MeshPhysicalMaterial({
    map: tex(A, true),
    normalMap: qw(H, 2.8),
    normalScale: new Vector2(1.15, 1.15),
    roughnessMap: tex(R, false),
    roughness: 1,
    metalness: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.85,
    color: "#ffffff",
  });
  mat.userData.tile = 10;
  return mat;
}
function Yw(e = 4) {
  let t = document.createElement("canvas");
  t.width = 256;
  t.height = 256;
  let n = t.getContext("2d");
  let { grid: r, max: i } = Gw(n, 256, 4, 0.5, 4242);
  let a = n.createImageData(256, 256);
  for (let e = 0; e < 65536; e++) {
    let t = 110 + (r[e] / i) * 30;
    a.data[e * 4] = t;
    a.data[e * 4 + 1] = t + 1;
    a.data[e * 4 + 2] = t + 3;
    a.data[e * 4 + 3] = 255;
  }
  n.putImageData(a, 0, 0);
  n.strokeStyle = "rgba(0,0,0,0.4)";
  n.lineWidth = 2;
  for (let e = 0; e <= 256; e += 64) {
    n.beginPath();
    n.moveTo(e, 0);
    n.lineTo(e, 256);
    n.stroke();
    n.beginPath();
    n.moveTo(0, e);
    n.lineTo(256, e);
    n.stroke();
  }
  for (let e = 0; e < 1200; e++) {
    n.fillStyle = `rgba(0,0,0,${Math.random() * 0.25})`;
    n.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
  }
  let o = new CanvasTexture(t);
  o.wrapS = RepeatWrapping;
  o.wrapT = RepeatWrapping;
  o.anisotropy = 8;
  o.repeat.set(e, e);
  return o;
}
function Xw() {
  let e = document.createElement("canvas");
  e.width = 256;
  e.height = 256;
  let t = e.getContext("2d");
  let { grid: n, max: r } = Gw(t, 256, 5, 0.55, 7777);
  let i = t.createImageData(256, 256);
  for (let e = 0; e < 65536; e++) {
    let t = n[e] / r;
    i.data[e * 4] = 28 + t * 26;
    i.data[e * 4 + 1] = 50 + t * 36;
    i.data[e * 4 + 2] = 36 + t * 22;
    i.data[e * 4 + 3] = 255;
  }
  t.putImageData(i, 0, 0);
  for (let e = 0; e < 1600; e++) {
    t.fillStyle = `rgba(20,40,24,${Math.random() * 0.4})`;
    t.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6);
  }
  let a = new CanvasTexture(e);
  a.wrapS = RepeatWrapping;
  a.wrapT = RepeatWrapping;
  a.anisotropy = 8;
  a.repeat.set(30, 30);
  return a;
}
function Zw(e, t, n, r, i, a) {
  let o = document.createElement("canvas");
  o.width = 256;
  o.height = 512;
  let s = o.getContext("2d");
  s.fillStyle = e;
  s.fillRect(0, 0, 256, 512);
  s.fillStyle = "rgba(0,0,0,0.14)";
  for (let e = 0; e <= i; e++) {
    s.fillRect((256 / i) * e - 1, 0, 2, 512);
  }
  s.fillStyle = "rgba(0,0,0,0.18)";
  for (let e = 0; e <= r; e++) {
    s.fillRect(0, (512 / r) * e - 1, 256, 2);
  }
  let c = 256 / i;
  let l = 512 / r;
  let u = Math.min(c, l) * 0.18;
  for (let e = 0; e < r; e++) {
    for (let r = 0; r < i; r++) {
      let i = Math.random() > 0.42;

      if (a === "glass") {
        (s.fillStyle = i ? t : "#16202a"),
          s.fillRect(r * c + u, e * l + u, c - u * 2, l - u * 2),
          (s.fillStyle = "rgba(255,255,255,0.06)"),
          s.fillRect(r * c + u, e * l + u, c - u * 2, l * 0.4);
      } else {
        (s.fillStyle = i ? t : n),
          s.fillRect(r * c + u, e * l + u, c - u * 2, l - u * 2),
          (s.strokeStyle = "rgba(0,0,0,0.45)"),
          (s.lineWidth = 1),
          s.strokeRect(r * c + u, e * l + u, c - u * 2, l - u * 2),
          (s.fillStyle = "rgba(0,0,0,0.3)"),
          s.fillRect(r * c + c / 2 - 1, e * l + u, 2, l - u * 2),
          i &&
            ((s.fillStyle = "rgba(255,235,190,0.22)"),
            s.fillRect(r * c + u, e * l + u, c - u * 2, l * 0.25));
      }
    }
  }
  let d = new CanvasTexture(o);
  d.wrapS = RepeatWrapping;
  d.wrapT = RepeatWrapping;
  d.anisotropy = 8;
  return d;
}
function Qw(e, t) {
  let n = document.createElement("canvas");
  n.width = 256;
  n.height = 512;
  let r = n.getContext("2d");
  r.fillStyle = "#000";
  r.fillRect(0, 0, 256, 512);
  let i = 256 / t;
  let a = 512 / e;
  let o = Math.min(i, a) * 0.18;
  for (let n = 0; n < e; n++) {
    for (let e = 0; e < t; e++) {
      if (Math.random() > 0.42) {
        (r.fillStyle = Math.random() > 0.7 ? "#cfe8ff" : "#ffe9c0"),
          r.fillRect(e * i + o, n * a + o, i - o * 2, a - o * 2);
      }
    }
  }
  let s = new CanvasTexture(n);
  s.wrapS = RepeatWrapping;
  s.wrapT = RepeatWrapping;
  s.anisotropy = 8;
  return s;
}
function $w(e) {
  let t = [];
  let n = [];
  let r = Jw(6);
  let i = Jw(10);

  let a = new MeshStandardMaterial({
    map: Yw(),
    roughness: 0.82,
    metalness: 0.05,
    color: "#aab0b6",
  });

  let o = new MeshStandardMaterial({
    map: Yw(2),
    roughness: 0.85,
    color: "#8a9098",
  });

  let s = new MeshStandardMaterial({
    map: Xw(),
    roughness: 1,
    metalness: 0,
    color: "#5a7a5e",
  });

  let c = new MeshBasicMaterial({
    color: "#e8e6d8",
  });

  let l = new MeshBasicMaterial({
    color: "#e8c84a",
  });

  let d = new MeshStandardMaterial({
    color: "#2a3036",
    metalness: 0.7,
    roughness: 0.5,
  });

  let f = new MeshStandardMaterial({
    color: "#1a1e22",
    roughness: 0.8,
    metalness: 0.3,
  });

  let p = new MeshStandardMaterial({
    color: "#1a1e22",
    metalness: 0.6,
    roughness: 0.5,
    emissive: "#fff4d0",
    emissiveIntensity: 1.6,
  });

  for (const [mt, tl] of [
    [a, 4],
    [o, 4],
  ]) {
    mt.map.repeat.set(1, 1);
    mt.userData.tile = tl;
  }
  function m(n, r, i, a, o, s, c, l = false) {
    let bg0 = new BoxGeometry(n, r, i);
    if (c && c.userData && c.userData.tile) {
      const tl = c.userData.tile;
      const uvA = bg0.attributes.uv;
      const dims = [
        [i, r],
        [i, r],
        [n, i],
        [n, i],
        [n, r],
        [n, r],
      ];
      for (let face = 0; face < 6; face++) {
        for (let vi = 0; vi < 4; vi++) {
          const ix = face * 4 + vi;
          uvA.setXY(
            ix,
            (uvA.getX(ix) * dims[face][0]) / tl,
            (uvA.getY(ix) * dims[face][1]) / tl
          );
        }
      }
      uvA.needsUpdate = true;
    }
    let u = new Mesh(bg0, c);
    u.position.set(a, o, s);
    u.receiveShadow = true;
    u.castShadow = l;
    e.add(u);

    if (l) {
      t.push({
        x: a,
        z: s,
        w: n / 2,
        d: i / 2,
        box: u,
      });
    }

    return u;
  }
  function h(e, n, r, i) {
    t.push({
      x: e,
      z: n,
      w: r,
      d: i,
    });
  }
  let g = new Matrix4();
  let _ = new Vector3();
  let v = new Quaternion();
  let y = new Vector3();
  m(900, 0.5, 1200, 0, -0.3, -200, s);
  let b = new PlaneGeometry(360, 460, 48, 64);
  b.rotateX(-Math.PI / 2);
  let x = b.attributes.position;
  for (let e = 0; e < x.count; e++) {
    let t = x.getX(e) - 30;
    let n = x.getZ(e) - 370;
    let r = Uw(t, n);

    let i =
      Math.sin(t * 0.08) * Math.cos(n * 0.06) * 1.6 +
      Math.sin(t * 0.2 + n * 0.15) * 0.7;

    x.setXYZ(e, t, r + i, n);
  }
  b.computeVertexNormals();
  let S = new Mesh(b, s);
  S.receiveShadow = true;
  e.add(S);
  let C = [-120, -60, 0, 60, 120];
  let w = [-80, -30, 20, 70];

  let stationRoadAccesses = nm.map((station) => {
    const roadX = C.reduce((nearest, x) => {
      return Math.abs(x - station.x) < Math.abs(nearest - station.x)
        ? x
        : nearest;
    }, C[0]);
    return {
      station,
      roadX,
      side: Math.sign(station.x - roadX),
    };
  });

  let streetlightZs = w.slice(0, -1).map((z, index) => {
    return (z + w[index + 1]) / 2;
  });

  let streetlightXs = C.slice(0, -1).map((x, index) => {
    return (x + C[index + 1]) / 2;
  });

  let T = (e, t, n, r, i = 0.04) => {
    return m(n, 0.02, r, e, i, t, c);
  };

  let E = (e, t, n, r, i = 0.04) => {
    return m(n, 0.02, r, e, i, t, l);
  };

  const signals = [];
  const puddleRandom = Ww(731941);
  const puddleMat = new MeshStandardMaterial({
    color: "#65717b",
    roughness: 0.2,
    metalness: 0.12,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    side: 2,
  });
  const addRoadPuddle = (x, z, rx, rz, angle) => {
    const positions = [0, 0, 0];
    const indices = [];
    const sides = 20;
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2;
      const edge = 0.78 + puddleRandom() * 0.34;
      positions.push(Math.cos(a) * rx * edge, 0, Math.sin(a) * rz * edge);
    }
    for (let k = 0; k < sides; k++) {
      indices.push(0, ((k + 1) % sides) + 1, k + 1);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const puddle = new Mesh(geometry, puddleMat);
    puddle.position.set(x, 0.073, z);
    puddle.rotation.y = angle;
    puddle.renderOrder = 1;
    e.add(puddle);
  };
  for (const x of C) {
    const count = puddleRandom() > 0.55 ? 2 : 1;
    for (let k = 0; k < count; k++) {
      addRoadPuddle(
        x + (puddleRandom() - 0.5) * 9,
        w[0] - 7 + puddleRandom() * (w[w.length - 1] - w[0] + 14),
        0.55 + puddleRandom() * 1.35,
        0.8 + puddleRandom() * 2.2,
        (puddleRandom() - 0.5) * 0.65
      );
    }
  }
  for (const z of w) {
    const count = puddleRandom() > 0.55 ? 2 : 1;
    for (let k = 0; k < count; k++) {
      addRoadPuddle(
        C[0] - 7 + puddleRandom() * (C[C.length - 1] - C[0] + 14),
        z + (puddleRandom() - 0.5) * 9,
        0.8 + puddleRandom() * 2.2,
        0.55 + puddleRandom() * 1.35,
        (puddleRandom() - 0.5) * 0.65
      );
    }
  }
  for (let e of C) {
    m(
      18,
      0.12,
      w[w.length - 1] - w[0] + 18,
      e,
      0.01,
      (w[0] + w[w.length - 1]) / 2,
      r
    );
  }
  for (let e of w) {
    m(
      C[C.length - 1] - C[0] + 18,
      0.12,
      18,
      (C[0] + C[C.length - 1]) / 2,
      0.01,
      e,
      r
    );
  }
  const roadY = 0.085;
  for (const x of C) {
    for (let segment = 0; segment < w.length - 1; segment++) {
      const start = w[segment] + 17;
      const end = w[segment + 1] - 17;
      for (let z = start; z + 5 <= end; z += 9) {
        m(0.15, 0.018, 5, x, roadY, z + 2.5, l);
      }
    }
    for (let zIndex = 0; zIndex < w.length; zIndex++) {
      for (const approach of [-1, 1]) {
        if (zIndex + approach < 0 || zIndex + approach >= w.length) {
          continue;
        }
        const z = w[zIndex];
        const crossZ = z + approach * 11.5;
        for (let stripe = -3; stripe <= 3; stripe++) {
          m(0.75, 0.025, 2.6, x + stripe * 2.1, roadY + 0.008, crossZ, c);
        }
        m(9, 0.025, 0.2, x, roadY + 0.01, z + approach * 15.5, c);
      }
    }
  }
  for (const z of w) {
    for (let segment = 0; segment < C.length - 1; segment++) {
      const start = C[segment] + 17;
      const end = C[segment + 1] - 17;
      for (let x = start; x + 5 <= end; x += 9) {
        m(5, 0.018, 0.15, x + 2.5, roadY, z, l);
      }
    }
    for (let xIndex = 0; xIndex < C.length; xIndex++) {
      for (const approach of [-1, 1]) {
        if (xIndex + approach < 0 || xIndex + approach >= C.length) {
          continue;
        }
        const x = C[xIndex];
        const crossX = x + approach * 11.5;
        for (let stripe = -3; stripe <= 3; stripe++) {
          m(0.75, 0.025, 2.6, crossX, roadY + 0.008, z + stripe * 2.1, c);
        }
        m(0.2, 0.025, 9, x + approach * 15.5, roadY + 0.01, z, c);
      }
    }
  }
  for (const x of C) {
    for (const side of [-1, 1]) {
      const accessCuts = stationRoadAccesses
        .filter((access) => {
          return access.roadX === x && access.side === side;
        })
        .map((access) => {
          return [access.station.z - 4.75, access.station.z + 4.75];
        })
        .sort((first, second) => {
          return first[0] - second[0];
        });
      const addSidewalkSegment = (start, end) => {
        if (end > start) {
          m(
            2.4,
            0.22,
            end - start,
            x + side * 10.2,
            0.11,
            (start + end) / 2,
            a
          );
        }
      };
      let start = w[0] - 11;
      for (const crossing of w) {
        const end = crossing - 9;
        let segmentStart = start;
        for (const [cutStart, cutEnd] of accessCuts) {
          const clippedStart = Math.max(segmentStart, cutStart);
          const clippedEnd = Math.min(end, cutEnd);
          if (clippedEnd > clippedStart) {
            addSidewalkSegment(segmentStart, clippedStart);
            segmentStart = clippedEnd;
          }
        }
        addSidewalkSegment(segmentStart, end);
        start = crossing + 9;
      }
      const end = w[w.length - 1] + 11;
      let segmentStart = start;
      for (const [cutStart, cutEnd] of accessCuts) {
        const clippedStart = Math.max(segmentStart, cutStart);
        const clippedEnd = Math.min(end, cutEnd);
        if (clippedEnd > clippedStart) {
          addSidewalkSegment(segmentStart, clippedStart);
          segmentStart = clippedEnd;
        }
      }
      addSidewalkSegment(segmentStart, end);
    }
  }
  for (const z of w) {
    for (const side of [-1, 1]) {
      let start = C[0] - 11;
      for (const crossing of C) {
        const end = crossing - 9;
        if (end > start) {
          m(
            end - start,
            0.22,
            2.4,
            (start + end) / 2,
            0.11,
            z + side * 10.2,
            a
          );
        }
        start = crossing + 9;
      }
      const end = C[C.length - 1] + 11;
      if (end > start) {
        m(end - start, 0.22, 2.4, (start + end) / 2, 0.11, z + side * 10.2, a);
      }
    }
  }
  function O(x, z, facing, axis) {
    const pole = new Group();
    pole.position.set(x, 0, z);
    pole.rotation.y = facing;
    const base = new Mesh(new CylinderGeometry(0.24, 0.28, 0.16, 16), d);
    base.position.y = 0.08;
    pole.add(base);
    const mast = new Mesh(new CylinderGeometry(0.085, 0.11, 4.65, 12), d);
    mast.position.y = 2.46;
    mast.castShadow = true;
    pole.add(mast);
    const bracket = new Mesh(new BoxGeometry(0.11, 0.1, 0.34), d);
    bracket.position.set(0, 4.72, 0.13);
    pole.add(bracket);
    const housing = new Mesh(
      new BoxGeometry(0.48, 1.32, 0.34),
      new MeshStandardMaterial({
        color: "#101419",
        roughness: 0.68,
        metalness: 0.22,
      })
    );
    housing.position.set(0, 5.35, 0.29);
    housing.castShadow = true;
    pole.add(housing);
    const shades = ["#f02e2a", "#e8a528", "#2cae50"];
    const lenses = [];
    for (let light = 0; light < 3; light++) {
      const y = 5.77 - light * 0.42;
      const bezel = new Mesh(
        new CylinderGeometry(0.17, 0.17, 0.045, 20),
        new MeshStandardMaterial({
          color: "#080a0d",
          roughness: 0.38,
          metalness: 0.25,
        })
      );
      bezel.rotation.x = Math.PI / 2;
      bezel.position.set(0, y, 0.473);
      pole.add(bezel);
      const material = new MeshStandardMaterial({
        color: shades[light],
        emissive: shades[light],
        emissiveIntensity: 0.025,
        roughness: 0.22,
        metalness: 0.04,
      });
      const lens = new Mesh(
        new CylinderGeometry(0.125, 0.125, 0.048, 20),
        material
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0, y, 0.51);
      pole.add(lens);
      lenses.push(material);
      const hood = new Mesh(new BoxGeometry(0.31, 0.055, 0.14), d);
      hood.position.set(0, y + 0.17, 0.46);
      pole.add(hood);
    }
    e.add(pole);
    h(x, z, 0.3, 0.3);
    signals.push({
      axis,
      lenses,
    });
  }
  const stopLabelCanvas = document.createElement("canvas");
  stopLabelCanvas.width = 512;
  stopLabelCanvas.height = 256;
  const stopLabelContext = stopLabelCanvas.getContext("2d");
  stopLabelContext.clearRect(0, 0, 512, 256);
  stopLabelContext.fillStyle = "#fff";
  stopLabelContext.font = "bold 120px Arial";
  stopLabelContext.textAlign = "center";
  stopLabelContext.textBaseline = "middle";
  stopLabelContext.fillText("STOP", 256, 132);
  const stopLabelTexture = new CanvasTexture(stopLabelCanvas);
  stopLabelTexture.colorSpace = "srgb";
  const stopLabelMaterial = new MeshStandardMaterial({
    map: stopLabelTexture,
    transparent: true,
    roughness: 0.75,
  });
  function addStopSign(x, z, dx, dz) {
    const sideX = dz;
    const sideZ = -dx;
    const signX = x + dx * 11 + sideX * 10.2;
    const signZ = z + dz * 11 + sideZ * 10.2;
    const sign = new Group();
    sign.position.set(signX, 0, signZ);
    sign.rotation.y = Math.atan2(dx, dz);
    const post = new Mesh(new CylinderGeometry(0.075, 0.085, 2.35, 10), d);
    post.position.y = 1.175;
    sign.add(post);
    const borderMaterial = new MeshStandardMaterial({
      color: "#f2f0e8",
      roughness: 0.72,
    });
    const border = new Mesh(
      new CylinderGeometry(0.49, 0.49, 0.075, 8),
      borderMaterial
    );
    border.rotation.x = Math.PI / 2;
    border.position.set(0, 2.22, 0.08);
    sign.add(border);
    const face = new Mesh(new CylinderGeometry(0.44, 0.44, 0.012, 8), [
      borderMaterial,
      new MeshStandardMaterial({
        color: "#c82027",
        roughness: 0.7,
      }),
      borderMaterial,
    ]);
    face.rotation.x = Math.PI / 2;
    face.position.set(0, 2.22, 0.125);
    sign.add(face);
    const label = new Mesh(new PlaneGeometry(0.68, 0.34), stopLabelMaterial);
    label.position.set(0, 2.22, 0.132);
    sign.add(label);
    e.add(sign);
    h(signX, signZ, 0.2, 0.2);
  }
  for (let xIndex = 0; xIndex < C.length; xIndex++) {
    for (let zIndex = 0; zIndex < w.length; zIndex++) {
      const x = C[xIndex];
      const z = w[zIndex];
      const connected = {
        west: xIndex > 0,
        east: xIndex < C.length - 1,
        north: zIndex > 0,
        south: zIndex < w.length - 1,
      };
      const arms = [
        [connected.west, -1, 0, connected.east],
        [connected.east, 1, 0, connected.west],
        [connected.north, 0, -1, connected.south],
        [connected.south, 0, 1, connected.north],
      ].filter(([hasRoad]) => {
        return hasRoad;
      });
      if (arms.length === 4) {
        O(x + 14, z + 14, 0, 0);
        O(x - 14, z - 14, Math.PI, 0);
        O(x + 14, z - 14, Math.PI / 2, 1);
        O(x - 14, z + 14, -Math.PI / 2, 1);
      } else {
        for (const [, dx, dz, oppositeConnected] of arms) {
          if (!oppositeConnected) {
            addStopSign(x, z, dx, dz);
          }
        }
      }
    }
  }
  function k(x, z, axis = 0, inward = -1) {
    const footing = new Mesh(new CylinderGeometry(0.19, 0.24, 0.28, 16), d);
    footing.position.set(x, 0.14, z);
    e.add(footing);
    h(x, z, 0.3, 0.3);
    const pole = new Mesh(new CylinderGeometry(0.085, 0.12, 7, 12), d);
    pole.position.set(x, 3.5, z);
    pole.castShadow = true;
    e.add(pole);
    const alongX = axis === 1;
    const arm = new Mesh(
      new BoxGeometry(alongX ? 0.09 : 2.2, 0.09, alongX ? 2.2 : 0.09),
      d
    );
    arm.position.set(
      x + (alongX ? 0 : inward * 1.05),
      6.88,
      z + (alongX ? inward * 1.05 : 0)
    );
    e.add(arm);
    const fixtureX = x + (alongX ? 0 : inward * 2.05);
    const fixtureZ = z + (alongX ? inward * 2.05 : 0);
    const fixture = new Mesh(new BoxGeometry(0.72, 0.16, 0.48), d);
    fixture.position.set(fixtureX, 6.82, fixtureZ);
    fixture.castShadow = true;
    e.add(fixture);
    const diffuser = new Mesh(new BoxGeometry(0.58, 0.025, 0.36), p);
    diffuser.position.set(fixtureX, 6.72, fixtureZ);
    e.add(diffuser);
    n.push({
      x: fixtureX,
      y: 6.68,
      z: fixtureZ,
    });
  }
  for (const x of C) {
    for (const z of streetlightZs) {
      for (const side of [-1, 1]) {
        k(x + side * 10.2, z, 0, -side);
      }
    }
  }
  for (const z of w) {
    for (const x of streetlightXs) {
      for (const side of [-1, 1]) {
        k(x, z + side * 10.2, 1, -side);
      }
    }
  }
  let A = 9137;

  let j = () => {
    A = (A * 16807) % 2147483647;
    return (A - 1) / 2147483646;
  };

  let M = ["#ffe9c0", "#cfe8ff", "#ffd9a0", "#e8e0ff"];
  let N = ["#3a4250", "#42454d", "#383c44", "#454050", "#3e4855"];
  let P = ["glass", "classic", "classic", "glass"];
  {
    /* ===== DRIFT FURY: city blocks v2 =====
       Every block is split into two lots that sit strictly inside the sidewalks,
       so no building can ever overlap a road, a crosswalk or a curb. */
    const FLOOR_H = 3.6;
    const POD_H = 4.4;
    const LOT_HALF_Z = 12.4;
    const mkCanvas = (cw, ch) => {
      const cv = document.createElement("canvas");
      cv.width = cw;
      cv.height = ch;
      return cv;
    };
    const tint = (hex, k) => {
      const v = parseInt(hex.slice(1), 16);
      const cl = (q) => {
        return Math.max(0, Math.min(255, Math.round(q * k)));
      };
      return `rgb(${cl((v >> 16) & 255)},${cl((v >> 8) & 255)},${cl(v & 255)})`;
    };
    const textureOf = (cv) => {
      const tx = new CanvasTexture(cv);
      tx.wrapS = RepeatWrapping;
      tx.wrapT = RepeatWrapping;
      tx.anisotropy = 8;
      tx.needsUpdate = true;
      return tx;
    };
    const roofMat = new MeshStandardMaterial({
      color: "#23272c",
      roughness: 0.92,
      metalness: 0.05,
    });
    const lotMat = new MeshStandardMaterial({
      map: Yw(1),
      roughness: 0.88,
      metalness: 0.04,
      color: "#8f969c",
    });
    lotMat.userData.tile = 4;
    const tankMat = new MeshStandardMaterial({
      color: "#5a4a3a",
      roughness: 0.85,
    });
    const beaconMat = new MeshStandardMaterial({
      color: "#200000",
      emissive: "#ff2a2a",
      emissiveIntensity: 3.2,
      roughness: 0.4,
    });
    const SIGNS = ["#c6dc77", "#5a9fd4", "#e89978", "#8c87c7", "#ff7a7a"];
    const trimMats = SIGNS.map((col) => {
      return new MeshStandardMaterial({
        color: "#050505",
        emissive: col,
        emissiveIntensity: 1.7,
        roughness: 0.4,
      });
    });

    /* --- facade textures: map + matching emissive map + normal map (one shared random layout) --- */
    const facadeCache = new Map();
    function facadeVariant(kind, wall, glow) {
      const key = kind + wall + glow;
      let hit = facadeCache.get(key);
      if (hit) {
        return hit;
      }
      const glass = kind === "glass";
      const rnd = Ww(
        key.length * 7919 +
          wall.charCodeAt(2) * 31 +
          glow.charCodeAt(3) * 17 +
          (glass ? 5 : 11)
      );
      const mapCv = mkCanvas(256, 256);
      const glowCv = mkCanvas(256, 256);
      const g2 = mapCv.getContext("2d");
      const ge = glowCv.getContext("2d");
      g2.fillStyle = wall;
      g2.fillRect(0, 0, 256, 256);
      for (let q = 0; q < 1400; q++) {
        g2.fillStyle =
          rnd() > 0.5 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.1)";
        g2.fillRect(rnd() * 256, rnd() * 256, 1.5, 1.5);
      }
      ge.fillStyle = "#000";
      ge.fillRect(0, 0, 256, 256);
      for (let col = 0; col <= 4; col++) {
        g2.fillStyle = "rgba(0,0,0,0.28)";
        g2.fillRect(col * 64 - 1.5, 0, 3, 256);
        g2.fillStyle = "rgba(255,255,255,0.07)";
        g2.fillRect(col * 64 + 1.5, 0, 1.5, 256);
      }
      for (let row = 0; row < 4; row++) {
        g2.fillStyle = "rgba(0,0,0,0.34)";
        g2.fillRect(0, row * 64 + 55, 256, 9);
        g2.fillStyle = "rgba(255,255,255,0.09)";
        g2.fillRect(0, row * 64 + 54, 256, 1.5);
      }
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const ix = glass ? 5 : 11;
          const it = glass ? 7 : 12;
          const ib = glass ? 13 : 16;
          const x0 = col * 64 + ix;
          const y0 = row * 64 + it;
          const ww = 64 - ix * 2;
          const hh = 64 - it - ib;
          const lit = rnd() > 0.44;
          const style = rnd();
          g2.fillStyle = "#10151b";
          g2.fillRect(x0 - 2, y0 - 2, ww + 4, hh + 4);
          const gl = g2.createLinearGradient(0, y0, 0, y0 + hh);
          if (lit) {
            gl.addColorStop(0, tint(glow, 0.95));
            gl.addColorStop(1, tint(glow, 0.62));
          } else {
            gl.addColorStop(0, "#2f465c");
            gl.addColorStop(0.55, "#142130");
            gl.addColorStop(1, "#0a111a");
          }
          g2.fillStyle = gl;
          g2.fillRect(x0, y0, ww, hh);
          if (lit) {
            const eg = ge.createLinearGradient(0, y0, 0, y0 + hh);
            eg.addColorStop(0, tint(glow, 0.75));
            eg.addColorStop(1, tint(glow, 0.42));
            ge.fillStyle = eg;
            ge.fillRect(x0, y0, ww, hh);
            if (style > 0.7) {
              for (let by = y0 + 2; by < y0 + hh * 0.6; by += 4) {
                g2.fillStyle = "rgba(20,14,8,0.35)";
                g2.fillRect(x0, by, ww, 1.6);
                ge.fillStyle = "rgba(0,0,0,0.55)";
                ge.fillRect(x0, by, ww, 1.6);
              }
            } else if (style > 0.45) {
              g2.fillStyle = "rgba(40,20,10,0.35)";
              g2.fillRect(x0, y0, ww * 0.22, hh);
              g2.fillRect(x0 + ww * 0.78, y0, ww * 0.22, hh);
              ge.fillStyle = "rgba(0,0,0,0.5)";
              ge.fillRect(x0, y0, ww * 0.22, hh);
              ge.fillRect(x0 + ww * 0.78, y0, ww * 0.22, hh);
            }
          } else {
            g2.fillStyle = "rgba(255,255,255,0.07)";
            g2.beginPath();
            g2.moveTo(x0, y0 + hh);
            g2.lineTo(x0 + ww * 0.55, y0);
            g2.lineTo(x0 + ww * 0.8, y0);
            g2.lineTo(x0 + ww * 0.25, y0 + hh);
            g2.closePath();
            g2.fill();
          }
          g2.fillStyle = "rgba(255,255,255,0.1)";
          g2.fillRect(x0, y0, ww, 2);
          for (const ctx of [g2, ge]) {
            ctx.fillStyle = ctx === g2 ? "#10151b" : "#000";
            ctx.fillRect(x0 + ww / 2 - 1, y0, 2, hh);
            if (!glass) {
              ctx.fillRect(x0, y0 + hh * 0.42, ww, 2);
            }
          }
          g2.fillStyle = "rgba(255,255,255,0.16)";
          g2.fillRect(x0 - 3, y0 + hh + 2, ww + 6, 2.5);
          if (!glass && rnd() > 0.88) {
            g2.fillStyle = "#868d94";
            g2.fillRect(x0 + ww * 0.2, y0 + hh + 4, ww * 0.6, 6);
            g2.fillStyle = "#4b5158";
            g2.fillRect(x0 + ww * 0.2, y0 + hh + 8, ww * 0.6, 2);
          }
        }
      }
      hit = {
        glass: glass,
        map: textureOf(mapCv),
        glow: textureOf(glowCv),
        normal: qw(mapCv, glass ? 1.1 : 1.9),
      };
      facadeCache.set(key, hit);
      return hit;
    }
    const facadeMatCache = new Map();
    function facadeMaterial(key, fv, rx, ry) {
      const mk = key + "|" + rx + "|" + ry;
      let hit = facadeMatCache.get(mk);
      if (hit) {
        return hit;
      }
      const cp = (tx) => {
        const c2 = tx.clone();
        c2.repeat.set(rx, ry);
        c2.needsUpdate = true;
        return c2;
      };
      hit = new MeshPhysicalMaterial({
        map: cp(fv.map),
        normalMap: cp(fv.normal),
        normalScale: new Vector2(
          fv.glass ? 0.14 : 0.32,
          fv.glass ? 0.14 : 0.32
        ),
        emissiveMap: cp(fv.glow),
        emissive: "#ffffff",
        emissiveIntensity: 1.15,
        roughness: fv.glass ? 0.22 : 0.8,
        metalness: fv.glass ? 0.3 : 0.05,
        clearcoat: fv.glass ? 0.85 : 0.14,
        clearcoatRoughness: 0.22,
        envMapIntensity: fv.glass ? 1.2 : 0.25,
      });
      facadeMatCache.set(mk, hit);
      return hit;
    }

    /* --- lit shop-fronts for the ground floor --- */
    const shopCache = new Map();
    function shopMaterial(sign, rx) {
      const mk = sign + "|" + rx;
      let hit = shopCache.get(mk);
      if (hit) {
        return hit;
      }
      const rnd = Ww(sign.charCodeAt(2) * 131 + sign.charCodeAt(4) * 7);
      const cv = mkCanvas(256, 128);
      const cvE = mkCanvas(256, 128);
      const g2 = cv.getContext("2d");
      const ge = cvE.getContext("2d");
      g2.fillStyle = "#1b2027";
      g2.fillRect(0, 0, 256, 128);
      ge.fillStyle = "#000";
      ge.fillRect(0, 0, 256, 128);
      for (let bay = 0; bay < 2; bay++) {
        const bx0 = bay * 128;
        g2.fillStyle = sign;
        g2.fillRect(bx0 + 14, 6, 100, 18);
        ge.fillStyle = sign;
        ge.fillRect(bx0 + 14, 6, 100, 18);
        for (let k = 0; k < 6; k++) {
          const lw = 6 + Math.floor(rnd() * 8);
          g2.fillStyle = "rgba(0,0,0,0.6)";
          g2.fillRect(bx0 + 20 + k * 15, 11, lw, 8);
          ge.fillStyle = "#000";
          ge.fillRect(bx0 + 20 + k * 15, 11, lw, 8);
        }
        g2.fillStyle = "#0c0f12";
        g2.fillRect(bx0 + 6, 38, 116, 82);
        const gl = g2.createLinearGradient(0, 42, 0, 118);
        gl.addColorStop(0, "#ffe6b8");
        gl.addColorStop(1, "#b57a3c");
        g2.fillStyle = gl;
        g2.fillRect(bx0 + 9, 41, 110, 76);
        const eg = ge.createLinearGradient(0, 42, 0, 118);
        eg.addColorStop(0, "rgba(255,226,170,0.85)");
        eg.addColorStop(1, "rgba(180,120,60,0.6)");
        ge.fillStyle = eg;
        ge.fillRect(bx0 + 9, 41, 110, 76);
        for (let k = 0; k < 4; k++) {
          const sx = bx0 + 14 + k * 26;
          const sh = 14 + Math.floor(rnd() * 26);
          g2.fillStyle = "rgba(30,18,10,0.55)";
          g2.fillRect(sx, 117 - sh, 14, sh);
          ge.fillStyle = "rgba(0,0,0,0.5)";
          ge.fillRect(sx, 117 - sh, 14, sh);
        }
        for (const ctx of [g2, ge]) {
          ctx.fillStyle = ctx === g2 ? "#0c0f12" : "#000";
          ctx.fillRect(bx0 + 62, 41, 4, 76);
          ctx.fillRect(bx0 + 9, 70, 110, 3);
        }
      }
      g2.fillStyle = "#0b0e11";
      g2.fillRect(0, 118, 256, 10);
      const mp = textureOf(cv);
      const em = textureOf(cvE);
      mp.repeat.set(rx, 1);
      em.repeat.set(rx, 1);
      hit = new MeshPhysicalMaterial({
        map: mp,
        emissiveMap: em,
        emissive: "#ffffff",
        emissiveIntensity: 1.3,
        roughness: 0.45,
        metalness: 0.2,
        clearcoat: 0.5,
        envMapIntensity: 0.6,
      });
      shopCache.set(mk, hit);
      return hit;
    }

    /* --- blocks --- */
    for (let bi = 0; bi < C.length - 1; bi++) {
      for (let bj = 0; bj < w.length - 1; bj++) {
        const bx = (C[bi] + C[bi + 1]) / 2;
        const bz = (w[bj] + w[bj + 1]) / 2;
        m(37.2, 0.14, 27.2, bx, 0.02, bz, lotMat);
        if (
          nm.some((st) => {
            return Math.abs(st.x - bx) < 32 && Math.abs(st.z - bz) < 32;
          })
        ) {
          continue;
        }
        for (const side of [-1, 1]) {
          if (j() < 0.15) {
            continue;
          }
          const sW = 11 + j() * 4.5;
          const cD = 14 + j() * 8.8;
          const hTarget = 14 + j() * 48;
          const kind = P[Math.floor(j() * P.length)];
          const wall = N[Math.floor(j() * N.length)];
          const glow = M[Math.floor(j() * M.length)];
          const signIdx = Math.floor(j() * SIGNS.length);
          const glass = kind === "glass";
          const bxC = bx + side * (0.9 + sW / 2);
          const bzC =
            bz + (j() - 0.5) * 2 * Math.max(0, (2 * LOT_HALF_Z - (cD + 1)) / 2);
          const tall = hTarget > 32;
          const l1 = tall
            ? Math.round((hTarget * 0.62) / FLOOR_H) * FLOOR_H
            : Math.max(POD_H + 6, hTarget);
          const hs = l1 - POD_H;
          const rY = Math.max(1, Math.round(hs / 14.4));
          const fv = facadeVariant(kind, wall, glow);
          const vKey = kind + wall + glow;
          const fz = facadeMaterial(
            vKey,
            fv,
            Math.max(1, Math.round(sW / 12)),
            rY
          );
          const fx = facadeMaterial(
            vKey,
            fv,
            Math.max(1, Math.round(cD / 12)),
            rY
          );
          const shopZ = shopMaterial(
            SIGNS[signIdx],
            Math.max(1, Math.round((sW + 1) / 8))
          );
          const shopX = shopMaterial(
            SIGNS[signIdx],
            Math.max(1, Math.round((cD + 1) / 8))
          );
          // ground floor shop podium, cornice, tower shaft
          m(
            sW + 1,
            POD_H,
            cD + 1,
            bxC,
            POD_H / 2,
            bzC,
            [shopX, shopX, a, f, shopZ, shopZ],
            true
          );
          m(sW + 1.2, 0.3, cD + 1.2, bxC, POD_H + 0.15, bzC, a);
          m(
            sW,
            hs,
            cD,
            bxC,
            POD_H + hs / 2,
            bzC,
            [fx, fx, roofMat, roofMat, fz, fz],
            true
          );
          // corner pilasters / frame fins
          for (const sx of [-1, 1]) {
            for (const sz of [-1, 1]) {
              m(
                glass ? 0.4 : 0.7,
                hs,
                glass ? 0.4 : 0.7,
                bxC + (sx * sW) / 2,
                POD_H + hs / 2,
                bzC + (sz * cD) / 2,
                glass ? d : a
              );
            }
          }
          // floor-group ledges
          if (!glass) {
            for (let k = 1; k < rY; k++) {
              m(sW + 0.35, 0.3, cD + 0.35, bxC, POD_H + (k * hs) / rY, bzC, a);
            }
          }
          let topY = l1;
          let topW = sW;
          let topD = cD;
          if (tall) {
            const sU = sW * 0.74;
            const cU = cD * 0.74;
            const hU = Math.max(6, hTarget - l1);
            const rYU = Math.max(1, Math.round(hU / 14.4));
            const fzU = facadeMaterial(
              vKey,
              fv,
              Math.max(1, Math.round(sU / 12)),
              rYU
            );
            const fxU = facadeMaterial(
              vKey,
              fv,
              Math.max(1, Math.round(cU / 12)),
              rYU
            );
            m(sW + 0.5, 0.3, cD + 0.5, bxC, l1 + 0.15, bzC, a);
            m(
              sU,
              hU,
              cU,
              bxC,
              l1 + 0.3 + hU / 2,
              bzC,
              [fxU, fxU, roofMat, roofMat, fzU, fzU],
              true
            );
            topY = l1 + 0.3 + hU;
            topW = sU;
            topD = cU;
          }
          // roof cap + parapet
          m(topW + 0.35, 0.28, topD + 0.35, bxC, topY + 0.14, bzC, d);
          m(topW + 0.4, 0.9, 0.4, bxC, topY + 0.75, bzC + topD / 2 - 0.2, a);
          m(topW + 0.4, 0.9, 0.4, bxC, topY + 0.75, bzC - topD / 2 + 0.2, a);
          m(0.4, 0.9, topD - 0.4, bxC + topW / 2 - 0.2, topY + 0.75, bzC, a);
          m(0.4, 0.9, topD - 0.4, bxC - topW / 2 + 0.2, topY + 0.75, bzC, a);
          // roof equipment
          const nUnits = 1 + Math.floor(j() * 3);
          for (let uI = 0; uI < nUnits; uI++) {
            const uh = 1 + j();
            m(
              1.8 + j() * 2,
              uh,
              1.8 + j() * 2,
              bxC + (j() - 0.5) * (topW - 4),
              topY + 0.28 + uh / 2,
              bzC + (j() - 0.5) * (topD - 4),
              f
            );
          }
          if (j() > 0.55) {
            const tx = bxC + (j() - 0.5) * (topW - 5);
            const tz = bzC + (j() - 0.5) * (topD - 5);
            for (const lx of [-0.8, 0.8]) {
              for (const lz of [-0.8, 0.8]) {
                m(0.14, 1.5, 0.14, tx + lx, topY + 1.03, tz + lz, d);
              }
            }
            const tank = new Mesh(
              new CylinderGeometry(1.3, 1.3, 2.2, 16),
              tankMat
            );
            tank.position.set(tx, topY + 2.6, tz);
            tank.castShadow = true;
            e.add(tank);
            const tankCap = new Mesh(new ConeGeometry(1.4, 0.8, 16), d);
            tankCap.position.set(tx, topY + 4.1, tz);
            e.add(tankCap);
          }
          if (tall || j() > 0.5) {
            const mh = 6 + j() * 6;
            const mast = new Mesh(new CylinderGeometry(0.05, 0.08, mh, 6), d);
            mast.position.set(bxC, topY + 0.28 + mh / 2, bzC);
            e.add(mast);
            const beacon = new Mesh(new SphereGeometry(0.2, 10, 8), beaconMat);
            beacon.position.set(bxC, topY + 0.28 + mh, bzC);
            e.add(beacon);
          }
          // glowing LED trim on the street-facing edges
          m(
            topW,
            0.14,
            0.14,
            bxC,
            topY - 0.5,
            bzC + topD / 2 + 0.05,
            trimMats[signIdx]
          );
          m(
            0.14,
            0.14,
            topD,
            bxC + topW / 2 + 0.05,
            topY - 0.5,
            bzC,
            trimMats[signIdx]
          );
          m(
            sW + 1.02,
            0.1,
            0.1,
            bxC,
            POD_H - 0.12,
            bzC + (cD + 1) / 2 + 0.02,
            trimMats[signIdx]
          );
          m(
            0.1,
            0.1,
            cD + 1.02,
            bxC + (sW + 1) / 2 + 0.02,
            POD_H - 0.12,
            bzC,
            trimMats[signIdx]
          );
        }
      }
    }
  }
  {
    /* ===== DRIFT FURY: street trees v1 (sidewalk only, with trunk colliders) ===== */
    const fc = document.createElement("canvas");
    fc.width = 256;
    fc.height = 256;
    const fg = fc.getContext("2d");
    const frnd = Ww(5150);
    fg.fillStyle = "#2c5a2a";
    fg.fillRect(0, 0, 256, 256);
    const greens = [
      "#3f7a35",
      "#2a5a28",
      "#4f8a3c",
      "#1f4a22",
      "#5f9645",
      "#35692f",
    ];
    for (let q = 0; q < 2600; q++) {
      fg.fillStyle = greens[Math.floor(frnd() * greens.length)];
      fg.save();
      fg.translate(frnd() * 256, frnd() * 256);
      fg.rotate(frnd() * 6.283);
      fg.beginPath();
      fg.ellipse(0, 0, 2.2 + frnd() * 3.2, 1.1 + frnd() * 1.5, 0, 0, 6.283);
      fg.fill();
      fg.restore();
    }
    for (let q = 0; q < 700; q++) {
      fg.fillStyle = `rgba(8,22,10,${0.25 + frnd() * 0.3})`;
      fg.fillRect(frnd() * 256, frnd() * 256, 3, 3);
    }
    const leafTex = new CanvasTexture(fc);
    leafTex.wrapS = RepeatWrapping;
    leafTex.wrapT = RepeatWrapping;
    leafTex.colorSpace = "srgb";
    leafTex.anisotropy = 8;
    leafTex.repeat.set(2, 2);
    const leafMat = new MeshStandardMaterial({
      map: leafTex,
      bumpMap: leafTex,
      bumpScale: 1.2,
      roughness: 0.92,
      metalness: 0,
    });
    const barkCanvas = document.createElement("canvas");
    barkCanvas.width = 128;
    barkCanvas.height = 256;
    const barkCtx = barkCanvas.getContext("2d");
    const barkRnd = Ww(9271);
    const barkGradient = barkCtx.createLinearGradient(0, 0, 128, 0);
    barkGradient.addColorStop(0, "#30271f");
    barkGradient.addColorStop(0.24, "#66503a");
    barkGradient.addColorStop(0.52, "#493829");
    barkGradient.addColorStop(0.78, "#71563c");
    barkGradient.addColorStop(1, "#30271f");
    barkCtx.fillStyle = barkGradient;
    barkCtx.fillRect(0, 0, 128, 256);
    for (let line = 0; line < 70; line++) {
      const x = barkRnd() * 128;
      const shade = Math.floor(barkRnd() * 45);
      barkCtx.strokeStyle =
        line % 3
          ? `rgba(22,15,10,${0.12 + barkRnd() * 0.34})`
          : `rgba(190,151,105,${0.08 + barkRnd() * 0.2})`;
      barkCtx.lineWidth = 0.5 + barkRnd() * 2;
      barkCtx.beginPath();
      barkCtx.moveTo(x, 0);
      barkCtx.bezierCurveTo(
        x + (barkRnd() - 0.5) * 18,
        84,
        x + (barkRnd() - 0.5) * 18,
        172,
        x + (barkRnd() - 0.5) * 12,
        256
      );
      barkCtx.stroke();
      if (line < 7) {
        barkCtx.fillStyle = `rgba(${shade},${shade * 0.78},${
          shade * 0.55
        },.08)`;
        barkCtx.fillRect(x, 0, 1 + barkRnd() * 4, 256);
      }
    }
    const barkTex = new CanvasTexture(barkCanvas);
    barkTex.wrapS = RepeatWrapping;
    barkTex.wrapT = RepeatWrapping;
    barkTex.colorSpace = "srgb";
    barkTex.anisotropy = 8;
    const barkMat = new MeshStandardMaterial({
      map: barkTex,
      bumpMap: barkTex,
      bumpScale: 0.12,
      roughness: 0.96,
      color: "#b6a18a",
    });
    const spots = [];
    for (const ax of C) {
      for (const side of [-1, 1]) {
        for (let tz = w[0] - 4; tz <= w[w.length - 1] + 4; tz += 12) {
          if (
            w.some((sz) => {
              return Math.abs(tz - sz) < 14.5;
            })
          ) {
            continue;
          }
          if (
            streetlightZs.some((pz) => {
              return Math.abs(tz - pz) < 4.5;
            })
          ) {
            continue;
          }
          spots.push([ax + side * 10.2, tz, 0.88 + j() * 0.28]);
        }
      }
    }
    const CLUMPS = [
      [0, -0.12, 0, 1.2, 0.98, 1.12],
      [0, 0.72, 0, 1.22, 1.02, 1.14],
      [0.78, 0.32, 0.12, 0.94, 0.84, 0.9],
      [-0.76, 0.38, -0.14, 0.98, 0.88, 0.92],
      [0.16, 0.52, 0.76, 0.9, 0.82, 0.94],
      [-0.2, 0.28, -0.76, 0.94, 0.8, 0.9],
      [0.12, 1.35, 0.08, 0.84, 0.8, 0.86],
      [-0.34, -0.08, 0.36, 0.72, 0.7, 0.78],
    ];
    const trunkHeight = (scale) => {
      return 4.85 * scale;
    };
    const trunks = new InstancedMesh(
      new CylinderGeometry(0.13, 0.24, 1, 12),
      barkMat,
      spots.length
    );
    const branches = new InstancedMesh(
      new CylinderGeometry(0.055, 0.095, 1, 8),
      barkMat,
      spots.length * 4
    );
    trunks.castShadow = true;
    branches.castShadow = true;
    const crowns = new InstancedMesh(
      new SphereGeometry(1, 14, 12),
      leafMat,
      spots.length * CLUMPS.length
    );
    crowns.castShadow = true;
    crowns.receiveShadow = true;
    let ci = 0;
    let bi = 0;
    spots.forEach(([tx, tz, treeScale], ti) => {
      const ground = 0.22;
      const height = trunkHeight(treeScale);
      _.set(tx, ground + height / 2, tz);
      v.identity();
      y.set(
        treeScale * (0.9 + j() * 0.18),
        height,
        treeScale * (0.9 + j() * 0.18)
      );
      g.compose(_, v, y);
      trunks.setMatrixAt(ti, g);
      for (let branch = 0; branch < 4; branch++) {
        const angle = (branch * Math.PI) / 2 + (j() - 0.5) * 0.42;
        const length = treeScale * (1.45 + j() * 0.35);
        const direction = new Vector3(
          Math.cos(angle) * 0.82,
          0.52 + j() * 0.16,
          Math.sin(angle) * 0.82
        );
        direction.normalize();
        v.setFromUnitVectors(new Vector3(0, 1, 0), direction);
        _.set(
          tx + direction.x * length * 0.48,
          ground + height * (0.62 + (branch % 2) * 0.1),
          tz + direction.z * length * 0.48
        );
        y.set(1, length, 1);
        g.compose(_, v, y);
        branches.setMatrixAt(bi++, g);
      }
      for (const [ox, oy, oz, rx, ry, rz] of CLUMPS) {
        const clumpScale = treeScale * (0.88 + j() * 0.24);
        _.set(
          tx + ox * treeScale,
          ground + height + oy * treeScale,
          tz + oz * treeScale
        );
        v.setFromAxisAngle(new Vector3(0, 1, 0), (j() - 0.5) * 0.7);
        y.set(
          rx * clumpScale,
          ry * clumpScale * (0.88 + j() * 0.24),
          rz * clumpScale
        );
        g.compose(_, v, y);
        crowns.setMatrixAt(ci++, g);
      }
      h(tx, tz, 0.3, 0.3);
    });
    trunks.instanceMatrix.needsUpdate = true;
    branches.count = bi;
    branches.instanceMatrix.needsUpdate = true;
    crowns.count = ci;
    crowns.instanceMatrix.needsUpdate = true;
    e.add(trunks);
    e.add(branches);
    e.add(crowns);
  }
  const stationSteel = new MeshStandardMaterial({
    color: "#879199",
    roughness: 0.38,
    metalness: 0.72,
  });
  const stationDarkSteel = new MeshStandardMaterial({
    color: "#252c31",
    roughness: 0.58,
    metalness: 0.48,
  });
  const stationWhite = new MeshStandardMaterial({
    color: "#e8e9e4",
    roughness: 0.62,
    metalness: 0.12,
  });
  const stationRed = new MeshStandardMaterial({
    color: "#b83132",
    roughness: 0.38,
    metalness: 0.22,
  });
  const stationParkingPaint = new MeshStandardMaterial({
    color: "#d9d9ce",
    roughness: 0.82,
    metalness: 0,
  });
  const stationGlass = new MeshPhysicalMaterial({
    color: "#a8c4ce",
    roughness: 0.12,
    metalness: 0.08,
    transparent: true,
    opacity: 0.32,
    side: 2,
  });
  const stationWindowFrame = new MeshStandardMaterial({
    color: "#252b30",
    roughness: 0.4,
    metalness: 0.56,
  });
  const stationTileTexture = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    const tileSize = 64;
    for (let row = 0; row < 8; row++) {
      for (let column = 0; column < 8; column++) {
        const shade = 89 + ((row * 17 + column * 11) % 13);
        context.fillStyle = `rgb(${shade},${shade + 2},${shade - 2})`;
        context.fillRect(
          column * tileSize + 2,
          row * tileSize + 2,
          tileSize - 4,
          tileSize - 4
        );
      }
    }
    context.strokeStyle = "rgba(15,19,20,.75)";
    context.lineWidth = 3;
    for (let line = 0; line <= 8; line++) {
      context.beginPath();
      context.moveTo(line * tileSize, 0);
      context.lineTo(line * tileSize, 512);
      context.stroke();
      context.beginPath();
      context.moveTo(0, line * tileSize);
      context.lineTo(512, line * tileSize);
      context.stroke();
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = "srgb";
    return texture;
  })();
  const stationFloor = new MeshStandardMaterial({
    color: "#b5b6ad",
    map: stationTileTexture,
    bumpMap: stationTileTexture,
    bumpScale: 0.028,
    roughness: 0.68,
    metalness: 0.025,
  });
  const stationScreen = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 160;
    const context = canvas.getContext("2d");
    context.fillStyle = "#071317";
    context.fillRect(0, 0, 256, 160);
    context.strokeStyle = "#537078";
    context.lineWidth = 5;
    context.strokeRect(5, 5, 246, 150);
    context.fillStyle = "#75e0c0";
    context.font = "bold 54px monospace";
    context.textAlign = "center";
    context.fillText("87.9", 128, 68);
    context.font = "bold 24px monospace";
    context.fillText("L / $", 128, 112);
    context.fillStyle = "#9ec2b2";
    context.font = "16px sans-serif";
    context.fillText("TAP  •  INSERT", 128, 140);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = "srgb";
    return texture;
  })();
  const stationScreenMat = new MeshStandardMaterial({
    map: stationScreen,
    emissiveMap: stationScreen,
    emissive: "#9bdbc8",
    emissiveIntensity: 0.65,
    roughness: 0.32,
    metalness: 0.08,
  });
  const stationAwningLight = new MeshStandardMaterial({
    color: "#fff5df",
    emissive: "#ffe7b5",
    emissiveIntensity: 1.35,
    roughness: 0.35,
  });
  const stationSignTexture = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 192;
    const context = canvas.getContext("2d");
    context.fillStyle = "#17252a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#c6dc77";
    context.fillRect(0, 0, 18, canvas.height);
    context.fillRect(canvas.width - 18, 0, 18, canvas.height);
    context.fillStyle = "#f5f1e6";
    context.font = "bold 76px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      "NORTHLINE  •  DÉPANNEUR",
      canvas.width / 2,
      canvas.height / 2
    );
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = "srgb";
    return texture;
  })();
  const stationSignMat = new MeshStandardMaterial({
    map: stationSignTexture,
    emissiveMap: stationSignTexture,
    emissive: "#d7edac",
    emissiveIntensity: 0.6,
    roughness: 0.48,
  });
  const stationShelfMat = new MeshStandardMaterial({
    color: "#4a5051",
    roughness: 0.64,
    metalness: 0.42,
  });
  const stationProductMats = [
    new MeshStandardMaterial({
      color: "#c44a36",
      roughness: 0.64,
    }),
    new MeshStandardMaterial({
      color: "#d5b247",
      roughness: 0.58,
    }),
    new MeshStandardMaterial({
      color: "#577f9c",
      roughness: 0.57,
    }),
    new MeshStandardMaterial({
      color: "#65805b",
      roughness: 0.7,
    }),
    new MeshStandardMaterial({
      color: "#eee4cb",
      roughness: 0.65,
    }),
  ];
  const stationShelfFrames = new InstancedMesh(
    new BoxGeometry(0.72, 2.05, 0.55),
    stationShelfMat,
    18
  );
  const stationShelfBoards = new InstancedMesh(
    new BoxGeometry(0.82, 0.055, 0.68),
    stationSteel,
    72
  );
  const stationCoolerShelves = new InstancedMesh(
    new BoxGeometry(1.12, 0.035, 0.42),
    stationSteel,
    36
  );
  const stationHoseSegments = new InstancedMesh(
    new CylinderGeometry(0.035, 0.035, 1, 8),
    stationDarkSteel,
    48
  );
  let stationShelfFrameCount = 0;
  let stationShelfBoardCount = 0;
  let stationCoolerShelfCount = 0;
  let stationHoseCount = 0;
  const stationShelfProducts = stationProductMats.map((material) => {
    return new InstancedMesh(new BoxGeometry(0.17, 0.27, 0.2), material, 216);
  });
  const stationCoolerProducts = stationProductMats.map((material) => {
    return new InstancedMesh(new BoxGeometry(0.12, 0.25, 0.12), material, 72);
  });
  const stationShelfProductCounts = stationProductMats.map(() => {
    return 0;
  });
  const stationCoolerProductCounts = stationProductMats.map(() => {
    return 0;
  });
  const placeStationProduct = (meshes, counts, materialIndex, x, yPos, z) => {
    const mesh = meshes[materialIndex];
    const instance = counts[materialIndex]++;
    _.set(x, yPos, z);
    v.identity();
    y.set(1, 1, 1);
    g.compose(_, v, y);
    mesh.setMatrixAt(instance, g);
  };
  const placeStationInstance = (
    mesh,
    instance,
    x,
    yPos,
    z,
    scaleX = 1,
    scaleY = 1,
    scaleZ = 1
  ) => {
    _.set(x, yPos, z);
    v.identity();
    y.set(scaleX, scaleY, scaleZ);
    g.compose(_, v, y);
    mesh.setMatrixAt(instance, g);
  };
  const stationPumpFace = (x, y, z, side) => {
    const face = new Mesh(new PlaneGeometry(0.42, 0.3), stationScreenMat);
    face.position.set(x, y, z + side * 0.317);
    if (side < 0) {
      face.rotation.y = Math.PI;
    }
    e.add(face);
    const bezel = m(0.5, 0.38, 0.035, x, y, z + side * 0.295, stationDarkSteel);
    bezel.renderOrder = 2;
    face.renderOrder = 3;
    m(0.22, 0.12, 0.025, x, y - 0.34, z + side * 0.323, stationDarkSteel);
    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < 3; column++) {
        const button = new Mesh(
          new CylinderGeometry(0.025, 0.025, 0.022, 10),
          column === 0 ? stationRed : stationSteel
        );
        button.position.set(
          x - 0.13 + column * 0.13,
          y - 0.48 - row * 0.095,
          z + side * 0.326
        );
        e.add(button);
      }
    }
    m(0.35, 0.12, 0.03, x, y - 0.75, z + side * 0.327, stationDarkSteel);
  };
  const addFuelPump = (x, z, groundY) => {
    m(1.55, 0.14, 3.8, x, groundY + 0.12, z, stationSteel);
    m(1.46, 0.055, 3.68, x, groundY + 0.218, z, stationDarkSteel);
    m(0.82, 0.2, 0.72, x, groundY + 0.34, z, stationDarkSteel);
    m(0.76, 1.34, 0.62, x, groundY + 1.11, z, stationWhite);
    m(0.765, 0.17, 0.625, x, groundY + 1.72, z, stationRed);
    m(0.79, 0.105, 0.65, x, groundY + 1.86, z, stationSteel);
    h(x, z, 0.42, 0.38);
    for (const side of [-1, 1]) {
      stationPumpFace(x, groundY + 1.36, z, side);
    }
    for (const side of [-1, 1]) {
      const hoseX = x + side * 0.39;
      const hoseZ = z + 0.05;
      const points = [
        [hoseX, groundY + 1.48, hoseZ],
        [x + side * 0.62, groundY + 1.52, hoseZ],
        [x + side * 0.7, groundY + 1.35, hoseZ + 0.08],
        [x + side * 0.7, groundY + 0.83, hoseZ + 0.13],
        [x + side * 0.55, groundY + 0.7, hoseZ + 0.18],
      ];
      for (let segment = 0; segment < points.length - 1; segment++) {
        const from = new Vector3(...points[segment]);
        const to = new Vector3(...points[segment + 1]);
        const delta = new Vector3().subVectors(to, from);
        const length = delta.length();
        _.copy(from).add(to).multiplyScalar(0.5);
        v.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize());
        y.set(1, length, 1);
        g.compose(_, v, y);
        stationHoseSegments.setMatrixAt(stationHoseCount++, g);
      }
      m(
        0.075,
        0.28,
        0.075,
        x + side * 0.4,
        groundY + 1.56,
        z - 0.17,
        stationSteel
      );
      m(
        0.075,
        0.34,
        0.075,
        x + side * 0.4,
        groundY + 1.4,
        z + 0.22,
        stationDarkSteel
      );
      m(0.12, 0.08, 0.1, x + side * 0.4, groundY + 1.56, z + 0.3, stationRed);
    }
    const bollardMat = stationRed;
    for (const side of [-1, 1]) {
      m(
        0.12,
        0.62,
        0.12,
        x + side * 0.91,
        groundY + 0.43,
        z + 1.44,
        bollardMat
      );
      m(
        0.14,
        0.08,
        0.14,
        x + side * 0.91,
        groundY + 0.76,
        z + 1.44,
        stationWhite
      );
      h(x + side * 0.91, z + 1.44, 0.1, 0.1);
    }
  };
  const storeShell = new MeshStandardMaterial({
    color: "#c5c1b4",
    roughness: 0.84,
    metalness: 0.03,
  });
  const storeRoofMat = new MeshStandardMaterial({
    color: "#353b3e",
    roughness: 0.72,
    metalness: 0.3,
  });
  const coolerMat = new MeshStandardMaterial({
    color: "#eaf0eb",
    roughness: 0.27,
    metalness: 0.3,
    emissive: "#7cc9dc",
    emissiveIntensity: 0.12,
  });
  const coolerGlass = new MeshPhysicalMaterial({
    color: "#d8efff",
    roughness: 0.08,
    metalness: 0.02,
    transparent: true,
    opacity: 0.18,
    side: 2,
  });
  const counterMat = new MeshStandardMaterial({
    color: "#41352b",
    roughness: 0.72,
    metalness: 0.1,
  });
  const addStationStore = (station, index, groundY) => {
    const shopX = station.x;
    const shopZ = station.z + 11.15;
    const frontZ = shopZ - 4.35;
    const backZ = shopZ + 4.35;
    const wallHeight = 3.55;
    const halfWidth = 5.8;
    m(11.8, 0.2, 9, shopX, groundY + 0.1, shopZ, stationFloor);
    m(12.15, 0.22, 0.22, shopX, groundY + 0.14, shopZ, stationDarkSteel);
    m(
      0.24,
      wallHeight,
      9,
      shopX - halfWidth,
      groundY + wallHeight / 2,
      shopZ,
      storeShell,
      true
    );
    m(
      0.24,
      wallHeight,
      9,
      shopX + halfWidth,
      groundY + wallHeight / 2,
      shopZ,
      storeShell,
      true
    );
    m(
      11.8,
      wallHeight,
      0.24,
      shopX,
      groundY + wallHeight / 2,
      backZ,
      storeShell,
      true
    );
    const storefrontCenter = 3; /* 3.0 */
    const storefrontWidth = 4.25;
    for (const side of [-1, 1]) {
      const windowX = shopX + side * storefrontCenter;
      m(storefrontWidth, 0.8, 0.24, windowX, groundY + 0.4, frontZ, storeShell);
      m(
        storefrontWidth,
        0.47,
        0.24,
        windowX,
        groundY + 3.31,
        frontZ,
        storeShell
      );
      h(windowX, frontZ, storefrontWidth / 2, 0.14);
    }
    m(1.7, 0.3, 0.24, shopX, groundY + 3.4, frontZ, storeShell);
    m(12.35, 0.18, 9.35, shopX, groundY + 3.72, shopZ, storeRoofMat);
    m(12.5, 0.15, 0.18, shopX, groundY + 3.58, frontZ, stationRed);
    m(12.5, 0.15, 0.18, shopX, groundY + 3.58, backZ, stationRed);
    m(0.18, 0.15, 9.2, shopX - 6.1, groundY + 3.58, shopZ, stationRed);
    m(0.18, 0.15, 9.2, shopX + 6.1, groundY + 3.58, shopZ, stationRed);
    for (const side of [-1, 1]) {
      m(
        storefrontWidth,
        2.25,
        0.035,
        shopX + side * storefrontCenter,
        groundY + 1.95,
        frontZ - 0.14,
        stationGlass
      );
      for (const frameX of [-1, 1]) {
        m(
          0.055,
          2.35,
          0.07,
          shopX +
            side * storefrontCenter +
            frameX * (storefrontWidth / 2 - 0.06),
          groundY + 1.95,
          frontZ - 0.19,
          stationWindowFrame
        );
      }
      m(
        storefrontWidth,
        0.065,
        0.08,
        shopX + side * storefrontCenter,
        groundY + 0.78,
        frontZ - 0.19,
        stationWindowFrame
      );
      m(
        storefrontWidth,
        0.065,
        0.08,
        shopX + side * storefrontCenter,
        groundY + 3.12,
        frontZ - 0.19,
        stationWindowFrame
      );
      m(
        0.055,
        2.25,
        0.065,
        shopX + side * storefrontCenter,
        groundY + 1.95,
        frontZ - 0.19,
        stationWindowFrame
      );
    }
    m(
      0.09,
      2.28,
      0.09,
      shopX - 0.9,
      groundY + 1.92,
      frontZ - 0.19,
      stationWindowFrame
    );
    m(
      0.09,
      2.28,
      0.09,
      shopX + 0.9,
      groundY + 1.92,
      frontZ - 0.19,
      stationWindowFrame
    );
    m(1.16, 0.045, 0.5, shopX, groundY + 0.17, frontZ - 0.3, stationDarkSteel);
    const openDoor = new Mesh(new BoxGeometry(0.78, 2.18, 0.075), stationGlass);
    openDoor.position.set(shopX + 0.24, groundY + 1.24, frontZ + 0.04);
    openDoor.rotation.y = -0.72;
    e.add(openDoor);
    m(
      0.12,
      0.12,
      0.12,
      shopX + 0.24,
      groundY + 2.38,
      frontZ + 0.04,
      stationSteel
    );
    m(
      0.045,
      0.24,
      0.035,
      shopX - 0.05,
      groundY + 1.22,
      frontZ - 0.12,
      stationSteel
    );
    const sign = new Mesh(new PlaneGeometry(5.2, 0.72), stationSignMat);
    sign.position.set(shopX, groundY + 3.05, frontZ - 0.205);
    sign.rotation.y = Math.PI;
    e.add(sign);
    for (const side of [-1, 1]) {
      m(
        0.13,
        3.6,
        0.13,
        shopX + side * 6.22,
        groundY + 1.8,
        shopZ,
        stationSteel
      );
    }
    m(4.5, 0.12, 0.72, shopX, groundY + 1.04, shopZ + 3.65, counterMat);
    m(4.5, 0.7, 0.16, shopX, groundY + 0.64, shopZ + 3.95, counterMat);
    m(
      0.56,
      0.12,
      0.4,
      shopX - 0.95,
      groundY + 1.17,
      shopZ + 3.35,
      stationDarkSteel
    );
    m(
      0.48,
      0.48,
      0.04,
      shopX - 0.95,
      groundY + 1.47,
      shopZ + 3.32,
      stationScreenMat
    );
    m(
      0.12,
      0.25,
      0.16,
      shopX + 1.75,
      groundY + 1.18,
      shopZ + 3.54,
      stationSteel
    );
    for (let shelf = 0; shelf < 3; shelf++) {
      const shelfZ = shopZ - 1.5 + shelf * 1.15;
      for (const side of [-1, 1]) {
        const shelfX = shopX + side * 4.45;
        placeStationInstance(
          stationShelfFrames,
          stationShelfFrameCount++,
          shelfX,
          groundY + 1.08,
          shelfZ
        );
        for (let level = 0; level < 4; level++) {
          const shelfY = groundY + 0.42 + level * 0.49;
          placeStationInstance(
            stationShelfBoards,
            stationShelfBoardCount++,
            shelfX,
            shelfY,
            shelfZ
          );
          for (let product = 0; product < 3; product++) {
            const materialIndex =
              (product + level + shelf + index) % stationProductMats.length;
            placeStationProduct(
              stationShelfProducts,
              stationShelfProductCounts,
              materialIndex,
              shelfX - 0.25 + product * 0.25,
              shelfY + 0.16,
              shelfZ
            );
          }
        }
        h(shelfX, shelfZ, 0.4, 0.32);
      }
    }
    for (let cooler = 0; cooler < 3; cooler++) {
      const coolerX = shopX - 2.5 + cooler * 1.65;
      const coolerZ = shopZ + 0.3;
      m(1.48, 2.3, 0.65, coolerX, groundY + 1.18, coolerZ, coolerMat);
      m(
        1.35,
        1.95,
        0.035,
        coolerX,
        groundY + 1.26,
        coolerZ - 0.35,
        coolerGlass
      );
      m(0.045, 2, 0.07, coolerX, groundY + 1.26, coolerZ - 0.385, stationSteel);
      for (let level = 0; level < 4; level++) {
        placeStationInstance(
          stationCoolerShelves,
          stationCoolerShelfCount++,
          coolerX,
          groundY + 0.55 + level * 0.42,
          coolerZ - 0.04
        );
        placeStationProduct(
          stationCoolerProducts,
          stationCoolerProductCounts,
          (level + cooler) % stationProductMats.length,
          coolerX - 0.38,
          groundY + 0.7 + level * 0.42,
          coolerZ - 0.1
        );
        placeStationProduct(
          stationCoolerProducts,
          stationCoolerProductCounts,
          (level + cooler + 2) % stationProductMats.length,
          coolerX,
          groundY + 0.7 + level * 0.42,
          coolerZ - 0.1
        );
        placeStationProduct(
          stationCoolerProducts,
          stationCoolerProductCounts,
          (level + cooler + 4) % stationProductMats.length,
          coolerX + 0.38,
          groundY + 0.7 + level * 0.42,
          coolerZ - 0.1
        );
      }
      m(
        0.04,
        0.32,
        0.04,
        coolerX + 0.52,
        groundY + 1.25,
        coolerZ - 0.4,
        stationSteel
      );
      h(coolerX, coolerZ, 0.74, 0.36);
    }
    h(shopX, shopZ + 3.76, 2.28, 0.43);
    for (let light = 0; light < 2; light++) {
      const lightX = shopX + (light ? 3.5 : -3.5);
      m(
        1.7,
        0.045,
        0.34,
        lightX,
        groundY + 3.39,
        shopZ - 0.15,
        stationAwningLight
      );
    }
    const insideLight = new PointLight("#fff0d5", 0.55, 17, 2);
    insideLight.position.set(shopX, groundY + 2.8, shopZ);
    e.add(insideLight);
    const outsideLight = new PointLight("#dceeff", 0.55, 15, 2);
    outsideLight.position.set(shopX, groundY + 3.3, frontZ - 1);
    e.add(outsideLight);
  };
  for (let stationIndex = 0; stationIndex < nm.length; stationIndex++) {
    const station = nm[stationIndex];
    const groundY = Uw(station.x, station.z);
    m(26, 0.14, 22, station.x, groundY + 0.07, station.z, o);
    const access = stationRoadAccesses[stationIndex];
    const roadEdgeX = access.roadX + access.side * 9;
    const stationEdgeX = station.x - access.side * 13;
    const accessLength = Math.abs(stationEdgeX - roadEdgeX) + 3;
    const accessCenterX = (stationEdgeX + roadEdgeX) / 2;
    m(accessLength, 0.12, 9.5, accessCenterX, groundY + 0.07, station.z, r);
    const canopy = new MeshStandardMaterial({
      color: stationIndex === 1 ? "#d8e1e0" : "#e8eef2",
      roughness: 0.52,
      metalness: 0.16,
    });
    const canopyTop = new MeshStandardMaterial({
      color: "#343b40",
      roughness: 0.62,
      metalness: 0.25,
    });
    m(24.5, 0.45, 16, station.x, groundY + 5.2, station.z, canopy);
    m(24.3, 0.12, 15.8, station.x, groundY + 5.49, station.z, canopyTop);
    m(
      24.7,
      0.12,
      0.22,
      station.x,
      groundY + 4.94,
      station.z - 8.02,
      stationRed
    );
    m(
      24.7,
      0.12,
      0.22,
      station.x,
      groundY + 4.94,
      station.z + 8.02,
      stationRed
    );
    m(
      0.16,
      0.08,
      15.8,
      station.x - 12.1,
      groundY + 4.93,
      station.z,
      stationSteel
    );
    m(
      0.16,
      0.08,
      15.8,
      station.x + 12.1,
      groundY + 4.93,
      station.z,
      stationSteel
    );
    for (let rib = -4; rib <= 4; rib++) {
      m(
        0.045,
        0.06,
        15.7,
        station.x + rib * 2.6,
        groundY + 5.57,
        station.z,
        stationSteel
      );
    }
    for (let side of [-1, 1]) {
      m(
        20,
        0.38,
        0.1,
        station.x,
        groundY + 5.23,
        station.z + side * 8.1,
        stationSignMat
      );
    }
    for (let x of [-11.8, 11.8]) {
      for (let z of [-7, 7]) {
        m(
          0.48,
          5.2,
          0.48,
          station.x + x,
          groundY + 2.6,
          station.z + z,
          stationSteel,
          true
        );
        m(
          0.64,
          0.12,
          0.64,
          station.x + x,
          groundY + 0.2,
          station.z + z,
          stationDarkSteel
        );
      }
    }
    for (let lampX of [-7.5, -2.5, 2.5, 7.5]) {
      for (let lampZ of [-5, 5]) {
        m(
          2.1,
          0.045,
          0.7,
          station.x + lampX,
          groundY + 4.94,
          station.z + lampZ,
          stationAwningLight
        );
      }
    }
    const canopyLight = new PointLight("#fff0d5", 0.7, 28, 2);
    canopyLight.position.set(station.x, groundY + 4.62, station.z);
    e.add(canopyLight);
    addFuelPump(station.x - 4, station.z - 2.35, groundY);
    addFuelPump(station.x + 4, station.z - 2.35, groundY);
    addStationStore(station, stationIndex, groundY);
    for (const [parkingX, parkingZ, acrossX] of [
      [station.x - 9, station.z - 6, false],
      [station.x + 9, station.z - 6, false],
      [station.x - 9, station.z + 7.5, true],
    ]) {
      for (const side of [-1, 1]) {
        if (acrossX) {
          m(
            5.6,
            0.018,
            0.085,
            parkingX,
            groundY + 0.16,
            parkingZ + side * 1.4,
            stationParkingPaint
          );
        } else {
          m(
            0.085,
            0.018,
            5.6,
            parkingX + side * 1.4,
            groundY + 0.16,
            parkingZ,
            stationParkingPaint
          );
        }
      }
    }
    m(
      0.28,
      7,
      0.28,
      station.x + 12,
      groundY + 3.5,
      station.z + 9,
      stationSteel
    );
    m(3, 1.4, 0.3, station.x + 12, groundY + 7, station.z + 9, stationSignMat);
    const priceBoard = new Mesh(new PlaneGeometry(2.3, 0.72), stationScreenMat);
    priceBoard.position.set(station.x + 12, groundY + 7, station.z + 8.83);
    priceBoard.rotation.y = Math.PI;
    e.add(priceBoard);
    const canopyBadge = new Mesh(new PlaneGeometry(4.4, 0.48), stationSignMat);
    canopyBadge.position.set(station.x, groundY + 5.22, station.z - 8.09);
    e.add(canopyBadge);
  }
  for (const [mesh, count] of [
    [stationShelfFrames, stationShelfFrameCount],
    [stationShelfBoards, stationShelfBoardCount],
    [stationCoolerShelves, stationCoolerShelfCount],
    [stationHoseSegments, stationHoseCount],
  ]) {
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    e.add(mesh);
  }
  for (let index = 0; index < stationProductMats.length; index++) {
    const shelfProducts = stationShelfProducts[index];
    shelfProducts.count = stationShelfProductCounts[index];
    shelfProducts.instanceMatrix.needsUpdate = true;
    e.add(shelfProducts);
    const coolerProducts = stationCoolerProducts[index];
    coolerProducts.count = stationCoolerProductCounts[index];
    coolerProducts.instanceMatrix.needsUpdate = true;
    e.add(coolerProducts);
  }
  m(28, 0.15, 820, 175, 0.025, -290, i);
  for (let e = -680; e < 150; e += 12) {
    E(175, e, 0.22, 7, 0.14);
  }
  m(0.2, 0.02, 820, 168, 0.14, -290, c);
  m(0.2, 0.02, 820, 182, 0.14, -290, c);

  let F = new InstancedMesh(
    new BoxGeometry(0.1, 0.04, 0.1),
    new MeshStandardMaterial({
      color: "#ffeecc",
      emissive: "#ffcc66",
      emissiveIntensity: 2.2,
    }),
    200
  );

  let I = 0;
  for (let e = -680; e < 150; e += 6) {
    _.set(171.5, 0.16, e);
    v.identity();
    y.set(1, 1, 1);
    g.compose(_, v, y);
    F.setMatrixAt(I++, g);
  }
  F.count = I;
  F.instanceMatrix.needsUpdate = true;
  e.add(F);
  let L = new BoxGeometry(0.12, 0.9, 0.12);
  let R = new BoxGeometry(0.6, 0.85, 11);
  let z = new InstancedMesh(L, d, 200);
  let ee = new InstancedMesh(R, a, 200);
  z.castShadow = true;
  ee.castShadow = true;
  ee.receiveShadow = true;
  let B = 0;
  for (let e = -690; e < 160; e += 14) {
    if (Math.abs(e - 70) >= 11 && Math.abs(e + 80) >= 11) {
      for (let t of [-15, 15]) {
        _.set(175 + t, 0.45, e);
        v.identity();
        y.set(1, 1, 1);
        g.compose(_, v, y);
        z.setMatrixAt(B, g);
        ee.setMatrixAt(B, g);
        h(175 + t, e, 0.3, 5.5);
        B++;
      }
    }
  }
  z.count = B;
  ee.count = B;
  z.instanceMatrix.needsUpdate = true;
  ee.instanceMatrix.needsUpdate = true;
  e.add(z);
  e.add(ee);
  m(60, 0.12, 18, 147, 0.02, 70, i);
  m(60, 0.12, 18, 147, 0.02, -80, i);
  for (let e = -155; e > -520; e -= 4) {
    let t = e - 4;
    let n = Hw(e);
    let i = Hw(t);
    let o = Uw(n, e);
    let s = Math.hypot(4, i - n) + 1;
    let c = m(14, 0.18, s, n, o, e, r);
    c.rotation.y = -Math.atan2(i - n, 4);

    if (Math.round(e / 8) % 2 == 0) {
      let t = m(0.22, 0.02, 2, n, o + 0.13, e, l);
      t.rotation.y = c.rotation.y;
    }

    for (let t of [-1, 1]) {
      let r = m(0.3, 0.65, s, n + t * 7.5, o + 0.42, e, a);
      r.rotation.y = c.rotation.y;
    }
  }
  m(18, 0.1, 36, 0, 0, -130, r);
  for (let e = 0; e < 10; e++) {
    let t = -132 - e * 3.4;
    let n = t - 3.4;
    let i = (-25 * e) / 10;
    let a = (-25 * (e + 1)) / 10;
    let o = m(15, 0.15, 5.4, (i + a) / 2, Uw(i, t), (t + n) / 2, r);
    o.rotation.y = -Math.atan2(a - i, 3.4);
  }
  const closureFaceCanvas = document.createElement("canvas");
  closureFaceCanvas.width = 512;
  closureFaceCanvas.height = 128;
  const closureFaceContext = closureFaceCanvas.getContext("2d");
  closureFaceContext.fillStyle = "#e96b1b";
  closureFaceContext.fillRect(0, 0, 512, 128);
  closureFaceContext.save();
  closureFaceContext.beginPath();
  closureFaceContext.rect(0, 0, 512, 128);
  closureFaceContext.clip();
  closureFaceContext.translate(-128, 0);
  closureFaceContext.rotate(-Math.PI / 4);
  for (let stripe = -256; stripe < 768; stripe += 112) {
    closureFaceContext.fillStyle = "#eee9dc";
    closureFaceContext.fillRect(stripe, -256, 46, 768);
    closureFaceContext.fillStyle = "rgba(45, 45, 45, .35)";
    closureFaceContext.fillRect(stripe + 46, -256, 8, 768);
  }
  closureFaceContext.restore();
  const closureFaceTexture = new CanvasTexture(closureFaceCanvas);
  closureFaceTexture.colorSpace = "srgb";
  const closureFaceMaterial = new MeshStandardMaterial({
    map: closureFaceTexture,
    roughness: 0.58,
    metalness: 0.02,
  });
  const closureOrange = new MeshStandardMaterial({
    color: "#eb701f",
    roughness: 0.72,
    metalness: 0.02,
  });
  const closureDark = new MeshStandardMaterial({
    color: "#373b3e",
    roughness: 0.84,
    metalness: 0.12,
  });
  const closureLamp = new MeshStandardMaterial({
    color: "#ffad32",
    emissive: "#ff8518",
    emissiveIntensity: 0.7,
    roughness: 0.3,
  });
  function addRoadClosure(x, z, width, depth, yaw = 0) {
    const barrier = new Group();
    barrier.position.set(x, Uw(x, z), z);
    barrier.rotation.y = yaw;
    const moduleLength = 4.2;
    const moduleCount = Math.ceil(width / moduleLength);
    const actualWidth = moduleCount * moduleLength;
    const firstX = -actualWidth / 2 + moduleLength / 2;
    for (let index = 0; index < moduleCount; index++) {
      const localX = firstX + index * moduleLength;
      const base = new Mesh(
        new BoxGeometry(moduleLength - 0.08, 0.32, depth),
        closureDark
      );
      base.position.set(localX, 0.16, 0);
      barrier.add(base);
      const lowerBody = new Mesh(
        new BoxGeometry(moduleLength - 0.14, 0.34, depth - 0.06),
        closureOrange
      );
      lowerBody.position.set(localX, 0.49, 0);
      barrier.add(lowerBody);
      const upperBody = new Mesh(
        new BoxGeometry(moduleLength - 0.38, 0.42, depth - 0.32),
        closureOrange
      );
      upperBody.position.set(localX, 0.87, 0);
      barrier.add(upperBody);
      for (const faceSide of [-1, 1]) {
        const face = new Mesh(
          new BoxGeometry(moduleLength - 0.62, 0.3, 0.025),
          closureFaceMaterial
        );
        face.position.set(localX, 0.88, faceSide * (depth / 2 - 0.15));
        barrier.add(face);
      }
      const join = new Mesh(
        new BoxGeometry(0.12, 0.16, depth - 0.12),
        closureDark
      );
      join.position.set(localX + moduleLength / 2 - 0.02, 0.32, 0);
      barrier.add(join);
      if (index === 0 || index === moduleCount - 1) {
        const lamp = new Mesh(
          new CylinderGeometry(0.13, 0.13, 0.12, 12),
          closureLamp
        );
        lamp.position.set(localX, 1.14, 0);
        barrier.add(lamp);
      }
    }
    e.add(barrier);
    const cosine = Math.abs(Math.cos(yaw));
    const sine = Math.abs(Math.sin(yaw));
    h(
      x,
      z,
      (cosine * actualWidth) / 2 + (sine * depth) / 2,
      (sine * actualWidth) / 2 + (cosine * depth) / 2
    );
  }
  addRoadClosure(175, -695, 28, 1.4, Math.PI / 2);

  let te = new MeshStandardMaterial({
    color: "#2c3a36",
    roughness: 0.95,
  });

  let ne = new InstancedMesh(new ConeGeometry(1, 1, 14), te, 60);
  ne.castShadow = true;
  for (let e = 0; e < 60; e++) {
    let t = -185 - j() * 350;
    let n = j() > 0.5 ? 1 : -1;
    let i = 18 + j() * 55;
    let a = 18 + j() * 26;
    let r = Hw(t) + n * Math.max(30 + j() * 70, a * 1.7 + 12);
    _.set(r, Uw(r, t) + i / 2 - 4, t);
    v.identity();
    y.set(a, i, a);
    g.compose(_, v, y);
    ne.setMatrixAt(e, g);
    h(r, t, a * 0.6, a * 0.6);
  }
  ne.instanceMatrix.needsUpdate = true;
  e.add(ne);

  let re = new MeshStandardMaterial({
    color: "#423d34",
    roughness: 0.9,
  });

  let ie = new MeshStandardMaterial({
    color: "#1f4736",
    roughness: 0.9,
  });

  let ae = new InstancedMesh(new CylinderGeometry(0.25, 0.4, 4, 12), re, 120);

  let oe = [
    new ConeGeometry(2.8, 3.5, 16),
    new ConeGeometry(2.3, 3.5, 16),
    new ConeGeometry(1.8, 3.5, 16),
  ].map((e) => {
    let t = new InstancedMesh(e, ie, 120);
    t.castShadow = true;
    return t;
  });

  for (let e = 0; e < 120; e++) {
    let t = -165 - j() * 360;
    let n = Hw(t) + (j() > 0.5 ? 1 : -1) * (12 + j() * 14);
    let r = Uw(n, t);
    _.set(n, r + 2, t);
    v.identity();
    y.set(1, 1, 1);
    g.compose(_, v, y);
    ae.setMatrixAt(e, g);
    for (let i = 0; i < 3; i++) {
      _.set(n, r + 4 + i * 2, t);
      g.compose(_, v, y);
      oe[i].setMatrixAt(e, g);
    }
    h(n, t, 0.6, 0.6);
  }
  ae.instanceMatrix.needsUpdate = true;
  e.add(ae);
  for (let t of oe) {
    t.instanceMatrix.needsUpdate = true;
    e.add(t);
  }
  let H = new BufferGeometry();
  let se = [];
  for (let e = 0; e < 500; e++) {
    se.push(
      (Math.random() - 0.5) * 1000 /* 1e3 */,
      220 + Math.random() * 250,
      (Math.random() - 0.5) * 1000 /* 1e3 */
    );
  }
  H.setAttribute("position", new Float32BufferAttribute(se, 3));

  e.add(
    new Points(
      H,
      new PointsMaterial({
        color: "#ffffff",
        size: 1.6,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
      })
    )
  );

  return {
    solids: t,
    lampPositions: n,
    signals,
  };
}

var eT = (e, t, n) => {
  return Math.max(t, Math.min(n, e));
};

var tT = (e, t, n) => {
  return e + (t - e) * n;
};

var nT = (e, t, n, r) => {
  return e + (t - e) * (1 - Math.exp(-n * r));
};

var rT = Math.PI * 2;

var iT = {
  coupe: 2.62,
  muscle: 2.95,
  super: 2.65,
};

var aT = 0.55;
function oT(e) {
  let t = em[e] || 7200;
  return $p.ratios.map((e) => {
    return (t / 60 / (e * $p.finalDrive)) * rT * $p.wheel;
  });
}
function sT(e) {
  return (
    ((em[e] || 7200) / 60 / (Math.abs($p.reverse) * $p.finalDrive)) *
    rT *
    $p.wheel
  );
}
function cT(e, t) {
  let n = iT[e.shape] || 2.62;
  let r = e.grip || 1;
  let i = t.max;
  let a = 4 + t.acceleration * 0.36;
  let o = 14 * r;
  let s = 13 * r;
  let c = e.awd ? 0.25 : 0.5;
  function l(e, t, r) {
    let l = e.noPolice ? 1 - Math.max(0, e.health) / 100 : 0;
    let u = i * (1 - 0.4 * l);
    let d = a * (1 - 0.4 * l);
    let f = o * (1 - 0.14 * l);
    let p = s * (1 - 0.1 * l);
    e.steer = nT(e.steer || 0, r.steer, r.steer ? 7 : 10, t);
    let m = e.steer;
    let h = e.heading;
    let g = e.vx * -Math.sin(h) + e.vz * -Math.cos(h);
    let _ = e.vx * -Math.cos(h) + e.vz * Math.sin(h);
    let v = g > 1 ? Math.atan2(-_, g) : 0;

    if (g > 7 && (r.handbrake || Math.abs(v) > 0.3)) {
      e.driftOn = true;
    } else if (!r.handbrake && (Math.abs(v) < 0.07 || g < 4)) {
      e.driftOn = false;
    }

    let y = (e.driftAmt = nT(
      e.driftAmt || 0,
      +!!e.driftOn,
      e.driftOn ? 10 : 4,
      t
    ));

    let b = Math.abs(g);

    let x =
      m * Math.min((b * Math.tan(aT)) / n, f / Math.max(b, 1)) * Math.sign(g);

    let S = eT(43 / Math.max(b, 13), 0.6, 1);
    let C = (r.handbrake ? 0.95 : r.throttle ? 0.7 : 0.1) * S;

    let w =
      Math.abs(m) > 0.15 ? m * C : r.handbrake ? v : v * (r.throttle ? 0.6 : 0);

    let T = (3 * p) / Math.max(b, 6);
    let E = eT((w - v) * 3.5, -T, T);
    e.yaw = nT(e.yaw || 0, tT(x, E, y), tT(12, 5, y), t);
    e.heading = h += e.yaw * t;
    let D = -Math.sin(h);
    let O = -Math.cos(h);
    let k = -Math.cos(h);
    let A = Math.sin(h);
    g = e.vx * D + e.vz * O;
    _ = e.vx * k + e.vz * A;
    let j = Math.sign(_) * Math.max(0, Math.abs(_) - tT(f * 1.3, p, y) * t);

    if (Math.abs(g) > 1) {
      g = Math.sign(g) * Math.sqrt(g * g + (_ * _ - j * j) * tT(1, 0.5, y));
    }

    _ = j;
    let M = 0;
    if (e.gear === -1) {
      M = -e.driveThrottle * r.fuel * d * 0.45 * (1 - Math.min(1, -g / 14));

      if (r.throttle && g < -0.3) {
        M += 16;
      }
    } else {
      let t = Math.min(1, Math.abs(g) / u);
      M = e.driveThrottle * r.fuel * d * (1 - t ** 2.2) * (1 - c * y);

      if (r.brake && g > 0.3) {
        M -= 16;
      }
    }

    if (r.handbrake && g > 0.3) {
      M -= 3.5;
    }

    let N =
      0.2 + 0.00025 /* 25e-5 */ * g * g + (!r.throttle && !r.brake ? 1.1 : 0);
    g -= Math.sign(g) * Math.min(Math.abs(g), N * t);
    g = eT(g + M * t, -14, u);
    e.vx = g * D + _ * k;
    e.vz = g * O + _ * A;
    e.slipAngle = Math.abs(g) > 1 ? Math.abs(Math.atan2(_, Math.abs(g))) : 0;
    e.u = g;
    e.w = _;
    e.ax = M;

    if (Math.abs(g) < 0.15 && Math.abs(_) < 0.15 && !r.throttle && !r.brake) {
      (e.vx = 0), (e.vz = 0), (e.u = 0), (e.w = 0), (e.yaw = 0);
    }
  }
  return {
    step: l,
  };
}
var lT = 7;
var uT = 0.93;

var dT = (e, t, n) => {
  return Math.max(t, Math.min(n, e));
};

function fT(e, t, n, r, i, a, o) {
  let s = em[t.id] || 7200;
  let c = t.id === "V12" ? 1000 /* 1e3 */ : 900;
  let l = oT(t.id);
  let u = Math.abs(r);
  e.redline = s;
  e.shiftTimer = Math.max(0, (e.shiftTimer || 0) - n);
  e.shiftCooldown = Math.max(0, (e.shiftCooldown || 0) - n);
  let d = r < -0.6 || (u < 0.6 && a && !i);

  let f = (e) => {
    return (u / l[e - 1]) * s;
  };

  let p = e.gear || 1;
  if (d) {
    p = -1;
  } else if (p < 1 || u < 0.5) {
    p = 1;
  } else if (e.shiftCooldown === 0 && e.shiftTimer === 0 && !o) {
    let e = s * (i ? 0.4 : 0.3);
    if (p < lT && f(p) > s * uT) {
      p++;
    } else if (p > 1 && f(p) < e) {
      for (p--; p > 1 && f(p - 1) < s * 0.75; ) {
        p--;
      }
    }
  }

  if (p !== e.gear) {
    p > 0 &&
      e.gear > 0 &&
      u > 0.5 &&
      ((e.shiftDirection = Math.sign(p - e.gear)),
      (e.shiftSerial = (e.shiftSerial || 0) + 1),
      (e.shiftTimer = t.id === "V12" ? 0.14 : 0.2),
      (e.shiftCooldown = 0.6)),
      (e.gear = p);
  }

  e.shifting = e.shiftTimer > 0;
  let m = d ? a : i;
  e.pedal = m;
  e.driveThrottle = m * (e.shifting ? 0.08 : 1);
  let h = d ? (u / sT(t.id)) * s : f(e.gear);
  let g = m * Math.max(0, 1 - u / 7) * 1600;
  let _ = o && i ? 1800 : 0;
  let v = e.shifting && e.shiftDirection < 0 ? 350 : 0;
  let y = t && e.fuel > 0 ? dT(Math.max(c + g, h) + _ + v, c, s) : 0;
  let b = e.shifting ? 19 : m ? 15 : 10;
  e.rpm = Math.round(e.rpm + (y - e.rpm) * (1 - Math.exp(-n * b)));
}
function pT(e, t, n, r, i) {
  return {
    x: e,
    z: t,
    hw: r,
    hl: i,
    cos: Math.cos(n),
    sin: Math.sin(n),
  };
}
function mT(e, t) {
  let n = t.x - e.x;
  let r = t.z - e.z;
  let i = Infinity;
  let a = 0;
  let o = 0;
  let s = -Infinity;
  for (let c = 0; c < 4; c++) {
    let l = c < 2 ? e : t;
    let u = c % 2 ? l.sin : l.cos;
    let d = c % 2 ? l.cos : -l.sin;
    let f = n * u + r * d;

    let p =
      e.hw * Math.abs(u * e.cos - d * e.sin) +
      e.hl * Math.abs(u * e.sin + d * e.cos) +
      (t.hw * Math.abs(u * t.cos - d * t.sin) +
        t.hl * Math.abs(u * t.sin + d * t.cos)) -
      Math.abs(f);

    if (p < i) {
      i = p;
      let e = f < 0 ? -1 : 1;
      a = u * e;
      o = d * e;
    }

    if (-p > s) {
      s = -p;
    }
  }
  return i > 0
    ? {
        overlap: true,
        depth: i,
        nx: a,
        nz: o,
        gap: -i,
      }
    : {
        overlap: false,
        depth: 0,
        nx: 0,
        nz: 0,
        gap: s,
      };
}
const dfcCollisionProfiles = new Map();
function dfcGetCollisionProfile(shape) {
  if (!dfcCollisionProfiles.has(shape)) {
    const spec = DFC_SPECS[shape] || DFC_SPECS.coupe;
    dfcCollisionProfiles.set(shape, {
      shape,
      length: spec.L,
      widths: spec.wid,
    });
  }
  return dfcCollisionProfiles.get(shape);
}
function dfcCreateCarFootprint(x, z, heading, profile) {
  const cos = Math.cos(heading);
  const sin = Math.sin(heading);
  const vertices = [];
  const addSide = (side, reverse) => {
    const stations = reverse ? [...profile.widths].reverse() : profile.widths;
    for (const [station, halfWidth] of stations) {
      const localX = side * halfWidth;
      const localZ = station - profile.length / 2;
      vertices.push([
        x + localX * cos + localZ * sin,
        z - localX * sin + localZ * cos,
      ]);
    }
  };
  addSide(1, false);
  addSide(-1, true);
  return {
    x,
    z,
    vertices,
  };
}
function dfcFootprintBoxCollision(car, box) {
  let minOverlap = Infinity;
  let nx = 0;
  let nz = 0;
  const axes = [
    [1, 0],
    [0, 1],
  ];
  for (let index = 0; index < car.vertices.length; index++) {
    const current = car.vertices[index];
    const next = car.vertices[(index + 1) % car.vertices.length];
    const edgeX = next[0] - current[0];
    const edgeZ = next[1] - current[1];
    const edgeLength = Math.hypot(edgeX, edgeZ);
    if (edgeLength > 1e-8) {
      axes.push([-edgeZ / edgeLength, edgeX / edgeLength]);
    }
  }
  for (const [axisX, axisZ] of axes) {
    let carMin = Infinity;
    let carMax = -Infinity;
    for (const [x, z] of car.vertices) {
      const projection = x * axisX + z * axisZ;
      carMin = Math.min(carMin, projection);
      carMax = Math.max(carMax, projection);
    }
    const boxCenter = box.x * axisX + box.z * axisZ;
    const boxRadius = box.w * Math.abs(axisX) + box.d * Math.abs(axisZ);
    const overlap =
      Math.min(carMax, boxCenter + boxRadius) -
      Math.max(carMin, boxCenter - boxRadius);
    if (overlap <= 0) {
      return null;
    }
    if (overlap < minOverlap) {
      const direction =
        boxCenter - (car.x * axisX + car.z * axisZ) < 0 ? -1 : 1;
      minOverlap = overlap;
      nx = axisX * direction;
      nz = axisZ * direction;
    }
  }
  return {
    depth: minOverlap,
    nx,
    nz,
  };
}
var hT = 24;
function gT(e) {
  let t = new Map();
  for (let n of e) {
    let e = Math.floor((n.x - n.w) / hT);
    let r = Math.floor((n.x + n.w) / hT);
    let i = Math.floor((n.z - n.d) / hT);
    let a = Math.floor((n.z + n.d) / hT);
    for (let o = e; o <= r; o++) {
      for (let e = i; e <= a; e++) {
        let r = o + "," + e;
        let i = t.get(r);

        if (!i) {
          (i = []), t.set(r, i);
        }

        i.push(n);
      }
    }
  }
  let n = 0;
  return {
    near(e, r, i, a) {
      n++;

      if (a) {
        a.length = 0;
      } else {
        a = [];
      }

      let o = Math.floor((e - i) / hT);
      let s = Math.floor((e + i) / hT);
      let c = Math.floor((r - i) / hT);
      let l = Math.floor((r + i) / hT);
      for (let e = o; e <= s; e++) {
        for (let r = c; r <= l; r++) {
          let i = t.get(e + "," + r);
          if (i) {
            for (let e of i) {
              if (e._bp !== n) {
                (e._bp = n), a.push(e);
              }
            }
          }
        }
      }
      return a;
    },
  };
}

var _T = (e, t, n) => {
  return Math.max(t, Math.min(n, e));
};

var vT = (e, t) => {
  return Math.hypot(e.x - t.x, e.z - t.z);
};

var yT = 1;
var bT = 2.25;
var xT = 1.05;
var ST = 2.3;
var CT = ["#8a97a8", "#b0563a", "#3f6f8f", "#7a6f9a", "#5a7a5e"];
var wT = 4.6;
var TT = 4.9;
function ET(e, t, n, r = false) {
  let i = {
    ...am,
    x: 0,
    z: 70,
    vx: 0,
    vz: 0,
    heading: 0,
    elapsed: 0,
    driftTime: 0,
    collisionTimer: 0,
    shake: 0,
    ended: false,
    reason: "",
    throttle: 0,
    brake: 0,
    yaw: 0,
    steer: 0,
    u: 0,
    w: 0,
    slipAngle: 0,
    ax: 0,
    engine: t,
    car: e,
    onFoot: false,
    store: -1,
    shop: -1,
    arrestTimer: 0,
    _fPrev: false,
    nextVid: 1,
    noPolice: !!r,
    playerVeh: {
      kind: "player",
      color: e.color,
      shape: e.shape,
      spec: `player|${e.color}|${e.shape}`,
    },
    vehicles: [],
    police: r
      ? []
      : [
          {
            x: -60,
            z: 20,
            heading: 0,
            speed: 0,
            mode: 0,
            onFoot: false,
            carId: null,
          },
          {
            x: 60,
            z: 20,
            heading: 0,
            speed: 0,
            mode: 1,
            onFoot: false,
            carId: null,
          },
          {
            x: 0,
            z: -30,
            heading: 0,
            speed: 0,
            mode: 2,
            onFoot: false,
            carId: null,
          },
          {
            x: -60,
            z: -30,
            heading: 0,
            speed: 0,
            mode: 3,
            onFoot: false,
            carId: null,
          },
        ],
  };
  for (let e of nm) {
    for (let [t, n, r] of [
      [-9, -6, 0],
      [9, -6, 0],
      [-9, 7.5, Math.PI / 2],
    ]) {
      let a = i.nextVid++;
      i.vehicles.push({
        id: a,
        x: e.x + t,
        z: e.z + n,
        heading: r,
        kind: "civilian",
        color: CT[a % CT.length],
        shape: "coupe",
      });
    }
  }
  let a = gT(n);

  let o = n.filter((e) => {
    return e.w >= 3;
  });

  let s = [];
  function c(e) {
    if (vT(e, i) > 75) {
      return false;
    }
    for (let t of o) {
      for (let n = 1; n < 9; n++) {
        let r = n / 9;
        let a = e.x + (i.x - e.x) * r;
        let o = e.z + (i.z - e.z) * r;
        if (Math.abs(a - t.x) < t.w && Math.abs(o - t.z) < t.d) {
          return false;
        }
      }
    }
    return true;
  }
  function l(e) {
    return (
      i.collisionTimer <= 0 &&
      ((i.health = _T(i.health - e, 0, 100)),
      (i.collisionTimer = 0.5),
      (i.shake = Math.min(i.shake + e * 0.08, 1.2)),
      i.police.some((e) => {
        return vT(e, i) < 85;
      }) && (i.wanted = _T(i.wanted + 0.6, 0, 5)),
      true)
    );
  }
  function u() {
    if (i.onFoot) {
      let e = null;
      let t = 3.6;
      for (let n of i.vehicles) {
        let r = vT(n, i);

        if (r < t) {
          (t = r), (e = n);
        }
      }
      if (!e) {
        return;
      }

      i.vehicles = i.vehicles.filter((t) => {
        return t.id !== e.id;
      });

      if (e.kind === "police") {
        let t = i.police.find((t) => {
          return t.carId === e.id;
        });

        if (t) {
          (t.onFoot = true), (t.carId = null);
        }

        i.wanted = _T(i.wanted + 1, 0, 5);
      }

      i.onFoot = false;
      i.x = e.x;
      i.z = e.z;
      i.heading = e.heading;
      i.vx = 0;
      i.vz = 0;
      i.u = 0;
      i.w = 0;
      i.yaw = 0;

      i.playerVeh = {
        kind: e.kind,
        color: e.color,
        shape: e.shape,
        spec: `${e.kind}|${e.color}|${e.shape}`,
      };
    } else {
      if (Math.hypot(i.vx, i.vz) > 3) {
        return;
      }
      let e = i.nextVid++;

      i.vehicles.push({
        id: e,
        x: i.x,
        z: i.z,
        heading: i.heading,
        kind: i.playerVeh.kind,
        color: i.playerVeh.color,
        shape: i.playerVeh.shape,
      });

      i.onFoot = true;
      i.x += -Math.cos(i.heading) * 2.2;
      i.z += Math.sin(i.heading) * 2.2;
      i.vx = 0;
      i.vz = 0;
      i.u = 0;
      i.w = 0;
      i.yaw = 0;
      let t = 0;

      let n = [...i.police].sort((e, t) => {
        return vT(e, i) - vT(t, i);
      });

      for (let e of n) {
        if (t >= 2) {
          break;
        }
        if (!e.onFoot && i.wanted > 0.15 && vT(e, i) < 30) {
          let n = i.nextVid++;

          i.vehicles.push({
            id: n,
            x: e.x,
            z: e.z,
            heading: e.heading,
            kind: "police",
            color: "#ffffff",
            shape: "coupe",
          });

          e.carId = n;
          e.onFoot = true;
          t++;
        }
      }
    }
  }
  let d = cT(e, t);
  let carCollisionProfile = dfcGetCollisionProfile(e.shape);
  return {
    state: i,
    setCar(e) {
      i.car = e;
      d = cT(e, t);
      carCollisionProfile = dfcGetCollisionProfile(e.shape);

      if (i.playerVeh.kind === "player") {
        i.playerVeh = {
          kind: "player",
          color: e.color,
          shape: e.shape,
          spec: `player|${e.color}|${e.shape}`,
        };
      }
    },
    update(e, n, cameraHeading = i.heading) {
      if (i.ended) {
        return i;
      }
      i.elapsed += e;
      i.collisionTimer -= e;
      i.shake *= Math.exp(-e * 5);
      let r = n.ArrowUp || n.KeyW || n.KeyZ ? 1 : 0;
      let o = n.ArrowDown || n.KeyS ? 1 : 0;

      let f =
        (n.ArrowLeft || n.KeyA || n.KeyQ ? 1 : 0) -
        (n.ArrowRight || n.KeyD ? 1 : 0);

      let p = !!n.Space;
      let m = !!n.KeyF && !i._fPrev;
      i._fPrev = !!n.KeyF;

      if (m) {
        u();
      }

      if (i.onFoot) {
        i.throttle = 0;
        i.brake = 0;
        i.pedal = 0;

        let t =
          (n.ArrowRight || n.KeyD ? 1 : 0) -
          (n.ArrowLeft || n.KeyA || n.KeyQ ? 1 : 0);

        let r =
          (n.ArrowDown || n.KeyS ? 1 : 0) -
          (n.ArrowUp || n.KeyW || n.KeyZ ? 1 : 0);

        let o = Math.hypot(t, r) || 1;

        ((sh, ch, sp) => {
          let dx = (ch * t + sh * r) / o;
          let dz = (ch * r - sh * t) / o;
          i.x += dx * sp * e;
          i.z += dz * sp * e;
          i.footSpeed = t || r ? sp : 0;
          if (i.footYaw === undefined) {
            i.footYaw = i.heading;
          }
          if (t || r) {
            let ty = Math.atan2(-dx, -dz);
            let df = ((ty - i.footYaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            i.footYaw = Math.atan2(
              Math.sin(i.footYaw + df * (1 - Math.exp(-14 * e))),
              Math.cos(i.footYaw + df * (1 - Math.exp(-14 * e)))
            );
          }
        })(Math.sin(cameraHeading), Math.cos(cameraHeading), wT);

        i.x = _T(i.x, -200, 250);
        i.z = _T(i.z, -700, 150);
        for (let e of a.near(i.x, i.z, 3, s)) {
          if (
            Math.abs(i.x - e.x) < e.w + 0.5 &&
            Math.abs(i.z - e.z) < e.d + 0.5
          ) {
            let t = i.x - e.x;
            let n = i.z - e.z;

            if (e.w + 0.5 - Math.abs(t) < e.d + 0.5 - Math.abs(n)) {
              i.x = e.x + Math.sign(t || 1) * (e.w + 0.5);
            } else {
              i.z = e.z + Math.sign(n || 1) * (e.d + 0.5);
            }
          }
        }
        i.vx = 0;
        i.vz = 0;
        i.u = 0;
        i.w = 0;
        i.yaw = 0;
        i.rpm = 900;
      } else {
        i.throttle = r;
        i.brake = o;
        let n = -Math.sin(i.heading);
        let a = -Math.cos(i.heading);
        fT(i, t, e, i.vx * n + i.vz * a, r, o, p);

        d.step(i, e, {
          throttle: r,
          brake: o,
          handbrake: p,
          steer: f,
          fuel: +(i.fuel > 0),
        });
      }

      let h = -Math.sin(i.heading);
      let g = -Math.cos(i.heading);
      let _ = Math.hypot(i.vx, i.vz);
      if (!i.onFoot) {
        i.x += i.vx * e;
        i.z += i.vz * e;

        if (carCollisionProfile.shape !== i.playerVeh.shape) {
          carCollisionProfile = dfcGetCollisionProfile(i.playerVeh.shape);
        }

        const footprint = dfcCreateCarFootprint(
          i.x,
          i.z,
          i.heading,
          carCollisionProfile
        );
        for (let obstacle of a.near(i.x, i.z, 4, s)) {
          const collision = dfcFootprintBoxCollision(footprint, obstacle);
          if (!collision) {
            continue;
          }
          i.x -= collision.nx * (collision.depth + 0.02);
          i.z -= collision.nz * (collision.depth + 0.02);
          const impactSpeed = Math.max(
            0,
            i.vx * collision.nx + i.vz * collision.nz
          );
          if (impactSpeed > 0.6) {
            i.vx -= collision.nx * impactSpeed * 1.3;
            i.vz -= collision.nz * impactSpeed * 1.3;

            if (l(4 + impactSpeed * 0.8)) {
              i._crash = {
                x: i.x,
                y: i.y || 0,
                z: i.z,
                intensity: Math.min(impactSpeed * 0.08, 1.5),
              };
            }
          }
          break;
        }

        if (i.x < -200 || i.x > 250 || i.z > 150 || i.z < -700) {
          (i.x = _T(i.x, -200, 250)),
            (i.z = _T(i.z, -700, 150)),
            (i.vx *= -0.3),
            (i.vz *= -0.3),
            l(_ * 0.7) &&
              (i._crash = {
                x: i.x,
                y: i.y || 0,
                z: i.z,
                intensity: Math.min(_ * 0.06, 1),
              });
        }
      }
      let v = i.slipAngle;
      i.drifting = _ > 6 && v > 0.13 && i.u > 0;

      if (i.drifting) {
        (i.driftTime += e),
          (i.combo = _T(
            1 + Math.floor(i.driftTime / 2) + Math.floor(v * 1.8),
            1,
            8
          )),
          (i.score += e * _ * v * i.combo * 15),
          i.police.some((e) => {
            return vT(e, i) < 85;
          }) && (i.wanted = _T(i.wanted + e * 0.27, 0, 5));
      } else {
        (i.driftTime = 0), (i.combo = 1);
      }

      if (!i.onFoot) {
        i.fuel = _T(
          i.fuel -
            e *
              t.consumption *
              (0.12 + _ / 16 + i.throttle * 1.5 + (i.drifting ? 2 : 0)),
          0,
          100
        );
      }

      i.station = nm.findIndex((e) => {
        return vT(e, i) < 8 && _ < 2.5;
      });

      i.store = i.onFoot
        ? nm.findIndex((station) => {
            return (
              Math.abs(i.x - station.x) < 5.25 &&
              i.z > station.z + 7.05 &&
              i.z < station.z + 15.3
            );
          })
        : -1;

      i.shop = i.onFoot
        ? nm.findIndex((station) => {
            return (
              Math.abs(i.x - station.x) < 2.35 &&
              i.z > station.z + 5.15 &&
              i.z < station.z + 7.25
            );
          })
        : -1;

      if (!i.onFoot && i.station >= 0) {
        i.fuel = _T(i.fuel + e * 14, 0, 100);
      }

      let y = pT(i.x, i.z, i.heading, yT, bT);
      let b = false;
      let x = false;
      let S = false;

      let C = (e, t) => {
        for (let n of a.near(e, t, 30, s)) {
          if (Math.abs(e - n.x) < n.w + 1.2 && Math.abs(t - n.z) < n.d + 1.2) {
            return true;
          }
        }
        return false;
      };

      i.police.forEach((n, r) => {
        if (n.onFoot) {
          let t = null;
          let r = null;
          if (i.onFoot || n.carId == null) {
            t = i.x;
            r = i.z;
          } else {
            let e = i.vehicles.find((e) => {
              return e.id === n.carId;
            });

            if (e) {
              (t = e.x), (r = e.z);
            }
          }
          if (t != null) {
            let a = t - n.x;
            let o = r - n.z;
            let s = Math.hypot(a, o);
            n.heading = Math.atan2(-a, -o);

            if (s > 0.4) {
              (n.x += (a / (s || 1)) * Math.min(s, TT * e)),
                (n.z += (o / (s || 1)) * Math.min(s, TT * e));
            }

            if (!i.onFoot && n.carId != null) {
              let e = i.vehicles.find((e) => {
                return e.id === n.carId;
              });

              if (e && Math.hypot(e.x - n.x, e.z - n.z) < 2.5) {
                (i.vehicles = i.vehicles.filter((e) => {
                  return e.id !== n.carId;
                })),
                  (n.onFoot = false),
                  (n.x = e.x),
                  (n.z = e.z),
                  (n.heading = e.heading),
                  (n.carId = null);
              }
            }

            if (i.onFoot && vT(n, i) < 1.8) {
              (i.arrestTimer = Math.min(i.arrestTimer + e * 2.5, 5)),
                (S = true);
            }
          }

          if (i.wanted > 0.15 && c(n)) {
            x = true;
          }

          return;
        }
        let o = i.wanted > 0.15;
        n.contactCooldown = Math.max(0, (n.contactCooldown || 0) - e);
        n.speed = n.speed || 0;
        let u = vT(n, i);
        let d;
        let f;
        if (o) {
          let e =
            n.mode === 3
              ? u > 30
                ? 2.5
                : 1
              : n.mode === 2 && i.wanted >= 3
              ? 3
              : n.mode === 1
              ? 1.2
              : 0;
          d = i.x + i.vx * e;
          f = i.z + i.vz * e;

          if (n.mode === 3 && u > 30) {
            (d += h * 10), (f += g * 10);
          }
        } else {
          d = [-50, 50, -30, 30][r];
          f = Math.sin(i.elapsed * 0.1 + r) * 40;
        }
        let p = o ? Math.min(t.max * 0.8, 12.5 + i.wanted * 3.7) : 5;

        if (i.onFoot && u < 12) {
          p = Math.min(p, Math.max(0, (u - 7) * 1.5));
        } else if (u < 6) {
          p = Math.min(p, Math.max(0, (u - 1.5) * 1.8));
        }

        let m = Math.atan2(-(d - n.x), -(f - n.z));
        let _ = 5 + n.speed * 0.45;

        let v = (e, t) => {
          for (let r = 2; r <= t; r += 2) {
            if (C(n.x - Math.sin(e) * r, n.z - Math.cos(e) * r)) {
              return r;
            }
          }
          return t;
        };

        let w = v(n.heading, _);
        let T = w < _;
        if (T) {
          let e = [-0.5, 0.5, -0.9, 0.9, -1.4, 1.4];
          let t = n.heading;
          let r = 0;
          for (let i of e) {
            let e = v(n.heading + i, _);

            if (e > r) {
              (r = e), (t = n.heading + i);
            }
          }
          m = t;
          p = Math.min(p, Math.max(1, w * 0.7));
        }
        for (let e of i.police) {
          if (e === n || e.onFoot) {
            continue;
          }
          let t = e.x - n.x;
          let r = e.z - n.z;
          let i = Math.hypot(t, r);

          if (
            i < 8 &&
            t * -Math.sin(n.heading) + r * -Math.cos(n.heading) > i * 0.7
          ) {
            p = Math.min(p, Math.max(0, i - 3) * 0.9);
          }
        }
        let E = Math.atan2(Math.sin(m - n.heading), Math.cos(m - n.heading));
        p *= 1 - Math.min(0.55, Math.abs(E) * 0.5);
        let D = Math.min(3.4, 72 / Math.max(n.speed, 9));
        n.heading += _T(E, -D * e, D * e);
        n.speed += _T(p - n.speed, -28 * e, (T ? 6 : 12) * e);
        n.x += -Math.sin(n.heading) * n.speed * e;
        n.z += -Math.cos(n.heading) * n.speed * e;
        for (let e of a.near(n.x, n.z, 4, s)) {
          if (Math.abs(n.x - e.x) < e.w + 1 && Math.abs(n.z - e.z) < e.d + 2) {
            let t = n.x - e.x;
            let r = n.z - e.z;

            if (e.w + 1 - Math.abs(t) < e.d + 2 - Math.abs(r)) {
              (n.x = e.x + Math.sign(t || 1) * (e.w + 1)), (n.speed *= 0.5);
            } else {
              (n.z = e.z + Math.sign(r || 1) * (e.d + 2)), (n.speed *= 0.5);
            }

            break;
          }
        }

        if (o && c(n)) {
          x = true;
        }

        let O = mT(y, pT(n.x, n.z, n.heading, xT, ST));
        if (
          o &&
          !i.onFoot &&
          O.overlap &&
          ((n.x += O.nx * (O.depth + 0.03)),
          (n.z += O.nz * (O.depth + 0.03)),
          n.contactCooldown <= 0)
        ) {
          b = true;
          let e = Math.hypot(
            i.vx + Math.sin(n.heading) * n.speed,
            i.vz + Math.cos(n.heading) * n.speed
          );

          if (l(Math.min(12, 1.5 + e * 0.35))) {
            i._crash = {
              x: i.x,
              y: i.y || 0,
              z: i.z,
              intensity: Math.min(e * 0.06, 1.2),
            };
          }

          n.contactCooldown = 2;
          n.speed *= 0.3;
          let t = Math.min(7, 2 + e * 0.4);
          i.vx -= O.nx * t;
          i.vz -= O.nz * t;
        }
      });
      for (let e = 0; e < i.police.length; e++) {
        for (let t = e + 1; t < i.police.length; t++) {
          let n = i.police[e];
          let r = i.police[t];
          if (n.onFoot || r.onFoot) {
            continue;
          }
          let a = mT(
            pT(n.x, n.z, n.heading, xT, ST),
            pT(r.x, r.z, r.heading, xT, ST)
          );
          if (a.overlap) {
            let e = (a.depth + 0.02) / 2;
            n.x += a.nx * e;
            n.z += a.nz * e;
            r.x -= a.nx * e;
            r.z -= a.nz * e;
            n.speed *= 0.7;
            r.speed *= 0.7;
          }
        }
      }

      if (i.wanted > 0.15 && !x) {
        (i.escape += e), i.escape >= 5 && ((i.wanted = 0), (i.escape = 0));
      } else {
        i.escape = 0;
      }

      let w = 0;
      if (i.wanted > 0.15) {
        for (let e of i.police) {
          if (!e.onFoot && vT(e, i) < 8) {
            w++;
          }
        }
      }

      if ((b || w >= 3) && _ < 5) {
        i.arrestTimer = Math.min(i.arrestTimer + e, 5);
      } else if (!S) {
        i.arrestTimer = Math.max(0, i.arrestTimer - e * 2);
      }

      i.arrest = (i.arrestTimer / 5) * 100;
      i.speed = Math.round(_ * 3.6);

      i.zone =
        i.z < -160
          ? "Montagne Kuro"
          : i.x > 130
          ? "Autoroute A9"
          : "Centre-ville";

      i.y = Uw(i.x, i.z);

      if (i.health <= 0 || i.arrest >= 100) {
        (i.ended = true),
          (i.reason = i.health <= 0 ? "Véhicule détruit" : "Vous êtes arrêté");
      }

      return i;
    },
  };
}
var DT = "/assets/rally-CluzLmHH.wav";
var OT = "/assets/rally-idle-DrsA-2QN.flac";
var kT = "/assets/sport-v8-crmbDbLb.flac";
var AT = "/assets/race-engine-CId9iOvn.flac";
function jT(e, t, n, r = false) {
  let i = t.sampleRate;
  let a = new Float32Array(t.length);
  for (let e = 0; e < t.numberOfChannels; e++) {
    let n = t.getChannelData(e);
    for (let e = 0; e < a.length; e++) {
      a[e] += n[e] / t.numberOfChannels;
    }
  }
  let o = Math.floor(n[0] * i);
  let s = Math.min(a.length, Math.floor(n[1] * i));
  let c = Math.min(Math.floor(i * 1.2), s - o);
  let l = Math.floor(i * 0.18);
  let u = o;
  let d = -Infinity;
  for (let e = o; e + c <= s; e += l) {
    let t = Array.from(
      {
        length: 6,
      },
      (t, n) => {
        let r = 0;
        let i = 0;
        for (
          let t = e + Math.floor((c * n) / 6);
          t < e + (c * (n + 1)) / 6;
          t += 8
        ) {
          r += a[t] ** 2;
          i++;
        }
        return Math.sqrt(r / Math.max(1, i));
      }
    );

    let n =
      t.reduce((e, t) => {
        return e + t;
      }, 0) / 6;

    if (n < 0.003) {
      continue;
    }

    let i =
      t.reduce((e, t) => {
        return e + (t - n) ** 2;
      }, 0) /
      6 /
      n ** 2;

    let o = (r ? n : Math.sqrt(n)) / (1 + i * 12);

    if (o > d) {
      (d = o), (u = e);
    }
  }
  let f = Math.min(Math.floor(i * 0.06), Math.floor(c / 5));
  let p = c - f;
  let m = e.createBuffer(1, p, i);
  let h = m.getChannelData(0);
  let g = 0;
  let _ = 0;
  for (let e = 0; e < p; e++) {
    let t = e < f ? Math.sin(((e / f) * Math.PI) / 2) ** 2 : 1;
    h[e] = a[u + e] * t + (e < f ? a[u + p + e] * (1 - t) : 0);
    g += h[e] ** 2;
    _ = Math.max(_, Math.abs(h[e]));
  }
  let v = Math.min(
    0.38 / Math.max(0.001, Math.sqrt(g / p)),
    1.3 / Math.max(0.001, _)
  );
  for (let e = 0; e < p; e++) {
    h[e] *= v;
  }
  return m;
}

var MT = {
  V6: [
    [OT, [0.2, 4.8]],
    [OT, [2, 4.5]],
    [kT, [6, 10]],
    [kT, [8, 12]],
    [kT, [10, 14]],
  ],
  V8: [
    [kT, [0.5, 4]],
    [kT, [3, 7]],
    [kT, [6, 10]],
    [kT, [8, 12]],
    [kT, [10, 14]],
  ],
  V12: [
    [DT, [0, 5]],
    [AT, [3, 12]],
    [AT, [10, 23]],
    [AT, [18, 30]],
    [AT, [23, 38]],
  ],
  W16: [
    [OT, [0.2, 4.8]],
    [kT, [4, 8]],
    [kT, [8, 12]],
    [AT, [18, 30]],
    [AT, [23, 38]],
  ],
};

var NT = new Map();
async function PT(e, t) {
  if (NT.has(t)) {
    return NT.get(t);
  }
  let n = MT[t] || MT.V6;

  let r = new Map(
    await Promise.all(
      [
        ...new Set(
          n.map(([e]) => {
            return e;
          })
        ),
      ].map(async (t) => {
        let n = await fetch(t);
        if (!n.ok) {
          throw Error("Impossible de charger le son moteur.");
        }
        return [t, await e.decodeAudioData(await n.arrayBuffer())];
      })
    )
  );

  let i = n.map(([t, n], i) => {
    return jT(e, r.get(t), n, i >= 3);
  });

  NT.set(t, i);
  return i;
}

var FT = {
  V6: {
    pitch: [1, 1, 1.08, 1.14, 1.18],
    bass: 2,
    brightness: 2,
    cutoff: 3100,
  },
  V8: {
    pitch: [0.92, 0.94, 0.82, 0.84, 0.87],
    bass: 10,
    brightness: -6,
    cutoff: 1400,
  },
  V12: {
    pitch: [1, 1, 1.4, 1.55, 1.65],
    bass: 0,
    brightness: 5,
    cutoff: 5400,
  },
  W16: {
    pitch: [1, 1, 0.72, 0.76, 0.8],
    bass: 7,
    brightness: 0,
    cutoff: 2600,
  },
};

var IT = [950, 1700, 2800, 4400, 6200];
function LT(e, t, n, r) {
  let i = FT[r] || FT.V6;
  let a = e.createBiquadFilter();
  a.type = "lowshelf";
  a.frequency.value = 140;
  a.gain.value = i.bass;
  let o = e.createBiquadFilter();
  o.type = "highshelf";
  o.frequency.value = 2200;
  o.gain.value = i.brightness;
  let s = e.createBiquadFilter();
  s.type = "lowpass";
  s.Q.value = 0.6;
  a.connect(o);
  o.connect(s);
  s.connect(t);
  let c = n.map((t, n) => {
    let r = e.createBufferSource();
    r.buffer = t;
    r.loop = true;
    let o = e.createGain();
    o.gain.value = 0;
    r.connect(o);
    o.connect(a);
    r.start(0, (n * 0.071) % t.duration);

    return {
      source: r,
      gain: o,
      baseRpm: IT[n] || 4000 /* 4e3 */,
      pitch: i.pitch[n] || 1,
    };
  });
  return {
    update(t, n, r = {}) {
      let a = e.currentTime;
      c.length;

      let o = c.map((e, n) => {
        let r = IT[n] || 4000; /* 4e3 */
        let i = Math.abs(t - r);
        return Math.max(0, 1 - i / (n === 0 ? 1200 : 1100));
      });

      let l =
        o.reduce((e, t) => {
          return e + t;
        }, 0) || 1;

      let u = 0.6 + n * 0.4 + (r.shifting && r.shiftDirection < 0 ? 0.2 : 0);
      let d = r.shifting ? 0.4 : 1;

      let f =
        t > (r.redline || 8000) /* 8e3 */ * 0.985
          ? 0.65 + 0.35 * Math.max(0, Math.sin(a * 90))
          : 1;

      c.forEach((e, n) => {
        e.source.playbackRate.setTargetAtTime(
          Math.max(0.75, Math.min(1.5, (t / e.baseRpm) * e.pitch)),
          a,
          0.04
        );

        e.gain.gain.setTargetAtTime(
          (o[n] / l) * u * d * f * (r.fuel === 0 ? 0 : 1),
          a,
          0.035
        );
      });

      s.frequency.setTargetAtTime(
        1000 /* 1e3 */ + i.cutoff * (0.25 + n * 0.75) + t * 0.22,
        a,
        0.045
      );
    },
    startEngine() {
      const profiles = {
        V8: {
          starter: 48,
          catch: 58,
          cutoff: 780,
          level: 0.09,
          shape: "sawtooth",
        },
        V6: {
          starter: 55,
          catch: 43,
          cutoff: 1500,
          level: 0.075,
          shape: "triangle",
        },
        V12: {
          starter: 62,
          catch: 86,
          cutoff: 2600,
          level: 0.065,
          shape: "sine",
        },
        W16: {
          starter: 58,
          catch: 72,
          cutoff: 2100,
          level: 0.08,
          shape: "sawtooth",
        },
      };
      const profile = profiles[r] || profiles.V6;
      const now = e.currentTime;
      const crank = e.createOscillator();
      const crankFilter = e.createBiquadFilter();
      const crankGain = e.createGain();
      crank.type = profile.shape;
      crank.frequency.setValueAtTime(profile.starter, now);
      crank.frequency.linearRampToValueAtTime(
        profile.starter * 1.22,
        now + 0.52
      );
      crankFilter.type = "lowpass";
      crankFilter.frequency.value = profile.cutoff;
      crankGain.gain.setValueAtTime(0.001, now);
      crankGain.gain.linearRampToValueAtTime(profile.level * 0.72, now + 0.04);
      crankGain.gain.setValueAtTime(profile.level * 0.64, now + 0.48);
      crankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      crank.connect(crankFilter);
      crankFilter.connect(crankGain);
      crankGain.connect(t);
      crank.onended = () => {
        crank.disconnect();
        crankFilter.disconnect();
        crankGain.disconnect();
      };
      crank.start(now);
      crank.stop(now + 0.72);
      const catchEngine = e.createOscillator();
      const catchFilter = e.createBiquadFilter();
      const catchGain = e.createGain();
      catchEngine.type = profile.shape;
      catchEngine.frequency.setValueAtTime(profile.catch * 0.72, now + 0.48);
      catchEngine.frequency.linearRampToValueAtTime(
        profile.catch * 1.55,
        now + 0.72
      );
      catchEngine.frequency.exponentialRampToValueAtTime(
        profile.catch,
        now + 1.08
      );
      catchFilter.type = "lowpass";
      catchFilter.frequency.setValueAtTime(profile.cutoff * 0.72, now + 0.48);
      catchFilter.frequency.linearRampToValueAtTime(
        profile.cutoff * 1.8,
        now + 0.78
      );
      catchFilter.frequency.exponentialRampToValueAtTime(
        profile.cutoff,
        now + 1.08
      );
      catchGain.gain.setValueAtTime(0.001, now + 0.48);
      catchGain.gain.linearRampToValueAtTime(profile.level * 1.25, now + 0.66);
      catchGain.gain.setValueAtTime(profile.level * 0.8, now + 0.82);
      catchGain.gain.exponentialRampToValueAtTime(0.001, now + 1.16);
      catchEngine.connect(catchFilter);
      catchFilter.connect(catchGain);
      catchGain.connect(t);
      catchEngine.onended = () => {
        catchEngine.disconnect();
        catchFilter.disconnect();
        catchGain.disconnect();
      };
      catchEngine.start(now + 0.48);
      catchEngine.stop(now + 1.18);
    },
    close() {
      c.forEach(({ source: e }) => {
        return e.stop();
      });

      a.disconnect();
      o.disconnect();
      s.disconnect();
    },
  };
}
var RT =
  "/* global AudioWorkletProcessor, registerProcessor, sampleRate */\n// Moteur audio tournant sur le thread audio (AudioWorklet).\n//\n// Le principe : chaque allumage de cylindre injecte une impulsion de pression à l'angle de vilebrequin exact,\n// donc la note est verrouillée sur le régime, échantillon par échantillon. Les impulsions de chaque banc\n// d'échappement traversent les résonances de SON tuyau : la série de modes du tuyau (une longueur différente\n// par banc, d'où le battement entre les deux lignes), décalée vers le haut à mesure que les gaz chauds font\n// monter la vitesse du son — la température des gaz suit la charge.\n//\n// Autour de ce cœur : le grondement de combustion, la respiration de l'admission, le bruit mécanique, les\n// pétarades de décélération, puis le turbocompresseur (montée en pression, sifflement, décharge au lever de\n// pied avec son flutter). L'échappement est saturé puis filtré en fonction de la charge, l'air passe à côté,\n// et une table de loudness mesurée sur toute la plage de régime garantit un volume constant à chaque régime.\n\nconst TAU = Math.PI * 2;\nconst clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);\nconst smooth = (lo, hi, v) => { const x = clamp((v - lo) / (hi - lo), 0, 1); return x * x * (3 - 2 * x); };\n// y += (target - y) * pole(sr, s)  ->  constante de temps s\nconst pole = (sr, seconds) => 1 - Math.exp(-1 / (sr * seconds));\n// y = y * decay(sr, s) + x * (1 - decay)  ->  même chose, écrit pour un filtre\nconst decay = (sr, seconds) => Math.exp(-1 / (sr * seconds));\nconst lowpass = (sr, hz) => 1 - Math.exp(-TAU * hz / sr);\n\nconst PROFILES = {\n  // V8 à vilebrequin croisé (ordre d'allumage alterné entre les deux bancs) : c'est ce croisement qui\n  // donne le grondement irrégulier. Tuyaux longs, gros volume : tout est calé bas pour un son profond,\n  // et le niveau est poussé pour qu'il domine le mix.\n  // V8 « gros cube agressif » : grondement grave, quasiment plus d'aigus, saturation poussée\n  // et pétarades explosives à la levée de pied. Sifflement de turbo retiré, tuyaux longs et\n  // volumineux, plafond de brillance abaissé pour un son plus sombre et plus lourd.\n  V8: {\n    cyl: 8, banks: [0, 1, 1, 0, 1, 0, 0, 1], gains: [1, .9, 1.06, .94, 1.04, .92, 1.05, .93], bankGain: .8,\n    idle: 680, redline: 6000,\n    pipe: [[26, 1.5, .96], [41, 1.7, 1], [63, 1.9, 1], [94, 2.2, .97], [137, 2.5, .93], [194, 2.9, .88], [270, 3.3, .79], [369, 3.7, .68], [495, 4.1, .46], [657, 4.6, .3], [882, 5, .14], [1305, 4.4, .05], [1980, 3.2, .02]],\n    bankShift: [1, 1.06], tempShift: [1, 1.13],\n    pulse: .78, jitter: .22, crack: .8, roar: 1, mech: .035, intake: .17, air: .92,\n    drive: 1.98, level: 1.42, bright: [300, 740],\n    turbo: { blades: 30, spoolUp: .14, spoolDown: .42, whistle: 0, hiss: .025, threshold: 1200, bov: 1.2 },\n    overrun: { rate: 52, amp: 1.5 }\n  },\n  // Six cylindres en ligne biturbo dans l'esprit d'une BMW M : plus lisse, plus clair, métallique, une\n  // admission plus mordante et une décélération plus discrète.\n  V6: {\n    cyl: 6, banks: [0, 1, 0, 1, 0, 1], gains: [1, .97, 1.03, .98, 1.02, .99], bankGain: .9,\n    idle: 800, redline: 7200,\n    pipe: [[54, 1.6, .55], [86, 1.8, .75], [126, 2, .88], [178, 2.3, .95], [244, 2.6, .96], [328, 3, .92], [432, 3.4, .84], [560, 3.8, .74], [720, 4.2, .64], [940, 4.6, .52], [1240, 5, .4], [1650, 5.1, .28], [2250, 4.6, .18], [3100, 3.8, .08]],\n    bankShift: [1, 1.03], tempShift: [1, 1.12],\n    pulse: .4, jitter: .12, crack: .38, roar: .44, mech: .1, intake: .3, air: 1,\n    drive: 1.14, level: 1, bright: [980, 3100],\n    turbo: { blades: 34, spoolUp: .14, spoolDown: .4, whistle: .055, hiss: .045, threshold: 1400, bov: .8 },\n    overrun: { rate: 20, amp: .7 }\n  },\n  V12: {\n    cyl: 12, banks: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], gains: [1, .98, 1.02, .99, 1.01, .98, 1.02, .99, 1, .98, 1.01, .99], bankGain: .95,\n    idle: 1000, redline: 9000,\n    pipe: [[96, 1.8, .6], [150, 2.2, .8], [224, 2.8, .95], [330, 3.4, .9], [470, 3.8, .85], [660, 4.2, .75], [900, 4.6, .62], [1220, 4.8, .5], [1650, 5, .38], [2200, 5, .28], [3000, 4.6, .18], [4200, 3.8, .1], [6000, 3, .05]],\n    bankShift: [1, 1.02], tempShift: [1, 1.08],\n    pulse: .3, jitter: .06, crack: .3, roar: .37, mech: .12, intake: .22, air: 1,\n    drive: 1.12, level: 1, bright: [1350, 4300],\n    turbo: { blades: 30, spoolUp: .3, spoolDown: .5, whistle: 0, hiss: 0, threshold: 2500, bov: 0 },\n    overrun: { rate: 7, amp: .3 }\n  },\n  W16: {\n    cyl: 16, banks: [0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1], gains: [1, .92, 1.05, .96, 1.07, .9, 1.02, .95, 1, .93, 1.04, .97, 1.06, .91, 1.01, .96], bankGain: .85,\n    idle: 900, redline: 6800,\n    pipe: [[38, 1.5, .85], [60, 1.7, 1], [92, 1.9, 1], [136, 2.2, .95], [198, 2.5, .9], [282, 2.9, .82], [392, 3.3, .72], [540, 3.7, .6], [730, 4.1, .5], [980, 4.6, .38], [1320, 5, .26], [2000, 4.6, .16], [3100, 3.6, .07]],\n    bankShift: [1, 1.045], tempShift: [1, 1.18],\n    pulse: .7, jitter: .13, crack: .55, roar: .6, mech: .08, intake: .18, air: 1,\n    drive: 1.45, level: 1, bright: [640, 2300],\n    turbo: { blades: 26, spoolUp: .2, spoolDown: .5, whistle: .07, hiss: .075, threshold: 1300, bov: 1 },\n    overrun: { rate: 38, amp: 1.1 }\n  }\n};\n\nclass EngineSynth extends AudioWorkletProcessor {\n  constructor(options) {\n    super();\n    const p = PROFILES[options?.processorOptions?.id] || PROFILES.V8;\n    this.p = p; this.sr = sampleRate;\n    // Entrées lissées : le moteur démarre au ralenti, pied levé.\n    this.tRpm = this.rpm = p.idle;\n    this.tLoad = this.load = 0;\n    this.tCut = this.cut = 1;\n    this.tRun = this.run = 1;\n    // Vilebrequin\n    this.pos = 0; this.idx = 0; this.pend0 = 0; this.pend1 = 0; this.p0 = 0; this.p1 = 0;\n    // Couches\n    this.crack = 0; this.boost = 0; this.bov = 0; this.bovF = 0; this.prevLoad = 0;\n    this.bang = 0; this.bangLow = 0;\n    this.phase = 0; this.bovPhase = 0;\n    // Tuyaux\n    const K = this.K = p.pipe.length;\n    this.b = [new Float64Array(K), new Float64Array(K)];\n    this.c1 = [new Float64Array(K), new Float64Array(K)];\n    this.c2 = [new Float64Array(K), new Float64Array(K)];\n    this.g = new Float64Array(K);\n    p.pipe.forEach((mode, k) => { this.g[k] = mode[2]; });\n    this.st = this.makeState();\n    this.kPulse = decay(this.sr, p.pulse * .001);\n    this.updatePipes();\n    this.calibrate();\n    this.n1 = this.n3 = this.k1 = this.k3 = this.h1 = this.h3 = 0;\n    this.lp1 = this.lp2 = this.air1 = this.air2 = 0;\n    this.dead = false;\n    this.port.onmessage = ({ data }) => {\n      if (!data) return;\n      if (data.stop) { this.dead = true; return; }\n      if (Number.isFinite(data.rpm)) this.tRpm = clamp(data.rpm, 0, 12000);\n      if (Number.isFinite(data.load)) this.tLoad = clamp(data.load, 0, 1);\n      if (Number.isFinite(data.cut)) this.tCut = clamp(data.cut, 0, 1);\n      if (Number.isFinite(data.run)) this.tRun = clamp(data.run, 0, 1);\n      if (Number.isFinite(data.bang)) this.bang = clamp(data.bang, 0, 2.5);\n    };\n  }\n\n  makeState() { return { y1: [new Float64Array(this.K), new Float64Array(this.K)], y2: [new Float64Array(this.K), new Float64Array(this.K)] }; }\n\n  // Les modes du tuyau glissent avec la température des gaz (plus de charge = gaz plus chauds = son plus\n  // rapide = résonances plus hautes). Recalculé une fois par bloc, les changements sont lents.\n  updatePipes() {\n    const p = this.p, sr = this.sr;\n    const heat = clamp(.1 + .9 * this.load * (.4 + .6 * clamp(this.rpm / p.redline, 0, 1)), 0, 1);\n    const heatShift = p.tempShift[0] + (p.tempShift[1] - p.tempShift[0]) * heat;\n    for (let bank = 0; bank < 2; bank++) {\n      const scale = p.bankShift[bank] * heatShift;\n      for (let k = 0; k < this.K; k++) {\n        const freq = Math.min(p.pipe[k][0] * scale, sr * .45), q = p.pipe[k][1], th = TAU * freq / sr;\n        const r = Math.exp(-Math.PI * freq / q / sr);\n        const c1 = 2 * r * Math.cos(th), c2 = -r * r;\n        this.c1[bank][k] = c1; this.c2[bank][k] = c2;\n        this.b[bank][k] = Math.hypot(1 - c1 * Math.cos(th) - c2 * Math.cos(2 * th), c1 * Math.sin(th) + c2 * Math.sin(2 * th));\n      }\n    }\n  }\n\n  // Un échantillon des deux bancs, e0/e1 = énergie injectée dans le tuyau à cet échantillon.\n  banks(st, e0, e1) {\n    let s0 = 0, s1 = 0;\n    const K = this.K, g = this.g, c1 = this.c1, c2 = this.c2;\n    for (let k = 0; k < K; k++) {\n      const a0 = this.b[0][k] * e0 + c1[0][k] * st.y1[0][k] + c2[0][k] * st.y2[0][k];\n      st.y2[0][k] = st.y1[0][k]; st.y1[0][k] = a0; s0 += g[k] * a0;\n      const a1 = this.b[1][k] * e1 + c1[1][k] * st.y1[1][k] + c2[1][k] * st.y2[1][k];\n      st.y2[1][k] = st.y1[1][k]; st.y1[1][k] = a1; s1 += g[k] * a1;\n    }\n    return s0 + s1;\n  }\n\n  // Mesure le niveau sorti par les tuyaux à plusieurs régimes, pour que chaque régime sonne aussi fort\n  // avant la saturation. (Une seule fois, au démarrage.)\n  calibrate() {\n    const p = this.p, sr = this.sr, N = p.cyl, kP = this.kPulse, pts = [];\n    for (let j = 0; j <= 11; j++) {\n      const rpm = p.idle * .7 + (p.redline * 1.15 - p.idle * .7) * j / 11, dpos = rpm * N / 120 / sr;\n      const cycle = Math.ceil(sr * 120 / rpm), warm = Math.floor(sr * .12);\n      const total = warm + Math.max(Math.floor(sr * .1), cycle * 3);\n      const st = this.makeState();\n      let pos = 0, idx = 0, pend0 = 0, pend1 = 0, sh0 = 0, sh1 = 0, sum = 0, count = 0;\n      for (let i = 0; i < total; i++) {\n        pos += dpos;\n        let e0 = pend0, e1 = pend1; pend0 = 0; pend1 = 0;\n        if (pos >= 1 && dpos > 0) {\n          pos -= 1;\n          const over = Math.min(1, pos / dpos), a = p.gains[idx] * (p.banks[idx] ? p.bankGain : 1);\n          if (p.banks[idx]) { e1 += a * over; pend1 += a * (1 - over); } else { e0 += a * over; pend0 += a * (1 - over); }\n          idx = (idx + 1) % N;\n        }\n        sh0 = sh0 * kP + e0 * (1 - kP); sh1 = sh1 * kP + e1 * (1 - kP);\n        const y = this.banks(st, sh0, sh1);\n        if (i >= warm) { sum += y * y; count++; }\n      }\n      pts.push([rpm, Math.sqrt(sum / count) || 1e-9]);\n    }\n    this.table = pts;\n  }\n\n  compAt(rpm) {\n    const t = this.table;\n    if (rpm <= t[0][0]) return 1 / t[0][1];\n    for (let j = 1; j < t.length; j++) {\n      if (rpm <= t[j][0]) { const f = (rpm - t[j - 1][0]) / (t[j][0] - t[j - 1][0]); return 1 / (t[j - 1][1] + (t[j][1] - t[j - 1][1]) * f); }\n    }\n    return 1 / t[t.length - 1][1];\n  }\n\n  reset() {\n    for (let bank = 0; bank < 2; bank++) { this.st.y1[bank].fill(0); this.st.y2[bank].fill(0); }\n    this.crack = this.bov = this.bovF = this.boost = 0; this.bang = this.bangLow = 0; this.lp1 = this.lp2 = this.air1 = this.air2 = 0;\n    this.n1 = this.n3 = this.k1 = this.k3 = this.h1 = this.h3 = 0;\n    this.pend0 = this.pend1 = this.p0 = this.p1 = 0;\n  }\n\n  process(inputs, outputs) {\n    if (this.dead) return false;\n    const out = outputs[0] && outputs[0][0];\n    if (!out) return true;\n    const p = this.p, sr = this.sr, n = out.length, N = p.cyl, turb = p.turbo, overrun = p.overrun;\n    this.updatePipes();\n    const comp = this.compAt(this.rpm);\n    const frac0 = clamp(this.rpm / p.redline, 0, 1.3);\n    const bright = clamp(.08 + .34 * frac0 + .58 * this.load, 0, 1);\n    const aLP = lowpass(sr, p.bright[0] + (p.bright[1] - p.bright[0]) * bright);\n    const aAir = lowpass(sr, 4200);\n    const envRpm = p.level * (.7 + .3 * Math.pow(frac0, .8)) * .46;\n    const cR = pole(sr, .014), cL = pole(sr, .07), cC = pole(sr, .012), cRun = pole(sr, .09);\n    const cUp = pole(sr, turb.spoolUp), cDown = pole(sr, turb.spoolDown);\n    const crackDecay = decay(sr, .004), bDecay = decay(sr, .09), bFDecay = decay(sr, .32), bangDecay = decay(sr, .085);\n    const aN1 = lowpass(sr, 2600), aN3 = lowpass(sr, 320);\n    const aK1 = lowpass(sr, 3800), aK3 = lowpass(sr, 700);\n    const aH1 = lowpass(sr, 7000), aH3 = lowpass(sr, 1100);\n    const kP = this.kPulse, spinning = turb.whistle > 0 || turb.hiss > 0;\n    const redline = p.redline, idle = p.idle;\n    for (let i = 0; i < n; i++) {\n      this.rpm += (this.tRpm - this.rpm) * cR;\n      this.load += (this.tLoad - this.load) * cL;\n      this.cut += (this.tCut - this.cut) * cC;\n      this.run += (this.tRun - this.run) * cRun;\n      const rpm = this.rpm, load = this.load, frac = clamp(rpm / redline, 0, 1.3);\n      const live = this.cut * this.run;\n      const limiter = rpm > redline * .985 ? .72 + .28 * Math.max(0, Math.sin(i * .12)) : 1;\n\n      // --- angle de vilebrequin : une impulsion par allumage\n      const dpos = rpm * N / 120 / sr;\n      this.pos += dpos;\n      let e0 = this.pend0, e1 = this.pend1;\n      this.pend0 = 0; this.pend1 = 0;\n      if (this.pos >= 1 && dpos > 0) {\n        this.pos -= 1;\n        const over = Math.min(1, this.pos / dpos), cyl = this.idx;\n        this.idx = (this.idx + 1) % N;\n        const amp = p.gains[cyl] * (p.banks[cyl] ? p.bankGain : 1) * (1 + (Math.random() * 2 - 1) * p.jitter * (1 - .5 * frac)) * (.55 + .45 * load) * live * limiter;\n        if (p.banks[cyl]) { e1 += amp * over; this.pend1 += amp * (1 - over); }\n        else { e0 += amp * over; this.pend0 += amp * (1 - over); }\n        this.crack += amp * p.crack * (.25 + .75 * load);\n      }\n      // Forme de l'impulsion : plus le tuyau est large, moins il passe d'aigus.\n      this.p0 = this.p0 * kP + e0 * (1 - kP);\n      this.p1 = this.p1 * kP + e1 * (1 - kP);\n\n      // --- décélération : l'essence imbrûlée s'allume dans l'échappement\n      let pop = 0;\n      if (rpm > 1800 && this.run > .5 && (load < .22 || this.cut < .55) && Math.random() < overrun.rate * frac / sr) {\n        pop = overrun.amp * (Math.random() < .04 ? 2.2 : 1) * (.45 + .85 * Math.random()) * (.35 + .65 * (1 - load));\n        this.crack += pop * .5;\n      }\n      const popA = pop > 0 && Math.random() < .5 ? pop : 0, popB = pop - popA;\n\n      // --- turbocompresseur\n      const want = spinning ? load * this.cut * smooth(turb.threshold, turb.threshold + 2600, rpm) : 0;\n      this.boost += (want - this.boost) * (want > this.boost ? cUp : cDown);\n      if (this.prevLoad > .45 && load < .2 && this.boost > .22) { this.bov = this.boost * turb.bov; this.bovF = this.boost; }\n      this.prevLoad = load;\n      this.bov *= bDecay; this.bovF *= bFDecay;\n      const boost = this.boost;\n      this.phase += TAU * (rpm * turb.blades / 60) / sr;\n      if (this.phase > TAU) this.phase -= TAU;\n      this.bovPhase += TAU * 32 / sr;\n      if (this.bovPhase > TAU) this.bovPhase -= TAU;\n      const flutter = 1 - .8 * this.bovF * (.5 + .5 * Math.sin(this.bovPhase));\n\n      // --- explosion à l'échappement au passage de rapport : un coup court et grave dans le collecteur,\n      // qui traverse les mêmes résonances que les impulsions d'allumage.\n      const bang = this.bang;\n      this.bang *= bangDecay;\n      this.bangLow = this.bangLow * .8 + (Math.random() * 2 - 1) * .2;\n      const bangSig = bang * (this.bangLow * 2.6 + (Math.random() * 2 - 1) * .85);\n\n      // --- bruits\n      const noise = Math.random() * 2 - 1;\n      this.n1 += aN1 * (noise - this.n1); this.n3 += aN3 * (this.n1 - this.n3);\n      this.k1 += aK1 * (noise - this.k1); this.k3 += aK3 * (this.k1 - this.k3);\n      this.h1 += aH1 * (noise - this.h1); this.h3 += aH3 * (this.h1 - this.h3);\n      const low = this.n1 - this.n3, mid = this.k1 - this.k3, high = this.h1 - this.h3;\n      this.crack *= crackDecay;\n\n      // --- échappement : tuyaux + combustion + pétarades, saturés puis filtrés selon la charge\n      let ex = this.banks(this.st, this.p0 + popA + bangSig * .55, this.p1 + popB + bangSig * .45) * comp;\n      ex += bangSig * .7;\n      ex += mid * this.crack * 1.5;\n      ex += low * p.roar * (.05 + .22 * frac) * (.3 + .7 * load) * this.run * 2.2;\n      const exhaust = Math.tanh(ex * p.drive * (.8 + .4 * load));\n      this.lp1 += aLP * (exhaust - this.lp1);\n      this.lp2 += aLP * (this.lp1 - this.lp2);\n\n      // --- air : admission, mécanique, turbo (hors saturation échappement)\n      const air = mid * p.intake * load * this.run * .9\n        + high * (p.mech * (.02 + .22 * frac * frac) * this.run * 2\n          + turb.hiss * boost * (.3 + .7 * frac) * this.run * 1.4\n          + this.bov * 1.6 * flutter)\n        + turb.whistle * boost * Math.sqrt(boost) * (.25 + .75 * frac) * this.run * (Math.sin(this.phase) + .28 * Math.sin(this.phase * 2.01));\n\n      this.air1 += aAir * (air - this.air1);\n      this.air2 += aAir * (this.air1 - this.air2);\n      out[i] = (this.lp2 + this.air2 * p.air) * envRpm * (.75 + .25 * load);\n    }\n    if (!Number.isFinite(this.lp2) || !Number.isFinite(this.st.y1[0][0]) || !Number.isFinite(this.st.y1[1][0])) {\n      this.rpm = this.tRpm >= idle ? this.tRpm : idle;\n      this.reset();\n      out.fill(0);\n    }\n    return true;\n  }\n}\n\nregisterProcessor('engine-synth', EngineSynth);";
function zT(e) {
  let t = Math.floor(e.sampleRate * 0.22);
  let n = e.createBuffer(1, t, e.sampleRate);
  let r = n.getChannelData(0);
  let i = 0;
  for (let n = 0; n < t; n++) {
    i += 0.35 * (Math.random() * 2 - 1 - i);
    r[n] = i * Math.exp(-n / (e.sampleRate * 0.055));
  }
  return n;
}
async function BT(e, t, n) {
  if (!e.audioWorklet || typeof AudioWorkletNode === "undefined") {
    throw Error("AudioWorklet indisponible");
  }
  let r = URL.createObjectURL(
    new Blob([RT], {
      type: "text/javascript",
    })
  );
  try {
    await e.audioWorklet.addModule(r);
  } finally {
    URL.revokeObjectURL(r);
  }
  let i = new AudioWorkletNode(e, "engine-synth", {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [1],
    processorOptions: {
      id: n,
    },
  });
  i.onprocessorerror = () => {
    return console.error("Moteur audio : erreur du processeur");
  };
  let a = e.createGain();
  let o = e.createGain();
  let s = e.createConvolver();
  s.buffer = zT(e);
  o.gain.value = 0.14;
  i.connect(a);
  a.connect(t);
  i.connect(s);
  s.connect(o);
  o.connect(t);

  return {
    update(e, t, n = {}) {
      i.port.postMessage({
        rpm: e,
        load: t,
        cut: n.shifting ? 0.4 : 1,
        run: n.fuel === 0 || n.onFoot ? 0 : 1,
      });
    },
    bang(e = 1) {
      i.port.postMessage({
        bang: e,
      });
    },
    close() {
      i.port.postMessage({
        stop: true,
      });

      [i, a, o, s].forEach((e) => {
        return e.disconnect();
      });
    },
  };
}
function VT(e, t, n) {
  let r = e.createBuffer(1, e.sampleRate, e.sampleRate);
  let i = r.getChannelData(0);
  let a = 0;
  for (let e = 0; e < i.length; e++) {
    a = 0.97 * a + 0.03 * (Math.random() * 2 - 1);
    i[e] = a * 4;
  }
  let o = e.createBufferSource();
  o.buffer = r;
  o.loop = true;
  let s = e.createBiquadFilter();
  s.type = "bandpass";
  s.frequency.value = 1900;
  s.Q.value = 5;
  let c = e.createGain();
  c.gain.value = 0;
  let l = e.createBiquadFilter();
  l.type = "bandpass";
  l.Q.value = n === "V8" ? 12 : 2;
  let u = e.createGain();
  u.gain.value = 0;
  o.connect(s);
  s.connect(c);
  c.connect(t);
  o.connect(l);
  l.connect(u);
  u.connect(t);
  o.start();
  let d = new Set();
  let f = 0;
  let p = 0;
  let m = false;
  function h(n, i, a, o = "lowpass", delay = 0) {
    let s = e.createBufferSource();
    s.buffer = r;
    let c = e.createBiquadFilter();
    c.type = o;
    c.frequency.value = a;
    c.Q.value = 0.8;
    let l = e.createGain();
    let u = e.currentTime + delay;
    l.gain.setValueAtTime(i, u);
    l.gain.exponentialRampToValueAtTime(0.001, u + n);
    s.connect(c);
    c.connect(l);
    l.connect(t);

    s.onended = () => {
      s.disconnect();
      c.disconnect();
      l.disconnect();
      d.delete(s);
    };

    d.add(s);
    s.start(u, Math.random() * 0.1);
    s.stop(u + n);
  }
  return {
    update(t, r, i, a = {}, o = false) {
      let s = e.currentTime;
      let d = n === "V6" || n === "W16";
      let g = d ? r * Math.max(0, Math.min(1, (t - 1700) / 3800)) : 0;
      p += (g - p) * 0.08;

      if (!o && d && !m && f > 0.6 && r < 0.2 && p > 0.14) {
        h(0.22, 0.13 * p, 2400, "highpass");
      }

      f = r;
      c.gain.setTargetAtTime(i ? 0.15 : 0, s, 0.04);

      l.frequency.setTargetAtTime(
        (n === "V8" ? 850 : 1800) + t * 0.36,
        s,
        0.07
      );

      u.gain.setTargetAtTime(
        (m ? 0 : n === "V8" ? r * 0.032 : p * 0.065) *
          (a.fuel === 0 || a.onFoot ? 0 : 1),
        s,
        0.06
      );
    },
    startEngine() {
      const profiles = {
        V8: {
          starter: 48,
          catch: 58,
          cutoff: 780,
          level: 0.09,
          shape: "sawtooth",
        },
        V6: {
          starter: 55,
          catch: 43,
          cutoff: 1500,
          level: 0.075,
          shape: "triangle",
        },
        V12: {
          starter: 62,
          catch: 86,
          cutoff: 2600,
          level: 0.065,
          shape: "sine",
        },
        W16: {
          starter: 58,
          catch: 72,
          cutoff: 2100,
          level: 0.08,
          shape: "sawtooth",
        },
      };
      const profile = profiles[n] || profiles.V6;
      const now = e.currentTime;
      const starter = e.createOscillator();
      const starterFilter = e.createBiquadFilter();
      const starterGain = e.createGain();
      starter.type = profile.shape;
      starter.frequency.setValueAtTime(profile.starter, now);
      starter.frequency.linearRampToValueAtTime(
        profile.starter * 1.22,
        now + 0.52
      );
      starterFilter.type = "lowpass";
      starterFilter.frequency.value = profile.cutoff;
      starterGain.gain.setValueAtTime(0.001, now);
      starterGain.gain.linearRampToValueAtTime(
        profile.level * 0.72,
        now + 0.04
      );
      starterGain.gain.setValueAtTime(profile.level * 0.64, now + 0.48);
      starterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      starter.connect(starterFilter);
      starterFilter.connect(starterGain);
      starterGain.connect(t);
      starter.onended = () => {
        starter.disconnect();
        starterFilter.disconnect();
        starterGain.disconnect();
      };
      starter.start(now);
      starter.stop(now + 0.72);
      const crankingNoise = e.createBufferSource();
      const crankFilter = e.createBiquadFilter();
      const crankGain = e.createGain();
      crankingNoise.buffer = r;
      crankFilter.type = "bandpass";
      crankFilter.frequency.value = profile.cutoff * 1.35;
      crankFilter.Q.value = 1.2;
      crankGain.gain.setValueAtTime(0.001, now);
      crankGain.gain.linearRampToValueAtTime(profile.level * 0.5, now + 0.035);
      crankGain.gain.setValueAtTime(profile.level * 0.42, now + 0.47);
      crankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.66);
      crankingNoise.connect(crankFilter);
      crankFilter.connect(crankGain);
      crankGain.connect(t);
      crankingNoise.onended = () => {
        crankingNoise.disconnect();
        crankFilter.disconnect();
        crankGain.disconnect();
      };
      crankingNoise.start(now, Math.random() * 0.1);
      crankingNoise.stop(now + 0.68);
      for (let turn = 0; turn < 3; turn++) {
        h(
          0.15,
          profile.level * (0.48 - turn * 0.07),
          profile.cutoff * (0.42 + turn * 0.12),
          "lowpass",
          turn * 0.16
        );
      }
      const ignition = e.createOscillator();
      const ignitionFilter = e.createBiquadFilter();
      const ignitionGain = e.createGain();
      ignition.type = profile.shape;
      ignition.frequency.setValueAtTime(profile.catch * 0.72, now + 0.48);
      ignition.frequency.linearRampToValueAtTime(
        profile.catch * 1.55,
        now + 0.72
      );
      ignition.frequency.exponentialRampToValueAtTime(
        profile.catch,
        now + 1.08
      );
      ignitionFilter.type = "lowpass";
      ignitionFilter.frequency.setValueAtTime(
        profile.cutoff * 0.72,
        now + 0.48
      );
      ignitionFilter.frequency.linearRampToValueAtTime(
        profile.cutoff * 1.8,
        now + 0.78
      );
      ignitionFilter.frequency.exponentialRampToValueAtTime(
        profile.cutoff,
        now + 1.08
      );
      ignitionGain.gain.setValueAtTime(0.001, now + 0.48);
      ignitionGain.gain.linearRampToValueAtTime(
        profile.level * 1.25,
        now + 0.66
      );
      ignitionGain.gain.setValueAtTime(profile.level * 0.8, now + 0.82);
      ignitionGain.gain.exponentialRampToValueAtTime(0.001, now + 1.16);
      ignition.connect(ignitionFilter);
      ignitionFilter.connect(ignitionGain);
      ignitionGain.connect(t);
      ignition.onended = () => {
        ignition.disconnect();
        ignitionFilter.disconnect();
        ignitionGain.disconnect();
      };
      ignition.start(now + 0.48);
      ignition.stop(now + 1.18);
    },
    setSynthEngine() {
      m = true;
    },
    shift(e) {
      h(e ? 0.065 : 0.045, e ? 0.13 : 0.055, e ? 420 : 1100);
    },
    crash(e = 1) {
      h(0.45, Math.min(0.65 * e, 0.8), 650);
      h(0.25, 0.55 * e, 130);
    },
    close() {
      o.stop();

      d.forEach((e) => {
        return e.stop();
      });

      c.disconnect();
      u.disconnect();
    },
  };
}
function HT(e) {
  let t = window.AudioContext || window.webkitAudioContext;
  if (!t) {
    return {
      ready: Promise.resolve(),
      update() {},
      crash() {},
      startEngine() {},
      resume() {},
      close() {},
    };
  }

  let n = new t({
    latencyHint: "interactive",
  });

  let r = n.createGain();
  r.gain.value = 0;
  let i = n.createDynamicsCompressor();
  i.threshold.value = -14;
  i.knee.value = 12;
  i.ratio.value = 3;
  i.attack.value = 0.008;
  i.release.value = 0.16;
  let a = n.createBiquadFilter();
  a.type = "highpass";
  a.frequency.value = 28;
  r.connect(a);
  a.connect(i);
  i.connect(n.destination);
  let o = VT(n, r, e.id);
  let s = null;
  let c = false;
  let l = 0;
  let u = true;
  return {
    ready: BT(n, r, e.id)
      .then((e) => {
        if (c) {
          e.close();
        } else {
          (s = e), o.setSynthEngine();
        }
      })
      .catch(async () => {
        return LT(n, r, await PT(n, e.id), e.id);
      }),
    resume() {
      if (!c && n.state === "suspended") {
        return n.resume();
      }
    },
    update(e, t, i, a, d = {}) {
      if (!c) {
        (u = i),
          n.state === "suspended" && n.resume(),
          r.gain.setTargetAtTime(i || !s ? 0 : 1, n.currentTime, 0.035),
          s &&
            (s.update(e, t, d),
            o.update(e, t, a, d, i),
            d.shiftSerial > l &&
              (!i &&
                e > 2300 &&
                (o.shift(d.shiftDirection > 0),
                s.bang?.(
                  (d.shiftDirection > 0 ? 1 : 0.8) *
                    Math.min(1.6, 0.6 + e / (d.redline || 7000) /* 7e3 */)
                )),
              (l = d.shiftSerial)));
      }
    },
    startEngine() {
      if (!c && !u && n.state === "running") {
        o.startEngine();
      }
    },
    crash(e = 1) {
      if (!c && !u) {
        o.crash(e);
      }
    },
    close() {
      if (!c) {
        (c = true),
          s?.close(),
          o.close(),
          r.disconnect(),
          a.disconnect(),
          i.disconnect(),
          n.state !== "closed" && n.close();
      }
    },
  };
}
function UT(e) {
  const treadCanvas = document.createElement("canvas");
  treadCanvas.width = 64;
  treadCanvas.height = 128;
  const treadContext = treadCanvas.getContext("2d");
  treadContext.fillStyle = "rgba(17,19,21,0.42)";
  treadContext.fillRect(0, 0, 64, 128);
  for (let row = 0; row < 4; row++) {
    const y = row * 32;
    treadContext.clearRect(8, y + 3, 3, 11);
    treadContext.clearRect(18, y + 3, 3, 11);
    treadContext.clearRect(43, y + 18, 3, 11);
    treadContext.clearRect(53, y + 18, 3, 11);
    treadContext.fillStyle = "rgba(4,5,6,0.24)";
    treadContext.fillRect(27, y + 14, 10, 2);
  }
  const treadTexture = new CanvasTexture(treadCanvas);
  treadTexture.wrapS = RepeatWrapping;
  treadTexture.wrapT = RepeatWrapping;
  treadTexture.colorSpace = "srgb";
  const smokeCanvas = document.createElement("canvas");
  smokeCanvas.width = 128;
  smokeCanvas.height = 128;
  const smokeContext = smokeCanvas.getContext("2d");
  const smokeGradient = smokeContext.createRadialGradient(
    64,
    64,
    7,
    64,
    64,
    62
  );
  smokeGradient.addColorStop(0, "rgba(235,239,242,0.24)");
  smokeGradient.addColorStop(0.34, "rgba(220,226,231,0.17)");
  smokeGradient.addColorStop(0.72, "rgba(202,210,217,0.07)");
  smokeGradient.addColorStop(1, "rgba(190,200,208,0)");
  smokeContext.fillStyle = smokeGradient;
  smokeContext.fillRect(0, 0, 128, 128);
  const smokeTexture = new CanvasTexture(smokeCanvas);
  smokeTexture.colorSpace = "srgb";
  const smokeGeometry = new PlaneGeometry(1, 1);

  let t = Array.from(
    {
      length: 48,
    },
    () => {
      let t = new Mesh(
        smokeGeometry,
        new MeshBasicMaterial({
          map: smokeTexture,
          color: "#c6cbd0",
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: 2,
        })
      );
      t.visible = false;
      e.add(t);

      return {
        mesh: t,
        life: 0,
        maxLife: 1,
        vx: 0,
        vy: 0,
        vz: 0,
      };
    }
  );

  let n = Array.from(
    {
      length: 20,
    },
    () => {
      let t = new Mesh(
        new SphereGeometry(0.8, 6, 5),
        new MeshBasicMaterial({
          color: "#3a3d42",
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      );
      t.visible = false;
      e.add(t);

      return {
        mesh: t,
        life: 0,
        vy: 0,
      };
    }
  );

  let r = Array.from(
    {
      length: 16,
    },
    () => {
      let t = new Mesh(
        new BoxGeometry(0.15, 0.15, 0.15),
        new MeshStandardMaterial({
          color: "#444",
          roughness: 0.8,
        })
      );
      t.visible = false;
      e.add(t);

      return {
        mesh: t,
        life: 0,
        vx: 0,
        vy: 0,
        vz: 0,
      };
    }
  );

  let skidMaterial = new MeshBasicMaterial({
    color: "#0d0f11",
    map: treadTexture,
    transparent: true,
    opacity: 0.76,
    depthWrite: false,
    side: 2,
  });

  let i = Array.from(
    {
      length: 32,
    },
    () => {
      const wheels = Array.from(
        {
          length: 2,
        },
        () => {
          const geometry = new BufferGeometry();
          const capacity = 32;
          const positions = new Float32Array(capacity * 12);
          const normals = new Float32Array(capacity * 12);
          const uvs = new Float32Array(capacity * 8);
          const indices = [];
          for (let k = 0; k < capacity; k++) {
            const base = k * 4;
            indices.push(
              base,
              base + 2,
              base + 1,
              base + 1,
              base + 2,
              base + 3
            );
          }
          geometry.setAttribute(
            "position",
            new Float32BufferAttribute(positions, 3)
          );
          geometry.setAttribute(
            "normal",
            new Float32BufferAttribute(normals, 3)
          );
          geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
          geometry.setIndex(indices);
          geometry.setDrawRange(0, 0);
          const mesh = new Mesh(geometry, skidMaterial);
          mesh.visible = false;
          mesh.frustumCulled = false;
          e.add(mesh);
          return {
            geometry,
            mesh,
            positions,
            normals,
            uvs,
            capacity,
            segments: 0,
            distance: 0,
            last: null,
          };
        }
      );
      return {
        wheels,
        remaining: 0,
      };
    }
  );

  let a = Array.from(
    {
      length: 10,
    },
    () => {
      let t = new Mesh(
        new SphereGeometry(0.3, 6, 5),
        new MeshBasicMaterial({
          color: "#2b2e32",
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      );
      t.visible = false;
      e.add(t);

      return {
        mesh: t,
        life: 0,
      };
    }
  );

  let o = 0;
  let s = 0;
  let trailCursor = 0;
  let activeTrail = null;
  let wasDrifting = false;
  let l = 0;
  let u = 0;
  let d = 0;
  let f = 0;
  return {
    update(e, l, camera) {
      o += l;

      t.forEach((particle) => {
        let mesh = particle.mesh;
        mesh.visible = particle.life > 0;

        if (particle.life > 0) {
          (particle.life -= l),
            (mesh.position.x += particle.vx * l),
            (mesh.position.y += particle.vy * l),
            (mesh.position.z += particle.vz * l),
            mesh.scale.addScalar(l * 0.72),
            camera && mesh.lookAt(camera.position),
            (mesh.material.opacity =
              Math.max(0, particle.life / particle.maxLife) * 0.46);
        }
      });

      n.forEach((e) => {
        e.mesh.visible = e.life > 0;

        if (e.life > 0) {
          (e.life -= l),
            (e.mesh.position.y += l * 0.7),
            e.mesh.scale.addScalar(l * 0.8),
            (e.mesh.material.opacity = Math.max(0, e.life) * 0.22);
        }
      });

      r.forEach((e) => {
        if (e.life > 0) {
          (e.life -= l),
            (e.mesh.position.x += e.vx * l),
            (e.mesh.position.y += e.vy * l),
            (e.mesh.position.z += e.vz * l),
            (e.vy -= l * 9),
            (e.mesh.rotation.x += l * 8),
            (e.mesh.rotation.z += l * 6),
            e.mesh.position.y < 0.1 &&
              ((e.mesh.position.y = 0.1),
              (e.vy *= -0.3),
              (e.vx *= 0.5),
              (e.vz *= 0.5)),
            (e.mesh.visible = e.life > 0);
        }
      });

      if (e.noPolice && e.health < 55) {
        f += l;
        let t = 1 - Math.max(0, e.health) / 100;
        if (f > 0.14 - t * 0.1) {
          f = 0;
          let n = a[d++ % a.length];
          n.life = 1 + t * 0.8;

          n.mesh.position.set(
            e.x - Math.sin(e.heading) * 1.6,
            (e.y || 0) + 0.5,
            e.z - Math.cos(e.heading) * 1.6
          );

          n.mesh.scale.setScalar(0.5);
        }
      }

      a.forEach((e) => {
        e.mesh.visible = e.life > 0;

        if (e.life > 0) {
          (e.life -= l),
            (e.mesh.position.y += l * 0.9),
            e.mesh.scale.addScalar(l * 0.7),
            (e.mesh.material.opacity = Math.max(0, e.life) * 0.3);
        }
      });

      i.forEach((trail) => {
        if (trail !== activeTrail && trail.remaining > 0) {
          trail.remaining = Math.max(0, trail.remaining - l);
          if (trail.remaining === 0) {
            trail.wheels.forEach((wheel) => {
              wheel.mesh.visible = false;
              wheel.geometry.setDrawRange(0, 0);
              wheel.last = null;
            });
          }
        }
      });

      if (e.drifting && !wasDrifting) {
        (activeTrail = i[trailCursor++ % i.length]),
          (activeTrail.remaining = 0),
          activeTrail.wheels.forEach((wheel) => {
            wheel.segments = 0;
            wheel.distance = 0;
            wheel.last = null;
            wheel.geometry.setDrawRange(0, 0);
            wheel.mesh.visible = false;
          });
      }

      if (e.drifting) {
        const appendSkidSegment = (wheel, x1, z1, x2, z2, y, width) => {
          const dx = x2 - x1;
          const dz = z2 - z1;
          const length = Math.hypot(dx, dz);
          if (length < 0.012) {
            return;
          }
          const nx = ((-dz / length) * width) / 2;
          const nz = ((dx / length) * width) / 2;
          if (wheel.segments === wheel.capacity) {
            wheel.capacity *= 2;
            const positions = new Float32Array(wheel.capacity * 12);
            const normals = new Float32Array(wheel.capacity * 12);
            const uvs = new Float32Array(wheel.capacity * 8);
            positions.set(wheel.positions);
            normals.set(wheel.normals);
            uvs.set(wheel.uvs);
            wheel.positions = positions;
            wheel.normals = normals;
            wheel.uvs = uvs;
            wheel.geometry.setAttribute(
              "position",
              new Float32BufferAttribute(positions, 3)
            );
            wheel.geometry.setAttribute(
              "normal",
              new Float32BufferAttribute(normals, 3)
            );
            wheel.geometry.setAttribute(
              "uv",
              new Float32BufferAttribute(uvs, 2)
            );
            const indices = [];
            for (let k = 0; k < wheel.capacity; k++) {
              const base = k * 4;
              indices.push(
                base,
                base + 2,
                base + 1,
                base + 1,
                base + 2,
                base + 3
              );
            }
            wheel.geometry.setIndex(indices);
          }
          const offset = wheel.segments * 12;
          wheel.positions.set(
            [
              x1 + nx,
              y,
              z1 + nz,
              x1 - nx,
              y,
              z1 - nz,
              x2 + nx,
              y,
              z2 + nz,
              x2 - nx,
              y,
              z2 - nz,
            ],
            offset
          );
          wheel.normals.fill(0, offset, offset + 12);
          for (let k = 0; k < 4; k++) {
            wheel.normals[offset + k * 3 + 1] = 1;
          }
          const uvOffset = wheel.segments * 8;
          const v0 = wheel.distance;
          const v1 = v0 + length * 1.6;
          wheel.uvs.set([0, v0, 1, v0, 0, v1, 1, v1], uvOffset);
          wheel.distance = v1;
          wheel.segments++;
          wheel.geometry.attributes.position.needsUpdate = true;
          wheel.geometry.attributes.normal.needsUpdate = true;
          wheel.geometry.attributes.uv.needsUpdate = true;
          wheel.geometry.setDrawRange(0, wheel.segments * 6);
          wheel.mesh.visible = true;
        };
        if (activeTrail) {
          for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
            const side = sideIndex === 0 ? -1 : 1;
            const x =
              e.x +
              Math.sin(e.heading) * 1.45 +
              Math.cos(e.heading) * side * 0.85;
            const z =
              e.z +
              Math.cos(e.heading) * 1.45 -
              Math.sin(e.heading) * side * 0.85;
            const y = (e.y || 0) + 0.09;
            const wheel = activeTrail.wheels[sideIndex];
            if (wheel.last) {
              appendSkidSegment(
                wheel,
                wheel.last.x,
                wheel.last.z,
                x,
                z,
                y,
                0.16
              );
            }
            wheel.last = {
              x,
              z,
            };
          }
        }
        if (o > 0.045) {
          o = 0;
          for (let n of [-1, 1]) {
            const r =
              Math.sin(e.heading) * 1.45 + Math.cos(e.heading) * n * 0.85;
            const a =
              Math.cos(e.heading) * 1.45 - Math.sin(e.heading) * n * 0.85;
            const x = e.x + r;
            const z = e.z + a;
            const y = e.y || 0;
            const particle = t[s++ % t.length];
            particle.maxLife = 0.9 + Math.random() * 0.55;
            particle.life = particle.maxLife;
            particle.mesh.position.set(x, y + 0.16 + Math.random() * 0.12, z);
            particle.mesh.scale.set(
              0.65 + Math.random() * 0.4,
              0.5 + Math.random() * 0.3,
              1
            );
            particle.vx =
              Math.sin(e.heading) * (0.25 + e.speed * 0.035) +
              (Math.random() - 0.5) * 0.45;
            particle.vy = 0.38 + Math.random() * 0.48;
            particle.vz =
              Math.cos(e.heading) * (0.25 + e.speed * 0.035) +
              (Math.random() - 0.5) * 0.45;
            particle.mesh.material.opacity = 0.25 + Math.random() * 0.12;
          }
        }
      }

      if (!e.drifting && wasDrifting) {
        (activeTrail.remaining = 20), (activeTrail = null);
      }

      wasDrifting = e.drifting;
    },
    crash(e, t, i, a = 1) {
      for (let r = 0; r < 8; r++) {
        let r = n[l++ % n.length];
        r.life = 1.5 + Math.random() * 0.5;
        r.vy = 0.8 + Math.random() * 0.6;

        r.mesh.position.set(
          e + (Math.random() - 0.5) * 2,
          t + 0.5,
          i + (Math.random() - 0.5) * 2
        );

        r.mesh.scale.setScalar(1 + Math.random());
      }
      for (let n = 0; n < 6; n++) {
        let n = r[u++ % r.length];
        n.life = 1.5;
        n.mesh.position.set(e, t + 0.5, i);
        n.vx = (Math.random() - 0.5) * 12 * a;
        n.vy = 3 + Math.random() * 5;
        n.vz = (Math.random() - 0.5) * 12 * a;
        n.mesh.visible = true;
      }
    },
  };
}
function aE(e, t, n, r, i, a) {
  let o = new EffectComposer(e);

  if (e.capabilities.isWebGL2) {
    (o.renderTarget1.samples = Math.min(4, e.capabilities.maxSamples)),
      (o.renderTarget2.samples = Math.min(4, e.capabilities.maxSamples));
  }

  o.setPixelRatio(e.getPixelRatio());
  o.setSize(r, i);
  o.addPass(new RenderPass(t, n));
  o.addPass(new UnrealBloomPass(new Vector2(r, i), a, 0.4, 0.92));
  let s = new ShaderPass(VignetteShader);
  s.uniforms.offset.value = 0.95;
  s.uniforms.darkness.value = 1.08;
  o.addPass(s);
  o.addPass(new OutputPass());
  return o;
}
function oE(e, t = false) {
  let lowPower = !!(
    navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4
  );
  let n = new Scene();
  n.background = new Color(t ? "#070b14" : "#0d1520");
  n.fog = new Fog(t ? "#223a4d" : "#35506b", t ? 130 : 74, t ? 1050 : 980);
  let r = new WebGLRenderer({
    // every frame goes through the composer, whose render targets are multisampled; the canvas only
    // receives a fullscreen copy, so a multisampled default framebuffer would cost bandwidth for nothing
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  try {
    r.outputColorSpace = "srgb";
  } catch (e) {}
  let i = !!(
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches
  );
  if (lowPower) {
    r.shadowMap.enabled = false;
    r.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
  } else {
    r.setPixelRatio(Math.min(window.devicePixelRatio, i ? 1.2 : t ? 1.8 : 2.2));
  }
  r.setSize(e.clientWidth, e.clientHeight);
  r.toneMapping = 4;
  r.toneMappingExposure = t ? 0.82 : 1.05;
  r.shadowMap.enabled = !lowPower;
  r.shadowMap.type = 2;

  if (r.physicallyCorrectLights) {
    r.physicallyCorrectLights = true;
  }

  e.appendChild(r.domElement);
  r.domElement.className = t ? "game-canvas" : "game-canvas-preview";
  let a = new PerspectiveCamera(45, e.clientWidth / e.clientHeight, 0.1, 1200);
  n.add(
    new HemisphereLight(
      t ? "#a1bfdc" : "#dfeaf8",
      t ? "#1a2418" : "#101a22",
      t ? 0.78 : 1.15
    )
  );
  let o = new AmbientLight(t ? "#3d536d" : "#78879a", t ? 0.38 : 0.58);
  n.add(o);
  let s = new DirectionalLight(t ? "#a9c5e8" : "#f6d7a8", t ? 2.2 : 3.2);
  s.position.set(-42, 88, -30);

  if ((t || !i) && !lowPower) {
    s.castShadow = true;
    let e = i ? 1024 : t ? 2048 : 3072;
    s.shadow.mapSize.set(e, e);
    s.shadow.camera.near = 12;
    s.shadow.camera.far = 340;
    s.shadow.camera.left = -120;
    s.shadow.camera.right = 120;
    s.shadow.camera.top = 120;
    s.shadow.camera.bottom = -120;
    s.shadow.bias = -0.00017 /* -1.7e-4 */;
    s.shadow.normalBias = 0.045;
    s.shadow.radius = 3;
  }

  n.add(s);
  n.add(s.target);
  let c = new DirectionalLight(t ? "#7ca8d7" : "#7ca8d7", t ? 0.35 : 0.55);
  c.position.set(52, 42, 64);
  n.add(c);

  if (t) {
    let e = new DirectionalLight("#90b0d8", 0.5);
    e.position.set(25, 34, -60);
    n.add(e);
  } else {
    let e = new DirectionalLight("#ddeeff", 0.45);
    e.position.set(-90, 28, -35);
    n.add(e);
  }

  let l = document.createElement("canvas");
  l.width = t ? 2048 : 1024;
  l.height = t ? 1024 : 512;
  let u = l.getContext("2d");
  if (t) {
    const sky = u.createLinearGradient(0, 0, 0, l.height);
    sky.addColorStop(0, "#02040b");
    sky.addColorStop(0.2, "#050b18");
    sky.addColorStop(0.39, "#0b1728");
    sky.addColorStop(0.49, "#14243a");
    sky.addColorStop(0.535, "#1d2b3b");
    sky.addColorStop(0.59, "#182433");
    sky.addColorStop(0.76, "#0b111b");
    sky.addColorStop(1, "#05080e");
    u.fillStyle = sky;
    u.fillRect(0, 0, l.width, l.height);
    const moonX = l.width * 0.72;
    const moonY = l.height * 0.2;
    const moonGlow = u.createRadialGradient(moonX, moonY, 4, moonX, moonY, 150);
    moonGlow.addColorStop(0, "rgba(180,205,238,0.2)");
    moonGlow.addColorStop(0.24, "rgba(124,157,205,0.1)");
    moonGlow.addColorStop(1, "rgba(80,115,170,0)");
    u.fillStyle = moonGlow;
    u.fillRect(moonX - 150, moonY - 150, 300, 300);
    const moonDisk = u.createRadialGradient(
      moonX - 7,
      moonY - 8,
      1,
      moonX,
      moonY,
      22
    );
    moonDisk.addColorStop(0, "rgba(223,232,245,0.9)");
    moonDisk.addColorStop(0.8, "rgba(185,203,229,0.82)");
    moonDisk.addColorStop(1, "rgba(153,178,211,0)");
    u.fillStyle = moonDisk;
    u.fillRect(moonX - 26, moonY - 26, 52, 52);
    let cloudSeed = 481516;
    const random = () => {
      cloudSeed = (cloudSeed * 48271) % 2147483647;
      return (cloudSeed - 1) / 2147483646;
    };
    for (let star = 0; star < 420; star++) {
      const x = random() * l.width;
      const y = random() * l.height * 0.48;
      const radius = random() > 0.96 ? 1.5 + random() : 0.35 + random() * 0.65;
      u.beginPath();
      u.arc(x, y, radius, 0, Math.PI * 2);
      u.fillStyle = `rgba(210,226,255,${0.18 + random() * 0.5})`;
      u.fill();
    }
    for (let band = 0; band < 2; band++) {
      const groups = band === 0 ? 12 : 9;
      for (let group = 0; group < groups; group++) {
        const cx = random() * l.width;
        const cy = band === 0 ? 350 + random() * 180 : 485 + random() * 190;
        const width = 75 + random() * (band === 0 ? 150 : 110);
        const count = 8 + Math.floor(random() * 15);
        for (let puff = 0; puff < count; puff++) {
          const px = cx + (random() - 0.5) * width * 1.8;
          const py = cy + (random() - 0.5) * width * 0.42;
          const radius = 22 + random() * (band === 0 ? 56 : 34);
          const cloud = u.createRadialGradient(
            px,
            py,
            radius * 0.08,
            px,
            py,
            radius
          );
          cloud.addColorStop(
            0,
            band === 1 ? "rgba(111,137,176,0.16)" : "rgba(156,177,207,0.12)"
          );
          cloud.addColorStop(
            0.42,
            band === 1 ? "rgba(91,119,160,0.09)" : "rgba(117,143,181,0.07)"
          );
          cloud.addColorStop(1, "rgba(70,96,137,0)");
          u.fillStyle = cloud;
          u.fillRect(px - radius, py - radius, radius * 2, radius * 2);
        }
      }
    }
    for (let i = 0; i < 34; i++) {
      const y = 280 + random() * 260;
      const x = random() * l.width;
      const length = 70 + random() * 250;
      u.beginPath();
      u.moveTo(x, y);
      u.bezierCurveTo(
        x + length * 0.3,
        y - 8,
        x + length * 0.7,
        y + 8,
        x + length,
        y - 2
      );
      u.strokeStyle = `rgba(145,169,203,${0.012 + random() * 0.022})`;
      u.lineWidth = 3 + random() * 9;
      u.stroke();
    }
  } else {
    let d = u.createLinearGradient(0, 0, 0, 512);
    d.addColorStop(0, "#2a2e32");
    d.addColorStop(0.35, "#1a1e22");
    d.addColorStop(0.5, "#15191d");
    d.addColorStop(0.62, "#10131a");
    d.addColorStop(0.72, "#0a0d10");
    d.addColorStop(1, "#05060a");
    u.fillStyle = d;
    u.fillRect(0, 0, 1024, 512);
    let skylineSeed = 7919;
    for (let buildingIndex = 0; buildingIndex < 40; buildingIndex++) {
      skylineSeed = (skylineSeed * 48271) % 2147483647;
      let buildingX = buildingIndex * 26;
      let buildingHeight = 18 + (skylineSeed % 42);
      u.fillStyle = buildingIndex % 3 ? "#0b121a" : "#111a22";
      u.fillRect(buildingX, 264 - buildingHeight, 26, buildingHeight + 28);
      for (let row = 0; row < Math.floor(buildingHeight / 7); row++) {
        for (let column = 0; column < 3; column++) {
          skylineSeed = (skylineSeed * 48271) % 2147483647;
          if (skylineSeed % 5 === 0) {
            u.fillStyle = "rgba(255,190,130,0.38)";
            u.fillRect(
              buildingX + 4 + column * 7,
              267 - buildingHeight + row * 7,
              2,
              3
            );
          }
        }
      }
    }
    let f = u.createLinearGradient(0, 250, 0, 320);
    f.addColorStop(0, "rgba(255,180,120,0)");
    f.addColorStop(0.5, "rgba(180,140,90,0.15)");
    f.addColorStop(1, "rgba(255,160,100,0)");
    u.fillStyle = f;
    u.fillRect(0, 250, 1024, 70);
    u.fillStyle = "rgba(255,220,180,0.3)";
    u.beginPath();
    u.arc(760, 90, 55, 0, Math.PI * 2);
    u.fill();
    u.fillStyle = "rgba(255,255,255,0.25)";
    u.beginPath();
    u.arc(760, 90, 80, 0, Math.PI * 2);
    u.fill();
  }
  let p = new CanvasTexture(l);
  p.mapping = 303;
  let m = new PMREMGenerator(r);
  n.environment = m.fromEquirectangular(p).texture;

  if (t) {
    n.background = p;
  }

  m.dispose();
  let h = aE(r, n, a, e.clientWidth, e.clientHeight, t ? 0.75 : 0.5);

  let g = new ResizeObserver(() => {
    let t = e.clientWidth;
    let n = e.clientHeight;

    if (t && n) {
      r.setSize(t, n),
        (a.aspect = t / n),
        a.updateProjectionMatrix(),
        h.setSize(t, n);
    }
  });

  g.observe(e);

  return {
    scene: n,
    renderer: r,
    camera: a,
    sun: s,
    touchDevice: i,
    composer: h,
    dispose() {
      g.disconnect();

      n.traverse((e) => {
        e.geometry?.dispose();

        if (e.material) {
          (Array.isArray(e.material) ? e.material : [e.material]).forEach(
            (e) => {
              return e.dispose();
            }
          );
        }
      });

      h.dispose();
      r.dispose();
      r.domElement.remove();
    },
  };
}
function __cv(w, h, fn) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  fn(c.getContext("2d"), w, h);
  const t = new CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}
/* ---------- people: articulated humanoids (face -Z at rotation 0, like the cars) ---------- */
function __makePerson(col) {
  const cop = col === "#1f2f4d";
  const g = new Group();
  const L = {};
  const mt = (c, r = 0.8, m = 0) => {
    return new MeshStandardMaterial({
      color: c,
      roughness: r,
      metalness: m,
    });
  };
  const skin = mt(cop ? "#c99a78" : "#d9b48f", 0.62);
  const shirt = mt(col, 0.88);
  const vest = mt("#131b2a", 0.9);
  const pants = mt(cop ? "#0f1724" : "#262d3a", 0.92);
  const shoe = mt(cop ? "#0a0a0b" : "#ececec", cop ? 0.35 : 0.7);
  const dark = mt("#0c0d10", 0.5, 0.2);
  const add = (geo, m, x, y, z, p = g, sh = true) => {
    const q = new Mesh(geo, m);
    q.position.set(x, y, z);
    q.castShadow = sh;
    p.add(q);
    return q;
  };
  const body = new Group();
  g.add(body);
  L.body = body;
  add(new BoxGeometry(0.36, 0.2, 0.22), pants, 0, 0.95, 0, body);
  add(
    new CylinderGeometry(0.2, 0.17, 0.56, 14),
    cop ? vest : shirt,
    0,
    1.28,
    0,
    body
  ).scale.z = 0.66;
  for (const s of [-1, 1]) {
    add(new SphereGeometry(0.085, 10, 8), shirt, s * 0.235, 1.49, 0, body);
  }
  add(new CylinderGeometry(0.05, 0.055, 0.1, 8), skin, 0, 1.58, 0, body);
  const head = new Group();
  head.position.set(0, 1.69, 0);
  body.add(head);
  L.head = head;
  add(new SphereGeometry(0.115, 18, 14), skin, 0, 0, 0, head).scale.set(
    0.92,
    1.08,
    1
  );
  add(new BoxGeometry(0.024, 0.04, 0.03), skin, 0, -0.008, -0.116, head, false);
  for (const s of [-1, 1]) {
    add(
      new SphereGeometry(0.013, 6, 5),
      dark,
      s * 0.04,
      0.022,
      -0.106,
      head,
      false
    );
    add(
      new BoxGeometry(0.045, 0.008, 0.01),
      dark,
      s * 0.04,
      0.05,
      -0.108,
      head,
      false
    );
  }
  if (cop) {
    add(new BoxGeometry(0.2, 0.036, 0.03), dark, 0, 0.024, -0.108, head, false);
    add(
      new CylinderGeometry(0.118, 0.124, 0.075, 18),
      mt("#0d1524", 0.7),
      0,
      0.108,
      -0.005,
      head
    );
    add(
      new CylinderGeometry(0.1, 0.12, 0.02, 18),
      mt("#0d1524", 0.7),
      0,
      0.152,
      -0.005,
      head
    );
    add(new BoxGeometry(0.2, 0.012, 0.1), dark, 0, 0.09, -0.13, head);
    add(
      new BoxGeometry(0.03, 0.035, 0.01),
      mt("#e0b84a", 0.3, 0.9),
      0,
      0.115,
      -0.128,
      head,
      false
    );
    add(new BoxGeometry(0.34, 0.06, 0.24), dark, 0, 1.02, 0, body);
    add(new BoxGeometry(0.065, 0.2, 0.11), dark, 0.21, 0.93, 0, body);
    add(
      new BoxGeometry(0.07, 0.045, 0.1),
      mt("#222", 0.4, 0.6),
      -0.13,
      1.03,
      -0.1,
      body
    );
    add(new BoxGeometry(0.05, 0.09, 0.04), dark, -0.14, 1.44, -0.13, body);
    add(
      new BoxGeometry(0.012, 0.1, 0.012),
      dark,
      -0.15,
      1.53,
      -0.13,
      body,
      false
    );
    add(
      new BoxGeometry(0.03, 0.04, 0.01),
      mt("#e0b84a", 0.3, 0.9),
      0.1,
      1.38,
      -0.137,
      body,
      false
    );
    const tx = __cv(128, 48, (x, w, h) => {
      x.fillStyle = "#0a0f1a";
      x.fillRect(0, 0, w, h);
      x.fillStyle = "#f2d24a";
      x.font = "bold 30px sans-serif";
      x.textAlign = "center";
      x.fillText("POLICE", 64, 35);
    });
    for (const f of [1, -1]) {
      const p = new Mesh(
        new PlaneGeometry(0.3, 0.11),
        new MeshStandardMaterial({
          map: tx,
          roughness: 0.6,
        })
      );
      p.position.set(0, 1.33, f * 0.146);
      p.rotation.y = f > 0 ? 0 : Math.PI;
      body.add(p);
    }
  } else {
    add(new SphereGeometry(0.13, 12, 10), shirt, 0, 1.57, 0.07, body).scale.set(
      1,
      0.8,
      0.8
    );
    add(
      new SphereGeometry(0.121, 14, 10),
      mt("#1c1410", 0.9),
      0,
      0.028,
      0.02,
      head
    ).scale.set(0.97, 0.9, 1);
    add(
      new BoxGeometry(0.2, 0.012, 0.1),
      mt("#15171c", 0.6),
      0,
      0.07,
      -0.13,
      head
    );
  }
  const arm = (s) => {
    const sh = new Group();
    sh.position.set(s * 0.25, 1.48, 0);
    body.add(sh);
    add(new CylinderGeometry(0.055, 0.046, 0.3, 10), shirt, 0, -0.15, 0, sh);
    const el = new Group();
    el.position.y = -0.3;
    sh.add(el);
    add(new CylinderGeometry(0.046, 0.037, 0.28, 10), shirt, 0, -0.14, 0, el);
    add(new SphereGeometry(0.043, 8, 6), skin, 0, -0.3, 0, el);
    return [sh, el];
  };
  [L.la, L.le] = arm(-1);
  [L.ra, L.re] = arm(1);
  const leg = (s) => {
    const hp = new Group();
    hp.position.set(s * 0.1, 0.93, 0);
    g.add(hp);
    add(new CylinderGeometry(0.085, 0.064, 0.46, 10), pants, 0, -0.23, 0, hp);
    const kn = new Group();
    kn.position.y = -0.46;
    hp.add(kn);
    add(new CylinderGeometry(0.062, 0.05, 0.44, 10), pants, 0, -0.22, 0, kn);
    add(new BoxGeometry(0.1, 0.07, 0.27), shoe, 0, -0.45, -0.05, kn);
    return [hp, kn];
  };
  [L.lh, L.lk] = leg(-1);
  [L.rh, L.rk] = leg(1);
  g.userData.L = L;
  return g;
}
function __animPerson(g, dt, x, z) {
  const u = g.userData;
  const L = u.L;
  if (!L || dt <= 0) {
    return;
  }
  if (u.lx === undefined) {
    u.lx = x;
    u.lz = z;
    u.ph = 0;
    u.sp = 0;
  }
  const v = Math.min(Math.hypot(x - u.lx, z - u.lz) / dt, 10);
  u.lx = x;
  u.lz = z;
  u.sp += (v - u.sp) * (1 - Math.exp(-10 * dt));
  const run = Math.min(u.sp / 4.6, 1.9);
  const a = Math.min(run, 1.6) * 0.62;
  u.ph += dt * u.sp * 1.9;
  const s = Math.sin(u.ph);
  const c = Math.sin(u.ph + 1.9);
  L.lh.rotation.x = s * a;
  L.rh.rotation.x = -s * a;
  L.lk.rotation.x = -Math.max(0, c) * a * 1.5;
  L.rk.rotation.x = -Math.max(0, -c) * a * 1.5;
  L.la.rotation.x = -s * a * 0.9;
  L.ra.rotation.x = s * a * 0.9;
  const bend = 0.12 + Math.min(run, 1) * 0.5;
  L.le.rotation.x = bend;
  L.re.rotation.x = bend;
  L.body.position.y = Math.abs(s) * 0.035 * Math.min(run, 1.4);
  L.body.rotation.x = -Math.min(run, 1.6) * 0.08;
  L.head.rotation.x = Math.min(run, 1.6) * 0.06;
}
function sE(e) {
  return __makePerson(e);
}
function cE(e, t) {
  if (
    navigator.webdriver ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
  ) {
    return () => {};
  }
  let n = oE(e);
  let { scene: r, renderer: i, camera: a, composer: o } = n;
  a.position.set(7, 3.2, 8.2);
  a.lookAt(0, 0.5, 0);
  let s = Vw(t.color, t.shape);
  s.rotation.y = -0.25;
  r.add(s);
  let c = new Mesh(
    new PlaneGeometry(100, 100),
    new MeshStandardMaterial({
      color: "#171b1e",
      roughness: 0.35,
      metalness: 0.45,
    })
  );
  c.rotation.x = -Math.PI / 2;
  c.position.y = -0.04;
  r.add(c);
  let l = new Mesh(
    new CylinderGeometry(4.7, 4.8, 0.16, 80),
    new MeshStandardMaterial({
      color: "#23292c",
      metalness: 0.6,
      roughness: 0.4,
    })
  );
  l.position.y = -0.03;
  r.add(l);
  let u = new Mesh(
    new TorusGeometry(4.73, 0.012, 8, 100),
    new MeshBasicMaterial({
      color: "#c6dc77",
    })
  );
  u.rotation.x = Math.PI / 2;
  u.position.y = 0.06;
  r.add(u);
  for (let e of [-5, 5]) {
    let t = new PointLight(e < 0 ? "#bbd9ff" : "#c6dc77", 80, 25);
    t.position.set(e, 4, -2);
    r.add(t);
    let n = new Mesh(
      new BoxGeometry(0.035, 4, 0.035),
      new MeshBasicMaterial({
        color: e < 0 ? "#adc7d4" : "#c6dc77",
      })
    );
    n.position.set(e, 2, -5);
    r.add(n);
  }
  let d;
  let f = performance.now();
  function p() {
    d = requestAnimationFrame(p);
    s.rotation.y =
      -0.25 + Math.sin((performance.now() - f) * 0.00012 /* 12e-5 */) * 0.18;
    o.render();
  }
  p();

  return () => {
    cancelAnimationFrame(d);
    n.dispose();
  };
}
function lE(e, t, n, r, i, a = false) {
  let o = oE(e, true);

  let {
    scene: s,
    renderer: c,
    camera: l,
    sun: u,
    touchDevice: d,
    composer: f,
  } = o;

  let { solids: p, lampPositions: m, signals } = $w(s);

  let staticBatch = dfcBatchStatic(
    s,
    new Set(
      signals.flatMap((signal) => {
        return signal.lenses;
      })
    ),
    96
  );

  let h = ET(t, n, p, a);
  let g = [];
  // ?dfdebug exposes the live session for profiling tools
  const debugSession = /[?&]dfdebug\b/.test(location.search)
    ? (window.__dfDbg = {
        scene: s,
        renderer: c,
        composer: f,
        camera: l,
        sun: u,
        staticBatch,
        get state() {
          return h.state;
        },
      })
    : null;
  let signalClock = 0;
  const signalStates = [-1, -1];
  function updateTrafficLights(dt) {
    signalClock = (signalClock + dt) % 24;
    const phase = signalClock % 24;
    const state0 = phase < 9 ? 0 : phase < 11 ? 1 : 2;
    const state1 =
      phase >= 12 && phase < 21 ? 0 : phase >= 21 && phase < 23 ? 1 : 2;
    for (let axis = 0; axis < signalStates.length; axis++) {
      const state = axis === 0 ? state0 : state1;
      if (signalStates[axis] === state) {
        continue;
      }
      signalStates[axis] = state;
      const activeLens = state === 0 ? 2 : state === 1 ? 1 : 0;
      for (const signal of signals) {
        if (signal.axis === axis) {
          signal.lenses.forEach((material, index) => {
            material.emissiveIntensity = index === activeLens ? 1.35 : 0.025;
          });
        }
      }
    }
  }
  for (let e = 0; e < 6; e++) {
    let e = new PointLight("#ffd9a0", 0.6, 26, 2);
    s.add(e);

    g.push({
      light: e,
    });
  }
  let _ = new Float32Array(m.length || 1);
  let v = [];
  let lastLampX = Infinity;
  let lastLampZ = Infinity;
  function y(e, t) {
    if ((e - lastLampX) ** 2 + (t - lastLampZ) ** 2 < 25) {
      return;
    }
    lastLampX = e;
    lastLampZ = t;
    let n = m;
    let r = n.length;
    for (let i = 0; i < r; i++) {
      let r = n[i].x - e;
      let a = n[i].z - t;
      _[i] = r * r + a * a;
      v[i] = i;
    }
    v.length = r;

    v.sort((e, t) => {
      return _[e] - _[t];
    });

    for (let e = 0; e < 6; e++) {
      let t = g[e];
      let r = v[e];

      if (r == null) {
        t.light.visible = false;
      } else {
        t.light.position.set(n[r].x, n[r].y, n[r].z), (t.light.visible = true);
      }
    }
  }
  y(0, 70);
  let interaction = null;
  let b = dfcBatchCar(Vw(t.color, t.shape, false, true));
  s.add(b);
  let x = h.state.playerVeh.spec;

  let S = h.state.police.map(() => {
    let e = dfcTrafficCar("#ffffff", "coupe", true);
    s.add(e);
    return e;
  });

  let C = sE("#2f3b4c");
  C.visible = false;
  s.add(C);

  let w = h.state.police.map(() => {
    let e = sE("#1f2f4d");
    e.visible = false;
    s.add(e);
    return e;
  });

  let T = new Map();
  function E(e) {
    s.remove(b);

    b.traverse((e) => {
      e.geometry?.dispose();
      e.material?.dispose();
    });

    b = dfcBatchCar(Vw(e.color, e.shape, e.kind === "police", true));
    s.add(b);
    x = e.spec;
  }
  function D() {
    let e = h.state;
    let t = new Set();
    for (let n of e.vehicles) {
      t.add(n.id);
      let e = T.get(n.id);
      if (!e) {
        let t =
          n.kind === "police"
            ? dfcTrafficCar("#ffffff", "coupe", true)
            : dfcTrafficCar(n.color, n.shape || "coupe");
        s.add(t);

        e = {
          car: t,
        };

        T.set(n.id, e);
      }
      e.car.visible = true;
      e.car.position.set(n.x, Uw(n.x, n.z) + 0.1, n.z);
      e.car.rotation.y = n.heading;

      if (
        interaction?.direction === "exit" &&
        Math.hypot(n.x - interaction.carX, n.z - interaction.carZ) < 0.5
      ) {
        e.car.visible = false;
      }
    }
    for (let [e, n] of T) {
      if (!t.has(e)) {
        s.remove(n.car),
          n.car.userData.sharedTemplate ||
            n.car.traverse((e) => {
              e.geometry?.dispose();
              e.material?.dispose();
            }),
          T.delete(e);
      }
    }
  }
  let O = r.current.audio || HT(n);
  let k = UT(s);
  let A = {};
  let j;
  let M = performance.now();
  let N = 0;
  let cameraYaw = 0;
  let footCameraYaw = 0;
  let cameraPitch = 0;
  let cameraZoom = 1;
  let dragPointer = null;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let touchPoints = new Map();
  let pinchDistance = 0;
  let canvas = c.domElement;
  function startCameraDrag(e) {
    if (e.pointerType === "touch") {
      e.preventDefault();
      touchPoints.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });
      canvas.setPointerCapture(e.pointerId);
      if (touchPoints.size >= 2) {
        const points = [...touchPoints.values()];
        pinchDistance = Math.hypot(
          points[0].x - points[1].x,
          points[0].y - points[1].y
        );
        dragPointer = null;
        return;
      }
      dragPointer = e.pointerId;
    } else {
      if (e.button !== 2) {
        return;
      }
      e.preventDefault();
      dragPointer = e.pointerId;
      canvas.setPointerCapture(e.pointerId);
    }
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
  }
  function moveCameraDrag(e) {
    if (e.pointerType === "touch" && touchPoints.has(e.pointerId)) {
      touchPoints.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });
      if (touchPoints.size >= 2) {
        const points = [...touchPoints.values()];
        const distance = Math.hypot(
          points[0].x - points[1].x,
          points[0].y - points[1].y
        );
        if (pinchDistance > 0 && distance > 0) {
          cameraZoom = Math.max(
            0.45,
            Math.min(2.8, (cameraZoom * pinchDistance) / distance)
          );
        }
        pinchDistance = distance;
        return;
      }
    }
    if (e.pointerId !== dragPointer) {
      return;
    }
    const yawDelta = -(e.clientX - lastPointerX) * 0.005;
    cameraYaw += yawDelta;

    if (h.state.onFoot) {
      footCameraYaw += yawDelta;
    }

    cameraPitch = Math.max(
      -0.45,
      Math.min(0.55, cameraPitch + (e.clientY - lastPointerY) * 0.004)
    );
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
  }
  function stopCameraDrag(e) {
    if (e.pointerType === "touch") {
      touchPoints.delete(e.pointerId);
      pinchDistance = 0;
      dragPointer = null;
      if (touchPoints.size === 1) {
        const [pointerId, point] = [...touchPoints.entries()][0];
        dragPointer = pointerId;
        lastPointerX = point.x;
        lastPointerY = point.y;
      }
    } else if (e.pointerId === dragPointer) {
      dragPointer = null;
    }
  }
  function preventCameraMenu(e) {
    e.preventDefault();
  }
  function zoomCamera(e) {
    e.preventDefault();
    cameraZoom = Math.max(
      0.45,
      Math.min(2.8, cameraZoom * Math.exp(e.deltaY * 0.001))
    );
  }
  function addInteractionDoor() {
    interaction.door = b.userData.accessDoor;
    if (interaction.door) {
      interaction.door.rotation.set(0, 0, 0);
    }
  }
  function removeInteractionDoor() {
    if (!interaction?.door) {
      return;
    }
    interaction.door.rotation.set(0, 0, 0);
    interaction.door = null;
  }
  canvas.addEventListener("pointerdown", startCameraDrag);
  canvas.addEventListener("pointermove", moveCameraDrag);
  canvas.addEventListener("pointerup", stopCameraDrag);
  canvas.addEventListener("pointercancel", stopCameraDrag);
  canvas.addEventListener("contextmenu", preventCameraMenu);
  canvas.addEventListener("wheel", zoomCamera, {
    passive: false,
  });
  c.shadowMap.autoUpdate = false;
  c.shadowMap.needsUpdate = true;
  let P = 0;
  let F = c.getPixelRatio();
  let I = 1;
  let L = 0;
  let R = 0;
  let shadowFrameInterval = d ? 2 : 1;
  let slowWindows = 0;
  let fastWindows = 0;
  let fastWindowsNeeded = 4;
  let lastRaise = -Infinity;
  let skipWindow = false;
  O.ready.catch(() => {});

  let z = (e) => {
    O.resume();

    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
        e.code
      )
    ) {
      e.preventDefault();
    }

    A[e.code] = true;

    if (
      e.code === "KeyE" &&
      !e.repeat &&
      !h.state.onFoot &&
      h.state.station >= 0
    ) {
      i.current.onStation();
    }

    if (e.code === "Escape" && !e.repeat) {
      i.current.onPause();
    }
  };

  let ee = (e) => {
    A[e.code] = false;
  };

  let B = () => {
    Object.keys(A).forEach((e) => {
      return (A[e] = false);
    });
  };

  let V = () => {
    return O.resume();
  };

  let te = () => {
    if (!document.hidden) {
      O.resume();
    }
  };

  window.addEventListener("keydown", z);
  window.addEventListener("keyup", ee);
  window.addEventListener("blur", B);
  window.addEventListener("pointerdown", V);
  document.addEventListener("visibilitychange", te);
  l.position.set(0, 9, 85);
  let ne = new Vector3();
  let re = new Vector3();
  let ie = new Vector3();
  function ae(t) {
    j = requestAnimationFrame(ae);
    let n = (t - M) / 1000; /* 1e3 */
    let a = Math.min(n, 0.04);

    // a frame longer than a second means the tab was hidden, not that the game is slow
    M = t;

    if (n < 1) {
      (L += n), R++;
    }

    if (L > 1) {
      let t = L / R;
      let n = I;
      shadowFrameInterval = d ? 2 : t > 1 / 32 ? 3 : t > 1 / 48 ? 2 : 1;
      // resizing reallocates every post-processing target, so only react to sustained trends and
      // back off when a resolution increase did not hold
      if (skipWindow) {
        skipWindow = false;
      } else {
        slowWindows = t > 1 / 45 ? slowWindows + 1 : 0;
        fastWindows = t < 1 / 57 ? fastWindows + 1 : 0;

        if (slowWindows >= 2) {
          (n = Math.max(0.6, I - 0.1)),
            performance.now() - lastRaise < 8000 /* 8e3 */ &&
              (fastWindowsNeeded = Math.min(32, fastWindowsNeeded * 2));
        } else if (fastWindows >= fastWindowsNeeded) {
          (n = Math.min(1, I + 0.05)), (lastRaise = performance.now());
        }
      }

      if (n !== I) {
        (I = n),
          (slowWindows = 0),
          (fastWindows = 0),
          (skipWindow = true),
          c.setPixelRatio(F * I),
          f.setPixelRatio(F * I),
          f.setSize(e.clientWidth, e.clientHeight);
      }

      L = 0;
      R = 0;
    }

    let o = h.state;
    if (r.current.paused) {
      O.update(o.rpm, 0, true, false, o);
    } else {
      let wasOnFoot = o.onFoot;
      let oldX = o.x;
      let oldZ = o.z;

      h.update(
        a,
        {
          ...A,
          ...r.current.keys,
          ...(interaction
            ? {
                ArrowUp: false,
                ArrowDown: false,
                ArrowLeft: false,
                ArrowRight: false,
                KeyW: false,
                KeyA: false,
                KeyS: false,
                KeyD: false,
                KeyZ: false,
                KeyQ: false,
                KeyF: false,
                Space: false,
              }
            : {}),
        },
        h.state.onFoot ? footCameraYaw : h.state.heading + cameraYaw
      );

      if (wasOnFoot !== o.onFoot) {
        if (o.onFoot) {
          footCameraYaw = o.heading + cameraYaw;
        } else {
          cameraYaw = footCameraYaw - o.heading;
        }
      }

      if (wasOnFoot !== o.onFoot) {
        interaction = {
          direction: o.onFoot ? "exit" : "enter",
          elapsed: 0,
          duration: 1.3,
          carX: o.onFoot ? oldX : o.x,
          carZ: o.onFoot ? oldZ : o.z,
          heading: o.heading,
          startX: oldX,
          startZ: oldZ,
          endX: o.x,
          endZ: o.z,
          door: null,
        };
      }

      u.position.set(o.x + 40, 85, o.z - 25);
      u.target.position.set(o.x, 0, o.z);
      u.target.updateMatrixWorld();
      P++;

      if (P >= shadowFrameInterval) {
        (c.shadowMap.needsUpdate = true), (P = 0);
      }

      y(o.x, o.z);
      o._crash &&=
        (k.crash(o._crash.x, o._crash.y, o._crash.z, o._crash.intensity),
        O.crash(o._crash.intensity),
        null);

      if (o.playerVeh.spec !== x) {
        E(o.playerVeh);
      }

      if (interaction && interaction.door?.parent !== b) {
        addInteractionDoor();
      }

      b.visible = !o.onFoot || interaction?.direction === "exit";

      if (!o.onFoot) {
        b.position.set(o.x, (o.y || 0) + 0.12, o.z);
        b.rotation.y = o.heading;
        b.rotation.z = o.drifting ? Math.sin(o.elapsed * 7) * 0.015 : 0;

        b.userData.wheels.forEach((e) => {
          return (e.rotation.x -= o.speed * 0.01 * a);
        });

        let e = o.brake > 0 || (o.speed > 5 && o.throttle === 0);
        b.userData.brakeLights.forEach((t) => {
          return (t.material.emissiveIntensity = e ? 1.5 : 0.15);
        });
      }

      C.visible = !!o.onFoot;

      if (o.onFoot) {
        C.position.set(o.x, o.y || 0, o.z),
          (C.rotation.y = o.footYaw || 0),
          __animPerson(C, a, o.x, o.z);
      }

      S.forEach((e, n) => {
        let r = o.police[n];
        e.visible = !r.onFoot;

        if (!r.onFoot) {
          e.position.set(r.x, Uw(r.x, r.z) + 0.1, r.z),
            (e.rotation.y = r.heading);
        }

        let i =
          e.userData.blueLight === undefined
            ? (e.userData.blueLight = e.getObjectByName("blue") || null)
            : e.userData.blueLight;

        let a =
          e.userData.redLight === undefined
            ? (e.userData.redLight = e.getObjectByName("red") || null)
            : e.userData.redLight;

        if (i) {
          i.visible = !r.onFoot && Math.sin(t * 0.018) > 0;
        }

        if (a) {
          a.visible = !r.onFoot && Math.sin(t * 0.018) <= 0;
        }
      });

      w.forEach((e, t) => {
        let n = o.police[t];
        e.visible = !!n.onFoot;

        if (n.onFoot) {
          e.position.set(n.x, Uw(n.x, n.z), n.z),
            (e.rotation.y = n.heading),
            __animPerson(e, a, n.x, n.z);
        }
      });

      D();
      if (interaction) {
        interaction.elapsed += a;
        const time = Math.min(interaction.elapsed / interaction.duration, 1);
        const ease = (e) => {
          return e * e * (3 - 2 * e);
        };
        const open =
          ease(Math.min(time / 0.2, 1)) *
          (1 - ease(Math.max(0, (time - 0.78) / 0.22)));
        if (interaction.door) {
          interaction.door.rotation.y = -open * 1.12;
        }
        const sideX = interaction.carX - Math.cos(interaction.heading) * 1.45;
        const sideZ = interaction.carZ + Math.sin(interaction.heading) * 1.45;
        if (interaction.direction === "exit") {
          const step = ease(Math.max(0, Math.min((time - 0.16) / 0.56, 1)));
          C.visible = true;
          C.position.set(
            sideX + (interaction.endX - sideX) * step,
            0,
            sideZ + (interaction.endZ - sideZ) * step
          );
          C.rotation.y = interaction.heading;
          C.scale.setScalar(0.78 + 0.22 * ease(Math.min(time / 0.42, 1)));
          b.position.set(
            interaction.carX,
            Uw(interaction.carX, interaction.carZ) + 0.1,
            interaction.carZ
          );
          b.rotation.y = interaction.heading;
        } else {
          const approach = ease(Math.min(time / 0.48, 1));
          const enter = ease(Math.max(0, Math.min((time - 0.42) / 0.34, 1)));
          C.visible = time < 0.84;
          C.position.set(
            interaction.startX +
              (sideX - interaction.startX) * approach +
              (interaction.carX - sideX) * enter,
            0.12 * Math.sin(Math.PI * enter),
            interaction.startZ +
              (sideZ - interaction.startZ) * approach +
              (interaction.carZ - sideZ) * enter
          );
          C.rotation.y = interaction.heading;
          C.scale.setScalar(1 - 0.72 * enter);
        }
        const limbs = C.userData.L;
        if (limbs && time < 0.84) {
          const crouch = Math.sin(Math.PI * Math.min(time / 0.84, 1));
          limbs.body.position.y = 0.08 * crouch;
          limbs.body.rotation.x = -0.18 * crouch;
          limbs.la.rotation.x = -0.8 * crouch;
          limbs.ra.rotation.x = -0.8 * crouch;
          limbs.lh.rotation.x = 0.18 * crouch;
          limbs.rh.rotation.x = -0.18 * crouch;
        }
        if (time >= 1) {
          removeInteractionDoor();
          C.scale.setScalar(1);
          interaction = null;
        }
      }
      let e = Math.min(o.speed / 200, 1);
      updateTrafficLights(a);
      const targetFov = 45 + e * 12;
      if (l.fov !== targetFov) {
        l.fov = targetFov;
        l.updateProjectionMatrix();
      }
      const inStore = o.onFoot && o.store >= 0;
      let n = inStore ? 4.2 : 12 + e * 3;
      let s = inStore ? 2.2 : 7.5 + e * 1.5;
      let cameraHeading = o.onFoot ? footCameraYaw : o.heading + cameraYaw;
      let cameraDistance = Math.hypot(n, s - 1) * cameraZoom;
      let cameraAngle = Math.atan2(s - 1, n) + cameraPitch;

      re.set(
        o.x + Math.sin(cameraHeading) * Math.cos(cameraAngle) * cameraDistance,
        (o.y || 0) + 1 + Math.sin(cameraAngle) * cameraDistance,
        o.z + Math.cos(cameraHeading) * Math.cos(cameraAngle) * cameraDistance
      );

      l.position.lerp(re, 1 - Math.exp(-a * (o.onFoot ? 12 : 4.5)));

      if (o.shake > 0.01) {
        ie.set(
          (Math.random() - 0.5) * o.shake * 0.8,
          (Math.random() - 0.5) * o.shake * 0.5,
          (Math.random() - 0.5) * o.shake * 0.8
        ),
          l.position.add(ie);
      }

      ne.set(o.x, (o.y || 0) + 1, o.z);
      l.lookAt(ne);
      k.update(o, a, l);
      O.update(o.rpm, o.pedal, r.current.muted, o.drifting, o);

      if (wasOnFoot && !o.onFoot) {
        O.startEngine();
      }

      N += a;

      if (N > 0.09) {
        (N = 0),
          i.current.onHud({
            ...o,
            police: o.police.map((e) => {
              return {
                ...e,
              };
            }),
          });
      }

      if (o.ended && !r.current.finished) {
        (r.current.finished = true),
          (r.current.paused = true),
          i.current.onFinish({
            ...o,
            credits: Math.floor(o.score / 12 + o.elapsed * 2),
          });
      }
    }
    f.render();
  }
  dfcWarmUp(c, s, l, [t.color]);

  if (debugSession) {
    debugSession.fx = k;
  }

  j = requestAnimationFrame(ae);

  return {
    setCar(e) {
      h.setCar(e);
      s.remove(b);

      b.traverse((e) => {
        e.geometry?.dispose();
        e.material?.dispose();
      });

      b = dfcBatchCar(Vw(e.color, e.shape, false, true));
      s.add(b);
      x = `player|${e.color}|${e.shape}`;
    },
    dispose() {
      cancelAnimationFrame(j);
      removeInteractionDoor();
      canvas.removeEventListener("pointerdown", startCameraDrag);
      canvas.removeEventListener("pointermove", moveCameraDrag);
      canvas.removeEventListener("pointerup", stopCameraDrag);
      canvas.removeEventListener("pointercancel", stopCameraDrag);
      canvas.removeEventListener("contextmenu", preventCameraMenu);
      canvas.removeEventListener("wheel", zoomCamera);
      window.removeEventListener("keydown", z);
      window.removeEventListener("keyup", ee);
      window.removeEventListener("blur", B);
      window.removeEventListener("pointerdown", V);
      document.removeEventListener("visibilitychange", te);
      O.close();
      o.dispose();
    },
  };
}
function UE({ car: e }) {
  let t = React.useRef(null);

  React.useEffect(() => {
    return cE(t.current, e);
  }, [e.id]);

  return (
    <div
      ref={t}
      className="absolute inset-0"
      aria-label={`Aperçu 3D de ${e.name}`}
    />
  );
}
function DE({
  car: e,
  engine: t,
  onGarage: n,
  onStart: r,
  noPolice: i,
  onToggleNoPolice: a,
}) {
  return (
    <div className="garage-panel flex flex-col p-6 md:p-7">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Votre configuration</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#c6dc77]" />
      </div>
      <div className="mt-7 flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[.14em] text-[#a2acae]">{e.tag}</p>
          <h2 className="race-title mt-2 text-4xl">{e.name}</h2>
        </div>
        <span className="rounded-md bg-[#c6dc77]/10 px-2 py-1 text-[9px] font-bold text-[#c6dc77]">
          PRÊT À ROULER
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#899295]">
        {e.description}
      </p>
      <button
        onClick={() => {
          return n("cars");
        }}
        className="mt-5 flex w-full items-center justify-between rounded-lg border border-[#3c4447] px-4 py-3 text-xs font-semibold hover:bg-white/5"
      >
        Changer de voiture
        <ChevronRightIcon size={15} />
      </button>
      <div className="my-6 h-px bg-white/10" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/5 p-2.5 text-[#b6c2c3]">
            {<Settings2Icon size={19} />}
          </div>
          <div>
            <div className="eyebrow !text-[8px]">Bloc moteur</div>
            <div className="mt-1 text-sm font-semibold">{t.name}</div>
          </div>
        </div>
        <button
          onClick={() => {
            return n("engines");
          }}
          className="rounded-md border border-white/10 p-2 text-[#c6dc77] hover:bg-white/5"
          aria-label="Changer de moteur"
        >
          {<ArrowUpRightIcon size={16} />}
        </button>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2">
        <div>
          <p className="eyebrow !text-[8px]">Puissance</p>
          <p className="mt-1 font-heading text-2xl font-semibold">
            {t.hp}
            <span className="ml-1 font-body text-[9px] text-[#8b9395]">CH</span>
          </p>
        </div>
        <div>
          <p className="eyebrow !text-[8px]">Couple</p>
          <p className="mt-1 font-heading text-2xl font-semibold">
            {t.torque}
            <span className="ml-1 font-body text-[9px] text-[#8b9395]">NM</span>
          </p>
        </div>
        <div>
          <p className="eyebrow !text-[8px]">Vitesse max.</p>
          <p className="mt-1 font-heading text-2xl font-semibold">
            {Math.round(t.max * 3.6)}
            <span className="ml-1 font-body text-[9px] text-[#8b9395]">
              KM/H
            </span>
          </p>
        </div>
      </div>
      <button
        onClick={() => {
          return n("engines");
        }}
        className="mt-5 flex items-center justify-between text-[11px] text-[#929c9e] hover:text-white"
      >
        Changer de moteur
        <ChevronRightIcon size={14} />
      </button>
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="eyebrow !text-[8px]">Mode de jeu</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#c6dc77]" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (i) {
                a();
              }
            }}
            className={`rounded-lg border px-3 py-3 text-left ${
              i
                ? "border-[#3c4447] hover:bg-white/5"
                : "border-[#c6dc77] bg-[#c6dc77]/10"
            }`}
          >
            <div className="text-[11px] font-semibold text-white">
              Poursuite
            </div>
            <div className="mt-1 text-[9px] text-[#8f989b]">
              Police et évasion
            </div>
          </button>
          <button
            onClick={() => {
              if (!i) {
                a();
              }
            }}
            className={`rounded-lg border px-3 py-3 text-left ${
              i
                ? "border-[#c6dc77] bg-[#c6dc77]/10"
                : "border-[#3c4447] hover:bg-white/5"
            }`}
          >
            <div className="text-[11px] font-semibold text-white">
              Sans police
            </div>
            <div className="mt-1 text-[9px] text-[#8f989b]">
              Conduite libre · casse
            </div>
          </button>
        </div>
        {i && (
          <p className="mt-2 text-[9px] leading-relaxed text-[#8f989b]">
            Les chocs abîment la voiture selon la vitesse d'impact : perte de
            puissance, tenue de route dégradée et fumée du capot.
          </p>
        )}
      </div>
      <button
        onClick={r}
        className="lime-button mt-5 flex items-center justify-between px-5 py-4 text-[13px]"
      >
        LANCER LA SESSION
        <ArrowUpRightIcon size={21} />
      </button>
      <p className="mt-3 text-center text-[9px] tracking-[.08em] text-[#738080]">
        MONDE OUVERT • CONDUITE LIBRE
      </p>
    </div>
  );
}
var fE = [
  {
    name: "Centre-ville",
    subtitle: "VIRAGES SERRÉS",
    icon: Building2Icon,
    number: "01",
    className: "bg-[#233035]",
    lines:
      "M-10 80 L150 80 M-10 43 L150 43 M32 -10 L32 140 M76 -10 L76 140 M115 -10 L115 140",
  },
  {
    name: "Autoroute A9",
    subtitle: "VITESSE PURE",
    icon: RouteIcon,
    number: "02",
    className: "bg-[#32372b]",
    lines: "M-10 115 L150 -15 M10 135 L170 5 M-30 95 L130 -35",
  },
  {
    name: "Montagne Kuro",
    subtitle: "LE PARADIS DU DRIFT",
    icon: MountainIcon,
    number: "03",
    className: "bg-[#302e32]",
    lines: "M-10 100 C90 115 -5 65 75 55 S 15 5 150 5",
  },
];
function PE() {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="eyebrow">Un monde. Trois terrains de jeu.</h3>
        <span className="text-[9px] text-[#626e70]">TOUT EST CONNECTÉ</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {fE.map((e) => {
          return (
            <div
              className={`relative overflow-hidden rounded-xl border border-white/5 p-5 ${e.className}`}
              key={e.number}
            >
              <svg
                className="absolute -right-5 -top-4 h-36 w-36 opacity-15"
                viewBox="0 0 150 140"
              >
                <path
                  d={e.lines}
                  stroke="#d7ddd1"
                  strokeWidth="9"
                  fill="none"
                />
                <path
                  d={e.lines}
                  stroke="#101315"
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray="4 5"
                />
              </svg>
              <div className="relative flex items-center justify-between">
                <e.icon size={20} className="text-[#c6d0c5]" />
                <span className="font-heading text-2xl text-white/20">
                  {e.number}
                </span>
              </div>
              <h3 className="relative mt-6 font-heading text-[25px] font-semibold">
                {e.name}
              </h3>
              <p className="relative mt-1 text-[8px] tracking-[.16em] text-[#98a39d]">
                {e.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
function ME({
  progress: e,
  car: t,
  engine: n,
  onGarage: r,
  onStart: i,
  muted: a,
  onMute: o,
  noPolice: s,
  onToggleNoPolice: c,
}) {
  return (
    <div className="nightshift subtle-grid">
      <Om progress={e} muted={a} onMute={o} />
      <main className="mx-auto max-w-[1440px] px-5 pb-5 pt-8 md:px-10 md:pt-10">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c6dc77]" />
              <span className="eyebrow !text-[#b3c578]">
                LE GARAGE / SESSION LIBRE
              </span>
            </div>
            <h1 className="race-title text-5xl md:text-[64px]">
              {"LA NUIT VOUS "}
              <span className="text-[#c6dc77]">APPARTIENT.</span>
            </h1>
            <p className="mt-3 text-[12px] leading-6 text-[#8f989b]">
              Trouvez votre trajectoire. Faites monter le score. Semez la
              police.
            </p>
          </div>
          <div className="hidden items-center gap-3 pb-1 md:flex">
            <TrophyIcon size={20} className="text-[#8b967c]" />
            <div>
              <p className="eyebrow !text-[8px]">Meilleur drift</p>
              <p className="mt-1 text-sm font-semibold">
                {Math.floor(e.best).toLocaleString("fr-FR")}{" "}
                <span className="text-[10px] font-normal text-[#748081]">
                  PTS
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_350px]">
          <div className="relative min-h-[350px] overflow-hidden rounded-2xl border border-white/10 bg-[#171b1e] md:min-h-[430px]">
            <UE car={t} />
            <div className="absolute left-6 top-6">
              <p className="eyebrow !text-[9px]">SÉLECTION ACTUELLE</p>
              <h2 className="race-title mt-2 text-[40px]">
                {t.name.toUpperCase()}
              </h2>
              <span className="mt-3 inline-block rounded border border-white/15 bg-[#101315]/60 px-2 py-1 text-[9px] tracking-[.14em] text-[#aab4b5]">
                {n.id}
                {" • PROPULSION"}
              </span>
            </div>
            <div className="absolute right-6 top-6 flex gap-1.5">
              {[t.color, "#13181b", "#c6dc77"].map((e, t) => {
                return (
                  <span
                    className={`h-3 w-3 rounded-full ${
                      t === 0
                        ? "ring-1 ring-white/40 ring-offset-2 ring-offset-[#171b1e]"
                        : ""
                    }`}
                    style={{
                      background: e,
                    }}
                    key={t}
                  />
                );
              })}
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <span className="text-[9px] tracking-[.12em] text-[#8e999b]">
                {"01 / "}
                {String(e.cars.length).padStart(2, "0")}
                {" VÉHICULES DÉBLOQUÉS"}
              </span>
              <button
                onClick={() => {
                  return r("cars");
                }}
                className="flex items-center gap-2 text-[10px] text-[#c6dc77]"
              >
                OUVRIR LE GARAGE
                <ArrowUpRightIcon size={15} />
              </button>
            </div>
          </div>
          <DE
            car={t}
            engine={n}
            onGarage={r}
            onStart={i}
            noPolice={s}
            onToggleNoPolice={c}
          />
        </div>
        <PE />
        <footer className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center gap-4 text-[9px] text-[#818d90]">
            <span className="flex items-center gap-2">
              <kbd className="race-key">Z Q S D</kbd>
              {" / FLÈCHES • CONDUIRE"}
            </span>
            <span className="flex items-center gap-2">
              <kbd className="race-key">ESPACE</kbd>
              {" FREIN À MAIN"}
            </span>
            <span className="flex items-center gap-2">
              <kbd className="race-key">E</kbd>
              {" STATION"}
            </span>
            <span className="flex items-center gap-2">
              <kbd className="race-key">ESC</kbd>
              {" PAUSE"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-[#7e8986]">
            <ShieldAlertIcon size={13} />
            <span>LES RUES N'ONT PAS DE RÈGLES. LA POLICE, SI.</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
function HE({
  type: e,
  progress: t,
  onSelect: n,
  onClose: r,
  station: i = false,
}) {
  let a = e === "cars";
  let o = a ? t.cars : t.engines;
  let s = a ? t.car : t.engine;

  let c = (a ? Qp : tm).filter((e) => {
    return !i || o.includes(e.id);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={a ? "Garage" : "Atelier moteur"}
    >
      {
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#171c1f] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <div>
              <p className="eyebrow text-[#c6dc77]">
                {i ? "STATION-SERVICE • ÉCHANGE RAPIDE" : "NIGHTSHIFT / GARAGE"}
              </p>
              <h2 className="race-title mt-2 text-4xl">
                {a ? "CHOISISSEZ VOTRE VOITURE." : "CHOISISSEZ VOTRE MOTEUR."}
              </h2>
            </div>
            <button
              onClick={r}
              aria-label="Fermer"
              className="rounded-lg p-2 text-[#929b9d] hover:bg-white/5"
            >
              {<XIcon size={22} />}
            </button>
          </div>
          <div className="max-h-[65vh] overflow-y-auto p-5">
            {
              <div className="grid gap-3 sm:grid-cols-2">
                {c.map((e) => {
                  let r = o.includes(e.id);
                  let i = s === e.id;
                  return (
                    <div
                      className={`rounded-xl border p-5 ${
                        i
                          ? "border-[#c6dc77]/60 bg-[#c6dc77]/5"
                          : "border-white/10 bg-[#202629]"
                      }`}
                      key={e.id}
                    >
                      <div className="flex items-center justify-between">
                        <span className="eyebrow !text-[8px]">
                          {a ? e.tag : `${e.hp} CH • ${e.torque} NM`}
                        </span>
                        {i ? (
                          <CheckIcon size={17} className="text-[#c6dc77]" />
                        ) : r ? null : (
                          <LockKeyholeIcon
                            size={15}
                            className="text-[#717c7f]"
                          />
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        {a ? (
                          <div
                            className="h-5 w-9 -skew-x-12 rounded-sm border-b-4 border-black/40"
                            style={{
                              background: e.color,
                            }}
                          />
                        ) : (
                          <span className="font-heading text-3xl font-bold text-[#c6dc77]">
                            {e.id}
                          </span>
                        )}
                        <h3 className="font-heading text-2xl font-semibold">
                          {e.name}
                        </h3>
                      </div>
                      <p className="mt-3 min-h-9 text-[11px] leading-relaxed text-[#929d9f]">
                        {e.description}
                      </p>
                      <button
                        disabled={i || (!r && t.credits < e.price)}
                        onClick={() => {
                          return n(e.id);
                        }}
                        className={`mt-4 flex w-full items-center justify-between rounded-lg px-4 py-3 text-xs font-semibold ${
                          i
                            ? "bg-white/5 text-[#c6dc77]"
                            : r
                            ? "bg-[#c6dc77] text-[#172010]"
                            : "border border-white/15 text-[#d2d8d4]"
                        }`}
                      >
                        <span>
                          {i
                            ? "Équipé"
                            : r
                            ? "Équiper"
                            : `Débloquer • ${e.price.toLocaleString(
                                "fr-FR"
                              )} CR`}
                        </span>
                        {i ? (
                          <CheckIcon size={14} />
                        ) : (
                          <ArrowUpRightIcon size={16} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            }
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 text-[10px] text-[#859194]">
            <span>
              {i
                ? "Le véhicule est remplacé, votre session continue."
                : "Gagnez des crédits en driftant et en survivant aux poursuites."}
            </span>
            <span className="ml-3 flex shrink-0 items-center gap-2 text-[#c6dc77]">
              <CoinsIcon size={14} />
              {t.credits.toLocaleString("fr-FR")}
              {" CR"}
            </span>
          </div>
        </div>
      }
    </div>
  );
}
function GE({
  car: e,
  engine: t,
  controls: n,
  onHud: r,
  onFinish: i,
  onStation: a,
  onPause: o,
  noPolice: s,
}) {
  let c = React.useRef(null);
  let l = React.useRef(null);

  let u = React.useRef({
    onHud: r,
    onFinish: i,
    onStation: a,
    onPause: o,
  });

  u.current = {
    onHud: r,
    onFinish: i,
    onStation: a,
    onPause: o,
  };

  React.useEffect(() => {
    l.current = lE(c.current, e, t, n, u, s);

    return () => {
      return l.current.dispose();
    };
  }, []);

  React.useEffect(() => {
    l.current?.setCar(e);
  }, [e.id]);

  return <div ref={c} className="absolute inset-0" />;
}
function _E({ hud: e }) {
  let t = (e) => {
    return ((e + 180) / 395) * 140 + 10;
  };

  let n = (e) => {
    return ((e + 530) / 730) * 145 + 8;
  };

  return (
    <div className="hud-glass hidden w-[165px] p-3 sm:block">
      <div className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-[#a0b0b0]">
        {e.zone}
      </div>
      <svg viewBox="0 0 160 165" className="h-[160px] w-full">
        <rect width="160" height="165" rx="6" fill="#1d2d2d" />
        <path
          d="M122 3 V161 M48 5 C5 30 79 42 40 64 S75 76 67 82"
          stroke="#75878b"
          strokeWidth="4"
          fill="none"
        />
        {[-100, -50, 0, 50, 100].map((e) => {
          return (
            <g key={e}>
              {
                <path
                  d={`M${t(e)} ${n(-150)}V${n(150)} M${t(-135)} ${n(e)}H${t(
                    130
                  )}`}
                  stroke="#718184"
                  strokeWidth="2"
                />
              }
            </g>
          );
        })}
        {nm.map((e, r) => {
          return (
            <rect
              x={t(e.x) - 2}
              y={n(e.z) - 2}
              width="4"
              height="4"
              fill="#c6dc77"
              key={r}
            />
          );
        })}
        {e.police?.map((r, i) => {
          return (
            <circle
              cx={t(r.x)}
              cy={n(r.z)}
              r="2.5"
              fill={e.wanted > 0.15 ? "#f77d69" : "#77b5f7"}
              key={i}
            />
          );
        })}
        <g
          transform={`translate(${t(e.x)} ${n(e.z)}) rotate(${
            (-e.heading * 180) / Math.PI
          })`}
        >
          <circle r="7" fill="#c6dc77" opacity=".15" />
          <path d="M0 -5 L3 4 L0 2 L-3 4Z" fill="#e8f7b8" />
        </g>
      </svg>
      <div className="mt-2 flex justify-between text-[7px] tracking-wider text-[#93a39b]">
        <span>■ STATION</span>
        <span className="text-[#88b7ef]">● POLICE</span>
      </div>
    </div>
  );
}
function VE({ hud: e }) {
  return (
    <div className="mt-3 flex items-center justify-between border-t border-game-accent/15 pt-3">
      <span className="text-[8px] tracking-widest text-primary-foreground/65">
        BOÎTE AUTO · 7 RAPPORTS
      </span>
      <span
        className="flex items-baseline gap-1.5 text-game-accent"
        aria-label={
          e.gear === -1 ? "Marche arrière" : `Rapport ${e.gear} sur 7`
        }
      >
        <span className="race-title text-3xl tabular-nums">
          {e.gear === -1 ? "R" : e.gear}
        </span>
        {e.gear !== -1 && <span className="text-[10px] opacity-60">/ 7</span>}
      </span>
    </div>
  );
}
function YE({
  hud: e,
  engine: t,
  muted: n,
  onMute: r,
  onPause: i,
  onStation: a,
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="hud-glass px-4 py-3">
          <div className="eyebrow !text-[#c6dc77]">
            {"NIGHTSHIFT / "}
            {e.zone}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="race-title text-4xl">
              {Math.floor(e.score).toLocaleString("fr-FR")}
            </span>
            <span className="text-[9px] text-[#879b9c]">PTS DRIFT</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="pointer-events-auto flex gap-2">
            <button
              onClick={r}
              className="hud-glass p-3"
              aria-label="Activer ou couper le son"
            >
              {n ? <VolumeXIcon size={17} /> : <Volume2Icon size={17} />}
            </button>
            <button onClick={i} className="hud-glass p-3" aria-label="Pause">
              {<PauseIcon size={17} />}
            </button>
          </div>
          <div className="hud-glass px-3 py-2">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((t) => {
                return (
                  <StarIcon
                    size={18}
                    fill={Math.ceil(e.wanted) >= t ? "#f2ad73" : "transparent"}
                    className={
                      Math.ceil(e.wanted) >= t
                        ? "text-[#f2ad73]"
                        : "text-[#637177]"
                    }
                    key={t}
                  />
                );
              })}
            </div>
            {e.escape > 0 && e.wanted > 0.15 && (
              <p className="mt-2 text-[9px] text-[#c6dc77]">
                {"ÉVASION DANS "}
                {Math.ceil(5 - e.escape)}
                {" S"}
              </p>
            )}
          </div>
        </div>
      </div>
      {e.audioLoading && (
        <div
          role="status"
          className="hud-glass absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-4 text-center text-xs text-primary-foreground"
        >
          <span className="mb-3 block h-5 w-5 animate-spin rounded-full border-2 border-game-accent/25 border-t-game-accent mx-auto" />
          Chargement du son moteur…
        </div>
      )}
      {e.drifting && (
        <div className="absolute left-1/2 top-[28%] -translate-x-1/2 text-center">
          <span className="race-title text-6xl italic text-[#c6dc77] drop-shadow-lg">
            DRIFT ×{e.combo}
          </span>
          <p className="mt-2 text-[10px] font-bold tracking-[.3em] text-white">
            GARDEZ L'ANGLE.
          </p>
        </div>
      )}
      {e.arrest > 0 && (
        <div className="absolute left-1/2 top-36 w-60 -translate-x-1/2 rounded-lg bg-[#301c1dee] p-3 text-center">
          <div className="text-[10px] font-bold tracking-widest text-[#ff827a]">
            {"PRISON DANS "}
            {Math.ceil(5 - (e.arrestTimer || 0))}
            {" S"}
          </div>
          <div className="game-meter mt-2">
            {
              <div
                className="bg-[#f87970]"
                style={{
                  width: `${e.arrest}%`,
                }}
              />
            }
          </div>
        </div>
      )}
      {!e.onFoot && e.station >= 0 && (
        <button
          onClick={a}
          className="pointer-events-auto absolute left-1/2 top-[55%] -translate-x-1/2 rounded-xl border border-[#c6dc77]/40 bg-[#18251eee] px-5 py-4 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#c6dc77]">
            <FuelIcon size={16} />
            {"RAVITAILLEMENT • "}
            {Math.round(e.fuel)}%
          </div>
          <p className="mt-2 text-[10px] text-white">
            <kbd className="race-key">E</kbd>
            {" Changer de voiture"}
          </p>
        </button>
      )}
      {e.onFoot && (
        <div className="absolute left-1/2 top-24 -translate-x-1/2 rounded-lg bg-[#18251eee] px-4 py-2 text-xs text-[#c6dc77] border border-[#c6dc77]/30">
          {"À PIED • Approchez-vous d'un véhicule et appuyez sur "}
          <kbd className="race-key">F</kbd>
        </div>
      )}
      {e.onFoot && (e.shop >= 0 || e.store >= 0) && (
        <div className="absolute left-1/2 top-36 -translate-x-1/2 rounded-lg border border-[#c6dc77]/30 bg-[#18251eee] px-4 py-2 text-center text-xs text-[#e8eddf]">
          {e.store >= 0
            ? "NORTHLINE DÉPANNEUR • Bienvenue, entrez !"
            : "DÉPANNEUR OUVERT • Traversez la porte pour entrer"}
        </div>
      )}
      {e.fuel === 0 && (
        <div className="absolute left-1/2 top-24 -translate-x-1/2 rounded-lg bg-[#421e15e6] px-4 py-2 text-xs text-[#ffd0a9]">
          PANNE SÈCHE • Rejoignez une station
        </div>
      )}
      <div className="absolute bottom-6 left-6">{<_E hud={e} />}</div>
      <div className="hud-glass absolute bottom-6 right-6 w-48 p-4 sm:w-56">
        <div className="flex items-end justify-between">
          <span className="race-title text-6xl tabular-nums">{e.speed}</span>
          <div className="pb-1 text-right">
            <div className="text-[10px] text-[#a2b5b7]">KM/H</div>
            <div className="mt-1 text-xs font-semibold text-[#c6dc77]">
              {t.id}
            </div>
          </div>
        </div>
        <VE hud={e} />
        <div className="mt-3 flex gap-1">
          {Array.from(
            {
              length: 16,
            },
            (t, n) => {
              return (
                <div
                  className={`h-2 flex-1 rounded-sm ${
                    e.rpm / (e.redline || 8000) /* 8e3 */ > n / 16
                      ? n > 12
                        ? "bg-[#ed8974]"
                        : "bg-[#c6dc77]"
                      : "bg-white/10"
                  }`}
                  key={n}
                />
              );
            }
          )}
        </div>
        <div className="mt-2 flex justify-between text-[8px] text-[#a0adb0]">
          <span>
            {e.rpm}
            {" RPM"}
          </span>
          <span>PROPULSION</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <FuelIcon
            size={13}
            className={e.fuel < 20 ? "text-[#ed8974]" : "text-[#a5b6ac]"}
          />
          <div className="game-meter flex-1">
            {
              <div
                className={e.fuel < 20 ? "bg-[#ed8974]" : "bg-[#c6dc77]"}
                style={{
                  width: `${e.fuel}%`,
                }}
              />
            }
          </div>
          <span className="w-8 text-right text-[9px]">
            {Math.round(e.fuel)}%
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <ShieldIcon size={13} className="text-[#a5b6ac]" />
          <div className="game-meter flex-1">
            {
              <div
                className={e.health < 30 ? "bg-[#ed8974]" : "bg-[#97b1c4]"}
                style={{
                  width: `${e.health}%`,
                }}
              />
            }
          </div>
          <span className="w-8 text-right text-[9px]">
            {Math.round(e.health)}%
          </span>
        </div>
      </div>
    </div>
  );
}
function BE({ controls: e }) {
  let t = React.useRef({});

  let n = (n, r) => {
    let i = t.current;

    if (r) {
      (i[n] = (i[n] || 0) + 1), (e.current.keys[n] = true);
    } else {
      (i[n] = Math.max(0, (i[n] || 0) - 1)),
        i[n] <= 0 && delete e.current.keys[n];
    }
  };

  let r = (e) => {
    return {
      onTouchStart: (t) => {
        t.preventDefault();
        n(e, true);
      },

      onTouchEnd: (t) => {
        t.preventDefault();
        n(e, false);
      },

      onTouchCancel: () => {
        return n(e, false);
      },

      onContextMenu: (e) => {
        return e.preventDefault();
      },
    };
  };

  return (
    <div className="touch-controls pointer-events-none absolute bottom-52 left-3 right-3 z-20 flex items-end justify-between gap-1.5 sm:bottom-6 sm:left-52 sm:right-72 xl:hidden">
      <div className="touch-group pointer-events-auto flex gap-1.5">
        <div
          className="touch-button"
          role="button"
          aria-label="Tourner à gauche"
          {...r("ArrowLeft")}
        >
          {<ArrowLeftIcon />}
        </div>
        <div
          className="touch-button"
          role="button"
          aria-label="Tourner à droite"
          {...r("ArrowRight")}
        >
          {<ArrowRightIcon />}
        </div>
      </div>
      <div className="touch-group pointer-events-auto flex gap-1.5">
        <div
          className="touch-button !w-12 text-[9px] font-bold"
          role="button"
          {...r("Space")}
        >
          DRIFT
        </div>
        <div
          className="touch-button !w-14 text-[9px] font-bold"
          role="button"
          aria-label="Sortir ou entrer dans un véhicule"
          {...r("KeyF")}
        >
          PIED
        </div>
        <div
          className="touch-button"
          role="button"
          aria-label="Freiner"
          {...r("ArrowDown")}
        >
          {<ArrowDownIcon />}
        </div>
        <div
          className="touch-button !border-[#c6dc77]/60 !bg-[#c6dc77]/25"
          role="button"
          aria-label="Accélérer"
          {...r("ArrowUp")}
        >
          {<ArrowUpIcon />}
        </div>
      </div>
    </div>
  );
}
function XE({ result: e, onReturn: t }) {
  let [n, r] = React.useState(9);

  React.useEffect(() => {
    let e = setInterval(() => {
      return r((e) => {
        return e - 1;
      });
    }, 1000 /* 1e3 */);
    return () => {
      return clearInterval(e);
    };
  }, []);

  React.useEffect(() => {
    if (n <= 0) {
      t();
    }
  }, [n, t]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0c1215]/90 p-5 backdrop-blur-md">
      {
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#e89978]/30 bg-[#e89978]/10 text-[#e89978]">
            {<ShieldAlertIcon size={27} />}
          </div>
          <p className="eyebrow !text-[#e89978]">FIN DE SESSION</p>
          <h2 className="race-title mt-4 text-6xl">{e.reason.toUpperCase()}</h2>
          <p className="mt-4 text-xs text-[#95a0a2]">
            {e.reason === "Session terminée"
              ? "Votre session est enregistrée. À vous la prochaine sortie."
              : "La prochaine trajectoire sera la bonne."}
          </p>
          <div className="garage-panel mt-8 grid grid-cols-2 divide-x divide-white/10 py-6">
            <div>
              <TrophyIcon className="mx-auto text-[#c6dc77]" size={20} />
              <p className="race-title mt-3 text-4xl">
                {Math.floor(e.score).toLocaleString("fr-FR")}
              </p>
              <p className="eyebrow mt-2 !text-[8px]">POINTS DE DRIFT</p>
            </div>
            <div>
              <CoinsIcon className="mx-auto text-[#c6dc77]" size={20} />
              <p className="race-title mt-3 text-4xl">
                +{e.credits.toLocaleString("fr-FR")}
              </p>
              <p className="eyebrow mt-2 !text-[8px]">CRÉDITS GAGNÉS</p>
            </div>
          </div>
          <button
            onClick={t}
            className="lime-button mt-6 flex w-full items-center justify-between p-4 text-xs"
          >
            RETOURNER AU GARAGE
            <ArrowUpRightIcon size={20} />
          </button>
          <p className="mt-4 text-[10px] text-[#738084]">
            {"Retour automatique dans "}
            {Math.max(0, n)}
            {" secondes"}
          </p>
        </div>
      }
    </div>
  );
}
function SE({ onResume: e, onEnd: t }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0c1215]/80 p-6 backdrop-blur-md">
      {
        <div className="w-full max-w-sm">
          <p className="eyebrow !text-[#c6dc77]">NIGHTSHIFT / SESSION</p>
          <h2 className="race-title mb-8 mt-3 text-6xl">UNE PAUSE.</h2>
          <button
            onClick={e}
            className="lime-button flex w-full items-center justify-between p-4 text-xs"
          >
            REPRENDRE
            <PlayIcon size={17} />
          </button>
          <button
            onClick={t}
            className="mt-3 flex w-full items-center justify-between rounded-lg border border-white/15 p-4 text-xs text-[#c6cdce]"
          >
            TERMINER LA SESSION
            <LogOutIcon size={17} />
          </button>
          <p className="mt-4 text-[10px] text-[#849395]">
            Vos points et vos crédits seront conservés.
          </p>
        </div>
      }
    </div>
  );
}
function CE() {
  let [e, t] = React.useState(rm);
  let [n, r] = React.useState("lobby");
  let [i, a] = React.useState(null);
  let [o, s] = React.useState(am);
  let [c, l] = React.useState(null);
  let [u, d] = React.useState(false);
  let [f, p] = React.useState(false);
  let [m, h] = React.useState(false);

  let g = React.useRef({
    keys: {},
    paused: false,
    muted: false,
    finished: false,
  });

  let v =
    Qp.find((t) => {
      return t.id === e.car;
    }) || Qp[0];

  let y =
    tm.find((t) => {
      return t.id === e.engine;
    }) || tm[0];

  React.useEffect(() => {
    return im(e);
  }, [e]);

  React.useEffect(() => {
    g.current.paused = !!(u || i || c);

    if (g.current.paused) {
      g.current.keys = {};
    }
  }, [u, i, c]);

  React.useEffect(() => {
    g.current.muted = f;
  }, [f]);

  let b = () => {
    let e = HT(y);
    e.resume();

    g.current = {
      keys: {},
      paused: false,
      muted: f,
      finished: false,
      audio: e,
    };

    s({
      ...am,
      audioLoading: true,
    });

    l(null);
    d(false);
    r("race");
  };

  let x = (e) => {
    if (c) {
      return;
    }
    g.current.paused = true;
    g.current.finished = true;
    d(false);
    a(null);
    let n = e.credits ?? Math.floor(e.score / 12 + (e.elapsed || 0) * 2);

    t((t) => {
      return {
        ...t,
        credits: t.credits + n,
        best: Math.max(t.best, e.score),
      };
    });

    l({
      ...e,
      credits: n,
    });
  };

  let S = () => {
    r("lobby");
    l(null);
    d(false);
    a(null);
  };

  let C = () => {
    if (!c) {
      if (i) {
        a(null);
        return;
      }
      d((e) => {
        return !e;
      });
    }
  };

  return (
    <div className="nightshift">
      {n === "lobby" ? (
        <ME
          progress={e}
          car={v}
          engine={y}
          onGarage={a}
          onStart={b}
          muted={f}
          onMute={() => {
            return p((e) => {
              return !e;
            });
          }}
          noPolice={m}
          onToggleNoPolice={() => {
            return h((e) => {
              return !e;
            });
          }}
        />
      ) : (
        <div className="relative h-[100dvh] w-full overflow-hidden">
          <GE
            car={v}
            engine={y}
            controls={g}
            onHud={s}
            onFinish={x}
            onStation={() => {
              return a("cars");
            }}
            onPause={C}
            noPolice={m}
          />
          <YE
            hud={o}
            engine={y}
            muted={f}
            onMute={() => {
              return p((e) => {
                return !e;
              });
            }}
            onPause={C}
            onStation={() => {
              return a("cars");
            }}
          />
          {!u && !c && !i && <BE controls={g} />}
          <div className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-[8px] tracking-widest text-white/50 xl:block">
            {
              "ZQSD / WASD / FLÈCHES • CONDUIRE \xA0 ESPACE • DRIFT \xA0 E • STATION \xA0 F • PIED/ENTRER \xA0 ESC • PAUSE"
            }
          </div>
          {u && !c && (
            <SE
              onResume={() => {
                return d(false);
              }}
              onEnd={() => {
                return x({
                  ...o,
                  reason: "Session terminée",
                });
              }}
            />
          )}{" "}
          {c && <XE result={c} onReturn={S} />}
        </div>
      )}
      {i && (
        <HE
          type={i}
          progress={e}
          onSelect={(e) => {
            let n = i === "cars";

            let r = (n ? Qp : tm).find((t) => {
              return t.id === e;
            });

            let o = n ? "car" : "engine";
            let s = n ? "cars" : "engines";

            t((t) => {
              return t[s].includes(e)
                ? {
                    ...t,
                    [o]: e,
                  }
                : t.credits < r.price
                ? t
                : {
                    ...t,
                    [o]: e,
                    [s]: [...t[s], e],
                    credits: t.credits - r.price,
                  };
            });

            a(null);
          }}
          onClose={() => {
            return a(null);
          }}
          station={n === "race"}
        />
      )}
    </div>
  );
}
var WE = () => {
  let {
    isLoadingAuth: e,
    isLoadingPublicSettings: t,
    authError: n,
    navigateToLogin: r,
  } = Jp();
  if (t || e) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        {
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        }
      </div>
    );
  }
  if (n) {
    if (n.type === "user_not_registered") {
      return <Yp />;
    }
    if (n.type === "auth_required") {
      r();
      return null;
    }
  }
  return (
    <Routes>
      <Route path="/" element={<CE />} />
      <Route path="*" element={<Gp />} />
    </Routes>
  );
};
function TE() {
  return (
    <Qp_1>
      {
        <QueryClientProvider client={Sa}>
          <BrowserRouter>
            <Zp />
            <WE />
          </BrowserRouter>
          <Zr />
        </QueryClientProvider>
      }
    </Qp_1>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<TE />);
