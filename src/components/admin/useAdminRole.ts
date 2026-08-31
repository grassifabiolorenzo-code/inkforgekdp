import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getMyAdminIdentity } from "@/lib/admin/dashboard.functions";
import type { AdminRole } from "@/lib/adminRbac";

/**
 * Ruolo admin del chiamante, solo per adattare la UI (nascondere/disabilitare controlli).
 * Non è una protezione: ogni server function verifica il permesso lato server comunque.
 */
export function useAdminRole(): AdminRole | undefined {
  const fetchIdentity = useServerFn(getMyAdminIdentity);
  const { data } = useQuery({
    queryKey: ["admin-identity"],
    queryFn: () => fetchIdentity(),
    staleTime: 60_000,
  });
  return data?.role;
}
