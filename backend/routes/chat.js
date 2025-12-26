import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authMiddleware, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireAuth);

// @route   GET /api/chat/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
    .populate('participants', 'name email bloodGroup')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    // Format response with other user info and unread count
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.participants.find(p => p._id.toString() !== req.user.id);
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          receiver: req.user.id,
          read: false
        });

        return {
          id: conv._id,
          otherUser: {
            id: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
            bloodGroup: otherUser.bloodGroup,
            isOnline: false // Can be enhanced with socket.io
          },
          lastMessage: conv.lastMessage ? {
            content: conv.lastMessage.content,
            timestamp: conv.lastMessage.createdAt
          } : null,
          unreadCount,
          createdAt: conv.createdAt
        };
      })
    );

    res.json(formattedConversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/conversations
// @desc    Create or get existing conversation
// @access  Private
router.post('/conversations', async (req, res) => {
  try {
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ message: 'Other user ID is required' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, otherUserId] }
    })
    .populate('participants', 'name email bloodGroup')
    .populate('lastMessage');

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [req.user.id, otherUserId]
      });
      await conversation.save();
      await conversation.populate('participants', 'name email bloodGroup');
    }

    const otherUser = conversation.participants.find(p => p._id.toString() !== req.user.id);
    
    res.json({
      id: conversation._id,
      otherUser: {
        id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        bloodGroup: otherUser.bloodGroup,
        isOnline: false
      },
      lastMessage: conversation.lastMessage ? {
        content: conversation.lastMessage.content,
        timestamp: conversation.lastMessage.createdAt
      } : null,
      unreadCount: 0,
      createdAt: conversation.createdAt
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/conversations/:id/messages
// @desc    Get messages for a conversation
// @access  Private
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Verify user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ conversation: req.params.id })
      .sort({ createdAt: 1 });

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      conversationId: msg.conversation,
      senderId: msg.sender,
      receiverId: msg.receiver,
      content: msg.content,
      read: msg.read,
      timestamp: msg.createdAt
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/conversations/:id/messages
// @desc    Send a message
// @access  Private
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Verify user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get receiver ID
    const receiverId = conversation.participants.find(
      p => p.toString() !== req.user.id
    );

    // Create message
    const message = new Message({
      conversation: req.params.id,
      sender: req.user.id,
      receiver: receiverId,
      content: content.trim()
    });

    await message.save();

    // Update conversation's last message
    conversation.lastMessage = message._id;
    await conversation.save();

    res.status(201).json({
      id: message._id,
      conversationId: message.conversation,
      senderId: message.sender,
      receiverId: message.receiver,
      content: message.content,
      read: message.read,
      timestamp: message.createdAt
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chat/conversations/:id/read
// @desc    Mark messages as read
// @access  Private
router.put('/conversations/:id/read', async (req, res) => {
  try {
    await Message.updateMany(
      {
        conversation: req.params.id,
        receiver: req.user.id,
        read: false
      },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;