"use client";

import type { ReactNode } from "react";
import { FLOW_EDITOR_DRAWER_MARGIN } from "@/domains/quiz/types/flow.types";

type FlowEditorOverlayProps = {
  onClose: () => void;
  children: ReactNode;
};

function stopBackdropDismiss(event: React.MouseEvent | React.PointerEvent) {
  event.stopPropagation();
}

export function FlowEditorOverlay({
  onClose,
  children,
}: FlowEditorOverlayProps) {
  return (
    <div className="absolute inset-0 z-20">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/45"
        onClick={onClose}
        aria-label="Fechar e voltar ao fluxo"
      />

      <div
        className="pointer-events-none absolute inset-0 flex items-stretch justify-end"
        style={{
          paddingTop: FLOW_EDITOR_DRAWER_MARGIN,
          paddingRight: FLOW_EDITOR_DRAWER_MARGIN,
          paddingBottom: FLOW_EDITOR_DRAWER_MARGIN,
        }}
      >
        <div
          className="pointer-events-auto"
          onClick={stopBackdropDismiss}
          onPointerDown={stopBackdropDismiss}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
