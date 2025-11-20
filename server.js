const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

/* ------------------------
   1. SCRAPE PUBLIC GAMES
------------------------ */
async function getPublicPlaces(userId) {
    const url = `https://www.roblox.com/users/${userId}/creations`;

    const html = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
    }).then(res => res.data);

    const $ = cheerio.load(html);
    const placeIds = new Set();

    $("[data-placeid]").each((_, el) => {
        const id = $(el).attr("data-placeid");
        if (id && !isNaN(id)) placeIds.add(id);
    });

    $("[data-universe-id]").each((_, el) => {
        const id = $(el).attr("data-universe-id");
        if (id && !isNaN(id)) placeIds.add(id);
    });

    return [...placeIds];
}

/* ------------------------
   2. FETCH GAMEPASSES
------------------------ */
async function getGamepasses(placeId) {
    try {
        const url = `https://games.roblox.com/v1/games/${placeId}/game-passes`;
        const res = await axios.get(url);
        return res.data.data || [];
    } catch {
        return [];
    }
}

/* ------------------------
   3. FETCH USER CLOTHING
------------------------ */
async function getClothing(userId) {
    const url =
        `https://catalog.roblox.com/v1/search/items` +
        `?creatorTargetId=${userId}` +
        `&limit=120&creatorType=User&salesType=All&sortType=Updated`;

    try {
        const res = await axios.get(url);
        return res.data.data.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            itemType: item.itemType
        }));
    } catch {
        return [];
    }
}

/* ------------------------
   4. COMBINED ENDPOINT
------------------------ */
app.get("/items/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        const places = await getPublicPlaces(userId);

        let gamepasses = [];
        for (const placeId of places) {
            const passes = await getGamepasses(placeId);
            gamepasses = gamepasses.concat(
                passes.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    placeId,
                    type: "Gamepass"
                }))
            );
        }

        const clothing = await getClothing(userId);

        res.json({
            userId,
            publicPlaces: places,
            totalGamepasses: gamepasses.length,
            totalClothingItems: clothing.length,
            gamepasses,
            clothing
        });

    } catch (err) {
        res.json({ error: "Failed to fetch items", details: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
   
