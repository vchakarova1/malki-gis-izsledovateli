export const ROLE_HOME = Object.freeze({
  student: 'student.html',
  teacher: 'teacher.html',
  admin: 'admin.html'
});

export const getRoleHome = (role) => ROLE_HOME[role] || 'profile.html';

export const getProfileForUser = async (supabase, userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, created_at, role')
    .eq('id', userId)
    .maybeSingle();

  return { profile: data, error };
};

export const getSignedInUser = async (supabase) => {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    return { session: data?.session || null, profile: null, error };
  }

  const { profile, error: profileError } = await getProfileForUser(supabase, data.session.user.id);
  return { session: data.session, profile, error: profileError };
};

export const redirectToRoleHome = (role) => {
  window.location.replace(getRoleHome(role));
};

export const requireRole = async (supabase, allowedRoles, onError) => {
  const { session, profile, error } = await getSignedInUser(supabase);

  if (error) {
    onError?.(error.message);
    return null;
  }

  if (!session) {
    window.location.replace('auth.html');
    return null;
  }

  if (!profile) {
    onError?.('Профилът още не е наличен. Опитай отново след малко.');
    return null;
  }

  if (!allowedRoles.includes(profile.role)) {
    redirectToRoleHome(profile.role);
    return null;
  }

  return { session, profile };
};
