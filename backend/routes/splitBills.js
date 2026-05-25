const express = require('express');
const router = express.Router();
const SplitBill = require('../models/SplitBill');
const MoneyLent = require('../models/MoneyLent');
const MoneyBorrowed = require('../models/MoneyBorrowed');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

// @route   GET /api/split-bills
// @desc    Get all split bills for a user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const splitBills = await SplitBill.find({ user: req.user.id }).sort({ date: -1 });
    res.json(splitBills);
  } catch (error) {
    console.error('Get split bills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/split-bills/stats
// @desc    Get split bill statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const splitBills = await SplitBill.find({ user: req.user.id });
    
    const totalExpenses = splitBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalBills = splitBills.length;
    
    // Calculate how much each person owes you (when you paid)
    let totalOwedToYou = 0;
    // Calculate how much you owe others (when someone else paid)
    let totalYouOwe = 0;
    
    splitBills.forEach(bill => {
      const paidByYou = bill.paidBy.toLowerCase().includes('you') || 
                        bill.paidBy.toLowerCase().includes('me');
      
      if (paidByYou) {
        // You paid, so others owe you
        const yourShare = bill.participants.find(p => 
          p.name.toLowerCase().includes('you') || 
          p.name.toLowerCase().includes('me')
        );
        const youPaid = bill.totalAmount;
        const yourShareAmount = yourShare ? yourShare.amount : 0;
        totalOwedToYou += (youPaid - yourShareAmount);
      } else {
        // Someone else paid, so you owe them
        const yourShare = bill.participants.find(p => 
          p.name.toLowerCase().includes('you') || 
          p.name.toLowerCase().includes('me')
        );
        if (yourShare) {
          totalYouOwe += yourShare.amount;
        }
      }
    });
    
    res.json({
      totalExpenses,
      totalBills,
      totalOwedToYou,
      totalYouOwe
    });
  } catch (error) {
    console.error('Get split bill stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/split-bills
// @desc    Create a new split bill
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { paidBy, splitType, participants, totalAmount, description, date } = req.body;

    // Validate participants
    if (!participants || participants.length === 0) {
      return res.status(400).json({ message: 'At least one participant is required' });
    }

    // Calculate total of participant amounts
    const participantTotal = participants.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // For equal split, validate that amounts match
    if (splitType === 'equally') {
      const equalAmount = totalAmount / participants.length;
      // Allow small rounding differences
      if (Math.abs(participantTotal - totalAmount) > 0.1) {
        return res.status(400).json({ 
          message: 'For equal split, participant amounts must sum to total amount' 
        });
      }
    } else {
      // For unequal split, validate amounts sum correctly
      if (Math.abs(participantTotal - totalAmount) > 0.1) {
        return res.status(400).json({ 
          message: 'Participant amounts must sum to total amount' 
        });
      }
    }

    // Create the split bill
    const splitBill = new SplitBill({
      user: req.user.id,
      paidBy,
      splitType,
      participants,
      totalAmount,
      description,
      date: date || Date.now()
    });

    await splitBill.save();

    // Determine if "You" paid or someone else
    const paidByYou = paidBy.toLowerCase().includes('you') || 
                      paidBy.toLowerCase().includes('me') ||
                      paidBy.toLowerCase() === 'you' ||
                      paidBy.toLowerCase() === 'me';

    // Find "your" share from participants
    const yourParticipant = participants.find(p => 
      p.name.toLowerCase().includes('you') || 
      p.name.toLowerCase().includes('me') ||
      p.name.toLowerCase() === 'you' ||
      p.name.toLowerCase() === 'me'
    );

    if (paidByYou) {
      // YOU PAID - Add your share to expenses and create money lent entries for others
      
      // 1. Add your share to expenses
      if (yourParticipant) {
        const expense = new Expense({
          user: req.user.id,
          title: description || 'Split Bill - My Share',
          amount: yourParticipant.amount,
          category: 'Other',
          description: description || 'Split Bill - My Share',
          date: date || Date.now()
        });
        await expense.save();
      }

      // 2. Create money lent entries for each other participant
      for (const participant of participants) {
        const isYou = participant.name.toLowerCase().includes('you') || 
                      participant.name.toLowerCase().includes('me') ||
                      participant.name.toLowerCase() === 'you' ||
                      participant.name.toLowerCase() === 'me';
        
        if (!isYou && participant.amount > 0) {
          const moneyLent = new MoneyLent({
            user: req.user.id,
            lentTo: participant.name,
            totalAmount: participant.amount,
            date: date || Date.now()
          });
          await moneyLent.save();
        }
      }
    } else {
      // SOMEONE ELSE PAID - Add your share to money borrowed
      if (yourParticipant && yourParticipant.amount > 0) {
        const moneyBorrowed = new MoneyBorrowed({
          user: req.user.id,
          borrowedFrom: paidBy,
          totalAmount: yourParticipant.amount,
          date: date || Date.now()
        });
        await moneyBorrowed.save();
      }
    }

    res.status(201).json(splitBill);
  } catch (error) {
    console.error('Create split bill error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   PUT /api/split-bills/:id
// @desc    Update a split bill
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const splitBill = await SplitBill.findById(req.params.id);

    if (!splitBill) {
      return res.status(404).json({ message: 'Split bill not found' });
    }

    // Check if user owns this split bill
    if (splitBill.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { paidBy, splitType, participants, totalAmount, description, date } = req.body;

    // Validate if participants are provided
    if (participants && participants.length > 0) {
      const participantTotal = participants.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      
      if (Math.abs(participantTotal - totalAmount) > 0.1) {
        return res.status(400).json({ 
          message: 'Participant amounts must sum to total amount' 
        });
      }
    }

    splitBill.paidBy = paidBy || splitBill.paidBy;
    splitBill.splitType = splitType || splitBill.splitType;
    splitBill.participants = participants || splitBill.participants;
    splitBill.totalAmount = totalAmount || splitBill.totalAmount;
    splitBill.description = description !== undefined ? description : splitBill.description;
    splitBill.date = date || splitBill.date;

    await splitBill.save();
    res.json(splitBill);
  } catch (error) {
    console.error('Update split bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/split-bills/:id
// @desc    Delete a split bill
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const splitBill = await SplitBill.findById(req.params.id);

    if (!splitBill) {
      return res.status(404).json({ message: 'Split bill not found' });
    }

    // Check if user owns this split bill
    if (splitBill.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await splitBill.deleteOne();
    res.json({ message: 'Split bill deleted' });
  } catch (error) {
    console.error('Delete split bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
