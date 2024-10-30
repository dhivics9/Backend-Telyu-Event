const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware JSON dan file upload
app.use(express.json());
app.use(fileUpload());
app.use(express.urlencoded({extended: true}));
app.use(cors());

//Upload Image
app.use('/public/images', express.static(path.join(__dirname, 'public/images')));

// Import routes
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');

//Routes
app.use('/event', eventRoutes);
app.use('/user', userRoutes);

//Display Server
app.get('/', (req, res) => {
    res.send('Website Telyu Event');
});

//Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));