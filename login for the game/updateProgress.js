const express = require('express');
const { supabase } = require('./supabaseClient');  // assuming you're using supabase client
const router = express.Router();

// Endpoint to update user stats
router.post('/update-progress', async (req, res) => {
  const { userId, newScore, newLevel, newDifficulty, questsCompleted, itemsCollected } = req.body;

  try {
    const { data, error } = await supabase
      .from('user_stats')
      .upsert([
        {
          user_id: userId,
          total_score: newScore,
          current_level: newLevel,
          current_difficulty: newDifficulty,
          quests_completed: questsCompleted,
          items_collected: itemsCollected,
        }
      ])
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating user progress:', error);
    return res.status(500).json({ error: 'Failed to update user progress.' });
  }
});

module.exports = router;
