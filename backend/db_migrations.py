"""
Run this script once to get the SQL needed to set up GroundTruth's Supabase tables.
Paste the output into Supabase Dashboard → SQL Editor → New query.

Usage:
    python backend/db_migrations.py
"""
from pathlib import Path


def main():
    sql_path = Path(__file__).parent / "migrations" / "001_create_tables.sql"
    sql = sql_path.read_text(encoding="utf-8")
    print("=" * 60)
    print("Paste the following SQL into your Supabase SQL Editor")
    print("(Dashboard → SQL Editor → New query):")
    print("=" * 60)
    print()
    print(sql)


if __name__ == "__main__":
    main()
