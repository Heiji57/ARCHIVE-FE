import { createContext } from "react";
import type { ArchiveAppContextValue } from "@/app/model/types";

export const AppContext = createContext<ArchiveAppContextValue | null>(null);
