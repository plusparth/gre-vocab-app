import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';

const mockSetMode = vi.fn();

describe('Sidebar', () => {
  it('renders expanded labels in wordbank mode', () => {
    render(<Sidebar activeMode="wordbank" onSetMode={mockSetMode} selectedCount={5} />);
    expect(screen.getByText('Flashcards')).toBeVisible();
    expect(screen.getByText('Match')).toBeVisible();
    expect(screen.getByText('Fill in Blank')).toBeVisible();
    expect(screen.getByText('Progress')).toBeVisible();
  });

  it('does not render text labels in quiz mode (icon rail)', () => {
    render(<Sidebar activeMode="flashcards" onSetMode={mockSetMode} selectedCount={5} />);
    expect(screen.queryByText('Flashcards')).toBeNull();
    expect(screen.queryByText('Fill in Blank')).toBeNull();
  });

  it('calls onSetMode when a nav item is clicked', async () => {
    render(<Sidebar activeMode="wordbank" onSetMode={mockSetMode} selectedCount={5} />);
    await userEvent.click(screen.getByRole('button', { name: /flashcards/i }));
    expect(mockSetMode).toHaveBeenCalledWith('flashcards');
  });

  it('shows selected word count in expanded mode', () => {
    render(<Sidebar activeMode="wordbank" onSetMode={mockSetMode} selectedCount={42} />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });
});
