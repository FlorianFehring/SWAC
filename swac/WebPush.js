import SWAC from "./swac.js"

export default class WebPush {

    informUser() {
        
    }

    async subscribe() {
        // Addition for push notifications
        if (SWAC.config.progressive.supportpush) {
            const rawkey = await this.getKey();
            console.log("Key: ", rawkey)
            const subscription = await SWAC.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: SWAC.urlBase64ToUint8Array(rawkey)
            });

            var key = subscription.getKey ? subscription.getKey('p256dh') : '';
            var auth = subscription.getKey ? subscription.getKey('auth') : '';

            const body = JSON.stringify({
                            endpoint: subscription.endpoint,
                            // Take byte[] and turn it into a base64 encoded string suitable for
                            // POSTing to a server over HTTP
                            key: key ? btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : '',
                            auth: auth ? btoa(String.fromCharCode.apply(null, new Uint8Array(auth))) : ''
                        });

            fetch('https://localhost:8181/WebPush/smarttemplate/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body
            }).then(response => {
                if (!response.ok) {
                throw new Error('HTTP-Fehler: ' + response.status);
                }
                return response.text(); // JSON in JS-Objekt umwandeln
            }).then(data => {
                console.log('Antwortobjekt:', data);
            });

            console.log('Push subscription erfolgreich registriert:', body);
        }
    }

    async getKey() {
        let base64;
        const response = await fetch('https://localhost:8181/WebPush/smarttemplate/push/key', {
            method: 'GET',
            headers: {}
        });
        return response.text();
    }

}