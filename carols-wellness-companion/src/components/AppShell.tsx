import BottomNav from './BottomNav';
import ClientBoot from './ClientBoot';

/** Wraps authenticated pages: a scrollable content area + persistent bottom nav. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md">
      <ClientBoot />
      <main className="px-4 pb-28 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}
