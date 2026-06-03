import os
import time
import json
from datetime import datetime
from flask import Blueprint, jsonify, request, send_from_directory, redirect
from werkzeug.utils import secure_filename
from config.db import students_collection, pdfs_collection

import cloudinary
import cloudinary.uploader

# Cloudinary configuration
cloudinary.config(
  cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME", ""),
  api_key = os.environ.get("CLOUDINARY_API_KEY", ""),
  api_secret = os.environ.get("CLOUDINARY_API_SECRET", ""),
  secure = True
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "doc", "docx", "txt", "ppt", "pptx"}

pdf_bp = Blueprint("pdf_bp", __name__)

os.makedirs(UPLOAD_DIR, exist_ok=True)


def allowed_file(filename):
    return "." in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_upload_metadata(filename):
    file_path = os.path.join(UPLOAD_DIR, filename)
    try:
        stat = os.stat(file_path)
        timestamp = int(stat.st_ctime)
        size = stat.st_size
    except OSError:
        timestamp = int(time.time())
        size = 0

    original_name = filename
    parts = filename.split('_', 1)
    if len(parts) == 2 and parts[0].isdigit():
        original_name = parts[1]
        timestamp = int(parts[0])

    meta_path = file_path + ".json"
    extra_meta = {}
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r") as f:
                extra_meta = json.load(f)
        except Exception:
            pass

    return {
        "id": filename,
        "original_name": original_name,
        "filename": filename,
        "size": size,
        "uploaded": datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S'),
        "timestamp": timestamp,
        "title": extra_meta.get("title", ""),
        "category": extra_meta.get("subject", "Uploaded Notes"),
        "semester": extra_meta.get("semester", "N/A")
    }


@pdf_bp.route("/api/upload-pdf", methods=["POST"])
def api_upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request."}), 400

    file = request.files['file']
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    original_filename = file.filename
    secured_filename = secure_filename(original_filename)

    timestamp = int(time.time())
    stored_name = f"{timestamp}_{secured_filename}"
    
    try:
        # Upload to Cloudinary directly from memory
        upload_result = cloudinary.uploader.upload(
            file,
            resource_type="auto",
            folder="notes_library",
            use_filename=True,
            unique_filename=True
        )
        secure_url = upload_result.get("secure_url")
        public_id = upload_result.get("public_id")
        file_size = upload_result.get("bytes", 0)
        
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        print("Cloudinary Upload Error:", e, flush=True)
        return jsonify({"error": f"Failed to upload to Cloudinary: {str(e)}", "trace": trace}), 500

    # Save metadata to MongoDB
    metadata = {
        "id": stored_name,
        "original_name": original_filename,
        "filename": stored_name,
        "size": file_size,
        "timestamp": timestamp,
        "uploaded": datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S'),
        "title": request.form.get("title", ""),
        "category": request.form.get("subject", "Uploaded Notes"),
        "semester": request.form.get("semester", "N/A"),
        "cloudinary_url": secure_url,
        "public_id": public_id
    }
    
    pdfs_collection.insert_one(metadata)

    return jsonify({"success": True, "filename": stored_name, "original_name": original_filename, "url": secure_url})


@pdf_bp.route("/api/uploaded-pdfs")
def api_uploaded_pdfs():
    files = []
    
    # Fetch from MongoDB
    mongo_files = list(pdfs_collection.find({}, {"_id": 0}))
    files.extend(mongo_files)
    
    # Fallback to local files if UPLOAD_DIR exists (for backward compatibility locally)
    if os.path.exists(UPLOAD_DIR):
        for f in os.listdir(UPLOAD_DIR):
            if f.endswith(".json"):
                file_path = os.path.join(UPLOAD_DIR, f)
                try:
                    with open(file_path, "r") as file_obj:
                        meta = json.load(file_obj)
                except Exception:
                    continue
                
                # Only add if not already in MongoDB
                if not any(m.get("id") == meta.get("id") for m in mongo_files):
                    if "cloudinary_url" in meta:
                        files.append(meta)
                    else:
                        actual_filename = f[:-5]
                        if os.path.exists(os.path.join(UPLOAD_DIR, actual_filename)):
                            files.append(get_upload_metadata(actual_filename))
            elif allowed_file(f):
                if not os.path.exists(os.path.join(UPLOAD_DIR, f + ".json")):
                    if not any(m.get("id") == f for m in mongo_files):
                        files.append(get_upload_metadata(f))
                 
    # Sort by timestamp descending
    files.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
    return jsonify({"success": True, "files": files})


@pdf_bp.route("/api/total-pdfs-count")
def api_total_pdfs_count():
    response = api_uploaded_pdfs()
    data = response.get_json()
    count = len(data.get("files", [])) if data else 0
    return jsonify({"success": True, "total_pdfs": count})


@pdf_bp.route("/api/delete-pdf/<filename>", methods=["DELETE"])
def api_delete_pdf(filename):
    if ".." in filename or "/" in filename or "\\" in filename:
        return jsonify({"error": "Invalid filename."}), 400

    deleted_anything = False
    
    # Check MongoDB first
    meta = pdfs_collection.find_one({"id": filename})
    if meta:
        public_id = meta.get("public_id")
        if public_id:
            try:
                cloudinary.uploader.destroy(public_id)
            except Exception as e:
                print("Cloudinary destroy error:", e)
        pdfs_collection.delete_one({"_id": meta["_id"]})
        deleted_anything = True
    else:
        # Fallback to local files
        meta_path = os.path.join(UPLOAD_DIR, filename + ".json")
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r") as f:
                    local_meta = json.load(f)
                public_id = local_meta.get("public_id")
                if public_id:
                    try:
                        cloudinary.uploader.destroy(public_id)
                    except Exception as e:
                        print("Cloudinary destroy error:", e)
            except Exception:
                pass
            os.remove(meta_path)
            deleted_anything = True
            
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            os.remove(file_path)
            deleted_anything = True

    if not deleted_anything:
        return jsonify({"error": "File not found."}), 404

    # remove references to this file from all student favourites and downloads
    try:
        res = students_collection.update_many({}, {"$pull": {"favourites": filename, "downloads": filename}})
        modified = int(res.modified_count) if hasattr(res, 'modified_count') else 0
    except Exception:
        modified = 0

    return jsonify({"success": True, "message": f"File '{filename}' deleted successfully.", "students_updated": modified})


@pdf_bp.route("/api/pdf/<path:pdf_id>")
def serve_pdf_by_id(pdf_id):
    filename = os.path.basename(pdf_id)
    
    # Check MongoDB first
    meta = pdfs_collection.find_one({"id": filename})
    if meta:
        url = meta.get("cloudinary_url")
        if url:
            if request.args.get("download") == "true" and "/upload/" in url:
                url = url.replace("/upload/", "/upload/fl_attachment/")
            return redirect(url)
            
    # Check fallback local files
    meta_path = os.path.join(UPLOAD_DIR, filename + ".json")
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r") as f:
                local_meta = json.load(f)
            url = local_meta.get("cloudinary_url")
            if url:
                if request.args.get("download") == "true" and "/upload/" in url:
                    url = url.replace("/upload/", "/upload/fl_attachment/")
                return redirect(url)
        except Exception:
            pass

    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(UPLOAD_DIR, filename)
        
    return jsonify({"error": "File not found."}), 404


@pdf_bp.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return serve_pdf_by_id(filename)

