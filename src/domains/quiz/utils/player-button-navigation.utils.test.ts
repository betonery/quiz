import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultOptionsWidgetConfig } from "@/domains/quiz/types/builder.types";
import { findSingleChoiceOptionNavigationHandle } from "./player-button-navigation.utils";

describe("player-button-navigation.utils", () => {
  it("returns option handle for single-choice selections", () => {
    const widgetId = "opt-single";
    const optionId = defaultOptionsWidgetConfig.options[0].id;

    const handle = findSingleChoiceOptionNavigationHandle(
      [
        {
          id: widgetId,
          config: {
            ...defaultOptionsWidgetConfig,
            multipleChoice: false,
          },
        },
      ],
      { [widgetId]: optionId },
    );

    assert.equal(handle, `opt-${widgetId}::${optionId}`);
  });

  it("ignores multiple-choice widgets so the button handle is used", () => {
    const widgetId = "opt-multi";
    const optionIds = defaultOptionsWidgetConfig.options.map(
      (option) => option.id,
    );

    const handle = findSingleChoiceOptionNavigationHandle(
      [
        {
          id: widgetId,
          config: {
            ...defaultOptionsWidgetConfig,
            multipleChoice: true,
          },
        },
      ],
      { [widgetId]: JSON.stringify(optionIds) },
    );

    assert.equal(handle, null);
  });

  it("prefers single-choice routing when both widget types exist", () => {
    const singleId = "opt-single";
    const multiId = "opt-multi";
    const singleOptionId = defaultOptionsWidgetConfig.options[0].id;

    const handle = findSingleChoiceOptionNavigationHandle(
      [
        {
          id: multiId,
          config: {
            ...defaultOptionsWidgetConfig,
            multipleChoice: true,
          },
        },
        {
          id: singleId,
          config: {
            ...defaultOptionsWidgetConfig,
            multipleChoice: false,
          },
        },
      ],
      {
        [multiId]: JSON.stringify([singleOptionId]),
        [singleId]: singleOptionId,
      },
    );

    assert.equal(handle, `opt-${singleId}::${singleOptionId}`);
  });
});
