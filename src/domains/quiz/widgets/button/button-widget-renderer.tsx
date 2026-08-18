import type { ButtonWidgetConfig } from "@/domains/quiz/types/builder.types";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import { getButtonAnimationClass } from "@/domains/quiz/utils/button-widget.utils";
import { cn } from "@/lib/utils";

type ButtonWidgetRendererProps = {
  config: ButtonWidgetConfig;
  highlightVariables?: boolean;
  className?: string;
  onClick?: () => void;
};

const buttonStyles =
  "w-full rounded-xl px-4 py-3 text-center text-base font-semibold transition-opacity";

export function ButtonWidgetRenderer({
  config,
  highlightVariables = false,
  className,
  onClick,
}: ButtonWidgetRendererProps) {
  const animationClass = getButtonAnimationClass(config.animation ?? "none");

  const style = {
    backgroundColor: config.backgroundColor,
    color: config.textColor,
    border: `2px solid ${config.borderColor}`,
    ...(config.animation === "glow"
      ? { ["--btn-glow-color" as string]: config.backgroundColor }
      : {}),
  };

  const label = config.label || "Continuar";
  const labelContent = highlightVariables ? (
    <VariableHighlightedText text={label} />
  ) : (
    label
  );

  const combinedClassName = cn(buttonStyles, animationClass, className);

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={combinedClassName}
        style={style}
      >
        {labelContent}
      </button>
    );
  }

  return (
    <div className={combinedClassName} style={style}>
      {labelContent}
    </div>
  );
}
