import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se il backend non è raggiungibile/configurato in questo ambiente, non
    // deve mai far crashare l'intera pagina: restiamo semplicemente "ospiti".
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      });

      supabase.auth
        .getSession()
        .then(({ data }) => {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));

      return () => sub.subscription.unsubscribe();
    } catch (error) {
      console.error("[auth] inizializzazione non riuscita", error);
      setLoading(false);
      return undefined;
    }
  }, []);

  return { session, user, loading };
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("[auth] logout non riuscito", error);
  }
}
