from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from config.db import students_collection, load_students

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


@auth_bp.route("/api/student/forgot-password", methods=["POST"])
def forgot_password():
    """
    Reset a student's password.
    Identity is verified by matching Roll No + Full Name against the admin-registered record.
    """
    data = request.get_json(silent=True) or {}
    rollno       = (data.get("rollno") or "").strip()
    name_input   = (data.get("name") or "").strip()
    new_password = (data.get("new_password") or "").strip()
    confirm_pwd  = (data.get("confirm_password") or "").strip()

    # --- Basic validation ---
    if not rollno or not name_input or not new_password or not confirm_pwd:
        return jsonify({"error": "All fields are required."}), 400

    if new_password != confirm_pwd:
        return jsonify({"error": "Passwords do not match."}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    # --- Verify student exists ---
    student = students_collection.find_one({"rollno": rollno})
    if not student:
        return jsonify({"error": "Invalid roll number. Please contact your administrator."}), 404

    # --- Verify name matches (case-insensitive) ---
    registered_name = student.get("name", "").strip().lower()
    if registered_name != name_input.lower():
        return jsonify({"error": "Name does not match our records. Please enter your full name exactly as registered."}), 403

    # --- Hash and save new password to MongoDB ---
    hashed = generate_password_hash(new_password, method='pbkdf2:sha256')
    students_collection.update_one(
        {"rollno": rollno},
        {"$set": {"password": hashed}}
    )

    return jsonify({
        "success": True,
        "message": "Password reset successfully. You can now login with your new password.",
        "name": student["name"].strip()
    })

