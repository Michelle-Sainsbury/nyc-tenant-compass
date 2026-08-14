document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const addressInput = form.querySelector("input");
  const buildingInfo = document.querySelector("#results");
  
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    
    const address = addressInput.value.trim();
    
    if (!address) {
      alert("Please enter an NYC address.");
      return;
    }
    
    buildingInfo.innerHTML = `
      <h2>Building Information</h2>
      <p><strong>Searching for:</strong> ${address}</p>
      <p>We're ready to look up this building.</p>
    `;
  });
});