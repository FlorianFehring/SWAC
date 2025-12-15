
export default class WebPush {

    informUser() {

    }

    subscribe() {
        // Addition for push notifications
        if (thisRef.config.progressive.pushnotifications) {
            const subscription = registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: SWAC.urlBase64ToUint8Array(thisRef.config.publicVapidKey)
            });
        }
    }
}