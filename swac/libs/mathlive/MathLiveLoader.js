import {ComputeEngine} from './compute-engine.min.esm.js';

let mathlivePromise = null;

/**
 * Loads the browser distribution and the local Compute Engine.
 *
 * @returns {Promise<MathfieldElement>}
 */
export function loadMathLive() {
    if (mathlivePromise)
        return mathlivePromise;
    mathlivePromise = new Promise((resolve, reject) => {
        let MathfieldElement = window.MathLive?.MathfieldElement || window.MathfieldElement;
        if (MathfieldElement) {
            resolve(MathfieldElement);
            return;
        }
        let script = document.createElement('script');
        script.src = '/SWAC/swac/libs/mathlive/mathlive.min.js?ver=11.08.2026.1';
        script.onload = function () {
            let MathfieldElement = window.MathLive?.MathfieldElement || window.MathfieldElement;
            if (MathfieldElement)
                resolve(MathfieldElement);
            else
                reject(new Error('MathLive did not provide MathfieldElement.'));
        };
        script.onerror = function () {
            reject(new Error('MathLive could not be loaded.'));
        };
        document.head.appendChild(script);
    }).then((MathfieldElement) => {
        MathfieldElement.fontsDirectory = '/SWAC/swac/libs/mathlive/fonts';
        MathfieldElement.computeEngine = new ComputeEngine();
        return MathfieldElement;
    });
    return mathlivePromise;
}
