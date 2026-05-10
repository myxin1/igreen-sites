(function () {
  const AUTH_VARIANT_KEY = 'audia_auth_variant';
  const VALID_AUTH_VARIANTS = ['site', 'studio'];
  const AUTH_COPY = {
    signin: {
      site: {
        'hero-kicker': 'Retome seu equilibrio',
        'hero-brand': 'Audia',
        'hero-title': 'Entre e volte para as sessoes que fazem bem para voce.',
        'hero-text': 'A sua conta guarda o que importa no dia a dia: favoritos, historico, progresso e recomendacoes para foco, sono, relaxamento e clareza mental.',
        'hero-point-1': 'Continue de onde parou com seu historico e suas praticas favoritas',
        'hero-point-2': 'Receba sugestoes mais alinhadas ao seu momento e aos seus objetivos',
        'hero-point-3': 'Acompanhe sua evolucao pessoal sem misturar dados de outras contas',
        'panel-title': 'Entrar',
        'panel-text': 'Acesse seu espaco no Audia para cuidar da mente com mais constancia, leveza e praticidade.',
        'divider-text': 'ou entre com seu email',
        'link-primary': 'Esqueci minha senha',
        'link-secondary': 'Dicas de acesso e privacidade',
        'link-secondary-href': 'politica-de-privacidade.html',
        'submit-text': 'Entrar no Audia',
        'security-note': 'Dica: ao entrar, voce recupera suas preferencias, seu progresso e suas sessoes favoritas no mesmo lugar.',
        'config-note': 'Beneficios da sua conta: historico salvo, trilhas personalizadas, favoritos sincronizados e uma experiencia mais consistente ao longo do tempo.',
        'footer-note': 'Ainda nao tem conta? <a href="cadastro.html">Criar cadastro</a>',
      },
      studio: {
        'hero-kicker': 'Acesso protegido',
        'hero-brand': 'Audia Identity',
        'hero-title': 'Volte para a sua propria area.',
        'hero-text': 'Cada conta enxerga apenas os proprios dados, sessoes favoritas, progresso e plano. A separacao acontece no banco com RLS.',
        'hero-point-1': 'Autenticacao com email/senha ou Google',
        'hero-point-2': 'Sessao persistente com token seguro',
        'hero-point-3': 'Isolamento por usuario no Postgres',
        'panel-title': 'Entrar',
        'panel-text': 'Acesse sua conta para abrir o app, seu plano e seus dados pessoais.',
        'divider-text': 'ou use seu email',
        'link-primary': 'Esqueci minha senha',
        'link-secondary': 'Ver guia de seguranca',
        'link-secondary-href': 'AUTH-SUPABASE-SETUP.md',
        'submit-text': 'Entrar com seguranca',
        'security-note': 'Nunca coloque a <code>service_role</code> no frontend. O acesso seguro depende da <code>anon key</code> mais as politicas RLS do banco.',
        'config-note': 'Se o login ainda nao responder, preencha primeiro <a class="auth-link" href="AUTH-SUPABASE-SETUP.md">o guia de configuracao</a> e o arquivo <code>js/supabase-config.js</code>.',
        'footer-note': 'Ainda nao tem conta? <a href="cadastro.html">Criar cadastro</a>',
      },
    },
    signup: {
      site: {
        'hero-kicker': 'Comece com calma',
        'hero-brand': 'Audia',
        'hero-title': 'Crie sua conta e monte um espaco mental so seu.',
        'hero-text': 'Com a sua conta, o Audia pode lembrar do que funciona melhor para voce e organizar praticas de foco, descanso, relaxamento e bem-estar de forma personalizada.',
        'hero-point-1': 'Salve favoritos e construa sua propria rotina com mais consistencia',
        'hero-point-2': 'Tenha uma experiencia personalizada conforme sua fase e seus objetivos',
        'hero-point-3': 'Comece gratis e evolua depois, sem perder historico nem preferencias',
        'panel-title': 'Criar cadastro',
        'panel-text': 'Entre no Audia para receber beneficios como progresso salvo, favoritos e uma area pessoal feita para voce.',
        'divider-text': 'ou cadastre com email e senha',
        'submit-text': 'Criar minha conta',
        'security-note': 'Beneficio da conta: seu progresso, suas preferencias e suas sessoes favoritas ficam salvos para voce continuar quando quiser.',
        'config-note': 'Dica: use um email que voce acessa com facilidade para recuperar sua conta, confirmar cadastro e manter sua rotina sempre a mao.',
        'footer-note': 'Ja tem conta? <a href="entrar.html">Entrar agora</a>',
      },
      studio: {
        'hero-kicker': 'Cadastro inteligente',
        'hero-brand': 'Audia Access Layer',
        'hero-title': 'Sua conta nasce com estrutura segura.',
        'hero-text': 'Cadastro com plano inicial free, perfil isolado por usuario e base pronta para upgrade premium sem permitir autopromocao no frontend.',
        'hero-point-1': 'Perfil e plano em tabelas separadas',
        'hero-point-2': 'Upgrade premium so por backend/webhook',
        'hero-point-3': 'Cada consulta filtrada por auth.uid()',
        'panel-title': 'Criar cadastro',
        'panel-text': 'Comece no plano gratis e conecte depois premium com seguranca, sem expor contas de terceiros.',
        'divider-text': 'ou use email e senha',
        'submit-text': 'Criar conta segura',
        'security-note': 'Plano inicial: <code>free</code>. O status <code>premium</code> deve ser alterado apenas por backend, Edge Function ou webhook de pagamento.',
        'config-note': 'Se estiver configurando a base agora, siga o guia do Supabase e mantenha as permissoes fechadas por usuario desde o inicio.',
        'footer-note': 'Ja tem conta? <a href="entrar.html">Entrar agora</a>',
      },
    },
  };

  function normalizeAuthVariant(variant) {
    return VALID_AUTH_VARIANTS.includes(variant) ? variant : 'site';
  }

  function applyAuthVariant(variant) {
    const next = normalizeAuthVariant(variant);
    document.body.dataset.authVariant = next;
    localStorage.setItem(AUTH_VARIANT_KEY, next);
    applyAuthCopy(next);
    return next;
  }

  function initAuthVariant() {
    return applyAuthVariant(localStorage.getItem(AUTH_VARIANT_KEY) || document.body.dataset.authVariant || 'site');
  }

  function applyAuthCopy(variant) {
    const page = document.body.dataset.authPage;
    const pageCopy = AUTH_COPY[page];
    const variantCopy = pageCopy?.[variant] || pageCopy?.site;
    if (!variantCopy) return;

    document.querySelectorAll('[data-auth-copy]').forEach((node) => {
      const key = node.dataset.authCopy;
      const value = variantCopy[key];
      if (typeof value !== 'string') return;

      if (node.dataset.authCopyMode === 'html') {
        node.innerHTML = value;
        return;
      }

      node.textContent = value;
    });

    document.querySelectorAll('[data-auth-copy-href]').forEach((node) => {
      const key = node.dataset.authCopyHref;
      const value = variantCopy[key];
      if (typeof value === 'string') {
        node.setAttribute('href', value);
      }
    });
  }

  function showFeedback(root, type, message) {
    const box = root.querySelector('[data-auth-feedback]');
    if (!box) return;
    box.className = 'auth-feedback is-visible is-' + type;
    box.textContent = message;
  }

  function clearFeedback(root) {
    const box = root.querySelector('[data-auth-feedback]');
    if (!box) return;
    box.className = 'auth-feedback';
    box.textContent = '';
  }

  function setLoading(button, loading) {
    if (!button) return;
    button.disabled = loading;
    button.dataset.loading = loading ? 'true' : 'false';
  }

  function setupPasswordToggles(root) {
    root.querySelectorAll('[data-password-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const input = root.querySelector('#' + button.dataset.passwordToggle);
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
        button.classList.toggle('is-open', input.type === 'text');
      });
    });
  }

  function validatePassword(password) {
    return typeof password === 'string' && password.length >= 8;
  }

  function nextPath() {
    const url = new URL(window.location.href);
    return url.searchParams.get('next') || 'app.html';
  }

  async function handleSignIn(form) {
    const email = form.querySelector('[name="email"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    const submit = form.querySelector('[type="submit"]');

    clearFeedback(form);

    if (!window.audiaAuth?.isConfigured()) {
      showFeedback(form, 'info', 'Configure o arquivo js/supabase-config.js com a URL e a anon key do Supabase para ativar o login.');
      return;
    }

    setLoading(submit, true);
    const result = await window.audiaAuth.signIn({ email, password });
    setLoading(submit, false);

    if (result.error) {
      showFeedback(form, 'error', result.error.message || 'Não foi possível entrar agora.');
      return;
    }

    showFeedback(form, 'success', 'Login realizado com segurança. Redirecionando...');
    window.setTimeout(() => {
      window.location.href = nextPath();
    }, 700);
  }

  async function handleSignUp(form) {
    const displayName = form.querySelector('[name="display_name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    const confirm = form.querySelector('[name="confirm_password"]').value;
    const accepted = form.querySelector('[name="terms"]').checked;
    const submit = form.querySelector('[type="submit"]');

    clearFeedback(form);

    if (!displayName) {
      showFeedback(form, 'error', 'Informe como você quer aparecer na sua conta.');
      return;
    }

    if (!validatePassword(password)) {
      showFeedback(form, 'error', 'Use uma senha com pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirm) {
      showFeedback(form, 'error', 'A confirmação de senha não confere.');
      return;
    }

    if (!accepted) {
      showFeedback(form, 'error', 'Você precisa concordar com os termos para criar a conta.');
      return;
    }

    if (!window.audiaAuth?.isConfigured()) {
      showFeedback(form, 'info', 'Configure o arquivo js/supabase-config.js com a URL e a anon key do Supabase para ativar o cadastro.');
      return;
    }

    setLoading(submit, true);
    const result = await window.audiaAuth.signUp({ displayName, email, password });
    setLoading(submit, false);

    if (result.error) {
      showFeedback(form, 'error', result.error.message || 'Não foi possível criar a conta agora.');
      return;
    }

    const needsConfirmation = !result.data.session;
    showFeedback(
      form,
      'success',
      needsConfirmation
        ? 'Conta criada. Verifique seu email para confirmar o cadastro antes de entrar.'
        : 'Conta criada com sucesso. Redirecionando para sua área...'
    );

    if (!needsConfirmation) {
      window.setTimeout(() => {
        window.location.href = nextPath();
      }, 700);
    }
  }

  async function handleGoogle(button, root) {
    clearFeedback(root);

    if (!window.audiaAuth?.isConfigured()) {
      showFeedback(root, 'info', 'Configure o arquivo js/supabase-config.js antes de ativar o login com Google.');
      return;
    }

    const result = await window.audiaAuth.signInWithGoogle();
    if (result.error) {
      showFeedback(root, 'error', result.error.message || 'Não foi possível iniciar o Google Login.');
    }
  }

  async function redirectIfLoggedIn() {
    if (!window.audiaAuth?.isConfigured()) return;
    const result = await window.audiaAuth.getSession();
    if (result.data.session && document.body.dataset.authGuestOnly === 'true') {
      window.location.href = nextPath();
    }
  }

  function setupAuthForms() {
    document.querySelectorAll('[data-auth-form]').forEach((form) => {
      setupPasswordToggles(form);
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (form.dataset.authForm === 'signin') await handleSignIn(form);
        if (form.dataset.authForm === 'signup') await handleSignUp(form);
      });

      const google = form.querySelector('[data-google-login]');
      if (google) {
        google.addEventListener('click', () => handleGoogle(google, form));
      }
    });
  }

  function animateAuthMap() {
    document.querySelectorAll('[data-auth-map]').forEach((canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = 0;
      let height = 0;
      let animationFrame = 0;
      let startTime = Date.now();

      const routes = [
        { start: { x: 0.16, y: 0.26, delay: 0 }, end: { x: 0.34, y: 0.16, delay: 2 }, tone: 'strong' },
        { start: { x: 0.34, y: 0.16, delay: 2 }, end: { x: 0.5, y: 0.26, delay: 4 }, tone: 'strong' },
        { start: { x: 0.08, y: 0.12, delay: 1 }, end: { x: 0.28, y: 0.38, delay: 3 }, tone: 'soft' },
        { start: { x: 0.66, y: 0.12, delay: 0.5 }, end: { x: 0.46, y: 0.38, delay: 2.5 }, tone: 'accent' },
      ];

      const dots = [];

      function getMapPalette() {
        if (document.body.dataset.authVariant === 'site') {
          return {
            strong: '#d97757',
            soft: '#efb18f',
            accent: '#f7cfbe',
            moving: '#ffd8c7',
            glow: 'rgba(217,119,87,0.26)',
            dotPrefix: 'rgba(255,239,231,',
          };
        }

        return {
          strong: '#5aa4ff',
          soft: '#7dd3fc',
          accent: '#c084fc',
          moving: '#8cc1ff',
          glow: 'rgba(140,193,255,0.24)',
          dotPrefix: 'rgba(255,255,255,',
        };
      }

      function generateDots() {
        dots.length = 0;
        const gap = 14;
        for (let x = 0; x < width; x += gap) {
          for (let y = 0; y < height; y += gap) {
            const inShape =
              ((x < width * 0.26 && x > width * 0.06) && (y < height * 0.42 && y > height * 0.08)) ||
              ((x < width * 0.24 && x > width * 0.14) && (y < height * 0.82 && y > height * 0.42)) ||
              ((x < width * 0.46 && x > width * 0.3) && (y < height * 0.36 && y > height * 0.14)) ||
              ((x < width * 0.5 && x > width * 0.34) && (y < height * 0.66 && y > height * 0.36)) ||
              ((x < width * 0.74 && x > width * 0.46) && (y < height * 0.5 && y > height * 0.1)) ||
              ((x < width * 0.84 && x > width * 0.66) && (y < height * 0.82 && y > height * 0.62));

            if (inShape && Math.random() > 0.28) {
              dots.push({
                x,
                y,
                radius: 1.2,
                opacity: Math.random() * 0.42 + 0.08,
              });
            }
          }
        }
      }

      function resize() {
        const parent = canvas.parentElement;
        if (!parent) return;
        width = parent.clientWidth;
        height = parent.clientHeight;
        canvas.width = width;
        canvas.height = height;
        generateDots();
      }

      function drawDots() {
        const palette = getMapPalette();
        ctx.clearRect(0, 0, width, height);
        dots.forEach((dot) => {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
          ctx.fillStyle = palette.dotPrefix + dot.opacity + ')';
          ctx.fill();
        });
      }

      function drawRoutes() {
        const palette = getMapPalette();
        const currentTime = (Date.now() - startTime) / 1000;
        routes.forEach((route) => {
          const elapsed = currentTime - route.start.delay;
          if (elapsed <= 0) return;

          const duration = 3;
          const progress = Math.min(elapsed / duration, 1);
          const sx = route.start.x * width;
          const sy = route.start.y * height;
          const ex = route.end.x * width;
          const ey = route.end.y * height;
          const x = sx + (ex - sx) * progress;
          const y = sy + (ey - sy) * progress;
          const color = palette[route.tone] || palette.strong;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(x, y);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = palette.moving;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fillStyle = palette.glow;
          ctx.fill();
        });
      }

      function tick() {
        drawDots();
        drawRoutes();
        if ((Date.now() - startTime) / 1000 > 15) startTime = Date.now();
        animationFrame = requestAnimationFrame(tick);
      }

      resize();
      tick();
      window.addEventListener('resize', resize);
      canvas._cleanup = function () {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener('resize', resize);
      };
    });
  }

  function boot() {
    initAuthVariant();
    redirectIfLoggedIn();
    setupAuthForms();
    animateAuthMap();
  }

  window.audiaAuthView = {
    apply: applyAuthVariant,
    current: () => normalizeAuthVariant(localStorage.getItem(AUTH_VARIANT_KEY) || document.body.dataset.authVariant || 'site'),
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
