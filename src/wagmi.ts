import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

const electroneumTestnet = {
  id: 839999,
  name: 'exSat Hayek Testnet',
  network: 'exsat-hayek-testnet',
  nativeCurrency: {
    name: 'BTC',
    symbol: 'BTC',
    decimals: 18,
  },
  rpcUrls: {
    public: { http: ['https://evm-tst3.exsat.network'] },
    default: { http: ['https://evm-tst3.exsat.network'] },
  },
  blockExplorers: {
    default: { name: 'exSatScan Testnet', url: 'https://scan-testnet.exsat.network' },
  },
};

export const config = getDefaultConfig({
  appName: import.meta.env.VITE_WALLET_CONNECT_PROJECT_NAME,
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  chains: [
    electroneumTestnet,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true" ? [sepolia] : []),
  ],
  ssr: true,
});

