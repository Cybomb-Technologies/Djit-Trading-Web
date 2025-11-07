// server/config/cashfree.js
const axios = require("axios");
require("dotenv").config();

const MODE = (process.env.CASHFREE_MODE || "sandbox").toUpperCase();
const isSandbox = MODE === "SANDBOX";

// ✅ Use env BASE_URL or default by mode
const BASE_URL =
  process.env.CASHFREE_BASE_URL ||
  (isSandbox
    ? "https://sandbox.cashfree.com/pg/orders"
    : "https://api.cashfree.com/pg/orders");

// ✅ Create axios instance
const cashfree = axios.create({
  baseURL: BASE_URL,
  headers: {
    "x-client-id": process.env.CASHFREE_APP_ID,
    "x-client-secret": process.env.CASHFREE_SECRET_KEY,
    "x-api-version": "2022-09-01",
    "Content-Type": "application/json",
  },
});

// Optional: Host header for production
cashfree.interceptors.request.use((config) => {
  config.headers["Host"] = isSandbox
    ? "sandbox.cashfree.com"
    : "api.cashfree.com";
  return config;
});

console.log("🧩 Cashfree Config Loaded");
console.log("Mode:", MODE);
console.log("Base URL:", BASE_URL);
console.log("App ID Loaded:", !!process.env.CASHFREE_APP_ID);
console.log("Secret Key Loaded:", !!process.env.CASHFREE_SECRET_KEY);

module.exports = cashfree;
