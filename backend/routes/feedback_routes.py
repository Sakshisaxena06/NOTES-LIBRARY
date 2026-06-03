import datetime
from flask import Blueprint, jsonify, request
from config.db import feedback_collection

feedback_bp = Blueprint("feedback_bp", __name__)

@feedback_bp.route("/api/feedback", methods=["POST"])
def submit_feedback():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    rollno = data.get("rollno", "").strip()
    description = data.get("description", "").strip()

    if not name or not description:
        return jsonify({"error": "Name and description are required."}), 400

    feedback_doc = {
        "name": name,
        "rollno": rollno,
        "description": description,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    feedback_collection.insert_one(feedback_doc)
    return jsonify({"success": True, "message": "Feedback submitted successfully."})

@feedback_bp.route("/api/feedback", methods=["GET"])
def get_feedback():
    feedbacks = list(feedback_collection.find({}, {"_id": 0}).sort("timestamp", 1))
    return jsonify({"success": True, "feedback": feedbacks})
