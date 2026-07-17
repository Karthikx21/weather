import { Link } from 'wouter';
import { CloudOff } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <CloudOff className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-6xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
            404
          </h1>
          <p className="text-xl font-semibold mt-2">Page Not Found</p>
          <p className="text-muted-foreground mt-2 text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Link href="/">
          <span className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors cursor-pointer">
            Return to Dashboard
          </span>
        </Link>
      </div>
    </div>
  );
}
