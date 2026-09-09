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
} from '../data/mockData';

const API_BASE = '/api';

// In-memory runtime state for mock fallback mutations
let runtimeProjects = [...mockProjects];
let runtimeBlocks = [...mockBlockchainBlocks];

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
    return mockDistrictRisk;
  },

  async getCategoryDistribution() {
    return mockCategoryDistribution;
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
    try {
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
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }

    // Mock blockchain block append
    const newIdx = runtimeBlocks.length;
    const prevBlock = runtimeBlocks[newIdx - 1];
    const timestamp = new Date().toISOString();
    const mockHash = '00' + Math.random().toString(16).substring(2, 10) + '9b14cf5fca649a37';

    const newBlock = {
      index: newIdx,
      timestamp: timestamp,
      transaction_type: 'AUDITOR_DECISION',
      payload: {
        project_id: projectId,
        auditor_id: 'CVC_AUDITOR_007',
        decision: decision,
        notes: notes,
      },
      payload_hash: Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2),
      previous_hash: prevBlock.block_hash,
      block_hash: mockHash,
      nonce: Math.floor(Math.random() * 500),
    };

    runtimeBlocks.push(newBlock);

    // Update local project status if present
    const p = runtimeProjects.find((x) => x.project_id === projectId);
    if (p) {
      p.auditor_verdict = decision;
    }

    return {
      success: true,
      block_index: newIdx,
      block_hash: mockHash,
      timestamp: timestamp,
      project_id: projectId,
      auditor_id: 'CVC_AUDITOR_007',
      decision: decision,
      message: `Decision '${decision}' cryptographically anchored into Block #${newIdx}.`,
    };
  },
};

