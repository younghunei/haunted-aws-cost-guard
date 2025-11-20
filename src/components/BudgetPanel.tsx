import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHauntedStore } from '../store/hauntedStore';
import { BudgetForm } from './BudgetForm';
import { BudgetNotifications } from './BudgetNotifications';

export const BudgetPanel: React.FC = () => {
  const {
    showBudgetPanel,
    setShowBudgetPanel,
    budgets,
    budgetUtilizations,
    services,
    deleteBudget
  } = useHauntedStore();

  const [activeTab, setActiveTab] = useState<'budgets' | 'notifications'>('budgets');
  const [editingBudget, setEditingBudget] = useState<string | null>(null);

  if (!showBudgetPanel) return null;

  const getBudgetForService = (service: string) => {
    return budgets.find(b => b.service === service);
  };

  const getUtilizationForService = (service: string) => {
    return budgetUtilizations.find(u => u.service === service);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget(budgetId);
    }
  };

  const getAlertLevelColor = (alertLevel: string) => {
    switch (alertLevel) {
      case 'safe': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-orange-600';
      case 'over_budget': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertLevelBg = (alertLevel: string) => {
    switch (alertLevel) {
      case 'safe': return 'bg-green-100';
      case 'warning': return 'bg-yellow-100';
      case 'critical': return 'bg-orange-100';
      case 'over_budget': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style={{ 
        zIndex: 999997,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }}
    >
      <div className="bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 text-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border-2 border-orange-500/50 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-orange-500/50 bg-gradient-to-r from-black/60 to-purple-900/40">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">💰</span>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
              👻 Budget Management 🎃
            </h2>
          </div>
          <button
            onClick={() => setShowBudgetPanel(false)}
            className="text-orange-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-orange-500/20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'budgets'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Service Budgets
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Notifications
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'budgets' && (
            <div className="space-y-6">
              {/* Service Budget List */}
              <div className="grid gap-4">
                {services.map((service) => {
                  const budget = getBudgetForService(service.service);
                  const utilization = getUtilizationForService(service.service);
                  const isEditing = editingBudget === service.service;

                  return (
                    <div key={service.service} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-purple-300">
                            {service.displayName}
                          </h3>
                          {utilization && (
                            <span className={`px-2 py-1 rounded text-sm font-medium ${getAlertLevelBg(utilization.alertLevel)} ${getAlertLevelColor(utilization.alertLevel)}`}>
                              {utilization.utilizationPercentage.toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingBudget(isEditing ? null : service.service)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
                          >
                            {isEditing ? 'Cancel' : budget ? 'Edit' : 'Set Budget'}
                          </button>
                          {budget && (
                            <button
                              onClick={() => handleDeleteBudget(budget.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Current Cost and Budget Info */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-400">Current Cost</p>
                          <p className="text-lg font-semibold text-white">
                            ${service.totalCost.toFixed(2)}
                          </p>
                        </div>
                        {budget && (
                          <div>
                            <p className="text-sm text-gray-400">Budget Limit</p>
                            <p className="text-lg font-semibold text-white">
                              ${budget.amount.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Budget Progress Bar */}
                      {utilization && (
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-400 mb-1">
                            <span>Budget Utilization</span>
                            <span>{utilization.utilizationPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                utilization.alertLevel === 'over_budget' ? 'bg-red-500' :
                                utilization.alertLevel === 'critical' ? 'bg-orange-500' :
                                utilization.alertLevel === 'warning' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(utilization.utilizationPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Budget Form */}
                      {isEditing && (
                        <BudgetForm
                          service={service.service}
                          existingBudget={budget}
                          onSave={() => setEditingBudget(null)}
                          onCancel={() => setEditingBudget(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <BudgetNotifications />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};