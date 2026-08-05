import { render, screen } from '@testing-library/react';
import App from './App';

test("affiche l'écran de sélection de la machine", () => {
  render(<App />);
  const heading = screen.getByText(/Sélectionnez la machine/i);
  expect(heading).toBeInTheDocument();
});
