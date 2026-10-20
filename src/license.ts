/**
 * Demo FP1 licenses — same keys as native DocumentReader Android / iOS Apps.
 * Bound to applicationId / bundle id below. Request a new key if you change the id.
 *
 * iOS must run as com.identixia.documentrecognition.app (see config.xml ios-CFBundleIdentifier).
 * Android must run as com.identixia.documentrecognition.
 */
import { getCordovaPlatform } from 'document-reader-cordova';


/** Android demo applicationId (config.xml android-packageName / widget id) */
export const ANDROID_APPLICATION_ID = 'com.identixia.documentrecognition';


/** iOS demo bundle id (config.xml ios-CFBundleIdentifier) */
export const IOS_BUNDLE_ID = 'com.identixia.documentrecognition.app';


const ANDROID_LICENSE =
  
  
  'pyyR2AECkYEhYnDuzXLOwla+ry2dU8SulbnX9aLqfGaDsn8AAADRMMDjpKQXextLR8zRtgS6ldIQyKVQGLT9JDwbAF1/ok+Rx/ZdtMTAzJ6iuWeLmbFkoz6bPGNP09lJPL6T5bKu44e7sWB9XGCX9IKnkitEYd6DD2iCeBs9QT3rHCuClfUsP5Qag5tjRFOvS6QUQK+/sB3hByu2ZKgwHczY2hDAZwAwZQIwLLtOJ5PETaTTnDfn8isleSGhtEGRsny1mPHSdm7nYdg4pgcfL6VkpqYow+AzbuSPAjEAphf2gWd0jxF3vcs9+kTOkYBNxanAAG0O2GuaJfX4LSjXcHzYhmRT0e9Duqqg/DS5';


const IOS_LICENSE =
  
  
  'pyyR2AECa2aTjTOMUZS+XB+XCjYtbOU1jnq8ZuqABmKlun8AAABlWsZWJQA1MyBCvRiXcGQS55y4XBarYSnSNYpxTtRyFx5VJ8f6i+z2nGP2kuf52C2zP0j7fPyOEkXx98X5GoHLychVusQBMFCy3v9l191wQg4iRsbVDtkm73p6OvW9dg2+0v0n6RUtmMNTlaG/kwq3ibOHyKt5XCSZ3A8qndKaZwAwZQIxAMvqfuglQ2G4eh2zf/TBCL7/KjMUKruNJmSlsy2JgKnDPrvqssPHc6q0juM19oLFMQIwbk9NmQxZEEUsQqvaTb15QlqOX/Y3GEnXUbazJn+kSLumfemi2ejgvEhaNl2nm+Ej';


/** Resolve Cordova platform; fall back to UA when platformId is not ready yet. */
export function resolveNativePlatform(): 'ios' | 'android' | 'web' {
  const p = getCordovaPlatform();
  if (p === 'ios' || p === 'android') return p;
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
  }
  return 'web';
}


export function demoLicense(): string {
  const platform = resolveNativePlatform();
  const license = platform === 'ios' ? IOS_LICENSE : ANDROID_LICENSE;
  console.log(
    `[DocumentReader] license platform=${platform} boundId=${
      platform === 'ios' ? IOS_BUNDLE_ID : ANDROID_APPLICATION_ID
    } keyPrefix=${license.slice(0, 24)}…`
  );
  return license;
}
