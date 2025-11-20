import React, { useState, useEffect } from 'react';
import { useHauntedStore } from '../store/hauntedStore';

interface Budget {
  id: string;
  accountId: string;
  service?: string;
  amount: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  alertThresholds: number[];
  createdAt: Date;
  updatedAt: Date;
}

interface BudgetFormProps {
  service: string;
  existingBudget?: Budget;
  onSave: () => void;
  onCancel: () => void;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  service,
  existingBudget,
  onSave,
  onCancel
}) => {
  const { addBudget, updateBudget, demoMode } = useHauntedStore();
  
  const [formData, setFormData] = useState({
    amount: existingBudget?.amount || 1000,
    currency: existingBudget?.currency || 'USD',
    period: existingBudget?.period || 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    alertThresholds: existingBudget?.alertThresholds || [50, 80, 100]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.amount <= 0) {
      newErrors.amount = 'Budget amount must be greater than 0';
    }

    if (formData.alertThresholds.some(threshold => threshold <= 0 || threshold > 200)) {
      newErrors.alertThresholds = 'Alert thresholds must be between 1 and 200';
    }

    if (formData.alertThresholds[0] >= formData.alertThresholds[1] || 
        formData.alertThresholds[1] >= formData.alertThresholds[2]) {
      newErrors.alertThresholds = 'Alert thresholds must be in ascending order';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const budgetData = {
        accountId: demoMode ? 'demo' : 'aws',
        service,
        ...formData
      };

      if (existingBudget) {
        await updateBudget({ ...existingBudget, ...budgetData });
      } else {
        await addBudget(budgetData);
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThresholdChange = (index: number, value: number) => {
    const newThresholds = [...formData.alertThresholds];
    newThresholds[index] = value;
    setFormData({ ...formData, alertThresholds: newThresholds });
  };

  return (
    <div className="mt-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
      <h4 className="text-lg font-semibold text-purple-300 mb-4">
        {existingBudget ? 'Edit Budget' : 'Set Budget'} for {service.toUpperCase()}
      </h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Budget Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Budget Amount
          </label>
          <div className="flex">
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="bg-gray-600 text-white rounded-l px-3 py-2 border border-gray-500 focus:border-purple-400 focus:outline-none"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="flex-1 bg-gray-600 text-white rounded-r px-3 py-2 border border-l-0 border-gray-500 focus:border-purple-400 focus:outline-none"
              placeholder="Enter budget amount"
            />
          </div>
          {errors.amount && (
            <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Budget Period */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Budget Period
          </label>
          <select
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value as 'monthly' | 'quarterly' | 'yearly' })}
            className="w-full bg-gray-600 text-white rounded px-3 py-2 border border-gray-500 focus:border-purple-400 focus:outline-none"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Alert Thresholds */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Alert Thresholds (%)
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Warning</label>
              <input
                type="number"
                min="1"
                max="200"
                value={formData.alertThresholds[0]}
                onChange={(e) => handleThresholdChange(0, parseInt(e.target.value) || 0)}
                className="w-full bg-gray-600 text-white rounded px-3 py-2 border border-gray-500 focus:border-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Critical</label>
              <input
                type="number"
                min="1"
                max="200"
                value={formData.alertThresholds[1]}
                onChange={(e) => handleThresholdChange(1, parseInt(e.target.value) || 0)}
                className="w-full bg-gray-600 text-white rounded px-3 py-2 border border-gray-500 focus:border-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Over Budget</label>
              <input
                type="number"
                min="1"
                max="200"
                value={formData.alertThresholds[2]}
                onChange={(e) => handleThresholdChange(2, parseInt(e.target.value) || 0)}
                className="w-full bg-gray-600 text-white rounded px-3 py-2 border border-gray-500 focus:border-purple-400 focus:outline-none"
              />
            </div>
          </div>
          {errors.alertThresholds && (
            <p className="text-red-400 text-sm mt-1">{errors.alertThresholds}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Thresholds determine when alerts are triggered based on budget utilization
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {isSubmitting ? 'Saving...' : existingBudget ? 'Update Budget' : 'Create Budget'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};