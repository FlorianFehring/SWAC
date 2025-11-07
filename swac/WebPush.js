import SWAC from "./swac.js"

export default class WebPush {

    static url = `https://${window.location.host}/WebPush/smarttemplate/push`;

    async subscribe() {
        if (SWAC.config.progressive.supportpush) {
            const subscription = await navigator.serviceWorker.ready.then(async registration =>
                registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: SWAC.urlBase64ToUint8Array(await this.getKey())
                })
            );

            var key = subscription.getKey ? subscription.getKey('p256dh') : '';
            var auth = subscription.getKey ? subscription.getKey('auth') : '';

            return await fetch(`${WebPush.url}/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
        await fetch(`${WebPush.url}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    }
}