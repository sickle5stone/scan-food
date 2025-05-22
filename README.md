# ScanFood - Food Recognition & Nutrition Tracker

ScanFood is a full-stack web application that allows users to scan food items using their device's camera or uploaded images. The app uses Google Gemini AI to recognize food and provides detailed nutritional information.

## Setup

1. **Clone the repository**
   ```
   git clone <repository-url>
   cd scan-food
   ```

2. **Install dependencies**
   ```
   npm run install:all
   ```

3. **Set up environment variables**
   - Create a `.env` file in the `backend` directory based on the `.env.example` file
   - Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/)
   - Add your Gemini API key to the `.env` file:
     ```
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

4. **Start the application**
   ```
   npm start
   ```
   This will start both the frontend (Vite) and backend (Express) servers concurrently.

## Important Note about Gemini API

As of July 2024, Google has deprecated Gemini 1.0 Pro Vision and gemini-pro models. This application uses the newer `gemini-2.0-flash` model. If you encounter API errors, please ensure:

1. You have a valid API key from Google AI Studio
2. Your API key has access to the newer models
3. If needed, update the models in `backend/services/geminiService.js`

## Features

- **AI-Powered Food Recognition**: Scan food with your camera or upload images to identify food items using Google Gemini Vision API.
- **Detailed Nutrition Information**: View calories, macronutrients, and recommended daily amounts (RDAs).
- **Mobile-First Design**: Responsive UI optimized for mobile devices.
- **Progressive Web App**: Install as a standalone app on supported devices.
- **Offline Support**: Basic functionality works offline with cached data.

## Project Structure

The application consists of two main parts:

- **Frontend**: React application built with TypeScript, Vite, and Tailwind CSS
- **Backend**: Express server that integrates with Google Gemini AI and handles nutrition data

## Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Google Gemini API key (for backend)
- Optional: Nutrition API key (if you want to use a third-party nutrition database)

## Usage

1. Open the application in your browser (http://localhost:5173)
2. Use the navigation to access different features:
   - Home: Dashboard with recent entries and stats
   - Scan: Scan food items with your camera or upload images
   - Food Details: View detailed nutritional information
   - Diary: Track your food consumption (future implementation)

## API Endpoints

The backend provides the following API endpoints:

- `POST /api/food/recognize` - Upload an image to recognize food
- `GET /api/food/:id` - Get detailed nutritional information for a food item
- `GET /api/food/search/:query` - Search for food items by name

## Development

### Frontend Structure

- `/src/pages` - Main application pages
- `/src/components` - Reusable UI components
- `/src/assets` - Static assets like images and icons
- `/public` - Public assets including PWA manifest

### Backend Structure

- `/backend/server.js` - Main Express server
- `/backend/routes` - API routes
- `/backend/controllers` - Route handlers
- `/backend/services` - Business logic, including Gemini integration
- `/backend/utils` - Helper functions and utilities

## Deployment

### Backend Deployment

The backend can be deployed to any Node.js hosting service like:

- Heroku
- DigitalOcean
- AWS Elastic Beanstalk
- Railway

Remember to set environment variables in your hosting provider's dashboard.

### Frontend Deployment

The frontend can be built for production and deployed to static hosting:

```
npm run build
```

Then deploy the `/dist` directory to services like:

- Netlify
- Vercel
- GitHub Pages
- Firebase Hosting

## Credits and Attribution

- Food recognition powered by Google Gemini AI
- Nutrition data from various sources (customizable through the backend)
- Icons from various free icon libraries

## License

This project is licensed under the MIT License - see the LICENSE file for details.
