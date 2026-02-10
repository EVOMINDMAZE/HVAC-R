import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      <Header variant="landing" />
      <main className="py-16">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              404
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold">
              We could not find that page.
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              The link may have moved or the URL may be incorrect. Head back to
              the homepage to continue.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button asChild>
                <Link to="/">Return to home</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">Contact support</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
