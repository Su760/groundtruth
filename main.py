# CLI entrypoint — delegates to backend.main
# Run: python main.py "Ukraine war"
#   or: python -m backend.main "Ukraine war"
from dotenv import load_dotenv
load_dotenv()

from backend.main import main

if __name__ == "__main__":
    main()
