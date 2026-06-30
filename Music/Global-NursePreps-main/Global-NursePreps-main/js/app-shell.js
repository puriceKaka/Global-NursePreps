(() => {
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("[data-year]").forEach((node) => {
            node.textContent = String(new Date().getFullYear());
        });

        document.querySelectorAll("[data-nav-toggle]").forEach((button) => {
            button.addEventListener("click", () => {
                const target = document.getElementById(button.getAttribute("data-nav-toggle"));
                if (!target) return;
                const open = target.classList.toggle("open");
                button.setAttribute("aria-expanded", String(open));
            });
        });
    });
})();
