import { SmartAccountSigner, getChain } from "@alchemy/aa-core";
import {
  ExtendedValidatorProviderParams,
  KernelBaseValidatorParams,
  ValidatorProvider,
  getChainId,
} from "@zerodev/sdk";
import { polygonMumbai } from "viem/chains";
import { SubscriptionValidator } from "./subscriptionValidator";

interface SubscriptionValidatorParams extends KernelBaseValidatorParams {
  owner: SmartAccountSigner;
}

export class SubscriptionProvider extends ValidatorProvider<
  SubscriptionValidator,
  SubscriptionValidatorParams
> {
  constructor(
    params: ExtendedValidatorProviderParams<SubscriptionValidatorParams>
  ) {
    const chain =
      typeof params.opts?.providerConfig?.chain === "number"
        ? getChain(params.opts.providerConfig.chain)
        : params.opts?.providerConfig?.chain ?? polygonMumbai;
    const validator = new SubscriptionValidator({
      projectId: params.projectId,
      owner: params.owner,
      chain,
      ...params.opts?.validatorConfig,
    });
    super(
      {
        ...params,
        opts: {
          ...params.opts,
          providerConfig: { ...params.opts?.providerConfig, chain },
        },
      },
      validator
    );
  }

  public static async init(
    params: ExtendedValidatorProviderParams<SubscriptionValidatorParams>
  ): Promise<SubscriptionProvider> {
    const chainId = await getChainId(params.projectId);
    if (!chainId) {
      throw new Error("ChainId not found");
    }
    const chain = getChain(chainId);
    const instance = new SubscriptionProvider({
      ...params,
      opts: {
        ...params.opts,
        providerConfig: {
          chain,
          ...params.opts?.providerConfig,
        },
      },
    });
    return instance;
  }

  changeOwner = this.sendEnableUserOperation;

  deleteOwner = this.sendDisableUserOperation;
}
