import { WsProvider, Keyring } from '@polkadot/api';
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
];

async function main () {
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

  const tokensMap: Record<string, Token> = {};
  tokens.reduce((total, cur) => {
    total[cur.assetId] = cur;
    return total;
  }, tokensMap);

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
  const standardPairs = await firstValueFrom(dexApi.standardPairOfTokens(tokens));
  console.log('standardPairs', standardPairs);

  // query the standardPools of standard pairs;
  const standardPools: any = await firstValueFrom(dexApi.standardPoolOfPairs(standardPairs));
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
  if (!trade) {
    console.log('There is no match for this trade');
    return;
  }

  console.log(
    'The match trade is swap', `${
      trade.inputAmount.toPrecision(8)} ${trade.inputAmount.token.symbol
      } to ${trade.outputAmount.toPrecision(8)} ${trade.outputAmount.token.symbol}`
  );
  console.log('The executionPrice is',
  `1 ${trade.inputAmount.token.symbol} = ${trade.executionPrice.toPrecision(8)} ${trade.outputAmount.token.symbol}`
  );
  console.log('The route path is ', trade.route.tokenPath.map((item) => item.symbol).join(' -> '));

  console.log('The route path is ', trade.route.routePath.map((item) => item.stable));

  // set slippage of 5%
  const slippageTolerance = new Percent(5, 100);
  if (!dexApi.api) return;

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

  if (!extrinsics) return;

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

// use api
}

main().then(() => {
  console.log('end');
});
