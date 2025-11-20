const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());

async function fetchJSON(url) {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/* -------------------------------
   Fetch public games for a user
--------------------------------*/
app.get("/games/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const url = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=100`;

        const data = await fetchJSON(url);

        // Extract rootPlaceId for each experience
        const placeIds = data.data
            .filter(game => game.rootPlace && game.rootPlace.id)
            .map(game => game.rootPlace.id);

        res.json({ placeIds });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch public games", details: err.message });
    }
});

/* -----------------------------------------
   Fetch gamepasses for a specific place
------------------------------------------*/
app.get("/gamepasses/:placeId", async (req, res) => {
    try {
        const { placeId } = req.params;
        const url = `https://games.roblox.com/v1/games/${placeId}/game-passes?limit=100`;

        const data = await fetchJSON(url);

        res.json(data.gamePasses || []);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch gamepasses", details: err.message });
    }
});

/* -----------------------------------------
   Fetch user-created shirts/pants/tshirts
------------------------------------------*/
app.get("/clothing/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const assetTypes = {
            tshirt: 2,
            shirt: 11,
            pants: 12
        };

        const all = {};

        for (const [key, typeId] of Object.entries(assetTypes)) {
            const url =
                `https://avatar.roblox.com/v1/users/${userId}/inventory/${typeId}?limit=100`;

            try {
                const data = await fetchJSON(url);
                all[key] = data.data || [];
            } catch {
                all[key] = [];
            }
        }

        res.json(all);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch clothing", details: err.message });
    }
});

/* -----------------------------------------
   Combined endpoint (all info)
------------------------------------------*/
app.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Fetch all public games → placeIds
        const gamesURL =
            `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=100`;

        const gamesData = await fetchJSON(gamesURL);
        const placeIds = gamesData.data
            .filter(g => g.rootPlace && g.rootPlace.id)
            .map(g => g.rootPlace.id);

        // 2. Fetch gamepasses from each place
        const gamepasses = [];
        for (const pid of placeIds) {
            const gpURL = `https://games.roblox.com/v1/games/${pid}/game-passes?limit=100`;
            try {
                const gpData = await fetchJSON(gpURL);
                if (gpData.gamePasses) {
                    gpData.gamePasses.forEach(g => {
                        g.placeId = pid;
                        gamepasses.push(g);
                    });
                }
            } catch (_) { }
        }

        // 3. Fetch user-created clothing
        const clothing = {};
        const assetTypes = {
            tshirt: 2,
            shirt: 11,
            pants: 12
        };

        for (const [key, typeId] of Object.entries(assetTypes)) {
            const url =
                `https://avatar.roblox.com/v1/users/${userId}/inventory/${typeId}?limit=100`;

            try {
                const data = await fetchJSON(url);
                clothing[key] = data.data || [];
            } catch {
                clothing[key] = [];
            }
        }

        res.json({
            userId,
            placeIds,
            gamepasses,
            clothing
        });

    } catch (err) {
        res.status(500).json({
            error: "Failed to fetch user data",
            details: err.message
        });
    }
});

/* -----------------------------------------
   Root endpoint
------------------------------------------*/
app.get("/", (req, res) => {
    res.json({
        message: "Roblox API proxy is running.",
        routes: [
            "/games/:userId",
            "/gamepasses/:placeId",
            "/clothing/:userId",
            "/user/:userId"
        ]
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
