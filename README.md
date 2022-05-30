# dex-sdk


## Getting Start

you need to install the @zenlink-dex/sdk-api  @zenlink-dex/sdk-core @zenlink-dex/sdk-router package, understand the structures, and start using it. 


### Installation 


```bash
yarn add @zenlink-dex/sdk-api  @zenlink-dex/sdk-core @zenlink-dex/sdk-router

```

## Example
#### ModuleBApi 
This api for the Dex base on the moduleB type. the dex on Bifrost is this type. 



```javascript

import { WsProvider, Keyring } from "@polkadot/api";
import { ModuleBApi } from '@zenlink-dex/sdk-api';
import { Percent, Token, TokenAmount } from '@zenlink-dex/sdk-core';
import { firstValueFrom } from 'rxjs';
import { SmartRouterV2 } from '@zenlink-dex/sdk-router';
import { cryptoWaitReady } from '@polkadot/util-crypto';


const tokensMeta = [
  {
    networkId: 200,
    chainId: 2001,
    assetType: 0,
    assetIndex: 0,
    symbol: 'BNC',
    decimals: 12,
    name: 'BNC',
    address: ''
  },
  {
    networkId: 200,
    chainId: 2001,
    assetType: 2,
    assetIndex: 516,
    symbol: 'KSM',
    decimals: 12,
    name: 'KSM',
    address: ''
  },
  {
    networkId: 200,
    chainId: 2001,
    assetType: 2,
    assetIndex: 770,
    symbol: 'KUSD',
    decimals: 12,
    name: 'KUSD',
    address: ''
  }
]

async function main() {
  await cryptoWaitReady();


  // prepare wallet
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 6 });
  const PHRASE = 'YOUR SEEDS';
  const accountPair = keyring.addFromUri(PHRASE);


  console.log(`account address ${accountPair.address}`);

  // generate Tokens
  const tokens = tokensMeta.map((item) => {
    return new Token(item);
  });


  const tokensMap: Record<string, Token> = {}
  tokens.reduce((total, cur) => {
    total[cur.assetId] = cur;
    return total;
  }, tokensMap)

  // generate the dex api
  const provider = new WsProvider('wss://bifrost-parachain.api.onfinality.io/public-ws');
  const dexApi = new ModuleBApi(
    provider
  );

  await provider.isReady;
  await dexApi.initApi(); // init the api;

  const account = accountPair.address;


  // query the tokens balance of acoount
  const tokenBalances = await firstValueFrom(dexApi.balanceOfTokens(tokens, account));
  console.log('tokenBalances', tokenBalances);


  // query the standard pair of tokens
  const standardPairs = await firstValueFrom(dexApi.standardPairOfTokens(tokens))
  console.log('standardPairs', standardPairs);

  // query the standardPools of standard pairs;
  const standardPools: any = await firstValueFrom(dexApi.standardPoolOfPairs(standardPairs))
  console.log('standardPools', standardPools);


  // swap 10 bnc to kusd
  const bncToken = tokensMap['200-2001-0-0'];
  const kusdToken = tokensMap['200-2001-2-770'];
  const bncAmount = new TokenAmount(bncToken, (10_000_000_000_000).toString());
  // use smart router to get the best trade;
  const result = SmartRouterV2.swapExactTokensForTokens(
    bncAmount,
    kusdToken,
    standardPools,
    []
  );

  const trade = result.trade;
  if(!trade) {
    console.log('There is no match for this trade')
    return
  }

  console.log(
    'The match trade is swap', `${
      trade.inputAmount.toPrecision(8)} ${trade.inputAmount.token.symbol
      } to ${trade.outputAmount.toPrecision(8)} ${trade.outputAmount.token.symbol}`
    );
  console.log('The executionPrice is',
  `1 ${trade.inputAmount.token.symbol} = ${trade.executionPrice.toPrecision(8)} ${trade.outputAmount.token.symbol}`
  );
  console.log('The route path is ',trade.route.tokenPath.map((item) => item.symbol).join(' -> '));

  console.log('The route path is ',trade.route.routePath.map((item) => item.stable));


  // set slippage of 5%
  const slippageTolerance = new Percent(5, 100);
  if(!dexApi.api) return;

  const blockNumber = await dexApi.api.query.system.number();

  const deadline = Number(blockNumber.toString()) + 20; // deadline is block height

  console.log('deadline', deadline);

  // get the extrinsics of this swap
  const extrinsics = dexApi.swapExactTokensForTokens(
    trade.route.routePath, // path
    trade.inputAmount, // input token and amount
    trade.minimumAmountOut(slippageTolerance), // min amount out
    account, // recipient
    deadline // deadline
  );

  if(!extrinsics) return;

  const unsub = await extrinsics.signAndSend(accountPair, (status) => {
    if(status.isInBlock) {
      console.log('extrinsics submit in block')
    }
    if(status.isError) {
      console.log('extrinsics submit error')
    };
    if(status.isFinalized) {
      console.log('extrinsics submit is finalized')
      unsub();
    }
  });

// use api
}

main().then(() => {
  console.log('end');
});


```



#### EvmApi

This api for the Dex base on the evm type. the dex on Moonriver and Moonbeam is this type. 

```javascript


import { EvmApi } from '@zenlink-dex/sdk-api';
import { Percent, Token, TokenAmount, TradeType, StablePair, StableSwap } from '@zenlink-dex/sdk-core';
import { firstValueFrom } from 'rxjs';
import { SmartRouterV2 } from '@zenlink-dex/sdk-router';


import { ethers } from "ethers";

// moonbeam chain config
const MoonbeamConfigJson = {
  "chainName": "Moonbeam",
  "networkId": 300,
  "chainId": 2004,
  "dexType": "evm",
  "ethereumChainId": 1284,
  "wss": ["wss://wss.api.moonbeam.network"],
  "routerAddress": "0x7a3909C7996EFE42d425cD932fc44E3840fCAB71",
  "routerV1Address": "0xeeD18d08B79f5245D1e106CAf0c69a3836A39d16",

  "scanBrowserPrefix": "https://moonbeam.moonscan.io/tx",
  "rpcUrls": [
    "https://rpc.api.moonbeam.network"
  ],
  "factoryAddress": "0xF49255205Dfd7933c4D0f25A57D40B1511F92fEF",
  "initCodeHash": "0x7eba2084662eb5b00a4d7e2a74743051dc33bfe07fcbcd724b88b351a7078fda",
  "multicall2": "0x69573274171d435cdd0aa1Bc8709253D67ac0a29"
}

// moonbeam stable pool contract address
const MoonbeamStableContractAddress = [
  '0x39D40980A0825184b915633Cc3147EC9E4698455',
  '0x2DC678DE98Ef481a8A7B74F60B9Fc8647c95D129',
  '0xaB4c616daD6B077911F283f90CD08c13C7C4d2E5'
];





const tokensMeta = [
  {
    networkId: 300,
    chainId: 2004,
    assetType: 255,
    assetIndex: 0,
    symbol: 'WGLMR',
    decimals: 18,
    name: 'Wrapped GLMR',
    address: '0xacc15dc74880c9944775448304b263d191c6077f'
  },
  {
    networkId: 300,
    chainId: 2004,
    assetType: 255,
    assetIndex: 0,
    symbol: 'ZLK',
    decimals: 18,
    name: 'Zenlink Network Token',
    address: '0x3fd9b6c9a24e09f67b7b706d72864aebb439100c'
  },
  {
    networkId: 300,
    chainId: 2004,
    assetType: 255,
    assetIndex: 0,
    symbol: 'anyUSDC',
    decimals: 6,
    name: 'USDC Coin',
    address: '0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b'
  },
  {
    networkId: 300,
    chainId: 2004,
    assetType: 255,
    assetIndex: 0,
    symbol: 'madUSDC',
    decimals: 6,
    name: 'USDC Coin',
    address: '0x8f552a71efe5eefc207bf75485b356a0b3f01ec9'
  },
  {
    networkId: 300,
    chainId: 2004,
    assetType: 255,
    assetIndex: 0,
    symbol: 'madUSDT',
    decimals: 6,
    name: 'Tether USD',
    address: '0x8e70cd5b4ff3f62659049e74b6649c6603a0e594'
  },
  {
    networkId: 300,
    chainId: 2004,
    assetType: 255,
    assetIndex: 0,
    symbol: 'Frax',
    decimals: 18,    name: 'Frax',
    address: '0x322e86852e492a7ee17f28a78c663da38fb33bfb'
  }
]

const PRIVITE_KEY = 'YOUR PRIVITE_KEY'

async function main() {


  const provider = new ethers.providers.JsonRpcProvider(MoonbeamConfigJson.rpcUrls[0]);

  const singer = new ethers.Wallet(
    PRIVITE_KEY,
    provider
  );

  const account = await singer.getAddress();

  console.log(`account address ${account}`);

  // generate Tokens
  const tokens = tokensMeta.map((item) => {
    return new Token(item);
  });


  const tokensMap: Record<string, Token> = {}
  tokens.reduce((total, cur) => {
    total[cur.assetId] = cur;
    return total;
  }, tokensMap)

  // generate the dex api
  const dexApi = new EvmApi(
    singer,
    {
      networkId: MoonbeamConfigJson.networkId,
      chainId: MoonbeamConfigJson.chainId,
      multicall2: MoonbeamConfigJson.multicall2,
      factoryAddress: MoonbeamConfigJson.factoryAddress,
      initCodeHash: MoonbeamConfigJson.initCodeHash,
      routerAddress: MoonbeamConfigJson.routerAddress,
      routerV1Address: MoonbeamConfigJson.routerV1Address
    }
  );

  // query the tokens balance of acoount
  const tokenBalances = await firstValueFrom(dexApi.balanceOfTokens(tokens, account));
  console.log('tokenBalances ', tokenBalances );

  // query the standard pair of tokens
  const standardPairs = await firstValueFrom(dexApi.standardPairOfTokens(tokens))
  console.log('standardPairs', standardPairs);

  // query the standardPools of standard pairs;
  const standardPools: any = await firstValueFrom(dexApi.standardPoolOfPairs(standardPairs))
  console.log('standardPools', standardPools);

  // query the stable pair;
  const stablePairs: StablePair[] = await firstValueFrom(dexApi.stablePairOf(MoonbeamStableContractAddress));
  console.log('stablePairs', stablePairs);

  // query the stable pool of stable pair;
  const stablePools: StableSwap[] = await firstValueFrom(dexApi.stablePoolOfPairs(stablePairs));
  console.log('stablePairs', stablePools);




  const fraxToken = tokensMap['300-2004-255-0x322e86852e492a7ee17f28a78c663da38fb33bfb'];
  const zlkToken = tokensMap['300-2004-255-0x3fd9b6c9a24e09f67b7b706d72864aebb439100c'];
  const madUSDCToken = tokensMap['300-2004-255-0x8f552a71efe5eefc207bf75485b356a0b3f01ec9'];
  const anyUSDCToken = tokensMap['300-2004-255-0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b'];
  const wglmrToken = tokensMap['300-2004-255-0xacc15dc74880c9944775448304b263d191c6077f'];

  // swap from token -> toToken
  const fromToken = wglmrToken;
  const fromTokenAmount = new TokenAmount(fromToken, (1_000_000_000_000_000).toString());
  const toToken = anyUSDCToken;


  // use smart router to get the best trade;
  const result = SmartRouterV2.swapExactTokensForTokens(
    fromTokenAmount,
    toToken,
    standardPools,
    stablePools
  )

  const trade = result.trade;

  if(!trade) {
    console.log('There is no match for this trade')
    return
  }
  console.log(
      'The match trade is swap', `${
        trade.inputAmount.toPrecision(8)} ${trade.inputAmount.token.symbol
        } to ${trade.outputAmount.toPrecision(8)} ${trade.outputAmount.token.symbol}`
      );
  console.log('The executionPrice is',
    `1 ${trade.inputAmount.token.symbol} = ${trade.executionPrice.toPrecision(8)} ${trade.outputAmount.token.symbol}`
    );

  console.log('The route path is ',trade.route.tokenPath.map((item) => item.symbol).join(' -> '));
  

  const currentBlock = await provider.getBlockNumber();
  const currentBlockInfo = await provider.getBlock(currentBlock);

  const timestamp = currentBlockInfo.timestamp;

  const deadline = timestamp + 300; // deadleine

  const gasPrice = await singer.getGasPrice();

  console.log('deadline', deadline);



  // set slippage of 5%
  const slippageTolerance = new Percent(5, 100);

// get the extrinsics of this swap
  const result = SmartRouterV2.swapExactTokensForTokens(
    fromTokenAmount,
    toToken,
    standardPools,
    stablePools
  );
  
  if(!extrinsics) return;

  // query the estimateGas;
  const estimateGas = await extrinsics.estimateGas();

  try {
    // submit
    const tx = await extrinsics?.signAndSend({
      gasPrice,
      gasLimit: estimateGas.toString()
    });
  
    console.log('tx hash', tx.hash.toString());
  
    const result = await tx.wait();

    console.log('result gasUsed', result.gasUsed.toString());
  } catch (error) {
    console.log('tx', error);
  }


}

main().then(() => {
  console.log('end');
});



```