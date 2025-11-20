const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());

// Helper: fetch JSON safely
async function getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
}

// Get user's public places
app.get("/places/:userId", async (req, res) => {
    const userId = req.params.userId;

    const url = `https://develop.roblox.com/v1/users/${userId}/places?limit=100`;

    const data = await getJSON(url);
    if (!data) return res.status(500).json({ error: "API error fetching places" });

    res.json(data);
});

// Get gamepasses for a place
app.get("/gamepasses/:placeId", async (req, res) => {
    const placeId = req.params.placeId;

    const url = `https://games.roblox.com/v1/games/${placeId}/game-passes?limit=100`;

    const data = await getJSON(url);
    if (!data) return res.status(500).json({ error: "API error fetching gamepasses" });

    res.json(data);
});

// Get user's clothing items (shirts, pants, tshirts)
app.get("/clothing/:userId", async (req, res) => {
    const userId = req.params.userId;

    const url = `https://catalog.roblox.com/v1/search/items?creatorTargetId=${userId}&creatorType=User&category=Clothing&limit=120&sortOrder=Asc`;

    const data = await getJSON(url);
    if (!data) return res.status(500).json({ error: "API error fetching clothing" });

    res.json(data);
});

// Full combined fetch: places → gamepasses → clothing
app.get("/full/:userId", async (req, res) => {
    const userId = req.params.userId;

    // Get user's public places
    const placesURL = `https://develop.roblox.com/v1/users/${userId}/places?limit=100`;
    const placesData = await getJSON(placesURL);

    if (!placesData) return res.status(500).json({ error: "could not fetch places" });

    const placeIds = placesData.data.map(p => p.id);

    // Fetch all gamepasses for each place
    let allGamepasses = [];

    for (const placeId of placeIds) {
        const gpURL = `https://games.roblox.com/v1/games/${placeId}/game-passes?limit=100`;
        const gpData = await getJSON(gpURL);
        if (gpData && gpData.data) {
            allGamepasses.push(...gpData.data.map(g => ({ ...g, placeId })));
        }
    }

    // Fetch clothing
    const clothingURL = `https://catalog.roblox.com/v1/search/items?creatorTargetId=${userId}&creatorType=User&category=Clothing&limit=120&sortOrder=Asc`;
    const clothingData = await getJSON(clothingURL);

    res.json({
        places: placesData.data,
        gamepasses: allGamepasses,
        clothing: clothingData?.data ?? []
    });
});

// PORT (Render assigns its own)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
