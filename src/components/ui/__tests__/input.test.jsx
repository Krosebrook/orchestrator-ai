import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, userEvent } from '@/utils/test-utils';
import { Input } from '../input';

describe('Input', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      const { getByRole } = renderWithProviders(<Input />);
      const input = getByRole('textbox');
      
      expect(input).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input placeholder="Enter text here" />
      );
      
      expect(getByPlaceholderText('Enter text here')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { getByRole } = renderWithProviders(
        <Input className="custom-input" />
      );
      const input = getByRole('textbox');
      
      expect(input).toHaveClass('custom-input');
      // Should still have default classes
      expect(input).toHaveClass('rounded-md', 'border');
    });

    it('should render with default value', () => {
      const { getByRole } = renderWithProviders(
        <Input defaultValue="Initial value" />
      );
      const input = getByRole('textbox');
      
      expect(input).toHaveValue('Initial value');
    });
  });

  describe('Input Types', () => {
    it('should render as text input by default', () => {
      const { getByRole } = renderWithProviders(<Input />);
      const input = getByRole('textbox');
      
      // Input defaults to text type (browser default), may not have explicit attribute
      expect(input).toBeInTheDocument();
    });

    it('should render as password input', () => {
      const { container } = renderWithProviders(<Input type="password" />);
      const input = container.querySelector('input[type="password"]');
      
      expect(input).toBeInTheDocument();
    });

    it('should render as email input', () => {
      const { container } = renderWithProviders(<Input type="email" />);
      const input = container.querySelector('input[type="email"]');
      
      expect(input).toBeInTheDocument();
    });

    it('should render as number input', () => {
      const { container } = renderWithProviders(<Input type="number" />);
      const input = container.querySelector('input[type="number"]');
      
      expect(input).toBeInTheDocument();
    });

    it('should render as search input', () => {
      const { getByRole } = renderWithProviders(<Input type="search" />);
      const input = getByRole('searchbox');
      
      expect(input).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithProviders(<Input />);
      const input = getByRole('textbox');
      
      await user.type(input, 'Hello World');
      
      expect(input).toHaveValue('Hello World');
    });

    it('should call onChange handler', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      const { getByRole } = renderWithProviders(
        <Input onChange={handleChange} />
      );
      const input = getByRole('textbox');
      
      await user.type(input, 'A');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should handle onFocus event', async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();
      const { getByRole } = renderWithProviders(
        <Input onFocus={handleFocus} />
      );
      const input = getByRole('textbox');
      
      await user.click(input);
      
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should handle onBlur event', async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      const { getByRole } = renderWithProviders(
        <Input onBlur={handleBlur} />
      );
      const input = getByRole('textbox');
      
      await user.click(input);
      await user.tab(); // Move focus away
      
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle clearing input', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithProviders(
        <Input defaultValue="Clear me" />
      );
      const input = getByRole('textbox');
      
      await user.clear(input);
      
      expect(input).toHaveValue('');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      const { getByRole } = renderWithProviders(<Input disabled />);
      const input = getByRole('textbox');
      
      expect(input).toBeDisabled();
    });

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithProviders(<Input disabled />);
      const input = getByRole('textbox');
      
      await user.type(input, 'Should not work');
      
      expect(input).toHaveValue('');
    });

    it('should have disabled cursor style when disabled', () => {
      const { getByRole } = renderWithProviders(<Input disabled />);
      const input = getByRole('textbox');
      
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref correctly', () => {
      const ref = { current: null };
      renderWithProviders(<Input ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should allow focusing via ref', () => {
      const ref = { current: null };
      renderWithProviders(<Input ref={ref} />);
      
      ref.current?.focus();
      
      expect(ref.current).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      const { getByRole } = renderWithProviders(
        <Input aria-label="Username input" />
      );
      const input = getByRole('textbox', { name: 'Username input' });
      
      expect(input).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      const { getByRole } = renderWithProviders(
        <Input aria-describedby="helper-text" />
      );
      const input = getByRole('textbox');
      
      expect(input).toHaveAttribute('aria-describedby', 'helper-text');
    });

    it('should support aria-invalid for error states', () => {
      const { getByRole } = renderWithProviders(
        <Input aria-invalid="true" />
      );
      const input = getByRole('textbox');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should support required attribute', () => {
      const { getByRole } = renderWithProviders(<Input required />);
      const input = getByRole('textbox');
      
      expect(input).toBeRequired();
    });
  });

  describe('Validation', () => {
    it('should support min and max attributes for number input', () => {
      const { container } = renderWithProviders(
        <Input type="number" min="0" max="100" />
      );
      const input = container.querySelector('input[type="number"]');
      
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });

    it('should support pattern attribute', () => {
      const { getByRole } = renderWithProviders(
        <Input pattern="[0-9]{3}" />
      );
      const input = getByRole('textbox');
      
      expect(input).toHaveAttribute('pattern', '[0-9]{3}');
    });

    it('should support maxLength attribute', () => {
      const { getByRole } = renderWithProviders(
        <Input maxLength={10} />
      );
      const input = getByRole('textbox');
      
      expect(input).toHaveAttribute('maxLength', '10');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string value', () => {
      const { getByRole } = renderWithProviders(<Input value="" onChange={vi.fn()} />);
      const input = getByRole('textbox');
      
      expect(input).toHaveValue('');
    });

    it('should handle very long placeholder', () => {
      const longPlaceholder = 'A'.repeat(100);
      const { getByPlaceholderText } = renderWithProviders(
        <Input placeholder={longPlaceholder} />
      );
      
      expect(getByPlaceholderText(longPlaceholder)).toBeInTheDocument();
    });

    it('should accept additional HTML attributes', () => {
      const { getByRole } = renderWithProviders(
        <Input data-testid="custom-input" name="username" id="user-input" />
      );
      const input = getByRole('textbox');
      
      expect(input).toHaveAttribute('data-testid', 'custom-input');
      expect(input).toHaveAttribute('name', 'username');
      expect(input).toHaveAttribute('id', 'user-input');
    });

    it('should handle readonly state', () => {
      const { getByRole } = renderWithProviders(<Input readOnly value="Readonly" />);
      const input = getByRole('textbox');
      
      expect(input).toHaveAttribute('readonly');
    });

    it('should support autoComplete attribute', () => {
      const { getByRole } = renderWithProviders(
        <Input autoComplete="username" />
      );
      const input = getByRole('textbox');
      
      expect(input).toHaveAttribute('autoComplete', 'username');
    });
  });

  describe('File Input', () => {
    it('should render file input type', () => {
      const { container } = renderWithProviders(<Input type="file" />);
      const input = container.querySelector('input[type="file"]');
      
      expect(input).toBeInTheDocument();
    });

    it('should apply file-specific styles', () => {
      const { container } = renderWithProviders(<Input type="file" />);
      const input = container.querySelector('input[type="file"]');
      
      expect(input).toHaveClass('file:border-0', 'file:bg-transparent');
    });
  });
});
