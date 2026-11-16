import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GithubIcon, ICON_STROKE, RetroIcon, SettingsIcon, SparkIcon } from "./index";

const ALL = { GithubIcon, RetroIcon, SettingsIcon, SparkIcon };

describe("shared/ui/icons", () => {
  for (const [name, Icon] of Object.entries(ALL)) {
    it(`${name}: 시안 .i 와 같은 기본값(16px, 24 viewBox, 선 1.7, 장식용)`, () => {
      const html = renderToStaticMarkup(<Icon />);
      expect(html).toContain('width="16"');
      expect(html).toContain('height="16"');
      expect(html).toContain('viewBox="0 0 24 24"');
      expect(html).toContain('fill="none"');
      expect(html).toContain('stroke="currentColor"');
      expect(html).toContain(`stroke-width="${ICON_STROKE}"`);
      expect(html).toContain('aria-hidden="true"');
    });
  }

  it("size 와 나머지 svg 속성을 넘길 수 있다", () => {
    const html = renderToStaticMarkup(<SparkIcon size={20} className="x" aria-hidden={false} aria-label="AI" />);
    expect(html).toContain('width="20"');
    expect(html).toContain('height="20"');
    expect(html).toContain('class="x"');
    expect(html).toContain('aria-label="AI"');
    expect(html).toContain('aria-hidden="false"');
  });

  it("SparkIcon 은 시안 sparkle 경로(직선 네 갈래 별)", () => {
    expect(renderToStaticMarkup(<SparkIcon />)).toContain('d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"');
  });
});
