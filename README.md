🖼️ Manus Text Edit — Proof of Concept

A minimal proof‑of‑concept demonstrating editable text detection and AI‑based text removal inside images.

🎯 Purpose

This POC validates a simple user flow where someone can:

- view an AI‑generated image containing text

- detect the text automatically

- edit individual text lines

- save changes

- receive the same image with only the edited text removed (background reconstructed)

🧩 What This POC Demonstrates

- OCR integration to extract text from images

- A clean UI for editing each detected text line independently

- Selective inpainting (BRIA Eraser via Replicate) to remove only the modified text areas

- A simple, intuitive flow without any complex image editor

🚫 Out of Scope (Intentionally)

These features are explicitly not included in this POC:

- Reinserting the edited text into the image

- Preserving fonts, styles, or layout

- Full AI regeneration of the image
These belong to the “Next Steps” phase.

🛠️ Technologies Used

- Tesseract.js v5 — client‑side OCR for text detection with bounding boxes (runs fully in the browser, no API key required)

- BRIA Eraser (Replicate) — AI inpainting / text removal using masks

- Vanilla HTML, CSS, JavaScript — minimal UI implementation without frameworks

- Node.js + Express — lightweight backend for static file serving and Replicate API proxy

- dotenv — environment variable management for API keys

- Sharp — development‑only tool for sample image processing

🧪 User Flow

1. Display an AI‑generated image

2. User clicks Edit

3. OCR runs → detected text appears as separate input fields

4. User edits only the lines they want to change

5. On Save, only the edited lines’ bounding boxes are sent to the eraser

6. The updated image is shown with those text areas cleanly removed

✔️ Result

A functional prototype proving the concept of “editable text inside images” — a foundational step toward a full Manus‑style AI image editor.
