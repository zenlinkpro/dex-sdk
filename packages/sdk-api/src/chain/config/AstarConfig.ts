import { EvmChainOption, NetworkId } from './types';
export const MoonbeamConfig: EvmChainOption = {
  chainName: 'Astar',
  networkId: NetworkId.Polkadot,
  chainId: 2006,
  dexType: 'evm',
  ethereumChainId: 592,
  wss: ['wss://rpc.astar.network'],
  routerAddress: '0xf5016C2DF297457a1f9b036990cc704306264B40',
  routerV1Address: '0x4e231728d42565830157FFFaBBB9c78aD5152E94',
  rpcUrls: [
    'https://evm.astar.network'
  ],
  stableAddress: [
    '0xb0Fa056fFFb74c0FB215F86D691c94Ed45b686Aa'
  ],
  factoryAddress: '0x7BAe21fB8408D534aDfeFcB46371c3576a1D5717',
  initCodeHash: '0x158e363fa8e6b5b56fdf204db7bdf7eb2d4d84a333c7bd0909090b01c788baed',
  multicall2: '0xA768070e3e7eb1452De6D454e11Ab55622926F81'
};
