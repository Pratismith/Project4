# RentEase (MyNest) - Property Rental Platform

## Overview
RentEase (branded as MyNest) is a property rental platform that allows users to search, list, and manage rental properties including PGs, flats, and homestays.

## Tech Stack
- **Backend**: Node.js with Express.js (ES Modules)
- **Database**: MongoDB (external MongoDB Atlas)
- **Frontend**: Static HTML/CSS/JavaScript served from `public/` folder
- **File Storage**: Cloudinary for property images
- **Email**: Resend (production) / Nodemailer (development)

## Project Structure
```
rentease-backend/
├── config/           # Cloudinary configuration
├── middleware/       # Auth and upload middleware
├── models/           # Mongoose models (User, Property)
├── public/           # Static frontend files
├── routes/           # API routes (auth, property)
├── server.js         # Main Express server
└── package.json      # Dependencies
```

## Running the Application
The app runs on port 5000 with the command:
```bash
cd rentease-backend && npm start
```

## Environment Variables Required
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT token generation
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - For image uploads (optional)
- `RESEND_API_KEY` - For production email sending (optional)
- `EMAIL_USER`, `EMAIL_PASS` - For development email via Gmail (optional)

## API Endpoints
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `POST /api/forgot-password` - Request password reset OTP
- `POST /api/reset-password` - Reset password with OTP
- `GET /api/properties` - Get all properties
- `POST /api/properties` - Add new property (requires auth)

## Recent Changes
- 2026-01-09: Configured server to listen on 0.0.0.0:5000 for Replit environment
