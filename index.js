const express = require("express");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cookieParser());
app.use(express.json());
app.set("view engine", "ejs");
app.use("/", express.static(path.join(__dirname, "public")));

// Middleware to set default cookie values if they don't exist
app.use((req, res, next) => {
  if (!req.cookies.take) {
    res.cookie("take", 1); // Default to take1
  }
  if (!req.cookies.heart) {
    const initialHeart = { monika: 0, hajime: 0 };
    res.cookie("heart", JSON.stringify(initialHeart));
  }
  next();
});

// Route for the homepage
app.get("/", (req, res) => {
  const take = parseInt(req.cookies.take, 10) || 1; // Get the value of `take` cookie
  console.log(take);
  const showPlayButton = take > 1 && take < 5; // Show play button only if take > 1
  
  res.render("home", { showPlayButton }); // Pass the flag to the EJS template
});

// Route to render the gameplay page
app.get("/play", (req, res) => {
  res.render("gameplay"); // Renders gameplay.ejs
});

// New route to reset cookies for a new game
app.get("/newgame", (req, res) => {
  // Reset cookies to their initial values
  res.cookie("take", 1); // Reset `take` cookie to 1
  const initialHeart = { monika: 0, hajime: 0 };
  res.cookie("heart", JSON.stringify(initialHeart)); // Reset `heart` cookie
  
  // Optionally, redirect back to the homepage or gameplay
  res.redirect("/play"); // Redirect to homepage after resetting
});

// Route to check the current take
app.get("/checkTake", (req, res) => {
  let take = parseInt(req.cookies.take, 10); // Get the current take value
  const totalTakes = Object.keys(require(path.join(__dirname, "JSON/story.json"))).length; // Total takes available

  if (take >= totalTakes) {
    return res.status(404).json({ message: "No more takes left." }); // Respond with 404 if no takes are left
  }

  res.status(200).json({ message: "Take is available." }); // Respond with 200 if there's a take left
});

// Route to update the take value
app.get("/updateTake", (req, res) => {
  let take = parseInt(req.cookies.take, 10); // Read the `take` cookie and convert to a number
  take += 1;
  res.cookie("take", take); // Set the cookie `take` with the new value
  res.redirect("/"); // Redirect to homepage after updating
});

// Route to go to the next take
app.get("/nextTake", (req, res) => {
  let take = parseInt(req.cookies.take, 10); // Read the `take` cookie and convert to a number
  take += 1;
  res.cookie("take", take); // Set the cookie `take` with the new value
  res.redirect("/play"); // Redirect to gameplay after updating
});

// API to fetch take data based on the cookie
app.get("/fetchTake", (req, res) => {
  let take = parseInt(req.cookies.take, 10); // Read the `take` cookie and convert to a number
  
  res.cookie("take", take); // Set the cookie `take` with the latest value
  
  fs.readFile(path.join(__dirname, "JSON/story.json"), "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading JSON file.");

    try {
      const storyData = JSON.parse(data);
      const currentTake = storyData[`take${take}`];

      if (currentTake) {
        res.json(currentTake);
      } else {
        res.status(404).send("Story take not found.");
      }
    } catch (parseError) {
      res.status(500).send("Error parsing JSON data.");
    }
  });
});

// API to update heart points based on choice selection
app.post("/sendHeart", (req, res) => {
  const { character, points } = req.body;
  const heartData = req.cookies.heart ? JSON.parse(req.cookies.heart) : { monika: 0, hajime: 0 };

  // Update heart based on character
  if (heartData.hasOwnProperty(character)) {
    heartData[character] += points;
    res.cookie("heart", JSON.stringify(heartData)); // Update heart cookie
    res.json({ message: "Heart updated successfully!", heartData });
  } else {
    res.status(400).json({ message: "Character not found in heart data." });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
