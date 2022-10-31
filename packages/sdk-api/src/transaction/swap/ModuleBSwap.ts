import { SwapParamModule } from './index';
import * as RouterJson from '../../abi/RouterAbi';
import { MultiPath, Token, TokenAmount, TradeType } from '@zenlink-dex/sdk-core';
import invariant from 'tiny-invariant';

export const currencyKeyMap = {
  0: 'Native',
  1: 'VToken',
  2: 'Token',
  3: 'Stable',
  4: 'VSToken',
  5: 'VSBond',
  6: 'LPToken',
  12: 'StableLpToken'
};

export const currencyTokenSymbolMap = {
  0: 'ASG',
  1: 'BNC',
  2: 'KUSD',
  3: 'DOT',
  4: 'KSM',
  5: 'ETH',
  6: 'KAR',
  7: 'ZLK',
  8: 'PHA',
  9: 'RMRK'
};

export function parseTokenSymbolIndex (assetIndex: number): number {
  const assetSymbolIndex = ((assetIndex & 0x0000_0000_0000_000ff));

  return assetSymbolIndex;
}

export function parseTokenType (assetIndex: number): string {
  const assetU8 = ((assetIndex & 0x0000_0000_0000_ff00) >> 8);

  return currencyKeyMap[assetU8];
}

export function parseTokenSymbol (assetIndex: number): string {
  const assetSymbolIndex = ((assetIndex & 0x0000_0000_0000_000ff));

  return currencyTokenSymbolMap[assetSymbolIndex];
}

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

  swapExactTokensForTokensThroughStablePoolParams (
    multiPaths: MultiPath[],
    amount: TokenAmount,
    limitAmount: TokenAmount,
    tradeType: TradeType,
    recipient: string,
    deadline: number | string
  ) {
    const mod = 'zenlinkSwapRouter';
    const method = 'swapExactTokenForTokensThroughStablePool';
    const swapPath = multiPaths.map(
      (path) => path.stable
        ? {
            Stable: {
              poolId: path.pool && parseTokenSymbolIndex(path.pool.lpToken.meta.assetIndex),
              basePoolId: path.basePool && parseTokenSymbolIndex(path.basePool?.lpToken.meta.assetIndex),
              mode: path.basePool?.lpToken
                ? (path.fromBase ? 'FromBase' : 'ToBase')
                : 'Single',
              fromCurrency: {
                [parseTokenType(path.input.meta.assetIndex)]: parseTokenSymbol(path.input.meta.assetIndex)
              },
              toCurrency: {
                [parseTokenType(path.output.meta.assetIndex)]: parseTokenSymbol(path.output.meta.assetIndex)
              }
            }
          }
        : {
            Normal: [path.input.assetAddress, path.output.assetAddress]
          }
    );
    return {
      abi: '',
      mod,
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
    if (hasStable) {
      return this.swapExactTokensForTokensThroughStablePoolParams(
        multiPaths,
        amount,
        limitAmount,
        tradeType,
        recipient,
        deadline
      ) as any;
    }

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
