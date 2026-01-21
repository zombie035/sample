const router = require("express").Router();
const Bus = require("../models/Bus"); // Add this import

// Fix: Use busNumber instead of busId since your model doesn't have busId
router.get("/location/:busNumber", async (req, res) => {
  try {
    const bus = await Bus.findOne({ busNumber: req.params.busNumber })
      .sort({ updatedAt: -1 });

    if (!bus) {
      return res.status(404).json({ 
        error: `Bus ${req.params.busNumber} not found` 
      });
    }

    res.json(bus);

  } catch (error) {
    console.error("Bus location error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;