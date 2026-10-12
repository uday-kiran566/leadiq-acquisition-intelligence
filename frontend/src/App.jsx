
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownToLine, Building2, CheckCircle2, CircleAlert,
  Database, FileSearch, Filter, Gauge, Layers3, RefreshCw, Search,
  ShieldCheck, Sparkles, Target, TrendingUp
} from "lucide-react";

const API = "http://localhost:5000/api";
const INDUSTRIES = [
  "All",
  "SaaS",
  "IT Services",
  "Manufacturing",
  "Business Services"
];

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(Number(value) || 0);
}

function scoreClass(score) {
  if (score >= 80) return "score-high";
  if (score >= 60) return "score-medium";
  return "score-low";
}

export default function App() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("All");
  const [activePage, setActivePage] = useState("leads");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (industry !== "All") {
        params.set("industry", industry);
      }

      const response = await fetch(
        `${API}/leads?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      setLeads(data.leads || []);
    } catch {
      setError(
        "Cannot connect to the API. Start the backend in a separate terminal on port 5000."
      );
    } finally {
      setLoading(false);
    }
  }, [search, industry]);

  useEffect(() => {
    const timer = setTimeout(loadLeads, 180);
    return () => clearTimeout(timer);
  }, [loadLeads]);

  const allStats = useMemo(() => {
    const scores = leads.map((lead) => Number(lead.score) || 0);

    return {
      total: leads.length,
      average: scores.length
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) /
              scores.length
          )
        : 0,
      high: leads.filter((lead) => lead.score >= 80).length,
      review: leads.filter(
        (lead) => (lead.dataQuality || []).length > 0
      ).length
    };
  }, [leads]);

  const qualityLeads = useMemo(
    () =>
      leads.filter(
        (lead) => (lead.dataQuality || []).length > 0
      ),
    [leads]
  );

  const goToPage = (page) => {
    setIndustry("All");
    setSearch("");
    setActivePage(page);
  };

  const exportCsv = () => {
    if (!leads.length) {
      setNotice("There are no leads to export.");
      return;
    }

    const columns = [
      "name",
      "industry",
      "location",
      "revenue",
      "employees",
      "website",
      "verified",
      "score",
      "dataQuality"
    ];

    const escapeCsv = (value) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;

    const rows = [
      columns.join(","),
      ...leads.map((lead) =>
        columns
          .map((key) =>
            escapeCsv(
              key === "dataQuality"
                ? (lead.dataQuality || []).join("; ")
                : lead[key]
            )
          )
          .join(",")
      )
    ];

    const blob = new Blob([rows.join("\r\n")], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "leadiq-acquisition-pipeline.csv";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("CSV export started.");
    setTimeout(() => setNotice(""), 2500);
  };

  const submitLead = async (event) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const payload = {
      name: form.get("name"),
      industry: form.get("industry"),
      location: form.get("location"),
      revenue: Number(form.get("revenue")),
      employees: Number(form.get("employees")),
      website: form.get("website"),
      verified: form.get("verified") === "on"
    };

    setSaving(true);
    setNotice("");

    try {
      const response = await fetch(`${API}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not add lead");
      }

      setShowAdd(false);
      setSearch("");
      setIndustry("All");
      setActivePage("leads");
      setNotice(`${result.name} added to your pipeline.`);

      await loadLeads();
    } catch (err) {
      setNotice(err.message || "Could not add lead.");
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(""), 3500);
    }
  };

  const openLead = async (lead) => {
    try {
      const response = await fetch(`${API}/leads/${lead.id}`);

      if (response.ok) {
        setSelected(await response.json());
      } else {
        setSelected(lead);
      }
    } catch {
      setSelected(lead);
    }
  };

  const openScoringRules = () => {
    setSelected({
      name: "Scoring methodology",
      score: null,
      breakdown: [
        {
          label: "Revenue at least $5M",
          points: 35,
          met: true
        },
        {
          label: "20–200 employees",
          points: 25,
          met: true
        },
        {
          label: "SaaS or IT Services",
          points: 25,
          met: true
        },
        {
          label: "Website provided",
          points: 10,
          met: true
        },
        {
          label: "Record marked verified",
          points: 5,
          met: true
        }
      ],
      dataQuality: []
    });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Layers3 size={22} />
          </div>
          <div>
            <div className="brand-name">
              Lead<span>IQ</span>
            </div>
            <div className="brand-caption">
              ACQUISITION INTELLIGENCE
            </div>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <button
          className={`nav-item ${
            activePage === "leads" ? "active" : ""
          }`}
          onClick={() => goToPage("leads")}
        >
          <Gauge size={17} />
          <span>Lead Intelligence</span>
        </button>

        <button
          className="nav-item"
          onClick={() => {
            goToPage("leads");
            setShowAdd(true);
          }}
        >
          <Target size={17} />
          <span>Acquisition Targets</span>
          <span className="nav-plus">+</span>
        </button>

        <button
          className={`nav-item ${
            activePage === "quality" ? "active" : ""
          }`}
          onClick={() => goToPage("quality")}
        >
          <ShieldCheck size={17} />
          <span>Data Quality</span>
        </button>

        <div className="sidebar-bottom">
          <div className="environment">
            <span className="status-dot" />
            <div>
              <strong>Prototype environment</strong>
              <small>Local API · Sample data</small>
            </div>
          </div>
          <div className="sidebar-foot">
            <Database size={14} />
            JSON-backed demo storage
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>
              {activePage === "quality"
                ? "Data Quality"
                : "Lead Intelligence"}
            </strong>
          </div>

          <div className="topbar-right">
            <span className="live-pill">
              <span className="status-dot" />
              API workspace
            </span>
            <div className="avatar">LQ</div>
          </div>
        </header>

        <section className="page-content">
          {notice && (
            <div className="notice">
              <CheckCircle2 size={16} />
              {notice}
            </div>
          )}

          {activePage === "leads" && (
            <>
              <div className="page-kicker">
                <Sparkles size={14} />
                ACQUISITION WORKSPACE
              </div>

              <div className="title-row">
                <div>
                  <h1>Lead Intelligence</h1>
                  <p className="subtitle">
                    Find the right businesses to pursue.
                  </p>
                </div>

                <div className="title-actions">
                  <button
                    className="button button-secondary"
                    onClick={loadLeads}
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </button>

                  <button
                    className="button button-primary"
                    onClick={exportCsv}
                  >
                    <ArrowDownToLine size={16} />
                    Export CSV
                  </button>
                </div>
              </div>

              <p className="intro">
                Prioritize potential acquisition targets using
                transparent fit criteria and data-quality signals.
              </p>

              <div className="demo-banner">
                <span>
                  <Activity size={15} />
                  DEMO DATA
                </span>
                <p>
                  Synthetic sample companies · Scores are
                  rule-based and illustrative
                </p>
              </div>

              <section className="metrics">
                <Metric
                  icon={<Building2 size={18} />}
                  label="UNIQUE COMPANIES"
                  value={allStats.total}
                  note="After duplicate removal"
                />
                <Metric
                  icon={<Gauge size={18} />}
                  label="AVERAGE FIT SCORE"
                  value={allStats.average}
                  suffix="/100"
                  note="Rule-based preliminary assessment"
                />
                <Metric
                  icon={<TrendingUp size={18} />}
                  label="HIGH-PRIORITY LEADS"
                  value={allStats.high}
                  note="Fit score of 80 or above"
                />
                <Metric
                  icon={<CircleAlert size={18} />}
                  label="NEEDS REVIEW"
                  value={allStats.review}
                  note="Missing or unverified information"
                />
              </section>

              <section className="pipeline">
                <div className="pipeline-head">
                  <div>
                    <div className="section-kicker">
                      PIPELINE OVERVIEW
                    </div>
                    <h2>Acquisition pipeline</h2>
                    <p>
                      Review, qualify, and prioritize matching
                      companies.
                    </p>
                  </div>

                  <button
                    className="button button-outline"
                    onClick={() => setShowAdd(true)}
                  >
                    <span className="plus">+</span>
                    Add lead
                  </button>
                </div>

                <div className="toolbar">
                  <div className="search-box">
                    <Search size={17} />
                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search company, industry, or location..."
                      aria-label="Search leads"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="filter-label">
                    <Filter size={15} />
                    Industry
                  </div>

                  <div className="industry-filters">
                    {INDUSTRIES.map((item) => (
                      <button
                        key={item}
                        className={`filter-chip ${
                          industry === item ? "selected" : ""
                        }`}
                        onClick={() => setIndustry(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="table-meta">
                  <span>
                    {loading
                      ? "Loading leads..."
                      : `${leads.length} ${
                          leads.length === 1 ? "result" : "results"
                        }`}
                  </span>
                  <span>
                    Sorted by fit score{" "}
                    <span className="sort-arrow">↓</span>
                  </span>
                </div>

                {error ? (
                  <div className="error-panel">
                    <CircleAlert size={20} />
                    <div>
                      <strong>Connection issue</strong>
                      <p>{error}</p>
                      <button
                        className="button button-secondary"
                        onClick={loadLeads}
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>COMPANY</th>
                          <th>INDUSTRY</th>
                          <th>LOCATION</th>
                          <th>REVENUE</th>
                          <th>EMPLOYEES</th>
                          <th>FIT SCORE</th>
                          <th>DATA QUALITY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((lead) => (
                          <tr
                            key={lead.id}
                            onClick={() => openLead(lead)}
                            className="lead-row"
                            tabIndex={0}
                            onKeyDown={(event) =>
                              event.key === "Enter" &&
                              openLead(lead)
                            }
                          >
                            <td>
                              <div className="company-cell">
                                <div className="company-icon">
                                  {lead.name
                                    .split(/\s+/)
                                    .map((part) => part[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <strong>{lead.name}</strong>
                                  <small>Company ID: {lead.id}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="industry-tag">
                                {lead.industry}
                              </span>
                            </td>
                            <td>{lead.location}</td>
                            <td className="revenue">
                              {money(lead.revenue)}
                            </td>
                            <td>
                              {Number(lead.employees).toLocaleString(
                                "en-US"
                              )}
                            </td>
                            <td>
                              <div className="score-cell">
                                <span
                                  className={`score-badge ${scoreClass(
                                    lead.score
                                  )}`}
                                >
                                  {lead.score}
                                </span>
                                <div className="score-track">
                                  <div
                                    className={`score-fill ${scoreClass(
                                      lead.score
                                    )}`}
                                    style={{
                                      width: `${lead.score}%`
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td>
                              {(lead.dataQuality || []).length ? (
                                <div className="quality-list">
                                  {lead.dataQuality.map((item) => (
                                    <span
                                      className="quality-warning"
                                      key={item}
                                    >
                                      <CircleAlert size={12} />
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="quality-complete">
                                  <CheckCircle2 size={13} />
                                  Complete*
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {!loading && !leads.length && (
                      <div className="empty-state">
                        <FileSearch size={30} />
                        <strong>No matching leads</strong>
                        <p>
                          Try another search or industry filter.
                        </p>
                        <button
                          className="button button-secondary"
                          onClick={() => {
                            setSearch("");
                            setIndustry("All");
                          }}
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="table-footer">
                  <span>
                    <ShieldCheck size={14} />
                    Scores use transparent criteria
                  </span>
                  <span>
                    Click any company to view score details
                  </span>
                </div>
              </section>

              <section className="scoring-note">
                <div className="scoring-icon">
                  <FileSearch size={18} />
                </div>
                <div>
                  <strong>How to interpret these signals</strong>
                  <p>
                    Fit scores are preliminary, rule-based indicators
                    — not an acquisition recommendation. “Complete”
                    means the required demo fields are present; it
                    does not independently verify their accuracy.
                  </p>
                </div>
                <button onClick={openScoringRules}>
                  View scoring rules
                </button>
              </section>
            </>
          )}

          {activePage === "quality" && (
            <>
              <div className="page-kicker">
                <ShieldCheck size={14} />
                DATA QUALITY REVIEW
              </div>

              <div className="title-row">
                <div>
                  <h1>Data Quality</h1>
                  <p className="subtitle">
                    Find incomplete or unverified acquisition records.
                  </p>
                </div>

                <button
                  className="button button-secondary"
                  onClick={loadLeads}
                  disabled={loading}
                >
                  <RefreshCw size={16} />
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <p className="intro">
                Review missing information and verification flags
                before relying on a company's preliminary fit score.
              </p>

              <div className="demo-banner">
                <span>
                  <Activity size={15} />
                  REVIEW REQUIRED
                </span>
                <p>
                  {qualityLeads.length} records need attention in
                  the currently loaded results.
                </p>
              </div>

              <section className="metrics">
                <Metric
                  icon={<Building2 size={18} />}
                  label="RECORDS REVIEWED"
                  value={leads.length}
                  note="Records currently loaded"
                />
                <Metric
                  icon={<CircleAlert size={18} />}
                  label="NEEDS ATTENTION"
                  value={qualityLeads.length}
                  note="Records with quality flags"
                />
                <Metric
                  icon={<CheckCircle2 size={18} />}
                  label="COMPLETE RECORDS"
                  value={leads.length - qualityLeads.length}
                  note="No recorded quality flags"
                />
              </section>

              {error ? (
                <div className="error-panel">
                  <CircleAlert size={20} />
                  <div>
                    <strong>Connection issue</strong>
                    <p>{error}</p>
                    <button
                      className="button button-secondary"
                      onClick={loadLeads}
                    >
                      Try again
                    </button>
                  </div>
                </div>
              ) : (
                <section className="pipeline">
                  <div className="pipeline-head">
                    <div>
                      <div className="section-kicker">
                        QUALITY CONTROL
                      </div>
                      <h2>Records requiring review</h2>
                      <p>
                        Open a record to inspect its score and
                        available quality details.
                      </p>
                    </div>
                  </div>

                  <div className="table-meta">
                    <span>
                      {loading
                        ? "Loading records..."
                        : `${qualityLeads.length} records to review`}
                    </span>
                    <span>Sorted by current API result order</span>
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>COMPANY</th>
                          <th>INDUSTRY</th>
                          <th>LOCATION</th>
                          <th>ISSUES TO REVIEW</th>
                          <th>FIT SCORE</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qualityLeads.map((lead) => (
                          <tr key={lead.id} className="lead-row">
                            <td>
                              <div className="company-cell">
                                <div className="company-icon">
                                  {lead.name
                                    .split(/\s+/)
                                    .map((part) => part[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <strong>{lead.name}</strong>
                                  <small>Company ID: {lead.id}</small>
                                </div>
                              </div>
                            </td>
                            <td>{lead.industry}</td>
                            <td>{lead.location}</td>
                            <td>
                              <div className="quality-list">
                                {(lead.dataQuality || []).map(
                                  (item) => (
                                    <span
                                      className="quality-warning"
                                      key={item}
                                    >
                                      <CircleAlert size={12} />
                                      {item}
                                    </span>
                                  )
                                )}
                              </div>
                            </td>
                            <td>
                              <span
                                className={`score-badge ${scoreClass(
                                  lead.score
                                )}`}
                              >
                                {lead.score}/100
                              </span>
                            </td>
                            <td>
                              <button
                                className="button button-secondary"
                                onClick={() => openLead(lead)}
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {!loading && qualityLeads.length === 0 && (
                      <div className="empty-state">
                        <CheckCircle2 size={30} />
                        <strong>No flagged records</strong>
                        <p>
                          No data-quality issues were found in the
                          currently loaded records.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="table-footer">
                    <span>
                      <ShieldCheck size={14} />
                      Quality flags from the API
                    </span>
                    <span>
                      A complete record is not independently verified.
                    </span>
                  </div>
                </section>
              )}
            </>
          )}

          <footer>
            <span>
              LEADIQ · ACQUISITION INTELLIGENCE PROTOTYPE
            </span>
            <span>Built for thoughtful, data-aware sourcing</span>
          </footer>
        </section>
      </main>

      {showAdd && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget &&
            setShowAdd(false)
          }
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-title"
          >
            <div className="modal-head">
              <div>
                <div className="section-kicker">
                  PIPELINE MANAGEMENT
                </div>
                <h2 id="add-title">Add acquisition lead</h2>
                <p>New records are saved to local JSON storage.</p>
              </div>
              <button
                className="close-button"
                onClick={() => setShowAdd(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form className="lead-form" onSubmit={submitLead}>
              <label>
                Company name
                <input
                  name="name"
                  required
                  maxLength="150"
                  placeholder="e.g. Example Software"
                />
              </label>

              <div className="form-grid">
                <label>
                  Industry
                  <select name="industry" required>
                    <option value="SaaS">SaaS</option>
                    <option value="IT Services">IT Services</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Business Services">
                      Business Services
                    </option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  Location
                  <input
                    name="location"
                    required
                    placeholder="e.g. Texas"
                  />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  Annual revenue (USD)
                  <input
                    name="revenue"
                    type="number"
                    min="0"
                    step="1000"
                    required
                    placeholder="5000000"
                  />
                </label>
                <label>
                  Employees
                  <input
                    name="employees"
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="45"
                  />
                </label>
              </div>

              <label>
                Website (optional)
                <input
                  name="website"
                  placeholder="example.com"
                />
              </label>

              <label className="checkbox-label">
                <input name="verified" type="checkbox" />
                Data reviewed / marked verified
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save lead"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selected && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget &&
            setSelected(null)
          }
        >
          <section
            className="modal detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
          >
            <div className="modal-head">
              <div>
                <div className="section-kicker">
                  LEAD INTELLIGENCE
                </div>
                <h2 id="detail-title">{selected.name}</h2>
                <p>
                  {selected.industry || "Methodology"}
                  {selected.location
                    ? ` · ${selected.location}`
                    : ""}
                </p>
              </div>
              <button
                className="close-button"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {selected.score !== null &&
              selected.score !== undefined && (
                <div className="detail-score">
                  <div>
                    <span>PRELIMINARY FIT SCORE</span>
                    <strong>
                      {selected.score}
                      <small>/100</small>
                    </strong>
                  </div>
                  <span
                    className={`score-badge ${scoreClass(
                      selected.score
                    )}`}
                  >
                    {selected.score >= 80
                      ? "High fit"
                      : selected.score >= 60
                      ? "Review"
                      : "Lower fit"}
                  </span>
                </div>
              )}

            <div className="detail-section-title">
              Scoring breakdown
            </div>

            <div className="breakdown-list">
              {(selected.breakdown || []).map((item) => (
                <div className="breakdown-row" key={item.label}>
                  <span
                    className={
                      item.met
                        ? "breakdown-met"
                        : "breakdown-unmet"
                    }
                  >
                    {item.met ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <CircleAlert size={15} />
                    )}
                  </span>
                  <span>{item.label}</span>
                  <strong>
                    {item.met
                      ? `+${item.points}`
                      : `+0 / ${item.possiblePoints}`}
                  </strong>
                </div>
              ))}
            </div>

            {(selected.dataQuality || []).length > 0 && (
              <div className="detail-quality">
                <strong>Data quality items to review</strong>
                {selected.dataQuality.map((item) => (
                  <span key={item}>
                    <CircleAlert size={14} />
                    {item}
                  </span>
                ))}
              </div>
            )}

            <p className="modal-disclaimer">
              This heuristic supports initial prioritization only.
              Validate all company information independently before
              making business decisions.
            </p>

            <div className="form-actions">
              <button
                className="button button-secondary"
                onClick={() => setSelected(null)}
              >
                Close details
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value, suffix, note }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-icon">{icon}</span>
        <span className="metric-label">{label}</span>
      </div>
      <div className="metric-value">
        {value}
        <small>{suffix}</small>
      </div>
      <p>{note}</p>
    </article>
  );
}
