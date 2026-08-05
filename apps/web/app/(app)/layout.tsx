import { RouterModalProvider } from "@/components/app/RouterModalProvider";

// No shared theme/nav here — each screen owns its own per its own mockup (Trade is a dark
// pro terminal, Earn is a light savings page, etc.). Only the deposit/withdraw modal is truly
// shared chrome, so this layout's only job is providing that.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <RouterModalProvider>{children}</RouterModalProvider>;
}
