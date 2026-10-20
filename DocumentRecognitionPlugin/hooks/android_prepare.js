#!/usr/bin/env node
/**
 * Cordova after_prepare / before_build / before_run:
 * Disable Jetifier (huge AARs OOM Jetifier), raise heap, fix splash colors.
 * Keep Document Reader AAR + gradle reference + launcher icons in sync.
 */
const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    if (fs.statSync(from).isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function ensureLauncherIcons(projectRoot) {
  const src = path.join(projectRoot, 'resources', 'android', 'res');
  const dest = path.join(
    projectRoot,
    'platforms',
    'android',
    'app',
    'src',
    'main',
    'res'
  );
  if (!fs.existsSync(src) || !fs.existsSync(path.dirname(dest))) return;
  copyDir(src, dest);
  console.log('[document-reader-cordova] Ensured Android launcher icons');
}

function ensureSdkAar(projectRoot) {
  const androidDir = path.join(projectRoot, 'platforms', 'android');
  if (!fs.existsSync(androidDir)) return;

  const searchDirs = [
    path.join(projectRoot, 'DocumentRecognitionPlugin', 'src', 'android'),
    path.join(projectRoot, 'plugins', 'document-reader-cordova', 'src', 'android'),
  ];
  let aarSrc = null;
  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith('.aar')) {
        aarSrc = path.join(dir, name);
        break;
      }
    }
    if (aarSrc) break;
  }
  if (!aarSrc) return;

  const aarName = path.basename(aarSrc);
  const dest = path.join(androidDir, 'app', 'src', 'main', 'libs', aarName);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(aarSrc, dest);

  const gradleSrc = path.join(path.dirname(aarSrc), 'aarintegration.gradle');
  const gradleDest = path.join(
    androidDir,
    'document-reader-cordova',
    'documentrecognition-aarintegration.gradle'
  );
  if (fs.existsSync(gradleSrc) && fs.existsSync(path.dirname(gradleDest))) {
    fs.copyFileSync(gradleSrc, gradleDest);
  }
  console.log('[document-reader-cordova] Ensured', path.relative(projectRoot, dest));
}

function prepareAndroid(projectRoot) {
  const androidDir = path.join(projectRoot, 'platforms', 'android');
  if (!fs.existsSync(androidDir)) return;
  ensureSdkAar(projectRoot);
  ensureLauncherIcons(projectRoot);

  const gp = path.join(androidDir, 'gradle.properties');
  if (fs.existsSync(gp)) {
    let text = fs.readFileSync(gp, 'utf8');
    const ensure = (key, value) => {
      const re = new RegExp('^\s*' + key.replace(/\./g, '\.') + '=.*$', 'm');
      if (re.test(text)) text = text.replace(re, key + '=' + value);
      else text += '\n' + key + '=' + value + '\n';
    };
    ensure('android.useAndroidX', 'true');
    ensure('android.enableJetifier', 'false');
    ensure('org.gradle.jvmargs', '-Xmx4096m -Dfile.encoding=UTF-8');
    fs.writeFileSync(gp, text);
    console.log('[document-reader-cordova] gradle.properties: Jetifier off, heap 4g');
  }

  const colors = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'colors.xml');
  if (fs.existsSync(colors)) {
    let text = fs.readFileSync(colors, 'utf8');
    const fixed = text.replace(/>0x([0-9a-fA-F]{8})</g, '>#$1<');
    if (fixed !== text) {
      fs.writeFileSync(colors, fixed);
      console.log('[document-reader-cordova] Fixed colors.xml hex format');
    }
  }
}

module.exports = function (ctx) {
  const projectRoot =
    (ctx && ctx.opts && ctx.opts.projectRoot) ||
    process.argv[2] ||
    process.cwd();
  prepareAndroid(projectRoot);
};

if (require.main === module) {
  prepareAndroid(process.argv[2] || process.cwd());
}
