# Frontend Setup and Build Instructions

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

```bash
npm install
```

## Development Server

```bash
npm run dev
```

The development server will start on `http://localhost:3000`

## Build for Production

```bash
npm run build
npm run preview
```

The built files will be in the `dist/` folder.

## Environment Variables

Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:5000/api
```

## Project Structure

- `src/pages/` - Page components (Dashboard, Traffic, Alerts, Reports)
- `src/components/` - Reusable components (Layout, Navbar, etc.)
- `src/contexts/` - React Context (Auth, Theme)
- `src/lib/` - Utility functions and API client
- `src/types/` - TypeScript type definitions
- `src/App.tsx` - Main app component with routing
- `src/index.css` - Global styles (Tailwind)

## Key Features

### Pages
- **Login** - User authentication
- **Register** - New user registration
- **Dashboard** - Real-time analytics and charts
- **Traffic** - Traffic log browsing with export
- **Alerts** - Alert management and incidents
- **Reports** - Report generation and download

### Components
- **Layout** - Main layout wrapper with navbar
- **Navbar** - Navigation and logout
- **ThemeToggle** - Dark/light mode switcher
- **ProtectedRoute** - Route protection for authenticated users

### Contexts
- **AuthContext** - User authentication state management
- **ThemeContext** - Dark/light theme state

### API Client
The `apiClient` handles:
- Authentication endpoints
- Traffic data fetching
- Dashboard statistics
- Alert management
- Report generation and download

## Authentication Flow

1. User registers or logs in
2. Token stored in localStorage
3. Token sent in Authorization header for protected requests
4. If token invalid, user redirected to login
5. Logout clears token and local storage

## Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Dark Mode** - CSS class-based dark mode support
- **Lucide Icons** - Beautiful SVG icons
- **Recharts** - React charting library

## Dashboard Features

- **Real-time Stats** - Auto-refreshing statistics
- **Traffic Charts** - 7-day trend visualization
- **Severity Distribution** - Pie chart breakdown
- **Recent Alerts** - Latest alerts list
- **Simulate Button** - Generate test traffic

## Traffic Page

- **Search Filtering** - Search by source IP
- **Severity Filtering** - Filter by alert severity
- **CSV Export** - Download traffic logs as CSV
- **Responsive Table** - Mobile-friendly data display

## Alerts Page

- **Alert Listing** - View all alerts with status
- **Expandable Details** - Click to view more info
- **Status Management** - Mark as acknowledged/resolved
- **Incident Creation** - Create related incidents
- **Incident Tracking** - Track incident status

## Reports Page

- **Quick Generate** - One-click report generation
- **Traffic Summary** - Traffic statistics report
- **Security Analysis** - Security metrics report
- **Download Reports** - Export as JSON
- **Data Preview** - View report data before download

## Development Tips

### Adding New Pages

1. Create component in `src/pages/`
2. Add route in `App.tsx`
3. Add navigation link in `Navbar.tsx`

### Adding API Endpoints

1. Add method to `apiClient` in `src/lib/api.ts`
2. Create component or hook to use the endpoint
3. Handle loading and error states

### Styling Components

Use Tailwind utility classes:
```tsx
<div className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Button
</div>
```

Dark mode:
```tsx
<div className="bg-white dark:bg-gray-800 text-black dark:text-white">
  Content
</div>
```

## Performance Optimization

- Components are code-split by route
- Images and assets are optimized
- CSS is minified and purged in production
- JavaScript is minified and tree-shaken

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### API Connection Issues
- Check if backend is running on port 5000
- Verify `VITE_API_URL` in `.env.local`
- Check browser console for CORS errors

### Login Issues
- Verify backend is running
- Check demo credentials: test@example.com / password123
- Clear localStorage and try again

### Chart Not Displaying
- Ensure Recharts is properly installed
- Check browser console for errors
- Verify data is being fetched from backend

## Linting

```bash
npm run lint
```

## Building for Different Environments

**Development:**
```bash
npm run dev
```

**Staging/Production:**
```bash
npm run build
npm run preview
```

## Deployment

### Vercel/Netlify
```bash
npm run build
# Upload dist folder
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Additional Resources

- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)
- [React Router](https://reactrouter.com)
