// ─── DOM Elements ────────────────────────────────────
const mainImage = document.getElementById("mainImage");
const imageWrapper = document.getElementById("imageWrapper");
const editPanel = document.getElementById("editPanel");
const loadingOcr = document.getElementById("loadingOcr");
const textInputs = document.getElementById("textInputs");
const noText = document.getElementById("noText");
const panelActions = document.getElementById("panelActions");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const processingOverlay = document.getElementById("processingOverlay");
const errorToast = document.getElementById("errorToast");
const errorMessage = document.getElementById("errorMessage");

// ─── State ───────────────────────────────────────────
let detectedLines = []; // [{ text, bbox: { x0, y0, x1, y1 } }]
let originalImageSrc = mainImage.src;

// ─── Image Picker ────────────────────────────────────
document.querySelectorAll(".picker-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("active")) return;

    document.querySelector(".picker-btn.active")?.classList.remove("active");
    btn.classList.add("active");

    const src = btn.dataset.src;
    mainImage.src = src;
    originalImageSrc = src;

    // Reset edit state
    resetEditPanel();
  });
});

// ─── Click image → start edit flow ───────────────────
imageWrapper.addEventListener("click", startEditing);

async function startEditing() {
  // Show edit panel, hide results, show OCR loading
  editPanel.classList.remove("hidden");
  textInputs.innerHTML = "";
  noText.classList.add("hidden");
  panelActions.classList.add("hidden");
  loadingOcr.classList.remove("hidden");
  saveBtn.disabled = true;
  detectedLines = [];

  try {
    const result = await runOcr(mainImage);
    detectedLines = result;

    loadingOcr.classList.add("hidden");

    if (detectedLines.length === 0) {
      noText.classList.remove("hidden");
      panelActions.classList.remove("hidden");
      return;
    }

    // Render inputs
    detectedLines.forEach((line, i) => {
      const group = document.createElement("div");
      group.className = "text-input-group";

      const label = document.createElement("label");
      label.textContent = `Line ${i + 1}`;

      const input = document.createElement("input");
      input.type = "text";
      input.value = line.text;
      input.dataset.index = i;

      group.appendChild(label);
      group.appendChild(input);
      textInputs.appendChild(group);
    });

    panelActions.classList.remove("hidden");
    saveBtn.disabled = false;
  } catch (err) {
    console.error("OCR error:", err);
    loadingOcr.classList.add("hidden");
    showError("Failed to detect text. Try again.");
    panelActions.classList.remove("hidden");
  }
}

// ─── Preprocess image for OCR ────────────────────────
// Uses max(R,G,B) to preserve colored text (red, gold, etc.),
// then inverts dark backgrounds and binarizes for clean B&W output.
function preprocessForOcr(imgElement) {
  const canvas = document.createElement("canvas");
  const w = imgElement.naturalWidth;
  const h = imgElement.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgElement, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  // Convert each pixel to its max channel value (preserves any bright color)
  const maxVals = new Uint8Array(w * h);
  for (let i = 0; i < d.length; i += 4) {
    maxVals[i / 4] = Math.max(d[i], d[i + 1], d[i + 2]);
  }

  // Sample image corners to detect background brightness
  const cornerSamples = [];
  const s = Math.min(30, Math.floor(Math.min(w, h) * 0.05));
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      cornerSamples.push(maxVals[y * w + x]);
      cornerSamples.push(maxVals[y * w + (w - 1 - x)]);
      cornerSamples.push(maxVals[(h - 1 - y) * w + x]);
      cornerSamples.push(maxVals[(h - 1 - y) * w + (w - 1 - x)]);
    }
  }
  const bgBrightness =
    cornerSamples.reduce((a, b) => a + b, 0) / cornerSamples.length;
  const isDarkBg = bgBrightness < 140;

  // Binarize: text → black, background → white
  const threshold = isDarkBg ? 90 : 160;

  for (let i = 0; i < maxVals.length; i++) {
    let val = maxVals[i];
    if (isDarkBg) val = 255 - val;
    val = val < threshold ? 0 : 255;

    const pi = i * 4;
    d[pi] = d[pi + 1] = d[pi + 2] = val;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ─── OCR via Tesseract.js ────────────────────────────
async function runOcr(imgElement) {
  const preprocessed = preprocessForOcr(imgElement);

  const worker = await Tesseract.createWorker("eng");
  await worker.setParameters({
    tessedit_pageseg_mode: "6", // Assume a single uniform block of text
  });

  const {
    data: { lines },
  } = await worker.recognize(preprocessed);

  await worker.terminate();

  // Filter out low-confidence / empty lines & map to our format
  return lines
    .filter((l) => l.confidence > 40 && l.text.trim().length > 1)
    .map((l) => ({
      text: l.text.trim(),
      bbox: l.bbox, // { x0, y0, x1, y1 }
    }));
}

// ─── Generate mask from bounding boxes ───────────────
function generateMask(imgElement, lines) {
  const canvas = document.createElement("canvas");
  canvas.width = imgElement.naturalWidth;
  canvas.height = imgElement.naturalHeight;
  const ctx = canvas.getContext("2d");

  // Black background (keep everything)
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // White rectangles over text regions (remove these)
  ctx.fillStyle = "#ffffff";
  const PADDING = 8;

  lines.forEach((line) => {
    const { x0, y0, x1, y1 } = line.bbox;
    ctx.fillRect(
      Math.max(0, x0 - PADDING),
      Math.max(0, y0 - PADDING),
      x1 - x0 + PADDING * 2,
      y1 - y0 + PADDING * 2
    );
  });

  return canvas.toDataURL("image/png");
}

// ─── Get base64 of current image ─────────────────────
function getImageDataUri(imgElement) {
  const canvas = document.createElement("canvas");
  canvas.width = imgElement.naturalWidth;
  canvas.height = imgElement.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgElement, 0, 0);
  return canvas.toDataURL("image/png");
}

// ─── Save: generate mask → call API → update image ──
saveBtn.addEventListener("click", handleSave);

async function handleSave() {
  saveBtn.disabled = true;
  processingOverlay.classList.remove("hidden");

  try {
    // Only erase lines that were actually modified or cleared
    const inputs = textInputs.querySelectorAll("input");
    const editedLines = detectedLines.filter((line, i) => {
      const currentValue = inputs[i]?.value ?? "";
      return currentValue !== line.text; // text was changed or cleared
    });

    if (editedLines.length === 0) {
      showError("No text was changed. Edit at least one line.");
      saveBtn.disabled = false;
      processingOverlay.classList.add("hidden");
      return;
    }

    const imageDataUri = getImageDataUri(mainImage);
    const maskDataUri = generateMask(mainImage, editedLines);

    const res = await fetch("/api/erase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageDataUri, mask: maskDataUri }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Server error");
    }

    const { url } = await res.json();

    // Update image with cleaned version
    mainImage.src = url;
    resetEditPanel();
  } catch (err) {
    console.error("Erase error:", err);
    showError(err.message || "Something went wrong, try again.");
    saveBtn.disabled = false;
  } finally {
    processingOverlay.classList.add("hidden");
  }
}

// ─── Cancel ──────────────────────────────────────────
cancelBtn.addEventListener("click", () => {
  mainImage.src = originalImageSrc;
  resetEditPanel();
});

// ─── Helpers ─────────────────────────────────────────
function resetEditPanel() {
  editPanel.classList.add("hidden");
  textInputs.innerHTML = "";
  noText.classList.add("hidden");
  loadingOcr.classList.add("hidden");
  detectedLines = [];
  saveBtn.disabled = true;
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorToast.classList.remove("hidden");
  setTimeout(() => {
    errorToast.classList.add("hidden");
  }, 4000);
}
