import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseFlowLayout } from "./flow-layout.utils";

describe("flow-layout.utils", () => {
  it("preserves webhook config fields when parsing stored flow layout", () => {
    const layout = parseFlowLayout({
      nodePositions: {},
      functionNodes: [
        {
          id: "wh-1",
          type: "webhook",
          label: "Meu Webhook",
          config: {
            url: "https://example.com/hook",
            method: "POST",
            token: "secret-token",
            variableKeys: ["nome", "email"],
          },
        },
      ],
      visualEdges: [],
    });

    const webhook = layout.functionNodes[0];
    assert.equal(webhook?.type, "webhook");
    assert.deepEqual(webhook?.config, {
      url: "https://example.com/hook",
      method: "POST",
      token: "secret-token",
      variableKeys: ["nome", "email"],
    });
  });

  it("does not coerce webhook config into link config", () => {
    const layout = parseFlowLayout({
      nodePositions: {},
      functionNodes: [
        {
          id: "link-1",
          type: "link",
          label: "Link",
          config: {
            url: "https://example.com/page",
            openInNewWindow: true,
          },
        },
      ],
      visualEdges: [],
    });

    const link = layout.functionNodes[0];
    assert.equal(link?.type, "link");
    assert.deepEqual(link?.config, {
      url: "https://example.com/page",
      openInNewWindow: true,
    });
  });
});
