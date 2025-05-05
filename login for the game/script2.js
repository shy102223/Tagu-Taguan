const levelSelection = document.getElementById("level-selection");
const difficultyButtons = document.querySelectorAll(".difficulty-btn");

const infoBar = document.getElementById("info-bar");
const gameContainer = document.getElementById("game-container");
const messageContainer = document.getElementById("message-container");
const message = document.getElementById("message");
const nextButton = document.getElementById("next-button");
const retryButton = document.getElementById("retry-button");
const timerDisplay = document.getElementById("timer");
const scoreDisplay = document.getElementById("score");
const hiderIndicator = document.getElementById("hider-indicator");
const mainMenuButton = document.getElementById("main-menu-button"); // Make sure this is selected

let totalHiders = 1;
let foundHiders = 0;
let score = 0;
let timeLeft = 30;
let timer;
let currentLevel = 0;
let selectedDifficulty = "easy";

const difficultySettings = {
  easy: [
    { totalHiders: 1, opacity: 0.9, filter: "blur(1px)" },
    { totalHiders: 1, opacity: 0.8, filter: "blur(1px)" },
    { totalHiders: 1, opacity: 0.7, filter: "blur(1px)" },
    { totalHiders: 1, opacity: 0.6, filter: "blur(1px)" },
    { totalHiders: 1, opacity: 0.5, filter: "blur(2px)" },
    { totalHiders: 1, opacity: 0.5, filter: "blur(2px)" },
    { totalHiders: 1, opacity: 0.5, filter: "blur(2px)" },
    { totalHiders: 1, opacity: 0.5, filter: "blur(2px)" },
    { totalHiders: 1, opacity: 0.5, filter: "blur(2px)" },
    { totalHiders: 2, opacity: 0.5, filter: "blur(2px)" },
  ],
  medium: [
    { totalHiders: 3, opacity: 0.5, filter: "blur(3px)" },
    { totalHiders: 3, opacity: 0.5, filter: "blur(3px)" },
    { totalHiders: 3, opacity: 0.4, filter: "blur(3px)" },
    { totalHiders: 3, opacity: 0.3, filter: "blur(3px)" },
    { totalHiders: 3, opacity: 0.2, filter: "blur(3px)" },
    { totalHiders: 3, opacity: 0.2, filter: "blur(3px)" },
    { totalHiders: 3, opacity: 0.2, filter: "blur(3px)" },
    { totalHiders: 3, opacity: 0.2, filter: "blur(3px)" },
    { totalHiders: 3, opacity: 0.2, filter: "blur(3px)" },
    { totalHiders: 4, opacity: 0.2, filter: "blur(3px)" },
  ],
  hard: [
    { totalHiders: 5, opacity: 0.3, filter: "blur(3px)" },
    { totalHiders: 5, opacity: 0.2, filter: "blur(3px)" },
    { totalHiders: 5, opacity: 0.2, filter: "blur(3px)" },
    { totalHiders: 5, opacity: 0.2, filter: "blur(3px)" },
    { totalHiders: 5, opacity: 0.2, filter: "blur(3px)" },
    { totalHiders: 5, opacity: 0.2, filter: "blur(3px)" },
    { totalHiders: 5, opacity: 0.2, filter: "blur(3px)" },
    { totalHiders: 5, opacity: 0.2, filter: "blur(3px)" },
    { totalHiders: 5, opacity: 0.2, filter: "blur(3px)" },
    { totalHiders: 6, opacity: 0.2, filter: "blur(3px)" },
  ],
};

// Supabase client initialization
const SUPABASE_URL = 'https://qbgosipqlkdvrtmodjyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZ29zaXBxbGtkdnJ0bW9kanl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MTI1NTgsImV4cCI6MjA2MDI4ODU1OH0.qqepqCubymb_hqP-976VVMVgSswqSohoWT0pZMyeyiU'; // Replace with your real Supabase anon key
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Start the game after selecting difficulty
difficultyButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    selectedDifficulty = btn.dataset.difficulty;
    levelSelection.style.display = "none";
    document.getElementById("dashboard-button-container").style.display = "none"; // hide dashboard button
    infoBar.style.display = "flex";
    gameContainer.style.display = "block";
    currentLevel = 0;
    loadLevel(currentLevel);
  });
});

function startTimer() {
  clearInterval(timer);
  timeLeft = 30;
  timerDisplay.textContent = `Time: ${timeLeft}s`;

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `Time: ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      showGameOverMessage(false); // Show failure message if time runs out
    }
  }, 1000);
}

function loadLevel(levelIndex) {
  messageContainer.style.display = "none";
  foundHiders = 0;

  const settings = difficultySettings[selectedDifficulty][levelIndex];
  totalHiders = settings.totalHiders;

  // Update hider indicator
  hiderIndicator.textContent = `Hiders: ${totalHiders}`;

  // Update level indicator
  const levelDisplay = document.getElementById("level");
  levelDisplay.textContent = `Level: ${levelIndex + 1}`; // Display correct level number (1-based)

  startTimer();
  spawnHiders(totalHiders, settings);
}

// Function to get random position considering screen size
function getRandomPosition() {
  const containerWidth = gameContainer.offsetWidth;
  const containerHeight = gameContainer.offsetHeight;

  // Ensure the hider stays within the container
  const maxX = containerWidth - 60; // Assuming hider's width is 60px
  const maxY = containerHeight - 60; // Assuming hider's height is 60px

  const x = Math.floor(Math.random() * maxX);
  const y = Math.floor(Math.random() * maxY);

  return { top: y + "px", left: x + "px" };
}

function spawnHiders(numHiders, settings) {
  document.querySelectorAll('.hider').forEach((el) => el.remove());

  for (let i = 0; i < numHiders; i++) {
    const hiderElement = document.createElement("img");
    hiderElement.src = 'images/astronaut-removebg-preview.png';
    hiderElement.classList.add("hider");

    // Get random position within the game container
    const pos = getRandomPosition();
    hiderElement.style.top = pos.top;
    hiderElement.style.left = pos.left;
    hiderElement.style.opacity = settings.opacity;
    hiderElement.style.filter = settings.filter;

    gameContainer.appendChild(hiderElement);

    hiderElement.addEventListener("click", () => {
      hiderElement.remove();
      const timeBonus = Math.max(0, timeLeft * 10);
      score += timeBonus;
      scoreDisplay.textContent = `Score: ${score}`;

      foundHiders++;
      if (foundHiders === totalHiders) {
        clearInterval(timer);
        showGameOverMessage(true); // Show win message if all hiders are found
      }
    });
  }
}

function showGameOverMessage(isWin) {
  if (isWin && currentLevel === 9) { // Check if the player won and is at level 10 (index 9)
    message.textContent = "Congratulations, you beat and found all the hiders! 🎉"; // Custom message for level 10
  } else if (isWin) {
    message.textContent = "You found all hiders! 🎉"; // Regular win message for levels 1-9
  } else {
    message.textContent = "You ran out of time! 😓"; // Failure message
  }

  messageContainer.style.display = "flex";
  nextButton.style.display = isWin && currentLevel < 9 ? "inline-block" : "none"; // Only show next button if not at level 10
  retryButton.style.display = "none"; // Hide retry button if the player won
  saveScore(); // Save the score after game over
}

nextButton.addEventListener("click", () => {
  currentLevel++;
  if (currentLevel <= 9) {
    loadLevel(currentLevel); // Load next level
  }
});

// ✅ Updated Main Menu button behavior (no reload)
mainMenuButton.addEventListener("click", () => {
  clearInterval(timer);
  gameContainer.style.display = "none";
  infoBar.style.display = "none";
  messageContainer.style.display = "none";
  levelSelection.style.display = "block";
  document.getElementById("dashboard-button-container").style.display = "flex"; // bring back dashboard button
});

// Function to save the score to Supabase
async function saveScore() {
  const user = await getUser();
  if (!user) return;

  await ensureUserStatsRow(user.id); // make sure row exists

  const { data, error } = await supabaseClient
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .single(); // Fetch current stats

  if (error) {
    console.error('Error fetching user stats:', error.message);
    return;
  }

  const updatedStats = {
    total_score: score,
    high_score: Math.max(data.high_score || 0, score), // Ensure the highest score is saved
    level: currentLevel,
    difficulty: selectedDifficulty
  };

  const { updateError } = await supabaseClient
    .from('user_stats')
    .upsert({ ...updatedStats, user_id: user.id }, { onConflict: 'user_id' });

  if (updateError) {
    console.error('Error saving score:', updateError.message);
  } else {
    console.log('Score saved successfully!');
  }
}

// Get the current logged-in user
async function getUser() {
  const { data, error } = await supabaseClient.auth.getUser();
  if (error || !data?.user) {
    console.error('Error fetching user:', error?.message);
    return null;
  }
  return data.user;
}

// Signup / Login Handling (optional, if you have the UI)
async function signUp(email, password, username) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) {
    console.error('Error signing up:', error.message);
    return;
  }

  console.log('User signed up:', data);
}

async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error logging in:', error.message);
    return;
  }

  console.log('User logged in:', data);
}
