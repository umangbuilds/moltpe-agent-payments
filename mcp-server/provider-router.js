// provider-router.js — Routes tool calls to the correct payment provider.
// Supports: stablecoin, session, fiat, all (combines all three).

const { MockStablecoinProvider } = require('./providers/mock-stablecoin.js');
const { MockSessionProvider } = require('./providers/mock-session.js');
const { MockFiatProvider } = require('./providers/mock-fiat.js');
const { validateProvider } = require('./provider-interface.js');

function createRouter(providerName) {
  const providers = {};

  if (providerName === 'stablecoin' || providerName === 'all') {
    providers.stablecoin = new MockStablecoinProvider();
    validateProvider(providers.stablecoin, 'stablecoin');
  }

  if (providerName === 'session' || providerName === 'all') {
    providers.session = new MockSessionProvider();
    validateProvider(providers.session, 'session');
  }

  if (providerName === 'fiat' || providerName === 'all') {
    providers.fiat = new MockFiatProvider();
    validateProvider(providers.fiat, 'fiat');
  }

  return {
    providerName,
    providers,

    // Get the default provider (first available, or specified)
    getProvider(preferredType) {
      if (preferredType && providers[preferredType]) {
        return providers[preferredType];
      }
      // Return first available
      const types = Object.keys(providers);
      if (types.length === 0) throw new Error('No providers loaded');
      return providers[types[0]];
    },

    // Get a specific provider type, throw if not available
    requireProvider(type) {
      if (!providers[type]) {
        throw new Error(`Provider '${type}' is not loaded. Server started with --provider=${providerName}`);
      }
      return providers[type];
    },

    // Check if a provider type is available
    hasProvider(type) {
      return !!providers[type];
    },

    // List loaded provider names
    listProviders() {
      return Object.keys(providers);
    }
  };
}

module.exports = { createRouter };
