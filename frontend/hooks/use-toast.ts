import { toast as sonnerToast } from 'sonner'

export function useToast() {
  return {
    toast: {
      success: (message: string) => sonnerToast.success(message),
      error: (message: string) => sonnerToast.error(message),
      loading: (message: string) => sonnerToast.loading(message),
      promise: (promise: Promise<any>, messages: any) => sonnerToast.promise(promise, messages),
      info: (message: string) => sonnerToast.info(message),
      dismiss: () => sonnerToast.dismiss(),
    },
  }
}
