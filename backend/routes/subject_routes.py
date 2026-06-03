from flask import Blueprint, jsonify, request
from backend.config.db import subjects_collection

subject_bp = Blueprint("subject_bp", __name__)




@subject_bp.route("/api/subjects", methods=["GET"])
def get_subjects():
    subjects = list(subjects_collection.find({}, {"_id": 0}))
   
    return jsonify({"success": True, "subjects": subjects})


@subject_bp.route("/api/subjects", methods=["POST"])
def add_subject():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    icon = data.get("icon", "book")

    if not name:
        return jsonify({"error": "Subject name is required."}), 400

    if subjects_collection.find_one({"name": name}):
        return jsonify({"error": "Subject already exists."}), 400

    subjects_collection.insert_one({"name": name, "icon": icon, "class": name.lower().replace(" ", "-")})
    return jsonify({"success": True, "message": "Subject added successfully."})


@subject_bp.route("/api/subjects/<subject_name>", methods=["PUT"])
def update_subject(subject_name):
    data = request.get_json(silent=True) or {}
    new_name = (data.get("name") or "").strip()

    if not new_name:
        return jsonify({"error": "New subject name is required."}), 400

    result = subjects_collection.update_one(
        {"name": subject_name},
        {"$set": {"name": new_name, "class": new_name.lower().replace(" ", "-")}},
    )
    if result.matched_count == 0:
        return jsonify({"error": "Subject not found."}), 404

    return jsonify({"success": True, "message": "Subject updated successfully."})


@subject_bp.route("/api/subjects/<subject_name>", methods=["DELETE"])
def delete_subject(subject_name):
    result = subjects_collection.delete_one({"name": subject_name})
    if result.deleted_count == 0:
        return jsonify({"error": "Subject not found."}), 404
    return jsonify({"success": True, "message": "Subject deleted successfully."})
