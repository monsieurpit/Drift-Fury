import React from "react";
const TOAST_LIMIT = 20;
const TOAST_REMOVE_DELAY = 1000000;
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}
const toastTimeouts = new Map();
const addToRemoveQueue = (e) => {
  if (toastTimeouts.has(e)) {
    return;
  }
  const t = setTimeout(() => {
    toastTimeouts.delete(e);
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: e,
    });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(e, t);
};
const reducer = (e, t) => {
  switch (t.type) {
    case actionTypes.ADD_TOAST: {
      return {
        ...e,
        toasts: [t.toast, ...e.toasts].slice(0, TOAST_LIMIT),
      };
    }
    case actionTypes.UPDATE_TOAST: {
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
    case actionTypes.DISMISS_TOAST: {
      const { toastId: n } = t;
      if (n) {
        addToRemoveQueue(n);
      } else {
        e.toasts.forEach((e) => {
          addToRemoveQueue(e.id);
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
    case actionTypes.REMOVE_TOAST: {
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
const listeners = [];
let memoryState = {
  toasts: [],
};
function dispatch(e) {
  memoryState = reducer(memoryState, e);
  listeners.forEach((e) => {
    e(memoryState);
  });
}
function toast({ ...e }) {
  const t = genId();
  const n = (e) => {
    return dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: {
        ...e,
        id: t,
      },
    });
  };
  const r = () => {
    return dispatch({
      type: actionTypes.DISMISS_TOAST,
      toastId: t,
    });
  };
  dispatch({
    type: actionTypes.ADD_TOAST,
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
export function useToast() {
  const [e, t] = React.useState(memoryState);
  React.useEffect(() => {
    listeners.push(t);
    return () => {
      const e = listeners.indexOf(t);
      if (e > -1) {
        listeners.splice(e, 1);
      }
    };
  }, [e]);
  return {
    ...e,
    toast: toast,
    dismiss: (e) => {
      return dispatch({
        type: actionTypes.DISMISS_TOAST,
        toastId: e,
      });
    },
  };
}
