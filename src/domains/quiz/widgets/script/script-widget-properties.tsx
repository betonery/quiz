"use client";

import type { ScriptWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  PropertiesSection,
  PropertyField,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { hasScriptContent } from "@/domains/quiz/utils/script-widget.utils";

type ScriptWidgetPropertiesProps = {
  config: ScriptWidgetConfig;
  onChange: (config: ScriptWidgetConfig) => void;
};

export function ScriptWidgetProperties({
  config,
  onChange,
}: ScriptWidgetPropertiesProps) {
  function patch(partial: Partial<ScriptWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  const hasContent = hasScriptContent(config.embedCode);

  return (
    <div className="space-y-4">
      <PropertiesSection title="Conteúdo">
        <PropertyField label="Código de incorporação">
          <textarea
            value={config.embedCode}
            onChange={(event) => patch({ embedCode: event.target.value })}
            placeholder={'<script>console.log("custom script")</script>'}
            className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm"
            spellCheck={false}
          />
        </PropertyField>
        {config.embedCode.trim() && !hasContent ? (
          <p className="text-xs text-destructive">
            Nenhum bloco &lt;script&gt; ou &lt;noscript&gt; válido encontrado.
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Este código será executado quando o visitante chegar nesta etapa.
          Visível apenas no editor.
        </p>
      </PropertiesSection>
    </div>
  );
}
