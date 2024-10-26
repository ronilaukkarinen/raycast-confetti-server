import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5462;

// Middleware to handle JSON data
app.use(express.json());

// Todoist webhook handler
app.post("/todoist-webhook", async (req, res) => {
  console.log("Incoming Todoist webhook:", req.body);

  if (req.body.event_name === "item:completed") {
    console.log("Task completed in Todoist! 🎉");
    await triggerConfetti();
  }
  res.status(200).send("Todoist webhook received");
});

// Pipedrive webhook handler
app.post("/pipedrive-webhook", async (req, res) => {
  const { event, current } = req.body;

  // Log events
  console.log(`Incoming Pipedrive webhook: ${event}`);

  // Check if the event is a deal update and the deal status is "won"
  if (event === "updated.deal" && current.status === "won") {
    console.log("Deal won in Pipedrive! 🎉");
    await triggerConfetti();
  }

  res.status(200).send("Pipedrive webhook received");
});

// Height.app webhook handler
app.post("/height-webhook", async (req, res) => {
  const eventType = req.headers["x-height-event-type"];

  // Log events
  console.log(`Incoming Height.app webhook: ${eventType}`);

  if (eventType === "task.completed") {
    console.log("Task completed in Height.app! 🎉");
    await triggerConfetti();
  }
  res.status(200).send("Height webhook received");
});

// Function to trigger Raycast confetti
async function triggerConfetti() {
  const confettiUrl = process.env.CONFETTI_URL;
  if (!confettiUrl) {
    console.error("Confetti URL is not defined in the environment variables.");
    return;
  }

  try {
    const response = await fetch(confettiUrl, { method: "POST" });
    if (response.ok) {
      console.log("Confetti triggered successfully on Mac!");
    } else {
      console.error("Failed to trigger confetti:", response.statusText);
    }
  } catch (error) {
    console.error("Error triggering confetti:", error.message);
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
