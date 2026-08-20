import { useEffect, useMemo, useState } from "react";
import { navigationEvent } from "../shared/helpers";
export function usePrototypeSearch() {
  const [search, setSearch] = useState(() => window.location.search);
  useEffect(() => {
    const update = () => setSearch(window.location.search);
    window.addEventListener("popstate", update);
    window.addEventListener(navigationEvent, update);
    return () => { window.removeEventListener("popstate", update); window.removeEventListener(navigationEvent, update); };
  }, []);
  return search;
}
