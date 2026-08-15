document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#tenant-search-form");
  const addressInput = document.querySelector("#address");
  const buildingInfo = document.querySelector("#results");
  
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const address = addressInput.value.trim();
    
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