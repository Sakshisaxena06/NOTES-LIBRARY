from flask import Blueprint, jsonify, request
from backend.config.db import students_collection

student_bp = Blueprint("student_bp", __name__)


@student_bp.route("/api/student/profile/<rollno>", methods=["GET"])
def get_student_profile(rollno):
    roll = rollno.strip()
    student = students_collection.find_one(
        {"rollno": roll}, {"_id": 0, "rollno": 1, "name": 1}
    )
    if not student:
        return jsonify({"error": "Student not found"}), 404
    return jsonify({
        "success": True,
        "rollno": student.get("rollno"),
        "name": student.get("name"),
        
        "course": "Btech(Computer Science)",
    })


@student_bp.route("/api/student-stats-full/<rollno>", methods=["GET"])
def get_student_stats_full(rollno):
    roll = rollno.strip()
    student = students_collection.find_one(
        {"rollno": roll}, {"_id": 0, "rollno": 1, "favourites": 1, "downloads": 1}
    )
    if not student:
        return jsonify({"error": "Student not found"}), 404
    return jsonify({
        "success": True,
        "favourites": student.get("favourites", []),
        "downloads": student.get("downloads", []),
    })


@student_bp.route("/api/student-stats/<rollno>", methods=["GET"])
def get_student_stats(rollno):
    roll = rollno.strip()
    student = students_collection.find_one(
        {"rollno": roll}, {"_id": 0, "rollno": 1, "favourites": 1, "downloads": 1}
    )
    if not student:
        return jsonify({"error": "Student not found"}), 404
    favourites = student.get("favourites", [])
    downloads = student.get("downloads", [])
    return jsonify({
        "success": True,
        "favourites_count": len(favourites),
        "downloads_count": len(downloads),
    })


@student_bp.route("/api/student-stats/<rollno>", methods=["POST"])
def update_student_stats(rollno):
    roll = rollno.strip()
    data = request.get_json(silent=True) or {}
    action = data.get("action")
    filename = (data.get("filename") or "").strip()

    if not action or not filename:
        return jsonify({"error": "action and filename are required."}), 400

    student = students_collection.find_one({"rollno": roll})
    if not student:
        return jsonify({"error": "Student not found"}), 404

    if action == "add_fav":
        students_collection.update_one({"rollno": roll}, {"$addToSet": {"favourites": filename}})
    elif action == "remove_fav":
        students_collection.update_one({"rollno": roll}, {"$pull": {"favourites": filename}})
    elif action == "add_download":
        students_collection.update_one({"rollno": roll}, {"$addToSet": {"downloads": filename}})
    else:
        return jsonify({"error": "Invalid action."}), 400

    updated = students_collection.find_one({"rollno": roll}, {"_id": 0, "favourites": 1, "downloads": 1})
    return jsonify({
        "success": True,
        "favourites_count": len(updated.get("favourites", [])),
        "downloads_count": len(updated.get("downloads", [])),
    })
