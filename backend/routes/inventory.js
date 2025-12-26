import express from 'express';
import BloodInventory from '../models/BloodInventory.js';

const router = express.Router();

// @route   GET /api/inventory
// @desc    Get all blood inventory
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { city, bloodType, status } = req.query;
    
    let query = {};
    if (city) query.city = city;
    if (bloodType) query.bloodType = bloodType;
    if (status) query.status = status;

    const inventory = await BloodInventory.find(query).sort({ updatedAt: -1 });
    res.json(inventory);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/critical
// @desc    Get critical shortages count
// @access  Public
router.get('/critical', async (req, res) => {
  try {
    const count = await BloodInventory.countDocuments({ status: 'CRITICAL' });
    res.json({ count });
  } catch (error) {
    console.error('Get critical count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory
// @desc    Add new blood inventory
// @access  Private (Admin only - implement auth middleware later)
router.post('/', async (req, res) => {
  try {
    const inventory = new BloodInventory(req.body);
    await inventory.save();
    res.status(201).json(inventory);
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update blood inventory
// @access  Private (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const inventory = await BloodInventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    
    res.json(inventory);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete blood inventory
// @access  Private (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const inventory = await BloodInventory.findByIdAndDelete(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    
    res.json({ message: 'Inventory deleted successfully' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;