import { useTranslation } from "@/shared/lib/i18n";
import { ShellPage } from "@/widgets/app-shell";
import { TodoBoard } from "@/widgets/todo-board";

export function TodosPage() {
  const { t } = useTranslation();
  return (
    <ShellPage rail toolbar={<h1 className="sh-title">{t("shell.tab.todos")}</h1>}>
      <TodoBoard />
    </ShellPage>
  );
}
