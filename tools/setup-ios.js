#!/usr/bin/env node
/** One-time iOS platform prepare for the Cordova demo (macOS + Xcode). */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const iosRoot = path.join(root, 'platforms', 'ios');
const pluginInstall = path.join(root, 'plugins', 'document-reader-cordova');

function run(cmd, args) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env: process.env });
  if (r.status !== 0) process.exit(r.status == null ? 1 : r.status);
}

function iosPlatformOk() {
  return fs.existsSync(path.join(iosRoot, 'cordova', 'version'));
}

function pluginOk() {
  return fs.existsSync(path.join(pluginInstall, 'plugin.xml'));
}

function removeIncompleteTrees() {
  if (fs.existsSync(iosRoot) && !iosPlatformOk()) {
    console.log('> removing incomplete platforms/ios');
    fs.rmSync(iosRoot, { recursive: true, force: true });
  }
  if (fs.existsSync(pluginInstall) && !pluginOk()) {
    console.log('> removing incomplete plugins/document-reader-cordova');
    fs.rmSync(pluginInstall, { recursive: true, force: true });
  }
}

const fw = path.join(
  root,
  'DocumentRecognitionPlugin',
  'src',
  'ios',
  'Frameworks',
  'documentrecognitionsdk.framework'
);
if (!fs.existsSync(fw)) {
  console.error(`Missing ${fw}`);
  console.error('Download the iOS runtime first (see README → Get the runtimes).');
  process.exit(1);
}

const wwwJs = path.join(root, 'DocumentRecognitionPlugin', 'www', 'DocumentRecognitionSdk.js');
if (!fs.existsSync(wwwJs)) {
  console.error(`Missing ${wwwJs}`);
  process.exit(1);
}

run('npm', ['run', 'build']);
removeIncompleteTrees();

if (!iosPlatformOk()) {
  run('npx', ['cordova', 'platform', 'add', 'ios']);
} else {
  console.log('platforms/ios already present');
}

run('npx', ['cordova', 'plugin', 'add', './DocumentRecognitionPlugin', '--noregistry', '--force']);
run('npx', ['cordova', 'plugin', 'add', 'cordova-plugin-camera', '--force']);
run('npx', ['cordova', 'prepare', 'ios']);

const iosJson = path.join(root, 'plugins', 'ios.json');
let installed = false;
try {
  const j = JSON.parse(fs.readFileSync(iosJson, 'utf8'));
  installed = Boolean(j?.installed_plugins?.['document-reader-cordova']);
} catch {
  /* ignore */
}
const fwLinked = fs.existsSync(
  path.join(root, 'platforms/ios/App/Plugins/document-reader-cordova/documentrecognitionsdk.framework')
);
if (!installed || !fwLinked) {
  console.error(
    'iOS plugin install incomplete (fetch_runtime must not process.exit). Re-run setup:ios after fixing DocumentRecognitionPlugin/hooks/fetch_runtime.js.'
  );
  process.exit(1);
}
console.log('setup:ios complete — next: npm run ios');
