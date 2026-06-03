"""
MongoDB connection and collection exports.
Import from here instead of creating new connections everywhere.
"""

import os
from pymongo import MongoClient

# --- Connection ---
# Make sure to import load_dotenv in app.py before importing this module,
# or provide a default fallback if you prefer.
MONGO_URI = os.environ.get("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["notesLibrary"]

# --- Collections ---
students_collection = db["students"]
subjects_collection = db["subjects"]
feedback_collection = db["feedback"]
pdfs_collection = db["pdfs"]


# --- Helpers ---
def load_students():
    """Fetch all students from MongoDB, keyed by roll number."""
    students = students_collection.find({}, {"_id": 0})
    return {s["rollno"].strip(): s for s in students}