import subprocess
import random
import string
from flask import jsonify

# Generate random ID


def random_id(length):
    return ''.join([random.choice(string.ascii_letters + string.digits) for n in range(length)])

# Get git hash
def git_hash():
    return subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']).strip().decode()

# Get file size of a uploaded file
def uploaded_file_size(file):
    if file.content_length:
        return file.content_length

    try:
        pos = file.tell()
        file.seek(0, 2)
        size = file.tell()
        file.seek(pos)
        return size
    except (AttributeError, IOError):
        return None

# Convert bits to megabits
def convert_to_megabites(bits):
    return bits / (1024**2)

# Send JSON Message with status code
def json_with_statuscode(json, statuscode=200):
    res = jsonify(json)
    res.status_code = statuscode
    return res

# Generate unique name
def generate_filename(ext):
    if ext != None:
        return "{name}{ext}".format(name=random_id(8), ext=ext)
    else:
        return random_id(8)
