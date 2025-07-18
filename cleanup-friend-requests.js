const { db } = require('./server/db.ts');
const { friendRequests } = require('./shared/schema.ts');

async function cleanupDuplicateFriendRequests() {
  try {
    // Get all friend requests
    const requests = await db.select().from(friendRequests);
    console.log(`Found ${requests.length} friend requests`);
    
    // Group requests by user pairs to find duplicates
    const userPairs = new Map();
    const duplicates = [];
    
    for (const request of requests) {
      const key1 = `${request.requesterId}-${request.requestedId}`;
      const key2 = `${request.requestedId}-${request.requesterId}`;
      
      if (userPairs.has(key1) || userPairs.has(key2)) {
        duplicates.push(request);
      } else {
        userPairs.set(key1, request);
      }
    }
    
    console.log(`Found ${duplicates.length} duplicate requests`);
    
    // Delete duplicate requests
    for (const duplicate of duplicates) {
      await db.delete(friendRequests).where(eq(friendRequests.id, duplicate.id));
      console.log(`Deleted duplicate request: ${duplicate.id}`);
    }
    
    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupDuplicateFriendRequests();