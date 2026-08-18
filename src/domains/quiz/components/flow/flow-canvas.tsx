"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useStoreApi,
  type Connection,
  type Edge,
  type IsValidConnection,
  type Node,
  type EdgeMouseHandler,
  type OnEdgesDelete,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./flow-canvas.css";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { FlowLabeledEdge } from "@/domains/quiz/components/flow/edges/flow-labeled-edge";
import { FlowConditionNode } from "@/domains/quiz/components/flow/nodes/flow-condition-node";
import { FlowFunctionNode } from "@/domains/quiz/components/flow/nodes/flow-function-node";
import { FlowStartNode } from "@/domains/quiz/components/flow/nodes/flow-start-node";
import { FlowStepNode } from "@/domains/quiz/components/flow/nodes/flow-step-node";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import {
  FLOW_EDITOR_DRAWER_CONTENT_WIDTH,
  FLOW_EDITOR_DRAWER_MARGIN,
  FLOW_STEP_NODE_WIDTH,
  flowStepNodeId,
  parseFunctionIdFromFlowNode,
  parseStepIdFromFlowNode,
} from "@/domains/quiz/types/flow.types";
import {
  buildFlowGraph,
  type FlowEdgeData,
} from "@/domains/quiz/utils/flow-graph.utils";

const nodeTypes = {
  flowStart: FlowStartNode,
  flowStep: FlowStepNode,
  flowFunction: FlowFunctionNode,
  flowCondition: FlowConditionNode,
};

const edgeTypes = {
  flowLabeled: FlowLabeledEdge,
};

const STEP_NODE_WIDTH = FLOW_STEP_NODE_WIDTH;
const STEP_NODE_HEIGHT_ESTIMATE = 180;
const FUNCTION_NODE_WIDTH = 160;
const FUNCTION_NODE_HEIGHT = 48;
const CONDITION_NODE_WIDTH = FLOW_STEP_NODE_WIDTH;
const CONDITION_NODE_HEIGHT_ESTIMATE = 140;

function FlowInitialFit() {
  const { fitView } = useReactFlow();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (hasFitted.current) return;
    hasFitted.current = true;
    requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 0 });
    });
  }, [fitView]);

  return null;
}

function FlowEditorPanEffect() {
  const flowEditorStepId = useBuilderStore((s) => s.flowEditorStepId);
  const { setViewport, getZoom, getNodes } = useReactFlow();
  const store = useStoreApi();

  useEffect(() => {
    if (!flowEditorStepId) return;

    const nodeId = flowStepNodeId(flowEditorStepId);

    const frame = requestAnimationFrame(() => {
      const { width, height } = store.getState();
      const node = getNodes().find((n) => n.id === nodeId);
      if (!node || width <= 0 || height <= 0) return;

      const zoom = getZoom() || 1;
      const nodeCenterX = node.position.x + STEP_NODE_WIDTH / 2;
      const nodeCenterY = node.position.y + STEP_NODE_HEIGHT_ESTIMATE / 2;
      const drawerRatio = Math.min(
        (FLOW_EDITOR_DRAWER_CONTENT_WIDTH + FLOW_EDITOR_DRAWER_MARGIN) / width,
        0.9,
      );
      const visibleRatio = 1 - drawerRatio;
      const targetScreenX = width * (visibleRatio / 2);
      const targetScreenY = height * 0.5;

      setViewport(
        {
          x: targetScreenX - nodeCenterX * zoom,
          y: targetScreenY - nodeCenterY * zoom,
          zoom,
        },
        { duration: 350 },
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [flowEditorStepId, getNodes, getZoom, setViewport, store]);

  return null;
}

function FlowCenterPendingNode() {
  const pendingCenterFlowNodeId = useBuilderStore(
    (s) => s.pendingCenterFlowNodeId,
  );
  const flowLayout = useBuilderStore((s) => s.flowLayout);
  const flowEditorStepId = useBuilderStore((s) => s.flowEditorStepId);
  const flowEditorFunctionId = useBuilderStore((s) => s.flowEditorFunctionId);
  const setFlowNodePosition = useBuilderStore((s) => s.setFlowNodePosition);
  const clearPendingCenterFlowNode = useBuilderStore(
    (s) => s.clearPendingCenterFlowNode,
  );
  const { screenToFlowPosition } = useReactFlow();
  const store = useStoreApi();

  useEffect(() => {
    if (!pendingCenterFlowNodeId) return;

    const frame = requestAnimationFrame(() => {
      const { width, height } = store.getState();
      if (width <= 0 || height <= 0) return;

      const hasDrawer = !!(flowEditorStepId || flowEditorFunctionId);
      const drawerWidth = hasDrawer
        ? FLOW_EDITOR_DRAWER_CONTENT_WIDTH + FLOW_EDITOR_DRAWER_MARGIN
        : 0;
      const visibleWidth = Math.max(width - drawerWidth, width * 0.5);
      const screenX = drawerWidth + visibleWidth / 2;
      const center = screenToFlowPosition({ x: screenX, y: height / 2 });

      const isFunction = pendingCenterFlowNodeId.startsWith("fn-");
      const functionId = isFunction
        ? parseFunctionIdFromFlowNode(pendingCenterFlowNodeId)
        : null;
      const isCondition =
        functionId &&
        flowLayout.functionNodes.some(
          (fn) => fn.id === functionId && fn.type === "condition",
        );

      const nodeWidth = isCondition
        ? CONDITION_NODE_WIDTH
        : isFunction
          ? FUNCTION_NODE_WIDTH
          : STEP_NODE_WIDTH;
      const nodeHeight = isCondition
        ? CONDITION_NODE_HEIGHT_ESTIMATE
        : isFunction
          ? FUNCTION_NODE_HEIGHT
          : STEP_NODE_HEIGHT_ESTIMATE;

      setFlowNodePosition(pendingCenterFlowNodeId, {
        x: center.x - nodeWidth / 2,
        y: center.y - nodeHeight / 2,
      });
      clearPendingCenterFlowNode();
    });

    return () => cancelAnimationFrame(frame);
  }, [
    pendingCenterFlowNodeId,
    flowEditorStepId,
    flowEditorFunctionId,
    flowLayout.functionNodes,
    screenToFlowPosition,
    setFlowNodePosition,
    clearPendingCenterFlowNode,
    store,
  ]);

  return null;
}

function FlowCanvasInner() {
  const steps = useBuilderStore((s) => s.steps);
  const widgets = useBuilderStore((s) => s.widgets);
  const design = useBuilderStore((s) => s.design);
  const flowLayout = useBuilderStore((s) => s.flowLayout);
  const connectFlowEdge = useBuilderStore((s) => s.connectFlowEdge);
  const disconnectFlowEdge = useBuilderStore((s) => s.disconnectFlowEdge);
  const setFlowNodePosition = useBuilderStore((s) => s.setFlowNodePosition);
  const openFlowStepEditor = useBuilderStore((s) => s.openFlowStepEditor);
  const openFlowFunctionEditor = useBuilderStore(
    (s) => s.openFlowFunctionEditor,
  );

  const graph = useMemo(
    () => buildFlowGraph({ steps, widgets, flowLayout, design }),
    [steps, widgets, flowLayout, design],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(graph.edges);

  useEffect(() => {
    setNodes((currentNodes) => {
      const livePositions = new Map(
        currentNodes.map((node) => [node.id, node.position]),
      );

      return graph.nodes.map((node) => {
        const stored = flowLayout.nodePositions[node.id];
        const live = livePositions.get(node.id);
        return {
          ...node,
          position: stored ?? live ?? node.position,
        };
      });
    });
    setEdges(graph.edges);
  }, [graph.nodes, graph.edges, flowLayout.nodePositions, setNodes, setEdges]);

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return false;
      if (connection.source === connection.target) return false;
      if (
        connection.source === "start" &&
        connection.target.startsWith("step-")
      ) {
        return false;
      }
      if (connection.source.startsWith("fn-")) {
        const functionId = connection.source.slice(3);
        const sourceFn = flowLayout.functionNodes.find(
          (fn) => fn.id === functionId,
        );
        if (sourceFn?.type === "link") return false;
      }
      return true;
    },
    [flowLayout.functionNodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      connectFlowEdge({
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      });
    },
    [connectFlowEdge],
  );

  const onEdgesDelete: OnEdgesDelete = useCallback(
    (deletedEdges) => {
      for (const edge of deletedEdges) {
        const edgeId =
          (edge.data as { edgeId?: string } | undefined)?.edgeId ?? edge.id;
        disconnectFlowEdge(edgeId);
      }
    },
    [disconnectFlowEdge],
  );

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      const edgeData = edge.data as FlowEdgeData | undefined;
      if (edgeData?.edgeKind === "implicit") return;
      const edgeId = edgeData?.edgeId ?? edge.id;
      disconnectFlowEdge(edgeId);
    },
    [disconnectFlowEdge],
  );

  const onNodeDragStop: OnNodeDrag<Node> = useCallback(
    (_event, node) => {
      setFlowNodePosition(node.id, node.position);
    },
    [setFlowNodePosition],
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const stepId = parseStepIdFromFlowNode(node.id);
      if (stepId) {
        openFlowStepEditor(stepId);
        return;
      }
      const functionId = parseFunctionIdFromFlowNode(node.id);
      if (functionId) {
        openFlowFunctionEditor(functionId);
      }
    },
    [openFlowStepEditor, openFlowFunctionEditor],
  );

  return (
    <div className="adquiz-flow h-full w-full bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onEdgeClick={onEdgeClick}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        isValidConnection={isValidConnection}
        connectionRadius={24}
        connectionDragThreshold={0}
        connectionLineStyle={{ stroke: "#60a5fa", strokeWidth: 2 }}
        panOnDrag={[1, 2]}
        panOnScroll
        selectionOnDrag={false}
        deleteKeyCode={["Backspace", "Delete"]}
        className="bg-slate-950"
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        elevateEdgesOnSelect={false}
      >
        <FlowInitialFit />
        <FlowCenterPendingNode />
        <FlowEditorPanEffect />
        <Background color="#334155" gap={20} />
        <Controls className="flow-controls !shadow-md" />
        <MiniMap
          className="flow-minimap !shadow-md"
          nodeColor={(node) =>
            node.type === "flowFunction"
              ? "#8b5cf6"
              : node.type === "flowCondition"
                ? "#a855f7"
                : "#3b82f6"
          }
        />
      </ReactFlow>
    </div>
  );
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}
