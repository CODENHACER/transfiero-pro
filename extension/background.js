// Al pulsar el icono, TRANSFIERO Pro se abre en el panel lateral de Chrome.
// El panel se queda abierto aunque cambies de pestaña o muevas el ratón.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
});
