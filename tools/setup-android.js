#!/usr/bin/env node
/**
 * Idempotent Android setup matching sample flow:
 *   ionic cordova plugin add ./DocumentRecognitionPlugin
 *   ionic cordova build/run android
 *
 * Do not rm+add the local plugin on every setup — that unregisters
 * DocumentRecognitionSdk from config.xml ("Class not found") if add fails.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pluginSrc = path.join(root, 'DocumentRecognitionPlugin');
const aarCandidates = [
  path.join(pluginSrc, 'src', 'android', 'documentrecognitionsdk.aar'),
  path.join(pluginSrc, 'src', 'android', 'libs', 'documentrecognitionsdk.aar'),
];
const aarSrc = aarCandidates.find((p) => fs.existsSync(p));
const aar = path.join(pluginSrc, 'src', 'android', 'documentrecognitionsdk.aar');
if (aarSrc && path.resolve(aarSrc) !== path.resolve(aar)) {
  fs.mkdirSync(path.dirname(aar), { recursive: true });
  fs.copyFileSync(aarSrc, aar);
  console.log('Copied', path.relative(root, aarSrc), '->', path.relative(root, aar));
}
const pluginsDir = path.join(root, 'plugins');
const installedPlugin = path.join(pluginsDir, 'document-reader-cordova');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit', shell: true });
}

function copy(fromRel, toRel) {
  const from = path.join(pluginSrc, fromRel);
  const to = path.join(installedPlugin, toRel);
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

function pluginRegistered() {
  try {
    const androidJson = JSON.parse(
      fs.readFileSync(path.join(pluginsDir, 'android.json'), 'utf8')
    );
    return Boolean(androidJson.installed_plugins?.['document-reader-cordova']);
  } catch {
    return false;
  }
}

function syncInstalledPluginFiles() {
  if (!fs.existsSync(installedPlugin)) return false;
  copy('plugin.xml', 'plugin.xml');
  copy('src/android/DocumentRecognitionSdkPlugin.kt', 'src/android/DocumentRecognitionSdkPlugin.kt');
  copy('src/android/ImageUtils.kt', 'src/android/ImageUtils.kt');
  copy('src/android/documentrecognitionsdk.aar', 'src/android/documentrecognitionsdk.aar');
  copy('src/android/aarintegration.gradle', 'src/android/aarintegration.gradle');
  copy('src/ios/DocSdkBridge.h', 'src/ios/DocSdkBridge.h');
  copy('src/ios/DocSdkBridge.mm', 'src/ios/DocSdkBridge.mm');
  copy('src/ios/DocumentRecognitionSdkPlugin.swift', 'src/ios/DocumentRecognitionSdkPlugin.swift');
  copy('lib', 'lib');
  copy('dist', 'dist');
  copy('www', 'www');
  console.log('Synced DocumentRecognitionPlugin sources into plugins/document-reader-cordova');
  return true;
}


function readAndroidPackageName() {
  const cfg = fs.readFileSync(path.join(root, 'config.xml'), 'utf8');
  const m = cfg.match(/android-packageName="([^"]+)"/) || cfg.match(/\bid="([^"]+)"/);
  if (!m) {
    throw new Error('Could not parse Android package from config.xml');
  }
  return m[1].replace(/-/g, '_');
}

function findCordovaActivities(javaRoot) {
  const results = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith('.java')) {
        const contents = fs.readFileSync(p, 'utf8');
        if (/extends\s+CordovaActivity/.test(contents)) results.push(p);
      }
    }
  }
  walk(javaRoot);
  return results;
}

/** Cordova prepare only looks under java/<package>/; relocate or create MainActivity. */
function ensureCordovaMainActivity() {
  const androidRoot = path.join(root, 'platforms', 'android');
  if (!fs.existsSync(androidRoot)) return;
  const pkg = readAndroidPackageName();
  const javaSrc = path.join(androidRoot, 'app', 'src', 'main', 'java');
  const destDir = path.join(javaSrc, ...pkg.split('.'));
  const destFile = path.join(destDir, 'MainActivity.java');
  const found = findCordovaActivities(javaSrc);
  const template =
    '/*\n' +
    '       Licensed to the Apache Software Foundation (ASF) under one\n' +
    '       or more contributor license agreements.\n' +
    ' */\n' +
    `package ${pkg};\n\n` +
    'import android.os.Bundle;\n\n' +
    'import org.apache.cordova.*;\n\n' +
    'public class MainActivity extends CordovaActivity\n' +
    '{\n' +
    '    @Override\n' +
    '    public void onCreate(Bundle savedInstanceState)\n' +
    '    {\n' +
    '        super.onCreate(savedInstanceState);\n\n' +
    '        Bundle extras = getIntent().getExtras();\n' +
    '        if (extras != null && extras.getBoolean("cdvStartInBackground", false)) {\n' +
    '            moveTaskToBack(true);\n' +
    '        }\n\n' +
    '        loadUrl(launchUrl);\n' +
    '    }\n' +
    '}\n';

  if (found.length === 0) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(destFile, template);
    console.log(`Created MainActivity for ${pkg}`);
    return;
  }

  const norm = (p) => path.normalize(p).toLowerCase();
  const already = found.find((f) => norm(f) === norm(destFile));
  const src = already || found[0];
  let contents = fs.readFileSync(src, 'utf8');
  contents = contents.replace(/package\s+[\w.]+;/, `package ${pkg};`);
  fs.mkdirSync(destDir, { recursive: true });
  if (norm(src) !== norm(destFile)) {
    fs.writeFileSync(destFile, contents);
    fs.unlinkSync(src);
    console.log(`Relocated MainActivity -> ${path.relative(root, destFile)}`);
  } else if (fs.readFileSync(destFile, 'utf8') !== contents) {
    fs.writeFileSync(destFile, contents);
    console.log(`Updated MainActivity package to ${pkg}`);
  }

  for (const f of found) {
    if (norm(f) !== norm(destFile) && fs.existsSync(f)) {
      fs.unlinkSync(f);
    }
  }
}



function ensurePlatformAar() {
  const dest = path.join(root, 'platforms', 'android', 'app', 'src', 'main', 'libs', 'documentrecognitionsdk.aar');
  if (!fs.existsSync(aar)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(aar, dest);
  console.log('Ensured', path.relative(root, dest));
}

if (!fs.existsSync(aar)) {
  console.error(
    'Missing DocumentRecognitionPlugin/src/android/documentrecognitionsdk.aar\n' +
      'Download the Android runtime (see README → Get the runtimes) and place it there.'
  );
  process.exit(1);
}

run('npm run build');
run('npm run plugin:build');

if (!fs.existsSync(path.join(root, 'platforms', 'android'))) {
  run('npx cordova platform add android');
} else {
  console.log('platforms/android already present');
}

if (!fs.existsSync(path.join(pluginsDir, 'cordova-plugin-camera'))) {
  run('npx cordova plugin add cordova-plugin-camera');
}

if (!pluginRegistered()) {
  run('npx cordova plugin add ./DocumentRecognitionPlugin --nofetch --nosave');
} else {
  syncInstalledPluginFiles();
}

ensureCordovaMainActivity();
run('npx cordova prepare android');
console.log('\nAndroid setup complete. Run: npm run android');
