import { Link } from 'react-router';
import Button from '../components/ui/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-lg mx-auto">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            {/* Large 404 Text with Enhanced Styling */}
            <h1 className="text-[12rem] md:text-[14rem] font-black text-primary/10 select-none leading-none">
              404
            </h1>

            {/* Glowing Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Enhanced Error Message */}
        <div className="mb-10 space-y-6">
          <div className="space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Oops! Lost in Space
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-gradient-start to-gradient-end mx-auto rounded-full"></div>
          </div>
          <p className="text-muted-foreground text-xl leading-relaxed max-w-md mx-auto">
            The page you are looking for doesn't exist or has been moved. Don't
            worry, we can help you find your way back.
          </p>
        </div>

        {/* Enhanced Suggestions Card */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-10 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-primary to-accent p-3 rounded-full">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-card-foreground mb-6">
            What's next?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-3 h-3 bg-gradient-to-r from-primary to-accent rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-card-foreground">
                  Check the URL
                </p>
                <p className="text-xs text-muted-foreground">
                  Make sure everything is spelled correctly
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-3 h-3 bg-gradient-to-r from-accent to-success rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-card-foreground">
                  Visit Homepage
                </p>
                <p className="text-xs text-muted-foreground">
                  Start fresh from the main page
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-3 h-3 bg-gradient-to-r from-success to-warning rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-card-foreground">
                  Browse Features
                </p>
                <p className="text-xs text-muted-foreground">
                  Explore what AI Schedule offers
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-3 h-3 bg-gradient-to-r from-warning to-info rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-card-foreground">
                  Get Support
                </p>
                <p className="text-xs text-muted-foreground">
                  We're here to help you
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="space-y-6">
          {/* Primary Action */}
          <Link to="/">
            <Button
              variant="gradient"
              size="xl"
              fullWidth={true}
              className="group relative overflow-hidden"
            >
              <div className="flex items-center justify-center">
                <svg
                  className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="text-lg font-semibold">Take me Home</span>
              </div>
            </Button>
          </Link>

          {/* Secondary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <Button
              variant="outline"
              size="lg"
              fullWidth={true}
              className="group hover:border-accent/80"
            >
              <svg
                className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Help
            </Button>

            <Button
              variant="outline"
              size="lg"
              fullWidth={true}
              className="group hover:border-success/50"
            >
              <svg
                className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Contact
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
