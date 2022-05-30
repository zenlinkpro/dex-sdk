import JSBI from 'jsbi';
import invariant from 'tiny-invariant';
import { BigintIsh } from './constants';
import { CurrencyAmount } from './fractions/currencyAmount';
import { Token } from './token';

export class TokenAmount extends CurrencyAmount {
  public readonly token: Token;

  /**
   * Returns a new token amount instance from the unitless amount of token, i.e. the raw amount
   * @param token the token in the amount
   * @param rawAmount the raw token or ether amount
   */
  public static fromRawAmount (token: Token, rawAmount: BigintIsh): TokenAmount {
    return new TokenAmount(token, rawAmount);
  }

  public constructor (token: Token, amount: BigintIsh) {
    super(token, amount);
    this.token = token;
  }

  public override add (other: TokenAmount): TokenAmount {
    invariant(this.token.equals(other.token), 'TOKEN');

    return new TokenAmount(this.token, JSBI.add(this.raw, other.raw));
  }

  public override subtract (other: TokenAmount): TokenAmount {
    invariant(this.token.equals(other.token), 'TOKEN');

    return new TokenAmount(this.token, JSBI.subtract(this.raw, other.raw));
  }
}
