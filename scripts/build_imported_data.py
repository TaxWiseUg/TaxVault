# Helper script to convert CSV blocks to JSON and TypeScript
import csv
import io
import json

def parse_csv_block(csv_text):
    f = io.StringIO(csv_text.strip())
    reader = csv.DictReader(f)
    return [row for row in reader]

print("Ready to parse")
