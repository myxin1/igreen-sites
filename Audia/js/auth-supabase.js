(function () {
  let client = null;

  function getConfig() {
    return window.AUDIA_SUPABASE || {};
  }

  function isConfigured() {
    const config = getConfig();
    return Boolean(
      window.supabase &&
      typeof window.supabase.createClient === 'function' &&
      config.url &&
      config.anonKey
    );
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (client) return client;

    const config = getConfig();
    client = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    return client;
  }

  async function signUp({ displayName, email, password }) {
    const supabase = getClient();
    if (!supabase) throw new Error('Supabase não configurado.');

    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
        emailRedirectTo: getConfig().redirectTo || window.location.origin + '/entrar.html',
      },
    });
  }

  async function signIn({ email, password }) {
    const supabase = getClient();
    if (!supabase) throw new Error('Supabase não configurado.');

    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signInWithGoogle() {
    const supabase = getClient();
    if (!supabase) throw new Error('Supabase não configurado.');

    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getConfig().redirectTo || window.location.origin + '/entrar.html',
      },
    });
  }

  async function signOut() {
    const supabase = getClient();
    if (!supabase) return { error: null };
    return supabase.auth.signOut();
  }

  async function getSession() {
    const supabase = getClient();
    if (!supabase) return { data: { session: null }, error: null };
    return supabase.auth.getSession();
  }

  async function getUserPlan() {
    const supabase = getClient();
    if (!supabase) return null;

    const sessionResult = await supabase.auth.getSession();
    const userId = sessionResult.data.session?.user?.id;
    if (!userId) return null;

    const { data, error } = await supabase
      .from('user_entitlements')
      .select('plan,premium_until')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  }

  window.audiaAuth = {
    isConfigured,
    getClient,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    getSession,
    getUserPlan,
  };
})();
