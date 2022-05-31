import { AssetType, MultiPath, Token, TokenAmount, TradeType } from '@zenlink-dex/sdk-core';
import { SwapParamModule } from './index';
import * as RouterJson from '../../abi/RouterAbi';
import { abi as SwapRouterV1Abi } from '../../abi/SwapRouterV1Abi';
import invariant from 'tiny-invariant';
import { ethers } from 'ethers';

export interface SwapParamOptions {
  routerAddress: string;
  routerV1Address?: string;
}

export class EvmSwapParam implements SwapParamModule {
  public readonly options: SwapParamOptions;
  public constructor (options: SwapParamOptions) {
    this.options = options;
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

  swapParams (
    path: Token[],
    amount: TokenAmount,
    limitAmount: TokenAmount,
    tradeType: TradeType,
    recipient: string,
    deadline: number | string
  ) {
    if (tradeType === TradeType.EXACT_INPUT) {
      return this.swapExactTokensForTokensParams(
        path,
        amount,
        limitAmount,
        recipient,
        deadline
      );
    }

    if (tradeType === TradeType.EXACT_OUTPUT) {
      return this.swapTokensForExactTokensParams(
        path,
        amount,
        limitAmount,
        recipient,
        deadline
      );
    }
    throw new Error('unknown trade type');
  }

  swapExactTokensForTokensParams (
    path: Token[],
    amount: TokenAmount,
    limitAmount: TokenAmount,
    recipient: string,
    deadline: number | string
  ) {
    const swapPath = path.map((token) => {
      return token.meta.address;
    });
    let mod = this.options.routerAddress;
    let abi = RouterJson.abi as any;

    if (this.options.routerV1Address) {
      mod = this.options.routerV1Address;
      abi = SwapRouterV1Abi;
    }
    let method = 'swapExactTokensForTokens';
    let params = [];

    const fromToken = path[0];
    const targetToken = path[path.length - 1];

    if (fromToken.assetType === AssetType.NATIVE_TOKEN) {
      method = 'swapExactNativeCurrencyForTokens';
      params = [
        limitAmount.quotient.toString(),
        swapPath,
        recipient,
        deadline
      ];
      const override = {
        value: amount.quotient.toString()
      };

      return {
        abi,
        mod,
        method,
        params,
        override
      };
    }

    if (targetToken.assetType === AssetType.NATIVE_TOKEN) {
      method = 'swapExactTokensForNativeCurrency';
    }

    params = [
      amount.quotient.toString(),
      limitAmount.quotient.toString(),
      swapPath,
      recipient,
      deadline
    ];

    return {
      abi,
      mod,
      method,
      params
    };
  }

  swapTokensForExactTokensParams (
    path: Token[],
    amount: TokenAmount,
    limitAmount: TokenAmount,
    recipient: string,
    deadline: number | string
  ) {
    const swapPath = path.map((token) => {
      return token.meta.address;
    });
    let mod = this.options.routerAddress;
    let abi = RouterJson.abi as any;

    if (this.options.routerV1Address) {
      mod = this.options.routerV1Address;
      abi = SwapRouterV1Abi;
    }
    let method = 'swapTokensForExactTokens';
    let params = [];

    const fromToken = path[0];
    const targetToken = path[path.length - 1];

    if (fromToken.isNative) {
      method = 'swapNativeCurrencyForExactTokens';
      params = [
        amount.quotient.toString(),
        swapPath,
        recipient,
        deadline
      ];
      const override = {
        value: limitAmount.quotient.toString()
      };

      return {
        abi,
        mod,
        method,
        params,
        override
      };
    }

    if (targetToken.isNative) {
      method = 'swapTokensForExactNativeCurrency';
    }

    params = [
      amount.quotient.toString(),
      limitAmount.quotient.toString(),
      swapPath,
      recipient,
      deadline
    ];

    return {
      abi,
      mod,
      method,
      params
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
    invariant(multiPaths.length > 0, 'PATH');
    const mod = this.options.routerV1Address;
    const abi = SwapRouterV1Abi;
    let method = 'swapExactTokensForTokensThroughStablePool';
    let params = [];
    const fromToken = multiPaths[0].input;
    const targetToken = multiPaths[multiPaths.length - 1].output;
    const paths = multiPaths.map(
      (path) => path.stable
        ? {
            stable: true,
            callData: ethers.utils.defaultAbiCoder.encode(
              ['address', 'address', 'address', 'address', 'bool'],
              [
                path.pool?.contract ?? ethers.constants.AddressZero,
                path.basePool?.contract ?? ethers.constants.AddressZero,
                path.input.assetAddress,
                path.output.assetAddress,
                path.fromBase ?? false
              ]
            )
          }
        : {
            stable: false,
            callData: ethers.utils.defaultAbiCoder.encode(
              ['address[]'],
              [[path.input.assetAddress, path.output.assetAddress]]
            )
          }
    );

    if (fromToken.isNative) {
      method = 'swapExactNativeCurrencyForTokensThroughStablePool';
      params = [
        limitAmount.quotient.toString(),
        paths,
        recipient,
        deadline
      ];
      const override = {
        value: amount.quotient.toString()
      };

      return {
        abi,
        mod,
        method,
        params,
        override
      };
    }

    if (targetToken.isNative) {
      method = 'swapExactTokensForNativeCurrencyThroughStablePool';
    }

    params = [
      amount.quotient.toString(),
      limitAmount.quotient.toString(),
      paths,
      recipient,
      deadline
    ];

    return {
      abi,
      mod,
      method,
      params
    };
  }
}
