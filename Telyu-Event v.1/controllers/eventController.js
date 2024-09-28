const { Event } = require('../models')
const { Registration } = require('../models');
const path = require('path');

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

// Add a new event (for organization)
exports.addEvent = async (req, res) => {
  const file = req.files.image;
  const uploadPath = path.join(__dirname, '../public/images', file.name);
  file.mv(uploadPath)

    try {
      const { title, description, date, location, price} = req.body;
      const imagePath = `/public/images/${file.name}`;

      const event = await Event.create({
        title,
        description,
        date,
        location,
        price,
        organizationId: req.user.id,
        organizationName: req.user.name,
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
      const newRegistration = await Registration.create({
        userId: req.user.id,
        eventId,
        paymentStatus: 'pending',
      });
      res.status(201).json(newRegistration);
    } catch (err) {
      console.error('Error registering for event:', err);
      res.status(500).json({ message: 'Error registering for event' });
    }
  };

// Make payment for an event (Not complete)
exports.makePayment = async (req, res) => {
  try {
  const { eventId } = req.params;
  const event = await Event.findByPk(eventId);

} catch (err) {
  console.error(err);
  res.status(500).json({ message: 'Cannot find event' });
}
};
