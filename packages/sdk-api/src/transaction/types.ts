export interface TxCallParam {
  mod: string;
  method: string;
  abi?: string;
  params: any[];
  override?: any;
}
