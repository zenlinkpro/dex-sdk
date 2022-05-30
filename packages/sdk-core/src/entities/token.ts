import invariant from 'tiny-invariant';
import { Currency } from './fractions/currency';

export enum AssetType {
  NATIVE_TOKEN = 0,
  NORMAL_TOKEN = 2,
  LP_TOKEN = 254,
  EVM_TOKEN = 255
}

export interface AssetMeta {
  address: string;
  chainId: number;
  decimals: number;
  assetType: number | AssetType;
  assetIndex: number;
  networkId: number;
  symbol: string;
  name: string;
}

export class Token extends Currency {
  public readonly meta: AssetMeta;

  public constructor (meta: AssetMeta) {
    const { decimals, name, symbol } = meta;

    super(decimals, symbol, name);
    this.meta = meta;
  }

  public get assetId (): string {
    const { address, assetIndex, assetType, chainId, networkId } = this.meta;

    return [
      networkId,
      chainId,
      assetType,
      (assetType === AssetType.EVM_TOKEN || assetType === AssetType.LP_TOKEN) ? (address) : assetIndex
    ].join('-');
  }

  public get assetAddress (): string | {chainId: number; assetType: number; assetIndex: number} {
    const { address, assetIndex, assetType, chainId } = this.meta;

    return (assetType === AssetType.EVM_TOKEN || assetType === AssetType.LP_TOKEN)
      ? (address)
      : {
          chainId: chainId,
          assetType,
          assetIndex
        };
  }

  public get assetType (): number {
    return this.meta.assetType;
  }

  public get assetMeta (): AssetMeta {
    return this.meta;
  }

  public get assetIndex (): number {
    return this.meta.assetIndex;
  }

  public get networkId (): number {
    return this.meta.networkId;
  }

  public get networkChainId (): string {
    const { chainId, networkId } = this.meta;

    return [
      networkId,
      chainId
    ].join('-');
  }

  public get chainId (): number {
    return this.meta.chainId;
  }

  public equals (other: Token): boolean {
    if (this === other) {
      return true;
    }

    return this.assetId.toLowerCase() === other.assetId.toLocaleLowerCase();
  }

  public sortsBefore (other: Token): boolean {
    invariant(this.assetId !== other.assetId, 'ASSETID');

    if (this.assetType === AssetType.EVM_TOKEN || other.assetType === AssetType.EVM_TOKEN) {
      return this.wrapped.assetId.toLowerCase() < other.wrapped.assetId.toLowerCase();
    }

    return (
      this.meta.chainId < other.meta.chainId ||
      this.meta.assetType < other.meta.assetType ||
      this.meta.assetIndex < other.meta.assetIndex
    );
  }

  public get wrapped (): Token {
    if (this.assetType === AssetType.NATIVE_TOKEN && this.meta.address) {
      const meta = this.assetMeta;

      return new Token({
        ...meta,
        assetType: AssetType.EVM_TOKEN
      });
    }

    return this;
  }

  public get wrapperToken (): Token {
    return this.wrapped;
  }
}
