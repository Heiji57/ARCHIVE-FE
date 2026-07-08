import { useContext } from "react";
import { DndContext, type DndContextValue } from "./dndContext";

export function useDnd(): DndContextValue {
  const ctx = useContext(DndContext);
  if (!ctx) throw new Error("useDnd must be used inside DndProvider");
  return ctx;
}
