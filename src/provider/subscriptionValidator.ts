import {
  getChain,
  getUserOperationHash,
  type Address,
  type Hex,
  type SmartAccountSigner,
  type UserOperationRequest,
  type SignTypedDataParams,
  LocalAccountSigner,
} from "@alchemy/aa-core";
import {
  KernelAccountAbi,
  KernelBaseValidator,
  KernelBaseValidatorParams,
  fixSignedData,
  getChainId,
} from "@zerodev/sdk";
import {
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  keccak256,
  recoverAddress,
  recoverMessageAddress,
  toBytes,
  toHex,
} from "viem";
import { SubscriptionValidatorAbi } from "./subscriptionValidatorAbi";

const DUMMY_ECDSA_SIG =
  "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";

export interface SubsctiptionValidatorParams extends KernelBaseValidatorParams {
  owner: SmartAccountSigner;
}

export class SubscriptionValidator extends KernelBaseValidator {
  protected owner: SmartAccountSigner;

  constructor(params: SubsctiptionValidatorParams) {
    super(params);
    this.owner = params.owner;
  }

  public static async init(
    params: SubsctiptionValidatorParams
  ): Promise<SubscriptionValidator> {
    const chainId = await getChainId(params.projectId);
    if (!chainId) {
      throw new Error("ChainId not found");
    }
    const chain = getChain(chainId);
    const instance = new SubscriptionValidator({ ...params, chain });
    return instance;
  }

  async signer(): Promise<SmartAccountSigner> {
    return await Promise.resolve(this.owner);
  }

  async getOwner(): Promise<Hex> {
    return this.owner.getAddress();
  }

  async getEnableData(): Promise<Hex> {
    return this.getOwner();
  }

  encodeEnable(newOwner: Hex): Hex {
    return encodeFunctionData({
      abi: SubscriptionValidatorAbi,
      functionName: "enable",
      args: [newOwner],
    });
  }

  encodeDisable(disableData: Hex = "0x"): Hex {
    return encodeFunctionData({
      abi: SubscriptionValidatorAbi,
      functionName: "disable",
      args: [disableData],
    });
  }

  async getDummyUserOpSignature(): Promise<Hex> {
    const validAfterBytes = "000000000000";
    const signatureBytes = DUMMY_ECDSA_SIG.split("0x")[1];
    return `0x${validAfterBytes}${signatureBytes}`;
  }

  async isPluginEnabled(
    kernelAccountAddress: Address,
    selector: Hex
  ): Promise<boolean> {
    if (!this.publicClient) {
      throw new Error("Validator uninitialized: PublicClient missing");
    }
    const execDetail = await this.publicClient.readContract({
      abi: KernelAccountAbi,
      address: kernelAccountAddress,
      functionName: "getExecution",
      args: [selector],
    });
    const enableData = (await this.publicClient.readContract({
      abi: SubscriptionValidatorAbi,
      address: this.validatorAddress,
      functionName: "subscriptionValidatorStorage",
      args: [kernelAccountAddress],
    })) as `0x${string}`;
    return (
      execDetail.validator.toLowerCase() ===
        this.validatorAddress.toLowerCase() &&
      enableData.toLowerCase() === (await this.getEnableData()).toLowerCase()
    );
  }

  async signMessage(message: string | Uint8Array): Promise<Hex> {
    return await this.owner.signMessage(message);
  }

  async signTypedData(params: SignTypedDataParams): Promise<Hex> {
    return fixSignedData(await this.owner.signTypedData(params));
  }

  async signUserOp(userOp: UserOperationRequest): Promise<Hex> {
    if (!this.chain) {
      throw new Error("Validator uninitialized");
    }
    let hash = getUserOperationHash(
      {
        ...userOp,
        signature: "0x",
      },
      this.entryPointAddress,
      BigInt(this.chain.id)
    );

    if (userOp.signature.length !== 14) {
      throw new Error("Invalid signature length");
    }
    const validAfterBytes = userOp.signature.slice(0, 14) as Hex;
    const sigEncodePacked = encodePacked(
      ["bytes32", "bytes6"],
      [hash as Hex, validAfterBytes]
    );
    const hashWithValidAfter = keccak256(sigEncodePacked);
    const signedMessage = await this.owner.signMessage(hashWithValidAfter);

    return `0x${validAfterBytes.split("0x")[1]}${signedMessage.split("0x")[1]}`;
  }
}
