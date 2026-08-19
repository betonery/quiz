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
  it("accepts youtube iframe", () => {
    const parsed = parseVideoEmbedInput(
      '<iframe src="https://www.youtube.com/embed/abc123"></iframe>',
    );
    assert.equal(parsed?.provider, "youtube");
    assert.ok(parsed?.src.includes("youtube.com"));
  });

  it("accepts iframes de players fora da lista conhecida", () => {
    const panda = parseVideoEmbedInput(
      '<iframe id="panda-a2ed2b16" src="https://player-vz-75cfb162-0fe.tv.pandavideo.com.br/embed/?v=a2ed2b16" style="border:none;" allow="autoplay" allowfullscreen=true width="720" height="360"></iframe>',
    );
    assert.equal(panda?.provider, "panda");
    assert.equal(
      panda?.src,
      "https://player-vz-75cfb162-0fe.tv.pandavideo.com.br/embed/?v=a2ed2b16",
    );

    const custom = parseVideoEmbedInput("https://cdn.exemplo.com.br/player/42");
    assert.equal(custom?.provider, "unknown");
  });

  it("decodifica entidades e resolve URL sem protocolo", () => {
    const entities = parseVideoEmbedInput(
      '<iframe src="https://player.exemplo.com/e?v=1&amp;autoplay=1"></iframe>',
    );
    assert.equal(entities?.src, "https://player.exemplo.com/e?v=1&autoplay=1");

    const protocolRelative = parseVideoEmbedInput(
      '<iframe src="//player.exemplo.com/e/1"></iframe>',
    );
    assert.equal(protocolRelative?.src, "https://player.exemplo.com/e/1");

    assert.equal(
      parseVideoEmbedInput("player.exemplo.com/e/1")?.src,
      "https://player.exemplo.com/e/1",
    );
  });

  it("rejeita esquemas executáveis e entradas que não são endereço", () => {
    assert.equal(
      parseVideoEmbedInput(
        '<iframe src="javascript:alert(document.cookie)"></iframe>',
      ),
      null,
    );
    assert.equal(
      parseVideoEmbedInput(
        '<iframe src="data:text/html,<script>x()</script>">',
      ),
      null,
    );
    assert.equal(parseVideoEmbedInput("meu video favorito"), null);
    assert.equal(parseVideoEmbedInput("   "), null);
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
