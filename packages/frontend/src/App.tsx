import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import router from './routes';

function App() {
  return (
    <>
      <RouterProvider router={router} />;
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
