(function () {
  function redirectToLogin() {
    const next = encodeURIComponent('app.html' + window.location.search + window.location.hash);
    window.location.replace('entrar.html?next=' + next);
  }

  async function boot() {
    if (!window.audiaAuth?.isConfigured()) return;
    const result = await window.audiaAuth.getSession();
    if (!result.data.session) {
      redirectToLogin();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
