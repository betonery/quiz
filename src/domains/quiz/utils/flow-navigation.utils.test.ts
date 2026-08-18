import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_LINK_URL,
  FLOW_CONDITION_ELSE_HANDLE,
  FLOW_FUNCTION_SOURCE_HANDLE,
  FLOW_FUNCTION_TARGET_HANDLE,
  FLOW_STEP_TARGET_HANDLE,
  conditionHandleId,
  flowFunctionNodeId,
  flowStepNodeId,
} from "@/domains/quiz/types/flow.types";
import type { FlowLayout } from "@/domains/quiz/types/flow.types";
import { resolveNavigationPath } from "./flow-navigation.utils";

function makeLayout(
  functionNodes: FlowLayout["functionNodes"],
  visualEdges: FlowLayout["visualEdges"],
): FlowLayout {
  return {
    nodePositions: {},
    functionNodes,
    visualEdges,
  };
}

describe("flow-navigation.utils", () => {
  it("resolves redirect when step connects directly to link node", () => {
    const linkId = "link-1";
    const stepId = "step-a";
    const flowLayout = makeLayout(
      [
        {
          id: linkId,
          type: "link",
          label: "Link",
          config: { url: "https://example.com/landing" },
        },
      ],
      [
        {
          id: "edge-1",
          source: flowStepNodeId(stepId),
          sourceHandle: "btn-widget-1",
          target: flowFunctionNodeId(linkId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
      ],
    );

    const result = resolveNavigationPath({
      sourceStepId: stepId,
      sourceHandle: "btn-widget-1",
      widgets: [],
      flowLayout,
    });

    assert.equal(result.targetStepId, null);
    assert.equal(result.redirectUrl, "https://example.com/landing");
    assert.equal(result.redirectOpenInNewWindow, false);
    assert.equal(result.functionNodes.length, 1);
    assert.equal(result.functionNodes[0]?.type, "link");
  });

  it("resolves variable then link chain in order", () => {
    const variableId = "var-1";
    const linkId = "link-1";
    const stepId = "step-a";
    const flowLayout = makeLayout(
      [
        {
          id: variableId,
          type: "set_variable",
          label: "Variável",
          config: { variableKey: "soma", expression: "4" },
        },
        {
          id: linkId,
          type: "link",
          label: "Link",
          config: { url: "https://example.com/finish" },
        },
      ],
      [
        {
          id: "edge-1",
          source: flowStepNodeId(stepId),
          sourceHandle: "btn-widget-1",
          target: flowFunctionNodeId(variableId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
        {
          id: "edge-2",
          source: flowFunctionNodeId(variableId),
          sourceHandle: FLOW_FUNCTION_SOURCE_HANDLE,
          target: flowFunctionNodeId(linkId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
      ],
    );

    const result = resolveNavigationPath({
      sourceStepId: stepId,
      sourceHandle: "btn-widget-1",
      widgets: [],
      flowLayout,
    });

    assert.equal(result.targetStepId, null);
    assert.equal(result.redirectUrl, "https://example.com/finish");
    assert.deepEqual(
      result.functionNodes.map((fn) => fn.type),
      ["set_variable", "link"],
    );
  });

  it("falls back to DEFAULT_LINK_URL when link config url is empty", () => {
    const linkId = "link-1";
    const stepId = "step-a";
    const flowLayout = makeLayout(
      [
        {
          id: linkId,
          type: "link",
          label: "Link",
          config: { url: "" },
        },
      ],
      [
        {
          id: "edge-1",
          source: flowStepNodeId(stepId),
          sourceHandle: "btn-widget-1",
          target: flowFunctionNodeId(linkId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
      ],
    );

    const result = resolveNavigationPath({
      sourceStepId: stepId,
      sourceHandle: "btn-widget-1",
      widgets: [],
      flowLayout,
    });

    assert.equal(result.redirectUrl, DEFAULT_LINK_URL);
  });

  it("interpolates and encodes variables in link url from player state", () => {
    const linkId = "link-1";
    const stepId = "step-a";
    const flowLayout = makeLayout(
      [
        {
          id: linkId,
          type: "link",
          label: "Link",
          config: {
            url: "https://meusite.com/login?email={{email}}&nome={{nome}}",
          },
        },
      ],
      [
        {
          id: "edge-1",
          source: flowStepNodeId(stepId),
          sourceHandle: "btn-widget-1",
          target: flowFunctionNodeId(linkId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
      ],
    );

    const result = resolveNavigationPath({
      sourceStepId: stepId,
      sourceHandle: "btn-widget-1",
      widgets: [],
      flowLayout,
      variables: { email: "user@test.com", nome: "João Silva" },
    });

    assert.equal(
      result.redirectUrl,
      "https://meusite.com/login?email=user%40test.com&nome=Jo%C3%A3o%20Silva",
    );
  });

  it("interpolates variables set in chain before link redirect", () => {
    const emailVarId = "var-email";
    const nomeVarId = "var-nome";
    const linkId = "link-1";
    const stepId = "step-a";
    const flowLayout = makeLayout(
      [
        {
          id: emailVarId,
          type: "set_variable",
          label: "Email",
          config: { variableKey: "email", expression: '"user@test.com"' },
        },
        {
          id: nomeVarId,
          type: "set_variable",
          label: "Nome",
          config: { variableKey: "nome", expression: '"João"' },
        },
        {
          id: linkId,
          type: "link",
          label: "Link",
          config: {
            url: "https://meusite.com/login?email={{email}}&nome={{nome}}",
          },
        },
      ],
      [
        {
          id: "edge-1",
          source: flowStepNodeId(stepId),
          sourceHandle: "btn-widget-1",
          target: flowFunctionNodeId(emailVarId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
        {
          id: "edge-2",
          source: flowFunctionNodeId(emailVarId),
          sourceHandle: FLOW_FUNCTION_SOURCE_HANDLE,
          target: flowFunctionNodeId(nomeVarId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
        {
          id: "edge-3",
          source: flowFunctionNodeId(nomeVarId),
          sourceHandle: FLOW_FUNCTION_SOURCE_HANDLE,
          target: flowFunctionNodeId(linkId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
      ],
    );

    const result = resolveNavigationPath({
      sourceStepId: stepId,
      sourceHandle: "btn-widget-1",
      widgets: [],
      flowLayout,
    });

    assert.equal(
      result.redirectUrl,
      "https://meusite.com/login?email=user%40test.com&nome=Jo%C3%A3o",
    );
  });

  it("resolves redirectOpenInNewWindow when link config enables it", () => {
    const linkId = "link-1";
    const stepId = "step-a";
    const flowLayout = makeLayout(
      [
        {
          id: linkId,
          type: "link",
          label: "Link",
          config: {
            url: "https://example.com/new-tab",
            openInNewWindow: true,
          },
        },
      ],
      [
        {
          id: "edge-1",
          source: flowStepNodeId(stepId),
          sourceHandle: "btn-widget-1",
          target: flowFunctionNodeId(linkId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
      ],
    );

    const result = resolveNavigationPath({
      sourceStepId: stepId,
      sourceHandle: "btn-widget-1",
      widgets: [],
      flowLayout,
    });

    assert.equal(result.redirectUrl, "https://example.com/new-tab");
    assert.equal(result.redirectOpenInNewWindow, true);
  });

  it("still resolves step target after non-link function chain", () => {
    const variableId = "var-1";
    const stepA = "step-a";
    const stepB = "step-b";
    const flowLayout = makeLayout(
      [
        {
          id: variableId,
          type: "set_variable",
          label: "Variável",
          config: { variableKey: "soma", expression: "1" },
        },
      ],
      [
        {
          id: "edge-1",
          source: flowStepNodeId(stepA),
          sourceHandle: "btn-widget-1",
          target: flowFunctionNodeId(variableId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
        {
          id: "edge-2",
          source: flowFunctionNodeId(variableId),
          sourceHandle: FLOW_FUNCTION_SOURCE_HANDLE,
          target: flowStepNodeId(stepB),
          targetHandle: FLOW_STEP_TARGET_HANDLE,
        },
      ],
    );

    const result = resolveNavigationPath({
      sourceStepId: stepA,
      sourceHandle: "btn-widget-1",
      widgets: [],
      flowLayout,
    });

    assert.equal(result.targetStepId, stepB);
    assert.equal(result.redirectUrl, undefined);
    assert.equal(result.functionNodes.length, 1);
  });

  it("passes through webhook node to next step", () => {
    const webhookId = "webhook-1";
    const stepA = "step-a";
    const stepB = "step-b";
    const flowLayout = makeLayout(
      [
        {
          id: webhookId,
          type: "webhook",
          label: "Webhook",
          config: {
            url: "https://example.com/hook",
            method: "POST",
            variableKeys: ["email"],
          },
        },
      ],
      [
        {
          id: "edge-1",
          source: flowStepNodeId(stepA),
          sourceHandle: "btn-widget-1",
          target: flowFunctionNodeId(webhookId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
        {
          id: "edge-2",
          source: flowFunctionNodeId(webhookId),
          sourceHandle: FLOW_FUNCTION_SOURCE_HANDLE,
          target: flowStepNodeId(stepB),
          targetHandle: FLOW_STEP_TARGET_HANDLE,
        },
      ],
    );

    const result = resolveNavigationPath({
      sourceStepId: stepA,
      sourceHandle: "btn-widget-1",
      widgets: [],
      flowLayout,
    });

    assert.equal(result.targetStepId, stepB);
    assert.equal(result.functionNodes.length, 1);
    assert.equal(result.functionNodes[0]?.type, "webhook");
  });

  it("applies set_variable then passes through webhook", () => {
    const variableId = "var-1";
    const webhookId = "webhook-1";
    const stepA = "step-a";
    const stepB = "step-b";
    const flowLayout = makeLayout(
      [
        {
          id: variableId,
          type: "set_variable",
          label: "Variável",
          config: { variableKey: "soma", expression: "2" },
        },
        {
          id: webhookId,
          type: "webhook",
          label: "Webhook",
          config: {
            url: "https://example.com/hook",
            method: "POST",
            variableKeys: ["soma"],
          },
        },
      ],
      [
        {
          id: "edge-1",
          source: flowStepNodeId(stepA),
          sourceHandle: "btn-widget-1",
          target: flowFunctionNodeId(variableId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
        {
          id: "edge-2",
          source: flowFunctionNodeId(variableId),
          sourceHandle: FLOW_FUNCTION_SOURCE_HANDLE,
          target: flowFunctionNodeId(webhookId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
        {
          id: "edge-3",
          source: flowFunctionNodeId(webhookId),
          sourceHandle: FLOW_FUNCTION_SOURCE_HANDLE,
          target: flowStepNodeId(stepB),
          targetHandle: FLOW_STEP_TARGET_HANDLE,
        },
      ],
    );

    const result = resolveNavigationPath({
      sourceStepId: stepA,
      sourceHandle: "btn-widget-1",
      widgets: [],
      flowLayout,
    });

    assert.equal(result.targetStepId, stepB);
    assert.deepEqual(
      result.functionNodes.map((fn) => fn.type),
      ["set_variable", "webhook"],
    );
  });

  it("routes to matching condition branch", () => {
    const conditionId = "cond-1";
    const branchId = "branch-match";
    const stepA = "step-a";
    const stepB = "step-b";
    const flowLayout = makeLayout(
      [
        {
          id: conditionId,
          type: "condition",
          label: "Condições",
          config: {
            branches: [
              {
                id: branchId,
                comparisons: [
                  {
                    id: "cmp-1",
                    variableKey: "soma",
                    operator: "eq",
                    value: "10",
                  },
                ],
              },
            ],
          },
        },
      ],
      [
        {
          id: "edge-1",
          source: flowStepNodeId(stepA),
          sourceHandle: "btn-widget-1",
          target: flowFunctionNodeId(conditionId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
        {
          id: "edge-2",
          source: flowFunctionNodeId(conditionId),
          sourceHandle: conditionHandleId(branchId),
          target: flowStepNodeId(stepB),
          targetHandle: FLOW_STEP_TARGET_HANDLE,
        },
      ],
    );

    const result = resolveNavigationPath({
      sourceStepId: stepA,
      sourceHandle: "btn-widget-1",
      widgets: [],
      flowLayout,
      variables: { soma: 10 },
    });

    assert.equal(result.targetStepId, stepB);
    assert.equal(result.functionNodes[0]?.type, "condition");
  });

  it("routes to else branch when no condition matches", () => {
    const conditionId = "cond-1";
    const branchId = "branch-match";
    const stepA = "step-a";
    const stepElse = "step-else";
    const flowLayout = makeLayout(
      [
        {
          id: conditionId,
          type: "condition",
          label: "Condições",
          config: {
            branches: [
              {
                id: branchId,
                comparisons: [
                  {
                    id: "cmp-1",
                    variableKey: "soma",
                    operator: "eq",
                    value: "10",
                  },
                ],
              },
            ],
          },
        },
      ],
      [
        {
          id: "edge-1",
          source: flowStepNodeId(stepA),
          sourceHandle: "btn-widget-1",
          target: flowFunctionNodeId(conditionId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
        {
          id: "edge-else",
          source: flowFunctionNodeId(conditionId),
          sourceHandle: FLOW_CONDITION_ELSE_HANDLE,
          target: flowStepNodeId(stepElse),
          targetHandle: FLOW_STEP_TARGET_HANDLE,
        },
      ],
    );

    const result = resolveNavigationPath({
      sourceStepId: stepA,
      sourceHandle: "btn-widget-1",
      widgets: [],
      flowLayout,
      variables: { soma: 5 },
    });

    assert.equal(result.targetStepId, stepElse);
  });

  it("uses set_variable before evaluating condition", () => {
    const variableId = "var-1";
    const conditionId = "cond-1";
    const branchId = "branch-match";
    const stepA = "step-a";
    const stepB = "step-b";
    const flowLayout = makeLayout(
      [
        {
          id: variableId,
          type: "set_variable",
          label: "Soma",
          config: { variableKey: "soma", expression: "10" },
        },
        {
          id: conditionId,
          type: "condition",
          label: "Condições",
          config: {
            branches: [
              {
                id: branchId,
                comparisons: [
                  {
                    id: "cmp-1",
                    variableKey: "soma",
                    operator: "eq",
                    value: "10",
                  },
                ],
              },
            ],
          },
        },
      ],
      [
        {
          id: "edge-1",
          source: flowStepNodeId(stepA),
          sourceHandle: "btn-widget-1",
          target: flowFunctionNodeId(variableId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
        {
          id: "edge-2",
          source: flowFunctionNodeId(variableId),
          sourceHandle: FLOW_FUNCTION_SOURCE_HANDLE,
          target: flowFunctionNodeId(conditionId),
          targetHandle: FLOW_FUNCTION_TARGET_HANDLE,
        },
        {
          id: "edge-3",
          source: flowFunctionNodeId(conditionId),
          sourceHandle: conditionHandleId(branchId),
          target: flowStepNodeId(stepB),
          targetHandle: FLOW_STEP_TARGET_HANDLE,
        },
      ],
    );

    const result = resolveNavigationPath({
      sourceStepId: stepA,
      sourceHandle: "btn-widget-1",
      widgets: [],
      flowLayout,
      variables: {},
    });

    assert.equal(result.targetStepId, stepB);
    assert.deepEqual(
      result.functionNodes.map((fn) => fn.type),
      ["set_variable", "condition"],
    );
  });
});
