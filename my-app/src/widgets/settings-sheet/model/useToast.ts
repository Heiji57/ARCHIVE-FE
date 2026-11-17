import { useCallback } from "react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";

/** 잠깐 뜨는 알림(알림 목록에는 남기지 않는다). 시안의 A.toast. */
export function useToast() {
  const { pushNotification } = useArchiveApp();
  return useCallback(
    (title: string, type: "success" | "info" | "warning" = "info", body = "") =>
      pushNotification(type, title, body, { category: "system", transient: true }),
    [pushNotification],
  );
}
