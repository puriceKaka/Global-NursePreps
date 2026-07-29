window.GnpAdminAuth = (() => {
    function getNextUrl(fallback = "admin.html") {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");
        return next && !next.startsWith("http") ? next : fallback;
    }

    async function requireAdmin(redirectTo = "admin.html") {
        try {
            const result = await window.GnpAdminApi?.me?.();
            if (result?.user?.role === "admin") {
                return result.user;
            }
        } catch {
            // Fall through to redirect.
        }

        const next = encodeURIComponent(getNextUrl(window.location.pathname.split("/").pop() || "admin.html"));
        window.location.replace(`${redirectTo}?next=${next}`);
        return null;
    }

    return {
        getNextUrl,
        requireAdmin
    };
})();
