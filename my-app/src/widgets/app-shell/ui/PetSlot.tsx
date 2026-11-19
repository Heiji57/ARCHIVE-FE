import { useServerFeature } from "@/shared/lib/serverFeatures";
import { useShell } from "../model/shellSlots";
import { PetPopover } from "@/widgets/pet";

/**
 * 빗금이(AI 펫) 자리. 셸이 늘 그린다.
 * - `useServerFeature("ai")` 가 false면 숨긴다.
 * - AI 탭에서는 화면 자체가 비서이므로 펫을 숨긴다.
 */
export function PetSlot() {
  const aiEnabled = useServerFeature("ai");
  const { route } = useShell();

  // AI 탭 자체 + AI 비활성화 시 숨김
  if (!aiEnabled || route === "ai") return null;

  return <PetPopover />;
}
