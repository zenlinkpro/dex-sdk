
import invariant from 'tiny-invariant';
import { ZERO } from '../entities/constants';
import { MultiPath } from '../entities/multiRoute';
import { StableSwap } from '../entities/stableSwap';
import { TokenAmount } from '../entities/tokenAmount';

export function calculateSwapFromBase (
  pool: StableSwap,
  basePool: StableSwap,
  tokenIndexFrom: number,
  tokenIndexTo: number,
  amount: TokenAmount
): TokenAmount {
  const baseToken = basePool.lpToken;
  const baseTokenIndex = pool.getTokenIndex(baseToken);
  const baseAmounts = basePool.pooledTokens.map((token) => new TokenAmount(token, ZERO));

  baseAmounts[tokenIndexFrom] = amount;
  const baseLpAmount = basePool.calculateTokenAmount(baseAmounts, true);

  if (baseTokenIndex === tokenIndexTo) {
    return baseLpAmount;
  }

  return pool.calculateSwap(baseTokenIndex, tokenIndexTo, baseLpAmount);
}

export function calculateSwapToBase (
  pool: StableSwap,
  basePool: StableSwap,
  tokenIndexFrom: number,
  tokenIndexTo: number,
  amount: TokenAmount
): TokenAmount {
  const baseToken = basePool.lpToken;
  const baseTokenIndex = pool.getTokenIndex(baseToken);
  let tokenLPAmount = amount;

  if (baseTokenIndex !== tokenIndexFrom) {
    tokenLPAmount = pool.calculateSwap(tokenIndexFrom, baseTokenIndex, amount);
  }

  return basePool.calculateRemoveLiquidityOneToken(tokenLPAmount, tokenIndexTo)[0];
}

export function getStableSwapOutputAmount (
  path: MultiPath,
  inputAmount: TokenAmount
): TokenAmount {
  let outputAmount: TokenAmount;

  invariant(path.stable, 'NOT_STABLESWAP');
  invariant(inputAmount.token.equals(path.input), 'INPUTTOKEN');

  if (!path.basePool && path.pool) {
    const fromIndex = path.pool.getTokenIndex(path.input);
    const toIndex = path.pool.getTokenIndex(path.output);

    outputAmount = path.pool.calculateSwap(fromIndex, toIndex, inputAmount);
  } else if (path.fromBase) {
    invariant(path.pool && path.basePool, 'POOL');
    const fromIndex = path.basePool.getTokenIndex(path.input);
    const toIndex = path.pool.getTokenIndex(path.output);

    outputAmount = calculateSwapFromBase(path.pool, path.basePool, fromIndex, toIndex, inputAmount);
  } else {
    invariant(path.pool && path.basePool, 'POOL');
    const fromIndex = path.pool.getTokenIndex(path.input);
    const toIndex = path.basePool.getTokenIndex(path.output);

    outputAmount = calculateSwapToBase(path.pool, path.basePool, fromIndex, toIndex, inputAmount);
  }

  return outputAmount;
}
