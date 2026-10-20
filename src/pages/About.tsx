import { useSdk } from '../SdkContext';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import IdentixiaLogo from '../components/IdentixiaLogo';
import { ANDROID_APPLICATION_ID, IOS_BUNDLE_ID, resolveNativePlatform } from '../license';

export default function About() {
  const appId = resolveNativePlatform() === 'ios' ? IOS_BUNDLE_ID : ANDROID_APPLICATION_ID;
  const { licenseLabel } = useSdk();
  const [presentToast] = useIonToast();


  const onCopy = async () => {
    if (!appId) return;
    try {
      await navigator.clipboard.writeText(appId);
      presentToast({ message: 'Copied', duration: 1500, color: 'success' });
    } catch {
      presentToast({ message: 'Copy failed', duration: 1500, color: 'danger' });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>About</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="about-body">
          <div className="about-logo-row">
            <IdentixiaLogo size={96} />
            <div className="about-license-chip">{`License: ${licenseLabel}`}</div>
          </div>

          <div className="about-machine-row">
            <div className="about-machine-code">{appId}</div>
            <button type="button" className="about-copy-btn" onClick={() => void onCopy()}>
              Copy
            </button>
          </div>

          <a
            className="about-site-link"
            href="https://identixia.com"
            target="_blank"
            rel="noreferrer"
          >
            identixia.com
          </a>
        </div>
      </IonContent>
    </IonPage>
  );
}
