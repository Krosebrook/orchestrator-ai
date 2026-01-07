import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/utils/test-utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render with default props', () => {
      const { container } = renderWithProviders(<Card>Content</Card>);
      const card = container.firstChild;
      
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Content');
    });

    it('should apply default styles', () => {
      const { container } = renderWithProviders(<Card>Content</Card>);
      const card = container.firstChild;
      
      expect(card).toHaveClass('rounded-xl', 'border', 'bg-card', 'shadow');
    });

    it('should accept custom className', () => {
      const { container } = renderWithProviders(
        <Card className="custom-class">Content</Card>
      );
      const card = container.firstChild;
      
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('rounded-xl'); // Should still have default classes
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      renderWithProviders(<Card ref={ref}>Content</Card>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardHeader', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithProviders(
        <CardHeader>Header Content</CardHeader>
      );
      const header = container.firstChild;
      
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent('Header Content');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('should accept custom className', () => {
      const { container } = renderWithProviders(
        <CardHeader className="custom-header">Header</CardHeader>
      );
      const header = container.firstChild;
      
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithProviders(
        <CardTitle>Title Text</CardTitle>
      );
      const title = container.firstChild;
      
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Title Text');
      expect(title).toHaveClass('font-semibold', 'leading-none', 'tracking-tight');
    });

    it('should accept custom className', () => {
      const { container } = renderWithProviders(
        <CardTitle className="text-2xl">Title</CardTitle>
      );
      const title = container.firstChild;
      
      expect(title).toHaveClass('text-2xl');
    });
  });

  describe('CardDescription', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithProviders(
        <CardDescription>Description text</CardDescription>
      );
      const description = container.firstChild;
      
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('Description text');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('should accept custom className', () => {
      const { container } = renderWithProviders(
        <CardDescription className="text-base">Description</CardDescription>
      );
      const description = container.firstChild;
      
      expect(description).toHaveClass('text-base');
    });
  });

  describe('CardContent', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithProviders(
        <CardContent>Content text</CardContent>
      );
      const content = container.firstChild;
      
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Content text');
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('should accept custom className', () => {
      const { container } = renderWithProviders(
        <CardContent className="custom-content">Content</CardContent>
      );
      const content = container.firstChild;
      
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('CardFooter', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithProviders(
        <CardFooter>Footer content</CardFooter>
      );
      const footer = container.firstChild;
      
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent('Footer content');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('should accept custom className', () => {
      const { container } = renderWithProviders(
        <CardFooter className="justify-end">Footer</CardFooter>
      );
      const footer = container.firstChild;
      
      expect(footer).toHaveClass('justify-end');
    });
  });

  describe('Full Card Composition', () => {
    it('should render complete card with all components', () => {
      const { container, getByText } = renderWithProviders(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Test content paragraph</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );
      
      expect(getByText('Test Title')).toBeInTheDocument();
      expect(getByText('Test Description')).toBeInTheDocument();
      expect(getByText('Test content paragraph')).toBeInTheDocument();
      expect(getByText('Action')).toBeInTheDocument();
    });

    it('should render card without optional components', () => {
      const { getByText } = renderWithProviders(
        <Card>
          <CardContent>Just content</CardContent>
        </Card>
      );
      
      expect(getByText('Just content')).toBeInTheDocument();
    });

    it('should handle nested elements correctly', () => {
      const { getByRole, getByText } = renderWithProviders(
        <Card>
          <CardHeader>
            <CardTitle>Form Card</CardTitle>
          </CardHeader>
          <CardContent>
            <input type="text" placeholder="Enter text" />
          </CardContent>
          <CardFooter>
            <button>Submit</button>
          </CardFooter>
        </Card>
      );
      
      expect(getByText('Form Card')).toBeInTheDocument();
      expect(getByRole('textbox')).toBeInTheDocument();
      expect(getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty card', () => {
      const { container } = renderWithProviders(<Card />);
      const card = container.firstChild;
      
      expect(card).toBeInTheDocument();
      expect(card).toBeEmptyDOMElement();
    });

    it('should handle multiple children in CardContent', () => {
      const { getByText } = renderWithProviders(
        <CardContent>
          <p>First paragraph</p>
          <p>Second paragraph</p>
          <p>Third paragraph</p>
        </CardContent>
      );
      
      expect(getByText('First paragraph')).toBeInTheDocument();
      expect(getByText('Second paragraph')).toBeInTheDocument();
      expect(getByText('Third paragraph')).toBeInTheDocument();
    });

    it('should accept additional HTML attributes', () => {
      const { container } = renderWithProviders(
        <Card data-testid="test-card" aria-label="Test card">
          Content
        </Card>
      );
      const card = container.firstChild;
      
      expect(card).toHaveAttribute('data-testid', 'test-card');
      expect(card).toHaveAttribute('aria-label', 'Test card');
    });

    it('should handle CardFooter with multiple buttons', () => {
      const { getByText } = renderWithProviders(
        <CardFooter>
          <button>Cancel</button>
          <button>Save</button>
          <button>Submit</button>
        </CardFooter>
      );
      
      expect(getByText('Cancel')).toBeInTheDocument();
      expect(getByText('Save')).toBeInTheDocument();
      expect(getByText('Submit')).toBeInTheDocument();
    });
  });
});
