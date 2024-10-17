const { Event } = require('../models')
const { Registration } = require('../models');
const path = require('path');
const Midtrans = require('midtrans-client');

// Get all events
exports.getEvents = async (req, res) => {
    try {
      const events = await Event.findAll();
      res.status(200).json(events);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Cannot find events' });
    }
  };

//Get event details
exports.getEventDetails = async (req, res) => {
    try {
      const event = await Event.findByPk(req.params.id);
      res.json(event);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Cannot find event' });
    }
  };

// Get events by date
exports.getEventByDate = async (req, res) => {
    try {
      const date = new Date(req.query.date);
      const events = await Event.findAll({ where: { date } });
      res.json(events);
    } catch (err) {
      console.error('Error getting events by date:', err);
      res.status(500).json({ message: 'Error getting events by date' });
    }
  };

//Get events by organization
exports.getEventByEventHandler = async (req, res) => {
    try {
      const { eventHandler } = req.query;
      const events = await Event.findAll({ where: { eventHandler } });
      res.json(events);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Cannot find events' });
    }
  };

// Add a new event (for organization)
exports.addEvent = async (req, res) => {
  const file = req.files.image;
  const uploadPath = path.join(__dirname, '../public/images', file.name);
  file.mv(uploadPath)

    try {
      const { title, description, date, location, price, eventHandler} = req.body;
      const imagePath = `/public/images/${file.name}`;

      const event = await Event.create({
        title,
        description,
        date,
        location,
        price,
        organizationId: req.user.id,
        organizationName: req.user.name,
        eventHandler,
        image: imagePath,
      });
      res.status(201).json(event);
    } 
    catch (err) {
      res.status(500).json({ message: 'Cannot add event' });
    }
  };

//Update an event
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: "Cannot find event" });
    }
    const { title, description, date, location, price, image } = req.body;
    await event.update({
      title,
      description,
      date,
      location,
      price,
      eventHandler,
      image,
    });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Cannot update event' });
  }
};

//Delete an Event
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: "Cannot find event" });
    } 
    await event.destroy();
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Cannot delete event' });
  }
};


// Register for an event
exports.registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: "Cannot find event" });
    }
    const registration = await Registration.findOne({ where: { userId: req.user.id, eventId } });
    if (registration) {
      return res.status(400).json({ message: 'You have already registered for this event' });
    }

    if (event.price == 0) {
      const newRegistration = await Registration.create({
        userId: req.user.id,
        eventId,
        paymentStatus: 'paid',
      });
      return res.status(201).json(newRegistration);
    }

    if (event.price > 0) {
      const snap = new Midtrans.Snap({
        isProduction: false,
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        clientKey: process.env.MIDTRANS_CLIENT_KEY
      });

      const transaction = await snap.createTransaction({
        transaction_details: {
          order_id: `EVENT-${eventId}-${Date.now()}`,
          gross_amount: event.price,
        },
        item_details: [
          {
            id: eventId,
            price: event.price,
            quantity: 1,
            name: event.title,
          },
        ],
        customer_details: {
          first_name: req.user.name,
          email: req.user.email,
        },
      });

      const newRegistration = await Registration.create({
        userId: req.user.id,
        eventId,
        paymentStatus: 'pending',
        paymentToken: transaction.token,
      });

      return res.status(201).json({
        message: 'Please complete the payment to register for the event',
        paymentUrl: transaction.redirect_url,
        registration: newRegistration,
      });
    }
  } catch (err) {
    console.error('Error registering for event:', err);
    res.status(500).json({ message: 'Error registering for event' });
  }
};

exports.handleMidtransNotification = async (req, res) => {
  const apiClient = new Midtrans.CoreApi({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  });

  try {
    const notification = req.body;
    console.log('Midtrans notification received:', notification);

    const statusResponse = await apiClient.transaction.notification(notification);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    const registration = await Registration.findOne({ paymentToken: orderId });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        registration.paymentStatus = 'paid';
      } else if (fraudStatus === 'challenge') {
        registration.paymentStatus = 'challenge';
      } else if (fraudStatus === 'deny') {
        registration.paymentStatus = 'denied';
      }
    } else if (transactionStatus === 'settlement') {
      registration.paymentStatus = 'paid';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      registration.paymentStatus = 'failed';
    } else if (transactionStatus === 'pending') {
      registration.paymentStatus = 'pending';
    }

    await registration.save();

    res.status(200).json({ message: 'Notification handled successfully' });
  } catch (err) {
    console.error('Error handling Midtrans notification:', err);
    res.status(500).json({ message: 'Error handling notification' });
  }
};
