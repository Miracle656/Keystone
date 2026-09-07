import { useCallback, useRef, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((title: string, body: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ title, body });
    timer.current = setTimeout(() => setToast(null), 3600);
  }, []);

  return { toast, showToast };
}
