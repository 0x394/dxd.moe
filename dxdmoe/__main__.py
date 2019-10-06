# Load libs
from flask import Flask
from .router import router
from .configloader import config
import os

def run():

    # Get folders
    root_folder = os.path.dirname(os.path.abspath(__file__))
    template_dir = os.path.join(root_folder, "views")
    static_dir = os.path.join(root_folder, "static")

    # Check config env
    if config["env"] != "production" and config["env"] != "development":
        raise ValueError("Env config must be \"production\" for production mode or \"development\" for development mode")

    # Create Flask instance
    app = Flask("DxD dot moe", static_folder=static_dir, template_folder=template_dir)

    # Register router
    app.register_blueprint(router)

    # Set env mode
    app.testing = (config["env"] == "production")
    app.env = config["env"]

    # Start app
    app.run(port=config["port"], debug=(config["env"] == "development"))


if __name__ == "__main__":
    run()
