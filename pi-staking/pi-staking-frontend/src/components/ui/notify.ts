import { toast } from 'sonner';

export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast(message),
  promise: <T>(p: Promise<T>, messages: { loading: string; success: string; error: string }) =>
    toast.promise(p, { loading: messages.loading, success: messages.success, error: messages.error }),
};
