import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());

app.get("/api/facility/:ccn", async (req, res) => {
  try {
    const { ccn } = req.params;
    const encodedCcn = encodeURIComponent(ccn.trim());

    const cmsUrl =
      "https://data.cms.gov/provider-data/api/1/datastore/query/4pq5-n9py/0" +
      `?conditions[0][property]=cms_certification_number_ccn` +
      `&conditions[0][value]=${encodedCcn}` +
      `&conditions[0][operator]=%3D`;

    const response = await fetch(cmsUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch CMS data",
      error: error.message,
    });
  }
});

app.use(express.static(path.join(__dirname, "dist")));

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
