import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { QuizWidget } from "@/domains/quiz/types/builder.types";
import { defaultInputWidgetConfig } from "@/domains/quiz/types/builder.types";
import { defaultOptionsWidgetConfig } from "@/domains/quiz/types/builder.types";
import { applyStepVariableBindings } from "./player-widget-variables.utils";

describe("player-widget-variables.utils", () => {
  it("binds input and options when leaving a step", () => {
    const widgets: QuizWidget[] = [
      {
        id: "input1",
        stepId: "step1",
        workspaceId: "ws",
        type: "input",
        position: 0,
        config: {
          ...defaultInputWidgetConfig,
          variableKey: "email",
        },
      },
      {
        id: "opt1",
        stepId: "step1",
        workspaceId: "ws",
        type: "options",
        position: 1,
        config: {
          ...defaultOptionsWidgetConfig,
          variableKey: "escolha",
        },
      },
    ];

    const result = applyStepVariableBindings({
      stepId: "step1",
      widgets,
      answers: {
        input1: "user@test.com",
        opt1: widgets[1].config.options[0].id,
      },
      currentVariables: {},
    });

    assert.equal(result.email, "user@test.com");
    assert.equal(result.escolha, "Opção 1");
  });

  it("ignores widgets without variableKey", () => {
    const widgets: QuizWidget[] = [
      {
        id: "input1",
        stepId: "step1",
        workspaceId: "ws",
        type: "input",
        position: 0,
        config: { ...defaultInputWidgetConfig, variableKey: "" },
      },
    ];

    const result = applyStepVariableBindings({
      stepId: "step1",
      widgets,
      answers: { input1: "x" },
      currentVariables: { existing: 1 },
    });

    assert.deepEqual(result, { existing: 1 });
  });

  it("binds multiple-choice options as a label list", () => {
    const widgets: QuizWidget[] = [
      {
        id: "opt1",
        stepId: "step1",
        workspaceId: "ws",
        type: "options",
        position: 0,
        config: {
          ...defaultOptionsWidgetConfig,
          multipleChoice: true,
          variableKey: "interesses",
        },
      },
    ];

    const optionIds = widgets[0].config.options.map((option) => option.id);
    const result = applyStepVariableBindings({
      stepId: "step1",
      widgets,
      answers: {
        opt1: JSON.stringify([optionIds[0], optionIds[1]]),
      },
      currentVariables: {},
    });

    assert.deepEqual(result.interesses, ["Opção 1", "Opção 2"]);
  });
});
