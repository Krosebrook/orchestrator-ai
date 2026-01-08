import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, userEvent, createMockAlert } from '@/utils/test-utils';
import AlertsPanel from '../AlertsPanel';

describe('AlertsPanel', () => {
  const mockAlerts = [
    createMockAlert({
      id: '1',
      title: 'High CPU Usage',
      severity: 'high',
      alert_type: 'performance_degradation',
      message: 'CPU usage is above threshold',
      created_date: new Date().toISOString(),
    }),
    createMockAlert({
      id: '2',
      title: 'Memory Spike Detected',
      severity: 'critical',
      alert_type: 'anomaly',
      message: 'Unusual memory consumption detected',
      created_date: new Date().toISOString(),
      metrics: {
        current_value: 85.5,
        baseline_value: 45.2,
        deviation_percentage: 89.2,
      },
    }),
  ];

  describe('Rendering', () => {
    it('should render empty state when no alerts', () => {
      const { getByText } = renderWithProviders(
        <AlertsPanel alerts={[]} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(getByText('No active alerts - All systems operating normally')).toBeInTheDocument();
    });

    it('should render alerts when provided', () => {
      const { getByText } = renderWithProviders(
        <AlertsPanel alerts={mockAlerts} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(getByText('High CPU Usage')).toBeInTheDocument();
      expect(getByText('Memory Spike Detected')).toBeInTheDocument();
    });

    it('should display alert message', () => {
      const { getByText } = renderWithProviders(
        <AlertsPanel alerts={mockAlerts} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(getByText('CPU usage is above threshold')).toBeInTheDocument();
      expect(getByText('Unusual memory consumption detected')).toBeInTheDocument();
    });

    it('should render correct number of alerts', () => {
      const { container } = renderWithProviders(
        <AlertsPanel alerts={mockAlerts} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      const alertCards = container.querySelectorAll('[class*="border-2"]');
      expect(alertCards).toHaveLength(mockAlerts.length);
    });
  });

  describe('Severity Indicators', () => {
    it('should display severity badge for each alert', () => {
      const { getByText } = renderWithProviders(
        <AlertsPanel alerts={mockAlerts} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(getByText('high')).toBeInTheDocument();
      expect(getByText('critical')).toBeInTheDocument();
    });

    it('should use correct icon color for critical severity', () => {
      const criticalAlert = [createMockAlert({ severity: 'critical' })];
      const { container } = renderWithProviders(
        <AlertsPanel alerts={criticalAlert} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      const icon = container.querySelector('.text-red-600');
      expect(icon).toBeInTheDocument();
    });

    it('should use correct icon color for high severity', () => {
      const highAlert = [createMockAlert({ severity: 'high' })];
      const { container } = renderWithProviders(
        <AlertsPanel alerts={highAlert} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      const icon = container.querySelector('.text-orange-600');
      expect(icon).toBeInTheDocument();
    });

    it('should use correct icon color for medium/low severity', () => {
      const mediumAlert = [createMockAlert({ severity: 'medium' })];
      const { container } = renderWithProviders(
        <AlertsPanel alerts={mediumAlert} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      const icon = container.querySelector('.text-yellow-600');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Alert Types', () => {
    it('should display alert type badge', () => {
      const { getByText } = renderWithProviders(
        <AlertsPanel alerts={mockAlerts} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(getByText('Performance')).toBeInTheDocument();
      expect(getByText('Anomaly')).toBeInTheDocument();
    });

    it('should handle different alert types', () => {
      const alerts = [
        createMockAlert({ alert_type: 'error_spike' }),
        createMockAlert({ alert_type: 'overload' }),
        createMockAlert({ alert_type: 'prediction' }),
      ];
      
      const { getByText } = renderWithProviders(
        <AlertsPanel alerts={alerts} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(getByText('Error Spike')).toBeInTheDocument();
      expect(getByText('Overload')).toBeInTheDocument();
      expect(getByText('Prediction')).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('should display metrics when provided', () => {
      const { getByText } = renderWithProviders(
        <AlertsPanel alerts={mockAlerts} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(getByText(/Current:/)).toBeInTheDocument();
      expect(getByText(/Baseline:/)).toBeInTheDocument();
      expect(getByText(/Change:/)).toBeInTheDocument();
    });

    it('should format metric values correctly', () => {
      const { getByText } = renderWithProviders(
        <AlertsPanel alerts={mockAlerts} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(getByText(/85\.50/)).toBeInTheDocument();
      expect(getByText(/45\.20/)).toBeInTheDocument();
      expect(getByText(/89\.2%/)).toBeInTheDocument();
    });

    it('should not render metrics section when metrics are absent', () => {
      const alertWithoutMetrics = [createMockAlert({ metrics: null })];
      const { queryByText } = renderWithProviders(
        <AlertsPanel alerts={alertWithoutMetrics} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(queryByText(/Current:/)).not.toBeInTheDocument();
    });
  });

  describe('AI Analysis', () => {
    it('should display AI analysis when provided', () => {
      const alertWithAnalysis = [
        createMockAlert({
          ai_analysis: 'This spike is likely caused by a recent deployment.',
        }),
      ];
      
      const { getByText } = renderWithProviders(
        <AlertsPanel alerts={alertWithAnalysis} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(getByText('AI Analysis:')).toBeInTheDocument();
      expect(getByText('This spike is likely caused by a recent deployment.')).toBeInTheDocument();
    });

    it('should not render AI analysis section when not provided', () => {
      const { queryByText } = renderWithProviders(
        <AlertsPanel alerts={mockAlerts} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(queryByText('AI Analysis:')).not.toBeInTheDocument();
    });
  });

  describe('Recommended Actions', () => {
    it('should display recommended actions when provided', () => {
      const alertWithActions = [
        createMockAlert({
          recommended_actions: [
            'Scale up resources',
            'Review recent deployments',
            'Check database performance',
          ],
        }),
      ];
      
      const { getByText } = renderWithProviders(
        <AlertsPanel alerts={alertWithActions} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(getByText('Recommended Actions:')).toBeInTheDocument();
      expect(getByText(/Scale up resources/)).toBeInTheDocument();
      expect(getByText(/Review recent deployments/)).toBeInTheDocument();
      expect(getByText(/Check database performance/)).toBeInTheDocument();
    });

    it('should not render actions section when empty', () => {
      const alertWithoutActions = [createMockAlert({ recommended_actions: [] })];
      
      const { queryByText } = renderWithProviders(
        <AlertsPanel alerts={alertWithoutActions} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(queryByText('Recommended Actions:')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onAcknowledge when acknowledge button is clicked', async () => {
      const handleAcknowledge = vi.fn();
      const user = userEvent.setup();
      
      const { getAllByText } = renderWithProviders(
        <AlertsPanel
          alerts={mockAlerts}
          onAcknowledge={handleAcknowledge}
          onResolve={vi.fn()}
        />
      );
      
      const acknowledgeButtons = getAllByText('Acknowledge');
      await user.click(acknowledgeButtons[0]);
      
      expect(handleAcknowledge).toHaveBeenCalledTimes(1);
      expect(handleAcknowledge).toHaveBeenCalledWith('1');
    });

    it('should call onResolve when resolve button is clicked', async () => {
      const handleResolve = vi.fn();
      const user = userEvent.setup();
      
      const { getAllByText } = renderWithProviders(
        <AlertsPanel
          alerts={mockAlerts}
          onAcknowledge={vi.fn()}
          onResolve={handleResolve}
        />
      );
      
      const resolveButtons = getAllByText('Resolve');
      await user.click(resolveButtons[0]);
      
      expect(handleResolve).toHaveBeenCalledTimes(1);
      expect(handleResolve).toHaveBeenCalledWith('1');
    });

    it('should call handlers with correct alert IDs for multiple alerts', async () => {
      const handleResolve = vi.fn();
      const user = userEvent.setup();
      
      const { getAllByText } = renderWithProviders(
        <AlertsPanel
          alerts={mockAlerts}
          onAcknowledge={vi.fn()}
          onResolve={handleResolve}
        />
      );
      
      const resolveButtons = getAllByText('Resolve');
      await user.click(resolveButtons[1]); // Click second alert's resolve button
      
      expect(handleResolve).toHaveBeenCalledWith('2');
    });
  });

  describe('Timestamp Display', () => {
    it('should display relative time for alerts', () => {
      const { getAllByText } = renderWithProviders(
        <AlertsPanel alerts={mockAlerts} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      // moment().fromNow() for current time will be "a few seconds ago"
      const timeElements = getAllByText(/ago/i);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle alert with all optional fields populated', () => {
      const complexAlert = [
        createMockAlert({
          metrics: {
            current_value: 95.5,
            baseline_value: 50.0,
            deviation_percentage: 91.0,
          },
          ai_analysis: 'Complex analysis text',
          recommended_actions: ['Action 1', 'Action 2', 'Action 3'],
        }),
      ];
      
      const { getByText } = renderWithProviders(
        <AlertsPanel alerts={complexAlert} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(getByText(/Current:/)).toBeInTheDocument();
      expect(getByText('AI Analysis:')).toBeInTheDocument();
      expect(getByText('Recommended Actions:')).toBeInTheDocument();
    });

    it('should handle alert with minimal data', () => {
      const minimalAlert = [
        createMockAlert({
          metrics: null,
          ai_analysis: null,
          recommended_actions: [],
        }),
      ];
      
      const { getByText, queryByText } = renderWithProviders(
        <AlertsPanel alerts={minimalAlert} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      expect(getByText('Test Alert')).toBeInTheDocument();
      expect(queryByText('AI Analysis:')).not.toBeInTheDocument();
      expect(queryByText('Recommended Actions:')).not.toBeInTheDocument();
    });

    it('should handle large number of alerts', () => {
      const manyAlerts = Array.from({ length: 10 }, (_, i) =>
        createMockAlert({ id: `alert-${i}`, title: `Alert ${i}` })
      );
      
      const { container } = renderWithProviders(
        <AlertsPanel alerts={manyAlerts} onAcknowledge={vi.fn()} onResolve={vi.fn()} />
      );
      
      const alertCards = container.querySelectorAll('[class*="border-2"]');
      expect(alertCards).toHaveLength(10);
    });

    it('should handle negative deviation percentage', () => {
      const alertWithNegativeDeviation = [
        createMockAlert({
          metrics: {
            current_value: 30.0,
            baseline_value: 50.0,
            deviation_percentage: -40.0,
          },
        }),
      ];
      
      const { container } = renderWithProviders(
        <AlertsPanel
          alerts={alertWithNegativeDeviation}
          onAcknowledge={vi.fn()}
          onResolve={vi.fn()}
        />
      );
      
      const greenText = container.querySelector('.text-green-600');
      expect(greenText).toBeInTheDocument();
    });
  });
});
