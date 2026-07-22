// Menu overlay: always-available About + Projects list + Contact.
// Gives recruiters the full substance in one click, without sailing the boat.
import { showProjectModal } from './modal.js';

// EDIT ME: your pitch. Keep it 2-3 sentences, in your own voice.
const ABOUT_TEXT = `I'm Joaquin Bonifacino, an AI/ML Engineer who takes agentic LLM and RAG systems from prototype to production, for clients across the US, the EU, and Latin America, some serving thousands of users. I've led a research lab turning ideas into POCs and spikes, and I was the firefighter teams called in to rescue projects that were on fire. But what really sets me apart is the rare mix of building and communicating: I've delivered 15+ AI workshops, from 9-hour technical deep-dives for engineers to strategy sessions for executives and business owners, and I teach Applied AI at ORT University. I care about AI that's auditable, cost-aware, and that actually holds up in production.`;

// EDIT ME: social proof. Set to '' to hide the quote.
const QUOTE_TEXT = `The perfect mix of a marketer who can sell and an engineer who knows AI.`;
const QUOTE_SOURCE = `former CTO`;

// EDIT ME: speaking & teaching. Drop a photo/flyer in the repo named like TALK_IMAGE to show it (set to '' to hide).
const TALK_IMAGE = './talk.jpg';
const TALKS = [
    {
        title: 'Long-Running Context Agents: Understanding Harnesses',
        meta: 'Public talk · Agentic AI Uruguay · Co-Work Latam, Montevideo · May 2026'
    },
    {
        title: 'AI training & workshops, delivered as a professional service',
        meta: 'Promtior · 15+ sessions, from 9-hour technical deep-dives for engineering teams to strategy talks for managers and business owners'
    },
    {
        title: 'Applied Technologies II: Tools for AI',
        meta: 'Course instructor · ORT University, Montevideo'
    }
];

const CONTACT = {
    linkedin: 'https://linkedin.com/in/joaquin-bonifacino',
    githubWork: 'https://github.com/jabr7-zyte',
    githubPersonal: 'https://github.com/jabr7',
    email: 'joaquinbonifacino7@gmail.com',
    resume: "./Joaquin Bonifacino's Resume.pdf"
};

export function showMenu(buoyContent) {
    if (document.getElementById('menu-modal')) return;

    // Analytics: menu overlay opened
    if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: 'menu-open', title: 'Menu overlay', event: true });
    }

    // Group projects into sections for the overlay (independent of the 3D buoy layout).
    // Hooks live on each project in buoyContent (p.hook), so the list stays single-source.
    const SECTIONS = [
        { label: 'Flagship', titles: ['LLMNL', 'Financial Companion'] },
        { label: 'Client work', note: 'anonymized under NDA', titles: [
            'The 4-Minute Manual',
            'Ecuador Legal RAG',
            'Fleet Copilot',
            'Workshop ERP'
        ] },
        { label: 'Founder', titles: ['Ponus'] },
        { label: 'Lab / weekend experiments', titles: ['CharruaDevs', 'Gaussian Splatting'] }
    ];

    // Flat, section-ordered list backing the click handlers by data-index.
    const byTitle = (t) => buoyContent.find((p) => p.title === t);
    const displayList = [];

    const modal = document.createElement('div');
    modal.id = 'menu-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.88);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        touch-action: pan-y;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: rgba(12, 12, 14, 0.86);
        border-radius: 14px;
        padding: 30px;
        box-sizing: border-box;
        max-width: 760px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        touch-action: pan-y;
        border: 1px solid rgba(255,255,255,0.14);
        box-shadow: 0 30px 80px rgba(0,0,0,0.65);
        position: relative;
        color: #fff;
        margin: 20px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    `;

    const projectRow = (p, i) => `
        <button class="menu-project" data-index="${i}" style="
            display: flex; align-items: center; gap: 12px; width: 100%; box-sizing: border-box; text-align: left; cursor: pointer;
            background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.10);
            border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; color: inherit;
            font-family: inherit; transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
        ">
            <span style="flex: 1; min-width: 0;">
                <span style="display:block; font-weight:600; font-size:1.02em; color:rgba(255,255,255,0.92); margin-bottom:3px;">${p.title}</span>
                ${p.hook ? `<span style="display:block; font-size:0.9em; color:rgba(255,255,255,0.74); margin-bottom:3px;">${p.hook}</span>` : ''}
                <span style="display:block; font-size:0.82em; color:rgba(255,255,255,0.5);">${p.timeline}</span>
            </span>
            <span class="menu-project-chevron" aria-hidden="true" style="flex-shrink:0; color:rgba(255,255,255,0.4); font-size:1.5em; line-height:1; transition: transform 160ms ease, color 160ms ease;">›</span>
        </button>
    `;

    const projectRows = SECTIONS.map((section) => {
        const rows = section.titles
            .map(byTitle)
            .filter(Boolean)
            .map((p) => {
                displayList.push(p);
                return projectRow(p, displayList.length - 1);
            })
            .join('');
        if (!rows) return '';
        return `
            <div style="display: flex; align-items: baseline; gap: 8px; margin: 4px 0 10px;">
                <span style="font-size: 0.78em; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6); font-weight: 600;">${section.label}</span>
                ${section.note ? `<span style="font-size: 0.72em; color: rgba(255,255,255,0.4); font-style: italic;">${section.note}</span>` : ''}
            </div>
            <div style="margin-bottom: 16px;">${rows}</div>
        `;
    }).join('');

    content.innerHTML = `
        <div style="margin-bottom: 18px;">
            <h1 style="color: rgba(255,255,255,0.92); margin: 0 0 4px; font-size: 2.0em; font-weight: 650; font-family: 'Fraunces', ui-serif, Georgia, serif; letter-spacing: 0.01em;">Joaquin Bonifacino</h1>
            <div style="font-size: 11px; color: rgba(255,255,255,0.62); letter-spacing: 0.12em; text-transform: uppercase;">AI / ML Engineer</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 5px;">Remote · based in Montevideo, Uruguay</div>
        </div>

        <p style="color: rgba(255,255,255,0.78); line-height: 1.7; font-size: 1.02em; margin: 0 0 18px;">${ABOUT_TEXT}</p>

        ${QUOTE_TEXT ? `<blockquote style="margin: 0 0 22px; padding: 14px 18px; border-left: 2px solid rgba(255,255,255,0.22); background: rgba(255,255,255,0.03); border-radius: 0 10px 10px 0;">
            <p style="margin: 0 0 6px; font-family: 'Fraunces', ui-serif, Georgia, serif; font-style: italic; font-size: 1.08em; color: rgba(255,255,255,0.9); line-height: 1.5;">&ldquo;${QUOTE_TEXT}&rdquo;</p>
            <cite style="font-style: normal; font-size: 0.78em; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.5);">&mdash; ${QUOTE_SOURCE}</cite>
        </blockquote>` : ''}

        <div style="color: rgba(255,255,255,0.68); font-size: 0.82em; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 12px;">Speaking &amp; teaching</div>
        ${TALK_IMAGE ? `<img src="${TALK_IMAGE}" alt="Joaquin Bonifacino presenting at Agentic AI Uruguay" onerror="this.style.display='none'" style="width: 100%; border-radius: 12px; border: 1px solid rgba(255,255,255,0.10); margin-bottom: 12px; display: block;">` : ''}
        <div style="margin-bottom: 22px;">
            ${TALKS.map(t => `
                <div style="border-left: 2px solid rgba(255,255,255,0.16); padding: 2px 0 2px 14px; margin-bottom: 14px;">
                    <span style="display: block; font-weight: 600; color: rgba(255,255,255,0.92); margin-bottom: 3px;">${t.title}</span>
                    <span style="display: block; font-size: 0.84em; color: rgba(255,255,255,0.58);">${t.meta}</span>
                </div>
            `).join('')}
        </div>

        <div style="color: rgba(255,255,255,0.68); font-size: 0.82em; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 12px;">Projects</div>
        <div style="margin-bottom: 22px;">${projectRows}</div>

        <div style="color: rgba(255,255,255,0.68); font-size: 0.82em; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 12px;">Get in touch</div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 8px;">
            <a href="mailto:${CONTACT.email}" style="
                background: rgba(255,255,255,0.92); color: rgba(0,0,0,0.92); text-decoration: none;
                padding: 10px 18px; border-radius: 999px; font-size: 13px; font-weight: 600;
            ">Email me</a>
            <a href="${CONTACT.resume}" download="Joaquin_Bonifacino_Resume.pdf" style="
                background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.86); text-decoration: none;
                padding: 10px 18px; border-radius: 999px; font-size: 13px; font-weight: 500; border: 1px solid rgba(255,255,255,0.14);
            ">Resume</a>
            <a href="${CONTACT.linkedin}" target="_blank" rel="noopener" style="color: rgba(255,255,255,0.72); text-decoration: none; font-size: 13px; padding: 10px 6px;">LinkedIn</a>
            <a href="${CONTACT.githubWork}" target="_blank" rel="noopener" style="color: rgba(255,255,255,0.72); text-decoration: none; font-size: 13px; padding: 10px 6px;">GitHub (Work)</a>
            <a href="${CONTACT.githubPersonal}" target="_blank" rel="noopener" style="color: rgba(255,255,255,0.72); text-decoration: none; font-size: 13px; padding: 10px 6px;">GitHub (Personal)</a>
        </div>

        <div style="text-align: center; margin-top: 22px;">
            <button id="menu-close-btn" style="
                background: transparent; color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.14);
                padding: 10px 18px; border-radius: 999px; cursor: pointer; font-size: 12px; font-weight: 500;
                min-width: 120px; min-height: 42px; -webkit-tap-highlight-color: transparent;
            ">Back to the ocean</button>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    const close = () => {
        modal.remove();
        document.removeEventListener('keydown', escapeHandler);
    };

    content.querySelectorAll('.menu-project').forEach(btn => {
        const chevron = btn.querySelector('.menu-project-chevron');
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(255,255,255,0.08)';
            btn.style.borderColor = 'rgba(255,255,255,0.22)';
            if (chevron) { chevron.style.transform = 'translateX(3px)'; chevron.style.color = 'rgba(255,255,255,0.8)'; }
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(255,255,255,0.04)';
            btn.style.borderColor = 'rgba(255,255,255,0.10)';
            if (chevron) { chevron.style.transform = 'translateX(0)'; chevron.style.color = 'rgba(255,255,255,0.4)'; }
        });
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            close();
            // Reopen this menu when the project modal is closed, so the user
            // returns here instead of dropping all the way back to the ocean.
            showProjectModal(displayList[idx], () => showMenu(buoyContent));
        });
    });

    content.querySelector('#menu-close-btn').onclick = close;

    modal.onclick = (e) => { if (e.target === modal) close(); };

    const escapeHandler = (e) => {
        if (e.code === 'Escape') {
            close();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}
