from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from backend.config.db import students_collection, load_students

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/api/student/<rollno>")
def get_student_by_roll(rollno):
    roll = rollno.strip()
    student = students_collection.find_one({"rollno": roll}, {"_id": 0, "rollno": 1, "name": 1, "password": 1})
    if not student:
        return jsonify({"error": "Student not found"}), 404
    has_password = bool(student.get("password"))
    return jsonify({
        "rollno": student["rollno"],
        "name": student["name"].strip(),
        "hasPassword": has_password
    })


@auth_bp.route("/api/student/signup", methods=["POST"])
def student_signup():
    data = request.get_json(silent=True) or {}
    rollno = (data.get("rollno") or "").strip()
    password = (data.get("password") or "").strip()

    if not rollno or not password:
        return jsonify({"error": "Roll number and password are required."}), 400

    student = students_collection.find_one({"rollno": rollno})
    if not student:
        return jsonify({"error": "Invalid roll number. Please contact your administrator."}), 404

    if student.get("password"):
        return jsonify({"error": "Account already exists. Please use Login."}), 409

    hashed = generate_password_hash(password, method='pbkdf2:sha256')
    students_collection.update_one({"rollno": rollno}, {"$set": {"password": hashed}})

    return jsonify({"success": True, "message": "Account created successfully.", "name": student["name"].strip()})


@auth_bp.route("/api/student/login", methods=["POST"])
def student_login():
    data = request.get_json(silent=True) or {}
    rollno = (data.get("rollno") or "").strip()
    password = (data.get("password") or "").strip()

    if not rollno or not password:
        return jsonify({"error": "Roll number and password are required."}), 400

    student = students_collection.find_one({"rollno": rollno})
    if not student:
        return jsonify({"error": "Invalid roll number."}), 404

    if not student.get("password"):
        return jsonify({"error": "No account found. Please create an account first."}), 400

    if not check_password_hash(student["password"], password):
        return jsonify({"error": "Incorrect password. Please try again."}), 401

    return jsonify({
        "success": True,
        "message": "Login successful.",
        "rollno": student["rollno"],
        "name": student["name"].strip()
    })
