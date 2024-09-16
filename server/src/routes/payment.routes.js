const express = require("express");
const router = express.Router();
const {
  createOrder,
  receiveWebhook,
} = require("../controllers/payment.controller.js");

router.post("/api/create-order", createOrder);

router.get("/api/success", (req, res) =>
  res.redirect(process.env.FRONTEND_PUBLIC_URL)
);
router.get("/api/failure", (req, res) =>
  res.redirect(process.env.FRONTEND_PUBLIC_URL)
);
router.get("/api/pending", (req, res) =>
  res.redirect(process.env.FRONTEND_PUBLIC_URL)
);

router.post("/api/webhook", receiveWebhook);

module.exports = router;
