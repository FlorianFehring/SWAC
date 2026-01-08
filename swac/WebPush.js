import SWAC from "./swac.js"

export default class WebPush {

    static url = `https://${window.location.host}/WebPush/webpush/push`;

    async subscribe() {
        if (SWAC.config.progressive.supportpush) {
            const subscription = await navigator.serviceWorker.ready.then(async registration => {
                let subscription = await registration.pushManager.getSubscription();
                if (subscription == null) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: SWAC.urlBase64ToUint8Array(await this.getKey())
                    })
                }
                return subscription;
            });
            var key = subscription.getKey ? subscription.getKey('p256dh') : '';
            var auth = subscription.getKey ? subscription.getKey('auth') : '';

            return await fetch(`${WebPush.url}/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: "Test Name",
                    endpoint: subscription.endpoint,
                    key: key ? btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : '',
                    auth: auth ? btoa(String.fromCharCode.apply(null, new Uint8Array(auth))) : ''
                })
            }).then(response => response.json());
        }
    }

    async getKey() {
        return await fetch(`${WebPush.url}/key`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }).then(response => response.json()).then(data => data.key);

    }

    async send() {
        return await fetch(`${WebPush.url}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Test Message from PWA",
                body: "This is a test notification sent from the SWAC WebPush module.",
                icon_url: "/WebPush-PWA/files/icons/logo.png"
            })
        }).then(response => response.json());
    }
}