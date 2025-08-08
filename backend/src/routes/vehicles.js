// src/routes/vehicles.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// List vehicles (public)
router.get('/', async (req, res) => {
  const { type, status } = req.query;
  const where = {};
  if (type) where.type = type;
  if (status) where.status = status;
  const vehicles = await prisma.vehicle.findMany({ where });
  res.json(vehicles);
});

// Create vehicle (admin)
router.post('/', auth, adminOnly, async (req, res) => {
  const { name, plate, type, pricePerKm } = req.body;
  const v = await prisma.vehicle.create({ data: { name, plate, type, pricePerKm }});
  res.status(201).json(v);
});

module.exports = router;
