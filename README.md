# Bento Social

## Project Structure

This repository contains the following main components:

- **[bento-social-be](./bento-social-be)**: The backend API service built with NestJS, Prisma, PostgreSQL, and Redis.
- **[bento-social-fe](./bento-social-fe)**: The frontend application built with Next.js and TailwindCSS.

## Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js**: (v18 or later recommended)
- **pnpm**: (Package manager)
- **Docker & Docker Compose**: (For running database and cache services)

## Getting Started

Follow these steps to get the entire system up and running locally.

### 1. Backend Setup

The backend requires a PostgreSQL database and a Redis instance, which are orchestrated via Docker Compose.

1.  Navigate to the backend directory:

    ```bash
    cd bento-social-be
    ```

2.  Install dependencies:

    ```bash
    pnpm install
    ```

3.  Start the infrastructure services (Postgres & Redis):

    ```bash
    docker-compose up -d
    ```

4.  Set up the database schema:

    ```bash
    # Run migrations
    pnpx prisma migrate dev

    # Generate Prisma client
    pnpx prisma generate
    ```

5.  Start the backend server:
    ```bash
    pnpm start
    ```
    The API should now be running (default port is usually 3000 or 4000, check `bento-social-be/.env` or logs).

### 2. Frontend Setup

1.  Open a new terminal and navigate to the frontend directory:

    ```bash
    cd bento-social-fe
    ```

2.  Install dependencies:

    ```bash
    pnpm install
    ```

3.  Start the development server:

    ```bash
    pnpm dev
    ```

4.  Open your browser and navigate to:
    [http://localhost:3000](http://localhost:3000)

## Features

- **User Authentication**: Secure login and registration.
- **Social Feed**: Post updates and view feeds.
- **Modern UI**: Responsive design with TailwindCSS.
- **Robust Backend**: Type-safe database interactions with Prisma.
