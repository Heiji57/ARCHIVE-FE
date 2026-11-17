import { describe, expect, it } from "vitest";
import { PET_ENABLED_KEY, readPetEnabled, writePetEnabled } from "./petEnabled";

function memoryStorage(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    raw: m,
  };
}

describe("petEnabled", () => {
  it("키는 archive.petEnabled", () => {
    expect(PET_ENABLED_KEY).toBe("archive.petEnabled");
  });

  it("저장된 값이 없으면 켜짐(true)", () => {
    expect(readPetEnabled(memoryStorage())).toBe(true);
  });

  it("false 로 쓰면 꺼짐으로 읽는다", () => {
    const s = memoryStorage();
    writePetEnabled(false, s);
    expect(s.raw.get(PET_ENABLED_KEY)).toBe("false");
    expect(readPetEnabled(s)).toBe(false);
    writePetEnabled(true, s);
    expect(readPetEnabled(s)).toBe(true);
  });

  it("저장소를 못 쓰면(사생활 모드 등) 기본값 true", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readPetEnabled(broken)).toBe(true);
    expect(() => writePetEnabled(false, broken)).not.toThrow();
  });
});
