# Delicious Recipes App 🍳

A robust, full-featured recipe application built with **Angular (Standalone Components)**. This application allows users to search for recipes, manage a weekly meal plan, save favorites, and create their own custom recipes. It features a complete authentication system and an admin dashboard.

The app is designed with a **fail-safe architecture**: if the external API limit is reached, it seamlessly falls back to local data served by JSON-Server.

## ✨ Features

* **Recipe Search**:
    * **Basic Search**: Quick keyword search.
    * **Advanced Search**: Filter by diet (Vegetarian, Keto, etc.), intolerances (Dairy, Peanut), and ingredients.
* **User Management**:
    * User Registration & Login (JWT-style simulation).
    * Profile Management (Update info, password).
    * **Admin Dashboard**: User management, content moderation (reviews), and analytics.
* **Personalization**:
    * **Favorites**: Save recipes to your profile.
    * **Meal Planner**: Generate a 7-day meal plan based on calories and diet.
    * **Custom Recipes**: Create, edit, and delete your own recipes.
* **Social**:
    * Rate and Review recipes.
    * Share recipes (Web Share API / Clipboard).
* **Robust Data Handling**:
    * Fetches live data from **Spoonacular API**.
    * Falls back to local **JSON-Server** when API is unavailable.

## 🛠️ Tech Stack

* **Frontend**: Angular 17+ (Standalone Components, Signals, RxJS).
* **Styling**: Bootstrap 5, Bootstrap Icons, Custom CSS.
* **Mock Backend**: JSON-Server (REST API for Users, Favorites, Reviews, Custom Recipes).
* **External API**: Spoonacular API.

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Clone the repository
```bash
git clone [https://github.com/YOUR_USERNAME/recipe-app.git](https://github.com/YOUR_USERNAME/recipe-app.git)
cd recipe-app
```

### 2. Install dependencies
```bash
npm install
``` 
### 3. Configure API Key
1.  Get a free API Key from [Spoonacular](https://spoonacular.com/food-api).
2.  Open `src/app/services/recipe.service.ts`.
3.  Replace the `apiKey` variable with your key:
    ```typescript
    private apiKey = 'YOUR_REAL_API_KEY_HERE';
    ```

### 4. Run the Project
Open a terminal and run:
```bash
npm start
```
This will concurrently start the Angular development server and JSON-Server.
The app will be available at `http://localhost:4200`.
JSON-Server will be available at `http://localhost:3000`.

## 🔑 Demo Credentials

You can use these accounts to test the application immediately:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `admin123` |
| **User** | `demo@example.com` | `demo123` |

*(Note: Data is persisted in `db.json`. You can register new users freely.)*

## 📂 Project Structure

* `src/app/services`: Contains logic for API calls, Authentication, and Favorites.
* `src/app/guards`: Route guards for Admin and Authenticated routes.
* `src/app/admin`: Admin-specific components (Dashboard).
* `src/app/shared`: Reusable components like Recipe Card.

## 🛡️ License

This project is for educational purposes.
