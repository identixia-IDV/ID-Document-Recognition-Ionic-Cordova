#!/usr/bin/env node
/**
 * Build + install + launch on a physical iOS device without ios-deploy -d.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const HOOK = path.join(root, 'DocumentRecognitionPlugin', 'hooks', 'ios_prepare.js');
const BUILD_DIR = path.join(root, 'platforms/ios/build/Debug-iphoneos');
const ARCHIVE_APPS = path.join(
  root,
  'platforms/ios/App.xcarchive/Products/Applications'
);

function run(cmd, args) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env: process.env });
  if (r.status !== 0) process.exit(r.status == null ? 1 : r.status);
  return r;
}

function runSoft(cmd, args) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  return spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env: process.env });
}

function capture(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', env: process.env });
  return `${r.stdout || ''}${r.stderr || ''}`;
}

function readBundleId() {
  const cfg = path.join(root, 'config.xml');
  if (fs.existsSync(cfg)) {
    const text = fs.readFileSync(cfg, 'utf8');
    const m =
      text.match(/ios-CFBundleIdentifier="([^"]+)"/) ||
      text.match(/\bid="([^"]+)"/);
    if (m) return m[1];
  }
  return 'com.identixia.documentreader.app';
}

function pickDevice() {
  const dc = capture('xcrun', ['devicectl', 'list', 'devices', '--timeout', '20']);
  for (const line of dc.split('\n')) {
    if (!/connected/i.test(line)) continue;
    if (!/iPhone|iPad/i.test(line)) continue;
    const m = line.match(
      /([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})/
    );
    if (m) return m[1];
  }
  const xt = capture('xcrun', ['xctrace', 'list', 'devices']);
  for (const line of xt.split('\n')) {
    if (/Simulator/i.test(line)) continue;
    if (!/iPhone|iPad/i.test(line)) continue;
    const m = line.match(/\(([0-9A-Fa-f-]{25,})\)\s*$/);
    if (m) return m[1];
  }
  return null;
}

function firstAppInDir(dir) {
  if (!fs.existsSync(dir)) return null;
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith('.app')) return path.join(dir, name);
  }
  return null;
}

function extractIpaApp() {
  if (!fs.existsSync(BUILD_DIR)) return null;
  const ipas = fs
    .readdirSync(BUILD_DIR)
    .filter((n) => n.endsWith('.ipa'))
    .map((n) => path.join(BUILD_DIR, n));
  ipas.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  for (const ipa of ipas) {
    const dest = path.join(os.tmpdir(), `doc-cordova-ipa-${process.pid}`);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(dest, { recursive: true });
    console.log(`> unzip -q ${path.basename(ipa)}`);
    const r = spawnSync('unzip', ['-q', ipa, '-d', dest], { stdio: 'inherit' });
    if (r.status !== 0) continue;
    const app = firstAppInDir(path.join(dest, 'Payload'));
    if (app) return app;
  }
  return null;
}

function findBuiltApp() {
  const fromIpa = extractIpaApp();
  if (fromIpa) return fromIpa;
  return firstAppInDir(BUILD_DIR) || firstAppInDir(ARCHIVE_APPS);
}

function printTrustHelp() {
  console.error(`
--------------------------------------------------------------------
Install succeeded, but iOS refused to launch (developer not trusted).

On the iPhone:
  Settings → General → VPN & Device Management
  → Apple Development (your Apple ID)
  → Trust

Unlock the phone, tap Trust, then open the app from the Home Screen
(or re-run: npm run ios).
--------------------------------------------------------------------`);
}

const BUNDLE_ID = readBundleId();

run('npm', ['run', 'build']);
run('npx', ['cordova', 'prepare', 'ios']);
run('npx', ['cordova', 'build', 'ios', '--device', '--buildConfig=build.json']);

if (fs.existsSync(HOOK)) {
  run('node', [HOOK, root, '--sign']);
}

const app = findBuiltApp();
if (!app) {
  console.error('Built .app / .ipa not found under platforms/ios/build/Debug-iphoneos');
  process.exit(1);
}

const device = pickDevice();
if (!device) {
  console.error('No connected iPhone/iPad found. Unlock the device and retry.');
  process.exit(1);
}

console.log(`Installing ${app} on ${device}…`);
run('xcrun', [
  'devicectl',
  'device',
  'install',
  'app',
  '--device',
  device,
  app,
  '--timeout',
  '900',
]);

console.log(`Launching ${BUNDLE_ID}…`);
const launch = runSoft('xcrun', [
  'devicectl',
  'device',
  'process',
  'launch',
  '--device',
  device,
  '--terminate-existing',
  BUNDLE_ID,
]);
if (launch.status !== 0) {
  printTrustHelp();
  process.exit(0);
}
console.log('Done — installed and launched (no debugger attach).');
