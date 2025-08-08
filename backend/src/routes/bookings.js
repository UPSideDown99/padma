// src/routes/bookings.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// helper Haversine distance (km)
function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => v * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Create booking (auth)
router.post('/', auth, async (req, res) => {
  const { vehicleId, startAddress, endAddress, startLat, startLng, endLat, endLng } = req.body;
  if (!vehicleId || !startAddress || !endAddress) return res.status(400).json({ message: 'Missing fields' });

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }});
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

  // calculate price
  let km = 0;
  if (startLat && startLng && endLat && endLng) {
    km = distanceKm(Number(startLat), Number(startLng), Number(endLat), Number(endLng));
  }
  const price = Number((vehicle.pricePerKm * (km || 1)).toFixed(2)); // if coords not provided assume minimal 1 km

  const booking = await prisma.booking.create({
    data: {
      userId: req.user.id,
      vehicleId,
      startAddress,
      endAddress,
      startLat: startLat ? Number(startLat) : 0,
      startLng: startLng ? Number(startLng) : 0,
      endLat: endLat ? Number(endLat) : 0,
      endLng: endLng ? Number(endLng) : 0,
      price
    }
  });

  res.status(201).json(booking);
});

// Get bookings for logged-in user
router.get('/', auth, async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: { vehicle: true }
  });
  res.json(bookings);
});

// Admin: list all bookings
router.get('/admin', auth, adminOnly, async (req, res) => {
  const bookings = await prisma.booking.findMany({ include: { vehicle: true, user: true }, orderBy: { createdAt: 'desc' }});
  res.json(bookings);
});

// Admin: update status
router.patch('/:id/status', auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  const id = Number(req.params.id);
  const b = await prisma.booking.update({ where: { id }, data: { status }});
  res.json(b);
});

module.exports = router;
