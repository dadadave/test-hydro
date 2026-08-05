import { render, screen } from '@testing-library/react';
import App from './App';

test('affiche le lanceur avec les modules disponibles', () => {
  render(<App />);
  expect(screen.getByText('Test Hydrostatique')).toBeInTheDocument();
  expect(screen.getByText('Test Fuite')).toBeInTheDocument();
});
