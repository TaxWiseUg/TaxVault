# Raw tat cases container
import csv
import io

def parse_tat_cases(text):
    f = io.StringIO(text.strip())
    reader = csv.DictReader(f)
    results = []
    for r in reader:
        # Convert year to int if possible
        try:
            r['year'] = int(r.get('year', 0))
        except:
            r['year'] = 0
        results.append(r)
    return results
