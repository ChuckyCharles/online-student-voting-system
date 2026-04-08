import { Outlet } from "react-router-dom";

export function RequireAuth({ admin: _admin }: { admin?: boolean }) {
  // Dev wiring: don't block routes while we're wiring frontend/backend.
  // Backend can still enforce role-based access where needed.
  return <Outlet />;
}
