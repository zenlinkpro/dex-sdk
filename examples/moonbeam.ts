import { EvmApi, MoonbeamConfig } from '@zenlink-dex/sdk-api';
import { Percent, Token, TokenAmount, TradeType, StablePair, StableSwap } from '@zenlink-dex/sdk-core';
import { firstValueFrom } from 'rxjs';
import { SmartRouterV2 } from '@zenlink-dex/sdk-router';
import { ethers } from 'ethers';
import axios from 'axios';

const PRIVITE_KEY = '0x'; // YOUR PRIVITE KEY

async function main () {
  const response = await axios.get('https://raw.githubusercontent.com/zenlinkpro/token-list/main/tokens/moonbeam.json');
  const tokensMeta = response.data.tokens;
  const provider = new ethers.providers.JsonRpcProvider(MoonbeamConfig.rpcUrls[0]);

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

  const tokensMap: Record<string, Token> = {};
  tokens.reduce((total, cur) => {
    total[cur.assetId] = cur;
    return total;
  }, tokensMap);

  // generate the dex api
  const dexApi = new EvmApi(
    singer,
    MoonbeamConfig
  );

  // query the tokens balance of acoount
  const tokenBalances = await firstValueFrom(dexApi.balanceOfTokens(tokens, account));
  console.log('tokenBalances ', tokenBalances);

  // query the standard pair of tokens
  const standardPairs = await firstValueFrom(dexApi.standardPairOfTokens(tokens));
  console.log('standardPairs', standardPairs);

  // query the standardPools of standard pairs;
  const standardPools = await firstValueFrom(dexApi.standardPoolOfPairs(standardPairs));
  console.log('standardPools', standardPools);

  // query the stable pair;
  const stablePairs: StablePair[] = await firstValueFrom(dexApi.stablePairOf(MoonbeamConfig.stableAddress));
  console.log('stablePairs', stablePairs);

  // query the stable pool of stable pair;
  const stablePools: StableSwap[] = await firstValueFrom(dexApi.stablePoolOfPairs(stablePairs));
  console.log('stablePairs', stablePools);

  const anyUSDCToken = tokensMap['300-2004-255-0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b'];
  const wglmrToken = tokensMap['300-2004-255-0xacc15dc74880c9944775448304b263d191c6077f'];

  // swap from token -> toToken
  const fromToken = wglmrToken;
  const fromTokenAmount = new TokenAmount(fromToken, (1_000_000_000_000_000_000).toString());
  const toToken = anyUSDCToken;

  // use smart router to get the best trade;
  const result = SmartRouterV2.swapExactTokensForTokens(
    fromTokenAmount,
    toToken,
    standardPools,
    stablePools
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

  console.log('The route path is ', trade.route.routePath.map((item) => item.stable).join(' -> '));

  console.log('The route path is ', trade.route.tokenPath.map((item) => item.symbol).join(' -> '));

  const currentBlock = await provider.getBlockNumber();
  const currentBlockInfo = await provider.getBlock(currentBlock);

  const timestamp = currentBlockInfo.timestamp;

  const deadline = timestamp + 300; // deadleine

  const gasPrice = await singer.getGasPrice();

  console.log('deadline', deadline);

  // set slippage of 5%
  const slippageTolerance = new Percent(5, 100);

  // get the extrinsics of this swap

  const extrinsics = dexApi.swapExactTokensForTokens(
    trade.route.routePath,
    trade.inputAmount,
    trade.minimumAmountOut(slippageTolerance),
    account,
    deadline
  );

  if (!extrinsics) return;

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
