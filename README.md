
# 📞 Contact Management API

A robust and scalable **Node.js** API service for managing contacts and orders, built using **Express.js**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**. This backend efficiently identifies and links duplicate contacts, manages orders, and features a CI/CD pipeline for seamless deployment to Render.

---

## 🚀 Features

- 🔍 Contact identification and merging logic
- 🔗 Automatic primary/secondary contact resolution
- 🧾 Order creation and retrieval for each contact
- 🔄 RESTful API architecture
- ⚙️ Prisma ORM with PostgreSQL
- 🧠 Type-safe development with TypeScript
- 🧪 GitHub Actions CI/CD pipeline
- ☁️ Auto-deployment to [Render](https://render.com)

---

## 👨‍💻 Developer

**Saurabh Kumar**  
Full Stack Developer | Mobile & Backend Specialist  
📍 Tech Stack: Flutter, Node.js, PostgreSQL, Prisma, AWS, Firebase, Render
🌐 Portfolio: [@saurabh-codes](https://saurabh-codes.onrender.com)  
🔗 GitHub: [@SaurHub123](https://github.com/SaurHub123)


---

## 📦 Tech Stack

| Layer        | Tech Used               |
|--------------|--------------------------|
| Runtime      | Node.js (v18+)           |
| Framework    | Express.js               |
| Language     | TypeScript               |
| ORM          | Prisma                   |
| Database     | PostgreSQL               |
| CI/CD        | GitHub Actions           |
| Hosting      | Render                   |

---

## 🧰 Prerequisites

- Node.js v18 or higher
- PostgreSQL database
- npm or yarn

---

## 🔐 Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/your_database"
PORT=3000
````

---

## ⚙️ Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/SaurHub123/Bitespeed.git
cd Bitespeed

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npx prisma migrate dev

# 5. Start development server
npm run dev
```

---

## 📑 API Documentation

### Base URL

```
https://bitespeed-dpa8.onrender.com
```

---

### 📍 POST `/identify` — Identify Contact

Identifies a contact by checking if the given email or phoneNumber exists.

**Request:**

```json
{
  "email": "example@email.com",
  "phoneNumber": "9999999999"
}
```

**Response:**

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["example@email.com"],
    "phoneNumbers": ["9999999999"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

### 📝 POST `/order` — Create Order

Creates a new order for the given contact.

**Request:**

```json
{
  "contactId": 1,
  "orderDetails": {
    "items": [
      {
        "productId": "123",
        "quantity": 2,
        "price": 1000
      }
    ],
    "totalAmount": 2000
  }
}
```

**Response:**

```json
{
  "id": 1,
  "contactId": 1,
  "orderDetails": {
    "items": [...],
    "totalAmount": 2000
  },
  "createdAt": "2024-03-20T10:00:00Z"
}
```

---

### 📦 GET `/order/:contactId` — Get Orders by Contact

Retrieves all orders associated with a specific contact.

**Response:**

```json
[
  {
    "id": 1,
    "contactId": 1,
    "orderDetails": {...},
    "createdAt": "2024-03-20T10:00:00Z"
  }
]
```

---

## ❌ Error Handling

**Example Error Response:**

```json
{
  "error": "Email or phone number is required"
}
```

**Common Status Codes:**

* ✅ 200 — OK
* ✅ 201 — Created
* ❌ 400 — Bad Request
* ❌ 404 — Not Found
* ❌ 500 — Internal Server Error

---

## 🔄 CI/CD Pipeline

The project uses **GitHub Actions** to automate testing, building, and deployment on every push to the `prod` branch.

### ✅ CI Tasks

* Linting
* TypeScript checks
* Unit/Integration testing
* Prisma migrations

### 🚀 CD Pipeline

* Automatically deploys to [Render](https://render.com) using Deploy Hooks

### `.github/workflows/deploy.yml`

```yaml
name: Deploy to Render

on:
  push:
    branches:
      - prod

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run TypeScript build
        run: npm run build

      - name: Run Prisma migration
        run: npx prisma migrate deploy

      - name: Deploy to Render
        run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

> Make sure you add your **Render Deploy Hook URL** to your GitHub repository secrets as `RENDER_DEPLOY_HOOK`.

---

## 🧪 Testing

To run tests (if available):

```bash
npm test
```

---

## 🤝 Contributing

We welcome contributions!

```bash
# Fork the repository
git clone https://github.com/your-username/Bitespeed.git

# Create your feature branch
git checkout -b feature/YourFeature

# Make changes and commit
git commit -m "Added new feature"

# Push your branch
git push origin feature/YourFeature

# Open a Pull Request
```

---

## 📝 License

This project is licensed under the MIT License.
See the [LICENSE](./LICENSE) file for full details.

---

## 🏁 Project Status

✅ Stable & In Production
🛠️ New features in development
📦 Actively maintained

