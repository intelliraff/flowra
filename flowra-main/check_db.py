import sqlite3
import os

# Check if database exists and show tables
db_path = "backendd/water_alert.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    print("Database Tables:")
    for table in tables:
        print(f"- {table[0]}")

        # Get table schema
        cursor.execute(f"PRAGMA table_info({table[0]})")
        columns = cursor.fetchall()
        print("  Columns:")
        for col in columns:
            print(f"    - {col[1]} ({col[2]}) {'PRIMARY KEY' if col[5] else ''}")
        print()

    conn.close()
else:
    print("Database file not found")
