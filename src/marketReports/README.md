# Market Reports API

This module provides comprehensive market report management functionality with support for nested sections and subsections. **All endpoints require JWT authentication.**

## Authentication

All market reports endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-access-token>
```

## Features

- **JWT Authentication Required** - All operations require valid authentication
- **User Tracking** - All operations track who performed the action
- **Nested Content Structure** - Sections with subsections support
- **AI-Powered Generation** - Automatic content generation using GPT-4
- **Content Updates** - Granular section and subsection updates
- **Regeneration** - AI-powered content regeneration

## User Tracking

The API automatically tracks user information for all operations:

- **Author** - Set automatically from JWT token when creating reports
- **Last Modified By** - Tracked for all updates and regenerations
- **User ID** - Stored for audit purposes

## Endpoints

### Get Market Reports
- `GET /market-reports` - Get all market reports
- `GET /market-reports?year=2024` - Get market reports by year
- `GET /market-reports?country=Nigeria` - Get market reports by country
- `GET /market-reports/:id` - Get a specific market report by ID

### Create Market Report
- `POST /market-reports/create` - Create a new market report

### Update Market Report Sections

#### Update Entire Section
- `PUT /market-reports/:id/sections/:sectionTitle` - Update a complete section
- `PATCH /market-reports/:id/sections/:sectionTitle` - Partially update a section

**Request Body:**
```json
{
  "title": "Updated Section Title",
  "htmlContent": "<p>Updated HTML content</p>",
  "subsections": [
    {
      "title": "Subsection 1",
      "htmlContent": "<p>Subsection content</p>"
    }
  ]
}
```

#### Update Subsection
- `PUT /market-reports/:id/sections/:sectionTitle/subsections/:subsectionTitle` - Update a specific subsection
- `PATCH /market-reports/:id/sections/:sectionTitle/subsections/:subsectionTitle` - Partially update a subsection

**Request Body:**
```json
{
  "title": "Updated Subsection Title",
  "htmlContent": "<p>Updated subsection content</p>"
}
```

#### Manage Subsections
- `POST /market-reports/:id/sections/:sectionTitle/subsections` - Add a new subsection to a section
- `DELETE /market-reports/:id/sections/:sectionTitle/subsections/:subsectionTitle` - Remove a subsection from a section

### Regenerate Market Reports

#### Regenerate Entire Report
- `POST /market-reports/:id/regenerate` - Regenerate the entire market report using AI

#### Regenerate Specific Section
- `POST /market-reports/:id/sections/:sectionKey/regenerate` - Regenerate a specific section using AI

#### Regenerate Specific Subsection
- `POST /market-reports/:id/sections/:sectionKey/subsections/:subsectionKey/regenerate` - Regenerate a specific subsection using AI

**Available Section Keys:**
- `snapshot` - Summary Statistics
- `financial_system_overview` - Overview of Financial System
- `fixed_income_markets` - Fixed Income Markets
- `foreign_exchange` - Foreign Exchange
- `derivatives` - Derivatives
- `foreign_participation` - Participation of Foreign Investors and Issuers
- `clearing_and_settlement` - Clearing and Settlement
- `investment_taxation` - Investment Taxation
- `key_contacts` - Key Contacts

**Available Subsection Keys:**
- `bank_and_non_bank_financial_sector` - Bank and Non-Bank Financial Sector
- `capital_market` - Capital Market
- `government_securities` - Government Securities
- `non_central_government_issuance` - Non-Central Government Issuance
- `secondary_market` - Secondary Market

## Data Structure

Market reports have the following content structure:

```typescript
interface MarketReportSection {
  title: string;
  htmlContent?: string; // Main body content
  subsections?: {
    title: string;
    htmlContent: string;
  }[];
}
```

## Example Usage

### Create a Market Report
```bash
curl -X POST http://localhost:3000/market-reports/create \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "countryName": "Nigeria",
    "year": 2024,
    "description": "Comprehensive market analysis for Nigeria"
  }'
```

### Get All Market Reports
```bash
curl -X GET http://localhost:3000/market-reports \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Update a Section's Main Content
```bash
curl -X PUT http://localhost:3000/market-reports/507f1f77bcf86cd799439011/sections/snapshot \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summary Statistics",
    "htmlContent": "<p>Updated summary statistics content</p>"
  }'
```

### Regenerate a Section
```bash
curl -X POST http://localhost:3000/market-reports/507f1f77bcf86cd799439011/regenerate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "sectionKey": "snapshot",
    "marketPaper": {
      "title": "Summary Statistics",
      "htmlContent": "<p>Updated content</p>"
    }
  }'
```

## Response Examples

### Create Market Report Response
```json
{
  "success": true,
  "marketReport": {
    "id": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "author": "John Doe (john.doe@example.com)"
  }
}
```

### Update Section Response
```json
{
  "success": true,
  "message": "Section \"Summary Statistics\" updated successfully",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "lastModifiedBy": "john.doe@example.com"
}
```

## Error Handling

The API returns appropriate error messages for:
- Market report not found
- Section not found
- Subsection not found
- Invalid data format

All successful operations return a response with:
- `success: true`
- `message`: Description of the operation
- `updatedAt`: Timestamp of the update 