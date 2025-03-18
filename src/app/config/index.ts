// Configuration for AnimeChain Explorer
export const config = {
  // Basic configuration
  vercelEnv: process.env.VERCEL_ENV || 'development',

  // Analytics
  posthog: {
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_YfaYuVYkxFAKLwChuCuHfp8Ob83m71EhGH5AbOvrJBY",
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  },

  // Authentication
  privy: {
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clyjazlvc01dpgbgh6hukt3oh",
    clientId: process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || "client-WY2o72gLCY3rdHDVmVNMgEAPpeGwkqWKXtetsig5PQhh3",
  },

  // Blockchain
  alchemy: {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "dy1pk7WR550bww6aS_LBLd0kUYTTJ8IY",
    rpcBaseUrl: process.env.NEXT_PUBLIC_ALCHEMY_RPC_BASE_URL || "https://anime-mainnet.g.alchemy.com/v2",
    gasManagerPolicyId: process.env.NEXT_PUBLIC_ALCHEMY_GAS_MANAGER_POLICY_ID || "",
  },

  // Account Abstraction
  accountAbstraction: {
    enabled: process.env.NEXT_PUBLIC_AA_ENABLED === "true",
    directEnabled: process.env.NEXT_PUBLIC_DIRECT_AA_ENABLED === "true",
    gasManagerPolicyId: process.env.NEXT_PUBLIC_GAS_MANAGER_POLICY_ID || "cf5ddf83-42d1-4b19-b22a-a45356fc13e3",
  },

  // AnimeChain Network
  animeChain: {
    mainnet: {
      rpcUrl: process.env.NEXT_PUBLIC_ANIME_MAINNET_RPC_URL || "https://rpc-animechain-39xf6m45e3.t.conduit.xyz",
      wsUrl: process.env.NEXT_PUBLIC_ANIME_MAINNET_WS_URL || "wss://rpc-animechain-39xf6m45e3.t.conduit.xyz",
    },
    testnet: {
      rpcUrl: process.env.NEXT_PUBLIC_ANIME_TESTNET_RPC_URL || "https://rpc-animechain-testnet-i8yja6a1a0.t.conduit.xyz",
      wsUrl: process.env.NEXT_PUBLIC_ANIME_TESTNET_WS_URL || "wss://rpc-animechain-testnet-i8yja6a1a0.t.conduit.xyz",
    },
    entryPointAddress: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  },

  // API Endpoints
  api: {
    graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || "https://www.anime.com/api/graphql",
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || "",
    dune: {
      apiKey: process.env.NEXT_PUBLIC_DUNE_API_KEY || "",
    },
  },

  // Payment
  payment: {
    stripe: {
      apiKey: process.env.NEXT_PUBLIC_STRIPE_API_KEY || "",
    },
    crossmint: {
      projectId: process.env.NEXT_PUBLIC_CROSSMINT_PROJECT_ID || "",
    },
    currency: process.env.NEXT_PUBLIC_DOT_COM_V1_SHOP_CURRENCY || "ANIME",
  },

  // Streaming
  streaming: {
    streamUrl: process.env.NEXT_PUBLIC_STREAM_URL || "https://amg24826-amg24826c1-azuki-worldwide-6069.playouts.now.amagi.tv/242-394-6069.m3u8",
    backupStreamUrl: process.env.NEXT_PUBLIC_BACKUP_STREAM_URL || "",
    ep2StreamEndTime: process.env.NEXT_PUBLIC_EP2_STREAM_END_TIME || "",
  },

  // Third-party APIs
  thirdParty: {
    googleMaps: {
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    },
    recaptcha: {
      siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LfgkMEqAAAAAIlsfIjBaDlldv48BcCuYVS4Fkm1",
    },
    datadog: {
      logsClientToken: process.env.NEXT_PUBLIC_DATADOG_LOGS_CLIENT_TOKEN || "pub39b6c6434ef2076f92d38444811f47d7",
    },
  },

  // Other
  web: {
    rpcUrl: process.env.NEXT_PUBLIC_WEB_RPC_URL || "https://arb-mainnet.g.alchemy.com/v2/md6mKMHMUTyKJYGaGcoHAkg_Xq-9LCf2",
  },
};

// Default JSON-RPC request payload
export const DEFAULT_JSON_RPC_PAYLOAD = {
  jsonrpc: "2.0",
  id: 0,
  method: "eth_call",
  params: [
    {
      data: "0x9b249f690000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000005800000000000017c61b5bEe81050EC8eFc9c6fecd8b4e464e00000000000000000000000029421209add2783a2747fc044a06877c5e4a591d00000000000000000000000000000000000000000000000000000000000000000000000000000000",
      to: config.animeChain.entryPointAddress
    },
    "latest"
  ]
}; 