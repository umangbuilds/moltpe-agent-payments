// axios.ts — Axios response interceptor for automatic x402 payment handling.
// Usage: axios.interceptors.response.use(undefined, x402AxiosInterceptor(options))

import { PaymentOptions } from '../types.js';
import { isPaymentRequired, parseRequirements, exceedsMaxAmount } from '../utils.js';
import { GenericFacilitator } from '../facilitators/generic.js';

/**
 * Creates an Axios response error interceptor that handles 402 Payment Required.
 *
 * Usage:
 *   import axios from 'axios';
 *   import { x402AxiosInterceptor } from '@moltpe/x402-client';
 *
 *   axios.interceptors.response.use(undefined, x402AxiosInterceptor({
 *     facilitator: 'https://xpay.sh/facilitator',
 *     signer: mySignerFunction,
 *     maxAmount: '0.10'
 *   }));
 *
 *   // Now any 402 response is automatically handled
 *   const response = await axios.get('https://api.example.com/data');
 */
export function x402AxiosInterceptor(options: PaymentOptions = {}) {
  return async function interceptor(error: any): Promise<any> {
    const response = error?.response;

    // Only handle 402 responses
    if (!response || !isPaymentRequired(response)) {
      return Promise.reject(error);
    }

    // Parse payment requirements from response headers
    // Axios stores headers as a plain object
    const headers = response.headers || {};
    const requirements = parseRequirements(headers);

    // Check maxAmount
    const maxAmount = options.maxAmount;
    if (maxAmount && exceedsMaxAmount(requirements.maxAmountRequired, maxAmount)) {
      return Promise.reject(new Error(
        `Payment of ${requirements.maxAmountRequired} exceeds maximum of ${maxAmount}`
      ));
    }

    // Get signer
    const signer = options.signer;
    if (!signer) {
      return Promise.reject(new Error('No signer provided for x402 payment'));
    }

    // Get facilitator
    const facilitatorUrl = options.facilitator || requirements.facilitatorUrl;
    if (!facilitatorUrl) {
      return Promise.reject(new Error('No facilitator URL for x402 payment'));
    }

    // Submit payment
    const adapter = new GenericFacilitator(facilitatorUrl);
    const paymentProof = await adapter.submitPayment(requirements, signer);

    // Retry the original request with payment proof
    const config = error.config;
    config.headers = config.headers || {};
    config.headers['X-Payment-Proof'] = paymentProof;

    // Use the axios instance from the error to retry.
    // We import axios dynamically — it is a peer dependency, not bundled.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axiosInstance = error.config?.__axiosInstance || (await (Function('return import("axios")')() as Promise<any>)).default;
    return axiosInstance.request(config);
  };
}
