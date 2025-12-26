import express from 'express';
import BloodRequest from '../models/BloodRequest.js';

const router = express.Router();

// @route   GET /api/requests
// @desc    Get all blood requests
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, bloodGroup, urgency } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (urgency) query.urgency = urgency;

    const requests = await BloodRequest.find(query)
      .populate('requestedBy', 'name email phone')
      .populate('fulfilledBy', 'name email phone')
      .sort({ urgency: -1, createdAt: -1 });
      
    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/requests/:id
// @desc    Get single blood request
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate('requestedBy', 'name email phone')
      .populate('fulfilledBy', 'name email phone');
      
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/requests
// @desc    Create new blood request
// @access  Private
router.post('/', async (req, res) => {
  try {
    const request = new BloodRequest(req.body);
    await request.save();
    res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/requests/:id
// @desc    Update blood request
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const request = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/requests/:id
// @desc    Delete blood request
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const request = await BloodRequest.findByIdAndDelete(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;