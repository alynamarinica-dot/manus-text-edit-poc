import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("public/images", { recursive: true });

const samples = [
  {
    file: "public/images/sample-1.png",
    width: 800,
    height: 800,
    bg: "#1a1a2e",
    texts: [
      { text: "SUMMER SALE", y: 260, size: 72, color: "#ffffff" },
      { text: "50% OFF", y: 380, size: 96, color: "#e94560" },
      { text: "Only this weekend", y: 500, size: 36, color: "#cccccc" },
    ],
  },
  {
    file: "public/images/sample-2.png",
    width: 800,
    height: 800,
    bg: "#0f3460",
    texts: [
      { text: "NEW COLLECTION", y: 240, size: 64, color: "#e94560" },
      { text: "Spring 2026", y: 360, size: 52, color: "#ffffff" },
      { text: "Shop Now", y: 480, size: 44, color: "#16213e" },
      { text: "Free Shipping", y: 560, size: 32, color: "#cccccc" },
    ],
  },
  {
    file: "public/images/sample-3.png",
    width: 800,
    height: 800,
    bg: "#533483",
    texts: [
      { text: "JOIN US", y: 220, size: 80, color: "#ffffff" },
      { text: "Tech Conference 2026", y: 360, size: 44, color: "#e0d3ef" },
      { text: "May 15-17", y: 440, size: 48, color: "#ffd700" },
      { text: "San Francisco, CA", y: 530, size: 32, color: "#cccccc" },
      { text: "Register Today", y: 620, size: 36, color: "#ffffff" },
    ],
  },
];

for (const sample of samples) {
  // Build SVG with text elements
  const textEls = sample.texts
    .map(
      (t) =>
        `<text x="400" y="${t.y}" font-family="Arial, Helvetica, sans-serif" font-size="${t.size}" font-weight="bold" fill="${t.color}" text-anchor="middle" dominant-baseline="middle">${t.text}</text>`
    )
    .join("\n    ");

  const svg = `<svg width="${sample.width}" height="${sample.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${sample.bg}"/>
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.08)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  ${textEls}
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(sample.file);
  console.log(`Created ${sample.file}`);
}

console.log("Done — 3 sample images generated.");
