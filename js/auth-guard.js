(() => {
    const raw = localStorage.getItem("nurseprep_session");
    let session = null;
    try {
        session = raw ? JSON.parse(raw) : null;
    } catch {
        session = null;
    }

    if (session?.userId) return;

    const script = document.currentScript;
    const loginPath = script?.dataset?.login || "login.html";
    const pathFromRoot = window.location.pathname.replace(/^\/+/, "");
    const next = encodeURIComponent(`${pathFromRoot}${window.location.search || ""}`);
    window.location.replace(`${loginPath}?next=${next}`);
})();
