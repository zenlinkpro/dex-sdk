import { EvmChainOption, NetworkId } from './types';
export const MoonriverChainConfig: EvmChainOption = {
  chainName: 'Moonriver',
  networkId: NetworkId.Kusama,
  chainId: 2023,
  dexType: 'evm',
  ethereumChainId: 1285,
  wss: ['wss://wss.api.moonriver.moonbeam.network'],
  routerAddress: '0xe6FE3Db4c5A2e4a9Ab3301201b38724E578B35cA',
  routerV1Address: '0x2f84b9713a96FB356683de7B44dd2d37658b189d',
  rpcUrls: [
    'https://rpc.api.moonriver.moonbeam.network'
  ],
  factoryAddress: '0xf36AE63d89983E3aeA8AaaD1086C3280eb01438D',
  initCodeHash: '0x6278f87a17986c7b82be214d6e4cf48101d7a40fe979fa914ed6337de05c76b8',
  multicall2: '0x959b76B30f12C6Ad3F3C59611F5377d44A704208'
};
