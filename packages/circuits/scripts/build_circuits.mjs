import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const circuitsDir = path.resolve(__dirname, '..');
const buildDir = path.resolve(circuitsDir, 'build');
const verifiersDir = path.resolve(circuitsDir, '../contracts/contracts/verifiers');

function run(cmd, desc) {
  console.log(`\n[She-Raksha ZK] ${desc}...`);
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: circuitsDir, stdio: 'inherit' });
}

async function main() {
  console.log('=== She-Raksha Circom 2.1 & Groth16 Build Pipeline ===');

  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  if (!fs.existsSync(verifiersDir)) {
    fs.mkdirSync(verifiersDir, { recursive: true });
  }

  // 1. Compile Circom Circuit
  const circomBin = fs.existsSync(path.resolve(circuitsDir, 'circom.exe'))
    ? '.\\circom.exe'
    : 'circom';

  run(
    `${circomBin} circuits/AnonymousBystanderReportVerifier_v2.circom --r1cs --wasm --sym -o build -l node_modules`,
    'Step 1: Compiling Circom circuit to R1CS & WASM'
  );

  // 2. Powers of Tau Phase 1 (Size 14: up to 16,384 constraints)
  const ptauFinal = path.resolve(buildDir, 'pot14_final.ptau');
  if (!fs.existsSync(ptauFinal)) {
    run(
      'npx snarkjs powersoftau new bn128 14 build/pot14_0000.ptau -v',
      'Step 2a: Generating new Powers of Tau ceremony (bn128, 2^14)'
    );
    run(
      'npx snarkjs powersoftau contribute build/pot14_0000.ptau build/pot14_0001.ptau --name="She-Raksha Ceremony" -v -e="she-raksha-autonomous-entropy-bystander"',
      'Step 2b: Contributing entropy to ceremony'
    );
    run(
      'npx snarkjs powersoftau prepare phase2 build/pot14_0001.ptau build/pot14_final.ptau -v',
      'Step 2c: Preparing Phase 2 PTAU'
    );
  } else {
    console.log('[She-Raksha ZK] Reusing existing pot14_final.ptau.');
  }

  // 3. Phase 2 Circuit-Specific Groth16 Trusted Setup
  run(
    'npx snarkjs groth16 setup build/AnonymousBystanderReportVerifier_v2.r1cs build/pot14_final.ptau build/circuit_0000.zkey',
    'Step 3a: Groth16 initial setup'
  );

  run(
    'npx snarkjs zkey contribute build/circuit_0000.zkey build/circuit_final.zkey --name="She-Raksha Phase 2 Contributor" -v -e="she-raksha-groth16-second-entropy"',
    'Step 3b: Contributing phase 2 entropy'
  );

  // 4. Export Verification Key
  run(
    'npx snarkjs zkey export verificationkey build/circuit_final.zkey build/verification_key.json',
    'Step 4: Exporting verification_key.json'
  );

  // 5. Export Solidity Verifier Contract
  const verifierSol = path.resolve(verifiersDir, 'Groth16Verifier.sol');
  run(
    `npx snarkjs zkey export solidityverifier build/circuit_final.zkey "${verifierSol}"`,
    'Step 5: Exporting Groth16Verifier.sol to packages/contracts'
  );

  // Rename contract in Groth16Verifier.sol if needed and adjust pragma to ^0.8.0 or 0.8.24
  let solContent = fs.readFileSync(verifierSol, 'utf8');
  solContent = solContent.replace(/pragma solidity \^\d+\.\d+\.\d+;/, 'pragma solidity 0.8.24;');
  fs.writeFileSync(verifierSol, solContent, 'utf8');

  console.log('\n[She-Raksha ZK] Build pipeline completed successfully!');
  console.log(`- R1CS: ${path.resolve(buildDir, 'AnonymousBystanderReportVerifier_v2.r1cs')}`);
  console.log(`- WASM: ${path.resolve(buildDir, 'AnonymousBystanderReportVerifier_v2_js/AnonymousBystanderReportVerifier_v2.wasm')}`);
  console.log(`- ZKey: ${path.resolve(buildDir, 'circuit_final.zkey')}`);
  console.log(`- Verification Key: ${path.resolve(buildDir, 'verification_key.json')}`);
  console.log(`- Solidity Verifier: ${verifierSol}`);
}

main().catch((err) => {
  console.error('[She-Raksha ZK] Build failed:', err);
  process.exit(1);
});
