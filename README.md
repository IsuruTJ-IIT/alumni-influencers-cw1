# Alumni Influencers System (Coursework 1)

A web-based platform built for universities and their alumni. This system allows alumni to manage their professional profiles and bid for featured spots, while enabling universities to view analytics and manage their alumni networks.

## Technologies Used

* **Backend:** Node.js, Express.js
* **Database:** MySQL
* **Frontend:** EJS (Embedded JavaScript templates), Tailwind CSS (via CDN)
* **Authentication:** Bcrypt, Express Session

## Prerequisites

* Node.js installed
* MySQL database server running

## Setup Instructions

1. **Clone or Download the Repository**

2. **Install Dependencies**
   Navigate to the project folder and run:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   * Copy the `.env.example` file and rename it to `.env`.
   * Update the values in `.env` with your actual database credentials and preferred settings.
   * Example:
     ```env
     DB_HOST=localhost
     DB_USER=root
     DB_PASS=yourpassword
     DB_NAME=alumni_db
     APP_BASE_URL=http://localhost:3000
     ```

4. **Database Setup**
   * Run the SQL scripts provided in the `sql/` directory to create the necessary tables and seed initial data.

5. **Start the Application**
   For development (uses nodemon to auto-restart on changes):
   ```bash
   npm run dev
   ```
   For production:
   ```bash
   npm start
   ```

6. **Access the App**
   Open your browser and navigate to: `http://localhost:3000`

## User Roles

The system features three distinct user roles:

1. **Alumnus:** Can manage their professional profile, add degrees/certifications, and place bids to become the featured alumnus of the day.
2. **University:** Has access to a comprehensive analytics dashboard and can search the alumni database.
3. **Developer:** Has access to API tokens, Swagger API documentation, local outbox (for simulated emails), and manual winner selection controls for testing.

## Notes for Testing

* **Email Verification:** Since this is a local setup, actual emails are not sent. You can view generated email links (like verification or password reset links) by logging into a Developer account and checking the **Local Outbox**.
* **Winner Selection:** The system features an automatic scheduler. However, Developers have access to manual testing controls to trigger the selection algorithms instantly without waiting for the scheduled times.
