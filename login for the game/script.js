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
          const user = data.user;
          if (user) {
            // Create initial user_stats
            const { error: statsError } = await supabaseClient.from('user_stats').insert([
              { user_id: user.id }
            ]);

            if (statsError) {
              console.error('⚠️ Failed to create user_stats:', statsError.message);
            } else {
              console.log('✅ user_stats created successfully!');
            }
          }

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

  // Fetch user stats from Supabase
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
      document.getElementById('high-score').innerText = data.high_score_easy || 0;
      document.getElementById('time-easy').innerText = formatTime(data.fastest_time_easy);
      document.getElementById('time-medium').innerText = formatTime(data.fastest_time_medium);
      document.getElementById('time-hard').innerText = formatTime(data.fastest_time_hard);
    } catch (error) {
      console.error('Error fetching user stats:', error.message);
    }
  }

  // Save user stats to Supabase
  async function saveStatsToSupabase(score, difficulty, time) {
    console.log('saveStatsToSupabase triggered', score, difficulty, time); // Log the values here
  
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getUser();
  
    if (sessionError || !sessionData?.user) {
      console.error('User not logged in or error getting user:', sessionError?.message);
      return;
    }
  
    const userId = sessionData.user.id;
  
    // Fetch existing user stats
    const { data: existing, error: fetchError } = await supabaseClient
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
  
    console.log('Existing stats:', existing); // Log existing stats
  
    let updates = {
      user_id: userId,
      total_score: score,
      current_difficulty: difficulty,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  
    // Update the highest score based on difficulty
    const highScoreKey = {
      easy: 'high_score_easy',
      medium: 'high_score_medium',
      hard: 'high_score_hard',
    }[difficulty];
  
    if (highScoreKey) {
      updates[highScoreKey] = Math.max(existing ? existing[highScoreKey] : 0, score);
    }
  
    // Update fastest time if it's better than the existing time
    const fastestTimeKey = {
      easy: 'fastest_time_easy',
      medium: 'fastest_time_medium',
      hard: 'fastest_time_hard',
    }[difficulty];
  
    if (fastestTimeKey && (existing[fastestTimeKey] === null || time < existing[fastestTimeKey])) {
      updates[fastestTimeKey] = time;
    }
  
    // If there are existing stats, update total_score and check for high score
    if (existing) {
      updates.total_score = (existing.total_score || 0) + score;
  
      // Update level and quests_completed if necessary
      updates.current_level = existing.current_level + 1; // For example, increase level by 1 with each game played
      updates.quests_completed = existing.quests_completed + 1; // Increment quests_completed if applicable
  
      console.log('Updating existing stats:', existing); // Log the updates
    }
  
    // Log what we are about to upsert
    console.log('Upsert data:', updates);
  
    const { error: upsertError } = await supabaseClient
      .from('user_stats')
      .upsert(updates, { onConflict: 'user_id' });
  
    if (upsertError) {
      console.error('Failed to save stats:', upsertError.message);
    } else {
      console.log('✅ Stats saved successfully.');
    }
  }
  
  // Format time for display
  function formatTime(time) {
    if (!time) return '--:--';
    return time;
  }

  // Logout functionality
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
