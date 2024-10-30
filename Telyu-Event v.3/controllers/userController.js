const { User } = require('../models');
const { Registration } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register user
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await User.findOne({ where: { email } });

  if (user) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({ name, email, password: hashedPassword, role });
  // await user.save();

  const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.status(201).json({ token });
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  console.log('User found:', user); //Check user found

  if (!user) {
    return res.status(401).json({ message: 'No User Found' });
  }

  if (!(await bcrypt.compare(password, user.password))) {
    console.log(password, user.password); //Testing password error mulu sundel
    return res.status(401).json({ message: 'Wrong Password' });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.status(200).json({ token });
};

//Get user Profile
exports.getProfile = async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
      return res.status(404).json({ message: "User not found" });
  }
  const userProfile = {name: user.name, role: user.role, registeredEvents: await Registration.findAll({ where: { userId: user.id } })
  }
  res.status(200).json(userProfile);
}