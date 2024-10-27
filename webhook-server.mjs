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
    triggerConfetti();
  }
  res.status(200).send("Todoist webhook received");
});

// Pipedrive webhook handler
app.post("/pipedrive-webhook", async (req, res) => {
  const { event, current } = req.body;
  console.log(`Incoming Pipedrive webhook: ${event}`);

  if (event === "updated.deal" && current.status === "won") {
    console.log("Deal won in Pipedrive! 🎉");
    triggerConfetti();
  }

  res.status(200).send("Pipedrive webhook received");
});

// Height.app webhook handler
app.post("/height-webhook", async (req, res) => {
  const eventType = req.headers["x-height-event-type"];
  console.log(`Incoming Height.app webhook: ${eventType}`);

  if (eventType === "task.completed") {
    console.log("Task completed in Height.app! 🎉");
    triggerConfetti();
  }
  res.status(200).send("Height webhook received");
});

// Function to trigger Raycast confetti across multiple URLs asynchronously
async function triggerConfetti() {
  const urls = [process.env.CONFETTI_URL, process.env.CONFETTI_URL_2, process.env.CONFETTI_URL_3].filter(Boolean);

  if (urls.length === 0) {
    console.error("No confetti URLs defined in the environment variables.");
    return;
  }

  try {
    // Trigger each URL without awaiting, so they fire off as close to simultaneously as possible
    const requests = urls.map(url => fetch(url, { method: "POST" }));
    await Promise.all(requests);  // Await all fetch calls in parallel

    console.log("Confetti triggered successfully on all URLs! 🎉");

  } catch (error) {
    console.error("Error triggering confetti:", error.message);
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
