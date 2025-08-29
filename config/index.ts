import { http, cookieStorage, createConfig, createStorage } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { chain } from "../components/utils";

export function getConfig() {
  return createConfig({
    chains: [chain], // add baseSepolia for testing | mainnet time
    connectors: [
      coinbaseWallet({
        appName: "QuiverPay",
        preference: "smartWalletOnly",
        version: "4",
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [chain.id]: http(import.meta.env.VITE_NETWORK_RPC), // add baseSepolia for testing
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
