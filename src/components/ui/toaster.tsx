import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, className, ...props }) {
        return (
          <Toast
            key={id}
            {...props}
            // ✅ If toast() provides a className, use it, otherwise default styling
            className={`${className ?? "bg-gray-800/90 text-white"} rounded-lg shadow-lg px-4 py-3 flex flex-col gap-2 fixed top-4 right-4 z-[100] max-w-sm break-words`}
          >
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle className="font-semibold">{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose className="text-white hover:text-gray-200" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
