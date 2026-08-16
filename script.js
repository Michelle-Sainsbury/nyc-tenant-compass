document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#tenant-search-form");
  const addressInput = document.querySelector("#address");
  const apartmentInput = document.querySelector("#apartment");
  const buildingInfo = document.querySelector("#results");
  
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const address = addressInput.value.trim();
    const apartment = apartmentInput.value.trim();
    if (!address) {
      alert("Please enter an NYC address.");
      return;
    }
    
    buildingInfo.innerHTML = `
      <h2>Building Information</h2>
      <p><strong>Searching for:</strong> ${address}</p>
      <p>Searching NYC public records. This may take a few moments. Please don't close or refresh this page.</p>
    `;
    
    try {
      const geoURL =
        `https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(address)}&size=1`;
      
      const geoResponse = await fetch(geoURL);
      
      if (!geoResponse.ok) {
        throw new Error("NYC address lookup failed.");
      }
      
      const geoData = await geoResponse.json();
      
      if (!geoData.features || geoData.features.length === 0) {
        buildingInfo.innerHTML = `
          <h2>Building Information</h2>
          <p><strong>No NYC address match was found.</strong></p>
          <p>Please check the address and try again.</p>
        `;
        return;
      }
      
      const property = geoData.features[0].properties;
      const enteredHouseNumber = address.match(/^\d+/)?.[0];
const returnedHouseNumber = property.housenumber;

if (
  enteredHouseNumber &&
  returnedHouseNumber &&
  enteredHouseNumber !== returnedHouseNumber
) {
  buildingInfo.innerHTML = `
    <h2>Building Information</h2>
    <p><strong>We couldn't confidently verify this address.</strong></p>
    <p>You entered: ${address}</p>
    <p>NYC address search returned: ${property.label}</p>
    <p>Please check the address and try again.</p>
  `;
  return;
}
   console.log(property);   
      const houseNumber = property.housenumber;
const streetName = property.street;
const borough = property.borough;

const hpdURL =
  `https://data.cityofnewyork.us/resource/kj4p-ruqc.json?` +
  `$where=upper(housenumber)='${houseNumber}' AND upper(streetname)='${streetName.toUpperCase()}' AND upper(boro)='${borough.toUpperCase()}'`;
      
      const hpdResponse = await fetch(hpdURL);
      
      if (!hpdResponse.ok) {
        throw new Error("HPD lookup failed.");
      }
      
      const hpdData = await hpdResponse.json();
      
      console.log("GeoSearch:", property);
      console.log("HPD:", hpdData);
      
      if (hpdData.length === 0) {
        buildingInfo.innerHTML = `
          <h2>Building Information</h2>
          <p><strong>NYC Address:</strong> ${property.label}</p>
          <p>No matching HPD building record was found.</p>
        `;
        return;
      }
      
      const building = hpdData[0];
      console.log("HPD building:", building);
      console.log("HPD Building ID:", building.buildingid);
   const violationsURL =
  `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$where=buildingid=${building.buildingid}`;

const violationsResponse = await fetch(violationsURL);
const violationsData = await violationsResponse.json();

const complaintsURL =
  `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=100&incident_address=${encodeURIComponent(building.housenumber + " " + building.streetname)}&borough=${encodeURIComponent(building.boro)}`;
  
  const complaintsResponse = await fetch(complaintsURL);
const complaintsData = await complaintsResponse.json();

console.log("311 Complaints:", complaintsData);
const complaintCountURL =
  `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$select=count(*)%20as%20total&incident_address=${encodeURIComponent(building.housenumber + " " + building.streetname)}&borough=${encodeURIComponent(building.boro)}`;

const complaintCountResponse = await fetch(complaintCountURL);
const complaintCountData = await complaintCountResponse.json();

console.log("Total 311 Complaints:", complaintCountData);
const complaintTypeCounts = {};

complaintsData.forEach(complaint => {
  const type = complaint.complaint_type || "Other";
  complaintTypeCounts[type] = (complaintTypeCounts[type] || 0) + 1;
});

console.log("311 Complaint Types:", complaintTypeCounts);

console.log("HPD Violations:", violationsData);   
const openViolations = violationsData.filter(
  violation => violation.violationstatus === "Open"
);

console.log("Open HPD Violations:", openViolations);
const apartmentOpenViolations = apartment ?
  openViolations.filter(
    violation =>
    violation.apartment &&
    violation.apartment.trim().toUpperCase() === apartment.toUpperCase()
  ) :
  [];
const classACount = apartmentOpenViolations.filter(violation => violation.class === "A").length;
const classBCount = apartmentOpenViolations.filter(violation => violation.class === "B").length;
const classCCount = apartmentOpenViolations.filter(violation => violation.class === "C").length;
console.log("Apartment Open Violations:", apartmentOpenViolations);
const uniqueStatuses = [
  ...new Set(
    apartmentOpenViolations.map(
      violation => violation.currentstatus || violation.violationstatus
    )
  )
];

console.log("Unique HPD Statuses:", uniqueStatuses);
const getStatusExplanation = (status) => {
  if (status === "NOTICE OF ISSUANCE SENT TO TENANT") {
  return "HPD sent the tenant a notice that the violation was issued.";
}
  if (status === "NOV SENT OUT") {
    return "HPD sent a Notice of Violation.";
  }
  
  return "";
};
const apartmentViolationsHTML = apartmentOpenViolations
  .map(violation => `
    <div class="violation-item">
   <p><strong>Class: ${violation.class || "Not available"} — ${violation.class === "A" ? "Non-hazardous" : violation.class === "B" ? "Hazardous" : violation.class === "C" ? "Immediately hazardous" : "Classification unavailable"}</strong></p>
      <p><strong>Violation:</strong> ${violation.novdescription || "Description not available"}</p>
     <p><strong>Inspection Date:</strong> ${violation.inspectiondate ? new Date(violation.inspectiondate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not available"}</p> 
      <p><strong>Status:</strong> ${violation.currentstatus || violation.violationstatus || "Not available"}</p>
      ${getStatusExplanation(violation.currentstatus || violation.violationstatus) ? `<p><strong>What this means:</strong> ${getStatusExplanation(violation.currentstatus || violation.violationstatus)}</p>` : ""}
    </div>
  `)
  .join("");
console.log(
  "All violations for entered apartment:",
  violationsData.filter(
    violation =>
    violation.apartment &&
    violation.apartment.trim().toUpperCase() === apartment.toUpperCase()
  )
);
      const boroughCodes = {
  MANHATTAN: "1",
  BRONX: "2",
  BROOKLYN: "3",
  QUEENS: "4",
  "STATEN ISLAND": "5"
};

const boroughCode = boroughCodes[building.boro.toUpperCase()];

const bbl =
  `${boroughCode}${String(building.block).padStart(5, "0")}${String(building.lot).padStart(4, "0")}`;
      
      buildingInfo.innerHTML = `
        <h2>Building Information</h2>

        <p><strong>NYC Address:</strong> ${property.label}</p>

        <p><strong>HPD Building Record Found</strong></p>

        <p><strong>BIN:</strong> ${building.bin || "Not available"}</p>

        <p><strong>Block:</strong> ${building.block || "Not available"}</p>

        <p><strong>Lot:</strong> ${building.lot || "Not available"}</p>

        <p><strong>BBL:</strong> ${bbl}</p>

        <p><strong>ZIP Code:</strong> ${building.zip || "Not available"}</p>
        <p><strong>Building Class:</strong> ${building.dobbuildingclass || "Not available"}</p>

<p><strong>Legal Stories:</strong> ${building.legalstories || "Not available"}</p>
<p><strong>HPD Legal Apartments/Units:</strong> ${building.legalclassa || "Not available"}</p>
<h3>311 Building Complaint History</h3>
<p><strong>Building-wide data:</strong> These 311 complaints are associated with this building address and may have been submitted by residents of any apartment. They do not necessarily relate to Apartment ${apartment || "N/A"}.</p>
<p><strong>Total 311 Complaints for This Building:</strong> ${complaintCountData[0]?.total || 0}</p>
<p><strong>Complaint Types in 100 Retrieved Records:</strong></p>
<p>${Object.entries(complaintTypeCounts)
  .map(([type, count]) => `${type}: ${count}`)
  .join("<br>")}</p>
<h3>HPD Violations</h3>

<p><strong>Open Building-Wide Violations:</strong> ${openViolations.length}</p>
<p><strong>Total HPD Violation Records:</strong> ${violationsData.length}</p>

${apartment ? `
  <h3>Apartment ${apartment}</h3>
  <p><strong>Open Apartment Violations:</strong> ${apartmentOpenViolations.length}</p>
  <p><strong>Class A — Non-hazardous:</strong> ${classACount}</p>
<p><strong>Class B — Hazardous:</strong> ${classBCount}</p>
<p><strong>Class C — Immediately hazardous:</strong> ${classCCount}</p>
  ${apartmentOpenViolations.length > 0
  ? apartmentViolationsHTML
  : "<p>No open HPD violations were found for this apartment.</p>"
}
  <p><strong>Total Apartment Violation Records:</strong> ${
    violationsData.filter(
      violation =>
        violation.apartment &&
        violation.apartment.trim().toUpperCase() === apartment.toUpperCase()
    ).length
  }</p>
` : ""}   
<h3>What This Means</h3>
<p>These results reflect violations found in NYC HPD records. They may not include repair conditions that have not been reported to 311 and inspected by HPD.</p>
<p>If you have repair conditions that do not appear here, consider reporting them through NYC 311 so HPD can determine whether an inspection is appropriate.</p>
<h3>Understanding HPD Violation Classes</h3>
<p><strong>Class A — Non-hazardous:</strong> Conditions that generally require correction within 90 days.</p>
<p><strong>Class B — Hazardous:</strong> Conditions that generally require correction within 30 days.</p>
<p><strong>Class C — Immediately hazardous:</strong> The most serious violations and generally require rapid correction. Some Class C conditions have shorter legally required correction periods.</p>
<h3>About Violation Status</h3> 
<p> An HPD violation shown as open does not necessarily mean the condition currently exists. A condition may have been repaired but remain open in HPD records until the violation is properly certified or otherwise closed by HPD. </p>
<h3>What Can I Do Next?</h3>
<p><strong>Report unresolved repairs:</strong> If your landlord has not corrected a repair condition, you can report it through <a href="https://portal.311.nyc.gov/" target="_blank">NYC 311</a>.</p>
<p><strong>Track your complaint:</strong> Save your 311 Service Request number and use <a href="https://portal.311.nyc.gov/check-status/" target="_blank">NYC 311 Service Request Status</a> to check for updates.</p>
<p><strong>Get housing help:</strong> If repair problems remain unresolved, <a href="https://housingcourtanswers.org/" target="_blank">Housing Court Answers</a> provides information about tenant rights, Housing Court procedures, HP Actions for repairs, and referrals for legal assistance.</p>
<p><strong>Legal assistance:</strong> <a href="https://legalaidnyc.org/get-help/housing-problems/" target="_blank">The Legal Aid Society</a> provides free legal assistance for eligible New Yorkers facing eviction, Housing Court cases, landlord-tenant disputes, and other housing-related problems.</p>
<p><strong>Legal assistance:</strong> <a href="https://mobilizationforjustice.org/projects/housing/" target="_blank">Mobilization for Justice</a> provides free legal assistance to eligible New Yorkers with eviction, Housing Court, repairs, landlord harassment, and other tenant-related matters.</p>
<h3>Rent Stabilization Information</h3><p>NYC Tenant Compass does not currently determine whether an individual apartment is rent stabilized. Rent stabilization status should be verified using official New York State housing records.</p>
<p><strong>Verify your status:</strong> You can <a href="https://hcr.ny.gov/most-common-rent-regulation-issues-tenants" target="_blank">request your apartment's official rent history</a> from the New York State Division of Housing and Community Renewal (DHCR) to help verify its rent-regulation history.</p>
      `;
      
    } catch (error) {
      console.error(error);
      
      buildingInfo.innerHTML = `
        <h2>Building Information</h2>
        <p><strong>We couldn't retrieve NYC building information.</strong></p>
        <p>Please try again in a few moments.</p>
      `;
    }
  });
});