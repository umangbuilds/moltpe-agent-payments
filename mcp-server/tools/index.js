// tools/index.js — Loads and exports all MCP tool definitions.

const checkBalance = require('./check-balance.js');
const listTransactions = require('./list-transactions.js');
const agentInfo = require('./agent-info.js');
const sendPayment = require('./send-payment.js');
const callX402Endpoint = require('./call-x402-endpoint.js');
const createInvoice = require('./create-invoice.js');
const checkInvoiceStatus = require('./check-invoice-status.js');
const listInvoices = require('./list-invoices.js');
const payInvoice = require('./pay-invoice.js');
const createPaymentSession = require('./create-payment-session.js');
const getSessionStatus = require('./get-session-status.js');

function loadTools() {
  return [
    checkBalance,
    listTransactions,
    agentInfo,
    sendPayment,
    callX402Endpoint,
    createInvoice,
    checkInvoiceStatus,
    listInvoices,
    payInvoice,
    createPaymentSession,
    getSessionStatus
  ];
}

module.exports = { loadTools };
