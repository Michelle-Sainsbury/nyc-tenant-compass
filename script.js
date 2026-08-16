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

console.log("Apartment Open Violations:", apartmentOpenViolations);
const apartmentViolationsHTML = apartmentOpenViolations
  .map(violation => `
    <div class="violation-item">
      <p><strong>Class:</strong> ${violation.class || "Not available"}</p>
      <p><strong>Violation:</strong> ${violation.novdescription || "Description not available"}</p>
     <p><strong>Inspection Date:</strong> ${violation.inspectiondate ? new Date(violation.inspectiondate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not available"}</p> 
      <p><strong>Status:</strong> ${violation.currentstatus || violation.violationstatus || "Not available"}</p>
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
  <h3>HPD Violations</h3>

<p><strong>Open Building-Wide Violations:</strong> ${openViolations.length}</p>
<p><strong>Total HPD Violation Records:</strong> ${violationsData.length}</p>

${apartment ? `
  <h3>Apartment ${apartment}</h3>
  <p><strong>Open Apartment Violations:</strong> ${apartmentOpenViolations.length}</p>
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