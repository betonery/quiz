import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultQuizDesignSettings } from "@/domains/quiz/types/design.types";
import { defaultFlowLayout } from "@/domains/quiz/types/flow.types";
import { SHARE_SNAPSHOT_VERSION } from "@/domains/quiz/types/quiz-share.types";
import {
  buildShareableSnapshot,
  extractShareTokenFromInput,
} from "./quiz-share-export.utils";
import { cloneShareSnapshotForImport } from "./quiz-share-import.utils";
import { defaultQuizSettings } from "@/domains/quiz/utils/quiz-settings.utils";

const stepA = "11111111-1111-1111-1111-111111111111";
const stepB = "22222222-2222-2222-2222-222222222222";
const widgetOptions = "33333333-3333-3333-3333-333333333333";
const widgetButton = "44444444-4444-4444-4444-444444444444";
const optionA = "55555555-5555-5555-5555-555555555555";
const fnWebhook = "66666666-6666-6666-6666-666666666666";
const branchA = "77777777-7777-7777-7777-777777777777";

describe("quiz-share-export.utils", () => {
  it("strips webhook token and integrations", () => {
    const shareable = buildShareableSnapshot({
      sourceTitle: "Funil Teste",
      snapshot: {
        steps: [
          {
            id: stepA,
            quizId: "q1",
            workspaceId: "w1",
            title: "Etapa 1",
            position: 0,
            settings: { showBackButton: false, showProgressBar: true },
          },
        ],
        widgets: [],
        design: defaultQuizDesignSettings,
        flowLayout: {
          ...defaultFlowLayout,
          functionNodes: [
            {
              id: fnWebhook,
              type: "webhook",
              label: "Webhook",
              config: {
                url: "https://example.com/hook",
                method: "POST",
                token: "secret-token",
                variableKeys: ["email"],
              },
            },
          ],
        },
        variables: [],
        settings: {
          integrations: {
            metaPixel: { enabled: true, pixelId: "123" },
          },
          testIntegrationsInPreview: true,
        },
      },
    });

    assert.deepEqual(shareable.settings.integrations, {});
    assert.equal(shareable.flowLayout.functionNodes[0]?.config?.token, "");
    assert.equal(shareable.steps[0]?.quizId, "");
  });

  it("extracts token from share url", () => {
    assert.equal(
      extractShareTokenFromInput("https://app.com/share/abc123token456"),
      "abc123token456",
    );
    assert.equal(
      extractShareTokenFromInput("abc123token456789012"),
      "abc123token456789012",
    );
  });
});

describe("quiz-share-import.utils", () => {
  it("remaps step, widget, option and webhook ids", () => {
    const snapshot = buildShareableSnapshot({
      sourceTitle: "Origem",
      snapshot: {
        steps: [
          {
            id: stepA,
            quizId: "",
            workspaceId: "",
            title: "Etapa 1",
            position: 0,
            settings: { showBackButton: false, showProgressBar: true },
          },
          {
            id: stepB,
            quizId: "",
            workspaceId: "",
            title: "Etapa 2",
            position: 1,
            settings: { showBackButton: false, showProgressBar: true },
          },
        ],
        widgets: [
          {
            id: widgetOptions,
            stepId: stepA,
            workspaceId: "",
            type: "options",
            position: 0,
            config: {
              layout: "list",
              direction: "vertical",
              disposition: "text_only",
              imageSize: "md",
              options: [
                {
                  id: optionA,
                  label: "Sim",
                  imageType: "none",
                  destinationStepId: stepB,
                  validateFields: false,
                },
              ],
              multipleChoice: false,
              required: true,
              autoAdvance: false,
              borderRadius: "md",
              shadow: "none",
              spacing: "md",
              detail: "none",
              variant: "simple",
              backgroundColor: null,
              textColor: null,
              horizontalAlign: "start",
              maxWidth: 100,
              componentId: "cmp-1",
            },
          },
          {
            id: widgetButton,
            stepId: stepB,
            workspaceId: "",
            type: "button",
            position: 0,
            config: {
              label: "Continuar",
              destinationStepId: null,
              horizontalAlign: "center",
              maxWidth: 100,
              componentId: "cmp-2",
            },
          },
        ],
        design: defaultQuizDesignSettings,
        flowLayout: {
          nodePositions: {
            [`step-${stepA}`]: { x: 0, y: 0 },
            [`fn-${fnWebhook}`]: { x: 100, y: 0 },
          },
          functionNodes: [
            {
              id: fnWebhook,
              type: "webhook",
              label: "Webhook",
              config: {
                url: "https://example.com/hook",
                method: "POST",
                token: "",
                variableKeys: ["email"],
              },
            },
            {
              id: "fn-condition",
              type: "condition",
              label: "Condições",
              config: {
                branches: [
                  {
                    id: branchA,
                    comparisons: [
                      {
                        id: "cmp-cond",
                        variableKey: "email",
                        operator: "defined",
                      },
                    ],
                  },
                ],
              },
            },
          ],
          visualEdges: [
            {
              id: "edge-1",
              source: `step-${stepA}`,
              sourceHandle: `opt-${widgetOptions}::${optionA}`,
              target: `step-${stepB}`,
              targetHandle: "step-in",
            },
          ],
        },
        variables: [{ key: "email", valueType: "string" }],
        settings: defaultQuizSettings,
      },
    });

    assert.equal(snapshot.schemaVersion, SHARE_SNAPSHOT_VERSION);

    const imported = cloneShareSnapshotForImport(
      snapshot,
      "new-quiz-id",
      "new-workspace-id",
    );

    assert.equal(imported.steps.length, 2);
    assert.notEqual(imported.steps[0]?.id, stepA);
    assert.equal(imported.widgets[0]?.stepId, imported.steps[0]?.id);

    const optionsWidget = imported.widgets.find((w) => w.type === "options");
    assert.ok(optionsWidget && optionsWidget.type === "options");
    const option = optionsWidget.config.options[0];
    assert.notEqual(option?.id, optionA);
    assert.equal(option?.destinationStepId, imported.steps[1]?.id);

    const webhook = imported.flowLayout.functionNodes.find(
      (n) => n.type === "webhook",
    );
    assert.notEqual(webhook?.id, fnWebhook);
    assert.equal((webhook?.config as { token?: string })?.token, "");

    assert.equal(imported.flowLayout.visualEdges.length, 1);
    assert.match(
      imported.flowLayout.visualEdges[0]?.sourceHandle ?? "",
      /^opt-/,
    );
  });
});
