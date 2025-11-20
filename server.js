import express from "express";
import fetch from "node-fetch";

const app = express();

// Allow Roblox and browsers to request your API (CORS)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Fetch gamepasses, shirts, and pants for a specific user
app.get("/items/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Fetch gamepasses
    const gamepasses = await fetch(
      `https://games.roblox.com/v1/users/${userId}/game-passes?sortOrder=Asc&limit=100`
    ).then(r => r.json());

    // Fetch shirts (asset type 11)
    const shirts = await fetch(
      `https://inventory.roblox.com/v1/users/${userId}/assets/11?limit=100`
    ).then(r => r.json());

    // Fetch pants (asset type 12)
    const pants = await fetch(
      `https://inventory.roblox.com/v1/users/${userId}/assets/12?limit=100`
    ).then(r => r.json());

    // Respond with all collected items
    res.json({
      success: true,
      gamepasses: gamepasses.data || [],
      shirts: shirts.data || [],
      pants: pants.data || []
    });

  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch user items" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
