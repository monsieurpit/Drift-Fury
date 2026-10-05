import {
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Toast,
} from "./toast.jsx";
import { useToast } from "./use-toast.js";
export function Toaster() {
  const { toasts: e } = useToast();
  return (
    <ToastProvider>
      {e.map(function ({ id: e, title: t, description: n, action: r, ...i }) {
        return (
          <Toast {...i} key={e}>
            <div className="grid gap-1">
              {t && <ToastTitle>{t}</ToastTitle>}
              {n && <ToastDescription>{n}</ToastDescription>}
            </div>
            {r}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
