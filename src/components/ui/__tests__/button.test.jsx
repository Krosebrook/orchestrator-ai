import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, userEvent } from '@/utils/test-utils';
import { Button } from '../button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      const { getByRole } = renderWithProviders(<Button>Click me</Button>);
      const button = getByRole('button');
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
    });

    it('should render with custom className', () => {
      const { getByRole } = renderWithProviders(
        <Button className="custom-class">Button</Button>
      );
      const button = getByRole('button');
      
      expect(button).toHaveClass('custom-class');
    });

    it('should render as child component when asChild is true', () => {
      const { container } = renderWithProviders(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      const link = container.querySelector('a');
      
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('Variants', () => {
    it('should apply default variant styles', () => {
      const { getByRole } = renderWithProviders(
        <Button variant="default">Default</Button>
      );
      const button = getByRole('button');
      
      expect(button).toHaveClass('bg-primary');
    });

    it('should apply destructive variant styles', () => {
      const { getByRole } = renderWithProviders(
        <Button variant="destructive">Delete</Button>
      );
      const button = getByRole('button');
      
      expect(button).toHaveClass('bg-destructive');
    });

    it('should apply outline variant styles', () => {
      const { getByRole } = renderWithProviders(
        <Button variant="outline">Outline</Button>
      );
      const button = getByRole('button');
      
      expect(button).toHaveClass('border');
    });

    it('should apply ghost variant styles', () => {
      const { getByRole } = renderWithProviders(
        <Button variant="ghost">Ghost</Button>
      );
      const button = getByRole('button');
      
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('should apply link variant styles', () => {
      const { getByRole } = renderWithProviders(
        <Button variant="link">Link</Button>
      );
      const button = getByRole('button');
      
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('should apply default size styles', () => {
      const { getByRole } = renderWithProviders(
        <Button size="default">Default Size</Button>
      );
      const button = getByRole('button');
      
      expect(button).toHaveClass('h-9');
    });

    it('should apply small size styles', () => {
      const { getByRole } = renderWithProviders(
        <Button size="sm">Small</Button>
      );
      const button = getByRole('button');
      
      expect(button).toHaveClass('h-8');
    });

    it('should apply large size styles', () => {
      const { getByRole } = renderWithProviders(
        <Button size="lg">Large</Button>
      );
      const button = getByRole('button');
      
      expect(button).toHaveClass('h-10');
    });

    it('should apply icon size styles', () => {
      const { getByRole } = renderWithProviders(
        <Button size="icon" aria-label="Icon button">
          X
        </Button>
      );
      const button = getByRole('button');
      
      expect(button).toHaveClass('h-9', 'w-9');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      const { getByRole } = renderWithProviders(
        <Button onClick={handleClick}>Click me</Button>
      );
      const button = getByRole('button');
      
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      const { getByRole } = renderWithProviders(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );
      const button = getByRole('button');
      
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should be disabled when disabled prop is true', () => {
      const { getByRole } = renderWithProviders(
        <Button disabled>Disabled</Button>
      );
      const button = getByRole('button');
      
      expect(button).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have button role by default', () => {
      const { getByRole } = renderWithProviders(<Button>Button</Button>);
      
      expect(getByRole('button')).toBeInTheDocument();
    });

    it('should support custom aria-label', () => {
      const { getByRole } = renderWithProviders(
        <Button aria-label="Custom label">Icon</Button>
      );
      const button = getByRole('button', { name: 'Custom label' });
      
      expect(button).toBeInTheDocument();
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      renderWithProviders(<Button ref={ref}>Button</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      const { getByRole } = renderWithProviders(<Button></Button>);
      const button = getByRole('button');
      
      expect(button).toBeInTheDocument();
      expect(button).toBeEmptyDOMElement();
    });

    it('should handle multiple class names', () => {
      const { getByRole } = renderWithProviders(
        <Button className="class1 class2 class3">Button</Button>
      );
      const button = getByRole('button');
      
      expect(button).toHaveClass('class1', 'class2', 'class3');
    });

    it('should accept and apply additional HTML attributes', () => {
      const { getByRole } = renderWithProviders(
        <Button data-testid="custom-button" title="Tooltip">
          Button
        </Button>
      );
      const button = getByRole('button');
      
      expect(button).toHaveAttribute('data-testid', 'custom-button');
      expect(button).toHaveAttribute('title', 'Tooltip');
    });
  });
});
