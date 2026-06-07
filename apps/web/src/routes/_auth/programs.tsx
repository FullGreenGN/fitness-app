import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/programs")({
  component: () => <Outlet />,
});
