"use client";

import Script from "next/script";
import type { QuizSettings } from "@/domains/quiz/types/quiz-settings.types";

type QuizTrackingScriptsProps = {
  settings: QuizSettings;
  enabled: boolean;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
    metaPixelId?: string;
    googlePixelId?: string;
  }
}

export function QuizTrackingScripts({
  settings,
  enabled,
}: QuizTrackingScriptsProps) {
  if (!enabled) return null;

  const metaPixel = settings.integrations.metaPixel;
  const utmify = settings.integrations.utmify;

  const showMeta =
    metaPixel?.enabled && metaPixel.pixelId && /^\d+$/.test(metaPixel.pixelId);
  const showUtmScript = utmify?.enabled && utmify.utmScriptEnabled;
  const showUtmifyPixel =
    utmify?.enabled && utmify.pixelId && /^[a-zA-Z0-9]+$/.test(utmify.pixelId);

  if (!showMeta && !showUtmScript && !showUtmifyPixel) {
    return null;
  }

  return (
    <>
      {showMeta ? (
        <>
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixel.pixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${metaPixel.pixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      ) : null}

      {showUtmScript ? (
        <Script
          id="utmify-utms"
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          strategy="afterInteractive"
          data-utmify-prevent-subids
        />
      ) : null}

      {showUtmifyPixel ? (
        <Script id="utmify-pixel" strategy="afterInteractive">
          {`
            window.googlePixelId = "${utmify.pixelId}";
            var a = document.createElement("script");
            a.setAttribute("async", "");
            a.setAttribute("defer", "");
            a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel-google.js");
            document.head.appendChild(a);
          `}
        </Script>
      ) : null}
    </>
  );
}

export function trackMetaLeadEvent() {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }
  window.fbq("track", "Lead");
}
