import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  CarouselWidgetConfig,
  ImageWidgetConfig,
} from "@/domains/quiz/types/builder.types";
import { getMediaImageSrc } from "./media-source.utils";
import {
  getMediaBorderRadiusClass,
  getMediaWidthClass,
} from "./media-widget-styles.utils";
import { parseVideoEmbedInput } from "./video-embed.utils";
import { parseWidgetConfig } from "./widget-config.utils";

describe("media-source.utils", () => {
  it("resolves url and filePath sources", () => {
    assert.equal(
      getMediaImageSrc({ sourceType: "url", url: "https://example.com/a.png" }),
      "https://example.com/a.png",
    );
    assert.equal(
      getMediaImageSrc({ sourceType: "file", filePath: "ws/q/media/x.png" }),
      null,
    );
  });
});

describe("media-widget-styles.utils", () => {
  it("maps width and radius tokens", () => {
    assert.equal(getMediaWidthClass("full"), "w-full");
    assert.equal(getMediaBorderRadiusClass("xl"), "rounded-2xl");
  });
});

describe("video-embed.utils", () => {
  it("accepts youtube iframe and rejects unknown hosts", () => {
    const parsed = parseVideoEmbedInput(
      '<iframe src="https://www.youtube.com/embed/abc123"></iframe>',
    );
    assert.ok(parsed?.src.includes("youtube.com"));

    assert.equal(parseVideoEmbedInput("https://evil.example.com/video"), null);
  });
});

describe("parseWidgetConfig media widgets", () => {
  it("parses image widget config with defaults", () => {
    const config = parseWidgetConfig("image", {
      width: "md",
    }) as ImageWidgetConfig;
    assert.equal(config.width, "md");
  });

  it("parses carousel widget config", () => {
    const config = parseWidgetConfig("carousel", {
      autoplay: true,
    }) as CarouselWidgetConfig;
    assert.equal(config.autoplay, true);
    assert.ok(Array.isArray(config.slides));
  });
});
