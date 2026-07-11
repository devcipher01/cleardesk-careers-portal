import { createFileRoute, Outlet } from "@tanstack/react-router";

// Onboarding is a layout-only route — child pages render via Outlet.
// /onboarding        → onboarding.index.tsx (4-step onboarding flow)
// /onboarding/workspace-setup → onboarding.workspace-setup.tsx (static NDA/contract page)
export const Route = createFileRoute("/onboarding")({
  component: () => <Outlet />,
});
