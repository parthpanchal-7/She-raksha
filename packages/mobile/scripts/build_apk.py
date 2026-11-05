import os
import sys
import shutil
import subprocess
import zipfile

def run_cmd(cmd, cwd=None):
    cmd_str = ' '.join(f'"{c}"' if ' ' in c else c for c in cmd) if isinstance(cmd, list) else cmd
    print(f"  > Executing: {cmd_str}")
    res = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error output:\n{res.stderr}\n{res.stdout}")
        raise RuntimeError(f"Command failed with exit code {res.returncode}: {cmd_str}")
    return res.stdout

def main():
    package_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    dist_dir = os.path.join(package_root, 'dist')
    build_dir = os.path.join(package_root, 'build_apk_tmp')
    os.makedirs(dist_dir, exist_ok=True)
    os.makedirs(build_dir, exist_ok=True)

    sdk_dir = os.environ.get('ANDROID_HOME', r'C:\Users\mitid\AppData\Local\Android\Sdk')
    build_tools = os.path.join(sdk_dir, 'build-tools', '34.0.0')
    android_jar = os.path.join(sdk_dir, 'platforms', 'android-35', 'android.jar')
    if not os.path.exists(android_jar):
        android_jar = os.path.join(sdk_dir, 'platforms', 'android-34', 'android.jar')

    aapt2 = os.path.join(build_tools, 'aapt2.exe')
    d8 = os.path.join(build_tools, 'd8.bat')
    zipalign = os.path.join(build_tools, 'zipalign.exe')
    apksigner = os.path.join(build_tools, 'apksigner.bat')

    print(f"[She-Raksha Build] Using Android SDK build-tools at {build_tools}")
    print(f"[She-Raksha Build] Using platform jar: {android_jar}")

    # Paths
    main_dir = os.path.join(package_root, 'android', 'app', 'src', 'main')
    res_dir = os.path.join(main_dir, 'res')
    manifest_xml = os.path.join(main_dir, 'AndroidManifest.xml')
    assets_dir = os.path.join(main_dir, 'assets')
    if not os.path.exists(assets_dir):
        assets_dir = os.path.join(package_root, 'assets')

    compiled_res = os.path.join(build_dir, 'compiled_res.zip')
    gen_dir = os.path.join(build_dir, 'gen')
    classes_dir = os.path.join(build_dir, 'classes')
    dex_dir = os.path.join(build_dir, 'dex')
    res_apk = os.path.join(build_dir, 'res_link.apk')
    unaligned_apk = os.path.join(build_dir, 'unaligned.apk')
    final_apk = os.path.join(dist_dir, 'She-Raksha-preview.apk')
    keystore = os.path.join(build_dir, 'debug.keystore')

    shutil.rmtree(gen_dir, ignore_errors=True)
    shutil.rmtree(classes_dir, ignore_errors=True)
    shutil.rmtree(dex_dir, ignore_errors=True)
    os.makedirs(gen_dir, exist_ok=True)
    os.makedirs(classes_dir, exist_ok=True)
    os.makedirs(dex_dir, exist_ok=True)

    # 1. Compile resources with aapt2
    print("[1/6] Compiling Android resources with aapt2...")
    run_cmd([aapt2, 'compile', '--dir', res_dir, '-o', compiled_res])

    # 2. Link resources with aapt2 to generate binary manifest and R.java
    print("[2/6] Linking Android resources and manifest...")
    run_cmd([
        aapt2, 'link',
        '-I', android_jar,
        compiled_res,
        '--manifest', manifest_xml,
        '--java', gen_dir,
        '-o', res_apk,
        '--auto-add-overlay'
    ])

    # 3. Compile Java sources (MainActivity, Service, Receiver, R.java)
    print("[3/6] Compiling Java classes with javac (Java 8 bytecode target)...")
    java_sources = []
    java_dir = os.path.join(main_dir, 'java')
    for root, _, files in os.walk(java_dir):
        for f in files:
            if f.endswith('.java'):
                java_sources.append(os.path.join(root, f))
    for root, _, files in os.walk(gen_dir):
        for f in files:
            if f.endswith('.java'):
                java_sources.append(os.path.join(root, f))

    run_cmd(['javac', '--release', '8', '-cp', android_jar, '-d', classes_dir] + java_sources)

    # 4. Convert classes to Dalvik Executable (classes.dex) with D8
    print("[4/6] Converting Java classes to Dalvik Executable (classes.dex) with D8...")
    class_files = []
    for root, _, files in os.walk(classes_dir):
        for f in files:
            if f.endswith('.class'):
                class_files.append(os.path.join(root, f))

    run_cmd([d8, '--output', dex_dir, '--lib', android_jar] + class_files)

    # 5. Package unaligned APK
    print("[5/6] Packaging native APK archive with assets and Dalvik bytecode...")
    shutil.copyfile(res_apk, unaligned_apk)

    with zipfile.ZipFile(unaligned_apk, 'a', compression=zipfile.ZIP_DEFLATED) as apk:
        # Add classes.dex
        dex_path = os.path.join(dex_dir, 'classes.dex')
        if os.path.exists(dex_path):
            apk.write(dex_path, 'classes.dex')
            print("  + Added valid classes.dex bytecode")

        # Add models and circuits assets
        if os.path.exists(assets_dir):
            for root, _, files in os.walk(assets_dir):
                for f in files:
                    full_p = os.path.join(root, f)
                    rel_p = os.path.relpath(full_p, assets_dir).replace('\\', '/')
                    apk_entry = f"assets/{rel_p}"
                    apk.write(full_p, apk_entry)
                    print(f"  + Added asset: {apk_entry}")

    # 6. Align APK with zipalign (4-byte alignment)
    print("[6/6] Aligning and cryptographically signing APK...")
    if os.path.exists(final_apk):
        os.remove(final_apk)
    run_cmd([zipalign, '-p', '-f', '4', unaligned_apk, final_apk])

    # Generate debug keystore if not exists
    if not os.path.exists(keystore):
        print("  * Generating standard debug keystore...")
        run_cmd([
            'keytool', '-genkeypair', '-v',
            '-keystore', keystore,
            '-alias', 'androiddebugkey',
            '-keypass', 'android',
            '-storepass', 'android',
            '-keyalg', 'RSA',
            '-keysize', '2048',
            '-validity', '10000',
            '-dname', 'CN=Android Debug,O=Android,C=US'
        ])

    # Sign APK with apksigner (v1, v2, and v3 schemes)
    run_cmd([
        apksigner, 'sign',
        '--ks', keystore,
        '--ks-pass', 'pass:android',
        '--key-pass', 'pass:android',
        '--v1-signing-enabled', 'true',
        '--v2-signing-enabled', 'true',
        '--v3-signing-enabled', 'true',
        final_apk
    ])

    # Verify signature
    verify_out = run_cmd([apksigner, 'verify', '--verbose', final_apk])
    print("  * Signature Verification:\n" + '\n'.join('    ' + l for l in verify_out.strip().splitlines()))

    apk_size_mb = os.path.getsize(final_apk) / (1024 * 1024)
    print(f"\n==================================================================")
    print(f" [She-Raksha APK] SUCCESS! Fully Valid Android APK Created:")
    print(f"  Artifact: {final_apk}")
    print(f"  Size    : {apk_size_mb:.2f} MB")
    print(f"==================================================================\n")

if __name__ == '__main__':
    main()
