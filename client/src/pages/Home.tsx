import { Link } from 'react-router';

const Home = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <h1>Welcome to the Home Page</h1>
      <p>Nothing to see here yet</p>
      <Link
        to="/dashboard"
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default Home;
