const { MongoClient } = require('mongodb');
require('dotenv').config();

const dbURL = process.env.DB_URL;
const dbName = process.env.DB_NAME;

const sampleBoard = {
    "title": "Robot dev proj",
    "archivedAt": 1589983468418,
    "isStarred": false,
    "createdBy": {
        "_id": "m102",
        "fullname": "Idan David",
        "imgUrl": "https://res.cloudinary.com/du63kkxhl/image/upload/v1673820094/%D7%A2%D7%99%D7%93%D7%9F_jranbo.jpg"
    },
    "labels": [
        { "id": "l101", "title": "Done", "color": "#00c875" },
        { "id": "l102", "title": "Progress", "color": "#fdab3d" },
        { "id": "l103", "title": "Stuck", "color": "#e2445c" },
        { "id": "l104", "title": "Low", "color": "#ffcb00" },
        { "id": "l105", "title": "Medium", "color": "#a25ddc" },
        { "id": "l106", "title": "High", "color": "#e2445c" },
        { "id": "l107", "title": "", "color": "#c4c4c4" }
    ],
    "members": [
        { "_id": "m101", "fullname": "Tal Tarablus", "imgUrl": "https://res.cloudinary.com/du63kkxhl/image/upload/v1673788222/cld-sample.jpg" },
        { "_id": "m102", "fullname": "Idan David", "imgUrl": "https://res.cloudinary.com/du63kkxhl/image/upload/v1673820094/%D7%A2%D7%99%D7%93%D7%9F_jranbo.jpg" }
    ],
    "groups": [
        {
            "id": "g101",
            "title": "Group 1",
            "tasks": [
                {
                    "id": "c101",
                    "title": "Replace logo",
                    "status": "Stuck",
                    "priority": "Medium",
                    "memberIds": ["m101", "m102"],
                    "dueDate": Date.now(),
                    "comments": []
                }
            ],
            "color": '#66ccff'
        }
    ],
    "activities": [],
    "cmpsOrder": ["member-picker", "status-picker", "date-picker", 'priority-picker']
};

async function seed() {
    const client = new MongoClient(dbURL);
    try {
        await client.connect();
        console.log('Connected to DB');
        const db = client.db(dbName);
        const collection = db.collection('board');
        
        await collection.deleteMany({});
        await collection.insertOne(sampleBoard);
        console.log('Sample board inserted');
    } catch (err) {
        console.error('Error seeding DB:', err);
    } finally {
        await client.close();
    }
}

seed();
