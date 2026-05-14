"""
Run this script once to get the SQL needed to set up GroundTruth's Supabase tables.
Paste the output into Supabase Dashboard → SQL Editor → New query.

Usage:
    python backend/db_migrations.py
"""
from pathlib import Path

MIGRATIONS_DIR = Path(__file__).parent / "migrations"


def main():
    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    for path in migration_files:
        print("=" * 60)
        print(f"Migration: {path.name}")
        print("Paste the following SQL into your Supabase SQL Editor")
        print("(Dashboard → SQL Editor → New query):")
        print("=" * 60)
        print()
        print(path.read_text(encoding="utf-8"))
        print()


if __name__ == "__main__":
    main()
