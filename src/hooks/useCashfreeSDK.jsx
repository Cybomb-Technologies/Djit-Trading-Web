import { useEffect, useState } from "react";

const useCashfreeSDK = () => {
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    if (window.CashfreeSDK) {
      setSdkLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => console.error("Cashfree SDK failed to load");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return sdkLoaded;
};

export default useCashfreeSDK;
