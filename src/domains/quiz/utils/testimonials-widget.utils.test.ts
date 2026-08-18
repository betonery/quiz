import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDefaultTestimonialItem } from "@/domains/quiz/types/media.types";
import {
  clampTestimonialRating,
  getTestimonialImageSrc,
  resolveTestimonialField,
} from "./testimonials-widget.utils";

describe("testimonials-widget.utils", () => {
  it("clamps rating between 1 and 5", () => {
    assert.equal(clampTestimonialRating(0), 1);
    assert.equal(clampTestimonialRating(6), 5);
    assert.equal(clampTestimonialRating(3.4), 3);
    assert.equal(clampTestimonialRating(Number.NaN), 1);
  });

  it("resolves testimonial image from url", () => {
    const item = createDefaultTestimonialItem();
    item.imageType = "url";
    item.url = "https://example.com/avatar.png";
    assert.equal(
      getTestimonialImageSrc(item),
      "https://example.com/avatar.png",
    );
  });

  it("returns null for emoji image type", () => {
    const item = createDefaultTestimonialItem();
    assert.equal(getTestimonialImageSrc(item), null);
  });

  it("resolves template variables in testimonial fields", () => {
    assert.equal(
      resolveTestimonialField("Olá {{nome}}", { nome: "Ana" }),
      "Olá Ana",
    );
  });
});
