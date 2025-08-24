# wplace-livechat

Live chat API for wplace.

This project provides a real-time chat API using Node.js, Express, and Server-Sent Events (SSE). It uses Prisma as an ORM for a PostgreSQL database.

## Technology Stack

*   **Backend:** Node.js, Express.js
*   **Real-time Communication:** Server-Sent Events (SSE)
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Deployment:** Vercel

## API Endpoints

All endpoints are relative to the base URL.

*   `GET /`: A simple health check endpoint.
    *   Returns `{"status": 200}`
*   `GET /messages/:region`: Fetches the chat history for a specific region.
*   `GET /users/:region`: Fetches the list of users in a specific region.
*   `POST /send`: Sends a message to a specific region.
    *   **Body (JSON):**
        ```json
        {
          "uid": "string",
          "name": "string",
          "region": "string",
          "messages": "string"
        }
        ```
*   `GET /events/:region`: Establishes an SSE connection for receiving real-time messages for a specific region.

## Getting Started

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm
*   A PostgreSQL database

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mininxd/wplace-livechat.git
    cd wplace-livechat
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following variables.

    ```env
    # Connection URL for your PostgreSQL database
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

    # Direct connection URL for Prisma migrations
    DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```

4.  **Apply database migrations:**
    ```bash
    npx prisma migrate dev
    ```

5.  **Start the server:**
    ```bash
    npm start
    ```
    The server will be running on `http://localhost:3000`.

## Database Schema

The database schema is defined in `prisma/schema.prisma`. It consists of a single model: `users`.

```prisma
model users {
  id        String   @id @default(uuid())
  uid       String   @db.VarChar(16)
  name      String   @db.VarChar(16)
  region    String   @db.VarChar(32)
  messages  String   @db.VarChar(128)
  createdAt DateTime @default(now())
}
```
**Note:** A new record is created in this table for each message sent.

## Deployment

This project is configured for deployment on [Vercel](https://vercel.com/). The `vercel.json` file in the repository contains the deployment configuration.
