import express from "express";
import dotenv from "dotenv";
import { exec } from "child_process";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5462;

// Middleware to handle JSON data
app.use(express.json());

// Todoist webhook handler
app.post("/todoist-webhook", (req, res) => {
  console.log("Incoming Todoist webhook:", req.body);

  if (req.body.event_name === "item:completed") {
    console.log("Task completed in Todoist! 🎉");
    triggerConfetti();  // No `await` to make this fire immediately
  }
  res.status(200).send("Todoist webhook received");
});

// Pipedrive webhook handler
app.post("/pipedrive-webhook", (req, res) => {
  const { event, current } = req.body;
  console.log(`Incoming Pipedrive webhook: ${event}`);

  if (event === "updated.deal" && current.status === "won") {
    console.log("Deal won in Pipedrive! 🎉");
    triggerConfetti();  // No `await`
  }

  res.status(200).send("Pipedrive webhook received");
});

// Height.app webhook handler
app.post("/height-webhook", (req, res) => {
  const eventType = req.headers["x-height-event-type"];
  console.log(`Incoming Height.app webhook: ${eventType}`);

  if (eventType === "task.completed") {
    console.log("Task completed in Height.app! 🎉");
    triggerConfetti();  // No `await`
  }
  res.status(200).send("Height webhook received");
});

// Function to trigger Raycast confetti across multiple URLs asynchronously using curl
function triggerConfetti() {
  const urls = [process.env.CONFETTI_URL, process.env.CONFETTI_URL_2, process.env.CONFETTI_URL_3].filter(Boolean);

  if (urls.length === 0) {
    console.error("No confetti URLs defined in the environment variables.");
    return;
  }

  urls.forEach((url) => {
    exec(`curl -X POST --http2 ${url}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error triggering confetti for ${url}:`, error.message);
      } else {
        console.log(`Confetti triggered successfully for ${url} 🎉`);
      }
    });
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
