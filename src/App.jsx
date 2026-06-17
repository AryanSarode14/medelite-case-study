import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./App.css";

function App() {
  const [ccn, setCcn] = useState("");
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [manual, setManual] = useState({
    customName: "",
    emr: "",
    currentCensus: "",
    patientType: "",
    previousCoverage: "Yes",
    previousPerformance: "",
    medicalCoverage: "",
  });

  const updateManual = (field, value) => {
    setManual((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const field = (...keys) =>
    keys.map((key) => facility?.[key]).find((value) => value) || "";

  const getReportData = () => {
    const facilityName =
      manual.customName.trim() || field("provider_name", "Provider Name");
    const location =
      field("location", "Location") ||
      [
        field("provider_address", "Provider Address"),
        field("citytown", "City/Town"),
        field("state", "State"),
        field("zip_code", "ZIP Code"),
      ]
        .filter(Boolean)
        .join(", ");

    return {
      facilityName,
      state: field("state", "State"),
      medicareUrl: `https://www.medicare.gov/care-compare/details/nursing-home/${ccn.trim()}`,
      rows: [
        ["Name of Facility", facilityName],
        ["Location", location],
        ["EMR", manual.emr],
        [
          "Census Capacity",
          field("number_of_certified_beds", "Number of Certified Beds"),
        ],
        ["Current Census", manual.currentCensus],
        ["Type of Patient", manual.patientType],
        ["Previous Coverage from Medelite", manual.previousCoverage],
        [
          "Previous Provider Performance from Medelite",
          manual.previousPerformance,
        ],
        ["Medical Coverage", manual.medicalCoverage],
        ["Overall Star Rating", field("overall_rating", "Overall Rating")],
        [
          "Health Inspection",
          field("health_inspection_rating", "Health Inspection Rating"),
        ],
        ["Staffing", field("staffing_rating", "Staffing Rating")],
        ["Quality of Resident Care", field("qm_rating", "QM Rating")],
      ],
    };
  };

  const fetchFacility = async () => {
    if (!ccn.trim()) {
      setError("Please enter a CCN");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/facility/${encodeURIComponent(ccn.trim())}`
      );

      if (!response.ok) {
        throw new Error("CMS request failed");
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        setError("Facility not found");
        setFacility(null);
        return;
      }

      setFacility(data.results[0]);
    } catch (err) {
      console.error(err);
      setError("Error fetching facility");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    const report = getReportData();
    const doc = new jsPDF();
    const generatedDate = new Date().toLocaleDateString();
    const fileFacilityName =
      report.facilityName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "facility";

    doc.setFillColor(23, 36, 52);
    doc.rect(0, 0, 210, 38, "F");
    doc.setFillColor(61, 161, 150);
    doc.rect(0, 38, 210, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("INFINITE", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Managed by MEDELITE", 14, 26);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("FACILITY ASSESSMENT SNAPSHOT", 196, 18, { align: "right" });

    if (report.state) {
      doc.setDrawColor(255, 255, 255);
      doc.setFillColor(47, 71, 94);
      doc.roundedRect(177, 23, 19, 9, 1.5, 1.5, "FD");
      doc.setFontSize(10);
      doc.text(report.state, 186.5, 29, { align: "center" });
    }

    doc.setTextColor(23, 36, 52);
    doc.setFontSize(13);
    doc.text(report.facilityName || "Facility Assessment", 14, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 102, 118);
    doc.text(`Generated ${generatedDate}`, 14, 59);
    doc.text("Source: CMS Provider Data Catalog", 196, 59, { align: "right" });

    autoTable(doc, {
      startY: 68,
      head: [["Report Field", "Value"]],
      body: report.rows,
      theme: "grid",
      styles: {
        cellPadding: 3.2,
        fontSize: 10,
        lineColor: [216, 226, 236],
        lineWidth: 0.15,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [23, 36, 52],
        fontStyle: "bold",
        textColor: [255, 255, 255],
      },
      alternateRowStyles: {
        fillColor: [248, 251, 253],
      },
      columnStyles: {
        0: {
          cellWidth: 74,
          fillColor: [239, 246, 249],
          fontStyle: "bold",
          textColor: [43, 58, 76],
        },
        1: { cellWidth: 108, textColor: [23, 36, 52] },
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setDrawColor(216, 226, 236);
    doc.line(14, finalY - 5, 196, finalY - 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(38, 123, 115);
    doc.textWithLink("View official Medicare Care Compare profile", 14, finalY, {
      url: report.medicareUrl,
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(116, 130, 148);
    doc.text(
      "Public CMS values may change as federal datasets refresh. Manual fields reflect user-entered operational notes.",
      14,
      286
    );

    doc.save(`${fileFacilityName}-facility-assessment.pdf`);
  };

  return (
    <div className="page">
      <div className="card">
        <header className="header">
          <div>
            <h1>INFINITE</h1>
            <p>Managed by MEDELITE</p>
          </div>
          <h2>
            FACILITY ASSESSMENT SNAPSHOT
            {field("state", "State") && (
              <span className="state-code">{field("state", "State")}</span>
            )}
          </h2>
        </header>

        <section className="search-section">
          <label>CMS Certification Number (CCN)</label>

          <div className="search-row">
            <input
              value={ccn}
              onChange={(e) => setCcn(e.target.value)}
              placeholder="Example: 686123"
            />

            <button onClick={fetchFacility}>
              {loading ? "Loading..." : "Fetch Facility"}
            </button>
          </div>
        </section>

        {error && <p className="error">{error}</p>}

        <section className="form-grid">
          <div>
            <label>Facility Name Override</label>
            <input
              value={manual.customName}
              onChange={(e) => updateManual("customName", e.target.value)}
              placeholder={
                field("provider_name", "Provider Name") || "Facility Name"
              }
            />
          </div>

          <div>
            <label>EMR</label>
            <input
              value={manual.emr}
              onChange={(e) => updateManual("emr", e.target.value)}
              placeholder="PCC"
            />
          </div>

          <div>
            <label>Current Census</label>
            <input
              value={manual.currentCensus}
              onChange={(e) => updateManual("currentCensus", e.target.value)}
              placeholder="112"
            />
          </div>

          <div>
            <label>Type of Patient</label>
            <input
              value={manual.patientType}
              onChange={(e) => updateManual("patientType", e.target.value)}
              placeholder="Long-term & Short-term"
            />
          </div>

          <div>
            <label>Previous Coverage from Medelite</label>

            <select
              value={manual.previousCoverage}
              onChange={(e) => updateManual("previousCoverage", e.target.value)}
            >
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div>
            <label>Previous Provider Performance</label>
            <input
              value={manual.previousPerformance}
              onChange={(e) =>
                updateManual("previousPerformance", e.target.value)
              }
              placeholder="About 30 patients/day"
            />
          </div>

          <div>
            <label>Medical Coverage</label>
            <input
              value={manual.medicalCoverage}
              onChange={(e) => updateManual("medicalCoverage", e.target.value)}
              placeholder="Optometry, PCP, Podiatry"
            />
          </div>
        </section>
        {facility && (
          <div className="preview">
            <h3>CMS Data</h3>

            <dl>
              <div>
                <dt>Name</dt>
                <dd>{field("provider_name", "Provider Name")}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{field("provider_address", "Provider Address")}</dd>
              </div>
              <div>
                <dt>City</dt>
                <dd>{field("citytown", "City/Town")}</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>{field("state", "State")}</dd>
              </div>
              <div>
                <dt>Beds</dt>
                <dd>
                  {field("number_of_certified_beds", "Number of Certified Beds")}
                </dd>
              </div>
              <div>
                <dt>Overall Rating</dt>
                <dd>{field("overall_rating", "Overall Rating")}</dd>
              </div>
              <div>
                <dt>Health Inspection</dt>
                <dd>
                  {field(
                    "health_inspection_rating",
                    "Health Inspection Rating"
                  )}
                </dd>
              </div>
              <div>
                <dt>Staffing</dt>
                <dd>{field("staffing_rating", "Staffing Rating")}</dd>
              </div>
              <div>
                <dt>Quality Measure</dt>
                <dd>{field("qm_rating", "QM Rating")}</dd>
              </div>
            </dl>
          </div>
        )}
        <button className="download" onClick={downloadPdf}>
          Download PDF
        </button>
      </div>
    </div>
  );
}

export default App;
