from flask import (
    Blueprint,
    render_template,
    request
)
from .configloader import config
import os
from .utils import *
import random

router = Blueprint("router", __name__, url_prefix="/")
root_folder = os.path.dirname(os.path.abspath(__file__))

# Home route
@router.route("/", methods=["GET"])
def home():
    return render_template("home.html", title="File uploader", max_size=config["upload"]["max_size"], git_hash=git_hash())

# Upload files
@router.route("/upload", methods=["POST"])
def upload_files():
    # Get upload domain
    if "UPLOAD_DOMAIN" in request.form:
        if request.form["UPLOAD_DOMAIN"] not in config["upload"]["domain"]:
            return json_with_statuscode({
                "success": False,
                "error": "Invalid upload domain."
            }, 400)
        else:
            upload_domain = request.form["UPLOAD_DOMAIN"]
    else:
        upload_domain = random.choice(config["upload"]["domain"])

    # Get (and create if not exist) upload dir
    upload_dir = os.path.normpath(os.path.join(
        root_folder, config["upload"]["folder"]))
    if not os.path.exists(upload_dir):
        os.mkdir(upload_dir)

    # check if user has uploaded a file
    if len(request.files.getlist("upload[]")) < 1:
        return json_with_statuscode({
            "success": False,
            "error": "You must upload least than one file."
        }, 400)

    files = request.files.getlist("upload[]")
    process_files = []

    # process files
    for file in files:
        # Check file size
        size = uploaded_file_size(file)
        if convert_to_megabites(size) > int(config["upload"]["max_size"]):
            process_files.append({
                "success": False,
                "error": "File too big"
            })
            continue

        # Check file extention
        if "." in file.filename:
            ext = os.path.splitext(file.filename)[1]
        else:
            ext = None

        if ext in config["upload"]["unauthorized_ext"]:
            process_files.append({
                "success": False,
                "error": "Invalid extention"
            })
            continue
                
        retry_filename = 0
        find_uniq = False

        while retry_filename < int(config["upload"]["retry_filename"]) and not find_uniq:
            upload_filename = generate_filename(ext)

            if not os.path.exists(os.path.join(upload_dir, upload_filename)):
                find_uniq = True

            retry_filename += 1

        if not find_uniq:
            process_files.append({
                "success": False,
                "error": "Unable to find unique name."
            })
            continue

        file.save(os.path.join(upload_dir, upload_filename))

        process_files.append({
            "success": True,
            "original_filename": file.filename,
            "filename": upload_filename,
            "url": os.path.join(upload_domain, upload_filename),
            "size": size
        })

    return {
        "success": True,
        "files": process_files
    }
        
        
# 404/405 Page
@router.app_errorhandler(405)
@router.app_errorhandler(404)
def not_found(e):
    return render_template("404.html", title="Page not found")
