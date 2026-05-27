import { useContext } from "react";
import { AppContext } from "@/app/providers/context";

export function useArchiveApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useArchiveApp must be used inside AppProvider");
  }

  return context;
}
