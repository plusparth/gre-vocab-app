import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';

const mockSetMode = vi.fn();

describe('Sidebar', () => {
  it('uses the study-desk navigation shell in word bank mode', () => {
    render(<Sidebar activeMode="wordbank" onSetMode={mockSetMode} selectedCount={5} />);
    expect(screen.getByRole('navigation')).toHaveClass('app-sidebar', 'app-sidebar--expanded');
    expect(screen.getByText('GRE Vocab')).toHaveClass('sidebar-brand');
  });

  it('uses a compact rail for quiz modes', () => {
    render(<Sidebar activeMode="flashcards" onSetMode={mockSetMode} selectedCount={5} />);
    expect(screen.getByRole('navigation')).toHaveClass('app-sidebar', 'app-sidebar--rail');
  });

  it('renders expanded labels in wordbank mode', () => {
    render(<Sidebar activeMode="wordbank" onSetMode={mockSetMode} selectedCount={5} />);
    expect(screen.getByText('Flashcards')).toBeVisible();
    expect(screen.getByText('Match')).toBeVisible();
    expect(screen.getByText('Fill in Blank')).toBeVisible();
    expect(screen.getByText('Progress')).toBeVisible();
  });

  it('visually hides text labels in quiz mode (icon rail)', () => {
    render(<Sidebar activeMode="flashcards" onSetMode={mockSetMode} selectedCount={5} />);
    expect(screen.getByRole('navigation')).toHaveClass('app-sidebar--rail');
    expect(screen.getByText('Flashcards')).toHaveClass('sidebar-nav-label');
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
