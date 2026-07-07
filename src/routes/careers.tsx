import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Layout route: child routes (apply, assessment, role detail) render in Outlet. */
export const Route = createFileRoute("/careers")({
  component: CareersLayout,
});

function CareersLayout() {
  return <Outlet />;
}
