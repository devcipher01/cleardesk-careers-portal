import { createFileRoute, Outlet } from "@tanstack/react-router";

// Workspace is a layout-only route — all /workspace/* pages render via Outlet.
// Each child page handles its own session check individually.
export const Route = createFileRoute("/workspace")({
  component: () => <Outlet />,
});
