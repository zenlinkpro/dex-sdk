
import { StablePoolModule } from './index';

export class ModuleBStandardPool implements StablePoolModule {
  public readonly provider: any;
  public readonly api: any;

  public readonly options: any;
  public constructor (api: any) {
    this.api = api;
  }

  public async stablePairsOf () {
    return [];
  }

  public async stablePoolsOf () {
    return [];
  }
}
