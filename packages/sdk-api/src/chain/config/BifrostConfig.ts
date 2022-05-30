import { ModuleBChainOption, NetworkId } from './types';
export const BifrostConfig: ModuleBChainOption = {
  chainName: 'Bifrost',
  networkId: NetworkId.Kusama,
  chainId: 2001,
  dexType: 'moduleB',
  wss: [
    'wss://bifrost-parachain.api.onfinality.io/public-ws'
  ]
};
