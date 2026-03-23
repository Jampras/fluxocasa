from pathlib import Path
import shutil
import sys


ROOT = Path(__file__).resolve().parents[1]
PRISMA_DIR = ROOT / "prisma"
TARGET_SCHEMA = PRISMA_DIR / "schema.prisma"


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] not in {"sqlite", "postgres"}:
        print("Usage: python scripts/use_prisma_schema.py [sqlite|postgres]")
        return 1

    provider = sys.argv[1]
    source_schema = PRISMA_DIR / f"schema.{provider}.prisma"

    if not source_schema.exists():
        print(f"Schema file not found: {source_schema}")
        return 1

    shutil.copyfile(source_schema, TARGET_SCHEMA)
    print(f"Prisma schema switched to {provider}: {TARGET_SCHEMA}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
