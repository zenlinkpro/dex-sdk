import { SwapParamModule } from './index';
import * as RouterJson from '../../abi/RouterAbi';
import { MultiPath, Token, TokenAmount, TradeType } from '@zenlink-dex/sdk-core';
import invariant from 'tiny-invariant';
export class ModuleBSwapParam implements SwapParamModule {
  swapParams (
    path: Token[],
    amount: TokenAmount,
    limitAmount: TokenAmount,
    tradeType: TradeType,
    recipient: string,
    deadline: number | string
  ) {
    let method = '';
    if (tradeType === TradeType.EXACT_INPUT) {
      method = 'swapExactAssetsForAssets';
    }
    if (tradeType === TradeType.EXACT_OUTPUT) {
      method = 'swapAssetsForExactAssets';
    }
    const swapPath = path.map((token) => {
      return {
        chainId: token.chainId,
        assetType: token.assetType,
        assetIndex: token.assetIndex
      };
    });
    return {
      abi: RouterJson.abi as any,
      mod: 'zenlinkProtocol',
      method: method,
      params: [
        amount.quotient.toString(),
        limitAmount.quotient.toString(),
        swapPath,
        recipient,
        deadline
      ]
    };
  }

  swapV1Params (
    multiPaths: MultiPath[],
    amount: TokenAmount,
    limitAmount: TokenAmount,
    tradeType: TradeType,
    recipient: string,
    deadline: number | string
  ) {
    const hasStable = multiPaths.some((path) => path.stable);
    invariant(!hasStable, 'not support stable pair');

    const routePath = multiPaths.reduce((total, cur) => {
      total.push(cur.output);
      return total;
    }, [
      multiPaths[0].input
    ]);
    return this.swapParams(
      routePath,
      amount,
      limitAmount,
      tradeType,
      recipient,
      deadline
    );
  }
}
