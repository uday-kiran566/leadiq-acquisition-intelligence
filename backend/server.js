import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "leads.json");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function readLeads() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error("Could not read leads.json:", error.message);
    return [];
  }
}

function writeLeads(leads) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2) + "\n", "utf8");
}

function scoreLead(lead) {
  let score = 0;
  const breakdown = [];
  const add = (label, points, met) => {
    if (met) {
      score += points;
      breakdown.push({ label, points, met: true });
    } else {
      breakdown.push({ label, points: 0, met: false, possiblePoints: points });
    }
  };

  add("Revenue is at least $5M", 35, Number(lead.revenue) >= 5_000_000);
  add("Employee count is between 20 and 200", 25,
    Number(lead.employees) >= 20 && Number(lead.employees) <= 200);
  add("Industry is SaaS or IT Services", 25,
    ["saas", "it services"].includes(String(lead.industry || "").trim().toLowerCase()));
  add("Website is provided", 10, Boolean(String(lead.website || "").trim()));
  add("Record is marked verified", 5, lead.verified === true || lead.verified === 1 || lead.verified === "true");

  const dataQuality = [];
  if (!String(lead.website || "").trim()) dataQuality.push("Missing website");
  if (!(lead.verified === true || lead.verified === 1 || lead.verified === "true")) {
    dataQuality.push("Unverified data");
  }

  return { score, breakdown, dataQuality };
}

function enrichLead(lead) {
  const result = scoreLead(lead);
  return { ...lead, ...result };
}

function deduplicate(leads) {
  const seen = new Set();
  return leads.filter((lead) => {
    const key = String(lead.name || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "LeadIQ API", storage: "local JSON file" });
});

app.get("/api/leads", (req, res) => {
  const search = String(req.query.search || "").trim().toLowerCase();
  const industry = String(req.query.industry || "").trim().toLowerCase();
  let leads = deduplicate(readLeads()).map(enrichLead);

  if (search) {
    leads = leads.filter((lead) =>
      [lead.name, lead.industry, lead.location].some((value) =>
        String(value || "").toLowerCase().includes(search)
      )
    );
  }
  if (industry && industry !== "all") {
    leads = leads.filter((lead) => String(lead.industry).toLowerCase() === industry);
  }
  leads.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  res.json({ total: leads.length, leads });
});

app.get("/api/leads/:id", (req, res) => {
  const lead = readLeads().find((item) => String(item.id) === String(req.params.id));
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  res.json(enrichLead(lead));
});

app.post("/api/leads", (req, res) => {
  const { name, industry, location, revenue, employees, website = "", verified = false } = req.body || {};
  if (!String(name || "").trim() || !String(industry || "").trim() || !String(location || "").trim()) {
    return res.status(400).json({ error: "name, industry, and location are required" });
  }

  const leads = readLeads();
  const normalizedName = String(name).trim().toLowerCase().replace(/\s+/g, " ");
  if (leads.some((item) => String(item.name).trim().toLowerCase().replace(/\s+/g, " ") === normalizedName)) {
    return res.status(409).json({ error: "A lead with this company name already exists" });
  }

  const numericRevenue = Number(revenue);
  const numericEmployees = Number(employees);
  if (!Number.isFinite(numericRevenue) || numericRevenue < 0 ||
      !Number.isInteger(numericEmployees) || numericEmployees < 0) {
    return res.status(400).json({ error: "revenue must be non-negative and employees must be a non-negative integer" });
  }

  const lead = {
    id: Math.max(0, ...leads.map((item) => Number(item.id) || 0)) + 1,
    name: String(name).trim(),
    industry: String(industry).trim(),
    location: String(location).trim(),
    revenue: numericRevenue,
    employees: numericEmployees,
    website: String(website || "").trim(),
    verified: verified === true
  };
  leads.push(lead);
  writeLeads(leads);
  res.status(201).json(enrichLead(lead));
});

app.get("/api/quality", (_req, res) => {
  const leads = deduplicate(readLeads()).map(enrichLead);
  res.json({
    total: leads.length,
    missingWebsite: leads.filter((lead) => lead.dataQuality.includes("Missing website")).length,
    unverified: leads.filter((lead) => lead.dataQuality.includes("Unverified data")).length,
    needsReview: leads.filter((lead) => lead.dataQuality.length > 0).length
  });
});

app.listen(PORT, () => {
  console.log(`LeadIQ API running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
