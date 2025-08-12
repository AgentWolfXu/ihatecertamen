# ihatecertamen Deployment Instructions

## Overview
This document provides step-by-step instructions for deploying the refactored ihatecertamen application. The application has been converted from a quiz bowl system to a certamen-focused platform with 5 specific categories: History, Literature, Language, Culture, and Mythology.

## Prerequisites
- Node.js 18+ installed
- MongoDB database access
- Admin privileges for database operations

## Pre-Deployment Steps

### 1. Database Backup (IMPORTANT)
Before proceeding, create a complete backup of your existing database:
```bash
# MongoDB backup command
mongodump --db qbreader --out ./backup-$(date +%Y%m%d)
```

### 2. Environment Variables
Ensure your `.env` file contains the necessary configuration:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/qbreader
# Note: Keep the database name as 'qbreader' for backend compatibility

# Authentication
SECRET_KEY_1=your_secret_key_1
SECRET_KEY_2=your_secret_key_2

# Email (if using)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

## Deployment Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build Frontend Assets
```bash
npm run build
```

### Step 3: Run Database Migration
Execute the database migration script to purge all existing questions and initialize the new category structure:

```bash
# Run the migration script
node database/migrations/purge-questions.js
```

**WARNING**: This will permanently delete ALL existing questions from your database. Ensure you have a backup before proceeding.

### Step 4: Start the Application
```bash
npm start
```

## Post-Deployment Verification

### 1. Check Application Status
- Navigate to `http://localhost:3000` (or your configured port)
- Verify the application loads with "ihatecertamen" branding
- Confirm the navigation shows only the preserved features

### 2. Verify Database State
- The database should be completely empty of questions
- New category structure should be initialized
- User accounts and settings should be preserved

### 3. Test Admin Interface
- Navigate to `/admin/question-management/`
- Verify the import interface is accessible
- Check that category management shows the 5 certamen categories

### 4. Test Core Functionality
- Verify singleplayer mode works (will show empty state initially)
- Confirm multiplayer rooms can be created
- Test DBExplorer and Frequency List (will be empty initially)

## Importing Initial Content

### 1. Use Sample Questions
A sample file `sample-certamen-questions.json` is provided with 10 example questions covering all categories.

### 2. Import via Admin Interface
1. Navigate to `/admin/question-management/`
2. Upload the sample JSON file
3. Review validation results
4. Confirm import

### 3. Verify Import
- Check that questions appear in the database
- Verify category distribution
- Test search functionality

## Category System

The application now supports exactly these 5 categories:

### History
- Ancient History
- Classical History
- Roman History
- Greek History
- Other History

### Literature
- Classical Literature
- Greek Literature
- Roman Literature
- Latin Literature
- Other Literature

### Language
- Latin
- Greek
- Classical Languages
- Linguistics
- Other Language

### Culture
- Classical Culture
- Roman Culture
- Greek Culture
- Daily Life
- Other Culture

### Mythology
- Greek Mythology
- Roman Mythology
- Classical Mythology
- Other Mythology

## API Endpoints

### Preserved Endpoints
- `/api/query` - Question search
- `/api/random-tossup` - Random question retrieval
- `/api/check-answer` - Answer validation
- `/api/multiplayer/*` - Multiplayer functionality
- `/api/db-explorer/*` - Database exploration
- `/api/frequency-list/*` - Frequency analysis

### New Endpoints
- `/api/admin/import-questions` - Question import
- `/api/admin/import-questions/schema` - Import schema

### Removed Endpoints
- `/api/geoword/*` - All geoword functionality
- `/api/webhook` - MODAQ integration
- Various deprecated endpoints

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
- Verify MongoDB is running
- Check connection string in `.env`
- Ensure database user has proper permissions

#### 2. Import Failures
- Verify JSON format matches schema
- Check category and subcategory values
- Review validation error messages

#### 3. Empty Database Issues
- Confirm migration script completed successfully
- Check for any error messages during migration
- Verify collections exist but are empty

#### 4. Frontend Branding Issues
- Clear browser cache
- Verify webpack build completed successfully
- Check for JavaScript errors in browser console

### Logs and Debugging
- Application logs are output to console
- Check MongoDB logs for database issues
- Review browser developer tools for frontend errors

## Rollback Procedure

If you need to rollback to the previous version:

1. **Stop the application**
2. **Restore database from backup**:
   ```bash
   mongorestore --db qbreader ./backup-[date]
   ```
3. **Revert code changes** (restore from git)
4. **Restart with previous version**

## Performance Considerations

### Empty Database Performance
- Initial page loads may be faster due to empty database
- Search queries will return quickly with no results
- Admin operations will be very fast initially

### Post-Import Performance
- Monitor database performance as content grows
- Consider adding database indexes for large question sets
- Implement pagination for large result sets

## Security Notes

### Admin Access
- Admin interface requires proper authentication
- Import functionality is restricted to admin users
- Database reset operations require confirmation

### Data Validation
- All imported questions are validated against schema
- Category and subcategory values are strictly enforced
- HTML content in answers is sanitized

## Support and Maintenance

### Regular Tasks
- Monitor database size and performance
- Review import logs for errors
- Backup database regularly
- Update question content as needed

### Monitoring
- Watch for import failures
- Monitor user activity and feedback
- Track database growth and performance metrics

## Conclusion

The refactored ihatecertamen application is now ready for use with:
- Clean, certamen-focused category system
- Empty database ready for new content
- Preserved core functionality
- New admin tools for content management

The application will start with no questions and must be populated through the admin import system. All existing quiz bowl content has been removed to ensure a clean transition to certamen format.