import Navigation from "./src/Navigation";
import { startEmailChecker } from "./src/services/emailChecker";
import * as React from 'react';

export default function App() {
  React.useEffect(() => {
    setTimeout(() => {
      startEmailChecker();
    }, 5000);
  }, []);

  return <Navigation />;
}
