import { toast as sonnerToast } from 'sonner'

export function useToast() {
  return {
    toast: {
      success: (message: string) => sonnerToast.success(message),
      error: (message: string) => sonnerToast.error(message),
      loading: (message: string) => sonnerToast.loading(message),
      promise: (promise: Promise<any>, messages: any) => sonnerToast.promise(promise, messages),
      custom: (message: string) => sonnerToast.custom(message),
      dismiss: () => sonnerToast.dismiss(),
    },
  }
}
