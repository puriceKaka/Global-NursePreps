(() => {
    const raw = localStorage.getItem("nurseprep_session");
    const usersRaw = localStorage.getItem("nurseprep_users");
    let session = null;
    let users = [];
    try {
        session = raw ? JSON.parse(raw) : null;
    } catch {
        session = null;
    }
    try {
        const parsed = usersRaw ? JSON.parse(usersRaw) : [];
        users = Array.isArray(parsed) ? parsed : [];
    } catch {
        users = [];
    }

    const account = users.find((user) => user.id === session?.userId);
    if (session?.userId && account && (!account.role || account.role === "student")) return;
    localStorage.removeItem("nurseprep_session");

    const script = document.currentScript;
    const loginPath = script?.dataset?.login || "login.html";
    const pathFromRoot = window.location.pathname.replace(/^\/+/, "");
    const next = encodeURIComponent(`${pathFromRoot}${window.location.search || ""}`);
    window.location.replace(`${loginPath}?next=${next}`);
})();
