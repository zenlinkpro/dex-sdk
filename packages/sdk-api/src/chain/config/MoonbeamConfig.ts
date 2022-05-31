import { EvmChainOption, NetworkId } from './types';
export const MoonbeamConfig: EvmChainOption = {
  chainName: 'Moonbeam',
  networkId: NetworkId.Polkadot,
  chainId: 2004,
  dexType: 'evm',
  ethereumChainId: 1284,
  wss: ['wss://wss.api.moonbeam.network'],
  routerAddress: '0x7a3909C7996EFE42d425cD932fc44E3840fCAB71',
  routerV1Address: '0xeeD18d08B79f5245D1e106CAf0c69a3836A39d16',
  rpcUrls: [
    'https://rpc.api.moonbeam.network'
  ],
  stableAddress: [
    '0x68bed2c54Fd0e6Eeb70cFA05723EAE7c06805EC5'
  ],
  factoryAddress: '0xF49255205Dfd7933c4D0f25A57D40B1511F92fEF',
  initCodeHash: '0x7eba2084662eb5b00a4d7e2a74743051dc33bfe07fcbcd724b88b351a7078fda',
  multicall2: '0x69573274171d435cdd0aa1Bc8709253D67ac0a29'
};
