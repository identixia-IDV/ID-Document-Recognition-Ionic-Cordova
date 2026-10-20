import { nativeCall } from './cordovaExec';
import type { DocumentRecognitionSdkPlugin } from './definitions';
import { authenticityModeValue, type AuthenticityArg } from './authenticityMode';
import {
  parseLicenseStatus,
  type LicenseStatus,
} from './licenseStatus';
import { normalizeResultJson } from './normalizeResult';

const SERVICE = 'DocumentRecognitionSdk';

async function callNative<T = any>(action: string, args: unknown[] = []): Promise<T> {
  return nativeCall<T>(SERVICE, action, args);
}

/** Low-level Cordova plugin surface (same shape as Capacitor registerPlugin). */
export const DocumentRecognitionSdkNative: DocumentRecognitionSdkPlugin = {
  getMachineCode: () => callNative('getMachineCode'),
  setActivation: (options) => callNative('setActivation', [options]),
  init: () => callNative('init'),
  deinit: () => callNative('deinit'),
  startNewSession: (options) => callNative('startNewSession', [options ?? {}]),
  locateDocument: (options) => callNative('locateDocument', [options]),
  recognize: (options) => callNative('recognize', [options]),
  documentRecognition: (options) => callNative('documentRecognition', [options]),
  documentLiveness: (options) => callNative('documentLiveness', [options]),
  lastLicenseError: () => callNative('lastLicenseError'),
  getLicenseStatus: () => callNative('getLicenseStatus'),
  writeStatus: (options) => callNative('writeStatus', [options]),
  startLivePreview: (options) => callNative('startLivePreview', [options ?? {}]),
  stopLivePreview: () => callNative('stopLivePreview'),
  takeLiveSnapshot: () => callNative('takeLiveSnapshot'),
  cropToGuide: (options) => callNative('cropToGuide', [options]),
};

export type ImageInput = string;
export type LiveCameraPhoto = {
  uri: string;
  path: string;
  width?: number;
  height?: number;
};
export type { AuthenticityArg, AuthenticityMode } from './authenticityMode';

export async function getMachineCode(): Promise<string> {
  const { value } = await DocumentRecognitionSdkNative.getMachineCode();
  return value;
}

export async function setActivation(license: string): Promise<number> {
  const { value } = await DocumentRecognitionSdkNative.setActivation({ license });
  return value;
}

export async function init(): Promise<number> {
  const { value } = await DocumentRecognitionSdkNative.init();
  return value;
}

export async function deinit(): Promise<void> {
  await DocumentRecognitionSdkNative.deinit();
}

export async function startNewSession(
  optionsJson: string = '{"scenario":"FullProcess","series":false}'
): Promise<string> {
  const { value } = await DocumentRecognitionSdkNative.startNewSession({
    optionsJson,
  });
  return value;
}

export async function locateDocument(
  image: ImageInput,
  alreadyCropped: boolean = false
): Promise<string> {
  const { value } = await DocumentRecognitionSdkNative.locateDocument({
    image,
    alreadyCropped,
  });
  return value;
}

export async function recognize(
  front: ImageInput,
  back?: ImageInput | null,
  // Recognition-only product: match Android / Windows / Docker (authenticity off).
  authenticity: AuthenticityArg = false,
  alreadyCropped: boolean = false
): Promise<string> {
  const { value } = await DocumentRecognitionSdkNative.recognize({
    front,
    back: back ?? null,
    authenticityMode: authenticityModeValue(authenticity),
    alreadyCropped,
  });
  return normalizeResultJson(typeof value === 'string' ? value : '');
}

export async function documentRecognition(
  front: ImageInput,
  back?: ImageInput | null,
  alreadyCropped: boolean = false
): Promise<string> {
  const { value } = await DocumentRecognitionSdkNative.documentRecognition({
    front,
    back: back ?? null,
    alreadyCropped,
  });
  return normalizeResultJson(typeof value === 'string' ? value : '');
}

export async function documentLiveness(
  front: ImageInput,
  back?: ImageInput | null,
  alreadyCropped: boolean = false
): Promise<string> {
  const { value } = await DocumentRecognitionSdkNative.documentLiveness({
    front,
    back: back ?? null,
    alreadyCropped,
  });
  return normalizeResultJson(typeof value === 'string' ? value : '');
}

export async function lastLicenseError(): Promise<string> {
  const { value } = await DocumentRecognitionSdkNative.lastLicenseError();
  return value;
}

/** Parsed license capabilities (`label` is what About / home status show). */
export async function getLicenseStatus(): Promise<LicenseStatus> {
  const raw = await DocumentRecognitionSdkNative.getLicenseStatus();
  return parseLicenseStatus(raw as string | Record<string, unknown>);
}

export async function writeStatus(
  payload: Record<string, unknown>
): Promise<void> {
  await DocumentRecognitionSdkNative.writeStatus({
    payload: JSON.stringify(payload),
  });
}

export async function startLivePreview(
  frontCamera: boolean = false
): Promise<void> {
  await DocumentRecognitionSdkNative.startLivePreview({ frontCamera });
}

export async function stopLivePreview(): Promise<void> {
  await DocumentRecognitionSdkNative.stopLivePreview();
}

export async function takeLiveSnapshot(): Promise<LiveCameraPhoto> {
  const snap = await DocumentRecognitionSdkNative.takeLiveSnapshot();
  return {
    uri: snap.uri,
    path: snap.path,
    width: snap.width,
    height: snap.height,
  };
}

export async function cropToGuide(
  image: ImageInput,
  viewW: number,
  viewH: number,
  previewW = 0,
  previewH = 0
): Promise<string> {
  if (viewW <= 1 || viewH <= 1) {
    throw new Error('Guide view size is not ready');
  }
  const { value } = await DocumentRecognitionSdkNative.cropToGuide({
    image,
    viewW,
    viewH,
    previewW,
    previewH,
  });
  if (!value) {
    throw new Error('Could not crop to the camera rectangle');
  }
  return value;
}
