import re
with open('frontend/src/components/dashboards/DistrictDashboard.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'Coordinates: {p.target_location}',
    'Coordinates: {p.target_location}\n                          </div>\n                          <div className="font-mono text-sm text-slate-700 mt-1">\n                            Reverse Geocode: {p.village ? `${p.village}, ` : ""}{p.taluka ? `${p.taluka}, ` : ""}{p.district}, {p.state}'
)

with open('frontend/src/components/dashboards/DistrictDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

