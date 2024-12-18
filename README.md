# Next.js Farm Management Platform

A comprehensive agricultural management platform built with Next.js, featuring crop management, rotation planning, soil management, and more.

## Features

### Core Features
- **User Authentication**: Secure login system with role-based access control (Admin/Farmer)
- **Modern UI/UX**: Consistent modern layout across all pages with responsive design
- **Internationalization**: Support for multiple languages (English/Romanian)

### Agricultural Features
1. **Crop Management**
   - Crop database with detailed information
   - Crop variety tracking
   - Planting and harvesting date management

2. **Rotation Planning**
   - Field division management
   - Multi-year rotation planning
   - Nitrogen balance tracking
   - Visual rotation charts

3. **Soil Management**
   - Soil test tracking
     - pH levels
     - Organic matter content
     - NPK levels
     - Soil texture classification
   - Fertilization planning
     - Application scheduling
     - Rate calculations
     - Method tracking
     - Integration with crop nitrogen requirements

4. **News and Updates**
   - Agricultural news feed
   - Platform updates
   - Community posts

## Technical Stack

- **Frontend**: Next.js 14
- **Database**: SQL Server via Prisma ORM
- **Authentication**: Auth0
- **State Management**: React Context
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Project Structure

```
app/
├── components/         # Reusable components
├── api/               # API routes
│   └── Controllers/   # API controllers
├── providers/         # Context providers
├── lib/              # Utility functions
└── [feature]/        # Feature-specific pages and components
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   DATABASE_URL=your_database_url
   AUTH0_SECRET=your_auth0_secret
   AUTH0_BASE_URL=your_base_url
   AUTH0_ISSUER_BASE_URL=your_issuer_url
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_CLIENT_SECRET=your_client_secret
   ```
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

