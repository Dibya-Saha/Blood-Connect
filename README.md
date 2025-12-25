# 🩸 BloodConnect 

A modern, bilingual (English/বাংলা) blood donation management platform connecting donors with those in need across Bangladesh.

## ✨ Features

- **Bilingual Support**: Full English and Bengali language support
- **Real-time Emergency Map**: Interactive Leaflet map showing blood requests
- **AI Health Assistant**: Gemini-powered chatbot for myth-busting and health advice
- **Inventory Management**: Track blood stock levels across hospitals
- **Donor Dashboard**: Personal dashboard with points and statistics
- **Ramadan Special**: Post-Iftar donation slot booking system
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Google Gemini API key (get it from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone * this repository

2. **Install dependencies**:
```bash
npm install
npm d3
npm list
```

3. **Set up environment variables**:
```bash
# Copy the example env file
cp .env.example ---> .env

# Edit .env and add your Gemini API key
# .env file should contain:
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

4. **Run the development server**:
```bash
npm run dev (start) 
ctrl + C (terminate)

```

5. **Open your browser** to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The production files will be in the `dist/` folder.

## 📁 Project Structure

```
bloodconnect-bangladesh/
├── src/
│   ├── components/
│   │   ├── Auth.tsx              # Login/Signup component
│   │   ├── Dashboard.tsx         # Main dashboard
│   │   ├── EmergencyMap.tsx      # Interactive map with requests
│   │   ├── Inventory.tsx         # Blood stock management
│   │   ├── MythsAssistant.tsx    # AI chatbot
│   │   └── Profile.tsx           # User profile
│   ├── services/
│   │   ├── authService.ts        # Authentication logic
│   │   ├── dashboardService.ts   # Dashboard data
│   │   ├── geminiService.ts      # AI integration
│   │   └── inventoryService.ts   # Inventory management
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Entry point
│   ├── types.ts                  # TypeScript types
│   └── index.css                 # Global styles
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🔧 Key Technologies

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Leaflet** for interactive maps
- **Google Gemini AI** for health assistant
- **LocalStorage** for mock database (development) (in Future connet into  Claude MongoDB Atlas)
- **BackEed** Express js and connects APIs from front to backend

## 🎨 Features Breakdown

### 1. Authentication System
- Secure login/signup with validation
- Age verification (18+)
- Phone number validation (Bangladesh format)
- Password strength indicator
- Bilingual forms

### 2. Dashboard
- Personal statistics and reward points
- Donation trends charts
- Blood inventory pie chart
- Ramadan donation drive with slot booking
- Real-time data updates

### 3. Emergency Map
- Interactive map powered by Leaflet
- Live blood request markers
- Emergency vs Normal request indicators
- Click to view details and call
- Special Thalassemia patient badges

### 4. Inventory Management
- Complete hospital blood stock tracking
- Division-wise summaries
- Critical shortage alerts
- Expiry date monitoring
- Filtering by city, type, and blood group

### 5. AI Health Assistant
- Powered by Google Gemini
- Myth-busting about blood donation
- Health safety information
- Culturally relevant for Bangladesh
- Quick suggestion buttons

### 6. Profile Management
- Personal information display
- Medical records
- Emergency contacts
- Achievement badges (gamification)

## 🌐 Deployment


## 🔑 Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file

## 🐛 Troubleshooting

### Map not showing
- Make sure Leaflet CSS and JS are loaded (check `index.html`)
- Check browser console for errors

### AI Assistant not working
- Verify your Gemini API key is correct in `.env`
- Make sure the file is named `.env` (not `.env.txt`)
- Restart the dev server after adding the API key

### Build errors
- Delete `node_modules` and run `npm install` again
- Make sure you're using Node.js 18 or higher

## 📝 License

This project is open source and available for educational purposes.

## 🙏 Acknowledgments

- Google Gemini AI for powering the health assistant
- OpenStreetMap & Leaflet for maps
- The open-source community

## 📧 Contact

For questions or support, please open an issue on GitHub.



