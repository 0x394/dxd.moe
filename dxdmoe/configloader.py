import yaml
import os

# Get folders
root_folder = os.path.dirname(os.path.abspath(__file__))

# Load config
with open(os.path.join(root_folder, "config.yml"), "r") as configFile:
        config = yaml.load(configFile, Loader=yaml.BaseLoader)