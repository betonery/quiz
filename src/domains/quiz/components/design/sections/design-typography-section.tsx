"use client";

import { GOOGLE_FONTS } from "@/constants/google-fonts";
import {
  PropertiesSection,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";

function FontPreview({ fontSlug }: { fontSlug: string }) {
  const font = GOOGLE_FONTS.find((item) => item.slug === fontSlug);

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2.5">
      <p
        className="truncate text-base text-slate-100"
        style={{ fontFamily: `"${fontSlug}", sans-serif` }}
      >
        {font?.label ?? fontSlug}
      </p>
      <p
        className="mt-0.5 text-[10px] text-slate-500"
        style={{ fontFamily: `"${fontSlug}", sans-serif` }}
      >
        Aa Bb Cc 123
      </p>
    </div>
  );
}

export function DesignTypographySection() {
  const design = useBuilderStore((s) => s.design);
  const updateDesign = useBuilderStore((s) => s.updateDesign);

  return (
    <PropertiesSection title="Tipografia" variant="dark">
      <PropertyField label="Fonte de Títulos" variant="dark">
        <PropertySelect
          variant="dark"
          value={design.typography.titleFont}
          onChange={(titleFont) =>
            updateDesign({
              typography: { ...design.typography, titleFont },
            })
          }
        >
          {GOOGLE_FONTS.map((font) => (
            <option key={font.slug} value={font.slug}>
              {font.label}
            </option>
          ))}
        </PropertySelect>
        <FontPreview fontSlug={design.typography.titleFont} />
      </PropertyField>

      <PropertyField label="Fonte de Textos" variant="dark">
        <PropertySelect
          variant="dark"
          value={design.typography.bodyFont}
          onChange={(bodyFont) =>
            updateDesign({
              typography: { ...design.typography, bodyFont },
            })
          }
        >
          {GOOGLE_FONTS.map((font) => (
            <option key={font.slug} value={font.slug}>
              {font.label}
            </option>
          ))}
        </PropertySelect>
        <FontPreview fontSlug={design.typography.bodyFont} />
      </PropertyField>
    </PropertiesSection>
  );
}
