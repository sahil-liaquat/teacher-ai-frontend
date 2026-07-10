import type { PresentationDeck, PresentationSlide } from "@/lib/presentation-generator";

function clampImageIndex(value: unknown, imageCount: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(imageCount - 1, value));
}

function selectedSlideImage(slide: PresentationSlide) {
  return slide.imageUrls[clampImageIndex(slide.selectedImageIndex, slide.imageUrls.length)] || "";
}

function cleanBullet(value: string) {
  return value.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
}

function slideBullets(slide: PresentationSlide) {
  return [slide.subtitle || "", ...slide.points].map(cleanBullet).filter(Boolean).slice(0, 4);
}

function slugify(value: string) {
  return (value || "presentation").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "presentation";
}

function containImage(x: number, y: number, w: number, h: number) {
  return { x, y, w, h, sizing: { type: "contain" as const, x, y, w, h } };
}

export async function imageUrlToDataUri(url: string) {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("data:")) return url;

  // Normalize protocol-relative URLs
  let fetchUrl = url;
  if (fetchUrl.startsWith("//")) {
    fetchUrl = "https:" + fetchUrl;
  }

  // Helper to convert a Response blob to a data URI
  async function blobToDataUri(blob: Blob): Promise<string> {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  }

  // 1. Try fetching via our Next.js server-side image proxy (avoids all CORS issues)
  try {
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(fetchUrl)}`;
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const blob = await response.blob();
      return await blobToDataUri(blob);
    }
  } catch (e) {
    console.warn(`Proxy image fetch failed for: ${fetchUrl}`);
  }

  // 2. Fallback: try direct CORS fetch (works for same-origin / CORS-enabled CDNs)
  try {
    const response = await fetch(fetchUrl, { mode: "cors" });
    if (response.ok) {
      const blob = await response.blob();
      return await blobToDataUri(blob);
    }
  } catch (e) {
    console.warn(`Direct image fetch also failed for: ${fetchUrl}`);
  }

  return "";
}


export function downloadFromUrl(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function downloadPptx(deck: PresentationDeck) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "TeachPad";
  pptx.company = "TeachPad";
  pptx.subject = deck.topic;
  pptx.title = deck.topic;
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos"
  };
  pptx.defineLayout({ name: "TEACHPAD_WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "TEACHPAD_WIDE";

  // Pre-fetch ALL images in parallel with a per-image timeout.
  // This ensures every image has the full timeout budget regardless of others,
  // and slow/failing images don't block the rest of the deck.
  const IMAGE_TIMEOUT_MS = 12000;

  async function fetchWithTimeout(url: string): Promise<string> {
    return Promise.race([
      imageUrlToDataUri(url),
      new Promise<string>((resolve) => setTimeout(() => resolve(""), IMAGE_TIMEOUT_MS))
    ]);
  }

  const imageDataMap = new Map<string, string>();
  await Promise.all(
    deck.slides.map(async (slide) => {
      const imgUrl = selectedSlideImage(slide);
      if (imgUrl && !imageDataMap.has(imgUrl)) {
        const data = await fetchWithTimeout(imgUrl);
        imageDataMap.set(imgUrl, data);
      }
    })
  );

  for (const slide of deck.slides) {
    const pptSlide = pptx.addSlide();
    const selectedImage = selectedSlideImage(slide);
    const imageData = selectedImage ? (imageDataMap.get(selectedImage) ?? "") : "";
    const bullets = slideBullets(slide);

    pptSlide.background = { color: "FFFFFF" };
    pptSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 5.35,
      h: 7.5,
      line: { color: "FFFFFF", transparency: 100 },
      fill: { color: "F8FBFF" }
    });
    pptSlide.addShape(pptx.ShapeType.rect, {
      x: 5.0,
      y: 0,
      w: 0.45,
      h: 7.5,
      line: { color: "FFFFFF", transparency: 100 },
      fill: { color: "FFFFFF", transparency: 18 }
    });
    pptSlide.addShape(pptx.ShapeType.ellipse, {
      x: 0.42,
      y: 0.45,
      w: 0.12,
      h: 0.12,
      line: { color: "7DD3FC", transparency: 100 },
      fill: { color: "7DD3FC", transparency: 25 }
    });
    pptSlide.addShape(pptx.ShapeType.ellipse, {
      x: 4.15,
      y: 6.35,
      w: 0.16,
      h: 0.16,
      line: { color: "F9A8D4", transparency: 100 },
      fill: { color: "F9A8D4", transparency: 30 }
    });

    pptSlide.addText(slide.title || "Untitled slide", {
      x: 0.58,
      y: 0.82,
      w: 4.18,
      h: 1.62,
      margin: 0,
      breakLine: false,
      fit: "shrink",
      fontFace: "Aptos Display",
      fontSize: 34,
      bold: true,
      color: "171717",
      valign: "top"
    });
    pptSlide.addShape(pptx.ShapeType.rect, {
      x: 0.66,
      y: 2.5,
      w: 1.05,
      h: 0.05,
      line: { color: "38BDF8", transparency: 100 },
      fill: { color: "38BDF8" }
    });

    if (bullets.length) {
      pptSlide.addText(bullets.join("\n"), {
        x: 0.78,
        y: 3.05,
        w: 3.9,
        h: 2.65,
        margin: 0,
        fit: "shrink",
        fontFace: "Aptos",
        fontSize: 18,
        color: "5F6368",
        breakLine: false,
        valign: "middle",
        bullet: { type: "bullet" },
        paraSpaceAfter: 10
      });
    }

    if (imageData) {
      pptSlide.addImage({
        data: imageData,
        ...containImage(5.55, 0.38, 7.35, 6.74)
      });
    } else {
      pptSlide.addShape(pptx.ShapeType.roundRect, {
        x: 5.65,
        y: 0.55,
        w: 7.1,
        h: 6.4,
        rectRadius: 0.08,
        line: { color: "E7E7EA", transparency: 0 },
        fill: { color: "F8FAFC" }
      });
      pptSlide.addText(slide.visual || "Classroom visual", {
        x: 6.0,
        y: 3.35,
        w: 6.4,
        h: 0.45,
        align: "center",
        fontSize: 13,
        bold: true,
        color: "8A8F98",
        margin: 0
      });
    }
  }

  await pptx.writeFile({ fileName: `${slugify(deck.topic)}.pptx` });
}
