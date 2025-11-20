// server.js
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());

/**
 * Fetch gamepasses for a specific place
 */
app.get("/gamepasses/:placeId", async (req, res) => {
  const { placeId } = req.params;

  try {
    const url = `https://www.roblox.com/games/getgamepasses?placeId=${placeId}&currentPage=0&pageSize=100`;
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch gamepasses" });
    }

    const html = await response.text();

    // Extract gamepass IDs
    const ids = [];
    const regex = /gamepassId":(\d+)/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      ids.push(Number(match[1]));
    }

    // Fetch gamepass details using Roblox API
    const gamepasses = [];
    for (const id of ids) {
      try {
        const infoRes = await fetch(`https://apis.roblox.com/marketplace/products/${id}/details`);
        if (!infoRes.ok) continue;

        const info = await infoRes.json();
        gamepasses.push({
          id,
          name: info.Name,
          description: info.Description,
          price: info.PriceInRobux || 0,
          icon: info.Thumbnail?.Url || null,
        });
      } catch {}
    }

    res.json(gamepasses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.send("Roblox Gamepass Proxy Running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
