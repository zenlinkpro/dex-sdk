/* eslint-disable sort-keys */
import { ethers } from 'ethers';
import { abi as MulticallAbi } from '../MulticallAbi';

export interface CallChunks {
  contract: string;
  calls: { method: string; callData?: string }[];
}

export async function getMulticallResult (
  multicallAddress: string,
  provider: any,
  calls: CallChunks[]
): Promise<any[] | undefined> {
  if (!multicallAddress) return undefined;

  try {
    const multicallContract = new ethers.Contract(multicallAddress, MulticallAbi);

    const callChunks = calls.map((call) => (
      call.calls.map((chunk) => ({
        target: call.contract,
        method: chunk.method,
        callData: chunk.callData
      })))
    ).flat();

    const results: any[] = await multicallContract.connect(provider).callStatic.tryAggregate(
      false,
      callChunks
    );

    return calls.reduce<any[]>((memo, current, i) => {
      memo = [...memo, [...results].splice(i * current.calls.length, current.calls.length)];

      return memo;
    }, []);
  } catch {
    return undefined;
  }
}

export interface BlockCallResult {
  blockNumber: number;
  blockHash: string;
  result: any[];
}

export async function getMulticallAndBLockResult (
  multicallAddress: string,
  provider: any,
  calls: CallChunks[]
): Promise<BlockCallResult | undefined> {
  if (!multicallAddress) return undefined;

  try {
    const multicallContract = new ethers.Contract(multicallAddress, MulticallAbi);

    const callChunks = calls.map((call) => (
      call.calls.map((chunk) => ({
        target: call.contract,
        method: chunk.method,
        callData: chunk.callData
      })))
    ).flat();

    const _results: any[] = await multicallContract.connect(provider).callStatic.tryBlockAndAggregate(
      false,
      callChunks
    );
    const blockNumber = _results[0].toNumber();
    const blockHash = _results[1];
    const results = _results[2];

    const result = calls.reduce<any[]>((memo, current, i) => {
      memo = [...memo, [...results].splice(i * current.calls.length, current.calls.length)];

      return memo;
    }, []);

    return {
      blockNumber,
      blockHash,
      result
    };
  } catch {
    return undefined;
  }
}
