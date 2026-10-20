#!/usr/bin/env node
/**
 * before_plugin_install: keep documentrecognitionsdk.aar when it is already in
 * this plugin. Download the latest Release only when it is missing.
 *
 * Must NOT call process.exit — Cordova runs hooks in-process; exiting aborts
 * plugin install (iOS never embeds frameworks).
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.join(__dirname, '..');
const aar = path.join(root, 'src', 'android', 'documentrecognitionsdk.aar');

function present(file) {
  try {
    return fs.statSync(file).size > 1024;
  } catch (e) {
    return false;
  }
}

function download(from, to) {
  return new Promise((resolve) => {
    const req = https.get(from, { timeout: 8000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        download(res.headers.location, to).then(resolve);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        resolve(false);
        return;
      }
      fs.mkdirSync(path.dirname(to), { recursive: true });
      const out = fs.createWriteStream(to);
      res.pipe(out);
      out.on('finish', () => resolve(true));
      out.on('error', () => resolve(false));
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

module.exports = async function () {
  if (present(aar)) return;
  const url =
    'https://github.com/identixia-IDV/ID-Document-Recognition-Android/releases/latest/download/documentrecognitionsdk.aar';
  await download(url, aar);
};
