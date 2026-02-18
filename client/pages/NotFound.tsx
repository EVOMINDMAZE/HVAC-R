import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, HelpCircle } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { PublicPageShell } from "@/components/public/PublicPageShell";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PublicPageShell mainClassName="py-16">
      <PageContainer>
        <div className="notfound-page">
          <div className="notfound-page__icon">
            <Search className="w-16 h-16" />
          </div>

          <div className="notfound-page__code">404</div>

          <h1 className="notfound-page__title">Page not found</h1>

          <p className="notfound-page__description">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>

          <div className="notfound-page__path">
            <code>{location.pathname}</code>
          </div>

          <div className="notfound-page__actions">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/contact">
                <HelpCircle className="w-4 h-4 mr-2" />
                Contact Support
              </Link>
            </Button>
          </div>

          <div className="notfound-page__suggestions">
            <p className="notfound-page__suggestions-title">Popular pages:</p>
            <div className="notfound-page__suggestions-list">
              <Link to="/dashboard" className="notfound-page__suggestion">Dashboard</Link>
              <Link to="/pricing" className="notfound-page__suggestion">Pricing</Link>
              <Link to="/features" className="notfound-page__suggestion">Features</Link>
              <Link to="/signup" className="notfound-page__suggestion">Sign Up</Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </PublicPageShell>
  );
};

export default NotFound;