export type TaskStatus = "done" | "in-progress" | "not-start";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  dateKey: string;
  createdAt: string;
  status: TaskStatus;
  description: string;
}
