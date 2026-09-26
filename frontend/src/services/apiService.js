/**
 * API Service Layer
 * Supports dual-mode: fetches from live FastAPI backend when available,
 * or gracefully falls back to mockData.js with zero UI changes.
 */

import {
  mockOverviewStats,
  mockDistrictRisk,
  mockCategoryDistribution,
  mockProjects,
  mockSyndicates,
  mockNetworkGraph,
  mockBlockchainBlocks,
  mockWorkSplitting,
  mockMPs,
} from '../data/mockData';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// In-memory runtime state for mock fallback mutations
let runtimeProjects = [...mockProjects];
let runtimeBlocks = [...mockBlockchainBlocks];

let isElectionFreeze = false;

export const apiService = {
  async getOverview() {
    try {
      const res = await fetch(`${API_BASE}/overview`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return mockOverviewStats;
  },

  async getDistrictRisk() {
    try {
      const res = await fetch(`${API_BASE}/overview/district-risk`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return mockDistrictRisk;
  },

  async getCategoryDistribution() {
    try {
      const res = await fetch(`${API_BASE}/overview/category-distribution`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return mockCategoryDistribution;
  },

  async getWorkSplitting(evadesGfrOnly = false) {
    try {
      const res = await fetch(`${API_BASE}/work-splitting?evades_gfr_threshold=${evadesGfrOnly}&limit=100`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return evadesGfrOnly
      ? mockWorkSplitting.filter((s) => s.evades_gfr_threshold)
      : mockWorkSplitting;
  },

  async getMPs() {
    try {
      const res = await fetch(`${API_BASE}/mps?limit=100`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return mockMPs;
  },

  async verifyPhoto(file, claimedLat, claimedLon, toleranceKm = 5.0) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('claimed_latitude', claimedLat);
      formData.append('claimed_longitude', claimedLon);
      formData.append('tolerance_km', toleranceKm);

      const res = await fetch(`${API_BASE}/evidence/verify-photo`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }

    // Client-side fallback simulation
    const distanceKm = Math.random() > 0.4 ? 0.8 : 312.4;
    const isMismatch = distanceKm > toleranceKm;
    return {
      success: true,
      has_exif: true,
      photo_latitude: isMismatch ? Number(claimedLat) + 2.8 : Number(claimedLat) + 0.002,
      photo_longitude: isMismatch ? Number(claimedLon) - 1.4 : Number(claimedLon) + 0.001,
      claimed_latitude: Number(claimedLat),
      claimed_longitude: Number(claimedLon),
      distance_km: distanceKm,
      tolerance_km: toleranceKm,
      verification_status: isMismatch ? 'MISMATCH_EXCEEDS_TOLERANCE' : 'VERIFIED_WITHIN_TOLERANCE',
      photo_timestamp: new Date().toISOString(),
      duplicate_flag: isMismatch ? 'Yes (Image hash detected across 2 projects)' : 'No (Unique photograph)',
      image_hash: '9f83acb14d2091e7' + Math.random().toString(16).substring(2, 6),
    };
  },

  async getProjects(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.priority_tier) params.append('priority_tier', filters.priority_tier);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.page) params.append('page', filters.page);

      const res = await fetch(`${API_BASE}/projects?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        return data.items || [];
      }
    } catch (e) {
      // Fallback
    }

    // Mock filtering
    let list = [...runtimeProjects];
    if (filters.priority_tier && filters.priority_tier !== 'ALL') {
      list = list.filter((p) => p.priority_tier === filters.priority_tier);
    }
    if (filters.category && filters.category !== 'ALL') {
      list = list.filter((p) => p.project_category === filters.category);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.project_id.toLowerCase().includes(q) ||
          p.mp_id.toLowerCase().includes(q) ||
          p.contractor_id.toLowerCase().includes(q) ||
          p.constituency.toLowerCase().includes(q) ||
          (p.project_description && p.project_description.toLowerCase().includes(q))
      );
    }
    return list;
  },

  async getProjectDossier(projectId) {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return runtimeProjects.find((p) => p.project_id === projectId) || null;
  },

  async getSyndicates() {
    try {
      const res = await fetch(`${API_BASE}/syndicates`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return mockSyndicates;
  },

  async getGraphSubgraph(entityType = 'project', entityId = 'P00059973') {
    try {
      const res = await fetch(`${API_BASE}/graph/subgraph/${entityType}/${entityId}?depth=2`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return mockNetworkGraph;
  },

  async getBlockchainBlocks() {
    try {
      const res = await fetch(`${API_BASE}/blockchain/blocks`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return runtimeBlocks;
  },

  async validateBlockchain() {
    try {
      const res = await fetch(`${API_BASE}/blockchain/validate`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return {
      is_valid: true,
      total_blocks: runtimeBlocks.length,
      latest_block_hash: runtimeBlocks[runtimeBlocks.length - 1]?.block_hash || '005add7260a67535...',
      errors: [],
    };
  },

  async recordAuditorDecision(projectId, decision, notes = '') {
    const res = await fetch(`${API_BASE}/blockchain/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        auditor_id: 'CVC_AUDITOR_007',
        decision: decision,
        notes: notes,
      }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to record auditor decision");
    }
    
    // Update local project status if present for UI reactivity
    const p = runtimeProjects.find((x) => x.project_id === projectId);
    if (p) {
      p.auditor_verdict = decision;
    }
    
    return await res.json();
  },

  // Live Workflow APIs (SQLite database backed)
  async createLiveProject(projectData) {
    const res = await fetch(`${API_BASE}/live/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return await res.json();
  },

  async getLiveProjects() {
    const res = await fetch(`${API_BASE}/live/projects`);
    if (!res.ok) throw new Error('Failed to fetch live projects');
    return await res.json();
  },

  
  async rejectLiveProject(id) {
    const res = await fetch(`${API_BASE}/live/projects/${id}/reject`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reject project');
    return await res.json();
  },
  async approveLiveProject(id, agency) {
    const res = await fetch(`${API_BASE}/live/projects/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agency })
    });
    if (!res.ok) throw new Error('Failed to approve project');
    return await res.json();
  },

  async assignEngineer(id) {
    const res = await fetch(`${API_BASE}/live/projects/${id}/assign_engineer`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to assign engineer');
    return await res.json();
  },

  async assignContractor(id, gstin) {
    const res = await fetch(`${API_BASE}/live/projects/${id}/assign_contractor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gstin })
    });
    if (!res.ok) throw new Error('Failed to assign contractor');
    return await res.json();
  },

  async submitLiveEvidence(id, file, lat=null, lng=null) {
    const formData = new FormData();
    if (file) {
      formData.append("evidence_file", file);
    }
    if (lat !== null && lng !== null) {
      formData.append("live_lat", lat);
      formData.append("live_lng", lng);
    }
    
    const res = await fetch(`${API_BASE}/live/projects/${id}/submit_evidence`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to submit evidence');
    return await res.json();
  },

  async geofenceLiveProject(id, lat, lng) {
    const res = await fetch(`${API_BASE}/live/projects/${id}/geofence?lat=${lat}&lng=${lng}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to geofence project');
    return await res.json();
  },

  async getMPWallet(mp_id) {
    const res = await fetch(`${API_BASE}/live/wallets/${mp_id}`);
    if (!res.ok) throw new Error('Failed to fetch wallet');
    return await res.json();
  },

  async addMPFunds(mp_id, amount) {
    const res = await fetch(`${API_BASE}/live/wallets/${mp_id}/rollover?amount=${amount}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to rollover funds');
    return await res.json();
  }
,

  async getSystemStatus() {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("Backend unreachable for getSystemStatus", e);
    }
    // Fallback if backend is completely down
    return { election_freeze: isElectionFreeze, message: "System OK (Mock)" };
  },

  async toggleElectionFreeze() {
    try {
      const res = await fetch(`${API_BASE}/toggle_freeze`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("Backend unreachable for toggleElectionFreeze", e);
    }
    // Fallback if backend is completely down
    isElectionFreeze = !isElectionFreeze;
    return { election_freeze: isElectionFreeze, message: "Freeze toggled (Mock)" };
  },

  async disburseFunds(mp_id) {
    try {
      const res = await fetch(`${API_BASE}/disburse_funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district: mp_id, amount: 50000000.0 })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("Backend unreachable for disburseFunds", e);
    }
    return { success: true, message: "Funds disbursed successfully (Mock)", new_balance: 50000000 };
  },

  async getMPs() {
    try {
      const response = await fetch(`${API_BASE}/nic/mps`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Fetch MP Error:", e);
      return [];
    }
  }
};
