window.onload = function funLoad() {
    try {
        eval("try { import('foo').catch(() => {}); } catch (e) { }");
    } catch (e) {
        var s = document.createElement('script');
        s.src = '/SWAC/swac/legacyscripts.js'
        document.head.appendChild(s);
    }
};