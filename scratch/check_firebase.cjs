const admin = require('firebase-admin');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT='(.*?)'/);

if (!match) {
    console.error("Could not find FIREBASE_SERVICE_ACCOUNT in .env.local");
    process.exit(1);
}

const serviceAccount = JSON.parse(match[1]);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function check() {
    console.log("Checking project ID:", serviceAccount.project_id);
    const snap = await db.collection('services').limit(5).get();
    console.log(`Found ${snap.size} services in 'services' collection.`);
    if (snap.size > 0) {
        console.log("Sample document:");
        console.dir(snap.docs[0].data());
    }

    const catSnap = await db.collection('categories').limit(5).get();
    console.log(`Found ${catSnap.size} categories in 'categories' collection.`);
}

check().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
