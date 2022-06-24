# dex-sdk


## Getting Start

you need to install the @zenlink-dex/sdk-api  @zenlink-dex/sdk-core @zenlink-dex/sdk-router package, understand the structures, and start using it. 


### Installation 


```bash
yarn add @zenlink-dex/sdk-api  @zenlink-dex/sdk-core @zenlink-dex/sdk-router

```

## Verified token list

You can get the verified token list on zenlink dex by this 
[repo](https://github.com/zenlinkpro/token-list)

## Example

You can follow tutorial below to submit a transaction by use sdk.

Zenlink dex support two different types, `evm` and `module`. If you want submit a transaction, you need to instantiate the api, query the pool by api, and calculate the best price and route by smart router, finally use the best route and amount to submit the transaction. 

#### ModuleBApi 
This api for the Dex base on the moduleB type. the dex on Bifrost is this type. 


1. Instantiate the api

You can instantiate dex api by `WsProvider`, and the chainConfig of Bifrost is the  `BifrostConfig`  in  `@zenlink-dex/sdk-api`

```javascript
import { WsProvider, Keyring } from '@polkadot/api';
import { ModuleBApi, BifrostConfig } from '@zenlink-dex/sdk-api';

 const provider = new WsProvider(BifrostConfig.wss[0]);
 await provider.isReady;
 const dexApi = new ModuleBApi(
    provider
  );
  await dexApi.initApi(); // init the api;
```



2. Query the pool info by the api

You can query the standard pool info by the verified token list and query stable pool info by stable address. You can get the verified token list on zenlink dex by this 
[repo](https://github.com/zenlinkpro/token-list). 

```javascript
import { Percent, Token, TokenAmount, TradeType, StablePair, StableSwap } from '@zenlink-dex/sdk-core';
import { firstValueFrom } from 'rxjs';

 const response = await axios.get('https://raw.githubusercontent.com/zenlinkpro/token-list/main/tokens/bifrost.json');
 const tokensMeta = response.data.tokens;

  // generate Tokens
  const tokens = tokensMeta.map((item) => {
    return new Token(item);
  }); 
  
  // query the standard pair and pool
  const standardPairs = await firstValueFrom(dexApi.standardPairOfTokens(tokens));
  const standardPools = await firstValueFrom(dexApi.standardPoolOfPairs(standardPairs));
  
  
  // query the stable pair and pool
  // Bifrost will support stable pool later
```


3. Calculate the best price and route by smart router
When you get the pool info, you can calculate the best route

```javascript
import { Percent, Token, TokenAmount, TradeType, StablePair, StableSwap } from '@zenlink-dex/sdk-core';
import { firstValueFrom } from 'rxjs';
import { SmartRouterV2 } from '@zenlink-dex/sdk-router';

 const response = await axios.get('https://raw.githubusercontent.com/zenlinkpro/token-list/main/tokens/bifrost.json');
 const tokensMeta = response.data.tokens;

  // generate Tokens
  const tokens = tokensMeta.map((item) => {
    return new Token(item);
  }); 
  
 const tokensMap: Record<string, Token> = {};
  tokens.reduce((total, cur) => {
    total[cur.assetId] = cur;
    return total;
  }, tokensMap);
  
  const bncToken = tokensMap['200-2001-0-0'];
  const kusdToken = tokensMap['200-2001-2-770'];
  const bncAmount = new TokenAmount(bncToken, (10_000_000_000_000).toString());

  // swap fromToken -> toToken
  const fromToken = bncAmount;
  const fromTokenAmount = new TokenAmount(fromToken, (1_000_000_000_000_000).toString());
  const toToken = kusdToken;
  
   // use smart router to get the best trade;
  const result = SmartRouterV2.swapExactTokensForTokens(
    fromTokenAmount,
    toToken,
    standardPools,
    []
  );
  
  const trade = result.trade;

```


4. Generate a transaction
You can use api and the best route to generate the transaction 

```javascript
const blockNumber = await dexApi.api.query.system.number();
  const deadline = Number(blockNumber.toString()) + 20; // deadline is block height

  // set slippage of 5%
  const slippageTolerance = new Percent(5, 100);
  
  const extrinsics = dexApi.swapExactTokensForTokens(
    trade.route.routePath, // path
    trade.inputAmount, // input token and amount
    trade.minimumAmountOut(slippageTolerance), // min amount out
    account, // recipient
    deadline // deadline
  )

```

5. Submit a transaction

You can submit the transaction to finish the swap

```javascript
import { WsProvider, Keyring } from '@polkadot/api';

  // prepare wallet
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 6 });
  const PHRASE = 'YOUR SEEDS';
  const accountPair = keyring.addFromUri(PHRASE);
  
  
  const unsub = await extrinsics.signAndSend(accountPair, (status) => {
    if (status.isInBlock) {
      console.log('extrinsics submit in block');
    }
    if (status.isError) {
      console.log('extrinsics submit error');
    }
    if (status.isFinalized) {
      console.log('extrinsics submit is finalized');
      unsub();
    }
  });
```



This is an example how to swap by this sdk on Bifrost;

 [Bifrost swap example](https://github.com/zenlinkpro/dex-sdk/blob/main/examples/bifrost.ts)





#### EvmApi

This api for the Dex base on the evm type. the dex on Moonriver and Moonbeam is this type. 

1. Instantiate the api

You can instantiate dex api by `provider` or `singer`, and the chainConfig of Moonbeam is the  `MoonbeamConfig`  in  `@zenlink-dex/sdk-api`, the chainConfig of Moonriver is the  `MoonriverConfig`  in  `@zenlink-dex/sdk-api`


```javascript
import { EvmApi, MoonbeamConfig } from '@zenlink-dex/sdk-api';
import { ethers } from 'ethers';
  
 const PRIVITE_KEY = '0x'; // YOUR PRIVITE KEY
 const provider = new ethers.providers.JsonRpcProvider(MoonbeamConfig.rpcUrls[0]);
   const singer = new ethers.Wallet(
    PRIVITE_KEY,
    provider
  );
  
  // generate the dex api
  const dexApi = new EvmApi(
    singer,
    MoonbeamConfig
  );
```

2. Query the pool info by the api

You can query the standard pool info by the verified token list and query stable pool info by stable address. You can get the verified token list on zenlink dex by this 
[repo](https://github.com/zenlinkpro/token-list). 

```javascript
import { Percent, Token, TokenAmount, TradeType, StablePair, StableSwap } from '@zenlink-dex/sdk-core';
import { firstValueFrom } from 'rxjs';

 const response = await axios.get('https://raw.githubusercontent.com/zenlinkpro/token-list/main/tokens/moonbeam.json');
 const tokensMeta = response.data.tokens;

  // generate Tokens
  const tokens = tokensMeta.map((item) => {
    return new Token(item);
  }); 
  
  // query the standard pair and pool
  const standardPairs = await firstValueFrom(dexApi.standardPairOfTokens(tokens));
  const standardPools = await firstValueFrom(dexApi.standardPoolOfPairs(standardPairs));
  
  
  // query the stable pair and pool
  const stablePairs: StablePair[] = await firstValueFrom(dexApi.stablePairOf(MoonbeamConfig.stableAddress));
  const stablePools: StableSwap[] = await firstValueFrom(dexApi.stablePoolOfPairs(stablePairs));
```

3. Calculate the best price and route by smart router
When you get the pool info, you can calculate the best route

```javascript
import { Percent, Token, TokenAmount, TradeType, StablePair, StableSwap } from '@zenlink-dex/sdk-core';
import { firstValueFrom } from 'rxjs';
import { SmartRouterV2 } from '@zenlink-dex/sdk-router';

 const response = await axios.get('https://raw.githubusercontent.com/zenlinkpro/token-list/main/tokens/moonbeam.json');
 const tokensMeta = response.data.tokens;

  // generate Tokens
  const tokens = tokensMeta.map((item) => {
    return new Token(item);
  }); 
  
 const tokensMap: Record<string, Token> = {};
  tokens.reduce((total, cur) => {
    total[cur.assetId] = cur;
    return total;
  }, tokensMap);
  
  const anyUSDCToken = tokensMap['300-2004-255-0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b'];
  const wglmrToken = tokensMap['300-2004-255-0xacc15dc74880c9944775448304b263d191c6077f'];
  // const glmrToken = tokensMap['300-2004-0-0'];

  // swap fromToken -> toToken
  const fromToken = wglmrToken;
  const fromTokenAmount = new TokenAmount(fromToken, (1_000_000_000_000_000).toString());
  const toToken = anyUSDCToken;
  
   // use smart router to get the best trade;
  const result = SmartRouterV2.swapExactTokensForTokens(
    fromTokenAmount,
    toToken,
    standardPools,
    stablePools
  );
  
  const trade = result.trade;
```

4. Generate a transaction
You can use api and the best route to generate the transaction 


```javascript

const currentBlock = await provider.getBlockNumber();
const currentBlockInfo = await provider.getBlock(currentBlock);

const timestamp = currentBlockInfo.timestamp;

const deadline = timestamp + 300; // deadleine

const gasPrice = await singer.getGasPrice();

// set slippage of 5%
const slippageTolerance = new Percent(5, 100);


const extrinsics = dexApi.swapExactTokensForTokens(
  trade.route.routePath,
  trade.inputAmount,
  trade.minimumAmountOut(slippageTolerance),
  account,
  deadline
);

```


5. Submit a transaction

You can submit the transaction to finish the swap


```javascript
// query the estimateGas;
  const estimateGas = await extrinsics.estimateGas();
  const gasPrice = await singer.getGasPrice();

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


```

This is an example how to swap by this sdk on Moonbeam;


 [Moonbeam swap example](https://github.com/zenlinkpro/dex-sdk/blob/main/examples/moonbeam.ts)
