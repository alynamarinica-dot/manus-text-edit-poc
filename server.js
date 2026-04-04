import "dotenv/config";
import express from "express";
import Replicate from "replicate";
import { readFileSync } from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies up to 20MB (base64 images)
app.use(express.json({ limit: "20mb" }));

// Serve static files from public/
app.use(express.static("public"));

// ─── POST /api/erase ────────────────────────────────────────────────
// Accepts { image: <base64 data-uri>, mask: <base64 data-uri> }
// Calls BRIA Eraser on Replicate, returns { url: <cleaned image URL> }
app.post("/api/erase", async (req, res) => {
  const { image, mask } = req.body;

  if (!image || !mask) {
    return res.status(400).json({ error: "Both image and mask are required." });
  }

  // Basic validation: must be data URIs or URLs
  const isDataUri = (s) => s.startsWith("data:image/");
  const isUrl = (s) => s.startsWith("http://") || s.startsWith("https://");

  if (!isDataUri(image) && !isUrl(image)) {
    return res.status(400).json({ error: "image must be a data URI or URL." });
  }
  if (!isDataUri(mask) && !isUrl(mask)) {
    return res.status(400).json({ error: "mask must be a data URI or URL." });
  }

  try {
    const replicate = new Replicate();

    const output = await replicate.run("bria/eraser", {
      input: {
        image,
        mask,
        sync: true,
      },
    });

    // output is a ReadableStream / FileOutput — get URL
    const url = typeof output?.url === "function" ? output.url() : output;

    res.json({ url });
  } catch (err) {
    console.error("Replicate error:", err);
    res.status(500).json({ error: "Failed to process image. Try again." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
