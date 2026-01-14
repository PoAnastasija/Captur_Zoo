const { Router } = require("express");
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs/promises");
const multer = require("multer");

const router = Router();

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, os.tmpdir()),
  filename: (_, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const MISSING_MODULE_REGEX = /ModuleNotFoundError: No module named '([^']+)'/;

const parseJsonSafe = (value) => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractJsonLine = (buffer) => {
  if (!buffer) {
    return null;
  }
  const lines = buffer
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const candidate = lines[i];
    if (!candidate.startsWith("{") && !candidate.startsWith("[")) {
      continue;
    }
    const parsed = parseJsonSafe(candidate);
    if (parsed) {
      return parsed;
    }
  }
  return null;
};

const runDetection = (imagePath) =>
  new Promise((resolve, reject) => {
    const pythonBinary = process.env.PYTHON_BIN || "python3";
    const scriptPath = path.join(__dirname, "../../../detect_objects.py");

    const child = spawn(pythonBinary, [scriptPath, imagePath]);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => reject(error));

    child.on("close", (code) => {
      const payload = stdout.trim();
      const jsonPayload = extractJsonLine(payload);
      if (code !== 0) {
        const error = new Error("Detection script failed");
        error.stderr = stderr;
        error.stdout = payload;
        error.exitCode = code;
        return reject(error);
      }

      if (!jsonPayload) {
        const error = new Error("Empty detection response");
        error.stderr = stderr;
        return reject(error);
      }

      resolve(jsonPayload);
    });
  });

router.post("/", upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: "Aucune photo fournie" });
  }

  try {
    const analysis = await runDetection(req.file.path);

    if (analysis && analysis.error) {
      return res.status(400).json({ ok: false, error: analysis.error });
    }

    return res.status(200).json({ ok: true, analysis });
  } catch (error) {
    console.error("[detect] processing error", error);

    const scriptPayload = extractJsonLine(error?.stdout);
    if (scriptPayload?.error) {
      return res.status(400).json({ ok: false, error: scriptPayload.error });
    }

    const stderrText = error?.stderr || error?.message || "";
    const missingMatch = stderrText.match(MISSING_MODULE_REGEX);
    if (missingMatch) {
      const moduleName = missingMatch[1];
      return res.status(503).json({
        ok: false,
        error: `Dépendance Python manquante: ${moduleName}`,
        details: "Installez les dépendances Python via 'pip install -r backend/requirements.txt' puis relancez le backend.",
      });
    }

    return res.status(500).json({
      ok: false,
      error: "Analyse indisponible",
      details: stderrText,
    });
  } finally {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
  }
});

module.exports = router;
