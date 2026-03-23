from pathlib import Path
import sqlite3


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "prisma" / "dev.db"
SQL_PATH = ROOT / "prisma" / "init.sql"
SCHEMA_PATH = ROOT / "prisma" / "schema.prisma"


def main() -> None:
    schema_text = SCHEMA_PATH.read_text(encoding="utf-8")

    if 'provider = "sqlite"' not in schema_text:
        raise SystemExit("db:init only supports the SQLite schema. Run `npm run db:use:sqlite` first.")

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)

    try:
        connection.execute("PRAGMA foreign_keys = ON;")
        connection.executescript(SQL_PATH.read_text(encoding="utf-8"))
        connection.commit()
        print(f"SQLite schema initialized at {DB_PATH}")
    finally:
        connection.close()


if __name__ == "__main__":
    main()
