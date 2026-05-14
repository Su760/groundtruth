from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

_client: Client | None = None

try:
    _url = os.environ["SUPABASE_URL"]
    _key = os.environ["SUPABASE_KEY"]
    supabase: Client | None = create_client(_url, _key)
except KeyError:
    supabase = None


def get_db() -> Client:
    global _client, supabase
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_KEY"]
        _client = create_client(url, key)
        supabase = _client
    return _client
