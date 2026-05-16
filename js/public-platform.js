const loader = document.getElementById('pageLoader');
const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');
const modal = document.getElementById('courseModal');
const modalClose = document.getElementById('modalClose');
const modalCourse = document.getElementById('modalCourse');
const year = document.getElementById('year');
let chatButton = document.getElementById('chatButton');
const siteFooter = document.getElementById('siteFooter');

function ensurePuriceButton() {
    if (document.body.classList.contains('purice-page')) return;
    if (!chatButton) {
        chatButton = document.createElement('button');
        chatButton.type = 'button';
        chatButton.className = 'chat-button';
        chatButton.id = 'chatButton';
        chatButton.innerHTML = '<img src="' + getPuriceAssetPath() + '" alt="" aria-hidden="true"><span>Purice AI</span>';
        document.body.appendChild(chatButton);
    }
}

function getPuriceAssetPath() {
    return window.location.pathname.includes('/EXAMINATION%20PREP%20SITE/') ||
        window.location.pathname.includes('/EXAMINATION PREP SITE/')
        ? '../images/public/puriceAI.svg'
        : 'images/public/puriceAI.svg';
}

function getPuricePath() {
    return window.location.pathname.includes('/EXAMINATION%20PREP%20SITE/') ||
        window.location.pathname.includes('/EXAMINATION PREP SITE/')
        ? '../purice-ai.html'
        : 'purice-ai.html';
}

function renderSiteFooter() {
    if (!siteFooter || siteFooter.dataset.rendered === 'true') return;

    siteFooter.innerHTML = `
        <div class="footer-products" aria-label="Global NursePrep products">
            <strong>Explore all Global NursePrep products</strong>
            <div class="footer-product-links">
                <a href="EXAMINATION%20PREP%20SITE/courses.html">BSCN Nursing Courses</a>
                <a href="EXAMINATION%20PREP%20SITE/courses.html">Certified Nursing Courses</a>
                <a href="licensing.html">NCLEX-RN Preparation</a>
                <a href="licensing.html">UK CBT Preparation</a>
                <a href="licensing.html">Australia Nursing Licensing</a>
                <a href="EXAMINATION%20PREP%20SITE/courses.html">CNA, ICU, Emergency &amp; Critical Care</a>
                <a href="EXAMINATION%20PREP%20SITE/courses.html">Research Support &amp; Academic Writing</a>
                <a href="login.html?next=EXAMINATION%20PREP%20SITE/exam-lobby/exam-lobby.html">Mock Exams &amp; Question Banks</a>
                <a href="login.html?next=certificate.html">Certificates</a>
                <a href="login.html?next=meetings.html">Live Classes</a>
            </div>
        </div>
        <div class="footer-legal" aria-label="Nursing regulations and policies">
            <strong>Nursing Regulations &amp; Policies</strong>
            <p>Learning content supports exam preparation and professional development. Students should follow Nursing Council of Kenya standards, licensing requirements, academic integrity, patient confidentiality, and Kenya data protection rights.</p>
            <div class="footer-legal-links">
                <a href="https://nckenya.com/">Nursing Council of Kenya</a>
                <a href="https://www.odpc.go.ke/">Kenya data protection</a>
                <a href="https://new.kenyalaw.org/akn/ke/act/2019/24/eng@2022-12-31">Data Protection Act</a>
            </div>
        </div>
        <div class="footer-partner">
            <a href="https://umma.ac.ke/" target="_blank" rel="noopener">
                <img src="images/public/umma-university-logo.png" alt="Umma University logo">
                <strong>Partner with Umma University</strong>
            </a>
        </div>
        <div class="footer-company" aria-label="Company">
            <strong>Company</strong>
            <div class="footer-company-links">
                <a href="about.html">About Us</a>
                <a href="leadership-team.html">Leadership Team</a>
                <a href="testimonials.html">Testimonials</a>
                <a href="work-with-us.html">Work With Us</a>
                <a href="newsroom.html">Newsroom</a>
                <a href="global-nurseprep-cares.html">Global NursePrep Cares</a>
            </div>
        </div>
        <div class="footer-resources" aria-label="Resources">
            <strong>Resources</strong>
            <div class="footer-resource-links">
                <a href="system-requirements.html">System Requirements</a>
                <a href="privacy-policy.html">Privacy Policy</a>
                <a href="terms-of-use.html">Terms of Use</a>
                <a href="cookie-policy.html">Cookie Policy</a>
                <a href="platform-architecture.html">Platform Architecture</a>
                <a href="accessibility-assistance.html">Accessibility Assistance</a>
            </div>
        </div>
        <div class="footer-services" aria-label="Services">
            <strong>Services</strong>
            <div class="footer-support-links">
                <a href="EXAMINATION%20PREP%20SITE/courses.html">Course selection</a>
                <a href="licensing.html">Licensing exam prep</a>
                <a href="payments.html">Payment help</a>
                <a href="login.html">Student account access</a>
                <a href="research-consultation.html">Research consultation</a>
                <a href="login.html?next=meetings.html">Live class guidance</a>
            </div>
        </div>
        <div class="footer-divider" aria-hidden="true"></div>
        <div class="footer-back">
            <a href="#top">Back to top</a>
        </div>
        <strong class="footer-follow-title">Follow us</strong>
        <div class="footer-socials" aria-label="Social media platforms">
            <a class="facebook" href="https://www.facebook.com" aria-label="Facebook">f</a>
            <a class="linkedin" href="https://www.linkedin.com" aria-label="LinkedIn">in</a>
            <a class="instagram" href="https://www.instagram.com" aria-label="Instagram">◎</a>
            <a class="youtube" href="https://www.youtube.com" aria-label="YouTube">▶</a>
        </div>
        <span class="footer-copy">© ${new Date().getFullYear()} Global NursePrep. Nursing education and licensing preparation.</span>
        <span class="powered-by">Powered by Teams Technology</span>
    `;
    siteFooter.dataset.rendered = 'true';
}

renderSiteFooter();
ensurePuriceButton();

window.addEventListener('load', () => {
    window.setTimeout(() => {
        loader?.classList.add('hidden');
    }, 450);
});

if (year) {
    year.textContent = new Date().getFullYear();
}

const isMobileNav = () => window.matchMedia('(max-width: 1100px)').matches;
const closeMobileNav = () => {
    siteNav?.classList.remove('open');
    document.querySelectorAll('.nav-dropdown.open').forEach((dropdown) => {
        dropdown.classList.remove('open');
    });
    navToggle?.setAttribute('aria-expanded', 'false');
};

navToggle?.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    if (!isOpen) {
        document.querySelectorAll('.nav-dropdown.open').forEach((dropdown) => {
            dropdown.classList.remove('open');
        });
    }
});

siteNav?.addEventListener('click', (event) => {
    const dropdownTrigger = event.target.closest('.dropdown-trigger');
    if (dropdownTrigger) {
        event.preventDefault();
        const dropdown = dropdownTrigger.closest('.nav-dropdown');
        const wasOpen = dropdown?.classList.contains('open');
        document.querySelectorAll('.nav-dropdown.open').forEach((item) => {
            if (item !== dropdown) {
                item.classList.remove('open');
                item.querySelector('.dropdown-trigger')?.setAttribute('aria-expanded', 'false');
            }
        });
        dropdown?.classList.toggle('open', !wasOpen);
        dropdownTrigger.setAttribute('aria-expanded', String(!wasOpen));
        return;
    }

    const link = event.target.closest('a');
    if (!link) return;
    closeMobileNav();
});

document.addEventListener('click', (event) => {
    if (event.target.closest('.nav-dropdown')) {
        return;
    }
    document.querySelectorAll('.nav-dropdown.open').forEach((dropdown) => {
        dropdown.classList.remove('open');
        dropdown.querySelector('.dropdown-trigger')?.setAttribute('aria-expanded', 'false');
    });
});

window.addEventListener('resize', () => {
    if (!isMobileNav()) {
        closeMobileNav();
    }
});

document.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        document.querySelectorAll('.tab-button').forEach((tab) => tab.classList.remove('active'));
        button.classList.add('active');

        document.querySelectorAll('.course-card').forEach((card) => {
            const shouldShow = filter === 'all' || card.dataset.category === filter;
            card.classList.toggle('hidden', !shouldShow);
        });
    });
});

document.querySelectorAll('.enroll-button').forEach((button) => {
    button.addEventListener('click', () => {
        const course = button.dataset.course || 'this course';
        if (modalCourse) {
            modalCourse.textContent = `You selected ${course}. Register or login first, then pay for this course to unlock videos, PDF notes, recorded lectures, quizzes, assignments, mock exams, practice MCQs, and downloads.`;
        }
        modal?.classList.add('open');
        modal?.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    });
});

function closeModal() {
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
}

modalClose?.addEventListener('click', closeModal);

modal?.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModal();
    }
});

document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = form.querySelector('input');
        if (input) {
            input.value = '';
            input.placeholder = 'Subscribed successfully';
        }
    });
});

chatButton?.addEventListener('click', () => {
    window.location.href = getPuricePath();
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => {
    revealObserver.observe(element);
});
