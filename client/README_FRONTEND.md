# Frontend React (client) implementation

The frontend application has been successfully created in the `client` directory.

## Features Implemented
- **Tech Stack**: React 19 + Vite + TypeScript + Tailwind CSS v4.
- **Routing**: Setup with `react-router-dom` (Home, Products, Product Detail, Contact).
- **State Management**: `TanStack Query` for efficient data fetching.
- **API Integration**: Connected to Strapi backend at `http://localhost:1337`.
- **UI Components**:
    - `Navbar` and `Footer` created.
    - `ProductCard` for listing items.
    - Responsive layouts with Tailwind CSS.

## Next Steps for You

### 1. Enable API Permissions in Strapi
Your Strapi API currently returns **403 Forbidden**. You must enable public access:
1. Go to Strapi Admin Panel (`http://localhost:1337/admin`).
2. Navigate to **Settings > Users & Permissions > Roles**.
3. Click on **Public**.
4. Scroll down to **Permissions** and check `find` and `findOne` for:
    - `Product`
    - `Category`
    - `Brand`
    - `Variant`
    - `Page`
    - `SeoComponent`
5. Also check `create` for `ContactRequest`.
6. Click **Save**.

### 2. Run the Frontend
Open a new terminal and run:
```bash
cd client
npm run dev
```
Open `http://localhost:5173` to view your store.
