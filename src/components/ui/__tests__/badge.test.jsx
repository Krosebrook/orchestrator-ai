import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/utils/test-utils';
import { Badge } from '../badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      const { getByText } = renderWithProviders(<Badge>Default Badge</Badge>);
      
      expect(getByText('Default Badge')).toBeInTheDocument();
    });

    it('should render with children text', () => {
      const { getByText } = renderWithProviders(<Badge>Status: Active</Badge>);
      
      expect(getByText('Status: Active')).toBeInTheDocument();
    });

    it('should render as div element', () => {
      const { container } = renderWithProviders(<Badge>Badge</Badge>);
      const badge = container.firstChild;
      
      expect(badge?.tagName).toBe('DIV');
    });

    it('should apply custom className', () => {
      const { container } = renderWithProviders(
        <Badge className="custom-badge">Badge</Badge>
      );
      const badge = container.firstChild;
      
      expect(badge).toHaveClass('custom-badge');
    });
  });

  describe('Variants', () => {
    it('should apply default variant styles', () => {
      const { container } = renderWithProviders(
        <Badge variant="default">Default</Badge>
      );
      const badge = container.firstChild;
      
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should apply secondary variant styles', () => {
      const { container } = renderWithProviders(
        <Badge variant="secondary">Secondary</Badge>
      );
      const badge = container.firstChild;
      
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('should apply destructive variant styles', () => {
      const { container } = renderWithProviders(
        <Badge variant="destructive">Destructive</Badge>
      );
      const badge = container.firstChild;
      
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('should apply outline variant styles', () => {
      const { container } = renderWithProviders(
        <Badge variant="outline">Outline</Badge>
      );
      const badge = container.firstChild;
      
      expect(badge).toHaveClass('text-foreground');
      expect(badge).not.toHaveClass('border-transparent');
    });

    it('should use default variant when no variant specified', () => {
      const { container } = renderWithProviders(<Badge>No Variant</Badge>);
      const badge = container.firstChild;
      
      expect(badge).toHaveClass('bg-primary');
    });
  });

  describe('Base Styles', () => {
    it('should always have core badge styles', () => {
      const { container } = renderWithProviders(<Badge>Badge</Badge>);
      const badge = container.firstChild;
      
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-md',
        'border',
        'text-xs',
        'font-semibold'
      );
    });

    it('should have focus ring styles', () => {
      const { container } = renderWithProviders(<Badge>Badge</Badge>);
      const badge = container.firstChild;
      
      expect(badge).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should have transition styles', () => {
      const { container } = renderWithProviders(<Badge>Badge</Badge>);
      const badge = container.firstChild;
      
      expect(badge).toHaveClass('transition-colors');
    });

    it('should have proper padding', () => {
      const { container } = renderWithProviders(<Badge>Badge</Badge>);
      const badge = container.firstChild;
      
      expect(badge).toHaveClass('px-2.5', 'py-0.5');
    });
  });

  describe('Content', () => {
    it('should render text content', () => {
      const { getByText } = renderWithProviders(<Badge>Text Badge</Badge>);
      
      expect(getByText('Text Badge')).toBeInTheDocument();
    });

    it('should render with numbers', () => {
      const { getByText } = renderWithProviders(<Badge>42</Badge>);
      
      expect(getByText('42')).toBeInTheDocument();
    });

    it('should render with React elements as children', () => {
      const { getByText, container } = renderWithProviders(
        <Badge>
          <span>Icon</span> Text
        </Badge>
      );
      
      expect(getByText('Icon')).toBeInTheDocument();
      expect(container.textContent).toContain('Text');
    });

    it('should handle empty badge', () => {
      const { container } = renderWithProviders(<Badge />);
      const badge = container.firstChild;
      
      expect(badge).toBeInTheDocument();
      expect(badge).toBeEmptyDOMElement();
    });
  });

  describe('Multiple Badges', () => {
    it('should render multiple badges independently', () => {
      const { getByText } = renderWithProviders(
        <div>
          <Badge variant="default">Active</Badge>
          <Badge variant="secondary">Pending</Badge>
          <Badge variant="destructive">Error</Badge>
        </div>
      );
      
      expect(getByText('Active')).toBeInTheDocument();
      expect(getByText('Pending')).toBeInTheDocument();
      expect(getByText('Error')).toBeInTheDocument();
    });

    it('should maintain independent styles for each badge', () => {
      const { container } = renderWithProviders(
        <div>
          <Badge variant="default">Badge 1</Badge>
          <Badge variant="outline">Badge 2</Badge>
        </div>
      );
      
      const badges = container.querySelectorAll('.inline-flex');
      expect(badges).toHaveLength(2);
      expect(badges[0]).toHaveClass('bg-primary');
      expect(badges[1]).toHaveClass('text-foreground');
    });
  });

  describe('Custom Styling', () => {
    it('should merge custom classes with default styles', () => {
      const { container } = renderWithProviders(
        <Badge className="bg-blue-500 text-white">Custom</Badge>
      );
      const badge = container.firstChild;
      
      expect(badge).toHaveClass('bg-blue-500', 'text-white');
      expect(badge).toHaveClass('inline-flex'); // Still has base styles
    });

    it('should allow style overrides via className', () => {
      const { container } = renderWithProviders(
        <Badge className="px-4 py-2 text-base">Large Badge</Badge>
      );
      const badge = container.firstChild;
      
      expect(badge).toHaveClass('px-4', 'py-2', 'text-base');
    });

    it('should support multiple custom classes', () => {
      const { container } = renderWithProviders(
        <Badge className="ml-2 mr-2 mt-1">Badge</Badge>
      );
      const badge = container.firstChild;
      
      expect(badge).toHaveClass('ml-2', 'mr-2', 'mt-1');
    });
  });

  describe('Accessibility', () => {
    it('should accept aria-label', () => {
      const { container } = renderWithProviders(
        <Badge aria-label="Status badge">Active</Badge>
      );
      const badge = container.firstChild;
      
      expect(badge).toHaveAttribute('aria-label', 'Status badge');
    });

    it('should accept role attribute', () => {
      const { container } = renderWithProviders(
        <Badge role="status">Processing</Badge>
      );
      const badge = container.firstChild;
      
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('should accept data attributes', () => {
      const { container } = renderWithProviders(
        <Badge data-testid="status-badge" data-status="active">
          Active
        </Badge>
      );
      const badge = container.firstChild;
      
      expect(badge).toHaveAttribute('data-testid', 'status-badge');
      expect(badge).toHaveAttribute('data-status', 'active');
    });
  });

  describe('Use Cases', () => {
    it('should work as status indicator', () => {
      const { getByText } = renderWithProviders(
        <Badge variant="default">Online</Badge>
      );
      
      expect(getByText('Online')).toBeInTheDocument();
    });

    it('should work as count badge', () => {
      const { getByText } = renderWithProviders(
        <Badge variant="secondary">5 new</Badge>
      );
      
      expect(getByText('5 new')).toBeInTheDocument();
    });

    it('should work as tag', () => {
      const { getByText } = renderWithProviders(
        <Badge variant="outline">React</Badge>
      );
      
      expect(getByText('React')).toBeInTheDocument();
    });

    it('should work as severity indicator', () => {
      const { getByText } = renderWithProviders(
        <Badge variant="destructive">Critical</Badge>
      );
      
      expect(getByText('Critical')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text', () => {
      const longText = 'A'.repeat(100);
      const { getByText } = renderWithProviders(<Badge>{longText}</Badge>);
      
      expect(getByText(longText)).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      const { getByText } = renderWithProviders(
        <Badge>{"<Special> & 'Characters'"}</Badge>
      );
      
      expect(getByText("<Special> & 'Characters'")).toBeInTheDocument();
    });

    it('should handle zero as content', () => {
      const { getByText } = renderWithProviders(<Badge>0</Badge>);
      
      expect(getByText('0')).toBeInTheDocument();
    });

    it('should handle boolean false (renders nothing)', () => {
      const { container } = renderWithProviders(<Badge>{false}</Badge>);
      const badge = container.firstChild;
      
      expect(badge).toBeEmptyDOMElement();
    });

    it('should handle null children', () => {
      const { container } = renderWithProviders(<Badge>{null}</Badge>);
      const badge = container.firstChild;
      
      expect(badge).toBeEmptyDOMElement();
    });

    it('should handle undefined children', () => {
      const { container } = renderWithProviders(<Badge>{undefined}</Badge>);
      const badge = container.firstChild;
      
      expect(badge).toBeEmptyDOMElement();
    });
  });

  describe('Integration with other components', () => {
    it('should work within buttons', () => {
      const { getByText, getByRole } = renderWithProviders(
        <button>
          Messages <Badge>3</Badge>
        </button>
      );
      
      expect(getByRole('button')).toBeInTheDocument();
      expect(getByText('3')).toBeInTheDocument();
    });

    it('should work in lists', () => {
      const { getAllByText } = renderWithProviders(
        <ul>
          <li>
            <Badge>Item 1</Badge>
          </li>
          <li>
            <Badge>Item 2</Badge>
          </li>
        </ul>
      );
      
      expect(getAllByText(/Item/)).toHaveLength(2);
    });
  });
});
