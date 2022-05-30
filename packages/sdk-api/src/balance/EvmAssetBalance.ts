/* eslint-disable sort-keys */
import { Contract, ethers } from 'ethers';
import { Token, TokenAmount, AssetType, StandardPair as RegularPair } from '@zenlink-dex/sdk-core';
import { BalanceModule } from './index';
import { abi as ERC20Abi } from '../abi/ERC20Abi';
import { encodeEvmCallData, decodeEvmCallResult } from '../abi/util/transactionCall';
import { getMulticallResult } from '../abi/util/multicall';
import { abi as MulticallAbi } from '../abi/MulticallAbi';

export interface EvmMultiCallBalanceOptions {
  multicall2: string;
}
export class EvmMultiCallBalance implements BalanceModule {
  public readonly provider: any;
  public readonly options: EvmMultiCallBalanceOptions;
  public constructor (provider: any, options: EvmMultiCallBalanceOptions) {
    this.provider = provider;
    this.options = options;
  }

  public async balanceOfToken (token: Token, account: string) {
    if (token.assetType === AssetType.NATIVE_TOKEN) {
      const amount = await this.provider.getBalance(account);

      return new TokenAmount(token, amount?.toString() ?? '0');
    }

    if (token.assetType === AssetType.EVM_TOKEN) {
      const tokenContract = new Contract(token.meta.address, ERC20Abi, this.provider);

      const amount = tokenContract.balanceOf(account);

      return new TokenAmount(token, amount?.toString() ?? '0');
    }
    return undefined;
  }

  private async balanceOfAllTokens (tokenList: Token[], account: string) {
    try {
      const nativeTokens = tokenList.filter((item) => item.assetType === AssetType.NATIVE_TOKEN);
      const tokens = tokenList.filter((item) => item.assetType !== AssetType.NATIVE_TOKEN);
      const nativeTokenCalls = [
        { method: 'getEthBalance', params: [account ?? ethers.constants.AddressZero] }
      ];
      const multicallAbi = MulticallAbi;
      const nativeTokenBalanceCalls = nativeTokens.map((asset) => {
        return {
          contract: this.options.multicall2,
          calls: nativeTokenCalls.map(({ method, params }) => ({
            method,
            callData: encodeEvmCallData(multicallAbi, method, params)
          })),
          asset
        };
      });

      const basicCalls = [
        { method: 'balanceOf', params: [account ?? ethers.constants.AddressZero] }
      ];

      const contractAbi = ERC20Abi;
      const calls = tokens.map((asset) => {
        return {
          contract: asset.meta.address,
          calls: basicCalls.map(({ method, params }) => ({
            method,
            callData: encodeEvmCallData(contractAbi, method, params)
          })),
          asset
        };
      });

      const allChunkCalls = [...calls, ...nativeTokenBalanceCalls];
      const callResults = await getMulticallResult(this.options.multicall2, this.provider, allChunkCalls);

      if (!callResults) return [];
      const decodeResults = callResults.map((result, index) => {
        try {
          const [
            balance
          ] = result.map((r: any, i: any) => {
            if (r.returnData && r.returnData !== '0x') {
              return decodeEvmCallResult(contractAbi, basicCalls[i].method, r.returnData);
            }

            return undefined;
          });

          if (!balance) return undefined;
          const assetToken = allChunkCalls[index].asset;

          return new TokenAmount(assetToken, balance[0]?.toString() || '0');
        } catch (error) {
          return undefined;
        }
      });
      const result = decodeResults.filter((item) => !!item);

      return result;
    } catch (error) {
      return [];
    }
  }

  public async balanceOfTokenList (tokens: Token[], account: string) {
    try {
      const result = await this.balanceOfAllTokens(tokens, account);

      return result.filter((item) => !!item) as TokenAmount[];
    } catch (error) {
      return [];
    }
  }

  public async balanceOfPairList (pairs: RegularPair[], account: string) {
    const lpTokens = pairs.map((item) => item.lpToken);

    return this.balanceOfTokenList(lpTokens, account);
  }
}
