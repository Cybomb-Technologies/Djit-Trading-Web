// ngrok-start.js
const ngrok = require("@ngrok/ngrok");

(async function () {
  const listener = await ngrok.connect({ addr: 5000 });
  console.log(`🔗 Public URL: ${listener.url()}`);
})();
