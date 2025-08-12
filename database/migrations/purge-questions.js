// Database migration script to purge all existing questions
// This script removes all question data while preserving user accounts and settings
// Run this script before importing new certamen questions

import { getDb } from '../databases.js';

export async function purgeAllQuestions() {
  const db = getDb();
  
  try {
    console.log('Starting database purge for certamen migration...');
    
    // Get collection references
    const tossups = db.collection('tossups');
    const bonuses = db.collection('bonuses');
    const packets = db.collection('packets');
    const sets = db.collection('sets');
    const questionStats = db.collection('questionStats');
    const userStats = db.collection('userStats');
    const reports = db.collection('reports');
    const stars = db.collection('stars');
    
    // Count existing questions for logging
    const tossupCount = await tossups.countDocuments();
    const bonusCount = await bonuses.countDocuments();
    const packetCount = await packets.countDocuments();
    const setCount = await sets.countDocuments();
    
    console.log(`Found ${tossupCount} tossups, ${bonusCount} bonuses, ${packetCount} packets, ${setCount} sets`);
    
    // Delete all question-related data
    console.log('Deleting tossups...');
    await tossups.deleteMany({});
    
    console.log('Deleting bonuses...');
    await bonuses.deleteMany({});
    
    console.log('Deleting packets...');
    await packets.deleteMany({});
    
    console.log('Deleting sets...');
    await sets.deleteMany({});
    
    console.log('Deleting question statistics...');
    await questionStats.deleteMany({});
    
    console.log('Deleting user statistics...');
    await userStats.deleteMany({});
    
    console.log('Deleting question reports...');
    await reports.deleteMany({});
    
    console.log('Deleting question stars...');
    await stars.deleteMany({});
    
    // Reset auto-increment counters if they exist
    // Note: MongoDB doesn't have auto-increment, but this is here for completeness
    
    console.log('Database purge completed successfully!');
    console.log('The database is now ready for certamen questions.');
    
    return {
      success: true,
      deleted: {
        tossups: tossupCount,
        bonuses: bonusCount,
        packets: packetCount,
        sets: setCount
      }
    };
    
  } catch (error) {
    console.error('Error during database purge:', error);
    throw error;
  }
}

export async function resetFrequencyStats() {
  const db = getDb();
  
  try {
    console.log('Resetting frequency statistics...');
    
    // Clear any cached frequency data
    const frequencyCache = db.collection('frequencyCache');
    if (await frequencyCache.countDocuments() > 0) {
      await frequencyCache.deleteMany({});
      console.log('Frequency cache cleared');
    }
    
    // Reset any frequency-related counters
    const frequencyCounters = db.collection('frequencyCounters');
    if (await frequencyCounters.countDocuments() > 0) {
      await frequencyCounters.deleteMany({});
      console.log('Frequency counters reset');
    }
    
    console.log('Frequency statistics reset completed');
    
  } catch (error) {
    console.error('Error resetting frequency stats:', error);
    throw error;
  }
}

export async function initializeCertamenCategories() {
  const db = getDb();
  
  try {
    console.log('Initializing certamen category structure...');
    
    // Create category metadata collection if it doesn't exist
    const categoryMetadata = db.collection('categoryMetadata');
    
    const certamenCategories = [
      {
        name: 'History',
        subcategories: ['Ancient History', 'Classical History', 'Roman History', 'Greek History', 'Other History'],
        description: 'Classical history and historical events',
        color: '#8B4513'
      },
      {
        name: 'Literature',
        subcategories: ['Classical Literature', 'Greek Literature', 'Roman Literature', 'Latin Literature', 'Other Literature'],
        description: 'Classical literature and texts',
        color: '#2E8B57'
      },
      {
        name: 'Language',
        subcategories: ['Latin', 'Greek', 'Classical Languages', 'Linguistics', 'Other Language'],
        description: 'Classical languages and linguistics',
        color: '#4682B4'
      },
      {
        name: 'Culture',
        subcategories: ['Classical Culture', 'Roman Culture', 'Greek Culture', 'Daily Life', 'Other Culture'],
        description: 'Classical culture and daily life',
        color: '#CD853F'
      },
      {
        name: 'Mythology',
        subcategories: ['Greek Mythology', 'Roman Mythology', 'Classical Mythology', 'Other Mythology'],
        description: 'Classical mythology and legends',
        color: '#DAA520'
      }
    ];
    
    // Clear existing category metadata
    await categoryMetadata.deleteMany({});
    
    // Insert new certamen categories
    await categoryMetadata.insertMany(certamenCategories);
    
    console.log('Certamen categories initialized successfully');
    
    return certamenCategories;
    
  } catch (error) {
    console.error('Error initializing certamen categories:', error);
    throw error;
  }
}

// Main migration function
export async function runCertamenMigration() {
  try {
    console.log('=== Starting Certamen Migration ===');
    
    // Step 1: Purge all questions
    await purgeAllQuestions();
    
    // Step 2: Reset frequency statistics
    await resetFrequencyStats();
    
    // Step 3: Initialize new category structure
    await initializeCertamenCategories();
    
    console.log('=== Certamen Migration Completed Successfully ===');
    console.log('The database is now ready for certamen questions.');
    console.log('Use the admin import tools to add new content.');
    
  } catch (error) {
    console.error('=== Certamen Migration Failed ===');
    console.error('Error:', error);
    throw error;
  }
}

// Export for direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runCertamenMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}