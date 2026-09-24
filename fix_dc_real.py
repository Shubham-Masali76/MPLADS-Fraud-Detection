import sys

def fix():
    with open('frontend/src/components/dashboards/FieldEngineerDashboard.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Let's cleanly construct DistrictDashboard from FieldEngineerDashboard
    
    # 1. Component name and role
    content = content.replace("export function FieldEngineerDashboard", "export function DistrictDashboard")
    content = content.replace("Field Engineer Portal", "District Portal")
    content = content.replace("Role: JE", "Role: DC/DM")
    
    # 2. Status filters
    # FE was: PENDING_DC_APPROVAL for pending, GEOFENCED for approved
    # DC should be: GEOFENCED for pending, APPROVED for approved
    content = content.replace('p.status === "PENDING_DC_APPROVAL"', 'p.status === "GEOFENCED"')
    content = content.replace('p.status !== "PENDING_DC_APPROVAL"', 'p.status === "APPROVED" || p.status === "EVIDENCE_SUBMITTED"')
    
    # 3. Titles
    content = content.replace("Field Engineer (JE) Overview", "District Authority (DC) Overview")
    content = content.replace("Capture Day-0 Geofences for sanctioned projects.", "Review MP proposals and sanction funds.")
    content = content.replace("Sanctioned Projects (Pending Geofence)", "Works Recommended by MPs Pending Approval")
    content = content.replace("Geofenced Projects Directory", "Approved Projects Directory")
    
    # 4. Remove all map/photo related state
    lines = content.split('\n')
    new_lines = []
    skip = False
    
    for i, line in enumerate(lines):
        if "const [mapModalOpen" in line: continue
        if "const [selectedProjectForMap" in line: continue
        if "const [isExifExtracted" in line: continue
        if "const [exifStatusText" in line: continue
        if "const [mapPosition" in line: continue
        if "const openMapForApproval" in line:
            skip = True
            continue
        if skip and "};" in line and "setMapModalOpen(true);" in lines[i-1]:
            skip = False
            continue
        if skip: continue
        
        # Replace handleApprove logic
        if "const handleApprove = async () => {" in line:
            new_lines.append("  const handleApprove = async (projectId) => {")
            new_lines.append("    try {")
            new_lines.append("      await apiService.approveLiveProject(projectId);")
            new_lines.append("      setActionStatus(`Success: Project LIVE-${projectId} sanctioned!`);")
            new_lines.append("      fetchProjects();")
            new_lines.append("    } catch (e) {")
            new_lines.append('      setActionStatus("Error: Failed to sanction project.");')
            new_lines.append("    }")
            new_lines.append("  };")
            skip = True
            continue
        if skip and "};" in line and "setMapModalOpen(false)" in lines[i-1]:
            skip = False
            continue
            
        # Strip the entire modal
        if "{/* Photo Upload Modal */}" in line:
            skip = True
            continue
        if skip and ")}<!-- END MODAL MARKER (imaginary) -->" in line: pass
        if skip and "        )}" in line and "</div>" in lines[i-1] and "</div>" in lines[i-2]:
            skip = False
            continue
            
        # Replace the button in the pending list
        if "onClick={() => openMapForApproval(p)}" in line:
            new_lines.append('                          onClick={() => handleApprove(p.id)}')
            continue
        if ">Lock Day-0 Geofence<" in line or "Lock Day-0 Geofence" in line and "button" in lines[i+1]:
            new_lines.append('                          className="mt-3 text-sm bg-emerald-600 text-white px-4 py-2 rounded font-bold hover:bg-emerald-700 transition-colors"')
            new_lines.append('                        >')
            new_lines.append('                          Sanction Project')
            continue
        if 'className="mt-3 text-sm bg-emerald-600' in line and "openMapForApproval" in lines[i-1]:
            continue
        if "Lock Day-0 Geofence" in line:
            continue
            
        if not skip:
            new_lines.append(line)
            
    # Write it back
    with open('frontend/src/components/dashboards/DistrictDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
    print("Fixed DistrictDashboard completely.")

fix()

