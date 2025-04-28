document.addEventListener('DOMContentLoaded', () => {
  const SUPABASE_URL = 'https://qbgosipqlkdvrtmodjyt.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZ29zaXBxbGtkdnJ0bW9kanl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MTI1NTgsImV4cCI6MjA2MDI4ODU1OH0.qqepqCubymb_hqP-976VVMVgSswqSohoWT0pZMyeyiU'; // Keep as is

  const { createClient } = supabase;
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Registration
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const username = document.getElementById('register-username').value;

      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: window.location.origin + '/dashboard.html',
          },
        });

        if (error) {
          alert('❌ Registration failed: ' + error.message);
        } else {
          alert('✅ Please check your email to confirm your account!');
        }
      } catch (error) {
        console.error('Registration error:', error.message);
        alert('❌ An unexpected error occurred during registration.');
      }
    });
  }

  // Login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          alert('❌ Login failed: ' + error.message);
        } else {
          window.location.href = 'dashboard.html';
        }
      } catch (error) {
        console.error('Login error:', error.message);
        alert('❌ An unexpected error occurred during login.');
      }
    });
  }

  // Dashboard - Show user info and stats
  const userEmail = document.getElementById('user-email');
  const userName = document.getElementById('user-name');

  if (userEmail && userName) {
    supabaseClient.auth.getUser().then(async ({ data, error }) => {
      const user = data?.user;

      if (!user) {
        window.location.href = 'index.html';
        return;
      }

      userEmail.textContent = `Logged in as: ${user.email}`;
      const username = user.user_metadata?.username || 'User';
      userName.textContent = username;

      await fetchUserStats(user.id);
    });
  }

  async function fetchUserStats(userId) {
    try {
      let { data, error } = await supabaseClient
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        const { error: insertError } = await supabaseClient.from('user_stats').insert({
          user_id: userId,
        });

        if (insertError) {
          console.error('Error inserting initial user_stats row:', insertError.message);
          return;
        }

        ({ data, error } = await supabaseClient
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single());
      }

      if (error) {
        console.warn('Error fetching stats:', error.message);
        return;
      }

      document.getElementById('total-score').innerText = data.total_score || 0;
      document.getElementById('high-score').innerText = data.high_score || 0;
      document.getElementById('time-easy').innerText = formatTime(data.fastest_time_easy);
      document.getElementById('time-medium').innerText = formatTime(data.fastest_time_medium);
      document.getElementById('time-hard').innerText = formatTime(data.fastest_time_hard);
    } catch (error) {
      console.error('Error fetching user stats:', error.message);
    }
  }

  async function saveStatsToSupabase(score, difficulty, time) {
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getUser();

    if (sessionError || !sessionData?.user) {
      console.error('User not logged in or error getting user:', sessionError?.message);
      return;
    }

    const userId = sessionData.user.id;

    const { data: existing, error: fetchError } = await supabaseClient
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    let updates = {
      user_id: userId,
      total_score: score,
      high_score: score,
      created_at: new Date().toISOString(),
    };

    const difficultyKey = {
      easy: 'fastest_time_easy',
      medium: 'fastest_time_medium',
      hard: 'fastest_time_hard',
    }[difficulty];

    if (difficultyKey) {
      updates[difficultyKey] = time;
    }

    if (existing) {
      updates.total_score = (existing.total_score || 0) + score;
      updates.high_score = Math.max(existing.high_score || 0, score);

      const existingTime = existing[difficultyKey];
      if (!existingTime || time < existingTime) {
        updates[difficultyKey] = time;
      } else {
        updates[difficultyKey] = existingTime;
      }
    }

    const { error: upsertError } = await supabaseClient
      .from('user_stats')
      .upsert(updates, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Failed to save stats:', upsertError.message);
    } else {
      console.log('✅ Stats saved successfully.');
    }
  }

  function formatTime(time) {
    if (!time) return '--:--';
    return time;
  }

  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
          console.error('Logout failed:', error.message);
          alert('❌ Logout failed: ' + error.message);
        } else {
          console.log("✅ Logged out successfully.");
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = 'index.html';
        }
      } catch (error) {
        console.error('Logout error:', error.message);
        alert('❌ An unexpected error occurred during logout.');
      }
    });
  }
});
