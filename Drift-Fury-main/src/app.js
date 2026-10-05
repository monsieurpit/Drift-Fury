import "./styles/index.css";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as ReactDOM from "react-dom/client";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cva } from "class-variance-authority";
import { XIcon, ArrowUpRightIcon, CoinsIcon, Volume2Icon, VolumeXIcon, ChevronRightIcon, Settings2Icon, Building2Icon, MountainIcon, RouteIcon, ShieldAlertIcon, TrophyIcon, CheckIcon, LockKeyholeIcon, FuelIcon, PauseIcon, ShieldIcon, StarIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, LogOutIcon, PlayIcon } from "lucide-react";
import { QueryClient, useQuery, QueryClientProvider } from "@tanstack/react-query";
import { useLocation, useNavigationType, Route, Routes, BrowserRouter } from "react-router-dom";
import { createClient, getAccessToken } from "@base44/sdk";
import { Mesh, Matrix3, Vector3, Sphere, Matrix4, BufferAttribute, BufferGeometry, ExtrudeGeometry, Shape, BoxGeometry, Group, CylinderGeometry, TorusGeometry, CanvasTexture, Object3D, MeshBasicMaterial, PlaneGeometry, SphereGeometry, MeshStandardMaterial, MeshPhysicalMaterial, SpotLight, RepeatWrapping, Vector2, Quaternion, Float32BufferAttribute, InstancedMesh, PointsMaterial, Points, ConeGeometry, PointLight, Color, PerspectiveCamera, Fog, Scene, HemisphereLight, DirectionalLight, AmbientLight, PMREMGenerator, WebGLRenderer } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { VignetteShader } from "three/addons/shaders/VignetteShader.js";
var v = 20,
  y = 1e6,
  b = {
    ADD_TOAST: `ADD_TOAST`,
    UPDATE_TOAST: `UPDATE_TOAST`,
    DISMISS_TOAST: `DISMISS_TOAST`,
    REMOVE_TOAST: `REMOVE_TOAST`
  },
  x = 0;
function S() {
  return x = (x + 1) % Number.MAX_VALUE, x.toString();
}
var C = new Map(),
  w = e => {
    if (C.has(e)) return;
    let t = setTimeout(() => {
      C.delete(e), O({
        type: b.REMOVE_TOAST,
        toastId: e
      });
    }, y);
    C.set(e, t);
  },
  T = (e, t) => {
    switch (t.type) {
      case b.ADD_TOAST:
        return {
          ...e,
          toasts: [t.toast, ...e.toasts].slice(0, v)
        };
      case b.UPDATE_TOAST:
        return {
          ...e,
          toasts: e.toasts.map(e => e.id === t.toast.id ? {
            ...e,
            ...t.toast
          } : e)
        };
      case b.DISMISS_TOAST:
        {
          let {
            toastId: n
          } = t;
          return n ? w(n) : e.toasts.forEach(e => {
            w(e.id);
          }), {
            ...e,
            toasts: e.toasts.map(e => e.id === n || n === void 0 ? {
              ...e,
              open: !1
            } : e)
          };
        }
      case b.REMOVE_TOAST:
        return t.toastId === void 0 ? {
          ...e,
          toasts: []
        } : {
          ...e,
          toasts: e.toasts.filter(e => e.id !== t.toastId)
        };
    }
  },
  E = [],
  D = {
    toasts: []
  };
function O(e) {
  D = T(D, e), E.forEach(e => {
    e(D);
  });
}
function k({
  ...e
}) {
  let t = S(),
    n = e => O({
      type: b.UPDATE_TOAST,
      toast: {
        ...e,
        id: t
      }
    }),
    r = () => O({
      type: b.DISMISS_TOAST,
      toastId: t
    });
  return O({
    type: b.ADD_TOAST,
    toast: {
      ...e,
      id: t,
      open: !0,
      onOpenChange: e => {
        e || r();
      }
    }
  }), {
    id: t,
    dismiss: r,
    update: n
  };
}
function A() {
  let [e, t] = (0, React.useState)(D);
  return (0, React.useEffect)(() => (E.push(t), () => {
    let e = E.indexOf(t);
    e > -1 && E.splice(e, 1);
  }), [e]), {
    ...e,
    toast: k,
    dismiss: e => O({
      type: b.DISMISS_TOAST,
      toastId: e
    })
  };
}
function Hr(...e) {
  return twMerge(clsx(e));
}
window.self, window.top;
var Ur = ToastPrimitives.Provider,
  Wr = React.forwardRef(({
    className: e,
    ...t
  }, n) => (0, jsxRuntime.jsx)(ToastPrimitives.Viewport, {
    ref: n,
    className: Hr(`fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]`, e),
    ...t
  }));
Wr.displayName = ToastPrimitives.Viewport.displayName;
var Gr = cva(`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full`, {
    variants: {
      variant: {
        default: `border bg-background text-foreground`,
        destructive: `destructive group border-destructive bg-destructive text-destructive-foreground`
      }
    },
    defaultVariants: {
      variant: `default`
    }
  }),
  Kr = React.forwardRef(({
    className: e,
    variant: t,
    ...n
  }, r) => (0, jsxRuntime.jsx)(ToastPrimitives.Root, {
    ref: r,
    className: Hr(Gr({
      variant: t
    }), e),
    ...n
  }));
Kr.displayName = ToastPrimitives.Root.displayName;
var qr = React.forwardRef(({
  className: e,
  ...t
}, n) => (0, jsxRuntime.jsx)(ToastPrimitives.Action, {
  ref: n,
  className: Hr(`inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive`, e),
  ...t
}));
qr.displayName = ToastPrimitives.Action.displayName;
var Jr = React.forwardRef(({
  className: e,
  ...t
}, n) => (0, jsxRuntime.jsx)(ToastPrimitives.Close, {
  ref: n,
  className: Hr(`absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600`, e),
  "toast-close": ``,
  ...t,
  children: (0, jsxRuntime.jsx)(XIcon, {
    className: `h-4 w-4`
  })
}));
Jr.displayName = ToastPrimitives.Close.displayName;
var Yr = React.forwardRef(({
  className: e,
  ...t
}, n) => (0, jsxRuntime.jsx)(ToastPrimitives.Title, {
  ref: n,
  className: Hr(`text-sm font-semibold`, e),
  ...t
}));
Yr.displayName = ToastPrimitives.Title.displayName;
var Xr = React.forwardRef(({
  className: e,
  ...t
}, n) => (0, jsxRuntime.jsx)(ToastPrimitives.Description, {
  ref: n,
  className: Hr(`text-sm opacity-90`, e),
  ...t
}));
Xr.displayName = ToastPrimitives.Description.displayName;
function Zr() {
  let {
    toasts: e
  } = A();
  return (0, jsxRuntime.jsxs)(Ur, {
    children: [e.map(function ({
      id: e,
      title: t,
      description: n,
      action: r,
      ...i
    }) {
      return (0, jsxRuntime.jsxs)(Kr, {
        ...i,
        children: [(0, jsxRuntime.jsxs)(`div`, {
          className: `grid gap-1`,
          children: [t && (0, jsxRuntime.jsx)(Yr, {
            children: t
          }), n && (0, jsxRuntime.jsx)(Xr, {
            children: n
          })]
        }), r, (0, jsxRuntime.jsx)(Jr, {})]
      }, e);
    }), (0, jsxRuntime.jsx)(Wr, {})]
  });
}
var Sa = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: !1,
      retry: 1
    }
  }
});
var zp = {
    ...(!(typeof window > `u`) && new URLSearchParams(window.location.search).get(`clear_access_token`) === `true` && (window.localStorage.removeItem(`base44_access_token`), window.localStorage.removeItem(`token`)), {
      appId: `6abf112b741fbf2e10f325d2`,
      token: getAccessToken(),
      functionsVersion: `prod`,
      appBaseUrl: void 0
    })
  },
  {
    appId: Bp,
    token: Vp,
    functionsVersion: Hp,
    appBaseUrl: Up
  } = zp,
  Wp = createClient({
    appId: Bp,
    token: Vp,
    functionsVersion: Hp,
    serverUrl: ``,
    appBaseUrl: Up
  });
function Gp({}) {
  let e = useLocation().pathname.substring(1),
    {
      data: t,
      isFetched: n
    } = useQuery({
      queryKey: [`user`],
      queryFn: async () => {
        try {
          return {
            user: await Wp.auth.me(),
            isAuthenticated: !0
          };
        } catch {
          return {
            user: null,
            isAuthenticated: !1
          };
        }
      }
    });
  return (0, jsxRuntime.jsx)(`div`, {
    className: `min-h-screen flex items-center justify-center p-6 bg-slate-50`,
    children: (0, jsxRuntime.jsx)(`div`, {
      className: `max-w-md w-full`,
      children: (0, jsxRuntime.jsxs)(`div`, {
        className: `text-center space-y-6`,
        children: [(0, jsxRuntime.jsxs)(`div`, {
          className: `space-y-2`,
          children: [(0, jsxRuntime.jsx)(`h1`, {
            className: `text-7xl font-light text-slate-300`,
            children: `404`
          }), (0, jsxRuntime.jsx)(`div`, {
            className: `h-0.5 w-16 bg-slate-200 mx-auto`
          })]
        }), (0, jsxRuntime.jsxs)(`div`, {
          className: `space-y-3`,
          children: [(0, jsxRuntime.jsx)(`h2`, {
            className: `text-2xl font-medium text-slate-800`,
            children: `Page Not Found`
          }), (0, jsxRuntime.jsxs)(`p`, {
            className: `text-slate-600 leading-relaxed`,
            children: [`The page `, (0, jsxRuntime.jsxs)(`span`, {
              className: `font-medium text-slate-700`,
              children: [`"`, e, `"`]
            }), ` could not be found in this application.`]
          })]
        }), n && t.isAuthenticated && t.user?.role === `admin` && (0, jsxRuntime.jsx)(`div`, {
          className: `mt-8 p-4 bg-slate-100 rounded-lg border border-slate-200`,
          children: (0, jsxRuntime.jsxs)(`div`, {
            className: `flex items-start space-x-3`,
            children: [(0, jsxRuntime.jsx)(`div`, {
              className: `flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center mt-0.5`,
              children: (0, jsxRuntime.jsx)(`div`, {
                className: `w-2 h-2 rounded-full bg-orange-400`
              })
            }), (0, jsxRuntime.jsxs)(`div`, {
              className: `text-left space-y-1`,
              children: [(0, jsxRuntime.jsx)(`p`, {
                className: `text-sm font-medium text-slate-700`,
                children: `Admin Note`
              }), (0, jsxRuntime.jsx)(`p`, {
                className: `text-sm text-slate-600 leading-relaxed`,
                children: `This could mean that the AI hasn't implemented this page yet. Ask it to implement it in the chat.`
              })]
            })]
          })
        }), (0, jsxRuntime.jsx)(`div`, {
          className: `pt-6`,
          children: (0, jsxRuntime.jsxs)(`button`, {
            onClick: () => window.location.href = `/`,
            className: `inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500`,
            children: [(0, jsxRuntime.jsx)(`svg`, {
              className: `w-4 h-4 mr-2`,
              fill: `none`,
              stroke: `currentColor`,
              viewBox: `0 0 24 24`,
              children: (0, jsxRuntime.jsx)(`path`, {
                strokeLinecap: `round`,
                strokeLinejoin: `round`,
                strokeWidth: 2,
                d: `M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6`
              })
            }), `Go Home`]
          })
        })]
      })
    })
  });
}
var Kp = (0, React.createContext)(),
  qp = ({
    children: e
  }) => {
    let [t, n] = (0, React.useState)(null),
      [r, i] = (0, React.useState)(!1),
      [a, o] = (0, React.useState)(!0),
      [s, c] = (0, React.useState)(!0),
      [l, u] = (0, React.useState)(null),
      [d, f] = (0, React.useState)(!1),
      [p, m] = (0, React.useState)(null);
    (0, React.useEffect)(() => {
      h();
    }, []);
    let h = async () => {
        try {
          c(!0), u(null);
          if (!Wp?.app || typeof Wp.app.getPublicSettings != `function`) {
            console.warn(`Base44 app SDK unavailable; continuing without app metadata.`), m(null), o(!1), i(!1), f(!0), c(!1);
            return;
          }
          try {
            let e = await Wp.app.getPublicSettings();
            m(e), zp.token ? await g() : (o(!1), i(!1), f(!0)), c(!1);
          } catch (e) {
            let t = e?.status;
            let n = t === 404 || t === 405 || t === 410 || t === 500 || !t;
            if (n) {
              console.warn(`Base44 app state unavailable; falling back to local static app mode.`, e), m(null), o(!1), i(!1), f(!0), c(!1);
              return;
            }
            if (console.error(`App state check failed:`, e), e.status === 403 && e.data?.extra_data?.reason) {
              let t = e.data.extra_data.reason;
              u(t === `auth_required` ? {
                type: `auth_required`,
                message: `Authentication required`
              } : t === `user_not_registered` ? {
                type: `user_not_registered`,
                message: `User not registered for this app`
              } : {
                type: t,
                message: e.message
              });
            } else u({
              type: `unknown`,
              message: e.message || `Failed to load app`
            });
            c(!1), o(!1);
          }
        } catch (e) {
          console.error(`Unexpected error:`, e), u({
            type: `unknown`,
            message: e.message || `An unexpected error occurred`
          }), c(!1), o(!1);
        }
      },
      g = async () => {
        try {
          if (!Wp?.auth || typeof Wp.auth.me != `function`) {
            o(!1), i(!1), f(!0);
            return;
          }
          o(!0);
          let e = await Wp.auth.me();
          n(e), i(!0), o(!1), f(!0);
        } catch (e) {
          console.warn(`User auth check unavailable in local mode; continuing without auth.`, e), o(!1), i(!1), f(!0), (e.status === 401 || e.status === 403) && u({
            type: `auth_required`,
            message: `Authentication required`
          });
        }
      };
    return (0, jsxRuntime.jsx)(Kp.Provider, {
      value: {
        user: t,
        isAuthenticated: r,
        isLoadingAuth: a,
        isLoadingPublicSettings: s,
        authError: l,
        appPublicSettings: p,
        authChecked: d,
        logout: (e = !0) => {
          n(null), i(!1), e ? Wp.auth.logout(window.location.href) : Wp.auth.logout();
        },
        navigateToLogin: () => {
          Wp.auth.redirectToLogin(window.location.href);
        },
        checkUserAuth: g,
        checkAppState: h
      },
      children: e
    });
  },
  Jp = () => {
    let e = (0, React.useContext)(Kp);
    if (!e) throw Error(`useAuth must be used within an AuthProvider`);
    return e;
  },
  Yp = () => (0, jsxRuntime.jsx)(`div`, {
    className: `flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50`,
    children: (0, jsxRuntime.jsx)(`div`, {
      className: `max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100`,
      children: (0, jsxRuntime.jsxs)(`div`, {
        className: `text-center`,
        children: [(0, jsxRuntime.jsx)(`div`, {
          className: `inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-orange-100`,
          children: (0, jsxRuntime.jsx)(`svg`, {
            className: `w-8 h-8 text-orange-600`,
            fill: `none`,
            stroke: `currentColor`,
            viewBox: `0 0 24 24`,
            children: (0, jsxRuntime.jsx)(`path`, {
              strokeLinecap: `round`,
              strokeLinejoin: `round`,
              strokeWidth: `2`,
              d: `M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z`
            })
          })
        }), (0, jsxRuntime.jsx)(`h1`, {
          className: `text-3xl font-bold text-slate-900 mb-4`,
          children: `Access Restricted`
        }), (0, jsxRuntime.jsx)(`p`, {
          className: `text-slate-600 mb-8`,
          children: `You are not registered to use this application. Please contact the app administrator to request access.`
        }), (0, jsxRuntime.jsxs)(`div`, {
          className: `p-4 bg-slate-50 rounded-md text-sm text-slate-600`,
          children: [(0, jsxRuntime.jsx)(`p`, {
            children: `If you believe this is an error, you can:`
          }), (0, jsxRuntime.jsxs)(`ul`, {
            className: `list-disc list-inside mt-2 space-y-1`,
            children: [(0, jsxRuntime.jsx)(`li`, {
              children: `Verify you are logged in with the correct account`
            }), (0, jsxRuntime.jsx)(`li`, {
              children: `Contact the app administrator for access`
            }), (0, jsxRuntime.jsx)(`li`, {
              children: `Try logging out and back in again`
            })]
          })]
        })]
      })
    })
  }),
  Xp = e => {
    let t = e.slice(1);
    try {
      return decodeURIComponent(t);
    } catch {
      return t;
    }
  };
function Zp() {
  let {
      pathname: e,
      hash: t
    } = useLocation(),
    n = useNavigationType();
  return (0, React.useEffect)(() => {
    if (n !== `POP`) {
      if (t) {
        let e = Xp(t),
          n = window.setTimeout(() => {
            document.getElementById(e)?.scrollIntoView({
              behavior: `smooth`
            });
          }, 50);
        return () => window.clearTimeout(n);
      }
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: `instant`
      });
    }
  }, [e, t, n]), null;
}
var Qp = [{
    id: `sakura`,
    name: `Elfen 9R`,
    tag: `GERMAN • COUPE`,
    color: `#a9b7bf`,
    price: 0,
    grip: 1,
    shape: `porsche`,
    description: `Coupé à moteur arrière. Équilibre et précision légendaires.`
  }, {
    id: `outlaw`,
    name: `Outlaw R`,
    tag: `AMERICAN • MUSCLE`,
    color: `#bf583b`,
    price: 0,
    grip: .86,
    shape: `muscle`,
    description: `Muscle car V8. Long capot, caractère brut, couple massif.`
  }, {
    id: `spectre`,
    name: `Spectre RS`,
    tag: `EUROPEAN • SUPERCAR`,
    color: `#c6dc77`,
    price: 0,
    grip: 1.12,
    shape: `super`,
    description: `Supercar à moteur central. V12 hurlant, ligne pure.`
  }, {
    id: `titan`,
    name: `Titan X`,
    tag: `HYPERCAR • EXTREME`,
    color: `#8c87c7`,
    price: 0,
    grip: 1.05,
    shape: `hyper`,
    awd: !0,
    description: `Hypercar W16. Puissance radicale, aérodynamique extrême.`
  }],
  $p = {
    ratios: [3.5, 2.4, 1.75, 1.32, 1.05, .86, .72],
    reverse: -3.2,
    finalDrive: 3.4,
    wheel: .33,
    efficiency: .9
  },
  em = {
    V6: 7200,
    V8: 6e3,
    V12: 9e3,
    W16: 6800
  },
  tm = [{
    id: `V6`,
    name: `V6 Twin Turbo`,
    hp: 320,
    torque: 400,
    max: 52,
    acceleration: 17,
    consumption: .12,
    pitch: 95,
    price: 0,
    description: `Aigu et nerveux. Réponse rapide, drift précis.`
  }, {
    id: `V8`,
    name: `V8 Supercharged`,
    hp: 510,
    torque: 680,
    max: 60,
    acceleration: 23,
    consumption: .18,
    pitch: 48,
    price: 0,
    description: `Grave et grondant. Un couple massif dès les bas régimes.`
  }, {
    id: `V12`,
    name: `V12 Atmosphérique`,
    hp: 740,
    torque: 720,
    max: 79,
    acceleration: 25,
    consumption: .23,
    pitch: 145,
    price: 0,
    description: `Un hurlement de supercar. La ligne droite est votre terrain.`
  }, {
    id: `W16`,
    name: `W16 Quad Turbo`,
    hp: 1200,
    torque: 1500,
    max: 87,
    acceleration: 34,
    consumption: .34,
    pitch: 36,
    price: 0,
    description: `Rauque et monstrueux. Accélération brute, consommation extrême.`
  }],
  nm = [{
    x: -90,
    z: -5
  }, {
    x: 90,
    z: 45
  }, {
    x: -30,
    z: 45
  }];
function rm() {
  let e = {
    credits: 0,
    best: 0,
    car: `sakura`,
    engine: `V6`,
    cars: [`sakura`, `outlaw`, `spectre`, `titan`],
    engines: [`V6`, `V8`, `V12`, `W16`]
  };
  try {
    let t = JSON.parse(localStorage.getItem(`nightshift-progress`) || `{}`),
      n = {
        ...e,
        ...t
      };
    return n.cars = Array.from(new Set([...e.cars, ...(n.cars || [])])), n.engines = Array.from(new Set([...e.engines, ...(n.engines || [])])), n;
  } catch {
    return e;
  }
}
function im(e) {
  localStorage.setItem(`nightshift-progress`, JSON.stringify(e));
}
var am = {
  speed: 0,
  rpm: 900,
  gear: 1,
  redline: 7200,
  shifting: !1,
  shiftSerial: 0,
  fuel: 100,
  health: 100,
  score: 0,
  combo: 1,
  wanted: 0,
  arrest: 0,
  arrestTimer: 0,
  escape: 0,
  drifting: !1,
  onFoot: !1,
  station: -1,
  zone: `Centre-ville`,
  x: 0,
  z: 0,
  heading: 0
};
function om({
  progress: e,
  muted: t,
  onMute: n
}) {
  return (0, jsxRuntime.jsxs)(`header`, {
    className: `flex h-20 items-center justify-between border-b border-white/10 px-5 md:px-10`,
    children: [(0, jsxRuntime.jsxs)(`div`, {
      className: `flex items-center gap-3`,
      children: [(0, jsxRuntime.jsx)(`div`, {
        className: `flex h-9 w-9 items-center justify-center rounded-lg bg-[#c6dc77] text-[#192015]`,
        children: (0, jsxRuntime.jsx)(ArrowUpRightIcon, {
          size: 25,
          strokeWidth: 3
        })
      }), (0, jsxRuntime.jsxs)(`span`, {
        className: `race-title text-[27px] tracking-[.035em]`,
        children: [`NIGHTSHIFT`, (0, jsxRuntime.jsx)(`span`, {
          className: `ml-1 text-[#c6dc77]`,
          children: `.`
        })]
      }), (0, jsxRuntime.jsx)(`span`, {
        className: `ml-5 hidden border-l border-white/15 pl-5 text-[10px] font-semibold tracking-[.2em] text-[#828b8e] md:block`,
        children: `DRIFT. ESCAPE. REPEAT.`
      })]
    }), (0, jsxRuntime.jsxs)(`div`, {
      className: `flex items-center gap-5`,
      children: [(0, jsxRuntime.jsxs)(`div`, {
        className: `flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-xs`,
        children: [(0, jsxRuntime.jsx)(CoinsIcon, {
          size: 15,
          className: `text-[#c6dc77]`
        }), (0, jsxRuntime.jsx)(`b`, {
          children: e.credits.toLocaleString(`fr-FR`)
        }), (0, jsxRuntime.jsx)(`span`, {
          className: `hidden text-[#798184] sm:inline`,
          children: `CR`
        })]
      }), (0, jsxRuntime.jsx)(`button`, {
        onClick: n,
        "aria-label": t ? `Activer le son` : `Couper le son`,
        className: `text-[#9aa2a4]`,
        children: t ? (0, jsxRuntime.jsx)(VolumeXIcon, {
          size: 19
        }) : (0, jsxRuntime.jsx)(Volume2Icon, {
          size: 19
        })
      }), (0, jsxRuntime.jsx)(`div`, {
        className: `hidden h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#23282b] text-[10px] font-bold sm:flex`,
        children: `NS`
      })]
    })]
  });
}
function Iw(e, t = new Set()) {
  let n = new Map();
  for (let r of [...e.children]) {
    if (!r.isMesh || r.name || t.has(r)) continue;
    r.updateMatrix();
    let i = r.geometry.index ? r.geometry.toNonIndexed() : r.geometry.clone();
    i.applyMatrix4(r.matrix), i.clearGroups();
    let a = n.get(r.material);
    a || n.set(r.material, a = {
      geos: [],
      cast: !1,
      receive: !1
    }), a.geos.push(i), a.cast ||= r.castShadow, a.receive ||= r.receiveShadow, r.geometry.dispose(), e.remove(r);
  }
  for (let [t, r] of n) {
    let n = r.geos.length === 1 ? r.geos[0] : mergeGeometries(r.geos);
    r.geos.length > 1 && r.geos.forEach(e => e.dispose());
    let i = new Mesh(n, t);
    i.castShadow = r.cast, i.receiveShadow = r.receive, e.add(i);
  }
}
/* traffic and police cars never animate their parts, so each look is built and batched once, then cloned */
const dfcTrafficTemplates = new Map();
function dfcTrafficCar(color, shape, police = !1) {
  const key = (police ? `police` : `traffic`) + `|` + color + `|` + shape;
  let template = dfcTrafficTemplates.get(key);
  if (!template) {
    template = Vw(color, shape, police);
    template.userData = {};
    dfcBatchStatic(template, new Set(), 1 / 0);
    dfcTrafficTemplates.set(key, template);
  }
  const car = template.clone();
  car.userData = {
    sharedTemplate: !0
  };
  return car;
}
/* compile every shader the session can need before the first frame, so nothing stalls mid-drive */
function dfcWarmUp(renderer, scene, camera, extraColors = []) {
  for (const color of [...CT, ...extraColors]) dfcTrafficCar(color, `coupe`);
  dfcTrafficCar(`#ffffff`, `coupe`, !0);
  try {
    renderer.compile(scene, camera);
    for (const template of dfcTrafficTemplates.values()) renderer.compile(template, camera, scene);
  } catch (error) {}
}
/* the player car keeps its moving parts (wheels, door, lamps) separate; everything else is batched */
function dfcBatchCar(car) {
  const data = car.userData;
  const skip = new Set([...data.wheels, ...data.brakeLights, ...data.headlights, ...(data.headlightBeams || [])]);
  data.accessDoor && skip.add(data.accessDoor);
  dfcBatchStatic(car, new Set(), 1 / 0, skip);
  data.wheels.forEach(wheel => dfcBatchStatic(wheel, new Set(), 1 / 0));
  data.accessDoor && dfcBatchStatic(data.accessDoor, new Set(), 1 / 0);
  return car;
}
/* ---- static batching: merge never-moving meshes that share an identical material into one draw per area ---- */
function dfcMaterialKey(material, ids) {
  const parts = [];
  for (const key of Object.keys(material).sort()) {
    if (key === `uuid` || key === `name` || key === `version` || key === `userData` || key === `_listeners`) continue;
    const value = material[key];
    let token;
    if (value === null || value === void 0 || typeof value === `number` || typeof value === `string` || typeof value === `boolean`) token = String(value);else if (value.isColor) token = `c` + value.getHexString();else if (value.isTexture) token = `t` + value.uuid;else if (value.isVector2 || value.isVector3 || value.isEuler) token = `v` + value.toArray().join(`,`);else if (key === `defines`) token = JSON.stringify(value);else {
      if (!ids.has(value)) ids.set(value, ids.size);
      token = `o` + ids.get(value);
    }
    parts.push(key + `=` + token);
  }
  return parts.join(`|`);
}
function dfcBatchStatic(root, keepMaterials = new Set(), cellSize = 48, skip = new Set()) {
  root.updateMatrixWorld(!0);
  const canonical = new Map(),
    objectIds = new Map(),
    groups = new Map(),
    removed = new Set();
  const baseBeforeRender = Mesh.prototype.onBeforeRender;
  const canonicalMaterial = material => {
    if (keepMaterials.has(material)) return material;
    const key = dfcMaterialKey(material, objectIds);
    let hit = canonical.get(key);
    hit || canonical.set(key, hit = material);
    return hit;
  };
  const sphere = new Sphere(),
    rootInverse = root.matrixWorld.clone().invert(),
    relative = new Matrix4();
  const eligible = object => {
    if (object.name || !object.isMesh || object.type !== `Mesh` || object.isInstancedMesh || object.isSkinnedMesh) return !1;
    if (!object.frustumCulled || object.layers.mask !== 1 || object.onBeforeRender !== baseBeforeRender || object.morphTargetInfluences) return !1;
    const geometry = object.geometry;
    if (!geometry.isBufferGeometry || !geometry.attributes.position || Object.keys(geometry.morphAttributes).length) return !1;
    if (geometry.drawRange.start !== 0 || geometry.drawRange.count !== 1 / 0) return !1;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some(material => !material || material.transparent)) return !1;
    if (Array.isArray(object.material) && !geometry.groups.length) return !1;
    for (const name of Object.keys(geometry.attributes)) {
      const attribute = geometry.attributes[name];
      if (attribute.isInterleavedBufferAttribute || !(attribute.array instanceof Float32Array) || attribute.normalized) return !1;
      if (name !== `position` && name !== `normal` && name !== `uv` && name !== `uv1` && name !== `uv2` && name !== `color`) return !1;
    }
    const positions = geometry.attributes.position.array;
    for (let index = 0; index < positions.length; index++) if (!Number.isFinite(positions[index])) return !1;
    return !0;
  };
  const visit = (object, visible) => {
    if (skip.has(object)) return;
    visible = visible && object.visible;
    for (const child of object.children) visit(child, visible);
    if (!visible || !eligible(object)) return;
    const geometry = object.geometry,
      names = Object.keys(geometry.attributes).sort();
    const matrix = relative.multiplyMatrices(rootInverse, object.matrixWorld).clone();
    geometry.boundingSphere || geometry.computeBoundingSphere();
    sphere.copy(geometry.boundingSphere).applyMatrix4(matrix);
    const signature = names.map(name => name + geometry.attributes[name].itemSize).join(`,`);
    const total = geometry.index ? geometry.index.count : geometry.attributes.position.count;
    const pieces = Array.isArray(object.material) ? geometry.groups.map(group => ({
      material: object.material[group.materialIndex],
      start: group.start,
      count: Math.min(group.count, total - group.start)
    })) : [{
      material: object.material,
      start: 0,
      count: total
    }];
    for (const piece of pieces) {
      if (!piece.material || piece.count <= 0) continue;
      const material = canonicalMaterial(piece.material);
      const key = [material.uuid, signature, object.castShadow ? 1 : 0, object.receiveShadow ? 1 : 0, object.renderOrder, Math.floor(sphere.center.x / cellSize), Math.floor(sphere.center.z / cellSize)].join(`/`);
      let group = groups.get(key);
      group || groups.set(key, group = {
        material,
        names,
        cast: object.castShadow,
        receive: object.receiveShadow,
        renderOrder: object.renderOrder,
        items: [],
        objects: new Set(),
        vertices: 0,
        indices: 0
      });
      group.items.push({
        object,
        matrix,
        start: piece.start,
        count: piece.count
      });
      group.objects.add(object);
      group.vertices += geometry.attributes.position.count;
      group.indices += piece.count;
    }
  };
  visit(root, !0);
  const normalMatrix = new Matrix3(),
    vector = new Vector3();
  let merged = 0,
    batches = 0;
  for (const group of groups.values()) {
    if (group.items.length < 2) {
      const {
        object
      } = group.items[0];
      Array.isArray(object.material) || (object.material = group.material);
      continue;
    }
    const arrays = {};
    for (const name of group.names) arrays[name] = new Float32Array(group.vertices * group.items[0].object.geometry.attributes[name].itemSize);
    const indices = group.vertices > 65535 ? new Uint32Array(group.indices) : new Uint16Array(group.indices);
    let vertexOffset = 0,
      indexOffset = 0;
    for (const {
      object,
      matrix,
      start,
      count: pieceCount
    } of group.items) {
      const geometry = object.geometry,
        count = geometry.attributes.position.count;
      normalMatrix.getNormalMatrix(matrix);
      for (const name of group.names) {
        const source = geometry.attributes[name],
          size = source.itemSize,
          target = arrays[name];
        if (name === `position` || name === `normal`) {
          for (let index = 0; index < count; index++) {
            vector.fromBufferAttribute(source, index);
            name === `position` ? vector.applyMatrix4(matrix) : vector.applyMatrix3(normalMatrix).normalize();
            target[(vertexOffset + index) * 3] = vector.x;
            target[(vertexOffset + index) * 3 + 1] = vector.y;
            target[(vertexOffset + index) * 3 + 2] = vector.z;
          }
        } else target.set(source.array.subarray(0, count * size), vertexOffset * size);
      }
      const flip = matrix.determinant() < 0,
        source = geometry.index ? geometry.index.array : null;
      const at = index => source ? source[index] : index;
      for (let index = start; index + 2 < start + pieceCount; index += 3) {
        indices[indexOffset++] = at(index) + vertexOffset;
        indices[indexOffset++] = at(flip ? index + 2 : index + 1) + vertexOffset;
        indices[indexOffset++] = at(flip ? index + 1 : index + 2) + vertexOffset;
      }
      vertexOffset += count;
    }
    const geometry = new BufferGeometry();
    for (const name of group.names) geometry.setAttribute(name, new BufferAttribute(arrays[name], group.items[0].object.geometry.attributes[name].itemSize));
    geometry.setIndex(new BufferAttribute(indexOffset === indices.length ? indices : indices.slice(0, indexOffset), 1));
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    const mesh = new Mesh(geometry, group.material);
    mesh.castShadow = group.cast;
    mesh.receiveShadow = group.receive;
    mesh.renderOrder = group.renderOrder;
    mesh.matrixAutoUpdate = !1;
    mesh.updateMatrix();
    root.add(mesh);
    group.objects.forEach(object => removed.add(object));
    merged += group.items.length;
    batches++;
  }
  // a multi-material mesh only goes away when every one of its pieces was merged
  for (const group of groups.values()) if (group.items.length < 2) group.objects.forEach(object => removed.delete(object));
  removed.forEach(object => object.parent && object.parent.remove(object));
  for (const group of groups.values()) if (group.items.length >= 2) for (const object of group.objects) if (!removed.has(object) && Array.isArray(object.material)) {
    // partially merged multi-material mesh: hide the pieces now drawn by a batch
    const merged = new Set(group.items.filter(item => item.object === object).map(item => item.start));
    object.geometry = object.geometry.clone();
    object.geometry.groups = object.geometry.groups.filter(entry => !merged.has(entry.start) || object.material[entry.materialIndex] === void 0);
  }
  const prune = object => {
    for (const child of [...object.children]) prune(child);
    if (object !== root && !object.children.length && object.type === `Group`) object.parent.remove(object);
  };
  prune(root);
  const geometries = new Set();
  root.traverse(object => object.geometry && geometries.add(object.geometry));
  removed.forEach(object => geometries.has(object.geometry) || object.geometry.dispose());
  return {
    merged,
    batches
  };
}
function Lw(e, t, n, r = .05) {
  let i = new ExtrudeGeometry(e, {
    depth: t,
    bevelEnabled: !0,
    bevelThickness: r,
    bevelSize: r,
    bevelSegments: 5,
    steps: 1,
    curveSegments: 32
  });
  i.translate(0, 0, -t / 2), i.rotateY(-Math.PI / 2), i.computeVertexNormals();
  let a = new Mesh(i, n);
  return a.castShadow = !0, a.receiveShadow = !0, a;
}
function Rw(e, t) {
  let n = new Shape(),
    r = -e / 2,
    i = e / 2,
    a = .3,
    {
      belt: o,
      hood: s,
      rear: c,
      frontRise: l
    } = {
      porsche: {
        belt: .74,
        hood: .6,
        rear: .74,
        frontRise: .5
      },
      gtr: {
        belt: .78,
        hood: .66,
        rear: .66,
        frontRise: .52
      },
      super: {
        belt: .7,
        hood: .64,
        rear: .7,
        frontRise: .46
      },
      muscle: {
        belt: .74,
        hood: .67,
        rear: .66,
        frontRise: .52
      },
      hyper: {
        belt: .72,
        hood: .62,
        rear: .7,
        frontRise: .48
      }
    }[t] || {
      belt: .74,
      hood: .66,
      rear: .66,
      frontRise: .5
    };
  return n.moveTo(r, a), n.lineTo(r, l), n.quadraticCurveTo(r + .04, l + .1, r + .22, s), n.lineTo(r + 1.55, s + .005), n.quadraticCurveTo(r + 1.72, s + .02, r + 1.92, o), n.lineTo(i - 1.25, o + .005), n.quadraticCurveTo(i - 1.05, o - .01, i - .85, c + .02), n.lineTo(i - .22, c), n.quadraticCurveTo(i - .05, c - .02, i, .56), n.lineTo(i, a), n.lineTo(r, a), n;
}
function zw(e, t) {
  let n = new Shape(),
    r = -e / 2,
    i = e / 2,
    {
      belt: a,
      roof: o,
      wsStart: s,
      roofEnd: c,
      rsEnd: l
    } = {
      porsche: {
        belt: .74,
        roof: 1.14,
        wsStart: 1.78,
        roofEnd: 1.95,
        rsEnd: 1
      },
      gtr: {
        belt: .78,
        roof: 1.22,
        wsStart: 1.85,
        roofEnd: 1.78,
        rsEnd: 1.4
      },
      super: {
        belt: .7,
        roof: 1.18,
        wsStart: 1.78,
        roofEnd: 1.78,
        rsEnd: 1.3
      },
      muscle: {
        belt: .74,
        roof: 1.24,
        wsStart: 1.8,
        roofEnd: 1.78,
        rsEnd: 1.35
      },
      hyper: {
        belt: .72,
        roof: 1.12,
        wsStart: 1.7,
        roofEnd: 1.7,
        rsEnd: 1.25
      }
    }[t] || {
      belt: .74,
      roof: 1.24,
      wsStart: 1.78,
      roofEnd: 1.78,
      rsEnd: 1.3
    };
  return n.moveTo(r + s, a), n.quadraticCurveTo(r + s + .24, a + .02, r + s + .34, o - .02), n.lineTo(i - c, o), n.quadraticCurveTo(i - l, o - .02, i - l + .2, a + .02), n.lineTo(r + s, a), n;
}
function Bw(e) {
  let t = new Group(),
    n = .475,
    r = .305,
    i = new Mesh(new CylinderGeometry(n, n, r, 44), e.rubber);
  i.rotation.z = Math.PI / 2, i.castShadow = !0, t.add(i);
  let a = new Mesh(new TorusGeometry(.48, .05, 10, 44), e.tread);
  a.rotation.y = Math.PI / 2, t.add(a);
  for (let n of [-.305 / 2, r / 2]) {
    let r = new Mesh(new TorusGeometry(.44499999999999995, .035, 8, 36), e.rubber);
    r.rotation.y = Math.PI / 2, r.position.x = n, t.add(r);
  }
  let o = new Mesh(new CylinderGeometry(.3, .3, .06, 40), e.rotor);
  o.rotation.z = Math.PI / 2, o.position.x = .02, t.add(o);
  for (let n = 0; n < 6; n++) {
    let r = new Mesh(new BoxGeometry(.07, .02, .3), e.dark);
    r.rotation.x = n / 6 * Math.PI * 2, r.position.x = .05, t.add(r);
  }
  for (let n = 0; n < 8; n++) {
    let r = n / 8 * Math.PI * 2,
      i = new Mesh(new CylinderGeometry(.025, .025, .08, 8), e.dark);
    i.rotation.z = Math.PI / 2, i.position.set(.02, Math.sin(r) * .22, Math.cos(r) * .22), t.add(i);
  }
  let s = new Mesh(new TorusGeometry(.24, .02, 6, 28), e.dark);
  s.rotation.y = Math.PI / 2, s.position.x = .02, t.add(s);
  let c = new Mesh(new BoxGeometry(.1, .16, .14), e.caliper);
  c.position.set(.1, .2, 0), t.add(c);
  let l = new Mesh(new CylinderGeometry(.33, .33, .28, 36), e.rim);
  l.rotation.z = Math.PI / 2, t.add(l);
  let u = e.rim;
  for (let e = 0; e < 10; e++) {
    let n = e / 10 * Math.PI * 2,
      r = new Mesh(new BoxGeometry(.06, .56, .05), u);
    r.rotation.x = n, r.position.x = .13, t.add(r);
  }
  let d = new Mesh(new TorusGeometry(.335, .025, 10, 40), e.rim);
  d.rotation.y = Math.PI / 2, d.position.x = .14, t.add(d);
  let f = new Mesh(new CylinderGeometry(.09, .09, .3, 18), e.chrome);
  f.rotation.z = Math.PI / 2, f.position.x = .15, t.add(f);
  for (let n = 0; n < 5; n++) {
    let r = n / 5 * Math.PI * 2,
      i = new Mesh(new CylinderGeometry(.018, .018, .06, 6), e.dark);
    i.rotation.z = Math.PI / 2, i.position.set(.17, Math.sin(r) * .06, Math.cos(r) * .06), t.add(i);
  }
  return t;
}
/* ======================================================================
   DRIFT FURY - realistic car builder (replaces the old LEGO-style Vw)
   Smooth lofted bodywork, tinted glass greenhouse, pillars, wheel arches,
   lathe-turned tyres and alloy wheels, shaped lights, per-model details.
   ====================================================================== */
function dfcPchip(pts) {
  const n = pts.length,
    xs = pts.map(p => p[0]),
    ys = pts.map(p => p[1]);
  const h = [],
    d = [],
    m = new Array(n);
  for (let i = 0; i < n - 1; i++) {
    h[i] = xs[i + 1] - xs[i];
    d[i] = (ys[i + 1] - ys[i]) / h[i];
  }
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;else {
      const w1 = 2 * h[i] + h[i - 1],
        w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  return x => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i],
      t2 = t * t,
      t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
  };
}
const dfcClamp = (x, a, b) => Math.min(b, Math.max(a, x));
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
      const a = pts[i],
        b = pts[(i + 1) % pts.length];
      const sb = i === pts.length - 1 ? b[2] + sMax : b[2];
      out.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25, a[2] * .75 + sb * .25]);
      out.push([a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75, a[2] * .25 + sb * .75]);
    }
    pts = out;
  }
  return pts.map(p => [p[0], p[1], p[2] % sMax]);
}
function dfcBuf(pos, nor, idx) {
  const g = new BufferGeometry();
  g.setAttribute(`position`, new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute(`normal`, new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute(`uv`, new BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
  if (idx) g.setIndex(idx);
  return g;
}

/* normals for a (rows x cols) point matrix whose columns wrap */
function dfcNormals(P, nz, nr) {
  const N = new Float32Array(P.length);
  for (let i = 0; i < nz; i++) {
    const i0 = Math.max(0, i - 1),
      i1 = Math.min(nz - 1, i + 1);
    for (let j = 0; j < nr; j++) {
      const j0 = (j + nr - 1) % nr,
        j1 = (j + 1) % nr,
        a = (i * nr + j) * 3;
      const A = (i * nr + j0) * 3,
        B = (i * nr + j1) * 3,
        C = (i0 * nr + j) * 3,
        D = (i1 * nr + j) * 3;
      const ux = P[B] - P[A],
        uy = P[B + 1] - P[A + 1],
        uz = P[B + 2] - P[A + 2];
      const vx = P[D] - P[C],
        vy = P[D + 1] - P[C + 1],
        vz = P[D + 2] - P[C + 2];
      let nx = uy * vz - uz * vy,
        ny = uz * vx - ux * vz,
        nz_ = ux * vy - uy * vx;
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
  for (let i = 0; i < nz - 1; i++) for (let j = 0; j < nr; j++) {
    const c = cat(i, j);
    if (!c) continue;
    const b = buckets[c] || (buckets[c] = {
      pos: [],
      nor: [],
      idx: [],
      map: new Map()
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
    const A = vid(i, j),
      B = vid(i, j1),
      C = vid(i + 1, j),
      D = vid(i + 1, j1);
    b.idx.push(A, B, C, B, D, C);
  }
  const out = {};
  for (const k in buckets) out[k] = dfcBuf(buckets[k].pos, buckets[k].nor, buckets[k].idx);
  return out;
}

/* flat polygon cap (convex-ish ring) with a fixed normal */
function dfcCap(ring, z, nz_) {
  const pos = [],
    nor = [],
    idx = [];
  let cx = 0,
    cy_ = 0;
  ring.forEach(p => {
    cx += p[0];
    cy_ += p[1];
  });
  cx /= ring.length;
  cy_ /= ring.length;
  pos.push(cx, cy_, z);
  nor.push(0, 0, nz_);
  ring.forEach(p => {
    pos.push(p[0], p[1], z);
    nor.push(0, 0, nz_);
  });
  for (let j = 0; j < ring.length; j++) {
    const a = 1 + j,
      b = 1 + (j + 1) % ring.length;
    if (nz_ > 0) idx.push(0, a, b);else idx.push(0, b, a);
  }
  return dfcBuf(pos, nor, idx);
}

/* convex prism from a 2D polygon [r, t] (radial, tangential) rotated by phi around the x axis */
function dfcPrism(poly, x0, x1, phi, bevel) {
  const pos = [],
    nor = [],
    idx = [];
  const c = Math.cos(phi),
    s = Math.sin(phi);
  const W = (r, t, x) => [x, r * c - t * s, r * s + t * c];
  const n = poly.length;
  const addTri = (a, b, d, nrm) => {
    const k = pos.length / 3;
    pos.push(...a, ...b, ...d);
    for (let i = 0; i < 3; i++) nor.push(...nrm);
    idx.push(k, k + 1, k + 2);
  };
  let cr = 0,
    ct = 0;
  poly.forEach(p => {
    cr += p[0];
    ct += p[1];
  });
  cr /= n;
  ct /= n;
  const nrmX1 = [1, 0, 0],
    nrmX0 = [-1, 0, 0];
  for (let i = 0; i < n; i++) {
    const a = poly[i],
      b = poly[(i + 1) % n];
    addTri(W(cr, ct, x1), W(a[0], a[1], x1), W(b[0], b[1], x1), nrmX1);
    addTri(W(cr, ct, x0), W(b[0], b[1], x0), W(a[0], a[1], x0), nrmX0);
    const dr = b[0] - a[0],
      dt = b[1] - a[1],
      l = Math.hypot(dr, dt) || 1;
    const nr_ = dt / l,
      nt = -dr / l;
    const wn = [0, nr_ * c - nt * s, nr_ * s + nt * c];
    const q = pos.length / 3;
    pos.push(...W(a[0], a[1], x0), ...W(b[0], b[1], x0), ...W(b[0], b[1], x1), ...W(a[0], a[1], x1));
    for (let k = 0; k < 4; k++) nor.push(...wn);
    idx.push(q, q + 1, q + 2, q, q + 2, q + 3);
  }
  return dfcBuf(pos, nor, idx);
}

/* surface of revolution about the x axis. prof = [[x, r], ...] ordered so the outside faces out */
function dfcLathe(prof, seg) {
  const nz = prof.length,
    nr = seg;
  const P = new Float32Array(nz * nr * 3);
  for (let i = 0; i < nz; i++) for (let j = 0; j < nr; j++) {
    const th = j / nr * Math.PI * 2,
      a = (i * nr + j) * 3;
    P[a] = prof[i][0];
    P[a + 1] = Math.cos(th) * prof[i][1];
    P[a + 2] = Math.sin(th) * prof[i][1];
  }
  const N = dfcNormals(P, nz, nr);
  const pos = Array.from(P),
    nor = Array.from(N),
    idx = [];
  for (let i = 0; i < nz - 1; i++) for (let j = 0; j < nr; j++) {
    const j1 = (j + 1) % nr,
      A = i * nr + j,
      B = i * nr + j1,
      C = (i + 1) * nr + j,
      D = (i + 1) * nr + j1;
    idx.push(A, B, C, B, D, C);
  }
  return dfcBuf(pos, nor, idx);
}
function dfcSmoothProfile(ctrl, iters) {
  /* open Chaikin keeping the end points */
  let pts = ctrl;
  for (let it = 0; it < iters; it++) {
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i],
        b = pts[i + 1];
      out.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25]);
      out.push([a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]);
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
    axF: .92,
    axR: 3.64,
    R: .35,
    twF: .255,
    twR: .275,
    humpF: .045,
    humpR: .07,
    crown: .04,
    top: [[0, .60], [.12, .66], [.4, .74], [.95, .78], [1.5, .84], [1.85, .90], [2.4, .94], [3.2, .95], [3.7, .95], [4.15, .93], [4.4, .86], [4.55, .76]],
    bot: [[0, .32], [.15, .22], [.5, .18], [1.2, .17], [3.4, .17], [4.0, .19], [4.4, .24], [4.55, .32]],
    wid: [[0, .62], [.07, .75], [.22, .85], [.55, .905], [.95, .93], [1.9, .915], [2.8, .915], [3.55, .945], [4.05, .92], [4.38, .83], [4.55, .64]],
    cab: {
      ws: 1.78,
      rf: 2.45,
      rr: 3.18,
      rg: 3.78,
      roof: 1.30,
      tum: .17,
      inset: .12,
      cp: 3.25,
      bp: 2.78,
      rgs: 5.0
    }
  },
  gtr: {
    L: 4.7,
    axF: .95,
    axR: 3.73,
    R: .355,
    twF: .265,
    twR: .285,
    humpF: .075,
    humpR: .09,
    crown: .04,
    top: [[0, .64], [.12, .70], [.45, .78], [1.1, .82], [1.7, .88], [2.0, .93], [2.6, .97], [3.6, .99], [4.1, .99], [4.5, .93], [4.7, .84]],
    bot: [[0, .33], [.15, .23], [.5, .19], [1.2, .18], [3.5, .18], [4.1, .20], [4.5, .25], [4.7, .33]],
    wid: [[0, .66], [.08, .80], [.25, .90], [.6, .97], [1.0, .99], [2, .975], [2.9, .975], [3.7, .99], [4.2, .96], [4.5, .88], [4.7, .68]],
    cab: {
      ws: 1.88,
      rf: 2.45,
      rr: 3.35,
      rg: 3.95,
      roof: 1.37,
      tum: .2,
      inset: .12,
      cp: 3.4,
      bp: 2.92,
      rgs: 5.0
    }
  },
  porsche: {
    L: 4.5,
    axF: .90,
    axR: 3.35,
    R: .35,
    twF: .245,
    twR: .295,
    humpF: .085,
    humpR: .095,
    crown: .04,
    top: [[0, .56], [.1, .62], [.35, .68], [.9, .72], [1.45, .80], [1.65, .84], [2.2, .90], [3.4, .96], [3.9, .98], [4.25, .97], [4.4, .92], [4.5, .84]],
    bot: [[0, .30], [.15, .21], [.5, .17], [1.2, .16], [3.4, .16], [4.0, .19], [4.4, .24], [4.5, .30]],
    wid: [[0, .60], [.07, .73], [.22, .83], [.55, .895], [.9, .915], [1.9, .905], [2.6, .915], [3.35, .965], [4.0, .95], [4.3, .87], [4.5, .64]],
    cab: {
      ws: 1.5,
      rf: 2.1,
      rr: 2.95,
      rg: 3.95,
      roof: 1.30,
      tum: .2,
      inset: .1,
      cp: 2.9,
      bp: null,
      rgs: 5.2
    }
  },
  super: {
    L: 4.52,
    axF: .98,
    axR: 3.62,
    R: .355,
    twF: .255,
    twR: .31,
    humpF: .06,
    humpR: .08,
    crown: .04,
    top: [[0, .46], [.12, .52], [.5, .60], [1.2, .70], [1.62, .80], [2.0, .86], [2.8, .95], [3.4, .97], [4.0, .92], [4.35, .86], [4.52, .78]],
    bot: [[0, .26], [.15, .18], [.5, .15], [1.2, .15], [3.4, .15], [4.0, .18], [4.4, .23], [4.52, .30]],
    wid: [[0, .62], [.07, .78], [.22, .90], [.55, .97], [1.0, 1.0], [1.9, .98], [2.7, 1.0], [3.5, 1.01], [4.0, .96], [4.35, .86], [4.52, .64]],
    cab: {
      ws: 1.62,
      rf: 2.28,
      rr: 2.75,
      rg: 3.35,
      roof: 1.13,
      tum: .22,
      inset: .13,
      cp: 2.8,
      bp: null,
      rgs: 5.4
    }
  },
  muscle: {
    L: 4.75,
    axF: .95,
    axR: 3.8,
    R: .355,
    twF: .265,
    twR: .295,
    humpF: .06,
    humpR: .07,
    crown: .05,
    top: [[0, .78], [.1, .84], [.4, .92], [1.0, .96], [2.0, .99], [2.4, 1.0], [3.0, 1.02], [4.2, 1.03], [4.55, .99], [4.75, .92]],
    bot: [[0, .36], [.15, .25], [.5, .20], [1.2, .19], [3.6, .19], [4.2, .21], [4.55, .26], [4.75, .34]],
    wid: [[0, .66], [.08, .80], [.25, .90], [.6, .955], [1.0, .975], [2.0, .96], [3.0, .96], [3.8, .975], [4.3, .95], [4.6, .87], [4.75, .66]],
    cab: {
      ws: 2.25,
      rf: 2.7,
      rr: 3.45,
      rg: 3.95,
      roof: 1.39,
      tum: .16,
      inset: .11,
      cp: 3.5,
      bp: 3.0,
      rgs: 4.8
    }
  },
  hyper: {
    L: 4.6,
    axF: 1.0,
    axR: 3.7,
    R: .355,
    twF: .26,
    twR: .315,
    humpF: .065,
    humpR: .09,
    crown: .04,
    top: [[0, .48], [.1, .54], [.5, .64], [1.2, .72], [1.6, .82], [2.0, .88], [2.6, .90], [3.2, .92], [4.0, .90], [4.4, .82], [4.6, .72]],
    bot: [[0, .26], [.15, .18], [.5, .15], [1.2, .15], [3.5, .15], [4.1, .18], [4.45, .23], [4.6, .30]],
    wid: [[0, .62], [.07, .78], [.22, .91], [.55, .98], [1.0, 1.025], [1.9, 1.0], [2.8, 1.0], [3.7, 1.025], [4.2, .97], [4.45, .86], [4.6, .64]],
    cab: {
      ws: 1.55,
      rf: 2.15,
      rr: 2.7,
      rg: 3.5,
      roof: 1.12,
      tum: .22,
      inset: .13,
      cp: 2.8,
      bp: null,
      rgs: 5.3
    }
  }
};
function dfcBuildSpec(name) {
  const raw = DFC_SPECS[name] || DFC_SPECS.coupe;
  const sp = Object.assign({}, raw);
  sp.name = name in DFC_SPECS ? name : `coupe`;
  sp.yTop = dfcPchip(raw.top);
  sp.yBot = dfcPchip(raw.bot);
  sp.hw = dfcPchip(raw.wid);
  sp.arch = sp.R + .065;
  sp.hump = zf => {
    let h = 0;
    for (const [za, amp] of [[sp.axF, sp.humpF], [sp.axR, sp.humpR]]) {
      const t = (zf - za) / (sp.arch * 1.25);
      if (Math.abs(t) < 1) h += amp * (1 - t * t) * (1 - t * t);
    }
    return h;
  };
  sp.yEdge = zf => {
    let y = sp.yBot(zf) + .05;
    for (const za of [sp.axF, sp.axR]) {
      const dz = Math.abs(zf - za);
      if (dz <= sp.arch) y = Math.max(y, sp.R + Math.sqrt(sp.arch * sp.arch - dz * dz));
    }
    return y;
  };
  const c = sp.cab;
  const base = zf => sp.yTop(zf) - .05;
  const bws = base(c.ws),
    brg = base(c.rg);
  const midRoof = (c.rf + c.rr) / 2;
  const hiRoof = c.roof;
  sp.cabBase = base;
  sp.roofY = dfcPchip([[c.ws, bws], [c.ws + (c.rf - c.ws) * .30, bws + (hiRoof - .05 - bws) * .26], [c.ws + (c.rf - c.ws) * .65, bws + (hiRoof - .05 - bws) * .66], [c.rf, hiRoof - .045], [midRoof, hiRoof], [c.rr, hiRoof - .035], [c.rr + (c.rg - c.rr) * .35, hiRoof - .035 - (hiRoof - .035 - brg) * .30], [c.rr + (c.rg - c.rr) * .7, hiRoof - .035 - (hiRoof - .035 - brg) * .72], [c.rg, brg]]);
  return sp;
}
function dfcGetShadowTexture(sp) {
  if (!dfcShadowTextures.has(sp.name)) {
    const width = 512,
      height = 1024;
    const canvas = document.createElement(`canvas`);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext(`2d`);
    const carWidth = Math.max(...sp.wid.map(([, halfWidth]) => halfWidth)) * 2;
    const planeWidth = carWidth + .75,
      planeLength = sp.L + 1;
    context.translate(width / 2, height / 2);
    context.scale(width / planeWidth, -height / planeLength);
    const drawBodyShadow = () => {
      context.beginPath();
      for (let sample = 0; sample <= 64; sample++) {
        const station = sp.L * sample / 64;
        const x = sp.hw(station),
          z = station - sp.L / 2;
        sample === 0 ? context.moveTo(x, z) : context.lineTo(x, z);
      }
      for (let sample = 64; sample >= 0; sample--) {
        const station = sp.L * sample / 64;
        context.lineTo(-sp.hw(station), station - sp.L / 2);
      }
      context.closePath();
    };
    context.save();
    context.shadowColor = `rgba(0,0,0,.42)`;
    context.shadowBlur = 22;
    context.fillStyle = `rgba(0,0,0,.13)`;
    drawBodyShadow();
    context.fill();
    context.restore();
    context.save();
    context.shadowColor = `rgba(0,0,0,.22)`;
    context.shadowBlur = 9;
    context.fillStyle = `rgba(0,0,0,.055)`;
    drawBodyShadow();
    context.fill();
    context.restore();
    for (const [station, track, tireWidth] of [[sp.axF, sp.twF, .34], [sp.axR, sp.twR, .36]]) {
      const wheelX = sp.hw(station) - track / 2 - .035;
      for (const side of [-1, 1]) {
        const x = side * wheelX,
          z = station - sp.L / 2;
        const radius = context.createRadialGradient(x, z, .015, x, z, .48);
        radius.addColorStop(0, `rgba(0,0,0,.34)`);
        radius.addColorStop(.42, `rgba(0,0,0,.22)`);
        radius.addColorStop(1, `rgba(0,0,0,0)`);
        context.beginPath();
        context.ellipse(x, z, tireWidth / 2, .48, 0, 0, Math.PI * 2);
        context.fillStyle = radius;
        context.fill();
      }
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = `srgb`;
    dfcShadowTextures.set(sp.name, texture);
  }
  return dfcShadowTextures.get(sp.name);
}

/* body cross-section ring at zf: [x, y, s] with s in 0..14 */
function dfcBodyRing(sp, zf) {
  const hw = sp.hw(zf),
    yt = sp.yTop(zf),
    yb = sp.yBot(zf),
    ye = sp.yEdge(zf);
  const hump = sp.hump(zf);
  const endFade = dfcSmooth(0, .35, Math.min(zf, sp.L - zf));
  const cr = sp.crown * (.4 + .6 * endFade);
  const yS = ye + (yt + hump * .8 - ye) * .5;
  const yU = yt + hump * .85 - cr - Math.min(.1, (yt - ye) * .22);
  const R = [[0, yb], [hw * .74, yb], [hw * .93, ye], [hw, yS], [hw * .985, yU], [hw * .9, yt + hump * .6 - cr * .55 - .02], [hw * .5, yt + hump * .25 - cr * .1], [0, yt]];
  const poly = [];
  R.forEach((p, i) => poly.push([p[0], p[1], i]));
  for (let i = 6; i >= 1; i--) poly.push([-R[i][0], R[i][1], 14 - i]);
  return dfcChaikin(poly, 2, 14);
}

/* greenhouse cross-section at zf */
function dfcCabinRing(sp, zf) {
  const c = sp.cab;
  const yb = sp.cabBase(zf);
  const H = Math.max(.006, sp.roofY(zf) - yb);
  const Hr = c.roof - sp.cabBase((c.rf + c.rr) / 2);
  const t = dfcClamp(H / Hr, 0, 1);
  const wb = sp.hw(zf) - c.inset - .02;
  const TU = c.tum * Math.pow(t, .8);
  const cr = .028 * t + .004;
  const R = [[0, yb], [wb, yb], [wb - TU * .16, yb + H * .3], [wb - TU * .72, yb + H * .84], [wb - TU, yb + H - cr * .5], [(wb - TU) * .55, yb + H - cr * .12], [0, yb + H]];
  const poly = [];
  R.forEach((p, i) => poly.push([p[0], p[1], i]));
  for (let i = 5; i >= 1; i--) poly.push([-R[i][0], R[i][1], 12 - i]);
  return dfcChaikin(poly, 2, 12);
}
function dfcRows(list, a, b, step) {
  const s = new Set(list);
  for (let z = a; z <= b + 1e-6; z += step) s.add(Math.round(z * 1e4) / 1e4);
  return [...s].filter(z => z >= a - 1e-6 && z <= b + 1e-6).sort((p, q) => p - q);
}

/* ---------------------------------------------------------------- wheel */
function dfcWheel(mats, o) {
  const g = new Group();
  const R = o.R,
    tw = o.tw,
    hw_ = tw / 2;
  const rimR = R * .66;
  // tyre
  const tp = dfcSmoothProfile([[-hw_ * .86, rimR - .004], [-hw_ * .98, rimR + .035], [-hw_ * 1.0, R * .84], [-hw_ * .93, R * .955], [-hw_ * .78, R * .993], [-hw_ * .5, R], [-hw_ * .17, R * .995], [-hw_ * .1, R * .985], [hw_ * .1, R * .985], [hw_ * .17, R * .995], [hw_ * .5, R], [hw_ * .78, R * .993], [hw_ * .93, R * .955], [hw_ * 1.0, R * .84], [hw_ * .98, rimR + .035], [hw_ * .86, rimR - .004]], 1);
  const tyre = new Mesh(dfcLathe(tp, o.seg), mats.rubber);
  tyre.castShadow = true;
  g.add(tyre);
  // rim barrel + lip
  const xo = hw_ * .9;
  // outside lip surface + face (dish)
  const face = dfcSmoothProfile([[xo * .98, rimR + .002], [xo * .93, rimR - .012], [xo * .78, rimR - .035], [xo * .5, rimR * .72], [xo * .42, rimR * .5], [xo * .5, rimR * .26], [xo * .62, rimR * .13], [xo * .66, 0]], 1);
  const rim = new Mesh(dfcLathe(face, o.seg), mats.rim);
  g.add(rim);
  // inner barrel (dark, seen through the spokes)
  const barrel = new Mesh(dfcLathe([[xo * .93, rimR - .012], [xo * .1, rimR - .052], [-xo * .85, rimR - .05], [-xo * .95, rimR - .01]], o.seg), mats.dark);
  g.add(barrel);
  // spokes (double spokes)
  const n = o.spokes;
  for (let k = 0; k < n; k++) {
    const a0 = k / n * Math.PI * 2;
    for (const side of [-1, 1]) {
      const ph = a0 + side * .105 * (6 / n);
      const poly = [[rimR * .17, -.021], [rimR * .17, .021], [rimR * .93, .014 * 1.0], [rimR * .93, -.014]];
      g.add(new Mesh(dfcPrism(poly, xo * .56, xo * .78, ph), mats.rim));
    }
  }
  // centre cap and lugs
  const cap = new Mesh(dfcLathe([[xo * .6, 0], [xo * .74, rimR * .06], [xo * .76, rimR * .15], [xo * .68, rimR * .2], [xo * .6, rimR * .2]], 20), mats.chrome);
  g.add(cap);
  for (let k = 0; k < 5; k++) {
    const th = k / 5 * Math.PI * 2;
    const lug = new Mesh(new CylinderGeometry(.011, .011, .02, 6), mats.dark);
    lug.rotation.z = Math.PI / 2;
    lug.position.set(xo * .66, Math.sin(th) * rimR * .27, Math.cos(th) * rimR * .27);
    g.add(lug);
  }
  // brake disc + caliper behind the spokes
  const disc = new Mesh(dfcLathe([[xo * .12, rimR * .84], [xo * .16, rimR * .86], [xo * .16, rimR * .5], [xo * .12, rimR * .5]], o.seg), mats.rotor);
  g.add(disc);
  const cal = [[rimR * .5, -.075], [rimR * .84, -.07], [rimR * .84, .07], [rimR * .5, .075]];
  g.add(new Mesh(dfcPrism(cal, xo * .08, xo * .4, o.calAng), mats.caliper));
  return g;
}

/* ---- surface helpers (points on the body skin) ---- */
function dfcRightHalf(ring) {
  const out = [];
  for (let j = 0; j < ring.length; j++) if (ring[j][2] <= 7.0001 && ring[j][2] >= 0) out.push(ring[j]);
  return out;
}
function dfcPointAt(half, sf) {
  for (let k = 0; k < half.length - 1; k++) {
    const a = half[k],
      b = half[k + 1];
    if (sf >= a[2] && sf <= b[2]) {
      const t = (sf - a[2]) / (b[2] - a[2] || 1);
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, b[0] - a[0], b[1] - a[1]];
    }
  }
  const a = half[half.length - 2],
    b = half[half.length - 1];
  return [b[0], b[1], b[2], b[0] - a[0], b[1] - a[1]];
}
/* position + outward normal on the body skin; side = +1 (right) / -1 (left) */
function dfcSurf(sp, zf, sf, side) {
  const h0 = dfcRightHalf(dfcBodyRing(sp, zf));
  const p = dfcPointAt(h0, sf);
  const h1 = dfcRightHalf(dfcBodyRing(sp, zf - .03)),
    h2 = dfcRightHalf(dfcBodyRing(sp, zf + .03));
  const q1 = dfcPointAt(h1, sf),
    q2 = dfcPointAt(h2, sf);
  const dx = p[3],
    dy = p[4],
    a = (q2[0] - q1[0]) / .06,
    b = (q2[1] - q1[1]) / .06;
  let nx = dy,
    ny = -dx,
    nz = dx * b - dy * a;
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
    nz
  };
}
/* thin ribbon laid on the body (door cuts, hood cuts, stripes) */
function dfcRibbonZ(sp, zf, sa, sb, w, off, side, hl) {
  const A = dfcBodyRing(sp, zf - w / 2),
    B = dfcBodyRing(sp, zf + w / 2);
  const hA = dfcRightHalf(A),
    hB = dfcRightHalf(B);
  const pos = [],
    nor = [],
    idx = [];
  const steps = 14;
  let prev = null;
  for (let k = 0; k <= steps; k++) {
    const sf = sa + (sb - sa) * k / steps;
    const a = dfcPointAt(hA, sf),
      b = dfcPointAt(hB, sf);
    let nx = a[4],
      ny = -a[3];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    const base = pos.length / 3;
    pos.push(side * (a[0] + nx * off), a[1] + ny * off, zf - w / 2 - hl, side * (b[0] + nx * off), b[1] + ny * off, zf + w / 2 - hl);
    nor.push(side * nx, ny, 0, side * nx, ny, 0);
    if (k > 0) {
      if (side > 0) idx.push(base - 2, base - 1, base, base - 1, base + 1, base);else idx.push(base - 2, base, base - 1, base - 1, base, base + 1);
    }
  }
  return dfcBuf(pos, nor, idx);
}
function dfcRibbonS(sp, sf0, sw, za, zb, off, side, hl) {
  const pos = [],
    nor = [],
    idx = [];
  const n = Math.max(2, Math.round((zb - za) / .06));
  for (let k = 0; k <= n; k++) {
    const zf = za + (zb - za) * k / n;
    const h = dfcRightHalf(dfcBodyRing(sp, zf));
    const a = dfcPointAt(h, sf0 - sw / 2),
      b = dfcPointAt(h, sf0 + sw / 2);
    let nxA = a[4],
      nyA = -a[3];
    const la = Math.hypot(nxA, nyA) || 1;
    nxA /= la;
    nyA /= la;
    let nxB = b[4],
      nyB = -b[3];
    const lb = Math.hypot(nxB, nyB) || 1;
    nxB /= lb;
    nyB /= lb;
    const base = pos.length / 3;
    pos.push(side * (a[0] + nxA * off), a[1] + nyA * off, zf - hl, side * (b[0] + nxB * off), b[1] + nyB * off, zf - hl);
    nor.push(side * nxA, nyA, 0, side * nxB, nyB, 0);
    if (k > 0) {
      if (side > 0) idx.push(base - 2, base - 1, base, base - 1, base + 1, base);else idx.push(base - 2, base, base - 1, base - 1, base, base + 1);
    }
  }
  return dfcBuf(pos, nor, idx);
}

/* ---------------------------------------------------------------- the car */
function Vw(e = `#a9b7bf`, t = `coupe`, n = !1, r = !1, hi = !1) {
  const i = new Group();
  const sp = dfcBuildSpec(t);
  const L = sp.L,
    hl = L / 2,
    detail = !!(r || hi);
  const segW = detail ? 44 : 26;
  const kind = sp.name;
  const bodyColor = n ? `#eef0f2` : e;
  const hwMax = Math.max(sp.hw(sp.axF), sp.hw(sp.axR), sp.hw(L / 2));
  const doorA = sp.axF + sp.arch + .1,
    doorC = sp.axR - sp.arch - .08;

  /* ---- materials ---- */
  const paint = new MeshPhysicalMaterial({
    color: bodyColor,
    metalness: .55,
    roughness: .24,
    clearcoat: 1,
    clearcoatRoughness: .04,
    envMapIntensity: 2.0,
    sheen: .25,
    sheenRoughness: .3,
    sheenColor: `#fff6e8`
  });
  const glass = new MeshPhysicalMaterial({
    color: `#04080c`,
    metalness: .05,
    roughness: .03,
    transparent: !0,
    opacity: .84,
    clearcoat: 1,
    clearcoatRoughness: .02,
    envMapIntensity: 2.4,
    ior: 1.45
  });
  const trim = new MeshStandardMaterial({
    color: `#0a0c0e`,
    metalness: .3,
    roughness: .5
  });
  const matte = new MeshStandardMaterial({
    color: `#060708`,
    roughness: .85,
    metalness: .1
  });
  const linerMat = new MeshStandardMaterial({
    color: `#050607`,
    roughness: .9,
    metalness: 0,
    side: 2
  });
  const chrome = new MeshStandardMaterial({
    color: `#d6dade`,
    metalness: 1,
    roughness: .08,
    envMapIntensity: 1.6
  });
  const wm = {
    rubber: new MeshStandardMaterial({
      color: `#0b0b0c`,
      roughness: .88,
      metalness: .02
    }),
    rim: new MeshStandardMaterial({
      color: `#c9ced2`,
      metalness: 1,
      roughness: .18,
      envMapIntensity: 1.6,
      side: 2
    }),
    dark: new MeshStandardMaterial({
      color: `#0d0f11`,
      metalness: .6,
      roughness: .5,
      side: 2
    }),
    chrome,
    rotor: new MeshStandardMaterial({
      color: `#7a7f84`,
      metalness: .9,
      roughness: .35,
      side: 2
    }),
    caliper: new MeshStandardMaterial({
      color: kind === `muscle` || kind === `coupe` ? `#c4271a` : `#d8b400`,
      metalness: .4,
      roughness: .4
    })
  };
  const lampMat = new MeshStandardMaterial({
    color: `#fffdf4`,
    emissive: `#fff6cf`,
    emissiveIntensity: 1.7,
    roughness: .12
  });
  const lensMat = new MeshPhysicalMaterial({
    color: `#cfe0ff`,
    transparent: !0,
    opacity: .4,
    roughness: .05,
    clearcoat: 1,
    envMapIntensity: 1.4
  });
  const amber = new MeshStandardMaterial({
    color: `#2a1600`,
    emissive: `#ff9a1a`,
    emissiveIntensity: 1.3,
    roughness: .4
  });
  const addMesh = (geo, mat, cast = !0, recv = !0) => {
    const m = new Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = recv;
    i.add(m);
    return m;
  };

  /* soft contact shadow */
  const sh = new Mesh(new PlaneGeometry(hwMax * 2 + .75, L + 1), new MeshBasicMaterial({
    map: dfcGetShadowTexture(sp),
    transparent: !0,
    opacity: .72,
    depthWrite: !1,
    toneMapped: !1
  }));
  sh.rotation.x = -Math.PI / 2;
  sh.position.y = -.01;
  sh.renderOrder = 1;
  i.add(sh);

  /* ---- lower body loft ---- */
  const bz = [0, .012, .03, .055, .09, .13, .18, .24, .31];
  const rowsB = new Set(bz);
  bz.forEach(z => rowsB.add(Math.round((L - z) * 1e4) / 1e4));
  for (let z = .4; z < L - .3; z += .09) rowsB.add(Math.round(z * 1e4) / 1e4);
  for (const za of [sp.axF, sp.axR]) {
    const ar = sp.arch;
    for (let d = -ar - .05; d <= ar + .05; d += .03) rowsB.add(Math.round((za + d) * 1e4) / 1e4);
    rowsB.add(Math.round((za - ar - .004) * 1e4) / 1e4);
    rowsB.add(Math.round((za - ar) * 1e4) / 1e4);
    rowsB.add(Math.round((za + ar) * 1e4) / 1e4);
    rowsB.add(Math.round((za + ar + .004) * 1e4) / 1e4);
  }
  const rb = [...rowsB].filter(z => z >= 0 && z <= L).sort((p, q) => p - q);
  const ring0 = dfcBodyRing(sp, rb[0]);
  const nr = ring0.length,
    nzB = rb.length;
  const PB = new Float32Array(nzB * nr * 3);
  const ringsB = rb.map(z => dfcBodyRing(sp, z));
  ringsB.forEach((ring, ii) => ring.forEach((p, j) => {
    const a = (ii * nr + j) * 3;
    PB[a] = p[0];
    PB[a + 1] = p[1];
    PB[a + 2] = rb[ii] - hl;
  }));
  const NB = dfcNormals(PB, nzB, nr);
  const fold14 = s => s <= 7 ? s : 14 - s;
  const sfB = ring0.map(p => fold14(p[2]));
  const inArch = z => Math.abs(z - sp.axF) < sp.arch + .03 || Math.abs(z - sp.axR) < sp.arch + .03;
  const bodyGeos = dfcGridGeos(PB, NB, nzB, nr, (ii, j) => {
    const zf = (rb[ii] + rb[ii + 1]) / 2,
      j1 = (j + 1) % nr;
    const sf = (sfB[j] + sfB[j1]) / 2;
    if (detail && zf > doorA && zf < doorC && sf >= 2.35 && sf <= 4.9 && ring0[j][0] + ring0[j1][0] < -.05) return null;
    if (sf < 1.5) return `trim`;
    if (sf < (inArch(zf) ? 2.0 : 2.28)) return `trim`;
    return `paint`;
  });
  if (bodyGeos.paint) addMesh(bodyGeos.paint, paint);
  if (bodyGeos.trim) addMesh(bodyGeos.trim, trim);
  addMesh(dfcCap(ringsB[0].map(p => [p[0], p[1]]), rb[0] - hl, -1), trim);
  addMesh(dfcCap(ringsB[nzB - 1].map(p => [p[0], p[1]]), rb[nzB - 1] - hl, 1), paint);

  /* ---- greenhouse loft ---- */
  const cb = sp.cab;
  const cz = new Set([cb.ws, cb.rf, cb.rr, cb.rg]);
  if (cb.bp) {
    cz.add(cb.bp - .05);
    cz.add(cb.bp - .02);
    cz.add(cb.bp + .02);
    cz.add(cb.bp + .05);
  }
  [.015, .04, .08, .13].forEach(d => {
    cz.add(cb.ws + d);
    cz.add(cb.rg - d);
  });
  for (let z = cb.ws; z < cb.rg; z += .07) cz.add(Math.round(z * 1e4) / 1e4);
  const rc = [...cz].filter(z => z >= cb.ws - 1e-6 && z <= cb.rg + 1e-6).sort((p, q) => p - q);
  const ringC0 = dfcCabinRing(sp, rc[0]);
  const ncr = ringC0.length,
    nzC = rc.length;
  const PC = new Float32Array(nzC * ncr * 3);
  rc.forEach((z, ii) => dfcCabinRing(sp, z).forEach((p, j) => {
    const a = (ii * ncr + j) * 3;
    PC[a] = p[0];
    PC[a + 1] = p[1];
    PC[a + 2] = z - hl;
  }));
  const NC = dfcNormals(PC, nzC, ncr);
  const fold12 = s => s <= 6 ? s : 12 - s;
  const sfC = ringC0.map(p => fold12(p[2]));
  const cabGeos = dfcGridGeos(PC, NC, nzC, ncr, (ii, j) => {
    const zf = (rc[ii] + rc[ii + 1]) / 2,
      j1 = (j + 1) % ncr;
    const sf = (sfC[j] + sfC[j1]) / 2;
    if (detail && zf > doorA && zf < doorC && sf >= 2 && sf <= 4.5 && ringC0[j][0] + ringC0[j1][0] < -.05) return null;
    if (sf < 1.3) return null;
    // belt molding
    if (sf < 2.0) return `trim`;
    // B pillar
    if (cb.bp && Math.abs(zf - cb.bp) < .05 && sf < 4.45) return `trim`;
    // sail panel / C pillar
    if (zf >= cb.cp && sf < 4.55) return `paint`;
    // A pillar
    if (zf <= cb.rf + .02 && sf >= 3.45 && sf < 4.45) return `paint`;
    // roof panel
    if (zf > cb.rf - .01 && zf < cb.rr && sf >= 4.45) return `paint`;
    // rear glass vs rear quarter bands
    if (zf >= cb.rr && sf >= 4.45 && sf < cb.rgs) return `paint`;
    return `glass`;
  });
  if (cabGeos.glass) addMesh(cabGeos.glass, glass, !1, !1);
  if (cabGeos.paint) addMesh(cabGeos.paint, paint);
  if (cabGeos.trim) addMesh(cabGeos.trim, trim);
  if (detail) {
    const cabin = new Group();
    i.add(cabin);
    const upholstery = new MeshStandardMaterial({
      color: `#171a1e`,
      roughness: .82,
      metalness: .02
    });
    const softLeather = new MeshStandardMaterial({
      color: `#25292d`,
      roughness: .76,
      metalness: .025
    });
    const carpet = new MeshStandardMaterial({
      color: `#090b0d`,
      roughness: .98,
      metalness: 0
    });
    const cabinMetal = new MeshStandardMaterial({
      color: `#555d64`,
      roughness: .35,
      metalness: .78
    });
    const cabinChrome = new MeshStandardMaterial({
      color: `#aeb5b9`,
      roughness: .22,
      metalness: .92
    });
    const display = new MeshStandardMaterial({
      color: `#08151b`,
      emissive: `#26758a`,
      emissiveIntensity: .4,
      roughness: .3,
      metalness: .18
    });
    const cabinBox = (material, size, pos, rot = null, parent = cabin) => {
      const mesh = new Mesh(new BoxGeometry(...size), material);
      mesh.position.set(...pos);
      if (rot) mesh.rotation.set(...rot);
      mesh.castShadow = !0;
      mesh.receiveShadow = !0;
      parent.add(mesh);
      return mesh;
    };
    const cabinCylinder = (material, radius, length, pos, rot = null, parent = cabin) => {
      const mesh = new Mesh(new CylinderGeometry(radius, radius, length, 20), material);
      mesh.position.set(...pos);
      if (rot) mesh.rotation.set(...rot);
      mesh.castShadow = !0;
      parent.add(mesh);
      return mesh;
    };
    cabinBox(carpet, [1.46, .035, 2.2], [0, .205, .2]);
    cabinBox(upholstery, [1.48, .16, .25], [0, .72, cb.ws - hl + .08]);
    cabinBox(softLeather, [1.45, .075, .14], [0, .81, cb.ws - hl + .13]);
    cabinBox(upholstery, [.13, .19, 1.05], [-.725, .55, .25]);
    cabinBox(upholstery, [.13, .19, 1.05], [.725, .55, .25]);
    for (const side of [-1, 1]) {
      const seat = new Group();
      seat.position.set(side * .4, 0, .35);
      cabin.add(seat);
      cabinBox(upholstery, [.5, .13, .53], [0, .32, 0], null, seat);
      cabinBox(softLeather, [.4, .09, .4], [0, .39, -.025], null, seat);
      cabinBox(upholstery, [.48, .47, .13], [0, .61, .205], [-.08, 0, 0], seat);
      cabinBox(softLeather, [.34, .32, .025], [0, .62, .132], [-.08, 0, 0], seat);
      for (const sx of [-1, 1]) {
        cabinBox(softLeather, [.07, .42, .17], [sx * .205, .61, .19], [-.08, 0, 0], seat);
        cabinBox(upholstery, [.075, .17, .38], [sx * .215, .39, 0], null, seat);
      }
      cabinBox(upholstery, [.24, .15, .12], [0, .91, .24], null, seat);
      for (const sx of [-1, 1]) cabinCylinder(cabinMetal, .012, .13, [sx * .075, .84, .24], null, seat);
    }
    const dashZ = cb.ws - hl + .02;
    cabinBox(upholstery, [1.53, .19, .25], [0, .69, dashZ + .2], [-.12, 0, 0]);
    cabinBox(softLeather, [1.46, .035, .19], [0, .8, dashZ + .2], [-.12, 0, 0]);
    cabinBox(cabinMetal, [.39, .105, .018], [.35, .73, dashZ + .065], [-.1, 0, 0]);
    cabinBox(display, [.34, .075, .014], [.35, .74, dashZ + .052], [-.1, 0, 0]);
    cabinBox(cabinChrome, [.49, .018, .018], [.35, .665, dashZ + .05]);
    for (const side of [-1, 1]) {
      const dial = new Mesh(new TorusGeometry(.064, .009, 8, 24), cabinMetal);
      dial.position.set(-.4 + side * .085, .735, dashZ + .045);
      dial.rotation.y = Math.PI;
      cabin.add(dial);
      const face = new Mesh(new TorusGeometry(.052, .006, 8, 24), display);
      face.position.set(-.4 + side * .085, .735, dashZ + .035);
      face.rotation.y = Math.PI;
      cabin.add(face);
    }
    const steering = new Group();
    steering.position.set(-.4, .665, dashZ + .48);
    steering.rotation.y = Math.PI;
    cabin.add(steering);
    steering.add(new Mesh(new TorusGeometry(.17, .021, 10, 36), upholstery));
    cabinCylinder(cabinChrome, .038, .045, [0, 0, 0], [Math.PI / 2, 0, 0], steering);
    for (let spoke = 0; spoke < 3; spoke++) {
      const bar = cabinBox(cabinChrome, [.016, .135, .014], [0, 0, 0], null, steering);
      bar.rotation.z = spoke * Math.PI * 2 / 3;
    }
    cabinBox(upholstery, [.09, .09, .24], [-.4, .56, dashZ + .56], [-.27, 0, 0]);
    cabinBox(upholstery, [.3, .105, .98], [.05, .34, .26], [-.06, 0, 0]);
    cabinBox(softLeather, [.28, .035, .68], [.05, .405, .22], [-.06, 0, 0]);
    const gearLever = new Group();
    gearLever.position.set(.13, .4, .12);
    cabin.add(gearLever);
    cabinCylinder(cabinChrome, .014, .16, [0, .075, 0], [-.32, 0, 0], gearLever);
    const gearKnob = new Mesh(new SphereGeometry(.043, 14, 10), upholstery);
    gearKnob.position.set(0, .15, -.025);
    gearLever.add(gearKnob);
    const handbrake = new Group();
    handbrake.position.set(-.1, .4, .25);
    cabin.add(handbrake);
    cabinCylinder(cabinMetal, .013, .2, [0, .1, 0], [-.3, 0, 0], handbrake);
    cabinBox(upholstery, [.065, .04, .095], [0, .2, -.045], null, handbrake);
    for (const [px, width] of [[-.59, .085], [-.43, .105], [-.27, .09]]) {
      const pedal = new Group();
      pedal.position.set(px, .245, dashZ + .53);
      cabin.add(pedal);
      cabinBox(cabinMetal, [width, .13, .025], [0, 0, -.025], [-.2, 0, 0], pedal);
      for (let line = -1; line <= 1; line++) cabinBox(upholstery, [width * .68, .009, .008], [0, line * .033, -.041], null, pedal);
    }
  }
  let accessDoor = null;
  if (detail) {
    const hingeSf = 3.35;
    const hingeP = dfcPointAt(dfcRightHalf(dfcBodyRing(sp, doorA)), hingeSf);
    let hx = hingeP[4],
      hy = -hingeP[3],
      hn = Math.hypot(hx, hy) || 1;
    hx /= hn;
    hy /= hn;
    accessDoor = new Group();
    accessDoor.position.set(-(hingeP[0] + hx * .008), hingeP[1] + hy * .008, doorA - hl);
    i.add(accessDoor);
    const buildDoorSurface = (zStart, zEnd, sfStart, sfEnd, cabinSurface, material, offset) => {
      const nz = 18,
        ns = 12,
        positions = [],
        normals = [],
        indices = [];
      for (let zi = 0; zi <= nz; zi++) {
        const zf = zStart + (zEnd - zStart) * zi / nz;
        const ring = cabinSurface ? dfcCabinRing(sp, zf) : dfcBodyRing(sp, zf);
        const half = dfcRightHalf(ring);
        for (let si = 0; si <= ns; si++) {
          const sf = sfStart + (sfEnd - sfStart) * si / ns;
          const p = dfcPointAt(half, sf);
          let nx = p[4],
            ny = -p[3],
            length = Math.hypot(nx, ny) || 1;
          nx /= length;
          ny /= length;
          positions.push(-(p[0] + nx * offset) - accessDoor.position.x, p[1] + ny * offset - accessDoor.position.y, zf - hl - accessDoor.position.z);
          normals.push(-nx, ny, 0);
        }
      }
      for (let zi = 0; zi < nz; zi++) for (let si = 0; si < ns; si++) {
        const a = zi * (ns + 1) + si,
          b = a + ns + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
      const geometry = dfcBuf(positions, normals, indices);
      const mesh = new Mesh(geometry, material);
      mesh.castShadow = !0;
      mesh.receiveShadow = !0;
      accessDoor.add(mesh);
    };
    buildDoorSurface(doorA + .015, doorC - .015, 2.38, 4.62, !1, paint, .014);
    buildDoorSurface(doorA + .045, doorC - .045, 2.35, 4.42, !0, new MeshPhysicalMaterial({
      color: `#17232b`,
      metalness: .18,
      roughness: .12,
      transparent: !0,
      opacity: .62,
      side: 2,
      depthWrite: !1
    }), .023);
    const handlePoint = dfcPointAt(dfcRightHalf(dfcBodyRing(sp, doorC - .3)), 4.15);
    let handleNx = handlePoint[4],
      handleNy = -handlePoint[3],
      handleLength = Math.hypot(handleNx, handleNy) || 1;
    handleNx /= handleLength;
    handleNy /= handleLength;
    const doorHandle = new Mesh(new BoxGeometry(.17, .025, .035), chrome);
    doorHandle.position.set(-(handlePoint[0] + handleNx * .035) - accessDoor.position.x, handlePoint[1] + handleNy * .035 - accessDoor.position.y, doorC - .3 - hl - accessDoor.position.z);
    accessDoor.add(doorHandle);
  }

  /* ---- wheels and arches ---- */
  const ae = [];
  for (const [za, tw, sx] of [[sp.axF, sp.twF, -1], [sp.axF, sp.twF, 1], [sp.axR, sp.twR, -1], [sp.axR, sp.twR, 1]]) {
    const x = sx * (sp.hw(za) - tw / 2 - .035);
    const w = dfcWheel(wm, {
      R: sp.R,
      tw,
      seg: segW,
      spokes: 5,
      calAng: .0
    });
    w.position.set(x, sp.R, za - hl);
    if (sx < 0) w.rotation.y = Math.PI;
    i.add(w);
    ae.push(w);
    const outer = sp.hw(za) * .925 - .01,
      wid = .5;
    const liner = new Mesh(new CylinderGeometry(sp.arch - .012, sp.arch - .012, wid, 30, 1, !0, -.6, Math.PI + 1.2), linerMat);
    liner.rotation.z = Math.PI / 2;
    liner.position.set(sx * (outer - wid / 2), sp.R, za - hl);
    i.add(liner);
  }

  /* ================= details ================= */
  const brake = [],
    heads = [],
    beamList = [];
  const carbon = new MeshStandardMaterial({
    color: `#0b0d10`,
    metalness: .55,
    roughness: .38
  });
  const lineMat = new MeshStandardMaterial({
    color: `#06080a`,
    roughness: .6,
    metalness: .2
  });
  const place = (geo, mat, S, off = 0, cast = !1) => {
    const m = new Mesh(geo, mat);
    i.add(m);
    m.position.set(S.x + S.nx * off, S.y + S.ny * off, S.z - hl + S.nz * off);
    m.lookAt(m.position.x + S.nx, m.position.y + S.ny, m.position.z + S.nz);
    m.castShadow = cast;
    m.receiveShadow = !0;
    return m;
  };
  const unitSph = new SphereGeometry(1, 18, 12);
  const front = -hl,
    rear = hl;
  const cbz = sp.cab;
  const lamp = Object.assign({
    hz: .2,
    hs: 4.55,
    hw: .21,
    hh: .07,
    tz: L - .13,
    ts: 4.5,
    tw: .26,
    th: .065
  }, sp.lamp || {});

  /* shut lines and hood cuts */
  for (const sd of [-1, 1]) {
    if (!(detail && sd < 0)) for (const zl of [doorA, doorC]) addMesh(dfcRibbonZ(sp, zl, 2.35, 4.9, .012, .0025, sd, hl), lineMat, !1, !1);
    addMesh(dfcRibbonS(sp, 5.6, .05, .45, cbz.ws - .03, .002, sd, hl), lineMat, !1, !1);
    // door handle
    if (!(detail && sd < 0)) {
      const hS = dfcSurf(sp, doorC - .3, 4.15, sd);
      place(new BoxGeometry(.17, .02, .03), chrome, hS, -.004);
    }
    // mirrors
    const zM = cbz.ws + .28,
      wbM = sp.hw(zM) - cbz.inset - .02,
      yM = sp.cabBase(zM) + .12;
    const mirror = new Mesh(unitSph, paint);
    i.add(mirror);
    mirror.scale.set(.055, .048, .1);
    mirror.position.set(sd * (wbM + .13), yM + .045, zM - hl - .02);
    mirror.castShadow = !0;
    const stalk = new Mesh(new BoxGeometry(.12, .018, .04), trim);
    i.add(stalk);
    stalk.position.set(sd * (wbM + .07), yM, zM - hl);
  }
  addMesh(dfcRibbonZ(sp, .55, 5.0, 7.0, .01, .002, 1, hl), lineMat, !1, !1);
  addMesh(dfcRibbonZ(sp, .55, 5.0, 7.0, .01, .002, -1, hl), lineMat, !1, !1);

  /* headlights */
  for (const sd of [-1, 1]) {
    const S = dfcSurf(sp, lamp.hz, lamp.hs, sd);
    const lens = place(unitSph, lensMat, S, .004);
    lens.scale.set(lamp.hw, lamp.hh, .04);
    const core = place(unitSph, lampMat, S, -.004);
    core.scale.set(lamp.hw * .8, lamp.hh * .55, .03);
    heads.push(core);
    const drl = place(new BoxGeometry(lamp.hw * 1.5, .012, .012), new MeshBasicMaterial({
      color: `#e8f4ff`
    }), S, .018);
    drl.translateY(-lamp.hh * .7);
    // front indicator
    const ind = dfcSurf(sp, lamp.hz + .06, lamp.hs - 1.7, sd);
    const lens2 = place(unitSph, amber, ind, .002);
    lens2.scale.set(.07, .022, .02);
  }
  /* tail lights */
  for (const sd of [-1, 1]) {
    const S = dfcSurf(sp, lamp.tz, lamp.ts, sd);
    const m = new MeshStandardMaterial({
      color: `#a30f0f`,
      emissive: `#ff2020`,
      emissiveIntensity: .15,
      roughness: .3
    });
    const tl = place(unitSph, m, S, -.004);
    tl.scale.set(lamp.tw, lamp.th, .03);
    brake.push(tl);
  }
  {
    const bar = new MeshStandardMaterial({
      color: `#1a0404`,
      emissive: `#ff3030`,
      emissiveIntensity: .5,
      roughness: .4
    });
    const yB = (sp.yBot(L) + sp.yTop(L)) / 2 + .1;
    const strip = new Mesh(new BoxGeometry(hwMax * 1.0, .02, .012), bar);
    i.add(strip);
    strip.position.set(0, yB, hl + .006);
    const rev = new Mesh(new BoxGeometry(.14, .03, .012), new MeshStandardMaterial({
      color: `#dfe6ea`,
      emissive: `#ffffff`,
      emissiveIntensity: .35,
      roughness: .3
    }));
    i.add(rev);
  }

  /* focused player headlight spotlights */
  if (r) {
    const hz = lamp.hz;
    for (const sd of [-1, 1]) {
      const S = dfcSurf(sp, hz, lamp.hs, sd);
      const sl = new SpotLight(`#fff0d8`, 10, 56, .27, .72, 2);
      sl.position.set(S.x, S.y, S.z - hl - .05);
      const tg = new Object3D();
      tg.position.set(sd * .28, -1.35, -hl - 32);
      i.add(tg);
      sl.target = tg;
      i.add(sl);
      beamList.push(sl);
    }
  }

  /* police package: roof light bar, dark door panels, push bar */
  if (n) {
    const zc = (cbz.rf + cbz.rr) / 2,
      yr = sp.roofY(zc) + .03;
    const barBase = new Mesh(new BoxGeometry(.62, .07, .3), trim);
    barBase.position.set(0, yr + .035, zc - hl);
    i.add(barBase);
    for (const ex of [-.17, .17]) {
      const lm = new MeshBasicMaterial({
        color: ex < 0 ? `#3a8eff` : `#ff3434`
      });
      const lb = new Mesh(new BoxGeometry(.3, .1, .26), lm);
      lb.position.set(ex, yr + .115, zc - hl);
      lb.name = ex < 0 ? `blue` : `red`;
      i.add(lb);
    }
    const glow = new Mesh(new BoxGeometry(.12, .05, .12), new MeshBasicMaterial({
      color: `#fff8a0`
    }));
    glow.position.set(0, yr + .1, zc - hl);
    i.add(glow);
    for (const sd of [-1, 1]) addMesh(dfcRibbonS(sp, 3.3, 1.0, doorA + .02, doorC - .02, .004, sd, hl), trim, !1, !1);
    const pb = new Mesh(new BoxGeometry(hwMax * 1.15, .07, .05), chrome);
    pb.position.set(0, sp.yBot(0) + .1, front - .05);
    i.add(pb);
  }

  /* grille bars + plates */
  {
    const y0 = sp.yBot(0) + .05,
      y1 = sp.yTop(0) - .05,
      wG = sp.hw(0) * 1.15;
    for (let k = 0; k < 4; k++) {
      const gb = new Mesh(new BoxGeometry(wG, .012, .012), chrome);
      i.add(gb);
      gb.position.set(0, y0 + (y1 - y0) * (k + .5) / 4, front - .004);
    }
    const plateTex = Vw._plateTex || (Vw._plateTex = (() => {
      const cv = document.createElement(`canvas`);
      cv.width = 256;
      cv.height = 64;
      const q = cv.getContext(`2d`);
      q.fillStyle = `#f1efe4`;
      q.fillRect(0, 0, 256, 64);
      q.fillStyle = `#1b3a8a`;
      q.fillRect(0, 0, 22, 64);
      q.fillStyle = `#ffffff`;
      q.font = `bold 11px monospace`;
      q.textAlign = `center`;
      q.fillText(`DF`, 11, 54);
      q.fillStyle = `#16181c`;
      q.font = `bold 40px monospace`;
      q.fillText(`FURY 77`, 140, 47);
      q.strokeStyle = `#16181c`;
      q.lineWidth = 3;
      q.strokeRect(1.5, 1.5, 253, 61);
      const tx = new CanvasTexture(cv);
      tx.anisotropy = 8;
      return tx;
    })());
    const plateMat = Vw._plateMat || (Vw._plateMat = new MeshStandardMaterial({
      map: plateTex,
      roughness: .4,
      metalness: .1
    }));
    const fp = new Mesh(new PlaneGeometry(.5, .125), plateMat);
    fp.rotation.y = Math.PI;
    fp.position.set(0, (sp.yBot(0) + sp.yTop(0)) / 2 - .03, front - .012);
    i.add(fp);
    const rp = new Mesh(new PlaneGeometry(.5, .125), plateMat);
    rp.position.set(0, (sp.yBot(L) + sp.yTop(L)) / 2 - .02, rear + .012);
    i.add(rp);
  }

  /* exhaust */
  {
    const xs = kind === `gtr` || kind === `hyper` ? [-.62, -.46, .46, .62] : [-.5, .5];
    for (const x of xs) {
      const tip = new Mesh(new CylinderGeometry(.05, .05, .2, 20, 1, !0), chrome);
      tip.material.side = 2;
      tip.rotation.x = Math.PI / 2;
      tip.position.set(x, sp.yBot(L) + .07, rear + .015);
      i.add(tip);
      const inner = new Mesh(new CylinderGeometry(.042, .042, .02, 16), matte);
      inner.rotation.x = Math.PI / 2;
      inner.position.set(x, sp.yBot(L) + .07, rear - .06);
      i.add(inner);
    }
  }

  /* aero: spoilers and wings */
  {
    const mkShape = pts => {
      const sh_ = new Shape();
      sh_.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) sh_.lineTo(pts[k][0], pts[k][1]);
      sh_.closePath ? sh_.closePath() : 0;
      return sh_;
    };
    const wingPack = (chord, hgt, span, zc, thick) => {
      const yD = sp.yTop(zc) - .02;
      const yW = yD + hgt;
      const zc_ = zc - hl;
      const blade = mkShape([[zc_ - chord / 2, yW + thick * .3], [zc_ - chord * .3, yW + thick], [zc_ + chord / 2, yW + thick * .25], [zc_ + chord / 2, yW], [zc_ - chord * .2, yW - thick * .3], [zc_ - chord / 2, yW + thick * .1]]);
      i.add(Lw(blade, span, carbon, .006));
      for (const sx of [-1, 1]) {
        const stand = mkShape([[zc_ - .05, yD], [zc_ + .06, yD], [zc_ + .03, yW - .005], [zc_ - .05, yW - .005]]);
        const m = Lw(stand, .035, carbon, .004);
        m.position.x = sx * span * .27;
        i.add(m);
        const plate = mkShape([[zc_ - chord / 2 - .02, yW - .08], [zc_ + chord / 2 + .03, yW - .04], [zc_ + chord / 2 + .03, yW + .1], [zc_ - chord / 2 - .02, yW + .06]]);
        const pm = Lw(plate, .016, carbon, .004);
        pm.position.x = sx * (span / 2 + .008);
        i.add(pm);
      }
    };
    const lip = (z1, z2, h, span) => {
      const y0 = sp.yTop(z1) - .02,
        a = z1 - hl,
        b = z2 - hl;
      const shp = mkShape([[a, y0], [b - .03, y0 + h], [b, y0 + h], [b, y0 + h * .55], [b - .1, y0]]);
      i.add(Lw(shp, span, paint, .008));
    };
    if (kind === `gtr`) wingPack(.34, .3, hwMax * 1.82, L - .42, .04);else if (kind === `hyper`) wingPack(.42, .42, hwMax * 1.8, L - .5, .05);else if (kind === `super`) lip(L - .75, L - .1, .1, hwMax * 1.5);else if (kind === `porsche`) lip(L - .75, L - .12, .13, hwMax * 1.4);else if (kind === `muscle`) lip(L - .55, L - .08, .07, hwMax * 1.6);else lip(L - .55, L - .08, .07, hwMax * 1.55);
  }
  ae.forEach(w => Iw(w));
  Iw(i, new Set([...brake, ...heads]));
  i.userData = {
    wheels: ae,
    brakeLights: brake,
    headlights: heads,
    headlightBeams: beamList,
    accessDoor
  };
  return i;
}
var Hw = e => -25 + Math.sin((e + 170) / 45) * 58,
  Uw = (e, t) => t < -150 && e < 120 ? Math.min(42, (-t - 150) * .14) : 0;
function Ww(e) {
  let t = e >>> 0;
  return () => {
    t = t + 1831565813 >>> 0;
    let e = t;
    return e = Math.imul(e ^ e >>> 15, e | 1), e ^= e + Math.imul(e ^ e >>> 7, e | 61), ((e ^ e >>> 14) >>> 0) / 4294967296;
  };
}
function Gw(e, t, n, r, i) {
  let a = Ww(i),
    o = new Float32Array(t * t),
    s = 1,
    c = 0;
  for (let e = 0; e < n; e++) {
    let n = 2 ** e;
    t / n;
    let i = new Float32Array((n + 1) * (n + 1));
    for (let e = 0; e < i.length; e++) i[e] = a();
    for (let e = 0; e < t; e++) for (let r = 0; r < t; r++) {
      let a = r / t * n,
        c = e / t * n,
        l = Math.floor(a),
        u = Math.floor(c),
        d = a - l,
        f = c - u,
        p = i[u * (n + 1) + l],
        m = i[u * (n + 1) + l + 1],
        h = i[(u + 1) * (n + 1) + l],
        g = i[(u + 1) * (n + 1) + l + 1],
        _ = d * d * (3 - 2 * d),
        v = f * f * (3 - 2 * f);
      o[e * t + r] += (p * (1 - _) * (1 - v) + m * _ * (1 - v) + h * (1 - _) * v + g * _ * v) * s;
    }
    c += s, s *= r;
  }
  return {
    grid: o,
    max: c
  };
}
function Kw(e = 6) {
  let t = document.createElement(`canvas`);
  t.width = t.height = 256;
  let n = t.getContext(`2d`),
    {
      grid: r,
      max: i
    } = Gw(n, 256, 5, .55, 1337),
    a = n.createImageData(256, 256);
  for (let e = 0; e < 65536; e++) {
    let t = 36 + r[e] / i * 26;
    a.data[e * 4] = t, a.data[e * 4 + 1] = t + 2, a.data[e * 4 + 2] = t + 4, a.data[e * 4 + 3] = 255;
  }
  n.putImageData(a, 0, 0), n.strokeStyle = `rgba(0,0,0,0.5)`, n.lineWidth = 1;
  for (let e = 0; e < 14; e++) {
    n.beginPath();
    let e = Math.random() * 256,
      t = Math.random() * 256;
    n.moveTo(e, t);
    for (let r = 0; r < 18; r++) e += (Math.random() - .5) * 26, t += (Math.random() - .5) * 26, n.lineTo(e, t);
    n.stroke();
  }
  for (let e = 0; e < 10; e++) {
    let e = n.createRadialGradient(Math.random() * 256, Math.random() * 256, 0, Math.random() * 256, Math.random() * 256, 14);
    e.addColorStop(0, `rgba(10,10,12,0.5)`), e.addColorStop(1, `rgba(10,10,12,0)`), n.fillStyle = e, n.fillRect(0, 0, 256, 256);
  }
  for (let e = 0; e < 1800; e++) n.fillStyle = `rgba(0,0,0,${Math.random() * .3})`, n.fillRect(Math.random() * 256, Math.random() * 256, 1.4, 1.4);
  let o = new CanvasTexture(t);
  return o.wrapS = o.wrapT = RepeatWrapping, o.anisotropy = 8, o.repeat.set(e, e), o;
}
function qw(e, t = 2.4) {
  const sourceCanvas = e.image || e;
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const source = sourceCanvas.getContext(`2d`).getImageData(0, 0, width, height).data;
  const normalCanvas = document.createElement(`canvas`);
  normalCanvas.width = width;
  normalCanvas.height = height;
  const context = normalCanvas.getContext(`2d`);
  const image = context.createImageData(width, height);
  const sample = (x, y) => source[(Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))) * 4] / 255;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) * t;
      const dy = (sample(x, y + 1) - sample(x, y - 1)) * t;
      const length = Math.hypot(dx, dy, 1) || 1;
      const index = (y * width + x) * 4;
      image.data[index] = (dx / length * .5 + .5) * 255;
      image.data[index + 1] = (dy / length * .5 + .5) * 255;
      image.data[index + 2] = (1 / length * .5 + .5) * 255;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const normalMap = new CanvasTexture(normalCanvas);
  return normalMap.wrapS = normalMap.wrapT = RepeatWrapping, normalMap.anisotropy = 8, normalMap;
}
function Jw(e = 6) {
  const S = 512;
  const mk = () => {
    const cv = document.createElement(`canvas`);
    cv.width = cv.height = S;
    return cv;
  };
  const rnd = Ww(4242 + e);
  const A = mk(),
    H = mk(),
    R = mk();
  const a = A.getContext(`2d`),
    h = H.getContext(`2d`),
    r = R.getContext(`2d`);
  const wrap = fn => {
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      for (const c of [a, h, r]) {
        c.save();
        c.translate(ox, oy);
      }
      fn();
      for (const c of [a, h, r]) c.restore();
    }
  };
  a.fillStyle = `#45494e`;
  a.fillRect(0, 0, S, S);
  h.fillStyle = `#808080`;
  h.fillRect(0, 0, S, S);
  r.fillStyle = `#c4c4c4`;
  r.fillRect(0, 0, S, S);
  // broad tonal variation
  for (let q = 0; q < 95; q++) {
    const x = rnd() * S,
      y = rnd() * S,
      rad = 24 + rnd() * 82,
      dark = rnd() > .5;
    wrap(() => {
      const gr = a.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, dark ? `rgba(12,14,17,0.09)` : `rgba(185,192,198,0.055)`);
      gr.addColorStop(1, `rgba(0,0,0,0)`);
      a.fillStyle = gr;
      a.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    });
  }
  // aggregate: fine stones, they carry the bump and the sparkle
  for (let q = 0; q < 56000; q++) {
    const x = rnd() * S,
      y = rnd() * S,
      sz = .6 + rnd() * 1.0,
      t = rnd();
    a.fillStyle = t > .68 ? `rgba(151,158,164,${.1 + rnd() * .2})` : t > .28 ? `rgba(18,21,24,${.14 + rnd() * .24})` : `rgba(91,94,97,${.1 + rnd() * .19})`;
    a.fillRect(x, y, sz, sz);
    h.fillStyle = t > .68 ? `rgba(255,255,255,${.16 + rnd() * .22})` : `rgba(0,0,0,${.12 + rnd() * .22})`;
    h.fillRect(x, y, sz, sz);
  }
  // old repair patches
  for (let q = 0; q < 2; q++) {
    const x = rnd() * S * .8,
      y = rnd() * S * .8,
      pw = 60 + rnd() * 120,
      ph = 40 + rnd() * 90;
    wrap(() => {
      a.fillStyle = `rgba(14,15,18,0.13)`;
      a.fillRect(x, y, pw, ph);
      a.strokeStyle = `rgba(5,5,6,0.22)`;
      a.lineWidth = 1.2;
      a.strokeRect(x, y, pw, ph);
      h.strokeStyle = `rgba(0,0,0,0.45)`;
      h.lineWidth = 1.5;
      h.strokeRect(x, y, pw, ph);
      r.fillStyle = `rgba(170,170,170,0.35)`;
      r.fillRect(x, y, pw, ph);
    });
  }
  // thin cracks
  for (let q = 0; q < 7; q++) {
    let x = rnd() * S,
      y = rnd() * S;
    const pts = [[x, y]];
    for (let k = 0; k < 24; k++) {
      x += (rnd() - .5) * 18;
      y += (rnd() - .35) * 18;
      pts.push([x, y]);
    }
    wrap(() => {
      for (const [c, col, lw] of [[a, `rgba(4,4,5,0.75)`, 1.1], [h, `rgba(0,0,0,0.9)`, 2.4]]) {
        c.strokeStyle = col;
        c.lineWidth = lw;
        c.beginPath();
        pts.forEach(([px, py], k) => k ? c.lineTo(px, py) : c.moveTo(px, py));
        c.stroke();
      }
    });
  }
  // oil drips: darker and glossier
  for (let q = 0; q < 8; q++) {
    const x = rnd() * S,
      y = rnd() * S,
      rad = 12 + rnd() * 30;
    wrap(() => {
      let gr = a.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(6,6,8,0.55)`);
      gr.addColorStop(1, `rgba(6,6,8,0)`);
      a.fillStyle = gr;
      a.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      gr = r.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(70,70,70,0.9)`);
      gr.addColorStop(1, `rgba(70,70,70,0)`);
      r.fillStyle = gr;
      r.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    });
  }
  const tex = (cv, srgb) => {
    const t = new CanvasTexture(cv);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.anisotropy = 8;
    srgb && (t.colorSpace = `srgb`);
    return t;
  };
  const mat = new MeshPhysicalMaterial({
    map: tex(A, !0),
    normalMap: qw(H, 2.8),
    normalScale: new Vector2(1.15, 1.15),
    roughnessMap: tex(R, !1),
    roughness: 1,
    metalness: 0,
    clearcoat: .3,
    clearcoatRoughness: .4,
    envMapIntensity: .85,
    color: `#ffffff`
  });
  mat.userData.tile = 10;
  return mat;
}
function Yw(e = 4) {
  let t = document.createElement(`canvas`);
  t.width = t.height = 256;
  let n = t.getContext(`2d`),
    {
      grid: r,
      max: i
    } = Gw(n, 256, 4, .5, 4242),
    a = n.createImageData(256, 256);
  for (let e = 0; e < 65536; e++) {
    let t = 110 + r[e] / i * 30;
    a.data[e * 4] = t, a.data[e * 4 + 1] = t + 1, a.data[e * 4 + 2] = t + 3, a.data[e * 4 + 3] = 255;
  }
  n.putImageData(a, 0, 0), n.strokeStyle = `rgba(0,0,0,0.4)`, n.lineWidth = 2;
  for (let e = 0; e <= 256; e += 64) n.beginPath(), n.moveTo(e, 0), n.lineTo(e, 256), n.stroke(), n.beginPath(), n.moveTo(0, e), n.lineTo(256, e), n.stroke();
  for (let e = 0; e < 1200; e++) n.fillStyle = `rgba(0,0,0,${Math.random() * .25})`, n.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
  let o = new CanvasTexture(t);
  return o.wrapS = o.wrapT = RepeatWrapping, o.anisotropy = 8, o.repeat.set(e, e), o;
}
function Xw() {
  let e = document.createElement(`canvas`);
  e.width = e.height = 256;
  let t = e.getContext(`2d`),
    {
      grid: n,
      max: r
    } = Gw(t, 256, 5, .55, 7777),
    i = t.createImageData(256, 256);
  for (let e = 0; e < 65536; e++) {
    let t = n[e] / r;
    i.data[e * 4] = 28 + t * 26, i.data[e * 4 + 1] = 50 + t * 36, i.data[e * 4 + 2] = 36 + t * 22, i.data[e * 4 + 3] = 255;
  }
  t.putImageData(i, 0, 0);
  for (let e = 0; e < 1600; e++) t.fillStyle = `rgba(20,40,24,${Math.random() * .4})`, t.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6);
  let a = new CanvasTexture(e);
  return a.wrapS = a.wrapT = RepeatWrapping, a.anisotropy = 8, a.repeat.set(30, 30), a;
}
function Zw(e, t, n, r, i, a) {
  let o = document.createElement(`canvas`);
  o.width = 256, o.height = 512;
  let s = o.getContext(`2d`);
  s.fillStyle = e, s.fillRect(0, 0, 256, 512), s.fillStyle = `rgba(0,0,0,0.14)`;
  for (let e = 0; e <= i; e++) s.fillRect(256 / i * e - 1, 0, 2, 512);
  s.fillStyle = `rgba(0,0,0,0.18)`;
  for (let e = 0; e <= r; e++) s.fillRect(0, 512 / r * e - 1, 256, 2);
  let c = 256 / i,
    l = 512 / r,
    u = Math.min(c, l) * .18;
  for (let e = 0; e < r; e++) for (let r = 0; r < i; r++) {
    let i = Math.random() > .42;
    a === `glass` ? (s.fillStyle = i ? t : `#16202a`, s.fillRect(r * c + u, e * l + u, c - u * 2, l - u * 2), s.fillStyle = `rgba(255,255,255,0.06)`, s.fillRect(r * c + u, e * l + u, c - u * 2, l * .4)) : (s.fillStyle = i ? t : n, s.fillRect(r * c + u, e * l + u, c - u * 2, l - u * 2), s.strokeStyle = `rgba(0,0,0,0.45)`, s.lineWidth = 1, s.strokeRect(r * c + u, e * l + u, c - u * 2, l - u * 2), s.fillStyle = `rgba(0,0,0,0.3)`, s.fillRect(r * c + c / 2 - 1, e * l + u, 2, l - u * 2), i && (s.fillStyle = `rgba(255,235,190,0.22)`, s.fillRect(r * c + u, e * l + u, c - u * 2, l * .25)));
  }
  let d = new CanvasTexture(o);
  return d.wrapS = d.wrapT = RepeatWrapping, d.anisotropy = 8, d;
}
function Qw(e, t) {
  let n = document.createElement(`canvas`);
  n.width = 256, n.height = 512;
  let r = n.getContext(`2d`);
  r.fillStyle = `#000`, r.fillRect(0, 0, 256, 512);
  let i = 256 / t,
    a = 512 / e,
    o = Math.min(i, a) * .18;
  for (let n = 0; n < e; n++) for (let e = 0; e < t; e++) Math.random() > .42 && (r.fillStyle = Math.random() > .7 ? `#cfe8ff` : `#ffe9c0`, r.fillRect(e * i + o, n * a + o, i - o * 2, a - o * 2));
  let s = new CanvasTexture(n);
  return s.wrapS = s.wrapT = RepeatWrapping, s.anisotropy = 8, s;
}
function $w(e) {
  let t = [],
    n = [],
    r = Jw(6),
    i = Jw(10),
    a = new MeshStandardMaterial({
      map: Yw(),
      roughness: .82,
      metalness: .05,
      color: `#aab0b6`
    }),
    o = new MeshStandardMaterial({
      map: Yw(2),
      roughness: .85,
      color: `#8a9098`
    }),
    s = new MeshStandardMaterial({
      map: Xw(),
      roughness: 1,
      metalness: 0,
      color: `#5a7a5e`
    }),
    c = new MeshBasicMaterial({
      color: `#e8e6d8`
    }),
    l = new MeshBasicMaterial({
      color: `#e8c84a`
    }),
    d = new MeshStandardMaterial({
      color: `#2a3036`,
      metalness: .7,
      roughness: .5
    }),
    f = new MeshStandardMaterial({
      color: `#1a1e22`,
      roughness: .8,
      metalness: .3
    }),
    p = new MeshStandardMaterial({
      color: `#1a1e22`,
      metalness: .6,
      roughness: .5,
      emissive: `#fff4d0`,
      emissiveIntensity: 1.6
    });
  for (const [mt, tl] of [[a, 4], [o, 4]]) {
    mt.map.repeat.set(1, 1);
    mt.userData.tile = tl;
  }
  function m(n, r, i, a, o, s, c, l = !1) {
    let bg0 = new BoxGeometry(n, r, i);
    if (c && c.userData && c.userData.tile) {
      const tl = c.userData.tile,
        uvA = bg0.attributes.uv;
      const dims = [[i, r], [i, r], [n, i], [n, i], [n, r], [n, r]];
      for (let face = 0; face < 6; face++) for (let vi = 0; vi < 4; vi++) {
        const ix = face * 4 + vi;
        uvA.setXY(ix, uvA.getX(ix) * dims[face][0] / tl, uvA.getY(ix) * dims[face][1] / tl);
      }
      uvA.needsUpdate = !0;
    }
    let u = new Mesh(bg0, c);
    return u.position.set(a, o, s), u.receiveShadow = !0, u.castShadow = l, e.add(u), l && t.push({
      x: a,
      z: s,
      w: n / 2,
      d: i / 2,
      box: u
    }), u;
  }
  function h(e, n, r, i) {
    t.push({
      x: e,
      z: n,
      w: r,
      d: i
    });
  }
  let g = new Matrix4(),
    _ = new Vector3(),
    v = new Quaternion(),
    y = new Vector3();
  m(900, .5, 1200, 0, -.3, -200, s);
  let b = new PlaneGeometry(360, 460, 48, 64);
  b.rotateX(-Math.PI / 2);
  let x = b.attributes.position;
  for (let e = 0; e < x.count; e++) {
    let t = x.getX(e) - 30,
      n = x.getZ(e) - 370,
      r = Uw(t, n),
      i = Math.sin(t * .08) * Math.cos(n * .06) * 1.6 + Math.sin(t * .2 + n * .15) * .7;
    x.setXYZ(e, t, r + i, n);
  }
  b.computeVertexNormals();
  let S = new Mesh(b, s);
  S.receiveShadow = !0, e.add(S);
  let C = [-120, -60, 0, 60, 120],
    w = [-80, -30, 20, 70],
    stationRoadAccesses = nm.map(station => {
      const roadX = C.reduce((nearest, x) => Math.abs(x - station.x) < Math.abs(nearest - station.x) ? x : nearest, C[0]);
      return {
        station,
        roadX,
        side: Math.sign(station.x - roadX)
      };
    }),
    streetlightZs = w.slice(0, -1).map((z, index) => (z + w[index + 1]) / 2),
    streetlightXs = C.slice(0, -1).map((x, index) => (x + C[index + 1]) / 2),
    T = (e, t, n, r, i = .04) => m(n, .02, r, e, i, t, c),
    E = (e, t, n, r, i = .04) => m(n, .02, r, e, i, t, l);
  const signals = [];
  const puddleRandom = Ww(731941);
  const puddleMat = new MeshStandardMaterial({
    color: `#65717b`,
    roughness: .2,
    metalness: .12,
    clearcoat: .55,
    clearcoatRoughness: .18,
    transparent: !0,
    opacity: .38,
    depthWrite: !1,
    side: 2
  });
  const addRoadPuddle = (x, z, rx, rz, angle) => {
    const positions = [0, 0, 0],
      indices = [],
      sides = 20;
    for (let k = 0; k < sides; k++) {
      const a = k / sides * Math.PI * 2;
      const edge = .78 + puddleRandom() * .34;
      positions.push(Math.cos(a) * rx * edge, 0, Math.sin(a) * rz * edge);
    }
    for (let k = 0; k < sides; k++) indices.push(0, (k + 1) % sides + 1, k + 1);
    const geometry = new BufferGeometry();
    geometry.setAttribute(`position`, new Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const puddle = new Mesh(geometry, puddleMat);
    puddle.position.set(x, .073, z);
    puddle.rotation.y = angle;
    puddle.renderOrder = 1;
    e.add(puddle);
  };
  for (const x of C) {
    const count = puddleRandom() > .55 ? 2 : 1;
    for (let k = 0; k < count; k++) addRoadPuddle(x + (puddleRandom() - .5) * 9, w[0] - 7 + puddleRandom() * (w[w.length - 1] - w[0] + 14), .55 + puddleRandom() * 1.35, .8 + puddleRandom() * 2.2, (puddleRandom() - .5) * .65);
  }
  for (const z of w) {
    const count = puddleRandom() > .55 ? 2 : 1;
    for (let k = 0; k < count; k++) addRoadPuddle(C[0] - 7 + puddleRandom() * (C[C.length - 1] - C[0] + 14), z + (puddleRandom() - .5) * 9, .8 + puddleRandom() * 2.2, .55 + puddleRandom() * 1.35, (puddleRandom() - .5) * .65);
  }
  for (let e of C) {
    m(18, .12, w[w.length - 1] - w[0] + 18, e, .01, (w[0] + w[w.length - 1]) / 2, r);
  }
  for (let e of w) {
    m(C[C.length - 1] - C[0] + 18, .12, 18, (C[0] + C[C.length - 1]) / 2, .01, e, r);
  }
  const roadY = .085;
  for (const x of C) {
    for (let segment = 0; segment < w.length - 1; segment++) {
      const start = w[segment] + 17,
        end = w[segment + 1] - 17;
      for (let z = start; z + 5 <= end; z += 9) {
        m(.15, .018, 5, x, roadY, z + 2.5, l);
      }
    }
    for (let zIndex = 0; zIndex < w.length; zIndex++) for (const approach of [-1, 1]) {
      if (zIndex + approach < 0 || zIndex + approach >= w.length) continue;
      const z = w[zIndex],
        crossZ = z + approach * 11.5;
      for (let stripe = -3; stripe <= 3; stripe++) m(.75, .025, 2.6, x + stripe * 2.1, roadY + .008, crossZ, c);
      m(9, .025, .2, x, roadY + .01, z + approach * 15.5, c);
    }
  }
  for (const z of w) {
    for (let segment = 0; segment < C.length - 1; segment++) {
      const start = C[segment] + 17,
        end = C[segment + 1] - 17;
      for (let x = start; x + 5 <= end; x += 9) {
        m(5, .018, .15, x + 2.5, roadY, z, l);
      }
    }
    for (let xIndex = 0; xIndex < C.length; xIndex++) for (const approach of [-1, 1]) {
      if (xIndex + approach < 0 || xIndex + approach >= C.length) continue;
      const x = C[xIndex],
        crossX = x + approach * 11.5;
      for (let stripe = -3; stripe <= 3; stripe++) m(.75, .025, 2.6, crossX, roadY + .008, z + stripe * 2.1, c);
      m(.2, .025, 9, x + approach * 15.5, roadY + .01, z, c);
    }
  }
  for (const x of C) for (const side of [-1, 1]) {
    const accessCuts = stationRoadAccesses.filter(access => access.roadX === x && access.side === side).map(access => [access.station.z - 4.75, access.station.z + 4.75]).sort((first, second) => first[0] - second[0]);
    const addSidewalkSegment = (start, end) => {
      if (end > start) m(2.4, .22, end - start, x + side * 10.2, .11, (start + end) / 2, a);
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
  for (const z of w) for (const side of [-1, 1]) {
    let start = C[0] - 11;
    for (const crossing of C) {
      const end = crossing - 9;
      if (end > start) m(end - start, .22, 2.4, (start + end) / 2, .11, z + side * 10.2, a);
      start = crossing + 9;
    }
    const end = C[C.length - 1] + 11;
    if (end > start) m(end - start, .22, 2.4, (start + end) / 2, .11, z + side * 10.2, a);
  }
  function O(x, z, facing, axis) {
    const pole = new Group();
    pole.position.set(x, 0, z);
    pole.rotation.y = facing;
    const base = new Mesh(new CylinderGeometry(.24, .28, .16, 16), d);
    base.position.y = .08;
    pole.add(base);
    const mast = new Mesh(new CylinderGeometry(.085, .11, 4.65, 12), d);
    mast.position.y = 2.46;
    mast.castShadow = !0;
    pole.add(mast);
    const bracket = new Mesh(new BoxGeometry(.11, .1, .34), d);
    bracket.position.set(0, 4.72, .13);
    pole.add(bracket);
    const housing = new Mesh(new BoxGeometry(.48, 1.32, .34), new MeshStandardMaterial({
      color: `#101419`,
      roughness: .68,
      metalness: .22
    }));
    housing.position.set(0, 5.35, .29);
    housing.castShadow = !0;
    pole.add(housing);
    const shades = [`#f02e2a`, `#e8a528`, `#2cae50`],
      lenses = [];
    for (let light = 0; light < 3; light++) {
      const y = 5.77 - light * .42;
      const bezel = new Mesh(new CylinderGeometry(.17, .17, .045, 20), new MeshStandardMaterial({
        color: `#080a0d`,
        roughness: .38,
        metalness: .25
      }));
      bezel.rotation.x = Math.PI / 2;
      bezel.position.set(0, y, .473);
      pole.add(bezel);
      const material = new MeshStandardMaterial({
        color: shades[light],
        emissive: shades[light],
        emissiveIntensity: .025,
        roughness: .22,
        metalness: .04
      });
      const lens = new Mesh(new CylinderGeometry(.125, .125, .048, 20), material);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0, y, .51);
      pole.add(lens);
      lenses.push(material);
      const hood = new Mesh(new BoxGeometry(.31, .055, .14), d);
      hood.position.set(0, y + .17, .46);
      pole.add(hood);
    }
    e.add(pole);
    h(x, z, .3, .3);
    signals.push({
      axis,
      lenses
    });
  }
  const stopLabelCanvas = document.createElement(`canvas`);
  stopLabelCanvas.width = 512;
  stopLabelCanvas.height = 256;
  const stopLabelContext = stopLabelCanvas.getContext(`2d`);
  stopLabelContext.clearRect(0, 0, 512, 256);
  stopLabelContext.fillStyle = `#fff`;
  stopLabelContext.font = `bold 120px Arial`;
  stopLabelContext.textAlign = `center`;
  stopLabelContext.textBaseline = `middle`;
  stopLabelContext.fillText(`STOP`, 256, 132);
  const stopLabelTexture = new CanvasTexture(stopLabelCanvas);
  stopLabelTexture.colorSpace = `srgb`;
  const stopLabelMaterial = new MeshStandardMaterial({
    map: stopLabelTexture,
    transparent: !0,
    roughness: .75
  });
  function addStopSign(x, z, dx, dz) {
    const sideX = dz,
      sideZ = -dx;
    const signX = x + dx * 11 + sideX * 10.2;
    const signZ = z + dz * 11 + sideZ * 10.2;
    const sign = new Group();
    sign.position.set(signX, 0, signZ);
    sign.rotation.y = Math.atan2(dx, dz);
    const post = new Mesh(new CylinderGeometry(.075, .085, 2.35, 10), d);
    post.position.y = 1.175;
    sign.add(post);
    const borderMaterial = new MeshStandardMaterial({
      color: `#f2f0e8`,
      roughness: .72
    });
    const border = new Mesh(new CylinderGeometry(.49, .49, .075, 8), borderMaterial);
    border.rotation.x = Math.PI / 2;
    border.position.set(0, 2.22, .08);
    sign.add(border);
    const face = new Mesh(new CylinderGeometry(.44, .44, .012, 8), [borderMaterial, new MeshStandardMaterial({
      color: `#c82027`,
      roughness: .7
    }), borderMaterial]);
    face.rotation.x = Math.PI / 2;
    face.position.set(0, 2.22, .125);
    sign.add(face);
    const label = new Mesh(new PlaneGeometry(.68, .34), stopLabelMaterial);
    label.position.set(0, 2.22, .132);
    sign.add(label);
    e.add(sign);
    h(signX, signZ, .2, .2);
  }
  for (let xIndex = 0; xIndex < C.length; xIndex++) for (let zIndex = 0; zIndex < w.length; zIndex++) {
    const x = C[xIndex],
      z = w[zIndex];
    const connected = {
      west: xIndex > 0,
      east: xIndex < C.length - 1,
      north: zIndex > 0,
      south: zIndex < w.length - 1
    };
    const arms = [[connected.west, -1, 0, connected.east], [connected.east, 1, 0, connected.west], [connected.north, 0, -1, connected.south], [connected.south, 0, 1, connected.north]].filter(([hasRoad]) => hasRoad);
    if (arms.length === 4) {
      O(x + 14, z + 14, 0, 0);
      O(x - 14, z - 14, Math.PI, 0);
      O(x + 14, z - 14, Math.PI / 2, 1);
      O(x - 14, z + 14, -Math.PI / 2, 1);
    } else for (const [, dx, dz, oppositeConnected] of arms) if (!oppositeConnected) addStopSign(x, z, dx, dz);
  }
  function k(x, z, axis = 0, inward = -1) {
    const footing = new Mesh(new CylinderGeometry(.19, .24, .28, 16), d);
    footing.position.set(x, .14, z);
    e.add(footing);
    h(x, z, .3, .3);
    const pole = new Mesh(new CylinderGeometry(.085, .12, 7, 12), d);
    pole.position.set(x, 3.5, z);
    pole.castShadow = !0;
    e.add(pole);
    const alongX = axis === 1;
    const arm = new Mesh(new BoxGeometry(alongX ? .09 : 2.2, .09, alongX ? 2.2 : .09), d);
    arm.position.set(x + (alongX ? 0 : inward * 1.05), 6.88, z + (alongX ? inward * 1.05 : 0));
    e.add(arm);
    const fixtureX = x + (alongX ? 0 : inward * 2.05);
    const fixtureZ = z + (alongX ? inward * 2.05 : 0);
    const fixture = new Mesh(new BoxGeometry(.72, .16, .48), d);
    fixture.position.set(fixtureX, 6.82, fixtureZ);
    fixture.castShadow = !0;
    e.add(fixture);
    const diffuser = new Mesh(new BoxGeometry(.58, .025, .36), p);
    diffuser.position.set(fixtureX, 6.72, fixtureZ);
    e.add(diffuser);
    n.push({
      x: fixtureX,
      y: 6.68,
      z: fixtureZ
    });
  }
  for (const x of C) for (const z of streetlightZs) for (const side of [-1, 1]) k(x + side * 10.2, z, 0, -side);
  for (const z of w) for (const x of streetlightXs) for (const side of [-1, 1]) k(x, z + side * 10.2, 1, -side);
  let A = 9137,
    j = () => (A = A * 16807 % 2147483647, (A - 1) / 2147483646),
    M = [`#ffe9c0`, `#cfe8ff`, `#ffd9a0`, `#e8e0ff`],
    N = [`#3a4250`, `#42454d`, `#383c44`, `#454050`, `#3e4855`],
    P = [`glass`, `classic`, `classic`, `glass`];
  {
    /* ===== DRIFT FURY: city blocks v2 =====
       Every block is split into two lots that sit strictly inside the sidewalks,
       so no building can ever overlap a road, a crosswalk or a curb. */
    const FLOOR_H = 3.6;
    const POD_H = 4.4;
    const LOT_HALF_Z = 12.4;
    const mkCanvas = (cw, ch) => {
      const cv = document.createElement(`canvas`);
      cv.width = cw;
      cv.height = ch;
      return cv;
    };
    const tint = (hex, k) => {
      const v = parseInt(hex.slice(1), 16);
      const cl = q => Math.max(0, Math.min(255, Math.round(q * k)));
      return `rgb(${cl(v >> 16 & 255)},${cl(v >> 8 & 255)},${cl(v & 255)})`;
    };
    const textureOf = cv => {
      const tx = new CanvasTexture(cv);
      tx.wrapS = tx.wrapT = RepeatWrapping;
      tx.anisotropy = 8;
      tx.needsUpdate = !0;
      return tx;
    };
    const roofMat = new MeshStandardMaterial({
      color: `#23272c`,
      roughness: .92,
      metalness: .05
    });
    const lotMat = new MeshStandardMaterial({
      map: Yw(1),
      roughness: .88,
      metalness: .04,
      color: `#8f969c`
    });
    lotMat.userData.tile = 4;
    const tankMat = new MeshStandardMaterial({
      color: `#5a4a3a`,
      roughness: .85
    });
    const beaconMat = new MeshStandardMaterial({
      color: `#200000`,
      emissive: `#ff2a2a`,
      emissiveIntensity: 3.2,
      roughness: .4
    });
    const SIGNS = [`#c6dc77`, `#5a9fd4`, `#e89978`, `#8c87c7`, `#ff7a7a`];
    const trimMats = SIGNS.map(col => new MeshStandardMaterial({
      color: `#050505`,
      emissive: col,
      emissiveIntensity: 1.7,
      roughness: .4
    }));

    /* --- facade textures: map + matching emissive map + normal map (one shared random layout) --- */
    const facadeCache = new Map();
    function facadeVariant(kind, wall, glow) {
      const key = kind + wall + glow;
      let hit = facadeCache.get(key);
      if (hit) return hit;
      const glass = kind === `glass`;
      const rnd = Ww(key.length * 7919 + wall.charCodeAt(2) * 31 + glow.charCodeAt(3) * 17 + (glass ? 5 : 11));
      const mapCv = mkCanvas(256, 256);
      const glowCv = mkCanvas(256, 256);
      const g2 = mapCv.getContext(`2d`);
      const ge = glowCv.getContext(`2d`);
      g2.fillStyle = wall;
      g2.fillRect(0, 0, 256, 256);
      for (let q = 0; q < 1400; q++) {
        g2.fillStyle = rnd() > .5 ? `rgba(255,255,255,0.035)` : `rgba(0,0,0,0.1)`;
        g2.fillRect(rnd() * 256, rnd() * 256, 1.5, 1.5);
      }
      ge.fillStyle = `#000`;
      ge.fillRect(0, 0, 256, 256);
      for (let col = 0; col <= 4; col++) {
        g2.fillStyle = `rgba(0,0,0,0.28)`;
        g2.fillRect(col * 64 - 1.5, 0, 3, 256);
        g2.fillStyle = `rgba(255,255,255,0.07)`;
        g2.fillRect(col * 64 + 1.5, 0, 1.5, 256);
      }
      for (let row = 0; row < 4; row++) {
        g2.fillStyle = `rgba(0,0,0,0.34)`;
        g2.fillRect(0, row * 64 + 55, 256, 9);
        g2.fillStyle = `rgba(255,255,255,0.09)`;
        g2.fillRect(0, row * 64 + 54, 256, 1.5);
      }
      for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
        const ix = glass ? 5 : 11;
        const it = glass ? 7 : 12;
        const ib = glass ? 13 : 16;
        const x0 = col * 64 + ix;
        const y0 = row * 64 + it;
        const ww = 64 - ix * 2;
        const hh = 64 - it - ib;
        const lit = rnd() > .44;
        const style = rnd();
        g2.fillStyle = `#10151b`;
        g2.fillRect(x0 - 2, y0 - 2, ww + 4, hh + 4);
        const gl = g2.createLinearGradient(0, y0, 0, y0 + hh);
        if (lit) {
          gl.addColorStop(0, tint(glow, .95));
          gl.addColorStop(1, tint(glow, .62));
        } else {
          gl.addColorStop(0, `#2f465c`);
          gl.addColorStop(.55, `#142130`);
          gl.addColorStop(1, `#0a111a`);
        }
        g2.fillStyle = gl;
        g2.fillRect(x0, y0, ww, hh);
        if (lit) {
          const eg = ge.createLinearGradient(0, y0, 0, y0 + hh);
          eg.addColorStop(0, tint(glow, .75));
          eg.addColorStop(1, tint(glow, .42));
          ge.fillStyle = eg;
          ge.fillRect(x0, y0, ww, hh);
          if (style > .7) {
            for (let by = y0 + 2; by < y0 + hh * .6; by += 4) {
              g2.fillStyle = `rgba(20,14,8,0.35)`;
              g2.fillRect(x0, by, ww, 1.6);
              ge.fillStyle = `rgba(0,0,0,0.55)`;
              ge.fillRect(x0, by, ww, 1.6);
            }
          } else if (style > .45) {
            g2.fillStyle = `rgba(40,20,10,0.35)`;
            g2.fillRect(x0, y0, ww * .22, hh);
            g2.fillRect(x0 + ww * .78, y0, ww * .22, hh);
            ge.fillStyle = `rgba(0,0,0,0.5)`;
            ge.fillRect(x0, y0, ww * .22, hh);
            ge.fillRect(x0 + ww * .78, y0, ww * .22, hh);
          }
        } else {
          g2.fillStyle = `rgba(255,255,255,0.07)`;
          g2.beginPath();
          g2.moveTo(x0, y0 + hh);
          g2.lineTo(x0 + ww * .55, y0);
          g2.lineTo(x0 + ww * .8, y0);
          g2.lineTo(x0 + ww * .25, y0 + hh);
          g2.closePath();
          g2.fill();
        }
        g2.fillStyle = `rgba(255,255,255,0.1)`;
        g2.fillRect(x0, y0, ww, 2);
        for (const ctx of [g2, ge]) {
          ctx.fillStyle = ctx === g2 ? `#10151b` : `#000`;
          ctx.fillRect(x0 + ww / 2 - 1, y0, 2, hh);
          if (!glass) ctx.fillRect(x0, y0 + hh * .42, ww, 2);
        }
        g2.fillStyle = `rgba(255,255,255,0.16)`;
        g2.fillRect(x0 - 3, y0 + hh + 2, ww + 6, 2.5);
        if (!glass && rnd() > .88) {
          g2.fillStyle = `#868d94`;
          g2.fillRect(x0 + ww * .2, y0 + hh + 4, ww * .6, 6);
          g2.fillStyle = `#4b5158`;
          g2.fillRect(x0 + ww * .2, y0 + hh + 8, ww * .6, 2);
        }
      }
      hit = {
        glass: glass,
        map: textureOf(mapCv),
        glow: textureOf(glowCv),
        normal: qw(mapCv, glass ? 1.1 : 1.9)
      };
      facadeCache.set(key, hit);
      return hit;
    }
    const facadeMatCache = new Map();
    function facadeMaterial(key, fv, rx, ry) {
      const mk = key + `|` + rx + `|` + ry;
      let hit = facadeMatCache.get(mk);
      if (hit) return hit;
      const cp = tx => {
        const c2 = tx.clone();
        c2.repeat.set(rx, ry);
        c2.needsUpdate = !0;
        return c2;
      };
      hit = new MeshPhysicalMaterial({
        map: cp(fv.map),
        normalMap: cp(fv.normal),
        normalScale: new Vector2(fv.glass ? .14 : .32, fv.glass ? .14 : .32),
        emissiveMap: cp(fv.glow),
        emissive: `#ffffff`,
        emissiveIntensity: 1.15,
        roughness: fv.glass ? .22 : .8,
        metalness: fv.glass ? .3 : .05,
        clearcoat: fv.glass ? .85 : .14,
        clearcoatRoughness: .22,
        envMapIntensity: fv.glass ? 1.2 : .25
      });
      facadeMatCache.set(mk, hit);
      return hit;
    }

    /* --- lit shop-fronts for the ground floor --- */
    const shopCache = new Map();
    function shopMaterial(sign, rx) {
      const mk = sign + `|` + rx;
      let hit = shopCache.get(mk);
      if (hit) return hit;
      const rnd = Ww(sign.charCodeAt(2) * 131 + sign.charCodeAt(4) * 7);
      const cv = mkCanvas(256, 128);
      const cvE = mkCanvas(256, 128);
      const g2 = cv.getContext(`2d`);
      const ge = cvE.getContext(`2d`);
      g2.fillStyle = `#1b2027`;
      g2.fillRect(0, 0, 256, 128);
      ge.fillStyle = `#000`;
      ge.fillRect(0, 0, 256, 128);
      for (let bay = 0; bay < 2; bay++) {
        const bx0 = bay * 128;
        g2.fillStyle = sign;
        g2.fillRect(bx0 + 14, 6, 100, 18);
        ge.fillStyle = sign;
        ge.fillRect(bx0 + 14, 6, 100, 18);
        for (let k = 0; k < 6; k++) {
          const lw = 6 + Math.floor(rnd() * 8);
          g2.fillStyle = `rgba(0,0,0,0.6)`;
          g2.fillRect(bx0 + 20 + k * 15, 11, lw, 8);
          ge.fillStyle = `#000`;
          ge.fillRect(bx0 + 20 + k * 15, 11, lw, 8);
        }
        g2.fillStyle = `#0c0f12`;
        g2.fillRect(bx0 + 6, 38, 116, 82);
        const gl = g2.createLinearGradient(0, 42, 0, 118);
        gl.addColorStop(0, `#ffe6b8`);
        gl.addColorStop(1, `#b57a3c`);
        g2.fillStyle = gl;
        g2.fillRect(bx0 + 9, 41, 110, 76);
        const eg = ge.createLinearGradient(0, 42, 0, 118);
        eg.addColorStop(0, `rgba(255,226,170,0.85)`);
        eg.addColorStop(1, `rgba(180,120,60,0.6)`);
        ge.fillStyle = eg;
        ge.fillRect(bx0 + 9, 41, 110, 76);
        for (let k = 0; k < 4; k++) {
          const sx = bx0 + 14 + k * 26;
          const sh = 14 + Math.floor(rnd() * 26);
          g2.fillStyle = `rgba(30,18,10,0.55)`;
          g2.fillRect(sx, 117 - sh, 14, sh);
          ge.fillStyle = `rgba(0,0,0,0.5)`;
          ge.fillRect(sx, 117 - sh, 14, sh);
        }
        for (const ctx of [g2, ge]) {
          ctx.fillStyle = ctx === g2 ? `#0c0f12` : `#000`;
          ctx.fillRect(bx0 + 62, 41, 4, 76);
          ctx.fillRect(bx0 + 9, 70, 110, 3);
        }
      }
      g2.fillStyle = `#0b0e11`;
      g2.fillRect(0, 118, 256, 10);
      const mp = textureOf(cv);
      const em = textureOf(cvE);
      mp.repeat.set(rx, 1);
      em.repeat.set(rx, 1);
      hit = new MeshPhysicalMaterial({
        map: mp,
        emissiveMap: em,
        emissive: `#ffffff`,
        emissiveIntensity: 1.3,
        roughness: .45,
        metalness: .2,
        clearcoat: .5,
        envMapIntensity: .6
      });
      shopCache.set(mk, hit);
      return hit;
    }

    /* --- blocks --- */
    for (let bi = 0; bi < C.length - 1; bi++) for (let bj = 0; bj < w.length - 1; bj++) {
      const bx = (C[bi] + C[bi + 1]) / 2;
      const bz = (w[bj] + w[bj + 1]) / 2;
      m(37.2, .14, 27.2, bx, .02, bz, lotMat);
      if (nm.some(st => Math.abs(st.x - bx) < 32 && Math.abs(st.z - bz) < 32)) continue;
      for (const side of [-1, 1]) {
        if (j() < .15) continue;
        const sW = 11 + j() * 4.5;
        const cD = 14 + j() * 8.8;
        const hTarget = 14 + j() * 48;
        const kind = P[Math.floor(j() * P.length)];
        const wall = N[Math.floor(j() * N.length)];
        const glow = M[Math.floor(j() * M.length)];
        const signIdx = Math.floor(j() * SIGNS.length);
        const glass = kind === `glass`;
        const bxC = bx + side * (.9 + sW / 2);
        const bzC = bz + (j() - .5) * 2 * Math.max(0, (2 * LOT_HALF_Z - (cD + 1)) / 2);
        const tall = hTarget > 32;
        const l1 = tall ? Math.round(hTarget * .62 / FLOOR_H) * FLOOR_H : Math.max(POD_H + 6, hTarget);
        const hs = l1 - POD_H;
        const rY = Math.max(1, Math.round(hs / 14.4));
        const fv = facadeVariant(kind, wall, glow);
        const vKey = kind + wall + glow;
        const fz = facadeMaterial(vKey, fv, Math.max(1, Math.round(sW / 12)), rY);
        const fx = facadeMaterial(vKey, fv, Math.max(1, Math.round(cD / 12)), rY);
        const shopZ = shopMaterial(SIGNS[signIdx], Math.max(1, Math.round((sW + 1) / 8)));
        const shopX = shopMaterial(SIGNS[signIdx], Math.max(1, Math.round((cD + 1) / 8)));
        // ground floor shop podium, cornice, tower shaft
        m(sW + 1, POD_H, cD + 1, bxC, POD_H / 2, bzC, [shopX, shopX, a, f, shopZ, shopZ], !0);
        m(sW + 1.2, .3, cD + 1.2, bxC, POD_H + .15, bzC, a);
        m(sW, hs, cD, bxC, POD_H + hs / 2, bzC, [fx, fx, roofMat, roofMat, fz, fz], !0);
        // corner pilasters / frame fins
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) m(glass ? .4 : .7, hs, glass ? .4 : .7, bxC + sx * sW / 2, POD_H + hs / 2, bzC + sz * cD / 2, glass ? d : a);
        // floor-group ledges
        if (!glass) for (let k = 1; k < rY; k++) m(sW + .35, .3, cD + .35, bxC, POD_H + k * hs / rY, bzC, a);
        let topY = l1;
        let topW = sW;
        let topD = cD;
        if (tall) {
          const sU = sW * .74;
          const cU = cD * .74;
          const hU = Math.max(6, hTarget - l1);
          const rYU = Math.max(1, Math.round(hU / 14.4));
          const fzU = facadeMaterial(vKey, fv, Math.max(1, Math.round(sU / 12)), rYU);
          const fxU = facadeMaterial(vKey, fv, Math.max(1, Math.round(cU / 12)), rYU);
          m(sW + .5, .3, cD + .5, bxC, l1 + .15, bzC, a);
          m(sU, hU, cU, bxC, l1 + .3 + hU / 2, bzC, [fxU, fxU, roofMat, roofMat, fzU, fzU], !0);
          topY = l1 + .3 + hU;
          topW = sU;
          topD = cU;
        }
        // roof cap + parapet
        m(topW + .35, .28, topD + .35, bxC, topY + .14, bzC, d);
        m(topW + .4, .9, .4, bxC, topY + .75, bzC + topD / 2 - .2, a);
        m(topW + .4, .9, .4, bxC, topY + .75, bzC - topD / 2 + .2, a);
        m(.4, .9, topD - .4, bxC + topW / 2 - .2, topY + .75, bzC, a);
        m(.4, .9, topD - .4, bxC - topW / 2 + .2, topY + .75, bzC, a);
        // roof equipment
        const nUnits = 1 + Math.floor(j() * 3);
        for (let uI = 0; uI < nUnits; uI++) {
          const uh = 1 + j();
          m(1.8 + j() * 2, uh, 1.8 + j() * 2, bxC + (j() - .5) * (topW - 4), topY + .28 + uh / 2, bzC + (j() - .5) * (topD - 4), f);
        }
        if (j() > .55) {
          const tx = bxC + (j() - .5) * (topW - 5);
          const tz = bzC + (j() - .5) * (topD - 5);
          for (const lx of [-.8, .8]) for (const lz of [-.8, .8]) m(.14, 1.5, .14, tx + lx, topY + 1.03, tz + lz, d);
          const tank = new Mesh(new CylinderGeometry(1.3, 1.3, 2.2, 16), tankMat);
          tank.position.set(tx, topY + 2.6, tz);
          tank.castShadow = !0;
          e.add(tank);
          const tankCap = new Mesh(new ConeGeometry(1.4, .8, 16), d);
          tankCap.position.set(tx, topY + 4.1, tz);
          e.add(tankCap);
        }
        if (tall || j() > .5) {
          const mh = 6 + j() * 6;
          const mast = new Mesh(new CylinderGeometry(.05, .08, mh, 6), d);
          mast.position.set(bxC, topY + .28 + mh / 2, bzC);
          e.add(mast);
          const beacon = new Mesh(new SphereGeometry(.2, 10, 8), beaconMat);
          beacon.position.set(bxC, topY + .28 + mh, bzC);
          e.add(beacon);
        }
        // glowing LED trim on the street-facing edges
        m(topW, .14, .14, bxC, topY - .5, bzC + topD / 2 + .05, trimMats[signIdx]);
        m(.14, .14, topD, bxC + topW / 2 + .05, topY - .5, bzC, trimMats[signIdx]);
        m(sW + 1.02, .1, .1, bxC, POD_H - .12, bzC + (cD + 1) / 2 + .02, trimMats[signIdx]);
        m(.1, .1, cD + 1.02, bxC + (sW + 1) / 2 + .02, POD_H - .12, bzC, trimMats[signIdx]);
      }
    }
  }
  {
    /* ===== DRIFT FURY: street trees v1 (sidewalk only, with trunk colliders) ===== */
    const fc = document.createElement(`canvas`);
    fc.width = fc.height = 256;
    const fg = fc.getContext(`2d`);
    const frnd = Ww(5150);
    fg.fillStyle = `#2c5a2a`;
    fg.fillRect(0, 0, 256, 256);
    const greens = [`#3f7a35`, `#2a5a28`, `#4f8a3c`, `#1f4a22`, `#5f9645`, `#35692f`];
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
      fg.fillStyle = `rgba(8,22,10,${.25 + frnd() * .3})`;
      fg.fillRect(frnd() * 256, frnd() * 256, 3, 3);
    }
    const leafTex = new CanvasTexture(fc);
    leafTex.wrapS = leafTex.wrapT = RepeatWrapping;
    leafTex.colorSpace = `srgb`;
    leafTex.anisotropy = 8;
    leafTex.repeat.set(2, 2);
    const leafMat = new MeshStandardMaterial({
      map: leafTex,
      bumpMap: leafTex,
      bumpScale: 1.2,
      roughness: .92,
      metalness: 0
    });
    const barkCanvas = document.createElement(`canvas`);
    barkCanvas.width = 128;
    barkCanvas.height = 256;
    const barkCtx = barkCanvas.getContext(`2d`);
    const barkRnd = Ww(9271);
    const barkGradient = barkCtx.createLinearGradient(0, 0, 128, 0);
    barkGradient.addColorStop(0, `#30271f`);
    barkGradient.addColorStop(.24, `#66503a`);
    barkGradient.addColorStop(.52, `#493829`);
    barkGradient.addColorStop(.78, `#71563c`);
    barkGradient.addColorStop(1, `#30271f`);
    barkCtx.fillStyle = barkGradient;
    barkCtx.fillRect(0, 0, 128, 256);
    for (let line = 0; line < 70; line++) {
      const x = barkRnd() * 128,
        shade = Math.floor(barkRnd() * 45);
      barkCtx.strokeStyle = line % 3 ? `rgba(22,15,10,${.12 + barkRnd() * .34})` : `rgba(190,151,105,${.08 + barkRnd() * .2})`;
      barkCtx.lineWidth = .5 + barkRnd() * 2;
      barkCtx.beginPath();
      barkCtx.moveTo(x, 0);
      barkCtx.bezierCurveTo(x + (barkRnd() - .5) * 18, 84, x + (barkRnd() - .5) * 18, 172, x + (barkRnd() - .5) * 12, 256);
      barkCtx.stroke();
      if (line < 7) {
        barkCtx.fillStyle = `rgba(${shade},${shade * .78},${shade * .55},.08)`;
        barkCtx.fillRect(x, 0, 1 + barkRnd() * 4, 256);
      }
    }
    const barkTex = new CanvasTexture(barkCanvas);
    barkTex.wrapS = barkTex.wrapT = RepeatWrapping;
    barkTex.colorSpace = `srgb`;
    barkTex.anisotropy = 8;
    const barkMat = new MeshStandardMaterial({
      map: barkTex,
      bumpMap: barkTex,
      bumpScale: .12,
      roughness: .96,
      color: `#b6a18a`
    });
    const spots = [];
    for (const ax of C) for (const side of [-1, 1]) for (let tz = w[0] - 4; tz <= w[w.length - 1] + 4; tz += 12) {
      if (w.some(sz => Math.abs(tz - sz) < 14.5)) continue;
      if (streetlightZs.some(pz => Math.abs(tz - pz) < 4.5)) continue;
      spots.push([ax + side * 10.2, tz, .88 + j() * .28]);
    }
    const CLUMPS = [[0, -.12, 0, 1.2, .98, 1.12], [0, .72, 0, 1.22, 1.02, 1.14], [.78, .32, .12, .94, .84, .9], [-.76, .38, -.14, .98, .88, .92], [.16, .52, .76, .9, .82, .94], [-.2, .28, -.76, .94, .8, .9], [.12, 1.35, .08, .84, .8, .86], [-.34, -.08, .36, .72, .7, .78]];
    const trunkHeight = scale => 4.85 * scale;
    const trunks = new InstancedMesh(new CylinderGeometry(.13, .24, 1, 12), barkMat, spots.length);
    const branches = new InstancedMesh(new CylinderGeometry(.055, .095, 1, 8), barkMat, spots.length * 4);
    trunks.castShadow = branches.castShadow = !0;
    const crowns = new InstancedMesh(new SphereGeometry(1, 14, 12), leafMat, spots.length * CLUMPS.length);
    crowns.castShadow = !0;
    crowns.receiveShadow = !0;
    let ci = 0,
      bi = 0;
    spots.forEach(([tx, tz, treeScale], ti) => {
      const ground = .22;
      const height = trunkHeight(treeScale);
      _.set(tx, ground + height / 2, tz);
      v.identity();
      y.set(treeScale * (.9 + j() * .18), height, treeScale * (.9 + j() * .18));
      g.compose(_, v, y);
      trunks.setMatrixAt(ti, g);
      for (let branch = 0; branch < 4; branch++) {
        const angle = branch * Math.PI / 2 + (j() - .5) * .42;
        const length = treeScale * (1.45 + j() * .35);
        const direction = new Vector3(Math.cos(angle) * .82, .52 + j() * .16, Math.sin(angle) * .82);
        direction.normalize();
        v.setFromUnitVectors(new Vector3(0, 1, 0), direction);
        _.set(tx + direction.x * length * .48, ground + height * (.62 + branch % 2 * .1), tz + direction.z * length * .48);
        y.set(1, length, 1);
        g.compose(_, v, y);
        branches.setMatrixAt(bi++, g);
      }
      for (const [ox, oy, oz, rx, ry, rz] of CLUMPS) {
        const clumpScale = treeScale * (.88 + j() * .24);
        _.set(tx + ox * treeScale, ground + height + oy * treeScale, tz + oz * treeScale);
        v.setFromAxisAngle(new Vector3(0, 1, 0), (j() - .5) * .7);
        y.set(rx * clumpScale, ry * clumpScale * (.88 + j() * .24), rz * clumpScale);
        g.compose(_, v, y);
        crowns.setMatrixAt(ci++, g);
      }
      h(tx, tz, .3, .3);
    });
    trunks.instanceMatrix.needsUpdate = !0;
    branches.count = bi;
    branches.instanceMatrix.needsUpdate = !0;
    crowns.count = ci;
    crowns.instanceMatrix.needsUpdate = !0;
    e.add(trunks);
    e.add(branches);
    e.add(crowns);
  }
  const stationSteel = new MeshStandardMaterial({
    color: `#879199`,
    roughness: .38,
    metalness: .72
  });
  const stationDarkSteel = new MeshStandardMaterial({
    color: `#252c31`,
    roughness: .58,
    metalness: .48
  });
  const stationWhite = new MeshStandardMaterial({
    color: `#e8e9e4`,
    roughness: .62,
    metalness: .12
  });
  const stationRed = new MeshStandardMaterial({
    color: `#b83132`,
    roughness: .38,
    metalness: .22
  });
  const stationParkingPaint = new MeshStandardMaterial({
    color: `#d9d9ce`,
    roughness: .82,
    metalness: 0
  });
  const stationGlass = new MeshPhysicalMaterial({
    color: `#a8c4ce`,
    roughness: .12,
    metalness: .08,
    transparent: !0,
    opacity: .32,
    side: 2
  });
  const stationWindowFrame = new MeshStandardMaterial({
    color: `#252b30`,
    roughness: .4,
    metalness: .56
  });
  const stationTileTexture = (() => {
    const canvas = document.createElement(`canvas`);
    canvas.width = canvas.height = 512;
    const context = canvas.getContext(`2d`);
    const tileSize = 64;
    for (let row = 0; row < 8; row++) for (let column = 0; column < 8; column++) {
      const shade = 89 + (row * 17 + column * 11) % 13;
      context.fillStyle = `rgb(${shade},${shade + 2},${shade - 2})`;
      context.fillRect(column * tileSize + 2, row * tileSize + 2, tileSize - 4, tileSize - 4);
    }
    context.strokeStyle = `rgba(15,19,20,.75)`;
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
    texture.colorSpace = `srgb`;
    return texture;
  })();
  const stationFloor = new MeshStandardMaterial({
    color: `#b5b6ad`,
    map: stationTileTexture,
    bumpMap: stationTileTexture,
    bumpScale: .028,
    roughness: .68,
    metalness: .025
  });
  const stationScreen = (() => {
    const canvas = document.createElement(`canvas`);
    canvas.width = 256;
    canvas.height = 160;
    const context = canvas.getContext(`2d`);
    context.fillStyle = `#071317`;
    context.fillRect(0, 0, 256, 160);
    context.strokeStyle = `#537078`;
    context.lineWidth = 5;
    context.strokeRect(5, 5, 246, 150);
    context.fillStyle = `#75e0c0`;
    context.font = `bold 54px monospace`;
    context.textAlign = `center`;
    context.fillText(`87.9`, 128, 68);
    context.font = `bold 24px monospace`;
    context.fillText(`L / $`, 128, 112);
    context.fillStyle = `#9ec2b2`;
    context.font = `16px sans-serif`;
    context.fillText(`TAP  •  INSERT`, 128, 140);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = `srgb`;
    return texture;
  })();
  const stationScreenMat = new MeshStandardMaterial({
    map: stationScreen,
    emissiveMap: stationScreen,
    emissive: `#9bdbc8`,
    emissiveIntensity: .65,
    roughness: .32,
    metalness: .08
  });
  const stationAwningLight = new MeshStandardMaterial({
    color: `#fff5df`,
    emissive: `#ffe7b5`,
    emissiveIntensity: 1.35,
    roughness: .35
  });
  const stationSignTexture = (() => {
    const canvas = document.createElement(`canvas`);
    canvas.width = 1024;
    canvas.height = 192;
    const context = canvas.getContext(`2d`);
    context.fillStyle = `#17252a`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = `#c6dc77`;
    context.fillRect(0, 0, 18, canvas.height);
    context.fillRect(canvas.width - 18, 0, 18, canvas.height);
    context.fillStyle = `#f5f1e6`;
    context.font = `bold 76px sans-serif`;
    context.textAlign = `center`;
    context.textBaseline = `middle`;
    context.fillText(`NORTHLINE  •  DÉPANNEUR`, canvas.width / 2, canvas.height / 2);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = `srgb`;
    return texture;
  })();
  const stationSignMat = new MeshStandardMaterial({
    map: stationSignTexture,
    emissiveMap: stationSignTexture,
    emissive: `#d7edac`,
    emissiveIntensity: .6,
    roughness: .48
  });
  const stationShelfMat = new MeshStandardMaterial({
    color: `#4a5051`,
    roughness: .64,
    metalness: .42
  });
  const stationProductMats = [new MeshStandardMaterial({
    color: `#c44a36`,
    roughness: .64
  }), new MeshStandardMaterial({
    color: `#d5b247`,
    roughness: .58
  }), new MeshStandardMaterial({
    color: `#577f9c`,
    roughness: .57
  }), new MeshStandardMaterial({
    color: `#65805b`,
    roughness: .7
  }), new MeshStandardMaterial({
    color: `#eee4cb`,
    roughness: .65
  })];
  const stationShelfFrames = new InstancedMesh(new BoxGeometry(.72, 2.05, .55), stationShelfMat, 18);
  const stationShelfBoards = new InstancedMesh(new BoxGeometry(.82, .055, .68), stationSteel, 72);
  const stationCoolerShelves = new InstancedMesh(new BoxGeometry(1.12, .035, .42), stationSteel, 36);
  const stationHoseSegments = new InstancedMesh(new CylinderGeometry(.035, .035, 1, 8), stationDarkSteel, 48);
  let stationShelfFrameCount = 0,
    stationShelfBoardCount = 0,
    stationCoolerShelfCount = 0,
    stationHoseCount = 0;
  const stationShelfProducts = stationProductMats.map(material => new InstancedMesh(new BoxGeometry(.17, .27, .2), material, 216));
  const stationCoolerProducts = stationProductMats.map(material => new InstancedMesh(new BoxGeometry(.12, .25, .12), material, 72));
  const stationShelfProductCounts = stationProductMats.map(() => 0);
  const stationCoolerProductCounts = stationProductMats.map(() => 0);
  const placeStationProduct = (meshes, counts, materialIndex, x, yPos, z) => {
    const mesh = meshes[materialIndex],
      instance = counts[materialIndex]++;
    _.set(x, yPos, z);
    v.identity();
    y.set(1, 1, 1);
    g.compose(_, v, y);
    mesh.setMatrixAt(instance, g);
  };
  const placeStationInstance = (mesh, instance, x, yPos, z, scaleX = 1, scaleY = 1, scaleZ = 1) => {
    _.set(x, yPos, z);
    v.identity();
    y.set(scaleX, scaleY, scaleZ);
    g.compose(_, v, y);
    mesh.setMatrixAt(instance, g);
  };
  const stationPumpFace = (x, y, z, side) => {
    const face = new Mesh(new PlaneGeometry(.42, .3), stationScreenMat);
    face.position.set(x, y, z + side * .317);
    if (side < 0) face.rotation.y = Math.PI;
    e.add(face);
    const bezel = m(.5, .38, .035, x, y, z + side * .295, stationDarkSteel);
    bezel.renderOrder = 2;
    face.renderOrder = 3;
    m(.22, .12, .025, x, y - .34, z + side * .323, stationDarkSteel);
    for (let row = 0; row < 2; row++) for (let column = 0; column < 3; column++) {
      const button = new Mesh(new CylinderGeometry(.025, .025, .022, 10), column === 0 ? stationRed : stationSteel);
      button.position.set(x - .13 + column * .13, y - .48 - row * .095, z + side * .326);
      e.add(button);
    }
    m(.35, .12, .03, x, y - .75, z + side * .327, stationDarkSteel);
  };
  const addFuelPump = (x, z, groundY) => {
    m(1.55, .14, 3.8, x, groundY + .12, z, stationSteel);
    m(1.46, .055, 3.68, x, groundY + .218, z, stationDarkSteel);
    m(.82, .2, .72, x, groundY + .34, z, stationDarkSteel);
    m(.76, 1.34, .62, x, groundY + 1.11, z, stationWhite);
    m(.765, .17, .625, x, groundY + 1.72, z, stationRed);
    m(.79, .105, .65, x, groundY + 1.86, z, stationSteel);
    h(x, z, .42, .38);
    for (const side of [-1, 1]) stationPumpFace(x, groundY + 1.36, z, side);
    for (const side of [-1, 1]) {
      const hoseX = x + side * .39,
        hoseZ = z + .05;
      const points = [[hoseX, groundY + 1.48, hoseZ], [x + side * .62, groundY + 1.52, hoseZ], [x + side * .7, groundY + 1.35, hoseZ + .08], [x + side * .7, groundY + .83, hoseZ + .13], [x + side * .55, groundY + .7, hoseZ + .18]];
      for (let segment = 0; segment < points.length - 1; segment++) {
        const from = new Vector3(...points[segment]),
          to = new Vector3(...points[segment + 1]);
        const delta = new Vector3().subVectors(to, from);
        const length = delta.length();
        _.copy(from).add(to).multiplyScalar(.5);
        v.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize());
        y.set(1, length, 1);
        g.compose(_, v, y);
        stationHoseSegments.setMatrixAt(stationHoseCount++, g);
      }
      m(.075, .28, .075, x + side * .4, groundY + 1.56, z - .17, stationSteel);
      m(.075, .34, .075, x + side * .4, groundY + 1.4, z + .22, stationDarkSteel);
      m(.12, .08, .1, x + side * .4, groundY + 1.56, z + .3, stationRed);
    }
    const bollardMat = stationRed;
    for (const side of [-1, 1]) {
      m(.12, .62, .12, x + side * .91, groundY + .43, z + 1.44, bollardMat);
      m(.14, .08, .14, x + side * .91, groundY + .76, z + 1.44, stationWhite);
      h(x + side * .91, z + 1.44, .1, .1);
    }
  };
  const storeShell = new MeshStandardMaterial({
    color: `#c5c1b4`,
    roughness: .84,
    metalness: .03
  });
  const storeRoofMat = new MeshStandardMaterial({
    color: `#353b3e`,
    roughness: .72,
    metalness: .3
  });
  const coolerMat = new MeshStandardMaterial({
    color: `#eaf0eb`,
    roughness: .27,
    metalness: .3,
    emissive: `#7cc9dc`,
    emissiveIntensity: .12
  });
  const coolerGlass = new MeshPhysicalMaterial({
    color: `#d8efff`,
    roughness: .08,
    metalness: .02,
    transparent: !0,
    opacity: .18,
    side: 2
  });
  const counterMat = new MeshStandardMaterial({
    color: `#41352b`,
    roughness: .72,
    metalness: .1
  });
  const addStationStore = (station, index, groundY) => {
    const shopX = station.x,
      shopZ = station.z + 11.15;
    const frontZ = shopZ - 4.35,
      backZ = shopZ + 4.35;
    const wallHeight = 3.55;
    const halfWidth = 5.8;
    m(11.8, .2, 9, shopX, groundY + .1, shopZ, stationFloor);
    m(12.15, .22, .22, shopX, groundY + .14, shopZ, stationDarkSteel);
    m(.24, wallHeight, 9, shopX - halfWidth, groundY + wallHeight / 2, shopZ, storeShell, !0);
    m(.24, wallHeight, 9, shopX + halfWidth, groundY + wallHeight / 2, shopZ, storeShell, !0);
    m(11.8, wallHeight, .24, shopX, groundY + wallHeight / 2, backZ, storeShell, !0);
    const storefrontCenter = 3.0,
      storefrontWidth = 4.25;
    for (const side of [-1, 1]) {
      const windowX = shopX + side * storefrontCenter;
      m(storefrontWidth, .8, .24, windowX, groundY + .4, frontZ, storeShell);
      m(storefrontWidth, .47, .24, windowX, groundY + 3.31, frontZ, storeShell);
      h(windowX, frontZ, storefrontWidth / 2, .14);
    }
    m(1.7, .3, .24, shopX, groundY + 3.4, frontZ, storeShell);
    m(12.35, .18, 9.35, shopX, groundY + 3.72, shopZ, storeRoofMat);
    m(12.5, .15, .18, shopX, groundY + 3.58, frontZ, stationRed);
    m(12.5, .15, .18, shopX, groundY + 3.58, backZ, stationRed);
    m(.18, .15, 9.2, shopX - 6.1, groundY + 3.58, shopZ, stationRed);
    m(.18, .15, 9.2, shopX + 6.1, groundY + 3.58, shopZ, stationRed);
    for (const side of [-1, 1]) {
      m(storefrontWidth, 2.25, .035, shopX + side * storefrontCenter, groundY + 1.95, frontZ - .14, stationGlass);
      for (const frameX of [-1, 1]) m(.055, 2.35, .07, shopX + side * storefrontCenter + frameX * (storefrontWidth / 2 - .06), groundY + 1.95, frontZ - .19, stationWindowFrame);
      m(storefrontWidth, .065, .08, shopX + side * storefrontCenter, groundY + .78, frontZ - .19, stationWindowFrame);
      m(storefrontWidth, .065, .08, shopX + side * storefrontCenter, groundY + 3.12, frontZ - .19, stationWindowFrame);
      m(.055, 2.25, .065, shopX + side * storefrontCenter, groundY + 1.95, frontZ - .19, stationWindowFrame);
    }
    m(.09, 2.28, .09, shopX - .9, groundY + 1.92, frontZ - .19, stationWindowFrame);
    m(.09, 2.28, .09, shopX + .9, groundY + 1.92, frontZ - .19, stationWindowFrame);
    m(1.16, .045, .5, shopX, groundY + .17, frontZ - .3, stationDarkSteel);
    const openDoor = new Mesh(new BoxGeometry(.78, 2.18, .075), stationGlass);
    openDoor.position.set(shopX + .24, groundY + 1.24, frontZ + .04);
    openDoor.rotation.y = -.72;
    e.add(openDoor);
    m(.12, .12, .12, shopX + .24, groundY + 2.38, frontZ + .04, stationSteel);
    m(.045, .24, .035, shopX - .05, groundY + 1.22, frontZ - .12, stationSteel);
    const sign = new Mesh(new PlaneGeometry(5.2, .72), stationSignMat);
    sign.position.set(shopX, groundY + 3.05, frontZ - .205);
    sign.rotation.y = Math.PI;
    e.add(sign);
    for (const side of [-1, 1]) m(.13, 3.6, .13, shopX + side * 6.22, groundY + 1.8, shopZ, stationSteel);
    m(4.5, .12, .72, shopX, groundY + 1.04, shopZ + 3.65, counterMat);
    m(4.5, .7, .16, shopX, groundY + .64, shopZ + 3.95, counterMat);
    m(.56, .12, .4, shopX - .95, groundY + 1.17, shopZ + 3.35, stationDarkSteel);
    m(.48, .48, .04, shopX - .95, groundY + 1.47, shopZ + 3.32, stationScreenMat);
    m(.12, .25, .16, shopX + 1.75, groundY + 1.18, shopZ + 3.54, stationSteel);
    for (let shelf = 0; shelf < 3; shelf++) {
      const shelfZ = shopZ - 1.5 + shelf * 1.15;
      for (const side of [-1, 1]) {
        const shelfX = shopX + side * 4.45;
        placeStationInstance(stationShelfFrames, stationShelfFrameCount++, shelfX, groundY + 1.08, shelfZ);
        for (let level = 0; level < 4; level++) {
          const shelfY = groundY + .42 + level * .49;
          placeStationInstance(stationShelfBoards, stationShelfBoardCount++, shelfX, shelfY, shelfZ);
          for (let product = 0; product < 3; product++) {
            const materialIndex = (product + level + shelf + index) % stationProductMats.length;
            placeStationProduct(stationShelfProducts, stationShelfProductCounts, materialIndex, shelfX - .25 + product * .25, shelfY + .16, shelfZ);
          }
        }
        h(shelfX, shelfZ, .4, .32);
      }
    }
    for (let cooler = 0; cooler < 3; cooler++) {
      const coolerX = shopX - 2.5 + cooler * 1.65,
        coolerZ = shopZ + .3;
      m(1.48, 2.3, .65, coolerX, groundY + 1.18, coolerZ, coolerMat);
      m(1.35, 1.95, .035, coolerX, groundY + 1.26, coolerZ - .35, coolerGlass);
      m(.045, 2, .07, coolerX, groundY + 1.26, coolerZ - .385, stationSteel);
      for (let level = 0; level < 4; level++) {
        placeStationInstance(stationCoolerShelves, stationCoolerShelfCount++, coolerX, groundY + .55 + level * .42, coolerZ - .04);
        placeStationProduct(stationCoolerProducts, stationCoolerProductCounts, (level + cooler) % stationProductMats.length, coolerX - .38, groundY + .7 + level * .42, coolerZ - .1);
        placeStationProduct(stationCoolerProducts, stationCoolerProductCounts, (level + cooler + 2) % stationProductMats.length, coolerX, groundY + .7 + level * .42, coolerZ - .1);
        placeStationProduct(stationCoolerProducts, stationCoolerProductCounts, (level + cooler + 4) % stationProductMats.length, coolerX + .38, groundY + .7 + level * .42, coolerZ - .1);
      }
      m(.04, .32, .04, coolerX + .52, groundY + 1.25, coolerZ - .4, stationSteel);
      h(coolerX, coolerZ, .74, .36);
    }
    h(shopX, shopZ + 3.76, 2.28, .43);
    for (let light = 0; light < 2; light++) {
      const lightX = shopX + (light ? 3.5 : -3.5);
      m(1.7, .045, .34, lightX, groundY + 3.39, shopZ - .15, stationAwningLight);
    }
    const insideLight = new PointLight(`#fff0d5`, .55, 17, 2);
    insideLight.position.set(shopX, groundY + 2.8, shopZ);
    e.add(insideLight);
    const outsideLight = new PointLight(`#dceeff`, .55, 15, 2);
    outsideLight.position.set(shopX, groundY + 3.3, frontZ - 1);
    e.add(outsideLight);
  };
  for (let stationIndex = 0; stationIndex < nm.length; stationIndex++) {
    const station = nm[stationIndex];
    const groundY = Uw(station.x, station.z);
    m(26, .14, 22, station.x, groundY + .07, station.z, o);
    const access = stationRoadAccesses[stationIndex];
    const roadEdgeX = access.roadX + access.side * 9;
    const stationEdgeX = station.x - access.side * 13;
    const accessLength = Math.abs(stationEdgeX - roadEdgeX) + 3;
    const accessCenterX = (stationEdgeX + roadEdgeX) / 2;
    m(accessLength, .12, 9.5, accessCenterX, groundY + .07, station.z, r);
    const canopy = new MeshStandardMaterial({
      color: stationIndex === 1 ? `#d8e1e0` : `#e8eef2`,
      roughness: .52,
      metalness: .16
    });
    const canopyTop = new MeshStandardMaterial({
      color: `#343b40`,
      roughness: .62,
      metalness: .25
    });
    m(24.5, .45, 16, station.x, groundY + 5.2, station.z, canopy);
    m(24.3, .12, 15.8, station.x, groundY + 5.49, station.z, canopyTop);
    m(24.7, .12, .22, station.x, groundY + 4.94, station.z - 8.02, stationRed);
    m(24.7, .12, .22, station.x, groundY + 4.94, station.z + 8.02, stationRed);
    m(.16, .08, 15.8, station.x - 12.1, groundY + 4.93, station.z, stationSteel);
    m(.16, .08, 15.8, station.x + 12.1, groundY + 4.93, station.z, stationSteel);
    for (let rib = -4; rib <= 4; rib++) m(.045, .06, 15.7, station.x + rib * 2.6, groundY + 5.57, station.z, stationSteel);
    for (let side of [-1, 1]) m(20, .38, .1, station.x, groundY + 5.23, station.z + side * 8.1, stationSignMat);
    for (let x of [-11.8, 11.8]) for (let z of [-7, 7]) {
      m(.48, 5.2, .48, station.x + x, groundY + 2.6, station.z + z, stationSteel, !0);
      m(.64, .12, .64, station.x + x, groundY + .2, station.z + z, stationDarkSteel);
    }
    for (let lampX of [-7.5, -2.5, 2.5, 7.5]) for (let lampZ of [-5, 5]) {
      m(2.1, .045, .7, station.x + lampX, groundY + 4.94, station.z + lampZ, stationAwningLight);
    }
    const canopyLight = new PointLight(`#fff0d5`, .7, 28, 2);
    canopyLight.position.set(station.x, groundY + 4.62, station.z);
    e.add(canopyLight);
    addFuelPump(station.x - 4, station.z - 2.35, groundY);
    addFuelPump(station.x + 4, station.z - 2.35, groundY);
    addStationStore(station, stationIndex, groundY);
    for (const [parkingX, parkingZ, acrossX] of [[station.x - 9, station.z - 6, !1], [station.x + 9, station.z - 6, !1], [station.x - 9, station.z + 7.5, !0]]) for (const side of [-1, 1]) acrossX ? m(5.6, .018, .085, parkingX, groundY + .16, parkingZ + side * 1.4, stationParkingPaint) : m(.085, .018, 5.6, parkingX + side * 1.4, groundY + .16, parkingZ, stationParkingPaint);
    m(.28, 7, .28, station.x + 12, groundY + 3.5, station.z + 9, stationSteel);
    m(3, 1.4, .3, station.x + 12, groundY + 7, station.z + 9, stationSignMat);
    const priceBoard = new Mesh(new PlaneGeometry(2.3, .72), stationScreenMat);
    priceBoard.position.set(station.x + 12, groundY + 7, station.z + 8.83);
    priceBoard.rotation.y = Math.PI;
    e.add(priceBoard);
    const canopyBadge = new Mesh(new PlaneGeometry(4.4, .48), stationSignMat);
    canopyBadge.position.set(station.x, groundY + 5.22, station.z - 8.09);
    e.add(canopyBadge);
  }
  for (const [mesh, count] of [[stationShelfFrames, stationShelfFrameCount], [stationShelfBoards, stationShelfBoardCount], [stationCoolerShelves, stationCoolerShelfCount], [stationHoseSegments, stationHoseCount]]) {
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = !0;
    e.add(mesh);
  }
  for (let index = 0; index < stationProductMats.length; index++) {
    const shelfProducts = stationShelfProducts[index];
    shelfProducts.count = stationShelfProductCounts[index];
    shelfProducts.instanceMatrix.needsUpdate = !0;
    e.add(shelfProducts);
    const coolerProducts = stationCoolerProducts[index];
    coolerProducts.count = stationCoolerProductCounts[index];
    coolerProducts.instanceMatrix.needsUpdate = !0;
    e.add(coolerProducts);
  }
  m(28, .15, 820, 175, .025, -290, i);
  for (let e = -680; e < 150; e += 12) E(175, e, .22, 7, .14);
  m(.2, .02, 820, 168, .14, -290, c), m(.2, .02, 820, 182, .14, -290, c);
  let F = new InstancedMesh(new BoxGeometry(.1, .04, .1), new MeshStandardMaterial({
      color: `#ffeecc`,
      emissive: `#ffcc66`,
      emissiveIntensity: 2.2
    }), 200),
    I = 0;
  for (let e = -680; e < 150; e += 6) _.set(171.5, .16, e), v.identity(), y.set(1, 1, 1), g.compose(_, v, y), F.setMatrixAt(I++, g);
  F.count = I, F.instanceMatrix.needsUpdate = !0, e.add(F);
  let L = new BoxGeometry(.12, .9, .12),
    R = new BoxGeometry(.6, .85, 11),
    z = new InstancedMesh(L, d, 200),
    ee = new InstancedMesh(R, a, 200);
  z.castShadow = !0, ee.castShadow = !0, ee.receiveShadow = !0;
  let B = 0;
  for (let e = -690; e < 160; e += 14) if (Math.abs(e - 70) >= 11 && Math.abs(e + 80) >= 11) for (let t of [-15, 15]) _.set(175 + t, .45, e), v.identity(), y.set(1, 1, 1), g.compose(_, v, y), z.setMatrixAt(B, g), ee.setMatrixAt(B, g), h(175 + t, e, .3, 5.5), B++;
  z.count = B, ee.count = B, z.instanceMatrix.needsUpdate = !0, ee.instanceMatrix.needsUpdate = !0, e.add(z), e.add(ee), m(60, .12, 18, 147, .02, 70, i), m(60, .12, 18, 147, .02, -80, i);
  for (let e = -155; e > -520; e -= 4) {
    let t = e - 4,
      n = Hw(e),
      i = Hw(t),
      o = Uw(n, e),
      s = Math.hypot(4, i - n) + 1,
      c = m(14, .18, s, n, o, e, r);
    if (c.rotation.y = -Math.atan2(i - n, 4), Math.round(e / 8) % 2 == 0) {
      let t = m(.22, .02, 2, n, o + .13, e, l);
      t.rotation.y = c.rotation.y;
    }
    for (let t of [-1, 1]) {
      let r = m(.3, .65, s, n + t * 7.5, o + .42, e, a);
      r.rotation.y = c.rotation.y;
    }
  }
  m(18, .1, 36, 0, 0, -130, r);
  for (let e = 0; e < 10; e++) {
    let t = -132 - e * 3.4,
      n = t - 3.4,
      i = -25 * e / 10,
      a = -25 * (e + 1) / 10,
      o = m(15, .15, 5.4, (i + a) / 2, Uw(i, t), (t + n) / 2, r);
    o.rotation.y = -Math.atan2(a - i, 3.4);
  }
  const closureFaceCanvas = document.createElement(`canvas`);
  closureFaceCanvas.width = 512;
  closureFaceCanvas.height = 128;
  const closureFaceContext = closureFaceCanvas.getContext(`2d`);
  closureFaceContext.fillStyle = `#e96b1b`;
  closureFaceContext.fillRect(0, 0, 512, 128);
  closureFaceContext.save();
  closureFaceContext.beginPath();
  closureFaceContext.rect(0, 0, 512, 128);
  closureFaceContext.clip();
  closureFaceContext.translate(-128, 0);
  closureFaceContext.rotate(-Math.PI / 4);
  for (let stripe = -256; stripe < 768; stripe += 112) {
    closureFaceContext.fillStyle = `#eee9dc`;
    closureFaceContext.fillRect(stripe, -256, 46, 768);
    closureFaceContext.fillStyle = `rgba(45, 45, 45, .35)`;
    closureFaceContext.fillRect(stripe + 46, -256, 8, 768);
  }
  closureFaceContext.restore();
  const closureFaceTexture = new CanvasTexture(closureFaceCanvas);
  closureFaceTexture.colorSpace = `srgb`;
  const closureFaceMaterial = new MeshStandardMaterial({
    map: closureFaceTexture,
    roughness: .58,
    metalness: .02
  });
  const closureOrange = new MeshStandardMaterial({
    color: `#eb701f`,
    roughness: .72,
    metalness: .02
  });
  const closureDark = new MeshStandardMaterial({
    color: `#373b3e`,
    roughness: .84,
    metalness: .12
  });
  const closureLamp = new MeshStandardMaterial({
    color: `#ffad32`,
    emissive: `#ff8518`,
    emissiveIntensity: .7,
    roughness: .3
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
      const base = new Mesh(new BoxGeometry(moduleLength - .08, .32, depth), closureDark);
      base.position.set(localX, .16, 0);
      barrier.add(base);
      const lowerBody = new Mesh(new BoxGeometry(moduleLength - .14, .34, depth - .06), closureOrange);
      lowerBody.position.set(localX, .49, 0);
      barrier.add(lowerBody);
      const upperBody = new Mesh(new BoxGeometry(moduleLength - .38, .42, depth - .32), closureOrange);
      upperBody.position.set(localX, .87, 0);
      barrier.add(upperBody);
      for (const faceSide of [-1, 1]) {
        const face = new Mesh(new BoxGeometry(moduleLength - .62, .3, .025), closureFaceMaterial);
        face.position.set(localX, .88, faceSide * (depth / 2 - .15));
        barrier.add(face);
      }
      const join = new Mesh(new BoxGeometry(.12, .16, depth - .12), closureDark);
      join.position.set(localX + moduleLength / 2 - .02, .32, 0);
      barrier.add(join);
      if (index === 0 || index === moduleCount - 1) {
        const lamp = new Mesh(new CylinderGeometry(.13, .13, .12, 12), closureLamp);
        lamp.position.set(localX, 1.14, 0);
        barrier.add(lamp);
      }
    }
    e.add(barrier);
    const cosine = Math.abs(Math.cos(yaw)),
      sine = Math.abs(Math.sin(yaw));
    h(x, z, cosine * actualWidth / 2 + sine * depth / 2, sine * actualWidth / 2 + cosine * depth / 2);
  }
  addRoadClosure(175, -695, 28, 1.4, Math.PI / 2);
  let te = new MeshStandardMaterial({
      color: `#2c3a36`,
      roughness: .95
    }),
    ne = new InstancedMesh(new ConeGeometry(1, 1, 14), te, 60);
  ne.castShadow = !0;
  for (let e = 0; e < 60; e++) {
    let t = -185 - j() * 350,
      n = j() > .5 ? 1 : -1,
      i = 18 + j() * 55,
      a = 18 + j() * 26,
      r = Hw(t) + n * Math.max(30 + j() * 70, a * 1.7 + 12);
    _.set(r, Uw(r, t) + i / 2 - 4, t), v.identity(), y.set(a, i, a), g.compose(_, v, y), ne.setMatrixAt(e, g), h(r, t, a * .6, a * .6);
  }
  ne.instanceMatrix.needsUpdate = !0, e.add(ne);
  let re = new MeshStandardMaterial({
      color: `#423d34`,
      roughness: .9
    }),
    ie = new MeshStandardMaterial({
      color: `#1f4736`,
      roughness: .9
    }),
    ae = new InstancedMesh(new CylinderGeometry(.25, .4, 4, 12), re, 120),
    oe = [new ConeGeometry(2.8, 3.5, 16), new ConeGeometry(2.3, 3.5, 16), new ConeGeometry(1.8, 3.5, 16)].map(e => {
      let t = new InstancedMesh(e, ie, 120);
      return t.castShadow = !0, t;
    });
  for (let e = 0; e < 120; e++) {
    let t = -165 - j() * 360,
      n = Hw(t) + (j() > .5 ? 1 : -1) * (12 + j() * 14),
      r = Uw(n, t);
    _.set(n, r + 2, t), v.identity(), y.set(1, 1, 1), g.compose(_, v, y), ae.setMatrixAt(e, g);
    for (let i = 0; i < 3; i++) _.set(n, r + 4 + i * 2, t), g.compose(_, v, y), oe[i].setMatrixAt(e, g);
    h(n, t, .6, .6);
  }
  ae.instanceMatrix.needsUpdate = !0, e.add(ae);
  for (let t of oe) t.instanceMatrix.needsUpdate = !0, e.add(t);
  let H = new BufferGeometry(),
    se = [];
  for (let e = 0; e < 500; e++) se.push((Math.random() - .5) * 1e3, 220 + Math.random() * 250, (Math.random() - .5) * 1e3);
  return H.setAttribute(`position`, new Float32BufferAttribute(se, 3)), e.add(new Points(H, new PointsMaterial({
    color: `#ffffff`,
    size: 1.6,
    sizeAttenuation: !0,
    transparent: !0,
    opacity: .7
  }))), {
    solids: t,
    lampPositions: n,
    signals
  };
}
var eT = (e, t, n) => Math.max(t, Math.min(n, e)),
  tT = (e, t, n) => e + (t - e) * n,
  nT = (e, t, n, r) => e + (t - e) * (1 - Math.exp(-n * r)),
  rT = Math.PI * 2,
  iT = {
    coupe: 2.62,
    muscle: 2.95,
    super: 2.65
  },
  aT = .55;
function oT(e) {
  let t = em[e] || 7200;
  return $p.ratios.map(e => t / 60 / (e * $p.finalDrive) * rT * $p.wheel);
}
function sT(e) {
  return (em[e] || 7200) / 60 / (Math.abs($p.reverse) * $p.finalDrive) * rT * $p.wheel;
}
function cT(e, t) {
  let n = iT[e.shape] || 2.62,
    r = e.grip || 1,
    i = t.max,
    a = 4 + t.acceleration * .36,
    o = 14 * r,
    s = 13 * r,
    c = e.awd ? .25 : .5;
  function l(e, t, r) {
    let l = e.noPolice ? 1 - Math.max(0, e.health) / 100 : 0,
      u = i * (1 - .4 * l),
      d = a * (1 - .4 * l),
      f = o * (1 - .14 * l),
      p = s * (1 - .1 * l);
    e.steer = nT(e.steer || 0, r.steer, r.steer ? 7 : 10, t);
    let m = e.steer,
      h = e.heading,
      g = e.vx * -Math.sin(h) + e.vz * -Math.cos(h),
      _ = e.vx * -Math.cos(h) + e.vz * Math.sin(h),
      v = g > 1 ? Math.atan2(-_, g) : 0;
    g > 7 && (r.handbrake || Math.abs(v) > .3) ? e.driftOn = !0 : !r.handbrake && (Math.abs(v) < .07 || g < 4) && (e.driftOn = !1);
    let y = e.driftAmt = nT(e.driftAmt || 0, +!!e.driftOn, e.driftOn ? 10 : 4, t),
      b = Math.abs(g),
      x = m * Math.min(b * Math.tan(aT) / n, f / Math.max(b, 1)) * Math.sign(g),
      S = eT(43 / Math.max(b, 13), .6, 1),
      C = (r.handbrake ? .95 : r.throttle ? .7 : .1) * S,
      w = Math.abs(m) > .15 ? m * C : r.handbrake ? v : v * (r.throttle ? .6 : 0),
      T = 3 * p / Math.max(b, 6),
      E = eT((w - v) * 3.5, -T, T);
    e.yaw = nT(e.yaw || 0, tT(x, E, y), tT(12, 5, y), t), e.heading = h += e.yaw * t;
    let D = -Math.sin(h),
      O = -Math.cos(h),
      k = -Math.cos(h),
      A = Math.sin(h);
    g = e.vx * D + e.vz * O, _ = e.vx * k + e.vz * A;
    let j = Math.sign(_) * Math.max(0, Math.abs(_) - tT(f * 1.3, p, y) * t);
    Math.abs(g) > 1 && (g = Math.sign(g) * Math.sqrt(g * g + (_ * _ - j * j) * tT(1, .5, y))), _ = j;
    let M = 0;
    if (e.gear === -1) M = -e.driveThrottle * r.fuel * d * .45 * (1 - Math.min(1, -g / 14)), r.throttle && g < -.3 && (M += 16);else {
      let t = Math.min(1, Math.abs(g) / u);
      M = e.driveThrottle * r.fuel * d * (1 - t ** 2.2) * (1 - c * y), r.brake && g > .3 && (M -= 16);
    }
    r.handbrake && g > .3 && (M -= 3.5);
    let N = .2 + 25e-5 * g * g + (!r.throttle && !r.brake ? 1.1 : 0);
    g -= Math.sign(g) * Math.min(Math.abs(g), N * t), g = eT(g + M * t, -14, u), e.vx = g * D + _ * k, e.vz = g * O + _ * A, e.slipAngle = Math.abs(g) > 1 ? Math.abs(Math.atan2(_, Math.abs(g))) : 0, e.u = g, e.w = _, e.ax = M, Math.abs(g) < .15 && Math.abs(_) < .15 && !r.throttle && !r.brake && (e.vx = 0, e.vz = 0, e.u = 0, e.w = 0, e.yaw = 0);
  }
  return {
    step: l
  };
}
var lT = 7,
  uT = .93,
  dT = (e, t, n) => Math.max(t, Math.min(n, e));
function fT(e, t, n, r, i, a, o) {
  let s = em[t.id] || 7200,
    c = t.id === `V12` ? 1e3 : 900,
    l = oT(t.id),
    u = Math.abs(r);
  e.redline = s, e.shiftTimer = Math.max(0, (e.shiftTimer || 0) - n), e.shiftCooldown = Math.max(0, (e.shiftCooldown || 0) - n);
  let d = r < -.6 || u < .6 && a && !i,
    f = e => u / l[e - 1] * s,
    p = e.gear || 1;
  if (d) p = -1;else if (p < 1 || u < .5) p = 1;else if (e.shiftCooldown === 0 && e.shiftTimer === 0 && !o) {
    let e = s * (i ? .4 : .3);
    if (p < lT && f(p) > s * uT) p++;else if (p > 1 && f(p) < e) for (p--; p > 1 && f(p - 1) < s * .75;) p--;
  }
  p !== e.gear && (p > 0 && e.gear > 0 && u > .5 && (e.shiftDirection = Math.sign(p - e.gear), e.shiftSerial = (e.shiftSerial || 0) + 1, e.shiftTimer = t.id === `V12` ? .14 : .2, e.shiftCooldown = .6), e.gear = p), e.shifting = e.shiftTimer > 0;
  let m = d ? a : i;
  e.pedal = m, e.driveThrottle = m * (e.shifting ? .08 : 1);
  let h = d ? u / sT(t.id) * s : f(e.gear),
    g = m * Math.max(0, 1 - u / 7) * 1600,
    _ = o && i ? 1800 : 0,
    v = e.shifting && e.shiftDirection < 0 ? 350 : 0,
    y = t && e.fuel > 0 ? dT(Math.max(c + g, h) + _ + v, c, s) : 0,
    b = e.shifting ? 19 : m ? 15 : 10;
  e.rpm = Math.round(e.rpm + (y - e.rpm) * (1 - Math.exp(-n * b)));
}
function pT(e, t, n, r, i) {
  return {
    x: e,
    z: t,
    hw: r,
    hl: i,
    cos: Math.cos(n),
    sin: Math.sin(n)
  };
}
function mT(e, t) {
  let n = t.x - e.x,
    r = t.z - e.z,
    i = 1 / 0,
    a = 0,
    o = 0,
    s = -1 / 0;
  for (let c = 0; c < 4; c++) {
    let l = c < 2 ? e : t,
      u = c % 2 ? l.sin : l.cos,
      d = c % 2 ? l.cos : -l.sin,
      f = n * u + r * d,
      p = e.hw * Math.abs(u * e.cos - d * e.sin) + e.hl * Math.abs(u * e.sin + d * e.cos) + (t.hw * Math.abs(u * t.cos - d * t.sin) + t.hl * Math.abs(u * t.sin + d * t.cos)) - Math.abs(f);
    if (p < i) {
      i = p;
      let e = f < 0 ? -1 : 1;
      a = u * e, o = d * e;
    }
    -p > s && (s = -p);
  }
  return i > 0 ? {
    overlap: !0,
    depth: i,
    nx: a,
    nz: o,
    gap: -i
  } : {
    overlap: !1,
    depth: 0,
    nx: 0,
    nz: 0,
    gap: s
  };
}
const dfcCollisionProfiles = new Map();
function dfcGetCollisionProfile(shape) {
  if (!dfcCollisionProfiles.has(shape)) {
    const spec = DFC_SPECS[shape] || DFC_SPECS.coupe;
    dfcCollisionProfiles.set(shape, {
      shape,
      length: spec.L,
      widths: spec.wid
    });
  }
  return dfcCollisionProfiles.get(shape);
}
function dfcCreateCarFootprint(x, z, heading, profile) {
  const cos = Math.cos(heading),
    sin = Math.sin(heading),
    vertices = [];
  const addSide = (side, reverse) => {
    const stations = reverse ? [...profile.widths].reverse() : profile.widths;
    for (const [station, halfWidth] of stations) {
      const localX = side * halfWidth,
        localZ = station - profile.length / 2;
      vertices.push([x + localX * cos + localZ * sin, z - localX * sin + localZ * cos]);
    }
  };
  addSide(1, !1);
  addSide(-1, !0);
  return {
    x,
    z,
    vertices
  };
}
function dfcFootprintBoxCollision(car, box) {
  let minOverlap = 1 / 0,
    nx = 0,
    nz = 0;
  const axes = [[1, 0], [0, 1]];
  for (let index = 0; index < car.vertices.length; index++) {
    const current = car.vertices[index];
    const next = car.vertices[(index + 1) % car.vertices.length];
    const edgeX = next[0] - current[0],
      edgeZ = next[1] - current[1];
    const edgeLength = Math.hypot(edgeX, edgeZ);
    if (edgeLength > 1e-8) axes.push([-edgeZ / edgeLength, edgeX / edgeLength]);
  }
  for (const [axisX, axisZ] of axes) {
    let carMin = 1 / 0,
      carMax = -1 / 0;
    for (const [x, z] of car.vertices) {
      const projection = x * axisX + z * axisZ;
      carMin = Math.min(carMin, projection);
      carMax = Math.max(carMax, projection);
    }
    const boxCenter = box.x * axisX + box.z * axisZ;
    const boxRadius = box.w * Math.abs(axisX) + box.d * Math.abs(axisZ);
    const overlap = Math.min(carMax, boxCenter + boxRadius) - Math.max(carMin, boxCenter - boxRadius);
    if (overlap <= 0) return null;
    if (overlap < minOverlap) {
      const direction = boxCenter - (car.x * axisX + car.z * axisZ) < 0 ? -1 : 1;
      minOverlap = overlap;
      nx = axisX * direction;
      nz = axisZ * direction;
    }
  }
  return {
    depth: minOverlap,
    nx,
    nz
  };
}
var hT = 24;
function gT(e) {
  let t = new Map();
  for (let n of e) {
    let e = Math.floor((n.x - n.w) / hT),
      r = Math.floor((n.x + n.w) / hT),
      i = Math.floor((n.z - n.d) / hT),
      a = Math.floor((n.z + n.d) / hT);
    for (let o = e; o <= r; o++) for (let e = i; e <= a; e++) {
      let r = o + `,` + e,
        i = t.get(r);
      i || (i = [], t.set(r, i)), i.push(n);
    }
  }
  let n = 0;
  return {
    near(e, r, i, a) {
      n++, a ? a.length = 0 : a = [];
      let o = Math.floor((e - i) / hT),
        s = Math.floor((e + i) / hT),
        c = Math.floor((r - i) / hT),
        l = Math.floor((r + i) / hT);
      for (let e = o; e <= s; e++) for (let r = c; r <= l; r++) {
        let i = t.get(e + `,` + r);
        if (i) for (let e of i) e._bp !== n && (e._bp = n, a.push(e));
      }
      return a;
    }
  };
}
var _T = (e, t, n) => Math.max(t, Math.min(n, e)),
  vT = (e, t) => Math.hypot(e.x - t.x, e.z - t.z),
  yT = 1,
  bT = 2.25,
  xT = 1.05,
  ST = 2.3,
  CT = [`#8a97a8`, `#b0563a`, `#3f6f8f`, `#7a6f9a`, `#5a7a5e`],
  wT = 4.6,
  TT = 4.9;
function ET(e, t, n, r = !1) {
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
    ended: !1,
    reason: ``,
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
    onFoot: !1,
    store: -1,
    shop: -1,
    arrestTimer: 0,
    _fPrev: !1,
    nextVid: 1,
    noPolice: !!r,
    playerVeh: {
      kind: `player`,
      color: e.color,
      shape: e.shape,
      spec: `player|${e.color}|${e.shape}`
    },
    vehicles: [],
    police: r ? [] : [{
      x: -60,
      z: 20,
      heading: 0,
      speed: 0,
      mode: 0,
      onFoot: !1,
      carId: null
    }, {
      x: 60,
      z: 20,
      heading: 0,
      speed: 0,
      mode: 1,
      onFoot: !1,
      carId: null
    }, {
      x: 0,
      z: -30,
      heading: 0,
      speed: 0,
      mode: 2,
      onFoot: !1,
      carId: null
    }, {
      x: -60,
      z: -30,
      heading: 0,
      speed: 0,
      mode: 3,
      onFoot: !1,
      carId: null
    }]
  };
  for (let e of nm) for (let [t, n, r] of [[-9, -6, 0], [9, -6, 0], [-9, 7.5, Math.PI / 2]]) {
    let a = i.nextVid++;
    i.vehicles.push({
      id: a,
      x: e.x + t,
      z: e.z + n,
      heading: r,
      kind: `civilian`,
      color: CT[a % CT.length],
      shape: `coupe`
    });
  }
  let a = gT(n),
    o = n.filter(e => e.w >= 3),
    s = [];
  function c(e) {
    if (vT(e, i) > 75) return !1;
    for (let t of o) for (let n = 1; n < 9; n++) {
      let r = n / 9,
        a = e.x + (i.x - e.x) * r,
        o = e.z + (i.z - e.z) * r;
      if (Math.abs(a - t.x) < t.w && Math.abs(o - t.z) < t.d) return !1;
    }
    return !0;
  }
  function l(e) {
    return i.collisionTimer <= 0 && (i.health = _T(i.health - e, 0, 100), i.collisionTimer = .5, i.shake = Math.min(i.shake + e * .08, 1.2), i.police.some(e => vT(e, i) < 85) && (i.wanted = _T(i.wanted + .6, 0, 5)), !0);
  }
  function u() {
    if (i.onFoot) {
      let e = null,
        t = 3.6;
      for (let n of i.vehicles) {
        let r = vT(n, i);
        r < t && (t = r, e = n);
      }
      if (!e) return;
      if (i.vehicles = i.vehicles.filter(t => t.id !== e.id), e.kind === `police`) {
        let t = i.police.find(t => t.carId === e.id);
        t && (t.onFoot = !0, t.carId = null), i.wanted = _T(i.wanted + 1, 0, 5);
      }
      i.onFoot = !1, i.x = e.x, i.z = e.z, i.heading = e.heading, i.vx = 0, i.vz = 0, i.u = 0, i.w = 0, i.yaw = 0, i.playerVeh = {
        kind: e.kind,
        color: e.color,
        shape: e.shape,
        spec: `${e.kind}|${e.color}|${e.shape}`
      };
    } else {
      if (Math.hypot(i.vx, i.vz) > 3) return;
      let e = i.nextVid++;
      i.vehicles.push({
        id: e,
        x: i.x,
        z: i.z,
        heading: i.heading,
        kind: i.playerVeh.kind,
        color: i.playerVeh.color,
        shape: i.playerVeh.shape
      }), i.onFoot = !0, i.x += -Math.cos(i.heading) * 2.2, i.z += Math.sin(i.heading) * 2.2, i.vx = 0, i.vz = 0, i.u = 0, i.w = 0, i.yaw = 0;
      let t = 0,
        n = [...i.police].sort((e, t) => vT(e, i) - vT(t, i));
      for (let e of n) {
        if (t >= 2) break;
        if (!e.onFoot && i.wanted > .15 && vT(e, i) < 30) {
          let n = i.nextVid++;
          i.vehicles.push({
            id: n,
            x: e.x,
            z: e.z,
            heading: e.heading,
            kind: `police`,
            color: `#ffffff`,
            shape: `coupe`
          }), e.carId = n, e.onFoot = !0, t++;
        }
      }
    }
  }
  let d = cT(e, t),
    carCollisionProfile = dfcGetCollisionProfile(e.shape);
  return {
    state: i,
    setCar(e) {
      i.car = e, d = cT(e, t), carCollisionProfile = dfcGetCollisionProfile(e.shape), i.playerVeh.kind === `player` && (i.playerVeh = {
        kind: `player`,
        color: e.color,
        shape: e.shape,
        spec: `player|${e.color}|${e.shape}`
      });
    },
    update(e, n, cameraHeading = i.heading) {
      if (i.ended) return i;
      i.elapsed += e, i.collisionTimer -= e, i.shake *= Math.exp(-e * 5);
      let r = n.ArrowUp || n.KeyW || n.KeyZ ? 1 : 0,
        o = n.ArrowDown || n.KeyS ? 1 : 0,
        f = (n.ArrowLeft || n.KeyA || n.KeyQ ? 1 : 0) - (n.ArrowRight || n.KeyD ? 1 : 0),
        p = !!n.Space,
        m = !!n.KeyF && !i._fPrev;
      if (i._fPrev = !!n.KeyF, m && u(), i.onFoot) {
        i.throttle = 0, i.brake = 0, i.pedal = 0;
        let t = (n.ArrowRight || n.KeyD ? 1 : 0) - (n.ArrowLeft || n.KeyA || n.KeyQ ? 1 : 0),
          r = (n.ArrowDown || n.KeyS ? 1 : 0) - (n.ArrowUp || n.KeyW || n.KeyZ ? 1 : 0),
          o = Math.hypot(t, r) || 1;
        ((sh, ch, sp) => {
          let dx = (ch * t + sh * r) / o,
            dz = (ch * r - sh * t) / o;
          i.x += dx * sp * e;
          i.z += dz * sp * e;
          i.footSpeed = t || r ? sp : 0;
          if (i.footYaw === void 0) i.footYaw = i.heading;
          if (t || r) {
            let ty = Math.atan2(-dx, -dz),
              df = (ty - i.footYaw + Math.PI * 3) % (Math.PI * 2) - Math.PI;
            i.footYaw = Math.atan2(Math.sin(i.footYaw + df * (1 - Math.exp(-14 * e))), Math.cos(i.footYaw + df * (1 - Math.exp(-14 * e))));
          }
        })(Math.sin(cameraHeading), Math.cos(cameraHeading), wT), i.x = _T(i.x, -200, 250), i.z = _T(i.z, -700, 150);
        for (let e of a.near(i.x, i.z, 3, s)) if (Math.abs(i.x - e.x) < e.w + .5 && Math.abs(i.z - e.z) < e.d + .5) {
          let t = i.x - e.x,
            n = i.z - e.z;
          e.w + .5 - Math.abs(t) < e.d + .5 - Math.abs(n) ? i.x = e.x + Math.sign(t || 1) * (e.w + .5) : i.z = e.z + Math.sign(n || 1) * (e.d + .5);
        }
        i.vx = 0, i.vz = 0, i.u = 0, i.w = 0, i.yaw = 0, i.rpm = 900;
      } else {
        i.throttle = r, i.brake = o;
        let n = -Math.sin(i.heading),
          a = -Math.cos(i.heading);
        fT(i, t, e, i.vx * n + i.vz * a, r, o, p), d.step(i, e, {
          throttle: r,
          brake: o,
          handbrake: p,
          steer: f,
          fuel: +(i.fuel > 0)
        });
      }
      let h = -Math.sin(i.heading),
        g = -Math.cos(i.heading),
        _ = Math.hypot(i.vx, i.vz);
      if (!i.onFoot) {
        i.x += i.vx * e, i.z += i.vz * e;
        carCollisionProfile.shape !== i.playerVeh.shape && (carCollisionProfile = dfcGetCollisionProfile(i.playerVeh.shape));
        const footprint = dfcCreateCarFootprint(i.x, i.z, i.heading, carCollisionProfile);
        for (let obstacle of a.near(i.x, i.z, 4, s)) {
          const collision = dfcFootprintBoxCollision(footprint, obstacle);
          if (!collision) continue;
          i.x -= collision.nx * (collision.depth + .02);
          i.z -= collision.nz * (collision.depth + .02);
          const impactSpeed = Math.max(0, i.vx * collision.nx + i.vz * collision.nz);
          if (impactSpeed > .6) {
            i.vx -= collision.nx * impactSpeed * 1.3;
            i.vz -= collision.nz * impactSpeed * 1.3;
            l(4 + impactSpeed * .8) && (i._crash = {
              x: i.x,
              y: i.y || 0,
              z: i.z,
              intensity: Math.min(impactSpeed * .08, 1.5)
            });
          }
          break;
        }
        (i.x < -200 || i.x > 250 || i.z > 150 || i.z < -700) && (i.x = _T(i.x, -200, 250), i.z = _T(i.z, -700, 150), i.vx *= -.3, i.vz *= -.3, l(_ * .7) && (i._crash = {
          x: i.x,
          y: i.y || 0,
          z: i.z,
          intensity: Math.min(_ * .06, 1)
        }));
      }
      let v = i.slipAngle;
      i.drifting = _ > 6 && v > .13 && i.u > 0, i.drifting ? (i.driftTime += e, i.combo = _T(1 + Math.floor(i.driftTime / 2) + Math.floor(v * 1.8), 1, 8), i.score += e * _ * v * i.combo * 15, i.police.some(e => vT(e, i) < 85) && (i.wanted = _T(i.wanted + e * .27, 0, 5))) : (i.driftTime = 0, i.combo = 1), i.onFoot || (i.fuel = _T(i.fuel - e * t.consumption * (.12 + _ / 16 + i.throttle * 1.5 + (i.drifting ? 2 : 0)), 0, 100)), i.station = nm.findIndex(e => vT(e, i) < 8 && _ < 2.5), i.store = i.onFoot ? nm.findIndex(station => Math.abs(i.x - station.x) < 5.25 && i.z > station.z + 7.05 && i.z < station.z + 15.3) : -1, i.shop = i.onFoot ? nm.findIndex(station => Math.abs(i.x - station.x) < 2.35 && i.z > station.z + 5.15 && i.z < station.z + 7.25) : -1, !i.onFoot && i.station >= 0 && (i.fuel = _T(i.fuel + e * 14, 0, 100));
      let y = pT(i.x, i.z, i.heading, yT, bT),
        b = !1,
        x = !1,
        S = !1,
        C = (e, t) => {
          for (let n of a.near(e, t, 30, s)) if (Math.abs(e - n.x) < n.w + 1.2 && Math.abs(t - n.z) < n.d + 1.2) return !0;
          return !1;
        };
      i.police.forEach((n, r) => {
        if (n.onFoot) {
          let t = null,
            r = null;
          if (i.onFoot || n.carId == null) t = i.x, r = i.z;else {
            let e = i.vehicles.find(e => e.id === n.carId);
            e && (t = e.x, r = e.z);
          }
          if (t != null) {
            let a = t - n.x,
              o = r - n.z,
              s = Math.hypot(a, o);
            if (n.heading = Math.atan2(-a, -o), s > .4 && (n.x += a / (s || 1) * Math.min(s, TT * e), n.z += o / (s || 1) * Math.min(s, TT * e)), !i.onFoot && n.carId != null) {
              let e = i.vehicles.find(e => e.id === n.carId);
              e && Math.hypot(e.x - n.x, e.z - n.z) < 2.5 && (i.vehicles = i.vehicles.filter(e => e.id !== n.carId), n.onFoot = !1, n.x = e.x, n.z = e.z, n.heading = e.heading, n.carId = null);
            }
            i.onFoot && vT(n, i) < 1.8 && (i.arrestTimer = Math.min(i.arrestTimer + e * 2.5, 5), S = !0);
          }
          i.wanted > .15 && c(n) && (x = !0);
          return;
        }
        let o = i.wanted > .15;
        n.contactCooldown = Math.max(0, (n.contactCooldown || 0) - e), n.speed = n.speed || 0;
        let u = vT(n, i),
          d,
          f;
        if (o) {
          let e = n.mode === 3 ? u > 30 ? 2.5 : 1 : n.mode === 2 && i.wanted >= 3 ? 3 : n.mode === 1 ? 1.2 : 0;
          d = i.x + i.vx * e, f = i.z + i.vz * e, n.mode === 3 && u > 30 && (d += h * 10, f += g * 10);
        } else d = [-50, 50, -30, 30][r], f = Math.sin(i.elapsed * .1 + r) * 40;
        let p = o ? Math.min(t.max * .8, 12.5 + i.wanted * 3.7) : 5;
        i.onFoot && u < 12 ? p = Math.min(p, Math.max(0, (u - 7) * 1.5)) : u < 6 && (p = Math.min(p, Math.max(0, (u - 1.5) * 1.8)));
        let m = Math.atan2(-(d - n.x), -(f - n.z)),
          _ = 5 + n.speed * .45,
          v = (e, t) => {
            for (let r = 2; r <= t; r += 2) if (C(n.x - Math.sin(e) * r, n.z - Math.cos(e) * r)) return r;
            return t;
          },
          w = v(n.heading, _),
          T = w < _;
        if (T) {
          let e = [-.5, .5, -.9, .9, -1.4, 1.4],
            t = n.heading,
            r = 0;
          for (let i of e) {
            let e = v(n.heading + i, _);
            e > r && (r = e, t = n.heading + i);
          }
          m = t, p = Math.min(p, Math.max(1, w * .7));
        }
        for (let e of i.police) {
          if (e === n || e.onFoot) continue;
          let t = e.x - n.x,
            r = e.z - n.z,
            i = Math.hypot(t, r);
          i < 8 && t * -Math.sin(n.heading) + r * -Math.cos(n.heading) > i * .7 && (p = Math.min(p, Math.max(0, i - 3) * .9));
        }
        let E = Math.atan2(Math.sin(m - n.heading), Math.cos(m - n.heading));
        p *= 1 - Math.min(.55, Math.abs(E) * .5);
        let D = Math.min(3.4, 72 / Math.max(n.speed, 9));
        n.heading += _T(E, -D * e, D * e), n.speed += _T(p - n.speed, -28 * e, (T ? 6 : 12) * e), n.x += -Math.sin(n.heading) * n.speed * e, n.z += -Math.cos(n.heading) * n.speed * e;
        for (let e of a.near(n.x, n.z, 4, s)) if (Math.abs(n.x - e.x) < e.w + 1 && Math.abs(n.z - e.z) < e.d + 2) {
          let t = n.x - e.x,
            r = n.z - e.z;
          e.w + 1 - Math.abs(t) < e.d + 2 - Math.abs(r) ? (n.x = e.x + Math.sign(t || 1) * (e.w + 1), n.speed *= .5) : (n.z = e.z + Math.sign(r || 1) * (e.d + 2), n.speed *= .5);
          break;
        }
        o && c(n) && (x = !0);
        let O = mT(y, pT(n.x, n.z, n.heading, xT, ST));
        if (o && !i.onFoot && O.overlap && (n.x += O.nx * (O.depth + .03), n.z += O.nz * (O.depth + .03), n.contactCooldown <= 0)) {
          b = !0;
          let e = Math.hypot(i.vx + Math.sin(n.heading) * n.speed, i.vz + Math.cos(n.heading) * n.speed);
          l(Math.min(12, 1.5 + e * .35)) && (i._crash = {
            x: i.x,
            y: i.y || 0,
            z: i.z,
            intensity: Math.min(e * .06, 1.2)
          }), n.contactCooldown = 2, n.speed *= .3;
          let t = Math.min(7, 2 + e * .4);
          i.vx -= O.nx * t, i.vz -= O.nz * t;
        }
      });
      for (let e = 0; e < i.police.length; e++) for (let t = e + 1; t < i.police.length; t++) {
        let n = i.police[e],
          r = i.police[t];
        if (n.onFoot || r.onFoot) continue;
        let a = mT(pT(n.x, n.z, n.heading, xT, ST), pT(r.x, r.z, r.heading, xT, ST));
        if (a.overlap) {
          let e = (a.depth + .02) / 2;
          n.x += a.nx * e, n.z += a.nz * e, r.x -= a.nx * e, r.z -= a.nz * e, n.speed *= .7, r.speed *= .7;
        }
      }
      i.wanted > .15 && !x ? (i.escape += e, i.escape >= 5 && (i.wanted = 0, i.escape = 0)) : i.escape = 0;
      let w = 0;
      if (i.wanted > .15) for (let e of i.police) !e.onFoot && vT(e, i) < 8 && w++;
      return (b || w >= 3) && _ < 5 ? i.arrestTimer = Math.min(i.arrestTimer + e, 5) : S || (i.arrestTimer = Math.max(0, i.arrestTimer - e * 2)), i.arrest = i.arrestTimer / 5 * 100, i.speed = Math.round(_ * 3.6), i.zone = i.z < -160 ? `Montagne Kuro` : i.x > 130 ? `Autoroute A9` : `Centre-ville`, i.y = Uw(i.x, i.z), (i.health <= 0 || i.arrest >= 100) && (i.ended = !0, i.reason = i.health <= 0 ? `Véhicule détruit` : `Vous êtes arrêté`), i;
    }
  };
}
var DT = `/assets/rally-CluzLmHH.wav`,
  OT = `/assets/rally-idle-DrsA-2QN.flac`,
  kT = `/assets/sport-v8-crmbDbLb.flac`,
  AT = `/assets/race-engine-CId9iOvn.flac`;
function jT(e, t, n, r = !1) {
  let i = t.sampleRate,
    a = new Float32Array(t.length);
  for (let e = 0; e < t.numberOfChannels; e++) {
    let n = t.getChannelData(e);
    for (let e = 0; e < a.length; e++) a[e] += n[e] / t.numberOfChannels;
  }
  let o = Math.floor(n[0] * i),
    s = Math.min(a.length, Math.floor(n[1] * i)),
    c = Math.min(Math.floor(i * 1.2), s - o),
    l = Math.floor(i * .18),
    u = o,
    d = -1 / 0;
  for (let e = o; e + c <= s; e += l) {
    let t = Array.from({
        length: 6
      }, (t, n) => {
        let r = 0,
          i = 0;
        for (let t = e + Math.floor(c * n / 6); t < e + c * (n + 1) / 6; t += 8) r += a[t] ** 2, i++;
        return Math.sqrt(r / Math.max(1, i));
      }),
      n = t.reduce((e, t) => e + t, 0) / 6;
    if (n < .003) continue;
    let i = t.reduce((e, t) => e + (t - n) ** 2, 0) / 6 / n ** 2,
      o = (r ? n : Math.sqrt(n)) / (1 + i * 12);
    o > d && (d = o, u = e);
  }
  let f = Math.min(Math.floor(i * .06), Math.floor(c / 5)),
    p = c - f,
    m = e.createBuffer(1, p, i),
    h = m.getChannelData(0),
    g = 0,
    _ = 0;
  for (let e = 0; e < p; e++) {
    let t = e < f ? Math.sin(e / f * Math.PI / 2) ** 2 : 1;
    h[e] = a[u + e] * t + (e < f ? a[u + p + e] * (1 - t) : 0), g += h[e] ** 2, _ = Math.max(_, Math.abs(h[e]));
  }
  let v = Math.min(.38 / Math.max(.001, Math.sqrt(g / p)), 1.3 / Math.max(.001, _));
  for (let e = 0; e < p; e++) h[e] *= v;
  return m;
}
var MT = {
    V6: [[OT, [.2, 4.8]], [OT, [2, 4.5]], [kT, [6, 10]], [kT, [8, 12]], [kT, [10, 14]]],
    V8: [[kT, [.5, 4]], [kT, [3, 7]], [kT, [6, 10]], [kT, [8, 12]], [kT, [10, 14]]],
    V12: [[DT, [0, 5]], [AT, [3, 12]], [AT, [10, 23]], [AT, [18, 30]], [AT, [23, 38]]],
    W16: [[OT, [.2, 4.8]], [kT, [4, 8]], [kT, [8, 12]], [AT, [18, 30]], [AT, [23, 38]]]
  },
  NT = new Map();
async function PT(e, t) {
  if (NT.has(t)) return NT.get(t);
  let n = MT[t] || MT.V6,
    r = new Map(await Promise.all([...new Set(n.map(([e]) => e))].map(async t => {
      let n = await fetch(t);
      if (!n.ok) throw Error(`Impossible de charger le son moteur.`);
      return [t, await e.decodeAudioData(await n.arrayBuffer())];
    }))),
    i = n.map(([t, n], i) => jT(e, r.get(t), n, i >= 3));
  return NT.set(t, i), i;
}
var FT = {
    V6: {
      pitch: [1, 1, 1.08, 1.14, 1.18],
      bass: 2,
      brightness: 2,
      cutoff: 3100
    },
    V8: {
      pitch: [.92, .94, .82, .84, .87],
      bass: 10,
      brightness: -6,
      cutoff: 1400
    },
    V12: {
      pitch: [1, 1, 1.4, 1.55, 1.65],
      bass: 0,
      brightness: 5,
      cutoff: 5400
    },
    W16: {
      pitch: [1, 1, .72, .76, .8],
      bass: 7,
      brightness: 0,
      cutoff: 2600
    }
  },
  IT = [950, 1700, 2800, 4400, 6200];
function LT(e, t, n, r) {
  let i = FT[r] || FT.V6,
    a = e.createBiquadFilter();
  a.type = `lowshelf`, a.frequency.value = 140, a.gain.value = i.bass;
  let o = e.createBiquadFilter();
  o.type = `highshelf`, o.frequency.value = 2200, o.gain.value = i.brightness;
  let s = e.createBiquadFilter();
  s.type = `lowpass`, s.Q.value = .6, a.connect(o), o.connect(s), s.connect(t);
  let c = n.map((t, n) => {
    let r = e.createBufferSource();
    r.buffer = t, r.loop = !0;
    let o = e.createGain();
    return o.gain.value = 0, r.connect(o), o.connect(a), r.start(0, n * .071 % t.duration), {
      source: r,
      gain: o,
      baseRpm: IT[n] || 4e3,
      pitch: i.pitch[n] || 1
    };
  });
  return {
    update(t, n, r = {}) {
      let a = e.currentTime;
      c.length;
      let o = c.map((e, n) => {
          let r = IT[n] || 4e3,
            i = Math.abs(t - r);
          return Math.max(0, 1 - i / (n === 0 ? 1200 : 1100));
        }),
        l = o.reduce((e, t) => e + t, 0) || 1,
        u = .6 + n * .4 + (r.shifting && r.shiftDirection < 0 ? .2 : 0),
        d = r.shifting ? .4 : 1,
        f = t > (r.redline || 8e3) * .985 ? .65 + .35 * Math.max(0, Math.sin(a * 90)) : 1;
      c.forEach((e, n) => {
        e.source.playbackRate.setTargetAtTime(Math.max(.75, Math.min(1.5, t / e.baseRpm * e.pitch)), a, .04), e.gain.gain.setTargetAtTime(o[n] / l * u * d * f * (r.fuel === 0 ? 0 : 1), a, .035);
      }), s.frequency.setTargetAtTime(1e3 + i.cutoff * (.25 + n * .75) + t * .22, a, .045);
    },
    startEngine() {
      const profiles = {
        V8: {
          starter: 48,
          catch: 58,
          cutoff: 780,
          level: .09,
          shape: `sawtooth`
        },
        V6: {
          starter: 55,
          catch: 43,
          cutoff: 1500,
          level: .075,
          shape: `triangle`
        },
        V12: {
          starter: 62,
          catch: 86,
          cutoff: 2600,
          level: .065,
          shape: `sine`
        },
        W16: {
          starter: 58,
          catch: 72,
          cutoff: 2100,
          level: .08,
          shape: `sawtooth`
        }
      };
      const profile = profiles[r] || profiles.V6;
      const now = e.currentTime;
      const crank = e.createOscillator();
      const crankFilter = e.createBiquadFilter();
      const crankGain = e.createGain();
      crank.type = profile.shape;
      crank.frequency.setValueAtTime(profile.starter, now);
      crank.frequency.linearRampToValueAtTime(profile.starter * 1.22, now + .52);
      crankFilter.type = `lowpass`;
      crankFilter.frequency.value = profile.cutoff;
      crankGain.gain.setValueAtTime(.001, now);
      crankGain.gain.linearRampToValueAtTime(profile.level * .72, now + .04);
      crankGain.gain.setValueAtTime(profile.level * .64, now + .48);
      crankGain.gain.exponentialRampToValueAtTime(.001, now + .7);
      crank.connect(crankFilter);
      crankFilter.connect(crankGain);
      crankGain.connect(t);
      crank.onended = () => {
        crank.disconnect();
        crankFilter.disconnect();
        crankGain.disconnect();
      };
      crank.start(now);
      crank.stop(now + .72);
      const catchEngine = e.createOscillator();
      const catchFilter = e.createBiquadFilter();
      const catchGain = e.createGain();
      catchEngine.type = profile.shape;
      catchEngine.frequency.setValueAtTime(profile.catch * .72, now + .48);
      catchEngine.frequency.linearRampToValueAtTime(profile.catch * 1.55, now + .72);
      catchEngine.frequency.exponentialRampToValueAtTime(profile.catch, now + 1.08);
      catchFilter.type = `lowpass`;
      catchFilter.frequency.setValueAtTime(profile.cutoff * .72, now + .48);
      catchFilter.frequency.linearRampToValueAtTime(profile.cutoff * 1.8, now + .78);
      catchFilter.frequency.exponentialRampToValueAtTime(profile.cutoff, now + 1.08);
      catchGain.gain.setValueAtTime(.001, now + .48);
      catchGain.gain.linearRampToValueAtTime(profile.level * 1.25, now + .66);
      catchGain.gain.setValueAtTime(profile.level * .8, now + .82);
      catchGain.gain.exponentialRampToValueAtTime(.001, now + 1.16);
      catchEngine.connect(catchFilter);
      catchFilter.connect(catchGain);
      catchGain.connect(t);
      catchEngine.onended = () => {
        catchEngine.disconnect();
        catchFilter.disconnect();
        catchGain.disconnect();
      };
      catchEngine.start(now + .48);
      catchEngine.stop(now + 1.18);
    },
    close() {
      c.forEach(({
        source: e
      }) => e.stop()), a.disconnect(), o.disconnect(), s.disconnect();
    }
  };
}
var RT = `/* global AudioWorkletProcessor, registerProcessor, sampleRate */
// Moteur audio tournant sur le thread audio (AudioWorklet).
//
// Le principe : chaque allumage de cylindre injecte une impulsion de pression à l'angle de vilebrequin exact,
// donc la note est verrouillée sur le régime, échantillon par échantillon. Les impulsions de chaque banc
// d'échappement traversent les résonances de SON tuyau : la série de modes du tuyau (une longueur différente
// par banc, d'où le battement entre les deux lignes), décalée vers le haut à mesure que les gaz chauds font
// monter la vitesse du son — la température des gaz suit la charge.
//
// Autour de ce cœur : le grondement de combustion, la respiration de l'admission, le bruit mécanique, les
// pétarades de décélération, puis le turbocompresseur (montée en pression, sifflement, décharge au lever de
// pied avec son flutter). L'échappement est saturé puis filtré en fonction de la charge, l'air passe à côté,
// et une table de loudness mesurée sur toute la plage de régime garantit un volume constant à chaque régime.

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const smooth = (lo, hi, v) => { const x = clamp((v - lo) / (hi - lo), 0, 1); return x * x * (3 - 2 * x); };
// y += (target - y) * pole(sr, s)  ->  constante de temps s
const pole = (sr, seconds) => 1 - Math.exp(-1 / (sr * seconds));
// y = y * decay(sr, s) + x * (1 - decay)  ->  même chose, écrit pour un filtre
const decay = (sr, seconds) => Math.exp(-1 / (sr * seconds));
const lowpass = (sr, hz) => 1 - Math.exp(-TAU * hz / sr);

const PROFILES = {
  // V8 à vilebrequin croisé (ordre d'allumage alterné entre les deux bancs) : c'est ce croisement qui
  // donne le grondement irrégulier. Tuyaux longs, gros volume : tout est calé bas pour un son profond,
  // et le niveau est poussé pour qu'il domine le mix.
  // V8 « gros cube agressif » : grondement grave, quasiment plus d'aigus, saturation poussée
  // et pétarades explosives à la levée de pied. Sifflement de turbo retiré, tuyaux longs et
  // volumineux, plafond de brillance abaissé pour un son plus sombre et plus lourd.
  V8: {
    cyl: 8, banks: [0, 1, 1, 0, 1, 0, 0, 1], gains: [1, .9, 1.06, .94, 1.04, .92, 1.05, .93], bankGain: .8,
    idle: 680, redline: 6000,
    pipe: [[26, 1.5, .96], [41, 1.7, 1], [63, 1.9, 1], [94, 2.2, .97], [137, 2.5, .93], [194, 2.9, .88], [270, 3.3, .79], [369, 3.7, .68], [495, 4.1, .46], [657, 4.6, .3], [882, 5, .14], [1305, 4.4, .05], [1980, 3.2, .02]],
    bankShift: [1, 1.06], tempShift: [1, 1.13],
    pulse: .78, jitter: .22, crack: .8, roar: 1, mech: .035, intake: .17, air: .92,
    drive: 1.98, level: 1.42, bright: [300, 740],
    turbo: { blades: 30, spoolUp: .14, spoolDown: .42, whistle: 0, hiss: .025, threshold: 1200, bov: 1.2 },
    overrun: { rate: 52, amp: 1.5 }
  },
  // Six cylindres en ligne biturbo dans l'esprit d'une BMW M : plus lisse, plus clair, métallique, une
  // admission plus mordante et une décélération plus discrète.
  V6: {
    cyl: 6, banks: [0, 1, 0, 1, 0, 1], gains: [1, .97, 1.03, .98, 1.02, .99], bankGain: .9,
    idle: 800, redline: 7200,
    pipe: [[54, 1.6, .55], [86, 1.8, .75], [126, 2, .88], [178, 2.3, .95], [244, 2.6, .96], [328, 3, .92], [432, 3.4, .84], [560, 3.8, .74], [720, 4.2, .64], [940, 4.6, .52], [1240, 5, .4], [1650, 5.1, .28], [2250, 4.6, .18], [3100, 3.8, .08]],
    bankShift: [1, 1.03], tempShift: [1, 1.12],
    pulse: .4, jitter: .12, crack: .38, roar: .44, mech: .1, intake: .3, air: 1,
    drive: 1.14, level: 1, bright: [980, 3100],
    turbo: { blades: 34, spoolUp: .14, spoolDown: .4, whistle: .055, hiss: .045, threshold: 1400, bov: .8 },
    overrun: { rate: 20, amp: .7 }
  },
  V12: {
    cyl: 12, banks: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], gains: [1, .98, 1.02, .99, 1.01, .98, 1.02, .99, 1, .98, 1.01, .99], bankGain: .95,
    idle: 1000, redline: 9000,
    pipe: [[96, 1.8, .6], [150, 2.2, .8], [224, 2.8, .95], [330, 3.4, .9], [470, 3.8, .85], [660, 4.2, .75], [900, 4.6, .62], [1220, 4.8, .5], [1650, 5, .38], [2200, 5, .28], [3000, 4.6, .18], [4200, 3.8, .1], [6000, 3, .05]],
    bankShift: [1, 1.02], tempShift: [1, 1.08],
    pulse: .3, jitter: .06, crack: .3, roar: .37, mech: .12, intake: .22, air: 1,
    drive: 1.12, level: 1, bright: [1350, 4300],
    turbo: { blades: 30, spoolUp: .3, spoolDown: .5, whistle: 0, hiss: 0, threshold: 2500, bov: 0 },
    overrun: { rate: 7, amp: .3 }
  },
  W16: {
    cyl: 16, banks: [0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1], gains: [1, .92, 1.05, .96, 1.07, .9, 1.02, .95, 1, .93, 1.04, .97, 1.06, .91, 1.01, .96], bankGain: .85,
    idle: 900, redline: 6800,
    pipe: [[38, 1.5, .85], [60, 1.7, 1], [92, 1.9, 1], [136, 2.2, .95], [198, 2.5, .9], [282, 2.9, .82], [392, 3.3, .72], [540, 3.7, .6], [730, 4.1, .5], [980, 4.6, .38], [1320, 5, .26], [2000, 4.6, .16], [3100, 3.6, .07]],
    bankShift: [1, 1.045], tempShift: [1, 1.18],
    pulse: .7, jitter: .13, crack: .55, roar: .6, mech: .08, intake: .18, air: 1,
    drive: 1.45, level: 1, bright: [640, 2300],
    turbo: { blades: 26, spoolUp: .2, spoolDown: .5, whistle: .07, hiss: .075, threshold: 1300, bov: 1 },
    overrun: { rate: 38, amp: 1.1 }
  }
};

class EngineSynth extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const p = PROFILES[options?.processorOptions?.id] || PROFILES.V8;
    this.p = p; this.sr = sampleRate;
    // Entrées lissées : le moteur démarre au ralenti, pied levé.
    this.tRpm = this.rpm = p.idle;
    this.tLoad = this.load = 0;
    this.tCut = this.cut = 1;
    this.tRun = this.run = 1;
    // Vilebrequin
    this.pos = 0; this.idx = 0; this.pend0 = 0; this.pend1 = 0; this.p0 = 0; this.p1 = 0;
    // Couches
    this.crack = 0; this.boost = 0; this.bov = 0; this.bovF = 0; this.prevLoad = 0;
    this.bang = 0; this.bangLow = 0;
    this.phase = 0; this.bovPhase = 0;
    // Tuyaux
    const K = this.K = p.pipe.length;
    this.b = [new Float64Array(K), new Float64Array(K)];
    this.c1 = [new Float64Array(K), new Float64Array(K)];
    this.c2 = [new Float64Array(K), new Float64Array(K)];
    this.g = new Float64Array(K);
    p.pipe.forEach((mode, k) => { this.g[k] = mode[2]; });
    this.st = this.makeState();
    this.kPulse = decay(this.sr, p.pulse * .001);
    this.updatePipes();
    this.calibrate();
    this.n1 = this.n3 = this.k1 = this.k3 = this.h1 = this.h3 = 0;
    this.lp1 = this.lp2 = this.air1 = this.air2 = 0;
    this.dead = false;
    this.port.onmessage = ({ data }) => {
      if (!data) return;
      if (data.stop) { this.dead = true; return; }
      if (Number.isFinite(data.rpm)) this.tRpm = clamp(data.rpm, 0, 12000);
      if (Number.isFinite(data.load)) this.tLoad = clamp(data.load, 0, 1);
      if (Number.isFinite(data.cut)) this.tCut = clamp(data.cut, 0, 1);
      if (Number.isFinite(data.run)) this.tRun = clamp(data.run, 0, 1);
      if (Number.isFinite(data.bang)) this.bang = clamp(data.bang, 0, 2.5);
    };
  }

  makeState() { return { y1: [new Float64Array(this.K), new Float64Array(this.K)], y2: [new Float64Array(this.K), new Float64Array(this.K)] }; }

  // Les modes du tuyau glissent avec la température des gaz (plus de charge = gaz plus chauds = son plus
  // rapide = résonances plus hautes). Recalculé une fois par bloc, les changements sont lents.
  updatePipes() {
    const p = this.p, sr = this.sr;
    const heat = clamp(.1 + .9 * this.load * (.4 + .6 * clamp(this.rpm / p.redline, 0, 1)), 0, 1);
    const heatShift = p.tempShift[0] + (p.tempShift[1] - p.tempShift[0]) * heat;
    for (let bank = 0; bank < 2; bank++) {
      const scale = p.bankShift[bank] * heatShift;
      for (let k = 0; k < this.K; k++) {
        const freq = Math.min(p.pipe[k][0] * scale, sr * .45), q = p.pipe[k][1], th = TAU * freq / sr;
        const r = Math.exp(-Math.PI * freq / q / sr);
        const c1 = 2 * r * Math.cos(th), c2 = -r * r;
        this.c1[bank][k] = c1; this.c2[bank][k] = c2;
        this.b[bank][k] = Math.hypot(1 - c1 * Math.cos(th) - c2 * Math.cos(2 * th), c1 * Math.sin(th) + c2 * Math.sin(2 * th));
      }
    }
  }

  // Un échantillon des deux bancs, e0/e1 = énergie injectée dans le tuyau à cet échantillon.
  banks(st, e0, e1) {
    let s0 = 0, s1 = 0;
    const K = this.K, g = this.g, c1 = this.c1, c2 = this.c2;
    for (let k = 0; k < K; k++) {
      const a0 = this.b[0][k] * e0 + c1[0][k] * st.y1[0][k] + c2[0][k] * st.y2[0][k];
      st.y2[0][k] = st.y1[0][k]; st.y1[0][k] = a0; s0 += g[k] * a0;
      const a1 = this.b[1][k] * e1 + c1[1][k] * st.y1[1][k] + c2[1][k] * st.y2[1][k];
      st.y2[1][k] = st.y1[1][k]; st.y1[1][k] = a1; s1 += g[k] * a1;
    }
    return s0 + s1;
  }

  // Mesure le niveau sorti par les tuyaux à plusieurs régimes, pour que chaque régime sonne aussi fort
  // avant la saturation. (Une seule fois, au démarrage.)
  calibrate() {
    const p = this.p, sr = this.sr, N = p.cyl, kP = this.kPulse, pts = [];
    for (let j = 0; j <= 11; j++) {
      const rpm = p.idle * .7 + (p.redline * 1.15 - p.idle * .7) * j / 11, dpos = rpm * N / 120 / sr;
      const cycle = Math.ceil(sr * 120 / rpm), warm = Math.floor(sr * .12);
      const total = warm + Math.max(Math.floor(sr * .1), cycle * 3);
      const st = this.makeState();
      let pos = 0, idx = 0, pend0 = 0, pend1 = 0, sh0 = 0, sh1 = 0, sum = 0, count = 0;
      for (let i = 0; i < total; i++) {
        pos += dpos;
        let e0 = pend0, e1 = pend1; pend0 = 0; pend1 = 0;
        if (pos >= 1 && dpos > 0) {
          pos -= 1;
          const over = Math.min(1, pos / dpos), a = p.gains[idx] * (p.banks[idx] ? p.bankGain : 1);
          if (p.banks[idx]) { e1 += a * over; pend1 += a * (1 - over); } else { e0 += a * over; pend0 += a * (1 - over); }
          idx = (idx + 1) % N;
        }
        sh0 = sh0 * kP + e0 * (1 - kP); sh1 = sh1 * kP + e1 * (1 - kP);
        const y = this.banks(st, sh0, sh1);
        if (i >= warm) { sum += y * y; count++; }
      }
      pts.push([rpm, Math.sqrt(sum / count) || 1e-9]);
    }
    this.table = pts;
  }

  compAt(rpm) {
    const t = this.table;
    if (rpm <= t[0][0]) return 1 / t[0][1];
    for (let j = 1; j < t.length; j++) {
      if (rpm <= t[j][0]) { const f = (rpm - t[j - 1][0]) / (t[j][0] - t[j - 1][0]); return 1 / (t[j - 1][1] + (t[j][1] - t[j - 1][1]) * f); }
    }
    return 1 / t[t.length - 1][1];
  }

  reset() {
    for (let bank = 0; bank < 2; bank++) { this.st.y1[bank].fill(0); this.st.y2[bank].fill(0); }
    this.crack = this.bov = this.bovF = this.boost = 0; this.bang = this.bangLow = 0; this.lp1 = this.lp2 = this.air1 = this.air2 = 0;
    this.n1 = this.n3 = this.k1 = this.k3 = this.h1 = this.h3 = 0;
    this.pend0 = this.pend1 = this.p0 = this.p1 = 0;
  }

  process(inputs, outputs) {
    if (this.dead) return false;
    const out = outputs[0] && outputs[0][0];
    if (!out) return true;
    const p = this.p, sr = this.sr, n = out.length, N = p.cyl, turb = p.turbo, overrun = p.overrun;
    this.updatePipes();
    const comp = this.compAt(this.rpm);
    const frac0 = clamp(this.rpm / p.redline, 0, 1.3);
    const bright = clamp(.08 + .34 * frac0 + .58 * this.load, 0, 1);
    const aLP = lowpass(sr, p.bright[0] + (p.bright[1] - p.bright[0]) * bright);
    const aAir = lowpass(sr, 4200);
    const envRpm = p.level * (.7 + .3 * Math.pow(frac0, .8)) * .46;
    const cR = pole(sr, .014), cL = pole(sr, .07), cC = pole(sr, .012), cRun = pole(sr, .09);
    const cUp = pole(sr, turb.spoolUp), cDown = pole(sr, turb.spoolDown);
    const crackDecay = decay(sr, .004), bDecay = decay(sr, .09), bFDecay = decay(sr, .32), bangDecay = decay(sr, .085);
    const aN1 = lowpass(sr, 2600), aN3 = lowpass(sr, 320);
    const aK1 = lowpass(sr, 3800), aK3 = lowpass(sr, 700);
    const aH1 = lowpass(sr, 7000), aH3 = lowpass(sr, 1100);
    const kP = this.kPulse, spinning = turb.whistle > 0 || turb.hiss > 0;
    const redline = p.redline, idle = p.idle;
    for (let i = 0; i < n; i++) {
      this.rpm += (this.tRpm - this.rpm) * cR;
      this.load += (this.tLoad - this.load) * cL;
      this.cut += (this.tCut - this.cut) * cC;
      this.run += (this.tRun - this.run) * cRun;
      const rpm = this.rpm, load = this.load, frac = clamp(rpm / redline, 0, 1.3);
      const live = this.cut * this.run;
      const limiter = rpm > redline * .985 ? .72 + .28 * Math.max(0, Math.sin(i * .12)) : 1;

      // --- angle de vilebrequin : une impulsion par allumage
      const dpos = rpm * N / 120 / sr;
      this.pos += dpos;
      let e0 = this.pend0, e1 = this.pend1;
      this.pend0 = 0; this.pend1 = 0;
      if (this.pos >= 1 && dpos > 0) {
        this.pos -= 1;
        const over = Math.min(1, this.pos / dpos), cyl = this.idx;
        this.idx = (this.idx + 1) % N;
        const amp = p.gains[cyl] * (p.banks[cyl] ? p.bankGain : 1) * (1 + (Math.random() * 2 - 1) * p.jitter * (1 - .5 * frac)) * (.55 + .45 * load) * live * limiter;
        if (p.banks[cyl]) { e1 += amp * over; this.pend1 += amp * (1 - over); }
        else { e0 += amp * over; this.pend0 += amp * (1 - over); }
        this.crack += amp * p.crack * (.25 + .75 * load);
      }
      // Forme de l'impulsion : plus le tuyau est large, moins il passe d'aigus.
      this.p0 = this.p0 * kP + e0 * (1 - kP);
      this.p1 = this.p1 * kP + e1 * (1 - kP);

      // --- décélération : l'essence imbrûlée s'allume dans l'échappement
      let pop = 0;
      if (rpm > 1800 && this.run > .5 && (load < .22 || this.cut < .55) && Math.random() < overrun.rate * frac / sr) {
        pop = overrun.amp * (Math.random() < .04 ? 2.2 : 1) * (.45 + .85 * Math.random()) * (.35 + .65 * (1 - load));
        this.crack += pop * .5;
      }
      const popA = pop > 0 && Math.random() < .5 ? pop : 0, popB = pop - popA;

      // --- turbocompresseur
      const want = spinning ? load * this.cut * smooth(turb.threshold, turb.threshold + 2600, rpm) : 0;
      this.boost += (want - this.boost) * (want > this.boost ? cUp : cDown);
      if (this.prevLoad > .45 && load < .2 && this.boost > .22) { this.bov = this.boost * turb.bov; this.bovF = this.boost; }
      this.prevLoad = load;
      this.bov *= bDecay; this.bovF *= bFDecay;
      const boost = this.boost;
      this.phase += TAU * (rpm * turb.blades / 60) / sr;
      if (this.phase > TAU) this.phase -= TAU;
      this.bovPhase += TAU * 32 / sr;
      if (this.bovPhase > TAU) this.bovPhase -= TAU;
      const flutter = 1 - .8 * this.bovF * (.5 + .5 * Math.sin(this.bovPhase));

      // --- explosion à l'échappement au passage de rapport : un coup court et grave dans le collecteur,
      // qui traverse les mêmes résonances que les impulsions d'allumage.
      const bang = this.bang;
      this.bang *= bangDecay;
      this.bangLow = this.bangLow * .8 + (Math.random() * 2 - 1) * .2;
      const bangSig = bang * (this.bangLow * 2.6 + (Math.random() * 2 - 1) * .85);

      // --- bruits
      const noise = Math.random() * 2 - 1;
      this.n1 += aN1 * (noise - this.n1); this.n3 += aN3 * (this.n1 - this.n3);
      this.k1 += aK1 * (noise - this.k1); this.k3 += aK3 * (this.k1 - this.k3);
      this.h1 += aH1 * (noise - this.h1); this.h3 += aH3 * (this.h1 - this.h3);
      const low = this.n1 - this.n3, mid = this.k1 - this.k3, high = this.h1 - this.h3;
      this.crack *= crackDecay;

      // --- échappement : tuyaux + combustion + pétarades, saturés puis filtrés selon la charge
      let ex = this.banks(this.st, this.p0 + popA + bangSig * .55, this.p1 + popB + bangSig * .45) * comp;
      ex += bangSig * .7;
      ex += mid * this.crack * 1.5;
      ex += low * p.roar * (.05 + .22 * frac) * (.3 + .7 * load) * this.run * 2.2;
      const exhaust = Math.tanh(ex * p.drive * (.8 + .4 * load));
      this.lp1 += aLP * (exhaust - this.lp1);
      this.lp2 += aLP * (this.lp1 - this.lp2);

      // --- air : admission, mécanique, turbo (hors saturation échappement)
      const air = mid * p.intake * load * this.run * .9
        + high * (p.mech * (.02 + .22 * frac * frac) * this.run * 2
          + turb.hiss * boost * (.3 + .7 * frac) * this.run * 1.4
          + this.bov * 1.6 * flutter)
        + turb.whistle * boost * Math.sqrt(boost) * (.25 + .75 * frac) * this.run * (Math.sin(this.phase) + .28 * Math.sin(this.phase * 2.01));

      this.air1 += aAir * (air - this.air1);
      this.air2 += aAir * (this.air1 - this.air2);
      out[i] = (this.lp2 + this.air2 * p.air) * envRpm * (.75 + .25 * load);
    }
    if (!Number.isFinite(this.lp2) || !Number.isFinite(this.st.y1[0][0]) || !Number.isFinite(this.st.y1[1][0])) {
      this.rpm = this.tRpm >= idle ? this.tRpm : idle;
      this.reset();
      out.fill(0);
    }
    return true;
  }
}

registerProcessor('engine-synth', EngineSynth);`;
function zT(e) {
  let t = Math.floor(e.sampleRate * .22),
    n = e.createBuffer(1, t, e.sampleRate),
    r = n.getChannelData(0),
    i = 0;
  for (let n = 0; n < t; n++) i += .35 * (Math.random() * 2 - 1 - i), r[n] = i * Math.exp(-n / (e.sampleRate * .055));
  return n;
}
async function BT(e, t, n) {
  if (!e.audioWorklet || typeof AudioWorkletNode > `u`) throw Error(`AudioWorklet indisponible`);
  let r = URL.createObjectURL(new Blob([RT], {
    type: `text/javascript`
  }));
  try {
    await e.audioWorklet.addModule(r);
  } finally {
    URL.revokeObjectURL(r);
  }
  let i = new AudioWorkletNode(e, `engine-synth`, {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [1],
    processorOptions: {
      id: n
    }
  });
  i.onprocessorerror = () => console.error(`Moteur audio : erreur du processeur`);
  let a = e.createGain(),
    o = e.createGain(),
    s = e.createConvolver();
  return s.buffer = zT(e), o.gain.value = .14, i.connect(a), a.connect(t), i.connect(s), s.connect(o), o.connect(t), {
    update(e, t, n = {}) {
      i.port.postMessage({
        rpm: e,
        load: t,
        cut: n.shifting ? .4 : 1,
        run: n.fuel === 0 || n.onFoot ? 0 : 1
      });
    },
    bang(e = 1) {
      i.port.postMessage({
        bang: e
      });
    },
    close() {
      i.port.postMessage({
        stop: !0
      }), [i, a, o, s].forEach(e => e.disconnect());
    }
  };
}
function VT(e, t, n) {
  let r = e.createBuffer(1, e.sampleRate, e.sampleRate),
    i = r.getChannelData(0),
    a = 0;
  for (let e = 0; e < i.length; e++) a = .97 * a + .03 * (Math.random() * 2 - 1), i[e] = a * 4;
  let o = e.createBufferSource();
  o.buffer = r, o.loop = !0;
  let s = e.createBiquadFilter();
  s.type = `bandpass`, s.frequency.value = 1900, s.Q.value = 5;
  let c = e.createGain();
  c.gain.value = 0;
  let l = e.createBiquadFilter();
  l.type = `bandpass`, l.Q.value = n === `V8` ? 12 : 2;
  let u = e.createGain();
  u.gain.value = 0, o.connect(s), s.connect(c), c.connect(t), o.connect(l), l.connect(u), u.connect(t), o.start();
  let d = new Set(),
    f = 0,
    p = 0,
    m = !1;
  function h(n, i, a, o = `lowpass`, delay = 0) {
    let s = e.createBufferSource();
    s.buffer = r;
    let c = e.createBiquadFilter();
    c.type = o, c.frequency.value = a, c.Q.value = .8;
    let l = e.createGain(),
      u = e.currentTime + delay;
    l.gain.setValueAtTime(i, u), l.gain.exponentialRampToValueAtTime(.001, u + n), s.connect(c), c.connect(l), l.connect(t), s.onended = () => {
      s.disconnect(), c.disconnect(), l.disconnect(), d.delete(s);
    }, d.add(s), s.start(u, Math.random() * .1), s.stop(u + n);
  }
  return {
    update(t, r, i, a = {}, o = !1) {
      let s = e.currentTime,
        d = n === `V6` || n === `W16`,
        g = d ? r * Math.max(0, Math.min(1, (t - 1700) / 3800)) : 0;
      p += (g - p) * .08, !o && d && !m && f > .6 && r < .2 && p > .14 && h(.22, .13 * p, 2400, `highpass`), f = r, c.gain.setTargetAtTime(i ? .15 : 0, s, .04), l.frequency.setTargetAtTime((n === `V8` ? 850 : 1800) + t * .36, s, .07), u.gain.setTargetAtTime((m ? 0 : n === `V8` ? r * .032 : p * .065) * (a.fuel === 0 || a.onFoot ? 0 : 1), s, .06);
    },
    startEngine() {
      const profiles = {
        V8: {
          starter: 48,
          catch: 58,
          cutoff: 780,
          level: .09,
          shape: `sawtooth`
        },
        V6: {
          starter: 55,
          catch: 43,
          cutoff: 1500,
          level: .075,
          shape: `triangle`
        },
        V12: {
          starter: 62,
          catch: 86,
          cutoff: 2600,
          level: .065,
          shape: `sine`
        },
        W16: {
          starter: 58,
          catch: 72,
          cutoff: 2100,
          level: .08,
          shape: `sawtooth`
        }
      };
      const profile = profiles[n] || profiles.V6;
      const now = e.currentTime;
      const starter = e.createOscillator();
      const starterFilter = e.createBiquadFilter();
      const starterGain = e.createGain();
      starter.type = profile.shape;
      starter.frequency.setValueAtTime(profile.starter, now);
      starter.frequency.linearRampToValueAtTime(profile.starter * 1.22, now + .52);
      starterFilter.type = `lowpass`;
      starterFilter.frequency.value = profile.cutoff;
      starterGain.gain.setValueAtTime(.001, now);
      starterGain.gain.linearRampToValueAtTime(profile.level * .72, now + .04);
      starterGain.gain.setValueAtTime(profile.level * .64, now + .48);
      starterGain.gain.exponentialRampToValueAtTime(.001, now + .7);
      starter.connect(starterFilter);
      starterFilter.connect(starterGain);
      starterGain.connect(t);
      starter.onended = () => {
        starter.disconnect();
        starterFilter.disconnect();
        starterGain.disconnect();
      };
      starter.start(now);
      starter.stop(now + .72);
      const crankingNoise = e.createBufferSource();
      const crankFilter = e.createBiquadFilter();
      const crankGain = e.createGain();
      crankingNoise.buffer = r;
      crankFilter.type = `bandpass`;
      crankFilter.frequency.value = profile.cutoff * 1.35;
      crankFilter.Q.value = 1.2;
      crankGain.gain.setValueAtTime(.001, now);
      crankGain.gain.linearRampToValueAtTime(profile.level * .5, now + .035);
      crankGain.gain.setValueAtTime(profile.level * .42, now + .47);
      crankGain.gain.exponentialRampToValueAtTime(.001, now + .66);
      crankingNoise.connect(crankFilter);
      crankFilter.connect(crankGain);
      crankGain.connect(t);
      crankingNoise.onended = () => {
        crankingNoise.disconnect();
        crankFilter.disconnect();
        crankGain.disconnect();
      };
      crankingNoise.start(now, Math.random() * .1);
      crankingNoise.stop(now + .68);
      for (let turn = 0; turn < 3; turn++) h(.15, profile.level * (.48 - turn * .07), profile.cutoff * (.42 + turn * .12), `lowpass`, turn * .16);
      const ignition = e.createOscillator();
      const ignitionFilter = e.createBiquadFilter();
      const ignitionGain = e.createGain();
      ignition.type = profile.shape;
      ignition.frequency.setValueAtTime(profile.catch * .72, now + .48);
      ignition.frequency.linearRampToValueAtTime(profile.catch * 1.55, now + .72);
      ignition.frequency.exponentialRampToValueAtTime(profile.catch, now + 1.08);
      ignitionFilter.type = `lowpass`;
      ignitionFilter.frequency.setValueAtTime(profile.cutoff * .72, now + .48);
      ignitionFilter.frequency.linearRampToValueAtTime(profile.cutoff * 1.8, now + .78);
      ignitionFilter.frequency.exponentialRampToValueAtTime(profile.cutoff, now + 1.08);
      ignitionGain.gain.setValueAtTime(.001, now + .48);
      ignitionGain.gain.linearRampToValueAtTime(profile.level * 1.25, now + .66);
      ignitionGain.gain.setValueAtTime(profile.level * .8, now + .82);
      ignitionGain.gain.exponentialRampToValueAtTime(.001, now + 1.16);
      ignition.connect(ignitionFilter);
      ignitionFilter.connect(ignitionGain);
      ignitionGain.connect(t);
      ignition.onended = () => {
        ignition.disconnect();
        ignitionFilter.disconnect();
        ignitionGain.disconnect();
      };
      ignition.start(now + .48);
      ignition.stop(now + 1.18);
    },
    setSynthEngine() {
      m = !0;
    },
    shift(e) {
      h(e ? .065 : .045, e ? .13 : .055, e ? 420 : 1100);
    },
    crash(e = 1) {
      h(.45, Math.min(.65 * e, .8), 650), h(.25, .55 * e, 130);
    },
    close() {
      o.stop(), d.forEach(e => e.stop()), c.disconnect(), u.disconnect();
    }
  };
}
function HT(e) {
  let t = window.AudioContext || window.webkitAudioContext;
  if (!t) return {
    ready: Promise.resolve(),
    update() {},
    crash() {},
    startEngine() {},
    resume() {},
    close() {}
  };
  let n = new t({
      latencyHint: `interactive`
    }),
    r = n.createGain();
  r.gain.value = 0;
  let i = n.createDynamicsCompressor();
  i.threshold.value = -14, i.knee.value = 12, i.ratio.value = 3, i.attack.value = .008, i.release.value = .16;
  let a = n.createBiquadFilter();
  a.type = `highpass`, a.frequency.value = 28, r.connect(a), a.connect(i), i.connect(n.destination);
  let o = VT(n, r, e.id),
    s = null,
    c = !1,
    l = 0,
    u = !0;
  return {
    ready: BT(n, r, e.id).then(e => {
      c ? e.close() : (s = e, o.setSynthEngine());
    }).catch(async () => LT(n, r, await PT(n, e.id), e.id)),
    resume() {
      if (!c && n.state === `suspended`) return n.resume();
    },
    update(e, t, i, a, d = {}) {
      c || (u = i, n.state === `suspended` && n.resume(), r.gain.setTargetAtTime(i || !s ? 0 : 1, n.currentTime, .035), s && (s.update(e, t, d), o.update(e, t, a, d, i), d.shiftSerial > l && (!i && e > 2300 && (o.shift(d.shiftDirection > 0), s.bang?.((d.shiftDirection > 0 ? 1 : .8) * Math.min(1.6, .6 + e / (d.redline || 7e3)))), l = d.shiftSerial)));
    },
    startEngine() {
      !c && !u && n.state === `running` && o.startEngine();
    },
    crash(e = 1) {
      !c && !u && o.crash(e);
    },
    close() {
      c || (c = !0, s?.close(), o.close(), r.disconnect(), a.disconnect(), i.disconnect(), n.state !== `closed` && n.close());
    }
  };
}
function UT(e) {
  const treadCanvas = document.createElement(`canvas`);
  treadCanvas.width = 64;
  treadCanvas.height = 128;
  const treadContext = treadCanvas.getContext(`2d`);
  treadContext.fillStyle = `rgba(17,19,21,0.42)`;
  treadContext.fillRect(0, 0, 64, 128);
  for (let row = 0; row < 4; row++) {
    const y = row * 32;
    treadContext.clearRect(8, y + 3, 3, 11);
    treadContext.clearRect(18, y + 3, 3, 11);
    treadContext.clearRect(43, y + 18, 3, 11);
    treadContext.clearRect(53, y + 18, 3, 11);
    treadContext.fillStyle = `rgba(4,5,6,0.24)`;
    treadContext.fillRect(27, y + 14, 10, 2);
  }
  const treadTexture = new CanvasTexture(treadCanvas);
  treadTexture.wrapS = treadTexture.wrapT = RepeatWrapping;
  treadTexture.colorSpace = `srgb`;
  const smokeCanvas = document.createElement(`canvas`);
  smokeCanvas.width = smokeCanvas.height = 128;
  const smokeContext = smokeCanvas.getContext(`2d`);
  const smokeGradient = smokeContext.createRadialGradient(64, 64, 7, 64, 64, 62);
  smokeGradient.addColorStop(0, `rgba(235,239,242,0.24)`);
  smokeGradient.addColorStop(.34, `rgba(220,226,231,0.17)`);
  smokeGradient.addColorStop(.72, `rgba(202,210,217,0.07)`);
  smokeGradient.addColorStop(1, `rgba(190,200,208,0)`);
  smokeContext.fillStyle = smokeGradient;
  smokeContext.fillRect(0, 0, 128, 128);
  const smokeTexture = new CanvasTexture(smokeCanvas);
  smokeTexture.colorSpace = `srgb`;
  const smokeGeometry = new PlaneGeometry(1, 1);
  let t = Array.from({
      length: 48
    }, () => {
      let t = new Mesh(smokeGeometry, new MeshBasicMaterial({
        map: smokeTexture,
        color: `#c6cbd0`,
        transparent: !0,
        opacity: 0,
        depthWrite: !1,
        side: 2
      }));
      return t.visible = !1, e.add(t), {
        mesh: t,
        life: 0,
        maxLife: 1,
        vx: 0,
        vy: 0,
        vz: 0
      };
    }),
    n = Array.from({
      length: 20
    }, () => {
      let t = new Mesh(new SphereGeometry(.8, 6, 5), new MeshBasicMaterial({
        color: `#3a3d42`,
        transparent: !0,
        opacity: 0,
        depthWrite: !1
      }));
      return t.visible = !1, e.add(t), {
        mesh: t,
        life: 0,
        vy: 0
      };
    }),
    r = Array.from({
      length: 16
    }, () => {
      let t = new Mesh(new BoxGeometry(.15, .15, .15), new MeshStandardMaterial({
        color: `#444`,
        roughness: .8
      }));
      return t.visible = !1, e.add(t), {
        mesh: t,
        life: 0,
        vx: 0,
        vy: 0,
        vz: 0
      };
    }),
    skidMaterial = new MeshBasicMaterial({
      color: `#0d0f11`,
      map: treadTexture,
      transparent: !0,
      opacity: .76,
      depthWrite: !1,
      side: 2
    }),
    i = Array.from({
      length: 32
    }, () => {
      const wheels = Array.from({
        length: 2
      }, () => {
        const geometry = new BufferGeometry();
        const capacity = 32;
        const positions = new Float32Array(capacity * 12);
        const normals = new Float32Array(capacity * 12);
        const uvs = new Float32Array(capacity * 8);
        const indices = [];
        for (let k = 0; k < capacity; k++) {
          const base = k * 4;
          indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
        }
        geometry.setAttribute(`position`, new Float32BufferAttribute(positions, 3));
        geometry.setAttribute(`normal`, new Float32BufferAttribute(normals, 3));
        geometry.setAttribute(`uv`, new Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.setDrawRange(0, 0);
        const mesh = new Mesh(geometry, skidMaterial);
        mesh.visible = !1;
        mesh.frustumCulled = !1;
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
          last: null
        };
      });
      return {
        wheels,
        remaining: 0
      };
    }),
    a = Array.from({
      length: 10
    }, () => {
      let t = new Mesh(new SphereGeometry(.3, 6, 5), new MeshBasicMaterial({
        color: `#2b2e32`,
        transparent: !0,
        opacity: 0,
        depthWrite: !1
      }));
      return t.visible = !1, e.add(t), {
        mesh: t,
        life: 0
      };
    }),
    o = 0,
    s = 0,
    trailCursor = 0,
    activeTrail = null,
    wasDrifting = !1,
    l = 0,
    u = 0,
    d = 0,
    f = 0;
  return {
    update(e, l, camera) {
      if (o += l, t.forEach(particle => {
        let mesh = particle.mesh;
        mesh.visible = particle.life > 0, particle.life > 0 && (particle.life -= l, mesh.position.x += particle.vx * l, mesh.position.y += particle.vy * l, mesh.position.z += particle.vz * l, mesh.scale.addScalar(l * .72), camera && mesh.lookAt(camera.position), mesh.material.opacity = Math.max(0, particle.life / particle.maxLife) * .46);
      }), n.forEach(e => {
        e.mesh.visible = e.life > 0, e.life > 0 && (e.life -= l, e.mesh.position.y += l * .7, e.mesh.scale.addScalar(l * .8), e.mesh.material.opacity = Math.max(0, e.life) * .22);
      }), r.forEach(e => {
        e.life > 0 && (e.life -= l, e.mesh.position.x += e.vx * l, e.mesh.position.y += e.vy * l, e.mesh.position.z += e.vz * l, e.vy -= l * 9, e.mesh.rotation.x += l * 8, e.mesh.rotation.z += l * 6, e.mesh.position.y < .1 && (e.mesh.position.y = .1, e.vy *= -.3, e.vx *= .5, e.vz *= .5), e.mesh.visible = e.life > 0);
      }), e.noPolice && e.health < 55) {
        f += l;
        let t = 1 - Math.max(0, e.health) / 100;
        if (f > .14 - t * .1) {
          f = 0;
          let n = a[d++ % a.length];
          n.life = 1 + t * .8, n.mesh.position.set(e.x - Math.sin(e.heading) * 1.6, (e.y || 0) + .5, e.z - Math.cos(e.heading) * 1.6), n.mesh.scale.setScalar(.5);
        }
      }
      if (a.forEach(e => {
        e.mesh.visible = e.life > 0, e.life > 0 && (e.life -= l, e.mesh.position.y += l * .9, e.mesh.scale.addScalar(l * .7), e.mesh.material.opacity = Math.max(0, e.life) * .3);
      }), i.forEach(trail => {
        if (trail !== activeTrail && trail.remaining > 0) {
          trail.remaining = Math.max(0, trail.remaining - l);
          if (trail.remaining === 0) trail.wheels.forEach(wheel => {
            wheel.mesh.visible = !1, wheel.geometry.setDrawRange(0, 0), wheel.last = null;
          });
        }
      }), e.drifting && !wasDrifting && (activeTrail = i[trailCursor++ % i.length], activeTrail.remaining = 0, activeTrail.wheels.forEach(wheel => {
        wheel.segments = 0, wheel.distance = 0, wheel.last = null, wheel.geometry.setDrawRange(0, 0), wheel.mesh.visible = !1;
      })), e.drifting) {
        const appendSkidSegment = (wheel, x1, z1, x2, z2, y, width) => {
          const dx = x2 - x1,
            dz = z2 - z1,
            length = Math.hypot(dx, dz);
          if (length < .012) return;
          const nx = -dz / length * width / 2,
            nz = dx / length * width / 2;
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
            wheel.geometry.setAttribute(`position`, new Float32BufferAttribute(positions, 3));
            wheel.geometry.setAttribute(`normal`, new Float32BufferAttribute(normals, 3));
            wheel.geometry.setAttribute(`uv`, new Float32BufferAttribute(uvs, 2));
            const indices = [];
            for (let k = 0; k < wheel.capacity; k++) {
              const base = k * 4;
              indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
            }
            wheel.geometry.setIndex(indices);
          }
          const offset = wheel.segments * 12;
          wheel.positions.set([x1 + nx, y, z1 + nz, x1 - nx, y, z1 - nz, x2 + nx, y, z2 + nz, x2 - nx, y, z2 - nz], offset);
          wheel.normals.fill(0, offset, offset + 12);
          for (let k = 0; k < 4; k++) wheel.normals[offset + k * 3 + 1] = 1;
          const uvOffset = wheel.segments * 8,
            v0 = wheel.distance,
            v1 = v0 + length * 1.6;
          wheel.uvs.set([0, v0, 1, v0, 0, v1, 1, v1], uvOffset);
          wheel.distance = v1;
          wheel.segments++;
          wheel.geometry.attributes.position.needsUpdate = !0;
          wheel.geometry.attributes.normal.needsUpdate = !0;
          wheel.geometry.attributes.uv.needsUpdate = !0;
          wheel.geometry.setDrawRange(0, wheel.segments * 6);
          wheel.mesh.visible = !0;
        };
        if (activeTrail) for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
          const side = sideIndex === 0 ? -1 : 1;
          const x = e.x + Math.sin(e.heading) * 1.45 + Math.cos(e.heading) * side * .85;
          const z = e.z + Math.cos(e.heading) * 1.45 - Math.sin(e.heading) * side * .85;
          const y = (e.y || 0) + .09;
          const wheel = activeTrail.wheels[sideIndex];
          if (wheel.last) appendSkidSegment(wheel, wheel.last.x, wheel.last.z, x, z, y, .16);
          wheel.last = {
            x,
            z
          };
        }
        if (o > .045) {
          o = 0;
          for (let n of [-1, 1]) {
            const r = Math.sin(e.heading) * 1.45 + Math.cos(e.heading) * n * .85;
            const a = Math.cos(e.heading) * 1.45 - Math.sin(e.heading) * n * .85;
            const x = e.x + r,
              z = e.z + a,
              y = e.y || 0;
            const particle = t[s++ % t.length];
            particle.maxLife = .9 + Math.random() * .55;
            particle.life = particle.maxLife;
            particle.mesh.position.set(x, y + .16 + Math.random() * .12, z);
            particle.mesh.scale.set(.65 + Math.random() * .4, .5 + Math.random() * .3, 1);
            particle.vx = Math.sin(e.heading) * (.25 + e.speed * .035) + (Math.random() - .5) * .45;
            particle.vy = .38 + Math.random() * .48;
            particle.vz = Math.cos(e.heading) * (.25 + e.speed * .035) + (Math.random() - .5) * .45;
            particle.mesh.material.opacity = .25 + Math.random() * .12;
          }
        }
      }
      !e.drifting && wasDrifting && (activeTrail.remaining = 20, activeTrail = null), wasDrifting = e.drifting;
    },
    crash(e, t, i, a = 1) {
      for (let r = 0; r < 8; r++) {
        let r = n[l++ % n.length];
        r.life = 1.5 + Math.random() * .5, r.vy = .8 + Math.random() * .6, r.mesh.position.set(e + (Math.random() - .5) * 2, t + .5, i + (Math.random() - .5) * 2), r.mesh.scale.setScalar(1 + Math.random());
      }
      for (let n = 0; n < 6; n++) {
        let n = r[u++ % r.length];
        n.life = 1.5, n.mesh.position.set(e, t + .5, i), n.vx = (Math.random() - .5) * 12 * a, n.vy = 3 + Math.random() * 5, n.vz = (Math.random() - .5) * 12 * a, n.mesh.visible = !0;
      }
    }
  };
}
function aE(e, t, n, r, i, a) {
  let o = new EffectComposer(e);
  e.capabilities.isWebGL2 && (o.renderTarget1.samples = Math.min(4, e.capabilities.maxSamples), o.renderTarget2.samples = Math.min(4, e.capabilities.maxSamples)), o.setPixelRatio(e.getPixelRatio()), o.setSize(r, i), o.addPass(new RenderPass(t, n)), o.addPass(new UnrealBloomPass(new Vector2(r, i), a, .4, .92));
  let s = new ShaderPass(VignetteShader);
  return s.uniforms.offset.value = .95, s.uniforms.darkness.value = 1.08, o.addPass(s), o.addPass(new OutputPass()), o;
}
function oE(e, t = !1) {
  let lowPower = !!(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  let n = new Scene();
  n.background = new Color(t ? `#070b14` : `#0d1520`), n.fog = new Fog(t ? `#223a4d` : `#35506b`, t ? 130 : 74, t ? 1050 : 980);
  let r = new WebGLRenderer({
    // every frame goes through the composer, whose render targets are multisampled; the canvas only
    // receives a fullscreen copy, so a multisampled default framebuffer would cost bandwidth for nothing
    antialias: !1,
    alpha: !1,
    powerPreference: `high-performance`
  });
  try {
    r.outputColorSpace = `srgb`;
  } catch (e) {}
  let i = !!(window.matchMedia && window.matchMedia(`(pointer: coarse)`).matches);
  if (lowPower) r.shadowMap.enabled = !1, r.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));else r.setPixelRatio(Math.min(window.devicePixelRatio, i ? 1.2 : t ? 1.8 : 2.2));
  r.setSize(e.clientWidth, e.clientHeight), r.toneMapping = 4, r.toneMappingExposure = t ? .82 : 1.05, r.shadowMap.enabled = !lowPower, r.shadowMap.type = 2, r.physicallyCorrectLights && (r.physicallyCorrectLights = !0), e.appendChild(r.domElement), r.domElement.className = t ? `game-canvas` : `game-canvas-preview`;
  let a = new PerspectiveCamera(45, e.clientWidth / e.clientHeight, .1, 1200);
  n.add(new HemisphereLight(t ? `#a1bfdc` : `#dfeaf8`, t ? `#1a2418` : `#101a22`, t ? .78 : 1.15));
  let o = new AmbientLight(t ? `#3d536d` : `#78879a`, t ? .38 : .58);
  n.add(o);
  let s = new DirectionalLight(t ? `#a9c5e8` : `#f6d7a8`, t ? 2.2 : 3.2);
  if (s.position.set(-42, 88, -30), (t || !i) && !lowPower) {
    s.castShadow = !0;
    let e = i ? 1024 : t ? 2048 : 3072;
    s.shadow.mapSize.set(e, e), s.shadow.camera.near = 12, s.shadow.camera.far = 340, s.shadow.camera.left = -120, s.shadow.camera.right = 120, s.shadow.camera.top = 120, s.shadow.camera.bottom = -120, s.shadow.bias = -1.7e-4, s.shadow.normalBias = .045, s.shadow.radius = 3;
  }
  n.add(s), n.add(s.target);
  let c = new DirectionalLight(t ? `#7ca8d7` : `#7ca8d7`, t ? .35 : .55);
  if (c.position.set(52, 42, 64), n.add(c), t) {
    let e = new DirectionalLight(`#90b0d8`, .5);
    e.position.set(25, 34, -60), n.add(e);
  } else {
    let e = new DirectionalLight(`#ddeeff`, .45);
    e.position.set(-90, 28, -35), n.add(e);
  }
  let l = document.createElement(`canvas`);
  l.width = t ? 2048 : 1024, l.height = t ? 1024 : 512;
  let u = l.getContext(`2d`);
  if (t) {
    const sky = u.createLinearGradient(0, 0, 0, l.height);
    sky.addColorStop(0, `#02040b`);
    sky.addColorStop(.2, `#050b18`);
    sky.addColorStop(.39, `#0b1728`);
    sky.addColorStop(.49, `#14243a`);
    sky.addColorStop(.535, `#1d2b3b`);
    sky.addColorStop(.59, `#182433`);
    sky.addColorStop(.76, `#0b111b`);
    sky.addColorStop(1, `#05080e`);
    u.fillStyle = sky;
    u.fillRect(0, 0, l.width, l.height);
    const moonX = l.width * .72,
      moonY = l.height * .2;
    const moonGlow = u.createRadialGradient(moonX, moonY, 4, moonX, moonY, 150);
    moonGlow.addColorStop(0, `rgba(180,205,238,0.2)`);
    moonGlow.addColorStop(.24, `rgba(124,157,205,0.1)`);
    moonGlow.addColorStop(1, `rgba(80,115,170,0)`);
    u.fillStyle = moonGlow;
    u.fillRect(moonX - 150, moonY - 150, 300, 300);
    const moonDisk = u.createRadialGradient(moonX - 7, moonY - 8, 1, moonX, moonY, 22);
    moonDisk.addColorStop(0, `rgba(223,232,245,0.9)`);
    moonDisk.addColorStop(.8, `rgba(185,203,229,0.82)`);
    moonDisk.addColorStop(1, `rgba(153,178,211,0)`);
    u.fillStyle = moonDisk;
    u.fillRect(moonX - 26, moonY - 26, 52, 52);
    let cloudSeed = 481516;
    const random = () => {
      cloudSeed = cloudSeed * 48271 % 2147483647;
      return (cloudSeed - 1) / 2147483646;
    };
    for (let star = 0; star < 420; star++) {
      const x = random() * l.width,
        y = random() * l.height * .48;
      const radius = random() > .96 ? 1.5 + random() : .35 + random() * .65;
      u.beginPath();
      u.arc(x, y, radius, 0, Math.PI * 2);
      u.fillStyle = `rgba(210,226,255,${.18 + random() * .5})`;
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
          const px = cx + (random() - .5) * width * 1.8;
          const py = cy + (random() - .5) * width * .42;
          const radius = 22 + random() * (band === 0 ? 56 : 34);
          const cloud = u.createRadialGradient(px, py, radius * .08, px, py, radius);
          cloud.addColorStop(0, band === 1 ? `rgba(111,137,176,0.16)` : `rgba(156,177,207,0.12)`);
          cloud.addColorStop(.42, band === 1 ? `rgba(91,119,160,0.09)` : `rgba(117,143,181,0.07)`);
          cloud.addColorStop(1, `rgba(70,96,137,0)`);
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
      u.bezierCurveTo(x + length * .3, y - 8, x + length * .7, y + 8, x + length, y - 2);
      u.strokeStyle = `rgba(145,169,203,${.012 + random() * .022})`;
      u.lineWidth = 3 + random() * 9;
      u.stroke();
    }
  } else {
    let d = u.createLinearGradient(0, 0, 0, 512);
    d.addColorStop(0, `#2a2e32`), d.addColorStop(.35, `#1a1e22`), d.addColorStop(.5, `#15191d`), d.addColorStop(.62, `#10131a`), d.addColorStop(.72, `#0a0d10`), d.addColorStop(1, `#05060a`), u.fillStyle = d, u.fillRect(0, 0, 1024, 512);
    let skylineSeed = 7919;
    for (let buildingIndex = 0; buildingIndex < 40; buildingIndex++) {
      skylineSeed = skylineSeed * 48271 % 2147483647;
      let buildingX = buildingIndex * 26;
      let buildingHeight = 18 + skylineSeed % 42;
      u.fillStyle = buildingIndex % 3 ? `#0b121a` : `#111a22`;
      u.fillRect(buildingX, 264 - buildingHeight, 26, buildingHeight + 28);
      for (let row = 0; row < Math.floor(buildingHeight / 7); row++) for (let column = 0; column < 3; column++) {
        skylineSeed = skylineSeed * 48271 % 2147483647;
        if (skylineSeed % 5 === 0) {
          u.fillStyle = `rgba(255,190,130,0.38)`;
          u.fillRect(buildingX + 4 + column * 7, 267 - buildingHeight + row * 7, 2, 3);
        }
      }
    }
    let f = u.createLinearGradient(0, 250, 0, 320);
    f.addColorStop(0, `rgba(255,180,120,0)`), f.addColorStop(.5, `rgba(180,140,90,0.15)`), f.addColorStop(1, `rgba(255,160,100,0)`), u.fillStyle = f, u.fillRect(0, 250, 1024, 70), u.fillStyle = `rgba(255,220,180,0.3)`, u.beginPath(), u.arc(760, 90, 55, 0, Math.PI * 2), u.fill(), u.fillStyle = `rgba(255,255,255,0.25)`, u.beginPath(), u.arc(760, 90, 80, 0, Math.PI * 2), u.fill();
  }
  let p = new CanvasTexture(l);
  p.mapping = 303;
  let m = new PMREMGenerator(r);
  n.environment = m.fromEquirectangular(p).texture, t && (n.background = p), m.dispose();
  let h = aE(r, n, a, e.clientWidth, e.clientHeight, t ? .75 : .5),
    g = new ResizeObserver(() => {
      let t = e.clientWidth,
        n = e.clientHeight;
      !t || !n || (r.setSize(t, n), a.aspect = t / n, a.updateProjectionMatrix(), h.setSize(t, n));
    });
  return g.observe(e), {
    scene: n,
    renderer: r,
    camera: a,
    sun: s,
    touchDevice: i,
    composer: h,
    dispose() {
      g.disconnect(), n.traverse(e => {
        e.geometry?.dispose(), e.material && (Array.isArray(e.material) ? e.material : [e.material]).forEach(e => e.dispose());
      }), h.dispose(), r.dispose(), r.domElement.remove();
    }
  };
}
function __cv(w, h, fn) {
  const c = document.createElement(`canvas`);
  c.width = w;
  c.height = h;
  fn(c.getContext(`2d`), w, h);
  const t = new CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}
/* ---------- people: articulated humanoids (face -Z at rotation 0, like the cars) ---------- */
function __makePerson(col) {
  const cop = col === `#1f2f4d`,
    g = new Group(),
    L = {};
  const mt = (c, r = .8, m = 0) => new MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: m
  });
  const skin = mt(cop ? `#c99a78` : `#d9b48f`, .62),
    shirt = mt(col, .88),
    vest = mt(`#131b2a`, .9);
  const pants = mt(cop ? `#0f1724` : `#262d3a`, .92),
    shoe = mt(cop ? `#0a0a0b` : `#ececec`, cop ? .35 : .7),
    dark = mt(`#0c0d10`, .5, .2);
  const add = (geo, m, x, y, z, p = g, sh = !0) => {
    const q = new Mesh(geo, m);
    q.position.set(x, y, z);
    q.castShadow = sh;
    p.add(q);
    return q;
  };
  const body = new Group();
  g.add(body);
  L.body = body;
  add(new BoxGeometry(.36, .2, .22), pants, 0, .95, 0, body);
  add(new CylinderGeometry(.2, .17, .56, 14), cop ? vest : shirt, 0, 1.28, 0, body).scale.z = .66;
  for (const s of [-1, 1]) add(new SphereGeometry(.085, 10, 8), shirt, s * .235, 1.49, 0, body);
  add(new CylinderGeometry(.05, .055, .1, 8), skin, 0, 1.58, 0, body);
  const head = new Group();
  head.position.set(0, 1.69, 0);
  body.add(head);
  L.head = head;
  add(new SphereGeometry(.115, 18, 14), skin, 0, 0, 0, head).scale.set(.92, 1.08, 1);
  add(new BoxGeometry(.024, .04, .03), skin, 0, -.008, -.116, head, !1);
  for (const s of [-1, 1]) {
    add(new SphereGeometry(.013, 6, 5), dark, s * .04, .022, -.106, head, !1);
    add(new BoxGeometry(.045, .008, .01), dark, s * .04, .05, -.108, head, !1);
  }
  if (cop) {
    add(new BoxGeometry(.2, .036, .03), dark, 0, .024, -.108, head, !1);
    add(new CylinderGeometry(.118, .124, .075, 18), mt(`#0d1524`, .7), 0, .108, -.005, head);
    add(new CylinderGeometry(.1, .12, .02, 18), mt(`#0d1524`, .7), 0, .152, -.005, head);
    add(new BoxGeometry(.2, .012, .1), dark, 0, .09, -.13, head);
    add(new BoxGeometry(.03, .035, .01), mt(`#e0b84a`, .3, .9), 0, .115, -.128, head, !1);
    add(new BoxGeometry(.34, .06, .24), dark, 0, 1.02, 0, body);
    add(new BoxGeometry(.065, .2, .11), dark, .21, .93, 0, body);
    add(new BoxGeometry(.07, .045, .1), mt(`#222`, .4, .6), -.13, 1.03, -.1, body);
    add(new BoxGeometry(.05, .09, .04), dark, -.14, 1.44, -.13, body);
    add(new BoxGeometry(.012, .1, .012), dark, -.15, 1.53, -.13, body, !1);
    add(new BoxGeometry(.03, .04, .01), mt(`#e0b84a`, .3, .9), .1, 1.38, -.137, body, !1);
    const tx = __cv(128, 48, (x, w, h) => {
      x.fillStyle = `#0a0f1a`;
      x.fillRect(0, 0, w, h);
      x.fillStyle = `#f2d24a`;
      x.font = `bold 30px sans-serif`;
      x.textAlign = `center`;
      x.fillText(`POLICE`, 64, 35);
    });
    for (const f of [1, -1]) {
      const p = new Mesh(new PlaneGeometry(.3, .11), new MeshStandardMaterial({
        map: tx,
        roughness: .6
      }));
      p.position.set(0, 1.33, f * .146);
      p.rotation.y = f > 0 ? 0 : Math.PI;
      body.add(p);
    }
  } else {
    add(new SphereGeometry(.13, 12, 10), shirt, 0, 1.57, .07, body).scale.set(1, .8, .8);
    add(new SphereGeometry(.121, 14, 10), mt(`#1c1410`, .9), 0, .028, .02, head).scale.set(.97, .9, 1);
    add(new BoxGeometry(.2, .012, .1), mt(`#15171c`, .6), 0, .07, -.13, head);
  }
  const arm = s => {
    const sh = new Group();
    sh.position.set(s * .25, 1.48, 0);
    body.add(sh);
    add(new CylinderGeometry(.055, .046, .3, 10), shirt, 0, -.15, 0, sh);
    const el = new Group();
    el.position.y = -.3;
    sh.add(el);
    add(new CylinderGeometry(.046, .037, .28, 10), shirt, 0, -.14, 0, el);
    add(new SphereGeometry(.043, 8, 6), skin, 0, -.3, 0, el);
    return [sh, el];
  };
  [L.la, L.le] = arm(-1);
  [L.ra, L.re] = arm(1);
  const leg = s => {
    const hp = new Group();
    hp.position.set(s * .1, .93, 0);
    g.add(hp);
    add(new CylinderGeometry(.085, .064, .46, 10), pants, 0, -.23, 0, hp);
    const kn = new Group();
    kn.position.y = -.46;
    hp.add(kn);
    add(new CylinderGeometry(.062, .05, .44, 10), pants, 0, -.22, 0, kn);
    add(new BoxGeometry(.1, .07, .27), shoe, 0, -.45, -.05, kn);
    return [hp, kn];
  };
  [L.lh, L.lk] = leg(-1);
  [L.rh, L.rk] = leg(1);
  g.userData.L = L;
  return g;
}
function __animPerson(g, dt, x, z) {
  const u = g.userData,
    L = u.L;
  if (!L || dt <= 0) return;
  if (u.lx === void 0) {
    u.lx = x;
    u.lz = z;
    u.ph = 0;
    u.sp = 0;
  }
  const v = Math.min(Math.hypot(x - u.lx, z - u.lz) / dt, 10);
  u.lx = x;
  u.lz = z;
  u.sp += (v - u.sp) * (1 - Math.exp(-10 * dt));
  const run = Math.min(u.sp / 4.6, 1.9),
    a = Math.min(run, 1.6) * .62;
  u.ph += dt * u.sp * 1.9;
  const s = Math.sin(u.ph),
    c = Math.sin(u.ph + 1.9);
  L.lh.rotation.x = s * a;
  L.rh.rotation.x = -s * a;
  L.lk.rotation.x = -Math.max(0, c) * a * 1.5;
  L.rk.rotation.x = -Math.max(0, -c) * a * 1.5;
  L.la.rotation.x = -s * a * .9;
  L.ra.rotation.x = s * a * .9;
  const bend = .12 + Math.min(run, 1) * .5;
  L.le.rotation.x = bend;
  L.re.rotation.x = bend;
  L.body.position.y = Math.abs(s) * .035 * Math.min(run, 1.4);
  L.body.rotation.x = -Math.min(run, 1.6) * .08;
  L.head.rotation.x = Math.min(run, 1.6) * .06;
}
function sE(e) {
  return __makePerson(e);
}
function cE(e, t) {
  if (navigator.webdriver || navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
    return () => {};
  }
  let n = oE(e),
    {
      scene: r,
      renderer: i,
      camera: a,
      composer: o
    } = n;
  a.position.set(7, 3.2, 8.2), a.lookAt(0, .5, 0);
  let s = Vw(t.color, t.shape);
  s.rotation.y = -.25, r.add(s);
  let c = new Mesh(new PlaneGeometry(100, 100), new MeshStandardMaterial({
    color: `#171b1e`,
    roughness: .35,
    metalness: .45
  }));
  c.rotation.x = -Math.PI / 2, c.position.y = -.04, r.add(c);
  let l = new Mesh(new CylinderGeometry(4.7, 4.8, .16, 80), new MeshStandardMaterial({
    color: `#23292c`,
    metalness: .6,
    roughness: .4
  }));
  l.position.y = -.03, r.add(l);
  let u = new Mesh(new TorusGeometry(4.73, .012, 8, 100), new MeshBasicMaterial({
    color: `#c6dc77`
  }));
  u.rotation.x = Math.PI / 2, u.position.y = .06, r.add(u);
  for (let e of [-5, 5]) {
    let t = new PointLight(e < 0 ? `#bbd9ff` : `#c6dc77`, 80, 25);
    t.position.set(e, 4, -2), r.add(t);
    let n = new Mesh(new BoxGeometry(.035, 4, .035), new MeshBasicMaterial({
      color: e < 0 ? `#adc7d4` : `#c6dc77`
    }));
    n.position.set(e, 2, -5), r.add(n);
  }
  let d,
    f = performance.now();
  function p() {
    d = requestAnimationFrame(p), s.rotation.y = -.25 + Math.sin((performance.now() - f) * 12e-5) * .18, o.render();
  }
  return p(), () => {
    cancelAnimationFrame(d), n.dispose();
  };
}
function lE(e, t, n, r, i, a = !1) {
  let o = oE(e, !0),
    {
      scene: s,
      renderer: c,
      camera: l,
      sun: u,
      touchDevice: d,
      composer: f
    } = o,
    {
      solids: p,
      lampPositions: m,
      signals
    } = $w(s),
    staticBatch = dfcBatchStatic(s, new Set(signals.flatMap(signal => signal.lenses)), 96),
    h = ET(t, n, p, a),
    g = [];
  // ?dfdebug exposes the live session for profiling tools
  const debugSession = /[?&]dfdebug\b/.test(location.search) ? window.__dfDbg = {
    scene: s,
    renderer: c,
    composer: f,
    camera: l,
    sun: u,
    staticBatch,
    get state() {
      return h.state;
    }
  } : null;
  let signalClock = 0;
  const signalStates = [-1, -1];
  function updateTrafficLights(dt) {
    signalClock = (signalClock + dt) % 24;
    const phase = signalClock % 24;
    const state0 = phase < 9 ? 0 : phase < 11 ? 1 : 2;
    const state1 = phase >= 12 && phase < 21 ? 0 : phase >= 21 && phase < 23 ? 1 : 2;
    for (let axis = 0; axis < signalStates.length; axis++) {
      const state = axis === 0 ? state0 : state1;
      if (signalStates[axis] === state) continue;
      signalStates[axis] = state;
      const activeLens = state === 0 ? 2 : state === 1 ? 1 : 0;
      for (const signal of signals) if (signal.axis === axis) signal.lenses.forEach((material, index) => {
        material.emissiveIntensity = index === activeLens ? 1.35 : .025;
      });
    }
  }
  for (let e = 0; e < 6; e++) {
    let e = new PointLight(`#ffd9a0`, .6, 26, 2);
    s.add(e), g.push({
      light: e
    });
  }
  let _ = new Float32Array(m.length || 1),
    v = [];
  let lastLampX = 1 / 0,
    lastLampZ = 1 / 0;
  function y(e, t) {
    if ((e - lastLampX) ** 2 + (t - lastLampZ) ** 2 < 25) return;
    lastLampX = e;
    lastLampZ = t;
    let n = m,
      r = n.length;
    for (let i = 0; i < r; i++) {
      let r = n[i].x - e,
        a = n[i].z - t;
      _[i] = r * r + a * a, v[i] = i;
    }
    v.length = r, v.sort((e, t) => _[e] - _[t]);
    for (let e = 0; e < 6; e++) {
      let t = g[e],
        r = v[e];
      r == null ? t.light.visible = !1 : (t.light.position.set(n[r].x, n[r].y, n[r].z), t.light.visible = !0);
    }
  }
  y(0, 70);
  let interaction = null;
  let b = dfcBatchCar(Vw(t.color, t.shape, !1, !0));
  s.add(b);
  let x = h.state.playerVeh.spec,
    S = h.state.police.map(() => {
      let e = dfcTrafficCar(`#ffffff`, `coupe`, !0);
      return s.add(e), e;
    }),
    C = sE(`#2f3b4c`);
  C.visible = !1, s.add(C);
  let w = h.state.police.map(() => {
      let e = sE(`#1f2f4d`);
      return e.visible = !1, s.add(e), e;
    }),
    T = new Map();
  function E(e) {
    s.remove(b), b.traverse(e => {
      e.geometry?.dispose(), e.material?.dispose();
    }), b = dfcBatchCar(Vw(e.color, e.shape, e.kind === `police`, !0)), s.add(b), x = e.spec;
  }
  function D() {
    let e = h.state,
      t = new Set();
    for (let n of e.vehicles) {
      t.add(n.id);
      let e = T.get(n.id);
      if (!e) {
        let t = n.kind === `police` ? dfcTrafficCar(`#ffffff`, `coupe`, !0) : dfcTrafficCar(n.color, n.shape || `coupe`);
        s.add(t), e = {
          car: t
        }, T.set(n.id, e);
      }
      e.car.visible = !0, e.car.position.set(n.x, Uw(n.x, n.z) + .1, n.z), e.car.rotation.y = n.heading, interaction?.direction === `exit` && Math.hypot(n.x - interaction.carX, n.z - interaction.carZ) < .5 && (e.car.visible = !1);
    }
    for (let [e, n] of T) t.has(e) || (s.remove(n.car), n.car.userData.sharedTemplate || n.car.traverse(e => {
      e.geometry?.dispose(), e.material?.dispose();
    }), T.delete(e));
  }
  let O = r.current.audio || HT(n),
    k = UT(s),
    A = {},
    j,
    M = performance.now(),
    N = 0,
    cameraYaw = 0,
    footCameraYaw = 0,
    cameraPitch = 0,
    cameraZoom = 1,
    dragPointer = null,
    lastPointerX = 0,
    lastPointerY = 0,
    touchPoints = new Map(),
    pinchDistance = 0;
  let canvas = c.domElement;
  function startCameraDrag(e) {
    if (e.pointerType === `touch`) {
      e.preventDefault();
      touchPoints.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY
      });
      canvas.setPointerCapture(e.pointerId);
      if (touchPoints.size >= 2) {
        const points = [...touchPoints.values()];
        pinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        dragPointer = null;
        return;
      }
      dragPointer = e.pointerId;
    } else {
      if (e.button !== 2) return;
      e.preventDefault();
      dragPointer = e.pointerId;
      canvas.setPointerCapture(e.pointerId);
    }
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
  }
  function moveCameraDrag(e) {
    if (e.pointerType === `touch` && touchPoints.has(e.pointerId)) {
      touchPoints.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY
      });
      if (touchPoints.size >= 2) {
        const points = [...touchPoints.values()];
        const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        if (pinchDistance > 0 && distance > 0) cameraZoom = Math.max(.45, Math.min(2.8, cameraZoom * pinchDistance / distance));
        pinchDistance = distance;
        return;
      }
    }
    if (e.pointerId !== dragPointer) return;
    const yawDelta = -(e.clientX - lastPointerX) * .005;
    cameraYaw += yawDelta;
    h.state.onFoot && (footCameraYaw += yawDelta);
    cameraPitch = Math.max(-.45, Math.min(.55, cameraPitch + (e.clientY - lastPointerY) * .004));
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
  }
  function stopCameraDrag(e) {
    if (e.pointerType === `touch`) {
      touchPoints.delete(e.pointerId);
      pinchDistance = 0;
      dragPointer = null;
      if (touchPoints.size === 1) {
        const [pointerId, point] = [...touchPoints.entries()][0];
        dragPointer = pointerId;
        lastPointerX = point.x;
        lastPointerY = point.y;
      }
    } else if (e.pointerId === dragPointer) dragPointer = null;
  }
  function preventCameraMenu(e) {
    e.preventDefault();
  }
  function zoomCamera(e) {
    e.preventDefault();
    cameraZoom = Math.max(.45, Math.min(2.8, cameraZoom * Math.exp(e.deltaY * .001)));
  }
  function addInteractionDoor() {
    interaction.door = b.userData.accessDoor;
    if (interaction.door) interaction.door.rotation.set(0, 0, 0);
  }
  function removeInteractionDoor() {
    if (!interaction?.door) return;
    interaction.door.rotation.set(0, 0, 0);
    interaction.door = null;
  }
  canvas.addEventListener(`pointerdown`, startCameraDrag);
  canvas.addEventListener(`pointermove`, moveCameraDrag);
  canvas.addEventListener(`pointerup`, stopCameraDrag);
  canvas.addEventListener(`pointercancel`, stopCameraDrag);
  canvas.addEventListener(`contextmenu`, preventCameraMenu);
  canvas.addEventListener(`wheel`, zoomCamera, {
    passive: !1
  });
  c.shadowMap.autoUpdate = !1;
  c.shadowMap.needsUpdate = !0;
  let P = 0,
    F = c.getPixelRatio(),
    I = 1,
    L = 0,
    R = 0,
    shadowFrameInterval = d ? 2 : 1,
    slowWindows = 0,
    fastWindows = 0,
    fastWindowsNeeded = 4,
    lastRaise = -1 / 0,
    skipWindow = !1;
  O.ready.catch(() => {});
  let z = e => {
      O.resume(), [`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`].includes(e.code) && e.preventDefault(), A[e.code] = !0, e.code === `KeyE` && !e.repeat && !h.state.onFoot && h.state.station >= 0 && i.current.onStation(), e.code === `Escape` && !e.repeat && i.current.onPause();
    },
    ee = e => {
      A[e.code] = !1;
    },
    B = () => {
      Object.keys(A).forEach(e => A[e] = !1);
    },
    V = () => O.resume(),
    te = () => {
      document.hidden || O.resume();
    };
  window.addEventListener(`keydown`, z), window.addEventListener(`keyup`, ee), window.addEventListener(`blur`, B), window.addEventListener(`pointerdown`, V), document.addEventListener(`visibilitychange`, te), l.position.set(0, 9, 85);
  let ne = new Vector3(),
    re = new Vector3(),
    ie = new Vector3();
  function ae(t) {
    j = requestAnimationFrame(ae);
    let n = (t - M) / 1e3,
      a = Math.min(n, .04);
    // a frame longer than a second means the tab was hidden, not that the game is slow
    if (M = t, n < 1 && (L += n, R++), L > 1) {
      let t = L / R,
        n = I;
      shadowFrameInterval = d ? 2 : t > 1 / 32 ? 3 : t > 1 / 48 ? 2 : 1;
      // resizing reallocates every post-processing target, so only react to sustained trends and
      // back off when a resolution increase did not hold
      if (skipWindow) skipWindow = !1;else {
        slowWindows = t > 1 / 45 ? slowWindows + 1 : 0;
        fastWindows = t < 1 / 57 ? fastWindows + 1 : 0;
        slowWindows >= 2 ? (n = Math.max(.6, I - .1), performance.now() - lastRaise < 8e3 && (fastWindowsNeeded = Math.min(32, fastWindowsNeeded * 2))) : fastWindows >= fastWindowsNeeded && (n = Math.min(1, I + .05), lastRaise = performance.now());
      }
      n !== I && (I = n, slowWindows = 0, fastWindows = 0, skipWindow = !0, c.setPixelRatio(F * I), f.setPixelRatio(F * I), f.setSize(e.clientWidth, e.clientHeight)), L = 0, R = 0;
    }
    let o = h.state;
    if (r.current.paused) O.update(o.rpm, 0, !0, !1, o);else {
      let wasOnFoot = o.onFoot,
        oldX = o.x,
        oldZ = o.z;
      if (h.update(a, {
        ...A,
        ...r.current.keys,
        ...(interaction ? {
          ArrowUp: !1,
          ArrowDown: !1,
          ArrowLeft: !1,
          ArrowRight: !1,
          KeyW: !1,
          KeyA: !1,
          KeyS: !1,
          KeyD: !1,
          KeyZ: !1,
          KeyQ: !1,
          KeyF: !1,
          Space: !1
        } : {})
      }, h.state.onFoot ? footCameraYaw : h.state.heading + cameraYaw), wasOnFoot !== o.onFoot && (o.onFoot ? footCameraYaw = o.heading + cameraYaw : cameraYaw = footCameraYaw - o.heading), wasOnFoot !== o.onFoot && (interaction = {
        direction: o.onFoot ? `exit` : `enter`,
        elapsed: 0,
        duration: 1.3,
        carX: o.onFoot ? oldX : o.x,
        carZ: o.onFoot ? oldZ : o.z,
        heading: o.heading,
        startX: oldX,
        startZ: oldZ,
        endX: o.x,
        endZ: o.z,
        door: null
      }), u.position.set(o.x + 40, 85, o.z - 25), u.target.position.set(o.x, 0, o.z), u.target.updateMatrixWorld(), P++, P >= shadowFrameInterval && (c.shadowMap.needsUpdate = !0, P = 0), y(o.x, o.z), o._crash &&= (k.crash(o._crash.x, o._crash.y, o._crash.z, o._crash.intensity), O.crash(o._crash.intensity), null), o.playerVeh.spec !== x && E(o.playerVeh), interaction && interaction.door?.parent !== b && addInteractionDoor(), b.visible = !o.onFoot || interaction?.direction === `exit`, !o.onFoot) {
        b.position.set(o.x, (o.y || 0) + .12, o.z), b.rotation.y = o.heading, b.rotation.z = o.drifting ? Math.sin(o.elapsed * 7) * .015 : 0, b.userData.wheels.forEach(e => e.rotation.x -= o.speed * .01 * a);
        let e = o.brake > 0 || o.speed > 5 && o.throttle === 0;
        b.userData.brakeLights.forEach(t => t.material.emissiveIntensity = e ? 1.5 : .15);
      }
      C.visible = !!o.onFoot, o.onFoot && (C.position.set(o.x, o.y || 0, o.z), C.rotation.y = o.footYaw || 0, __animPerson(C, a, o.x, o.z)), S.forEach((e, n) => {
        let r = o.police[n];
        e.visible = !r.onFoot, r.onFoot || (e.position.set(r.x, Uw(r.x, r.z) + .1, r.z), e.rotation.y = r.heading);
        let i = e.userData.blueLight === void 0 ? e.userData.blueLight = e.getObjectByName(`blue`) || null : e.userData.blueLight,
          a = e.userData.redLight === void 0 ? e.userData.redLight = e.getObjectByName(`red`) || null : e.userData.redLight;
        i && (i.visible = !r.onFoot && Math.sin(t * .018) > 0), a && (a.visible = !r.onFoot && Math.sin(t * .018) <= 0);
      }), w.forEach((e, t) => {
        let n = o.police[t];
        e.visible = !!n.onFoot, n.onFoot && (e.position.set(n.x, Uw(n.x, n.z), n.z), e.rotation.y = n.heading, __animPerson(e, a, n.x, n.z));
      }), D();
      if (interaction) {
        interaction.elapsed += a;
        const time = Math.min(interaction.elapsed / interaction.duration, 1);
        const ease = e => e * e * (3 - 2 * e);
        const open = ease(Math.min(time / .2, 1)) * (1 - ease(Math.max(0, (time - .78) / .22)));
        if (interaction.door) interaction.door.rotation.y = -open * 1.12;
        const sideX = interaction.carX - Math.cos(interaction.heading) * 1.45;
        const sideZ = interaction.carZ + Math.sin(interaction.heading) * 1.45;
        if (interaction.direction === `exit`) {
          const step = ease(Math.max(0, Math.min((time - .16) / .56, 1)));
          C.visible = !0;
          C.position.set(sideX + (interaction.endX - sideX) * step, 0, sideZ + (interaction.endZ - sideZ) * step);
          C.rotation.y = interaction.heading;
          C.scale.setScalar(.78 + .22 * ease(Math.min(time / .42, 1)));
          b.position.set(interaction.carX, Uw(interaction.carX, interaction.carZ) + .1, interaction.carZ);
          b.rotation.y = interaction.heading;
        } else {
          const approach = ease(Math.min(time / .48, 1));
          const enter = ease(Math.max(0, Math.min((time - .42) / .34, 1)));
          C.visible = time < .84;
          C.position.set(interaction.startX + (sideX - interaction.startX) * approach + (interaction.carX - sideX) * enter, .12 * Math.sin(Math.PI * enter), interaction.startZ + (sideZ - interaction.startZ) * approach + (interaction.carZ - sideZ) * enter);
          C.rotation.y = interaction.heading;
          C.scale.setScalar(1 - .72 * enter);
        }
        const limbs = C.userData.L;
        if (limbs && time < .84) {
          const crouch = Math.sin(Math.PI * Math.min(time / .84, 1));
          limbs.body.position.y = .08 * crouch;
          limbs.body.rotation.x = -.18 * crouch;
          limbs.la.rotation.x = -.8 * crouch;
          limbs.ra.rotation.x = -.8 * crouch;
          limbs.lh.rotation.x = .18 * crouch;
          limbs.rh.rotation.x = -.18 * crouch;
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
      let n = inStore ? 4.2 : 12 + e * 3,
        s = inStore ? 2.2 : 7.5 + e * 1.5,
        cameraHeading = o.onFoot ? footCameraYaw : o.heading + cameraYaw,
        cameraDistance = Math.hypot(n, s - 1) * cameraZoom,
        cameraAngle = Math.atan2(s - 1, n) + cameraPitch;
      re.set(o.x + Math.sin(cameraHeading) * Math.cos(cameraAngle) * cameraDistance, (o.y || 0) + 1 + Math.sin(cameraAngle) * cameraDistance, o.z + Math.cos(cameraHeading) * Math.cos(cameraAngle) * cameraDistance), l.position.lerp(re, 1 - Math.exp(-a * (o.onFoot ? 12 : 4.5))), o.shake > .01 && (ie.set((Math.random() - .5) * o.shake * .8, (Math.random() - .5) * o.shake * .5, (Math.random() - .5) * o.shake * .8), l.position.add(ie)), ne.set(o.x, (o.y || 0) + 1, o.z), l.lookAt(ne), k.update(o, a, l), O.update(o.rpm, o.pedal, r.current.muted, o.drifting, o), wasOnFoot && !o.onFoot && O.startEngine(), N += a, N > .09 && (N = 0, i.current.onHud({
        ...o,
        police: o.police.map(e => ({
          ...e
        }))
      })), o.ended && !r.current.finished && (r.current.finished = !0, r.current.paused = !0, i.current.onFinish({
        ...o,
        credits: Math.floor(o.score / 12 + o.elapsed * 2)
      }));
    }
    f.render();
  }
  dfcWarmUp(c, s, l, [t.color]);
  debugSession && (debugSession.fx = k);
  return j = requestAnimationFrame(ae), {
    setCar(e) {
      h.setCar(e), s.remove(b), b.traverse(e => {
        e.geometry?.dispose(), e.material?.dispose();
      }), b = dfcBatchCar(Vw(e.color, e.shape, !1, !0)), s.add(b), x = `player|${e.color}|${e.shape}`;
    },
    dispose() {
      cancelAnimationFrame(j), removeInteractionDoor(), canvas.removeEventListener(`pointerdown`, startCameraDrag), canvas.removeEventListener(`pointermove`, moveCameraDrag), canvas.removeEventListener(`pointerup`, stopCameraDrag), canvas.removeEventListener(`pointercancel`, stopCameraDrag), canvas.removeEventListener(`contextmenu`, preventCameraMenu), canvas.removeEventListener(`wheel`, zoomCamera), window.removeEventListener(`keydown`, z), window.removeEventListener(`keyup`, ee), window.removeEventListener(`blur`, B), window.removeEventListener(`pointerdown`, V), document.removeEventListener(`visibilitychange`, te), O.close(), o.dispose();
    }
  };
}
function uE({
  car: e
}) {
  let t = (0, React.useRef)(null);
  return (0, React.useEffect)(() => cE(t.current, e), [e.id]), (0, jsxRuntime.jsx)(`div`, {
    ref: t,
    className: `absolute inset-0`,
    "aria-label": `Aperçu 3D de ${e.name}`
  });
}
function dE({
  car: e,
  engine: t,
  onGarage: n,
  onStart: r,
  noPolice: i,
  onToggleNoPolice: a
}) {
  return (0, jsxRuntime.jsxs)(`div`, {
    className: `garage-panel flex flex-col p-6 md:p-7`,
    children: [(0, jsxRuntime.jsxs)(`div`, {
      className: `flex items-center justify-between`,
      children: [(0, jsxRuntime.jsx)(`span`, {
        className: `eyebrow`,
        children: `Votre configuration`
      }), (0, jsxRuntime.jsx)(`span`, {
        className: `h-1.5 w-1.5 rounded-full bg-[#c6dc77]`
      })]
    }), (0, jsxRuntime.jsxs)(`div`, {
      className: `mt-7 flex items-start justify-between`,
      children: [(0, jsxRuntime.jsxs)(`div`, {
        children: [(0, jsxRuntime.jsx)(`p`, {
          className: `text-[10px] tracking-[.14em] text-[#a2acae]`,
          children: e.tag
        }), (0, jsxRuntime.jsx)(`h2`, {
          className: `race-title mt-2 text-4xl`,
          children: e.name
        })]
      }), (0, jsxRuntime.jsx)(`span`, {
        className: `rounded-md bg-[#c6dc77]/10 px-2 py-1 text-[9px] font-bold text-[#c6dc77]`,
        children: `PRÊT À ROULER`
      })]
    }), (0, jsxRuntime.jsx)(`p`, {
      className: `mt-3 text-xs leading-relaxed text-[#899295]`,
      children: e.description
    }), (0, jsxRuntime.jsxs)(`button`, {
      onClick: () => n(`cars`),
      className: `mt-5 flex w-full items-center justify-between rounded-lg border border-[#3c4447] px-4 py-3 text-xs font-semibold hover:bg-white/5`,
      children: [`Changer de voiture`, (0, jsxRuntime.jsx)(ChevronRightIcon, {
        size: 15
      })]
    }), (0, jsxRuntime.jsx)(`div`, {
      className: `my-6 h-px bg-white/10`
    }), (0, jsxRuntime.jsxs)(`div`, {
      className: `flex items-center justify-between`,
      children: [(0, jsxRuntime.jsxs)(`div`, {
        className: `flex items-center gap-3`,
        children: [(0, jsxRuntime.jsx)(`div`, {
          className: `rounded-lg bg-white/5 p-2.5 text-[#b6c2c3]`,
          children: (0, jsxRuntime.jsx)(Settings2Icon, {
            size: 19
          })
        }), (0, jsxRuntime.jsxs)(`div`, {
          children: [(0, jsxRuntime.jsx)(`div`, {
            className: `eyebrow !text-[8px]`,
            children: `Bloc moteur`
          }), (0, jsxRuntime.jsx)(`div`, {
            className: `mt-1 text-sm font-semibold`,
            children: t.name
          })]
        })]
      }), (0, jsxRuntime.jsx)(`button`, {
        onClick: () => n(`engines`),
        className: `rounded-md border border-white/10 p-2 text-[#c6dc77] hover:bg-white/5`,
        "aria-label": `Changer de moteur`,
        children: (0, jsxRuntime.jsx)(ArrowUpRightIcon, {
          size: 16
        })
      })]
    }), (0, jsxRuntime.jsxs)(`div`, {
      className: `mt-6 grid grid-cols-3 gap-2`,
      children: [(0, jsxRuntime.jsxs)(`div`, {
        children: [(0, jsxRuntime.jsx)(`p`, {
          className: `eyebrow !text-[8px]`,
          children: `Puissance`
        }), (0, jsxRuntime.jsxs)(`p`, {
          className: `mt-1 font-heading text-2xl font-semibold`,
          children: [t.hp, (0, jsxRuntime.jsx)(`span`, {
            className: `ml-1 font-body text-[9px] text-[#8b9395]`,
            children: `CH`
          })]
        })]
      }), (0, jsxRuntime.jsxs)(`div`, {
        children: [(0, jsxRuntime.jsx)(`p`, {
          className: `eyebrow !text-[8px]`,
          children: `Couple`
        }), (0, jsxRuntime.jsxs)(`p`, {
          className: `mt-1 font-heading text-2xl font-semibold`,
          children: [t.torque, (0, jsxRuntime.jsx)(`span`, {
            className: `ml-1 font-body text-[9px] text-[#8b9395]`,
            children: `NM`
          })]
        })]
      }), (0, jsxRuntime.jsxs)(`div`, {
        children: [(0, jsxRuntime.jsx)(`p`, {
          className: `eyebrow !text-[8px]`,
          children: `Vitesse max.`
        }), (0, jsxRuntime.jsxs)(`p`, {
          className: `mt-1 font-heading text-2xl font-semibold`,
          children: [Math.round(t.max * 3.6), (0, jsxRuntime.jsx)(`span`, {
            className: `ml-1 font-body text-[9px] text-[#8b9395]`,
            children: `KM/H`
          })]
        })]
      })]
    }), (0, jsxRuntime.jsxs)(`button`, {
      onClick: () => n(`engines`),
      className: `mt-5 flex items-center justify-between text-[11px] text-[#929c9e] hover:text-white`,
      children: [`Changer de moteur`, (0, jsxRuntime.jsx)(ChevronRightIcon, {
        size: 14
      })]
    }), (0, jsxRuntime.jsxs)(`div`, {
      className: `mt-6`,
      children: [(0, jsxRuntime.jsxs)(`div`, {
        className: `flex items-center justify-between`,
        children: [(0, jsxRuntime.jsx)(`span`, {
          className: `eyebrow !text-[8px]`,
          children: `Mode de jeu`
        }), (0, jsxRuntime.jsx)(`span`, {
          className: `h-1.5 w-1.5 rounded-full bg-[#c6dc77]`
        })]
      }), (0, jsxRuntime.jsxs)(`div`, {
        className: `mt-3 grid grid-cols-2 gap-2`,
        children: [(0, jsxRuntime.jsxs)(`button`, {
          onClick: () => {
            i && a();
          },
          className: `rounded-lg border px-3 py-3 text-left ${i ? `border-[#3c4447] hover:bg-white/5` : `border-[#c6dc77] bg-[#c6dc77]/10`}`,
          children: [(0, jsxRuntime.jsx)(`div`, {
            className: `text-[11px] font-semibold text-white`,
            children: `Poursuite`
          }), (0, jsxRuntime.jsx)(`div`, {
            className: `mt-1 text-[9px] text-[#8f989b]`,
            children: `Police et évasion`
          })]
        }), (0, jsxRuntime.jsxs)(`button`, {
          onClick: () => {
            i || a();
          },
          className: `rounded-lg border px-3 py-3 text-left ${i ? `border-[#c6dc77] bg-[#c6dc77]/10` : `border-[#3c4447] hover:bg-white/5`}`,
          children: [(0, jsxRuntime.jsx)(`div`, {
            className: `text-[11px] font-semibold text-white`,
            children: `Sans police`
          }), (0, jsxRuntime.jsx)(`div`, {
            className: `mt-1 text-[9px] text-[#8f989b]`,
            children: `Conduite libre · casse`
          })]
        })]
      }), i && (0, jsxRuntime.jsx)(`p`, {
        className: `mt-2 text-[9px] leading-relaxed text-[#8f989b]`,
        children: `Les chocs abîment la voiture selon la vitesse d'impact : perte de puissance, tenue de route dégradée et fumée du capot.`
      })]
    }), (0, jsxRuntime.jsxs)(`button`, {
      onClick: r,
      className: `lime-button mt-5 flex items-center justify-between px-5 py-4 text-[13px]`,
      children: [`LANCER LA SESSION`, (0, jsxRuntime.jsx)(ArrowUpRightIcon, {
        size: 21
      })]
    }), (0, jsxRuntime.jsx)(`p`, {
      className: `mt-3 text-center text-[9px] tracking-[.08em] text-[#738080]`,
      children: `MONDE OUVERT • CONDUITE LIBRE`
    })]
  });
}
var fE = [{
  name: `Centre-ville`,
  subtitle: `VIRAGES SERRÉS`,
  icon: Building2Icon,
  number: `01`,
  className: `bg-[#233035]`,
  lines: `M-10 80 L150 80 M-10 43 L150 43 M32 -10 L32 140 M76 -10 L76 140 M115 -10 L115 140`
}, {
  name: `Autoroute A9`,
  subtitle: `VITESSE PURE`,
  icon: RouteIcon,
  number: `02`,
  className: `bg-[#32372b]`,
  lines: `M-10 115 L150 -15 M10 135 L170 5 M-30 95 L130 -35`
}, {
  name: `Montagne Kuro`,
  subtitle: `LE PARADIS DU DRIFT`,
  icon: MountainIcon,
  number: `03`,
  className: `bg-[#302e32]`,
  lines: `M-10 100 C90 115 -5 65 75 55 S 15 5 150 5`
}];
function pE() {
  return (0, jsxRuntime.jsxs)(`section`, {
    className: `mt-7`,
    children: [(0, jsxRuntime.jsxs)(`div`, {
      className: `mb-3 flex items-center justify-between`,
      children: [(0, jsxRuntime.jsx)(`h3`, {
        className: `eyebrow`,
        children: `Un monde. Trois terrains de jeu.`
      }), (0, jsxRuntime.jsx)(`span`, {
        className: `text-[9px] text-[#626e70]`,
        children: `TOUT EST CONNECTÉ`
      })]
    }), (0, jsxRuntime.jsx)(`div`, {
      className: `grid grid-cols-1 gap-3 sm:grid-cols-3`,
      children: fE.map(e => (0, jsxRuntime.jsxs)(`div`, {
        className: `relative overflow-hidden rounded-xl border border-white/5 p-5 ${e.className}`,
        children: [(0, jsxRuntime.jsxs)(`svg`, {
          className: `absolute -right-5 -top-4 h-36 w-36 opacity-15`,
          viewBox: `0 0 150 140`,
          children: [(0, jsxRuntime.jsx)(`path`, {
            d: e.lines,
            stroke: `#d7ddd1`,
            strokeWidth: `9`,
            fill: `none`
          }), (0, jsxRuntime.jsx)(`path`, {
            d: e.lines,
            stroke: `#101315`,
            strokeWidth: `1`,
            fill: `none`,
            strokeDasharray: `4 5`
          })]
        }), (0, jsxRuntime.jsxs)(`div`, {
          className: `relative flex items-center justify-between`,
          children: [(0, jsxRuntime.jsx)(e.icon, {
            size: 20,
            className: `text-[#c6d0c5]`
          }), (0, jsxRuntime.jsx)(`span`, {
            className: `font-heading text-2xl text-white/20`,
            children: e.number
          })]
        }), (0, jsxRuntime.jsx)(`h3`, {
          className: `relative mt-6 font-heading text-[25px] font-semibold`,
          children: e.name
        }), (0, jsxRuntime.jsx)(`p`, {
          className: `relative mt-1 text-[8px] tracking-[.16em] text-[#98a39d]`,
          children: e.subtitle
        })]
      }, e.number))
    })]
  });
}
function mE({
  progress: e,
  car: t,
  engine: n,
  onGarage: r,
  onStart: i,
  muted: a,
  onMute: o,
  noPolice: s,
  onToggleNoPolice: c
}) {
  return (0, jsxRuntime.jsxs)(`div`, {
    className: `nightshift subtle-grid`,
    children: [(0, jsxRuntime.jsx)(om, {
      progress: e,
      muted: a,
      onMute: o
    }), (0, jsxRuntime.jsxs)(`main`, {
      className: `mx-auto max-w-[1440px] px-5 pb-5 pt-8 md:px-10 md:pt-10`,
      children: [(0, jsxRuntime.jsxs)(`div`, {
        className: `mb-7 flex items-end justify-between`,
        children: [(0, jsxRuntime.jsxs)(`div`, {
          children: [(0, jsxRuntime.jsxs)(`div`, {
            className: `mb-3 flex items-center gap-2`,
            children: [(0, jsxRuntime.jsx)(`span`, {
              className: `h-1.5 w-1.5 rounded-full bg-[#c6dc77]`
            }), (0, jsxRuntime.jsx)(`span`, {
              className: `eyebrow !text-[#b3c578]`,
              children: `LE GARAGE / SESSION LIBRE`
            })]
          }), (0, jsxRuntime.jsxs)(`h1`, {
            className: `race-title text-5xl md:text-[64px]`,
            children: [`LA NUIT VOUS `, (0, jsxRuntime.jsx)(`span`, {
              className: `text-[#c6dc77]`,
              children: `APPARTIENT.`
            })]
          }), (0, jsxRuntime.jsx)(`p`, {
            className: `mt-3 text-[12px] leading-6 text-[#8f989b]`,
            children: `Trouvez votre trajectoire. Faites monter le score. Semez la police.`
          })]
        }), (0, jsxRuntime.jsxs)(`div`, {
          className: `hidden items-center gap-3 pb-1 md:flex`,
          children: [(0, jsxRuntime.jsx)(TrophyIcon, {
            size: 20,
            className: `text-[#8b967c]`
          }), (0, jsxRuntime.jsxs)(`div`, {
            children: [(0, jsxRuntime.jsx)(`p`, {
              className: `eyebrow !text-[8px]`,
              children: `Meilleur drift`
            }), (0, jsxRuntime.jsxs)(`p`, {
              className: `mt-1 text-sm font-semibold`,
              children: [Math.floor(e.best).toLocaleString(`fr-FR`), ` `, (0, jsxRuntime.jsx)(`span`, {
                className: `text-[10px] font-normal text-[#748081]`,
                children: `PTS`
              })]
            })]
          })]
        })]
      }), (0, jsxRuntime.jsxs)(`div`, {
        className: `grid gap-5 lg:grid-cols-[1fr_350px]`,
        children: [(0, jsxRuntime.jsxs)(`div`, {
          className: `relative min-h-[350px] overflow-hidden rounded-2xl border border-white/10 bg-[#171b1e] md:min-h-[430px]`,
          children: [(0, jsxRuntime.jsx)(uE, {
            car: t
          }), (0, jsxRuntime.jsxs)(`div`, {
            className: `absolute left-6 top-6`,
            children: [(0, jsxRuntime.jsx)(`p`, {
              className: `eyebrow !text-[9px]`,
              children: `SÉLECTION ACTUELLE`
            }), (0, jsxRuntime.jsx)(`h2`, {
              className: `race-title mt-2 text-[40px]`,
              children: t.name.toUpperCase()
            }), (0, jsxRuntime.jsxs)(`span`, {
              className: `mt-3 inline-block rounded border border-white/15 bg-[#101315]/60 px-2 py-1 text-[9px] tracking-[.14em] text-[#aab4b5]`,
              children: [n.id, ` • PROPULSION`]
            })]
          }), (0, jsxRuntime.jsx)(`div`, {
            className: `absolute right-6 top-6 flex gap-1.5`,
            children: [t.color, `#13181b`, `#c6dc77`].map((e, t) => (0, jsxRuntime.jsx)(`span`, {
              className: `h-3 w-3 rounded-full ${t === 0 ? `ring-1 ring-white/40 ring-offset-2 ring-offset-[#171b1e]` : ``}`,
              style: {
                background: e
              }
            }, t))
          }), (0, jsxRuntime.jsxs)(`div`, {
            className: `absolute bottom-6 left-6 right-6 flex items-center justify-between`,
            children: [(0, jsxRuntime.jsxs)(`span`, {
              className: `text-[9px] tracking-[.12em] text-[#8e999b]`,
              children: [`01 / `, String(e.cars.length).padStart(2, `0`), ` VÉHICULES DÉBLOQUÉS`]
            }), (0, jsxRuntime.jsxs)(`button`, {
              onClick: () => r(`cars`),
              className: `flex items-center gap-2 text-[10px] text-[#c6dc77]`,
              children: [`OUVRIR LE GARAGE`, (0, jsxRuntime.jsx)(ArrowUpRightIcon, {
                size: 15
              })]
            })]
          })]
        }), (0, jsxRuntime.jsx)(dE, {
          car: t,
          engine: n,
          onGarage: r,
          onStart: i,
          noPolice: s,
          onToggleNoPolice: c
        })]
      }), (0, jsxRuntime.jsx)(pE, {}), (0, jsxRuntime.jsxs)(`footer`, {
        className: `mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5`,
        children: [(0, jsxRuntime.jsxs)(`div`, {
          className: `flex flex-wrap items-center gap-4 text-[9px] text-[#818d90]`,
          children: [(0, jsxRuntime.jsxs)(`span`, {
            className: `flex items-center gap-2`,
            children: [(0, jsxRuntime.jsx)(`kbd`, {
              className: `race-key`,
              children: `Z Q S D`
            }), ` / FLÈCHES • CONDUIRE`]
          }), (0, jsxRuntime.jsxs)(`span`, {
            className: `flex items-center gap-2`,
            children: [(0, jsxRuntime.jsx)(`kbd`, {
              className: `race-key`,
              children: `ESPACE`
            }), ` FREIN À MAIN`]
          }), (0, jsxRuntime.jsxs)(`span`, {
            className: `flex items-center gap-2`,
            children: [(0, jsxRuntime.jsx)(`kbd`, {
              className: `race-key`,
              children: `E`
            }), ` STATION`]
          }), (0, jsxRuntime.jsxs)(`span`, {
            className: `flex items-center gap-2`,
            children: [(0, jsxRuntime.jsx)(`kbd`, {
              className: `race-key`,
              children: `ESC`
            }), ` PAUSE`]
          })]
        }), (0, jsxRuntime.jsxs)(`div`, {
          className: `flex items-center gap-2 text-[9px] text-[#7e8986]`,
          children: [(0, jsxRuntime.jsx)(ShieldAlertIcon, {
            size: 13
          }), (0, jsxRuntime.jsx)(`span`, {
            children: `LES RUES N'ONT PAS DE RÈGLES. LA POLICE, SI.`
          })]
        })]
      })]
    })]
  });
}
function hE({
  type: e,
  progress: t,
  onSelect: n,
  onClose: r,
  station: i = !1
}) {
  let a = e === `cars`,
    o = a ? t.cars : t.engines,
    s = a ? t.car : t.engine,
    c = (a ? Qp : tm).filter(e => !i || o.includes(e.id));
  return (0, jsxRuntime.jsx)(`div`, {
    className: `fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md`,
    role: `dialog`,
    "aria-modal": `true`,
    "aria-label": a ? `Garage` : `Atelier moteur`,
    children: (0, jsxRuntime.jsxs)(`div`, {
      className: `w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#171c1f] shadow-2xl`,
      children: [(0, jsxRuntime.jsxs)(`div`, {
        className: `flex items-center justify-between border-b border-white/10 p-6`,
        children: [(0, jsxRuntime.jsxs)(`div`, {
          children: [(0, jsxRuntime.jsx)(`p`, {
            className: `eyebrow text-[#c6dc77]`,
            children: i ? `STATION-SERVICE • ÉCHANGE RAPIDE` : `NIGHTSHIFT / GARAGE`
          }), (0, jsxRuntime.jsx)(`h2`, {
            className: `race-title mt-2 text-4xl`,
            children: a ? `CHOISISSEZ VOTRE VOITURE.` : `CHOISISSEZ VOTRE MOTEUR.`
          })]
        }), (0, jsxRuntime.jsx)(`button`, {
          onClick: r,
          "aria-label": `Fermer`,
          className: `rounded-lg p-2 text-[#929b9d] hover:bg-white/5`,
          children: (0, jsxRuntime.jsx)(XIcon, {
            size: 22
          })
        })]
      }), (0, jsxRuntime.jsx)(`div`, {
        className: `max-h-[65vh] overflow-y-auto p-5`,
        children: (0, jsxRuntime.jsx)(`div`, {
          className: `grid gap-3 sm:grid-cols-2`,
          children: c.map(e => {
            let r = o.includes(e.id),
              i = s === e.id;
            return (0, jsxRuntime.jsxs)(`div`, {
              className: `rounded-xl border p-5 ${i ? `border-[#c6dc77]/60 bg-[#c6dc77]/5` : `border-white/10 bg-[#202629]`}`,
              children: [(0, jsxRuntime.jsxs)(`div`, {
                className: `flex items-center justify-between`,
                children: [(0, jsxRuntime.jsx)(`span`, {
                  className: `eyebrow !text-[8px]`,
                  children: a ? e.tag : `${e.hp} CH • ${e.torque} NM`
                }), i ? (0, jsxRuntime.jsx)(CheckIcon, {
                  size: 17,
                  className: `text-[#c6dc77]`
                }) : r ? null : (0, jsxRuntime.jsx)(LockKeyholeIcon, {
                  size: 15,
                  className: `text-[#717c7f]`
                })]
              }), (0, jsxRuntime.jsxs)(`div`, {
                className: `mt-4 flex items-center gap-3`,
                children: [a ? (0, jsxRuntime.jsx)(`div`, {
                  className: `h-5 w-9 -skew-x-12 rounded-sm border-b-4 border-black/40`,
                  style: {
                    background: e.color
                  }
                }) : (0, jsxRuntime.jsx)(`span`, {
                  className: `font-heading text-3xl font-bold text-[#c6dc77]`,
                  children: e.id
                }), (0, jsxRuntime.jsx)(`h3`, {
                  className: `font-heading text-2xl font-semibold`,
                  children: e.name
                })]
              }), (0, jsxRuntime.jsx)(`p`, {
                className: `mt-3 min-h-9 text-[11px] leading-relaxed text-[#929d9f]`,
                children: e.description
              }), (0, jsxRuntime.jsxs)(`button`, {
                disabled: i || !r && t.credits < e.price,
                onClick: () => n(e.id),
                className: `mt-4 flex w-full items-center justify-between rounded-lg px-4 py-3 text-xs font-semibold ${i ? `bg-white/5 text-[#c6dc77]` : r ? `bg-[#c6dc77] text-[#172010]` : `border border-white/15 text-[#d2d8d4]`}`,
                children: [(0, jsxRuntime.jsx)(`span`, {
                  children: i ? `Équipé` : r ? `Équiper` : `Débloquer • ${e.price.toLocaleString(`fr-FR`)} CR`
                }), i ? (0, jsxRuntime.jsx)(CheckIcon, {
                  size: 14
                }) : (0, jsxRuntime.jsx)(ArrowUpRightIcon, {
                  size: 16
                })]
              })]
            }, e.id);
          })
        })
      }), (0, jsxRuntime.jsxs)(`div`, {
        className: `flex items-center justify-between border-t border-white/10 px-6 py-4 text-[10px] text-[#859194]`,
        children: [(0, jsxRuntime.jsx)(`span`, {
          children: i ? `Le véhicule est remplacé, votre session continue.` : `Gagnez des crédits en driftant et en survivant aux poursuites.`
        }), (0, jsxRuntime.jsxs)(`span`, {
          className: `ml-3 flex shrink-0 items-center gap-2 text-[#c6dc77]`,
          children: [(0, jsxRuntime.jsx)(CoinsIcon, {
            size: 14
          }), t.credits.toLocaleString(`fr-FR`), ` CR`]
        })]
      })]
    })
  });
}
function gE({
  car: e,
  engine: t,
  controls: n,
  onHud: r,
  onFinish: i,
  onStation: a,
  onPause: o,
  noPolice: s
}) {
  let c = (0, React.useRef)(null),
    l = (0, React.useRef)(null),
    u = (0, React.useRef)({
      onHud: r,
      onFinish: i,
      onStation: a,
      onPause: o
    });
  return u.current = {
    onHud: r,
    onFinish: i,
    onStation: a,
    onPause: o
  }, (0, React.useEffect)(() => (l.current = lE(c.current, e, t, n, u, s), () => l.current.dispose()), []), (0, React.useEffect)(() => {
    l.current?.setCar(e);
  }, [e.id]), (0, jsxRuntime.jsx)(`div`, {
    ref: c,
    className: `absolute inset-0`
  });
}
function _E({
  hud: e
}) {
  let t = e => (e + 180) / 395 * 140 + 10,
    n = e => (e + 530) / 730 * 145 + 8;
  return (0, jsxRuntime.jsxs)(`div`, {
    className: `hud-glass hidden w-[165px] p-3 sm:block`,
    children: [(0, jsxRuntime.jsx)(`div`, {
      className: `mb-2 text-[9px] font-semibold uppercase tracking-widest text-[#a0b0b0]`,
      children: e.zone
    }), (0, jsxRuntime.jsxs)(`svg`, {
      viewBox: `0 0 160 165`,
      className: `h-[160px] w-full`,
      children: [(0, jsxRuntime.jsx)(`rect`, {
        width: `160`,
        height: `165`,
        rx: `6`,
        fill: `#1d2d2d`
      }), (0, jsxRuntime.jsx)(`path`, {
        d: `M122 3 V161 M48 5 C5 30 79 42 40 64 S75 76 67 82`,
        stroke: `#75878b`,
        strokeWidth: `4`,
        fill: `none`
      }), [-100, -50, 0, 50, 100].map(e => (0, jsxRuntime.jsx)(`g`, {
        children: (0, jsxRuntime.jsx)(`path`, {
          d: `M${t(e)} ${n(-150)}V${n(150)} M${t(-135)} ${n(e)}H${t(130)}`,
          stroke: `#718184`,
          strokeWidth: `2`
        })
      }, e)), nm.map((e, r) => (0, jsxRuntime.jsx)(`rect`, {
        x: t(e.x) - 2,
        y: n(e.z) - 2,
        width: `4`,
        height: `4`,
        fill: `#c6dc77`
      }, r)), e.police?.map((r, i) => (0, jsxRuntime.jsx)(`circle`, {
        cx: t(r.x),
        cy: n(r.z),
        r: `2.5`,
        fill: e.wanted > .15 ? `#f77d69` : `#77b5f7`
      }, i)), (0, jsxRuntime.jsxs)(`g`, {
        transform: `translate(${t(e.x)} ${n(e.z)}) rotate(${-e.heading * 180 / Math.PI})`,
        children: [(0, jsxRuntime.jsx)(`circle`, {
          r: `7`,
          fill: `#c6dc77`,
          opacity: `.15`
        }), (0, jsxRuntime.jsx)(`path`, {
          d: `M0 -5 L3 4 L0 2 L-3 4Z`,
          fill: `#e8f7b8`
        })]
      })]
    }), (0, jsxRuntime.jsxs)(`div`, {
      className: `mt-2 flex justify-between text-[7px] tracking-wider text-[#93a39b]`,
      children: [(0, jsxRuntime.jsx)(`span`, {
        children: `■ STATION`
      }), (0, jsxRuntime.jsx)(`span`, {
        className: `text-[#88b7ef]`,
        children: `● POLICE`
      })]
    })]
  });
}
function vE({
  hud: e
}) {
  return (0, jsxRuntime.jsxs)(`div`, {
    className: `mt-3 flex items-center justify-between border-t border-game-accent/15 pt-3`,
    children: [(0, jsxRuntime.jsx)(`span`, {
      className: `text-[8px] tracking-widest text-primary-foreground/65`,
      children: `BOÎTE AUTO · 7 RAPPORTS`
    }), (0, jsxRuntime.jsxs)(`span`, {
      className: `flex items-baseline gap-1.5 text-game-accent`,
      "aria-label": e.gear === -1 ? `Marche arrière` : `Rapport ${e.gear} sur 7`,
      children: [(0, jsxRuntime.jsx)(`span`, {
        className: `race-title text-3xl tabular-nums`,
        children: e.gear === -1 ? `R` : e.gear
      }), e.gear !== -1 && (0, jsxRuntime.jsx)(`span`, {
        className: `text-[10px] opacity-60`,
        children: `/ 7`
      })]
    })]
  });
}
function yE({
  hud: e,
  engine: t,
  muted: n,
  onMute: r,
  onPause: i,
  onStation: a
}) {
  return (0, jsxRuntime.jsxs)(`div`, {
    className: `pointer-events-none absolute inset-0 z-10 p-4 sm:p-6`,
    children: [(0, jsxRuntime.jsxs)(`div`, {
      className: `flex items-start justify-between`,
      children: [(0, jsxRuntime.jsxs)(`div`, {
        className: `hud-glass px-4 py-3`,
        children: [(0, jsxRuntime.jsxs)(`div`, {
          className: `eyebrow !text-[#c6dc77]`,
          children: [`NIGHTSHIFT / `, e.zone]
        }), (0, jsxRuntime.jsxs)(`div`, {
          className: `mt-2 flex items-baseline gap-2`,
          children: [(0, jsxRuntime.jsx)(`span`, {
            className: `race-title text-4xl`,
            children: Math.floor(e.score).toLocaleString(`fr-FR`)
          }), (0, jsxRuntime.jsx)(`span`, {
            className: `text-[9px] text-[#879b9c]`,
            children: `PTS DRIFT`
          })]
        })]
      }), (0, jsxRuntime.jsxs)(`div`, {
        className: `flex flex-col items-end gap-3`,
        children: [(0, jsxRuntime.jsxs)(`div`, {
          className: `pointer-events-auto flex gap-2`,
          children: [(0, jsxRuntime.jsx)(`button`, {
            onClick: r,
            className: `hud-glass p-3`,
            "aria-label": `Activer ou couper le son`,
            children: n ? (0, jsxRuntime.jsx)(VolumeXIcon, {
              size: 17
            }) : (0, jsxRuntime.jsx)(Volume2Icon, {
              size: 17
            })
          }), (0, jsxRuntime.jsx)(`button`, {
            onClick: i,
            className: `hud-glass p-3`,
            "aria-label": `Pause`,
            children: (0, jsxRuntime.jsx)(PauseIcon, {
              size: 17
            })
          })]
        }), (0, jsxRuntime.jsxs)(`div`, {
          className: `hud-glass px-3 py-2`,
          children: [(0, jsxRuntime.jsx)(`div`, {
            className: `flex gap-1.5`,
            children: [1, 2, 3, 4, 5].map(t => (0, jsxRuntime.jsx)(StarIcon, {
              size: 18,
              fill: Math.ceil(e.wanted) >= t ? `#f2ad73` : `transparent`,
              className: Math.ceil(e.wanted) >= t ? `text-[#f2ad73]` : `text-[#637177]`
            }, t))
          }), e.escape > 0 && e.wanted > .15 && (0, jsxRuntime.jsxs)(`p`, {
            className: `mt-2 text-[9px] text-[#c6dc77]`,
            children: [`ÉVASION DANS `, Math.ceil(5 - e.escape), ` S`]
          })]
        })]
      })]
    }), e.audioLoading && (0, jsxRuntime.jsxs)(`div`, {
      role: `status`,
      className: `hud-glass absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-4 text-center text-xs text-primary-foreground`,
      children: [(0, jsxRuntime.jsx)(`span`, {
        className: `mb-3 block h-5 w-5 animate-spin rounded-full border-2 border-game-accent/25 border-t-game-accent mx-auto`
      }), `Chargement du son moteur…`]
    }), e.drifting && (0, jsxRuntime.jsxs)(`div`, {
      className: `absolute left-1/2 top-[28%] -translate-x-1/2 text-center`,
      children: [(0, jsxRuntime.jsxs)(`span`, {
        className: `race-title text-6xl italic text-[#c6dc77] drop-shadow-lg`,
        children: [`DRIFT ×`, e.combo]
      }), (0, jsxRuntime.jsx)(`p`, {
        className: `mt-2 text-[10px] font-bold tracking-[.3em] text-white`,
        children: `GARDEZ L'ANGLE.`
      })]
    }), e.arrest > 0 && (0, jsxRuntime.jsxs)(`div`, {
      className: `absolute left-1/2 top-36 w-60 -translate-x-1/2 rounded-lg bg-[#301c1dee] p-3 text-center`,
      children: [(0, jsxRuntime.jsxs)(`div`, {
        className: `text-[10px] font-bold tracking-widest text-[#ff827a]`,
        children: [`PRISON DANS `, Math.ceil(5 - (e.arrestTimer || 0)), ` S`]
      }), (0, jsxRuntime.jsx)(`div`, {
        className: `game-meter mt-2`,
        children: (0, jsxRuntime.jsx)(`div`, {
          className: `bg-[#f87970]`,
          style: {
            width: `${e.arrest}%`
          }
        })
      })]
    }), !e.onFoot && e.station >= 0 && (0, jsxRuntime.jsxs)(`button`, {
      onClick: a,
      className: `pointer-events-auto absolute left-1/2 top-[55%] -translate-x-1/2 rounded-xl border border-[#c6dc77]/40 bg-[#18251eee] px-5 py-4 text-center`,
      children: [(0, jsxRuntime.jsxs)(`div`, {
        className: `flex items-center justify-center gap-2 text-xs font-semibold text-[#c6dc77]`,
        children: [(0, jsxRuntime.jsx)(FuelIcon, {
          size: 16
        }), `RAVITAILLEMENT • `, Math.round(e.fuel), `%`]
      }), (0, jsxRuntime.jsxs)(`p`, {
        className: `mt-2 text-[10px] text-white`,
        children: [(0, jsxRuntime.jsx)(`kbd`, {
          className: `race-key`,
          children: `E`
        }), ` Changer de voiture`]
      })]
    }), e.onFoot && (0, jsxRuntime.jsxs)(`div`, {
      className: `absolute left-1/2 top-24 -translate-x-1/2 rounded-lg bg-[#18251eee] px-4 py-2 text-xs text-[#c6dc77] border border-[#c6dc77]/30`,
      children: [`À PIED • Approchez-vous d'un véhicule et appuyez sur `, (0, jsxRuntime.jsx)(`kbd`, {
        className: `race-key`,
        children: `F`
      })]
    }), e.onFoot && (e.shop >= 0 || e.store >= 0) && (0, jsxRuntime.jsx)(`div`, {
      className: `absolute left-1/2 top-36 -translate-x-1/2 rounded-lg border border-[#c6dc77]/30 bg-[#18251eee] px-4 py-2 text-center text-xs text-[#e8eddf]`,
      children: e.store >= 0 ? `NORTHLINE DÉPANNEUR • Bienvenue, entrez !` : `DÉPANNEUR OUVERT • Traversez la porte pour entrer`
    }), e.fuel === 0 && (0, jsxRuntime.jsx)(`div`, {
      className: `absolute left-1/2 top-24 -translate-x-1/2 rounded-lg bg-[#421e15e6] px-4 py-2 text-xs text-[#ffd0a9]`,
      children: `PANNE SÈCHE • Rejoignez une station`
    }), (0, jsxRuntime.jsx)(`div`, {
      className: `absolute bottom-6 left-6`,
      children: (0, jsxRuntime.jsx)(_E, {
        hud: e
      })
    }), (0, jsxRuntime.jsxs)(`div`, {
      className: `hud-glass absolute bottom-6 right-6 w-48 p-4 sm:w-56`,
      children: [(0, jsxRuntime.jsxs)(`div`, {
        className: `flex items-end justify-between`,
        children: [(0, jsxRuntime.jsx)(`span`, {
          className: `race-title text-6xl tabular-nums`,
          children: e.speed
        }), (0, jsxRuntime.jsxs)(`div`, {
          className: `pb-1 text-right`,
          children: [(0, jsxRuntime.jsx)(`div`, {
            className: `text-[10px] text-[#a2b5b7]`,
            children: `KM/H`
          }), (0, jsxRuntime.jsx)(`div`, {
            className: `mt-1 text-xs font-semibold text-[#c6dc77]`,
            children: t.id
          })]
        })]
      }), (0, jsxRuntime.jsx)(vE, {
        hud: e
      }), (0, jsxRuntime.jsx)(`div`, {
        className: `mt-3 flex gap-1`,
        children: Array.from({
          length: 16
        }, (t, n) => (0, jsxRuntime.jsx)(`div`, {
          className: `h-2 flex-1 rounded-sm ${e.rpm / (e.redline || 8e3) > n / 16 ? n > 12 ? `bg-[#ed8974]` : `bg-[#c6dc77]` : `bg-white/10`}`
        }, n))
      }), (0, jsxRuntime.jsxs)(`div`, {
        className: `mt-2 flex justify-between text-[8px] text-[#a0adb0]`,
        children: [(0, jsxRuntime.jsxs)(`span`, {
          children: [e.rpm, ` RPM`]
        }), (0, jsxRuntime.jsx)(`span`, {
          children: `PROPULSION`
        })]
      }), (0, jsxRuntime.jsxs)(`div`, {
        className: `mt-4 flex items-center gap-2`,
        children: [(0, jsxRuntime.jsx)(FuelIcon, {
          size: 13,
          className: e.fuel < 20 ? `text-[#ed8974]` : `text-[#a5b6ac]`
        }), (0, jsxRuntime.jsx)(`div`, {
          className: `game-meter flex-1`,
          children: (0, jsxRuntime.jsx)(`div`, {
            className: e.fuel < 20 ? `bg-[#ed8974]` : `bg-[#c6dc77]`,
            style: {
              width: `${e.fuel}%`
            }
          })
        }), (0, jsxRuntime.jsxs)(`span`, {
          className: `w-8 text-right text-[9px]`,
          children: [Math.round(e.fuel), `%`]
        })]
      }), (0, jsxRuntime.jsxs)(`div`, {
        className: `mt-3 flex items-center gap-2`,
        children: [(0, jsxRuntime.jsx)(ShieldIcon, {
          size: 13,
          className: `text-[#a5b6ac]`
        }), (0, jsxRuntime.jsx)(`div`, {
          className: `game-meter flex-1`,
          children: (0, jsxRuntime.jsx)(`div`, {
            className: e.health < 30 ? `bg-[#ed8974]` : `bg-[#97b1c4]`,
            style: {
              width: `${e.health}%`
            }
          })
        }), (0, jsxRuntime.jsxs)(`span`, {
          className: `w-8 text-right text-[9px]`,
          children: [Math.round(e.health), `%`]
        })]
      })]
    })]
  });
}
function bE({
  controls: e
}) {
  let t = (0, React.useRef)({}),
    n = (n, r) => {
      let i = t.current;
      r ? (i[n] = (i[n] || 0) + 1, e.current.keys[n] = !0) : (i[n] = Math.max(0, (i[n] || 0) - 1), i[n] <= 0 && delete e.current.keys[n]);
    },
    r = e => ({
      onTouchStart: t => {
        t.preventDefault(), n(e, !0);
      },
      onTouchEnd: t => {
        t.preventDefault(), n(e, !1);
      },
      onTouchCancel: () => n(e, !1),
      onContextMenu: e => e.preventDefault()
    });
  return (0, jsxRuntime.jsxs)(`div`, {
    className: `touch-controls pointer-events-none absolute bottom-52 left-3 right-3 z-20 flex items-end justify-between gap-1.5 sm:bottom-6 sm:left-52 sm:right-72 xl:hidden`,
    children: [(0, jsxRuntime.jsxs)(`div`, {
      className: `touch-group pointer-events-auto flex gap-1.5`,
      children: [(0, jsxRuntime.jsx)(`div`, {
        className: `touch-button`,
        role: `button`,
        "aria-label": `Tourner à gauche`,
        ...r(`ArrowLeft`),
        children: (0, jsxRuntime.jsx)(ArrowLeftIcon, {})
      }), (0, jsxRuntime.jsx)(`div`, {
        className: `touch-button`,
        role: `button`,
        "aria-label": `Tourner à droite`,
        ...r(`ArrowRight`),
        children: (0, jsxRuntime.jsx)(ArrowRightIcon, {})
      })]
    }), (0, jsxRuntime.jsxs)(`div`, {
      className: `touch-group pointer-events-auto flex gap-1.5`,
      children: [(0, jsxRuntime.jsx)(`div`, {
        className: `touch-button !w-12 text-[9px] font-bold`,
        role: `button`,
        ...r(`Space`),
        children: `DRIFT`
      }), (0, jsxRuntime.jsx)(`div`, {
        className: `touch-button !w-14 text-[9px] font-bold`,
        role: `button`,
        "aria-label": `Sortir ou entrer dans un véhicule`,
        ...r(`KeyF`),
        children: `PIED`
      }), (0, jsxRuntime.jsx)(`div`, {
        className: `touch-button`,
        role: `button`,
        "aria-label": `Freiner`,
        ...r(`ArrowDown`),
        children: (0, jsxRuntime.jsx)(ArrowDownIcon, {})
      }), (0, jsxRuntime.jsx)(`div`, {
        className: `touch-button !border-[#c6dc77]/60 !bg-[#c6dc77]/25`,
        role: `button`,
        "aria-label": `Accélérer`,
        ...r(`ArrowUp`),
        children: (0, jsxRuntime.jsx)(ArrowUpIcon, {})
      })]
    })]
  });
}
function xE({
  result: e,
  onReturn: t
}) {
  let [n, r] = (0, React.useState)(9);
  return (0, React.useEffect)(() => {
    let e = setInterval(() => r(e => e - 1), 1e3);
    return () => clearInterval(e);
  }, []), (0, React.useEffect)(() => {
    n <= 0 && t();
  }, [n, t]), (0, jsxRuntime.jsx)(`div`, {
    className: `absolute inset-0 z-40 flex items-center justify-center bg-[#0c1215]/90 p-5 backdrop-blur-md`,
    children: (0, jsxRuntime.jsxs)(`div`, {
      className: `w-full max-w-md text-center`,
      children: [(0, jsxRuntime.jsx)(`div`, {
        className: `mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#e89978]/30 bg-[#e89978]/10 text-[#e89978]`,
        children: (0, jsxRuntime.jsx)(ShieldAlertIcon, {
          size: 27
        })
      }), (0, jsxRuntime.jsx)(`p`, {
        className: `eyebrow !text-[#e89978]`,
        children: `FIN DE SESSION`
      }), (0, jsxRuntime.jsx)(`h2`, {
        className: `race-title mt-4 text-6xl`,
        children: e.reason.toUpperCase()
      }), (0, jsxRuntime.jsx)(`p`, {
        className: `mt-4 text-xs text-[#95a0a2]`,
        children: e.reason === `Session terminée` ? `Votre session est enregistrée. À vous la prochaine sortie.` : `La prochaine trajectoire sera la bonne.`
      }), (0, jsxRuntime.jsxs)(`div`, {
        className: `garage-panel mt-8 grid grid-cols-2 divide-x divide-white/10 py-6`,
        children: [(0, jsxRuntime.jsxs)(`div`, {
          children: [(0, jsxRuntime.jsx)(TrophyIcon, {
            className: `mx-auto text-[#c6dc77]`,
            size: 20
          }), (0, jsxRuntime.jsx)(`p`, {
            className: `race-title mt-3 text-4xl`,
            children: Math.floor(e.score).toLocaleString(`fr-FR`)
          }), (0, jsxRuntime.jsx)(`p`, {
            className: `eyebrow mt-2 !text-[8px]`,
            children: `POINTS DE DRIFT`
          })]
        }), (0, jsxRuntime.jsxs)(`div`, {
          children: [(0, jsxRuntime.jsx)(CoinsIcon, {
            className: `mx-auto text-[#c6dc77]`,
            size: 20
          }), (0, jsxRuntime.jsxs)(`p`, {
            className: `race-title mt-3 text-4xl`,
            children: [`+`, e.credits.toLocaleString(`fr-FR`)]
          }), (0, jsxRuntime.jsx)(`p`, {
            className: `eyebrow mt-2 !text-[8px]`,
            children: `CRÉDITS GAGNÉS`
          })]
        })]
      }), (0, jsxRuntime.jsxs)(`button`, {
        onClick: t,
        className: `lime-button mt-6 flex w-full items-center justify-between p-4 text-xs`,
        children: [`RETOURNER AU GARAGE`, (0, jsxRuntime.jsx)(ArrowUpRightIcon, {
          size: 20
        })]
      }), (0, jsxRuntime.jsxs)(`p`, {
        className: `mt-4 text-[10px] text-[#738084]`,
        children: [`Retour automatique dans `, Math.max(0, n), ` secondes`]
      })]
    })
  });
}
function SE({
  onResume: e,
  onEnd: t
}) {
  return (0, jsxRuntime.jsx)(`div`, {
    className: `absolute inset-0 z-40 flex items-center justify-center bg-[#0c1215]/80 p-6 backdrop-blur-md`,
    children: (0, jsxRuntime.jsxs)(`div`, {
      className: `w-full max-w-sm`,
      children: [(0, jsxRuntime.jsx)(`p`, {
        className: `eyebrow !text-[#c6dc77]`,
        children: `NIGHTSHIFT / SESSION`
      }), (0, jsxRuntime.jsx)(`h2`, {
        className: `race-title mb-8 mt-3 text-6xl`,
        children: `UNE PAUSE.`
      }), (0, jsxRuntime.jsxs)(`button`, {
        onClick: e,
        className: `lime-button flex w-full items-center justify-between p-4 text-xs`,
        children: [`REPRENDRE`, (0, jsxRuntime.jsx)(PlayIcon, {
          size: 17
        })]
      }), (0, jsxRuntime.jsxs)(`button`, {
        onClick: t,
        className: `mt-3 flex w-full items-center justify-between rounded-lg border border-white/15 p-4 text-xs text-[#c6cdce]`,
        children: [`TERMINER LA SESSION`, (0, jsxRuntime.jsx)(LogOutIcon, {
          size: 17
        })]
      }), (0, jsxRuntime.jsx)(`p`, {
        className: `mt-4 text-[10px] text-[#849395]`,
        children: `Vos points et vos crédits seront conservés.`
      })]
    })
  });
}
function CE() {
  let [e, t] = (0, React.useState)(rm),
    [n, r] = (0, React.useState)(`lobby`),
    [i, a] = (0, React.useState)(null),
    [o, s] = (0, React.useState)(am),
    [c, l] = (0, React.useState)(null),
    [u, d] = (0, React.useState)(!1),
    [f, p] = (0, React.useState)(!1),
    [m, h] = (0, React.useState)(!1),
    g = (0, React.useRef)({
      keys: {},
      paused: !1,
      muted: !1,
      finished: !1
    }),
    v = Qp.find(t => t.id === e.car) || Qp[0],
    y = tm.find(t => t.id === e.engine) || tm[0];
  (0, React.useEffect)(() => im(e), [e]), (0, React.useEffect)(() => {
    g.current.paused = !!(u || i || c), g.current.paused && (g.current.keys = {});
  }, [u, i, c]), (0, React.useEffect)(() => {
    g.current.muted = f;
  }, [f]);
  let b = () => {
      let e = HT(y);
      e.resume(), g.current = {
        keys: {},
        paused: !1,
        muted: f,
        finished: !1,
        audio: e
      }, s({
        ...am,
        audioLoading: !0
      }), l(null), d(!1), r(`race`);
    },
    x = e => {
      if (c) return;
      g.current.paused = !0, g.current.finished = !0, d(!1), a(null);
      let n = e.credits ?? Math.floor(e.score / 12 + (e.elapsed || 0) * 2);
      t(t => ({
        ...t,
        credits: t.credits + n,
        best: Math.max(t.best, e.score)
      })), l({
        ...e,
        credits: n
      });
    },
    S = () => {
      r(`lobby`), l(null), d(!1), a(null);
    },
    C = () => {
      if (!c) {
        if (i) {
          a(null);
          return;
        }
        d(e => !e);
      }
    };
  return (0, jsxRuntime.jsxs)(`div`, {
    className: `nightshift`,
    children: [n === `lobby` ? (0, jsxRuntime.jsx)(mE, {
      progress: e,
      car: v,
      engine: y,
      onGarage: a,
      onStart: b,
      muted: f,
      onMute: () => p(e => !e),
      noPolice: m,
      onToggleNoPolice: () => h(e => !e)
    }) : (0, jsxRuntime.jsxs)(`div`, {
      className: `relative h-[100dvh] w-full overflow-hidden`,
      children: [(0, jsxRuntime.jsx)(gE, {
        car: v,
        engine: y,
        controls: g,
        onHud: s,
        onFinish: x,
        onStation: () => a(`cars`),
        onPause: C,
        noPolice: m
      }), (0, jsxRuntime.jsx)(yE, {
        hud: o,
        engine: y,
        muted: f,
        onMute: () => p(e => !e),
        onPause: C,
        onStation: () => a(`cars`)
      }), !u && !c && !i && (0, jsxRuntime.jsx)(bE, {
        controls: g
      }), (0, jsxRuntime.jsx)(`div`, {
        className: `pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-[8px] tracking-widest text-white/50 xl:block`,
        children: `ZQSD / WASD / FLÈCHES • CONDUIRE \xA0 ESPACE • DRIFT \xA0 E • STATION \xA0 F • PIED/ENTRER \xA0 ESC • PAUSE`
      }), u && !c && (0, jsxRuntime.jsx)(SE, {
        onResume: () => d(!1),
        onEnd: () => x({
          ...o,
          reason: `Session terminée`
        })
      }), ` `, c && (0, jsxRuntime.jsx)(xE, {
        result: c,
        onReturn: S
      })]
    }), i && (0, jsxRuntime.jsx)(hE, {
      type: i,
      progress: e,
      onSelect: e => {
        let n = i === `cars`,
          r = (n ? Qp : tm).find(t => t.id === e),
          o = n ? `car` : `engine`,
          s = n ? `cars` : `engines`;
        t(t => t[s].includes(e) ? {
          ...t,
          [o]: e
        } : t.credits < r.price ? t : {
          ...t,
          [o]: e,
          [s]: [...t[s], e],
          credits: t.credits - r.price
        }), a(null);
      },
      onClose: () => a(null),
      station: n === `race`
    })]
  });
}
var wE = () => {
  let {
    isLoadingAuth: e,
    isLoadingPublicSettings: t,
    authError: n,
    navigateToLogin: r
  } = Jp();
  if (t || e) return (0, jsxRuntime.jsx)(`div`, {
    className: `fixed inset-0 flex items-center justify-center`,
    children: (0, jsxRuntime.jsx)(`div`, {
      className: `w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin`
    })
  });
  if (n) {
    if (n.type === `user_not_registered`) return (0, jsxRuntime.jsx)(Yp, {});
    if (n.type === `auth_required`) return r(), null;
  }
  return (0, jsxRuntime.jsxs)(Routes, {
    children: [(0, jsxRuntime.jsx)(Route, {
      path: `/`,
      element: (0, jsxRuntime.jsx)(CE, {})
    }), (0, jsxRuntime.jsx)(Route, {
      path: `*`,
      element: (0, jsxRuntime.jsx)(Gp, {})
    })]
  });
};
function TE() {
  return (0, jsxRuntime.jsx)(qp, {
    children: (0, jsxRuntime.jsxs)(QueryClientProvider, {
      client: Sa,
      children: [(0, jsxRuntime.jsxs)(BrowserRouter, {
        children: [(0, jsxRuntime.jsx)(Zp, {}), (0, jsxRuntime.jsx)(wE, {})]
      }), (0, jsxRuntime.jsx)(Zr, {})]
    })
  });
}
ReactDOM.createRoot(document.getElementById(`root`)).render((0, jsxRuntime.jsx)(TE, {}));