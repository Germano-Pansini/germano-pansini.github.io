// ============================
// Theme management (FIXED)
// ============================
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('theme');
    if (this.theme !== 'dark' && this.theme !== 'light') this.theme = 'light';
    this.init();
  }

  init() {
    this.applyTheme(this.theme);

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
      this.updateAriaLabel(themeToggle, this.theme);
    }
  }

  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) this.updateAriaLabel(themeToggle, theme);

    // IMPORTANT: niente display=block/none via JS sulle icone.
    // La visibilità la gestisce il CSS con [data-theme="..."].
  }

  updateAriaLabel(btn, theme) {
    btn.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
    );
  }

  toggleTheme() {
    const next = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(next);
  }
}

// ============================
// Mobile navigation management
// ============================
class MobileNavigation {
  constructor() {
    this.menuOpen = false;
    this.init();
  }

  init() {
    const mobileButton = document.getElementById('toggle-navigation-menu');
    const header = document.getElementById('main-header');

    if (mobileButton && header) {
      mobileButton.addEventListener('click', () => this.toggleMenu(header, mobileButton));
    }

    // Close menu on link click (mobile)
    const navLinks = document.querySelectorAll('#navigation-menu a');
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (this.menuOpen && header && mobileButton) this.toggleMenu(header, mobileButton);
      });
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.menuOpen && header && mobileButton) {
        this.toggleMenu(header, mobileButton);
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.menuOpen) return;
      if (e.target.closest('#main-header')) return;
      if (header && mobileButton) this.toggleMenu(header, mobileButton);
    });
  }

  toggleMenu(header, button) {
    this.menuOpen = !this.menuOpen;

    if (this.menuOpen) {
      header.classList.add('menu-open');
      document.body.classList.add('menu-open');
      document.body.style.overflow = 'hidden';
    } else {
      header.classList.remove('menu-open');
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
    }

    button.setAttribute('aria-expanded', String(this.menuOpen));
  }
}

// ============================
// Smooth scrolling
// ============================
class SmoothScroll {
  constructor() {
    this.init();
  }

  init() {
    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        const header = document.getElementById('main-header');
        const headerH = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
        const extra = 8;

        const y =
          target.getBoundingClientRect().top +
          window.pageYOffset -
          (headerH + extra);

        window.scrollTo({ top: y, behavior: 'smooth' });
        history.pushState(null, '', targetId);

        const id = targetId.slice(1);
        if (window.navigationHighlightInstance) {
          window.navigationHighlightInstance.highlightNavLink(id);
        }
      });
    });
  }
}

// ============================
// Navigation highlight (hash-only)
// ============================
class NavigationHighlight {
  constructor() {
    this.navLinks = [];
    this.init();
  }

  init() {
    this.navLinks = document.querySelectorAll('#navigation-menu a[href^="#"]');
    this.setInitialActiveState();

    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  setInitialActiveState() {
    const hash = window.location.hash;
    if (hash && hash !== '#') this.highlightNavLink(hash.substring(1));
  }

  handleHashChange() {
    const hash = window.location.hash;
    if (hash && hash !== '#') this.highlightNavLink(hash.substring(1));
    else this.clearAllActiveStates();
  }

  highlightNavLink(activeId) {
    this.navLinks.forEach((a) => {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
    });

    const active = document.querySelector(`#navigation-menu a[href="#${activeId}"]`);
    if (active) {
      active.classList.add('active');
      active.setAttribute('aria-current', 'page');
    }
  }

  clearAllActiveStates() {
    this.navLinks.forEach((a) => {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
    });
  }
}

// ============================
// Markdown content loader (FIXED)
// ============================
class MarkdownLoader {
  constructor() {
    // usa solo quelle che hai davvero
    this.sections = ['about', 'publications', 'resume'];
    this.init();
  }

  init() {
    this.sections.forEach((section) => this.loadMarkdown(section));
  }

  async loadMarkdown(section) {
    const el = document.getElementById(`${section}-content`);
    if (!el) return;

    const paths = [`./${section}.md`, `${section}.md`, `/${section}.md`];
    let lastError = null;

    for (const path of paths) {
      try {
        const res = await fetch(path, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const md = await res.text();
        el.innerHTML = this.parseMarkdown(md);
        return;
      } catch (err) {
        lastError = err;
      }
    }

    el.innerHTML = `<p style="opacity:.6">Unable to load ${section}. (${lastError?.message || 'error'})</p>`;
  }

  parseMarkdown(markdown) {
    let html = markdown;

    // Headers
    html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.*)$/gm, '<h2 class="title">$1</h2>');
    html = html.replace(/^#\s+(.*)$/gm, '<h1 class="title">$1</h1>');

    // Bold/italic (semplice)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(^|[^*])\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, '$1<em>$2</em>');

    // Link markdown [text](url)
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" class="cactus-link" target="_blank" rel="noopener">$1</a>'
    );

    // DOI auto-link
    html = html.replace(
      /(https?:\/\/doi\.org\/[^\s)]+)/g,
      '<a href="$1" class="cactus-link" target="_blank" rel="noopener">$1</a>'
    );

    // Lists: costruzione corretta di UL per blocchi consecutivi di "- "
    // 1) marca le righe lista
    html = html.replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>');
    // 2) raggruppa blocchi contigui di <li> in <ul>...</ul>
    html = html.replace(/(?:<li>[\s\S]*?<\/li>\s*)+/g, (m) => `<ul>${m}</ul>`);

    // Horizontal rule
    html = html.replace(/^\s*---\s*$/gm, '<hr>');

    // Paragraphs:
    // - NON wrappare blocchi che contengono già tag block (<div>, <ul>, <h1..>, <hr>, ecc.)
    const blocks = html.split(/\n\s*\n/);
    html = blocks
      .map((b) => {
        const p = b.trim();
        if (!p) return '';

        const startsWithTag = /^<(h1|h2|h3|h4|h5|h6|div|ul|ol|li|hr|blockquote|table|pre|code)\b/i.test(p);
        if (startsWithTag) return p;

        // se contiene un block tag da qualche parte, non wrappare
        const containsBlockTag = /<(div|ul|ol|hr|blockquote|table|pre)\b/i.test(p);
        if (containsBlockTag) return p;

        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
      })
      .join('\n');

    return html;
  }
}

// ============================
// Init
// ============================
document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
  new MobileNavigation();
  new SmoothScroll();
  window.navigationHighlightInstance = new NavigationHighlight();
  new MarkdownLoader();

  document.body.classList.add('loaded');
});
