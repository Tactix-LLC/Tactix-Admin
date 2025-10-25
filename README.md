# Tactix Admin Dashboard

A comprehensive admin dashboard for managing the Tactix Fantasy Football platform. Built with Next.js 14, TypeScript, Tailwind CSS, and modern React patterns.

## 🚀 Features

### Core Features
- **User Management**: View, edit, ban users, manage agent status
- **Game Week Management**: Create, edit, manage game weeks and their status
- **Competition Management**: Manage competitions and seasons
- **Team Management**: View and manage user teams
- **Player Management**: Manage player statistics and data
- **Financial Dashboard**: Track credits, transactions, commissions
- **Content Management**: Manage FAQs, terms, privacy policies
- **Analytics**: Comprehensive analytics and reporting
- **Real-time Updates**: Live data updates and notifications

### Technical Features
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Type Safety**: Full TypeScript support
- **State Management**: Zustand for global state
- **Data Fetching**: React Query for efficient API calls
- **Authentication**: JWT-based authentication
- **Responsive Design**: Mobile-first approach
- **Theme Support**: Easy color customization
- **Performance**: Optimized for speed and efficiency

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **UI Components**: Custom components with Radix UI primitives
- **Authentication**: JWT tokens
- **Deployment**: Vercel-ready

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tactix-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=https://ff-api-eahf.onrender.com
   <!-- NEXT_PUBLIC_API_URL=http://localhost:3000 -->

   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3001](http://localhost:3001) (admin panel runs on port 3001)

## 🔧 Configuration

### API Configuration
Update the API base URL in `src/lib/constants.ts`:
```typescript
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://ff-api-eahf.onrender.com',
  // BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  TIMEOUT: 10000,
}
```

### Theme Customization
The theme colors can be easily customized in `src/lib/constants.ts`:
```typescript
export const colors = {
  primary: {
    500: '#1E727E', // Main primary color
    // ... other shades
  },
  // ... other color palettes
}
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── users/            # Users management
│   ├── game-weeks/       # Game weeks management
│   ├── competitions/     # Competitions management
│   ├── teams/            # Teams management
│   ├── players/          # Players management
│   ├── financial/        # Financial dashboard
│   ├── content/          # Content management
│   ├── analytics/        # Analytics and reporting
│   ├── settings/         # Settings page
│   └── login/            # Login page
├── components/           # Reusable components
│   ├── ui/              # Base UI components
│   └── layout/          # Layout components
├── lib/                 # Utilities and configurations
│   ├── api.ts          # API service layer
│   ├── store.ts        # Zustand stores
│   ├── utils.ts        # Utility functions
│   └── constants.ts    # Constants and configurations
└── types/              # TypeScript type definitions
```

## 🔐 Authentication

The admin dashboard uses the same JWT authentication system as your mobile app. Admin users are authenticated through the `/api/v1/admin/login` endpoint.

### Authentication Flow
1. Admin logs in with email and password
2. JWT token is received and stored in localStorage
3. Token is automatically included in all API requests
4. Token expiration is handled automatically

## 📊 API Integration

The dashboard integrates with your existing Node.js API endpoints:

### Key API Endpoints
- **Authentication**: `/api/v1/admin/*`
- **Users**: `/api/v1/client/*`
- **Game Weeks**: `/api/v1/gameweek/*`
- **Competitions**: `/api/v1/competitions/*`
- **Teams**: `/api/v1/team/*`
- **Players**: `/api/v1/playerstat/*`
- **Financial**: `/api/v1/transaction/*`, `/api/v1/credit/*`
- **Content**: `/api/v1/faq/*`, `/api/v1/terms/*`, `/api/v1/privacy/*`
- **Analytics**: `/api/v1/dashboard/*`

## 🎨 Customization

### Changing Colors
To change the theme colors, update the `colors` object in `src/lib/constants.ts`:

```typescript
export const colors = {
  primary: {
    500: '#YOUR_COLOR_HERE', // Change this to your brand color
    // ... adjust other shades accordingly
  },
}
```

### Adding New Features
1. Create new API endpoints in your backend
2. Add API functions in `src/lib/api.ts`
3. Create new pages in `src/app/`
4. Add navigation items in `src/lib/constants.ts`

## 🚀 Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Conventional commits for version control

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Updates

To update the dashboard:
1. Pull the latest changes
2. Install new dependencies: `npm install`
3. Test the application: `npm run dev`
4. Deploy to production

---

**Built with ❤️ for Tactix Fantasy Football**
