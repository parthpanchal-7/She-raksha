declare module 'circomlibjs' {
  export function buildPoseidon(): Promise<{
    (inputs: Array<bigint | number | string>): Uint8Array;
    F: {
      toObject(n: Uint8Array): bigint;
      e(n: bigint | number | string): Uint8Array;
      toString(n: Uint8Array): string;
    };
  }>;
}

declare module 'snarkjs' {
  export const groth16: {
    fullProve(
      input: Record<string, any>,
      wasmFile: string,
      zkeyFile: string
    ): Promise<{
      proof: {
        pi_a: string[];
        pi_b: string[][];
        pi_c: string[];
        protocol: string;
        curve: string;
      };
      publicSignals: string[];
    }>;
    verify(
      vKey: Record<string, any>,
      publicSignals: string[],
      proof: Record<string, any>
    ): Promise<boolean>;
  };
}
