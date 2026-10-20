export interface DocumentRecognitionSdkPlugin {
  getMachineCode(): Promise<{ value: string }>;
  setActivation(options: { license: string }): Promise<{ value: number }>;
  init(): Promise<{ value: number }>;
  deinit(): Promise<void>;
  startNewSession(options?: {
    optionsJson?: string;
  }): Promise<{ value: string }>;
  locateDocument(options: {
    image: string;
    /** false for camera guide crops (re-detect + upright). true only for tight gallery crops. */
    alreadyCropped?: boolean;
  }): Promise<{ value: string }>;
  recognize(options: {
    front: string;
    back?: string | null;
    authenticity?: boolean;
    authenticityMode?: string;
    alreadyCropped?: boolean;
  }): Promise<{ value: string }>;
  documentRecognition(options: {
    front: string;
    back?: string | null;
    alreadyCropped?: boolean;
  }): Promise<{ value: string }>;
  documentLiveness(options: {
    front: string;
    back?: string | null;
    alreadyCropped?: boolean;
  }): Promise<{ value: string }>;
  lastLicenseError(): Promise<{ value: string }>;
  getLicenseStatus(): Promise<{ value: string }>;
  writeStatus(options: { payload: string }): Promise<void>;
  /** Native camera under transparent WebView. Default rear for documents. */
  startLivePreview(options?: { frontCamera?: boolean }): Promise<void>;
  stopLivePreview(): Promise<void>;
  takeLiveSnapshot(): Promise<{
    uri: string;
    path: string;
    width?: number;
    height?: number;
  }>;
  cropToGuide(options: {
    image: string;
    viewW: number;
    viewH: number;
    previewW?: number;
    previewH?: number;
  }): Promise<{ value: string }>;
}
