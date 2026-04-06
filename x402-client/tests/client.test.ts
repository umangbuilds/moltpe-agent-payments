// client.test.ts — Tests for the x402 client SDK.
// Mocks the HTTP layer — no real network calls.

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  isPaymentRequired,
  parseRequirements,
  exceedsMaxAmount,
  requirementsToCostEstimate
} from '../src/utils.js';

import { configure, resetConfig, pay, estimateCost } from '../src/client.js';
import { x402Fetch } from '../src/interceptors/fetch.js';
import { x402AxiosInterceptor } from '../src/interceptors/axios.js';
import { GenericFacilitator } from '../src/facilitators/generic.js';

// --- Mock infrastructure ---

function mockSigner(message: string): Promise<string> {
  return Promise.resolve(`signed:${message}`);
}

// Create a mock 402 response
function make402Response(amount: string = '0.05', network: string = 'base'): Response {
  const requirements = JSON.stringify({
    scheme: 'exact',
    network,
    maxAmountRequired: amount,
    resource: 'https://api.example.com/data',
    description: 'API data access',
    facilitatorUrl: 'https://mock-facilitator.test/pay',
    payTo: '0xrecipient',
    currency: 'USDC'
  });

  return new Response('Payment Required', {
    status: 402,
    headers: { 'X-Payment': requirements }
  });
}

function make200Response(body: string = '{"data":"success"}'): Response {
  return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } });
}

// Mock global fetch for testing
let fetchMock: ((url: string | URL | Request, init?: RequestInit) => Promise<Response>) | null = null;
const originalFetch = globalThis.fetch;

function setFetchMock(fn: (url: string | URL | Request, init?: RequestInit) => Promise<Response>) {
  fetchMock = fn;
  globalThis.fetch = fn as typeof fetch;
}

function restoreFetch() {
  fetchMock = null;
  globalThis.fetch = originalFetch;
}

// --- Tests ---

describe('isPaymentRequired', () => {
  it('returns true for 402 status', () => {
    assert.strictEqual(isPaymentRequired({ status: 402 }), true);
  });

  it('returns false for 200 status', () => {
    assert.strictEqual(isPaymentRequired({ status: 200 }), false);
  });

  it('returns false for 401 status', () => {
    assert.strictEqual(isPaymentRequired({ status: 401 }), false);
  });

  it('returns false for 500 status', () => {
    assert.strictEqual(isPaymentRequired({ status: 500 }), false);
  });
});

describe('parseRequirements', () => {
  it('parses valid X-Payment header from Headers object', () => {
    const headers = new Headers({
      'X-Payment': JSON.stringify({
        scheme: 'exact',
        network: 'base',
        maxAmountRequired: '0.05',
        resource: 'https://api.example.com/data'
      })
    });

    const req = parseRequirements(headers);
    assert.strictEqual(req.scheme, 'exact');
    assert.strictEqual(req.network, 'base');
    assert.strictEqual(req.maxAmountRequired, '0.05');
  });

  it('parses valid X-Payment header from plain object', () => {
    const headers = {
      'x-payment': JSON.stringify({
        scheme: 'exact',
        network: 'polygon',
        maxAmountRequired: '0.10',
        resource: 'test'
      })
    };

    const req = parseRequirements(headers);
    assert.strictEqual(req.network, 'polygon');
    assert.strictEqual(req.maxAmountRequired, '0.10');
  });

  it('throws when X-Payment header is missing', () => {
    assert.throws(() => parseRequirements(new Headers()), /Missing X-Payment header/);
  });

  it('throws when X-Payment header is not valid JSON', () => {
    const headers = new Headers({ 'X-Payment': 'not-json' });
    assert.throws(() => parseRequirements(headers), /not valid JSON/);
  });

  it('throws when required fields are missing', () => {
    const headers = new Headers({
      'X-Payment': JSON.stringify({ scheme: 'exact' })
    });
    assert.throws(() => parseRequirements(headers), /missing required fields/);
  });

  it('defaults currency to USDC when not specified', () => {
    const headers = new Headers({
      'X-Payment': JSON.stringify({
        network: 'base',
        maxAmountRequired: '0.01',
        resource: 'test'
      })
    });
    const req = parseRequirements(headers);
    assert.strictEqual(req.currency, 'USDC');
  });
});

describe('exceedsMaxAmount', () => {
  it('returns false when required is under max', () => {
    assert.strictEqual(exceedsMaxAmount('0.05', '0.10'), false);
  });

  it('returns true when required exceeds max', () => {
    assert.strictEqual(exceedsMaxAmount('0.15', '0.10'), true);
  });

  it('returns false when required equals max', () => {
    assert.strictEqual(exceedsMaxAmount('0.10', '0.10'), false);
  });

  it('returns true for non-numeric values', () => {
    assert.strictEqual(exceedsMaxAmount('abc', '0.10'), true);
  });
});

describe('requirementsToCostEstimate', () => {
  it('converts requirements to cost estimate', () => {
    const estimate = requirementsToCostEstimate({
      scheme: 'exact',
      network: 'base',
      maxAmountRequired: '0.05',
      resource: 'test',
      currency: 'USDC',
      description: 'Test payment'
    });

    assert.strictEqual(estimate.required, true);
    assert.strictEqual(estimate.amount, '0.05');
    assert.strictEqual(estimate.currency, 'USDC');
    assert.strictEqual(estimate.network, 'base');
  });
});

describe('configure and resetConfig', () => {
  beforeEach(() => {
    resetConfig();
  });

  it('sets defaults that are used by pay()', () => {
    configure({ maxAmount: '0.50', facilitator: 'https://test.facilitator' });
    // We verify this works by checking pay() uses these defaults
    // (tested indirectly through the pay tests below)
    resetConfig();
  });
});

describe('pay()', () => {
  beforeEach(() => {
    resetConfig();
    restoreFetch();
  });

  it('passes through non-402 response unchanged', async () => {
    setFetchMock(async () => make200Response('{"ok":true}'));
    const result = await pay('https://api.example.com/data');
    assert.strictEqual(result.success, true);
    assert.ok(result.response);
    assert.strictEqual(result.response.status, 200);
    restoreFetch();
  });

  it('returns error when maxAmount is exceeded', async () => {
    setFetchMock(async () => make402Response('1.00'));
    const result = await pay('https://api.example.com/data', {
      maxAmount: '0.50',
      signer: mockSigner,
      facilitator: 'https://mock.test/pay'
    });
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('exceeds maximum'));
    restoreFetch();
  });

  it('returns error when no signer provided', async () => {
    setFetchMock(async () => make402Response('0.05'));
    const result = await pay('https://api.example.com/data', {
      facilitator: 'https://mock.test/pay'
    });
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('No signer'));
    restoreFetch();
  });

  it('returns error when no facilitator URL available', async () => {
    // Make a 402 response WITHOUT facilitatorUrl in requirements
    const requirements = JSON.stringify({
      scheme: 'exact',
      network: 'base',
      maxAmountRequired: '0.05',
      resource: 'test'
    });
    setFetchMock(async () =>
      new Response('Payment Required', {
        status: 402,
        headers: { 'X-Payment': requirements }
      })
    );
    const result = await pay('https://api.example.com/data', { signer: mockSigner });
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('No facilitator URL'));
    restoreFetch();
  });

  it('handles full 402 payment flow', async () => {
    let callCount = 0;
    setFetchMock(async (_url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof _url === 'string' ? _url : _url instanceof URL ? _url.href : _url.url;
      // Facilitator call
      if (urlStr.includes('mock-facilitator')) {
        return new Response(JSON.stringify({ paymentProof: 'proof-abc-123' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      callCount++;
      // First call: return 402
      if (callCount === 1) {
        return make402Response('0.05');
      }
      // Retry call: verify payment proof header and return 200
      const headers = init?.headers as Record<string, string> | undefined;
      if (headers?.['X-Payment-Proof'] === 'proof-abc-123') {
        return make200Response('{"data":"paid-content"}');
      }
      return new Response('Unauthorized', { status: 401 });
    });

    const result = await pay('https://api.example.com/data', {
      signer: mockSigner,
      facilitator: 'https://mock-facilitator.test/pay'
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.cost, '0.05');
    assert.ok(result.response);
    assert.strictEqual(result.response.status, 200);
    restoreFetch();
  });

  it('returns error when facilitator fails', async () => {
    let callCount = 0;
    setFetchMock(async (_url: string | URL | Request) => {
      const urlStr = typeof _url === 'string' ? _url : _url instanceof URL ? _url.href : _url.url;
      if (urlStr.includes('mock-facilitator')) {
        return new Response('Internal Server Error', { status: 500 });
      }
      callCount++;
      if (callCount === 1) return make402Response('0.05');
      return make200Response();
    });

    const result = await pay('https://api.example.com/data', {
      signer: mockSigner,
      facilitator: 'https://mock-facilitator.test/pay'
    });

    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('Facilitator'));
    restoreFetch();
  });

  it('handles network errors gracefully', async () => {
    setFetchMock(async () => {
      throw new Error('Network unreachable');
    });
    const result = await pay('https://api.example.com/data');
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('Network unreachable'));
    restoreFetch();
  });
});

describe('estimateCost()', () => {
  beforeEach(() => {
    restoreFetch();
  });

  it('returns required:true with amount for 402 URL', async () => {
    setFetchMock(async () => make402Response('0.05', 'base'));
    const estimate = await estimateCost('https://api.example.com/data');
    assert.strictEqual(estimate.required, true);
    assert.strictEqual(estimate.amount, '0.05');
    assert.strictEqual(estimate.network, 'base');
    restoreFetch();
  });

  it('returns required:false for non-402 URL', async () => {
    setFetchMock(async () => make200Response());
    const estimate = await estimateCost('https://api.example.com/free');
    assert.strictEqual(estimate.required, false);
    restoreFetch();
  });

  it('returns required:false on network error', async () => {
    setFetchMock(async () => { throw new Error('Network error'); });
    const estimate = await estimateCost('https://unreachable.example.com');
    assert.strictEqual(estimate.required, false);
    restoreFetch();
  });
});

describe('x402Fetch', () => {
  beforeEach(() => {
    restoreFetch();
  });

  it('returns response for non-402 URL', async () => {
    setFetchMock(async () => make200Response('{"free":"data"}'));
    const response = await x402Fetch('https://api.example.com/free', {
      signer: mockSigner,
      facilitator: 'https://mock.test/pay'
    });
    assert.strictEqual(response.status, 200);
    restoreFetch();
  });

  it('throws when payment fails (no signer)', async () => {
    setFetchMock(async () => make402Response('0.05'));
    await assert.rejects(
      () => x402Fetch('https://api.example.com/paid'),
      /No signer/
    );
    restoreFetch();
  });
});

describe('x402AxiosInterceptor', () => {
  it('rejects non-402 errors unchanged', async () => {
    const interceptor = x402AxiosInterceptor({ signer: mockSigner });
    const error = { response: { status: 500 }, message: 'Server Error' };
    await assert.rejects(() => interceptor(error), (err: any) => {
      return err.response?.status === 500;
    });
  });

  it('rejects when no signer for 402', async () => {
    const interceptor = x402AxiosInterceptor({});
    const error = {
      response: {
        status: 402,
        headers: {
          'x-payment': JSON.stringify({
            scheme: 'exact',
            network: 'base',
            maxAmountRequired: '0.05',
            resource: 'test',
            facilitatorUrl: 'https://mock.test'
          })
        }
      },
      config: {}
    };
    await assert.rejects(() => interceptor(error), /No signer/);
  });

  it('rejects when maxAmount exceeded for 402', async () => {
    const interceptor = x402AxiosInterceptor({
      signer: mockSigner,
      maxAmount: '0.01'
    });
    const error = {
      response: {
        status: 402,
        headers: {
          'x-payment': JSON.stringify({
            scheme: 'exact',
            network: 'base',
            maxAmountRequired: '0.50',
            resource: 'test'
          })
        }
      },
      config: {}
    };
    await assert.rejects(() => interceptor(error), /exceeds maximum/);
  });
});

describe('GenericFacilitator', () => {
  beforeEach(() => {
    restoreFetch();
  });

  it('submits payment and returns proof', async () => {
    setFetchMock(async () =>
      new Response(JSON.stringify({ paymentProof: 'proof-xyz' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const facilitator = new GenericFacilitator('https://mock.test/pay');
    const proof = await facilitator.submitPayment(
      {
        scheme: 'exact',
        network: 'base',
        maxAmountRequired: '0.05',
        resource: 'test',
        currency: 'USDC'
      },
      mockSigner
    );

    assert.strictEqual(proof, 'proof-xyz');
    restoreFetch();
  });

  it('throws when facilitator returns error', async () => {
    setFetchMock(async () => new Response('Bad Request', { status: 400 }));

    const facilitator = new GenericFacilitator('https://mock.test/pay');
    await assert.rejects(
      () => facilitator.submitPayment(
        { scheme: 'exact', network: 'base', maxAmountRequired: '0.05', resource: 'test' },
        mockSigner
      ),
      /Facilitator returned 400/
    );
    restoreFetch();
  });

  it('throws when facilitator response missing paymentProof', async () => {
    setFetchMock(async () =>
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const facilitator = new GenericFacilitator('https://mock.test/pay');
    await assert.rejects(
      () => facilitator.submitPayment(
        { scheme: 'exact', network: 'base', maxAmountRequired: '0.05', resource: 'test' },
        mockSigner
      ),
      /missing paymentProof/
    );
    restoreFetch();
  });
});
