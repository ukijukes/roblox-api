import express from "express";
import fetch from "node-fetch";

const app = express();

// Allow all clients
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

// Fetch shirts, pants, and gamepasses
app.get("/items/:userId", async (req, res) => {
    const userId = req.params.userId;

    const shirts = await fetch(
        `https://inventory.roblox.com/v1/users/${userId}/assets/11?limit=100`
    ).then(r => r.json());

    const pants = await fetch(
        `https://inventory.roblox.com/v1/users/${userId}/assets/12?limit=100`
    ).then(r => r.json());

    const passes = await fetch(
        `https://games.roblox.com/v1/users/${userId}/games?limit=100`
    ).then(r => r.json());

    res.json({
        shirts: shirts.data,
        pants: pants.data,
        gamepasses: passes.data
    });
});

// Start the server
app.listen(3000, () => console.log("Server running on port 3000"));
