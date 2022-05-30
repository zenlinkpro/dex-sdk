export const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_factory',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_WNativeCurrency',
        type: 'address'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    inputs: [],
    name: 'WNativeCurrency',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token0',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'token1',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount0Desired',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amount1Desired',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amount0Min',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amount1Min',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      }
    ],
    name: 'addLiquidity',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount0',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amount1',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'liquidity',
        type: 'uint256'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amountTokenDesired',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amountTokenMin',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amountNativeCurrencyMin',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      }
    ],
    name: 'addLiquidityNativeCurrency',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amountToken',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amountNativeCurrency',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'liquidity',
        type: 'uint256'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'path',
        type: 'address[]'
      },
      {
        internalType: 'uint256',
        name: 'amountSwapOut',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'nativeCurrencySwapInMax',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'nativeCurrencyReserveMin',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      }
    ],
    name: 'addLiquiditySingleNativeCurrency',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amountToken',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amountNativeCurrency',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'liquidity',
        type: 'uint256'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'path',
        type: 'address[]'
      },
      {
        internalType: 'uint256',
        name: 'amountIn',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amountSwapOut',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amountSwapInMax',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amountInReserveMin',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      }
    ],
    name: 'addLiquiditySingleToken',
    outputs: [
      {
        internalType: 'uint256',
        name: 'liquidity',
        type: 'uint256'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'factory',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amountOut',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'reserveIn',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'reserveOut',
        type: 'uint256'
      }
    ],
    name: 'getAmountIn',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amountIn',
        type: 'uint256'
      }
    ],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amountIn',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'reserveIn',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'reserveOut',
        type: 'uint256'
      }
    ],
    name: 'getAmountOut',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amountOut',
        type: 'uint256'
      }
    ],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amountOut',
        type: 'uint256'
      },
      {
        internalType: 'address[]',
        name: 'path',
        type: 'address[]'
      }
    ],
    name: 'getAmountsIn',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'amounts',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amountIn',
        type: 'uint256'
      },
      {
        internalType: 'address[]',
        name: 'path',
        type: 'address[]'
      }
    ],
    name: 'getAmountsOut',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'amounts',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token0',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'token1',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'liquidity',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amount0Min',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amount1Min',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      }
    ],
    name: 'removeLiquidity',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount0',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amount1',
        type: 'uint256'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'liquidity',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amountTokenMin',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amountNativeCurrencyMin',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      }
    ],
    name: 'removeLiquidityNativeCurrency',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amountToken',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amountNativeCurrency',
        type: 'uint256'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amountOutMin',
        type: 'uint256'
      },
      {
        internalType: 'address[]',
        name: 'path',
        type: 'address[]'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      }
    ],
    name: 'swapExactNativeCurrencyForTokens',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'amounts',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amountIn',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amountOutMin',
        type: 'uint256'
      },
      {
        internalType: 'address[]',
        name: 'path',
        type: 'address[]'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      }
    ],
    name: 'swapExactTokensForNativeCurrency',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'amounts',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amountIn',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amountOutMin',
        type: 'uint256'
      },
      {
        internalType: 'address[]',
        name: 'path',
        type: 'address[]'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      }
    ],
    name: 'swapExactTokensForTokens',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'amounts',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amountOut',
        type: 'uint256'
      },
      {
        internalType: 'address[]',
        name: 'path',
        type: 'address[]'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      }
    ],
    name: 'swapNativeCurrencyForExactTokens',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'amounts',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amountOut',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amountInMax',
        type: 'uint256'
      },
      {
        internalType: 'address[]',
        name: 'path',
        type: 'address[]'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      }
    ],
    name: 'swapTokensForExactNativeCurrency',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'amounts',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amountOut',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amountInMax',
        type: 'uint256'
      },
      {
        internalType: 'address[]',
        name: 'path',
        type: 'address[]'
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      }
    ],
    name: 'swapTokensForExactTokens',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'amounts',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    stateMutability: 'payable',
    type: 'receive'
  }
];
