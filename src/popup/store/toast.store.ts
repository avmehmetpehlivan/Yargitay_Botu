import { create } from 'zustand';

interface Toast {
  id: number;
  msg: string;
}

interface ToastState {
  toasts: Toast[];
  push: (msg: string) => void;
  dismiss: (id: number) => void;
}

let seq = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (msg) => {
    const id = ++seq;
    set({ toasts: [...get().toasts, { id, msg }] });
    setTimeout(() => get().dismiss(id), 2600);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
