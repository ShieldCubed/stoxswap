// IMPORTANT: Replace YOUR_WIDGET_ID with the real ID from your StealthEX Partner dashboard
// Go to → https://stealthex.io/pp/ → Widget / Code tab

document.addEventListener('DOMContentLoaded', () => {
  if (window.stealthexWidget) {
    const cleanup = window.stealthexWidget.init("9af4400f-05b5-446b-8345-0306d32995a9", {
      size: 380,
      containerId: "stealthex-widget-container"
    });

    // Optional event listeners
    window.stealthexWidget.events.on("exchangestart", () => {
      console.log("Exchange started");
    });

    window.stealthexWidget.events.on("statuschange", (status) => {
      console.log("Status changed:", status);
    });
  } else {
    console.error("StealthEX widget failed to load");
  }
});
