import { FaChurch } from "react-icons/fa";
import { Navigate, useLocation } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";

function UserRouteLoading() {
  return (
    <section className="grid min-h-[60vh] place-items-center bg-cream px-4 text-center">
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-navy text-gold shadow-soft">
          <FaChurch className="h-5 w-5" />
        </div>
        <p className="mt-4 font-display text-3xl font-bold text-navy">Checking your parish account...</p>
      </div>
    </section>
  );
}

function UserProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useUserAuth();

  if (isLoading) return <UserRouteLoading />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default UserProtectedRoute;
