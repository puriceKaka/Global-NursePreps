(() => {
    const session = window.GnpUtils?.getSession?.() || null;
    const validSession = window.GnpAuthSecurity?.isSessionValid
        ? window.GnpAuthSecurity.isSessionValid(session)
        : Boolean(session?.userId && session?.authToken);
    if (validSession) return;

    const script = document.currentScript;
    const loginPath = script?.dataset?.login || "login.html";
    const pathFromRoot = window.location.pathname.replace(/^\/+/, "");
    const next = encodeURIComponent(`${pathFromRoot}${window.location.search || ""}`);
    window.location.replace(`${loginPath}?next=${next}`);
})();
