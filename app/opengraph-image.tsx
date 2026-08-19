import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

/**
 * Build anında üretilen varsayılan paylaşım görseli.
 * Bu dosya olmadan WhatsApp / X / Facebook paylaşımları görselsiz kalır ve
 * tıklanma oranı belirgin biçimde düşer. Alt rotalar kendi klasörlerine
 * opengraph-image koyarak bunu ezebilir (ör. ilan sayfaları).
 */
export const alt = `${siteConfig.name} — luxury villas for sale in Fethiye, Ölüdeniz and Göcek`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0f2337 0%, #1b3a55 100%)",
          color: "#f7f5f0",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#a8b58f",
            }}
          >
            Coast 2 Coast Properties Turkey
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 68, lineHeight: 1.12, maxWidth: 900 }}>
            Luxury villas for sale in Fethiye, Ölüdeniz &amp; Göcek
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 26,
              color: "rgba(247,245,240,0.72)",
            }}
          >
            An international consultancy — from viewing trip to title deed.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 22,
            color: "rgba(247,245,240,0.6)",
          }}
        >
          <div style={{ width: 64, height: 2, background: "#6d7a58" }} />
          coast2coastpropertiesturkey.co.uk
        </div>
      </div>
    ),
    size,
  );
}
