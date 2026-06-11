import type { AppRoute } from "@/app/model/types";
import { TodoBoard } from "@/widgets/todo-board";

export function TodosPage({
  onNavigate,
}: {
  onNavigate: (route: AppRoute) => void;
}) {
  return <TodoBoard onNavigate={onNavigate} />;
}
