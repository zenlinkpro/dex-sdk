import { ethers } from 'ethers';
import { JsonFragment, Fragment } from '@ethersproject/abi';

export function encodeEvmCallData (
  abi: string | ReadonlyArray<Fragment | JsonFragment | string>,
  method: string,
  params: any[]
): string | undefined {
  try {
    const _interface = new ethers.utils.Interface(abi);

    const callData = _interface.encodeFunctionData(method, [...params]);

    return callData;
  } catch (error) {
    console.error(error);

    return undefined;
  }
}

export function decodeEvmCallResult (
  abi: string | ReadonlyArray<Fragment | JsonFragment | string>,
  method: string,
  result: string
): any {
  try {
    const _interface = new ethers.utils.Interface(abi);

    const callData = _interface.decodeFunctionResult(method, result);

    return callData;
  } catch (error) {
    // console.error(error);

    return undefined;
  }
}
