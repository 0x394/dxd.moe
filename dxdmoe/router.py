from flask import (
    Blueprint,
    render_template
)
from .configloader import config
import subprocess

router = Blueprint("router", __name__)

# Get git hash
def git_hash():
    return subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']).strip().decode()

# Home route
@router.route("/", methods=["GET"])
def home():
    return render_template("home.html", title="File uploader", max_size=config["upload"]["max_size"], git_hash=git_hash())