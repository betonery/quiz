"use client";

import { Input } from "@/components/ui/input";
import type { RedirectWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  PropertiesSection,
  PropertyField,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { clampRedirectDelaySeconds } from "@/domains/quiz/utils/redirect-widget.utils";

type RedirectWidgetPropertiesProps = {
  config: RedirectWidgetConfig;
  onChange: (config: RedirectWidgetConfig) => void;
};

export function RedirectWidgetProperties({
  config,
  onChange,
}: RedirectWidgetPropertiesProps) {
  function patch(partial: Partial<RedirectWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Ação">
        <PropertyField label="Delay para ação (segundos)">
          <Input
            type="number"
            min={1}
            max={120}
            value={config.delaySeconds}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (!Number.isFinite(next)) return;
              patch({ delaySeconds: clampRedirectDelaySeconds(next) });
            }}
            className="bg-background shadow-sm"
          />
        </PropertyField>
      </PropertiesSection>
    </div>
  );
}
