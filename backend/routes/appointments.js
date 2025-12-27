import express from 'express';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import BloodInventory from '../models/BloodInventory.js';
import { authMiddleware, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireAuth);

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { 
      hospitalId, 
      hospitalName, 
      hospitalAddress, 
      hospitalPhone, 
      bloodGroup, 
      appointmentDate, 
      appointmentTime,
      notes 
    } = req.body;

    // Validate required fields
    if (!hospitalId || !bloodGroup || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get donor info
    const donor = await User.findById(req.user.id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Check if appointment date is in the future
    const apptDate = new Date(appointmentDate);
    if (apptDate < new Date()) {
      return res.status(400).json({ message: 'Appointment date must be in the future' });
    }

    // Check if donor has donated in last 120 days
    if (donor.lastDonationDate) {
      const daysSinceLastDonation = Math.floor(
        (Date.now() - new Date(donor.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastDonation < 120) {
        return res.status(400).json({ 
          message: `You must wait ${120 - daysSinceLastDonation} more days before donating again`,
          daysRemaining: 120 - daysSinceLastDonation
        });
      }
    }

    // Create appointment
    const appointment = new Appointment({
      donor: req.user.id,
      donorName: donor.name,
      donorPhone: donor.phone,
      donorBloodGroup: donor.bloodGroup,
      hospitalId,
      hospitalName,
      hospitalAddress,
      hospitalPhone,
      bloodGroup,
      appointmentDate: apptDate,
      appointmentTime,
      notes: notes || '',
      status: 'SCHEDULED'
    });

    await appointment.save();

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });

  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/appointments/my-appointments
// @desc    Get current user's appointments
// @access  Private
router.get('/my-appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ donor: req.user.id })
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get single appointment
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if appointment belongs to user
    if (appointment.donor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/appointments/:id/complete
// @desc    Mark appointment as completed and update inventory
// @access  Private
router.put('/:id/complete', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.donor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (appointment.status !== 'SCHEDULED') {
      return res.status(400).json({ message: 'Appointment already processed' });
    }

    // Update appointment status
    appointment.status = 'COMPLETED';
    appointment.completedAt = new Date();
    await appointment.save();

    // Update blood inventory
    const inventory = await BloodInventory.findOne({
      $or: [
        { hospitalId: appointment.hospitalId },
        { hospitalName: { $regex: appointment.hospitalName, $options: 'i' } }
      ],
      bloodType: appointment.bloodGroup
    });

    if (inventory) {
      inventory.quantity += 1;
      await inventory.save();
    }

    // Update user's last donation date and points
    const user = await User.findById(req.user.id);
    if (user) {
      user.lastDonationDate = new Date();
      user.points += 50;
      await user.save();
    }

    res.json({
      message: 'Donation completed successfully',
      appointment,
      pointsEarned: 50
    });

  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancel appointment
// @access  Private
router.put('/:id/cancel', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.donor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (appointment.status !== 'SCHEDULED') {
      return res.status(400).json({ message: 'Can only cancel scheduled appointments' });
    }

    appointment.status = 'CANCELLED';
    await appointment.save();

    res.json({
      message: 'Appointment cancelled successfully',
      appointment
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.donor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (appointment.status !== 'SCHEDULED') {
      return res.status(400).json({ message: 'Can only update scheduled appointments' });
    }

    // Update allowed fields
    const { appointmentDate, appointmentTime, notes } = req.body;

    if (appointmentDate) {
      const apptDate = new Date(appointmentDate);
      if (apptDate < new Date()) {
        return res.status(400).json({ message: 'Appointment date must be in the future' });
      }
      appointment.appointmentDate = apptDate;
    }

    if (appointmentTime) appointment.appointmentTime = appointmentTime;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    res.json({
      message: 'Appointment updated successfully',
      appointment
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;