import { ethers, Signer } from 'ethers';
import invariant from 'tiny-invariant';

import { TxCallParam } from './types';

export interface SignerOptions {
  signer?: Signer;
}

export class EvmTransactionExtrinsic {
  public readonly mod: string;
  public readonly abi: any;
  public readonly params: any[];
  public readonly override: any;
  public readonly method: string;
  public readonly signer?: Signer;

  constructor (
    txCallParam: TxCallParam,
    options: SignerOptions = {}
  ) {
    this.mod = txCallParam.mod;
    this.abi = txCallParam.abi;
    this.params = txCallParam.params;
    this.override = txCallParam.override || {};
    this.method = txCallParam.method;
    this.signer = options.signer;
  }

  public async signAndSend (otherOverride = {}) {
    const signer = this.signer;
    invariant(signer, 'No singer');

    return new ethers.Contract(this.mod, this.abi, signer)[this.method](
      ...this.params,
      {
        ...this.override,
        ...otherOverride
      }
    );
  }

  public estimateGas (otherOverride = {}) {
    const signer = this.signer;
    invariant(signer, 'No singer');

    return new ethers.Contract(this.mod, this.abi, signer).estimateGas[this.method](
      ...this.params,
      {
        ...this.override,
        ...otherOverride
      }
    );
  }

  public connect (signer: Signer, otherOverride = {}) {
    const { abi, mod, method, params, override = {} } = this;
    return new EvmTransactionExtrinsic(
      {
        abi,
        mod,
        method,
        params,
        override: {
          ...override,
          ...otherOverride
        }
      },
      {
        signer
      }
    );
  }
}
