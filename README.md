<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# NBC RAG Backend

A comprehensive NestJS backend application for managing NBC papers, market reports, and user authentication with AI-powered content generation and retrieval capabilities.

## 🚀 Features

- **NBC Papers Management**: Upload, parse, and manage NBC papers with markdown content
- **Market Reports Generation**: AI-powered market reports for countries with structured content
- **User Authentication**: JWT-based authentication with registration, login, and profile management
- **Document Management**: ChromaDB integration for document storage and retrieval
- **AI Integration**: OpenAI integration for content generation and analysis
- **MongoDB Integration**: Robust data persistence with MongoDB Atlas

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key
- ChromaDB (optional, for document management)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nbc-rag-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key
   
   # MongoDB Configuration
   MONGODB_ATLAS_URI=your-mongodb-atlas-connection-string
   MONGODB_ATLAS_DB_NAME=infracredit
   MONGODB_ATLAS_COLLECTION_NAME=documents
   
   # ChromaDB Configuration (optional)
   CHROMA_URL=http://localhost:8000
   
   # Server Configuration
   PORT=8000
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-change-this-in-production
   ```

4. **Run the application**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run start:prod
   ```

## 🏗️ Project Structure

```
src/
├── app.module.ts              # Main application module
├── main.ts                    # Application bootstrap
├── auth/                      # JWT authentication module
├── documents/                 # Document management module
├── market-reports/            # Market reports module
├── nbc-papers/               # NBC papers module
├── users/                    # User management module
└── mongodb/                  # MongoDB service
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login User
```http
POST /users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Get User Profile
```http
GET /users/profile
Authorization: Bearer <jwt-token>
```

#### Refresh Token
```http
POST /users/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout
```http
POST /users/logout
Authorization: Bearer <jwt-token>
```

### NBC Papers Endpoints

All NBC papers endpoints require JWT authentication.

#### Create NBC Paper
```http
POST /nbc-papers/create
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Paper Title",
  "content": "# Section 1\nContent here\n\n## Subsection 1.1\nMore content",
  "author": "Author Name",
  "year": 2024
}
```

#### Get All NBC Papers
```http
GET /nbc-papers
Authorization: Bearer <jwt-token>
```

#### Get NBC Paper by ID
```http
GET /nbc-papers/:id
Authorization: Bearer <jwt-token>
```

#### Update NBC Paper
```http
PUT /nbc-papers/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content"
}
```

#### Update NBC Paper Section
```http
PUT /nbc-papers/:id/sections/:sectionKey
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Updated Section Title",
  "htmlContent": "<p>Updated HTML content</p>"
}
```

#### Regenerate NBC Paper Section
```http
POST /nbc-papers/:id/regenerate
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "sectionKey": "summary_table",
  "nbcPaper": {
    "companyName": "Company Name",
    "transactionType": "Transaction Type",
    "projectDetails": "Project details"
  }
}
```

### Market Reports Endpoints

All market reports endpoints require JWT authentication.

#### Create Market Report
```http
POST /market-reports
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "country": "Nigeria",
  "year": 2024
}
```

#### Get All Market Reports
```http
GET /market-reports
Authorization: Bearer <jwt-token>
```

#### Get Market Reports by Country
```http
GET /market-reports/country/:country
Authorization: Bearer <jwt-token>
```

#### Get Market Reports by Year
```http
GET /market-reports/year/:year
Authorization: Bearer <jwt-token>
```

#### Get Market Report by ID
```http
GET /market-reports/:id
Authorization: Bearer <jwt-token>
```

#### Update Market Report Section
```http
PATCH /market-reports/:id/sections/:sectionId
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "content": "Updated section content"
}
```

#### Update Market Report Subsection
```http
PATCH /market-reports/:id/sections/:sectionId/subsections/:subsectionId
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "content": "Updated subsection content"
}
```

#### Regenerate Market Report
```http
POST /market-reports/:id/regenerate
Authorization: Bearer <jwt-token>
```

#### Regenerate Market Report Section
```http
POST /market-reports/:id/sections/:sectionId/regenerate
Authorization: Bearer <jwt-token>
```

#### Regenerate Market Report Subsection
```http
POST /market-reports/:id/sections/:sectionId/subsections/:subsectionId/regenerate
Authorization: Bearer <jwt-token>
```

#### Delete Market Report
```http
DELETE /market-reports/:id
Authorization: Bearer <jwt-token>
```

### Document Management Endpoints

#### Get All Documents
```http
GET /documents
```

#### Get Document by ID
```http
GET /documents/:id
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes | - |
| `MONGODB_ATLAS_URI` | MongoDB Atlas connection string | Yes | - |
| `MONGODB_ATLAS_DB_NAME` | MongoDB database name | Yes | `infracredit` |
| `MONGODB_ATLAS_COLLECTION_NAME` | MongoDB collection name | Yes | `documents` |
| `CHROMA_URL` | ChromaDB URL | No | `http://localhost:8000` |
| `PORT` | Server port | No | `3000` |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_REFRESH_SECRET` | JWT refresh secret | Yes | - |

### Database Schema

#### User Schema
```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### NBC Paper Schema
```typescript
{
  title: string;
  content: Array<{
    title: string;
    content: string;
    parentSection?: string;
  }>;
  author: string;
  createdBy?: string; // User ID from JWT
  lastModifiedBy?: string; // User ID from JWT
  lastModifiedByEmail?: string; // User email from JWT
  companyName: string;
  transactionType: string;
  structuringLeads: string;
  sponsors: string;
  projectDetails: string;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Market Report Schema
```typescript
{
  country: string;
  year: number;
  content: Array<{
    title: string;
    content: string;
    subsections: Array<{
      title: string;
      content: string;
    }>;
  }>;
  author: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  lastModifiedBy?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚀 Usage Examples

### Creating a Market Report

```javascript
const response = await fetch('http://localhost:8000/market-reports/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    countryName: 'Nigeria',
    year: 2024
  })
});

const marketReport = await response.json();
console.log('Created market report:', marketReport);
```

### Creating an NBC Paper

```javascript
const response = await fetch('http://localhost:8000/nbc-papers/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    companyName: 'ABC Infrastructure Ltd',
    transactionType: 'Project Finance',
    structuringLeads: 'John Doe, Jane Smith',
    sponsors: 'ABC Holdings, XYZ Partners',
    projectDetails: 'Development of solar power plant in Northern Nigeria'
  })
});

const nbcPaper = await response.json();
console.log('Created NBC paper:', nbcPaper);
```

### Updating a Market Report Section

```javascript
const response = await fetch('http://localhost:8000/market-reports/report-id/sections/section-id', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    content: 'Updated section content with new information...'
  })
});

const updatedSection = await response.json();
console.log('Updated section:', updatedSection);
```

### Updating an NBC Paper Section

```javascript
const response = await fetch('http://localhost:8000/nbc-papers/paper-id/sections/summary_table', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    title: 'Document Header & Summary Table',
    htmlContent: '<p>Updated summary table content</p>'
  })
});

const updatedSection = await response.json();
console.log('Updated NBC paper section:', updatedSection);
```

### User Authentication Flow

```javascript
// 1. Register a new user
const registerResponse = await fetch('http://localhost:8000/users/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword',
    firstName: 'John',
    lastName: 'Doe'
  })
});

// 2. Login to get JWT token
const loginResponse = await fetch('http://localhost:8000/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword'
  })
});

const { accessToken, refreshToken } = await loginResponse.json();

// 3. Use the token for authenticated requests
const profileResponse = await fetch('http://localhost:8000/users/profile', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run test coverage
npm run test:cov
```

## 📦 Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build the application |
| `npm run start` | Start the application |
| `npm run start:dev` | Start in development mode with hot reload |
| `npm run start:debug` | Start in debug mode |
| `npm run start:prod` | Build and start in production mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage |

## 🔒 Security

- JWT-based authentication for protected endpoints
- Password hashing with bcrypt
- Input validation with class-validator
- CORS configuration (configure for production)
- Environment variable management

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Update all secrets and API keys
2. **CORS**: Configure CORS for your specific domain
3. **Database**: Ensure MongoDB Atlas is properly configured
4. **SSL**: Use HTTPS in production
5. **Rate Limiting**: Consider implementing rate limiting
6. **Logging**: Implement proper logging for production

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 8000

CMD ["node", "dist/main.js"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository or contact the development team.

## 🔄 Changelog

### Version 1.0.0
- Initial release with NBC papers management
- Market reports generation with AI
- User authentication system
- MongoDB integration
- JWT-based security
- Comprehensive API endpoints
