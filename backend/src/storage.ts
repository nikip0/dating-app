/**
 * Simple in-memory storage
 * In production, replace with a real database (PostgreSQL, MongoDB, etc.)
 */

import { UserProfile, ChatMessage, SimulationSummary } from './types';

class Storage {
  private profile: UserProfile | null = null;
  private chatHistory: ChatMessage[] = [];
  private simulationResults: SimulationSummary | null = null;

  // Profile methods
  saveProfile(profile: UserProfile): void {
    this.profile = profile;
  }

  getProfile(): UserProfile | null {
    return this.profile;
  }

  updateProfile(updates: Partial<UserProfile>): UserProfile | null {
    if (!this.profile) return null;
    this.profile = { ...this.profile, ...updates };
    return this.profile;
  }

  // Chat methods
  addMessage(message: ChatMessage): void {
    this.chatHistory.push(message);
  }

  getChatHistory(): ChatMessage[] {
    return this.chatHistory;
  }

  clearChatHistory(): void {
    this.chatHistory = [];
  }

  // Simulation methods
  saveSimulationResults(results: SimulationSummary): void {
    this.simulationResults = results;
  }

  getSimulationResults(): SimulationSummary | null {
    return this.simulationResults;
  }

  // Reset all data
  reset(): void {
    this.profile = null;
    this.chatHistory = [];
    this.simulationResults = null;
  }
}

export const storage = new Storage();
