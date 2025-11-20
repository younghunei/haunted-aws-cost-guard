import { DemoDataService } from '../services/demoDataService';

describe('DemoDataService', () => {
  let demoDataService: DemoDataService;

  beforeEach(() => {
    demoDataService = new DemoDataService();
  });

  describe('getDemoData', () => {
    it('should return valid cost data structure', () => {
      const data = demoDataService.getDemoData();

      expect(data).toHaveProperty('services');
      expect(data).toHaveProperty('totalCost');
      expect(data).toHaveProperty('currency');
      expect(data).toHaveProperty('lastUpdated');
      expect(data).toHaveProperty('budgetAlerts');

      expect(data.services).toBeInstanceOf(Array);
      expect(data.services.length).toBeGreaterThan(0);
      expect(data.totalCost).toBeGreaterThan(0);
      expect(data.currency).toBe('USD');
      expect(data.lastUpdated).toBeInstanceOf(Date);
      expect(data.budgetAlerts).toBeInstanceOf(Array);
    });

    it('should return services with all required properties', () => {
      const data = demoDataService.getDemoData();

      data.services.forEach(service => {
        expect(service).toHaveProperty('service');
        expect(service).toHaveProperty('displayName');
        expect(service).toHaveProperty('totalCost');
        expect(service).toHaveProperty('currency');
        expect(service).toHaveProperty('budgetUtilization');
        expect(service).toHaveProperty('regions');
        expect(service).toHaveProperty('tags');
        expect(service).toHaveProperty('dailyCosts');
        expect(service).toHaveProperty('trend');

        expect(typeof service.service).toBe('string');
        expect(typeof service.displayName).toBe('string');
        expect(typeof service.totalCost).toBe('number');
        expect(service.currency).toBe('USD');
        expect(typeof service.budgetUtilization).toBe('number');
        expect(service.regions).toBeInstanceOf(Array);
        expect(service.tags).toBeInstanceOf(Array);
        expect(service.dailyCosts).toBeInstanceOf(Array);
        expect(['increasing', 'decreasing', 'stable']).toContain(service.trend);
      });
    });

    it('should calculate total cost correctly', () => {
      const data = demoDataService.getDemoData();
      const calculatedTotal = data.services.reduce((sum, service) => sum + service.totalCost, 0);
      
      expect(data.totalCost).toBe(calculatedTotal);
    });

    it('should generate budget alerts for services over 80% utilization', () => {
      const data = demoDataService.getDemoData();
      const servicesOverThreshold = data.services.filter(s => s.budgetUtilization > 0.8);
      
      expect(data.budgetAlerts.length).toBe(servicesOverThreshold.length);
      
      data.budgetAlerts.forEach(alert => {
        expect(alert).toHaveProperty('service');
        expect(alert).toHaveProperty('currentCost');
        expect(alert).toHaveProperty('budgetLimit');
        expect(alert).toHaveProperty('utilizationPercentage');
        expect(alert).toHaveProperty('severity');
        
        expect(['warning', 'critical']).toContain(alert.severity);
        expect(alert.utilizationPercentage).toBeGreaterThan(80);
      });
    });
  });

  describe('getDemoScenarios', () => {
    it('should return array of demo scenarios', () => {
      const scenarios = demoDataService.getDemoScenarios();

      expect(scenarios).toBeInstanceOf(Array);
      expect(scenarios.length).toBeGreaterThan(0);

      scenarios.forEach(scenario => {
        expect(scenario).toHaveProperty('id');
        expect(scenario).toHaveProperty('name');
        expect(scenario).toHaveProperty('description');
        
        expect(typeof scenario.id).toBe('string');
        expect(typeof scenario.name).toBe('string');
        expect(typeof scenario.description).toBe('string');
      });
    });

    it('should include expected scenario types', () => {
      const scenarios = demoDataService.getDemoScenarios();
      const scenarioIds = scenarios.map(s => s.id);

      expect(scenarioIds).toContain('normal_usage');
      expect(scenarioIds).toContain('budget_warning');
      expect(scenarioIds).toContain('cost_spike');
    });
  });
});