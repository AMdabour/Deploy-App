import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './pages/ProtectedRoute';
import { routes } from './routes/routeConfig';

function App() {
  const renderRoute = (route: any, index: number) => {
    const Component = route.component;

    if (route.protected) {
      return (
        <Route
          key={index}
          path={route.path}
          element={
            <ProtectedRoute>
              <Component />
            </ProtectedRoute>
          }
        >
          {route.children?.map((child: any, childIndex: number) => (
            <Route
              key={childIndex}
              path={child.path}
              element={
                <ProtectedRoute>
                  <child.component />
                </ProtectedRoute>
              }
            />
          ))}
        </Route>
      );
    }

    return (
      <Route key={index} path={route.path} element={<Component />}>
        {route.children?.map((child: any, childIndex: number) => (
          <Route
            key={childIndex}
            path={child.path}
            element={<child.component />}
          />
        ))}
      </Route>
    );
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>{routes.map(renderRoute)}</Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
