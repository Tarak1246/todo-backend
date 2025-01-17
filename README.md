# Todo Backend

## Prerequisites

- Node.js
- MySQL database

## Setup

1. Clone the repository:
git clone https://github.com/Tarak1246/todo-backend.git

2. Install dependencies:
npm install

3. Configure the database:
Create a `.env` file in the root directory:
  DATABASE_URL="mysql://user:password@localhost:3306/todo"

4. Initialize the database:
npx prisma migrate dev --name init

5. Start the server:
npm run dev

6. API will be available at `http://localhost:5000`.
