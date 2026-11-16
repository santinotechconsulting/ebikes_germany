import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Ein unerwarteter Fehler ist aufgetreten.' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8">
            <h1 className="text-xl font-bold text-[#171C22]">
              Anwendungsfehler / Application Error
            </h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Seite neu oder kehren Sie zur Startseite zurück.
            </p>
            <p className="mt-3 text-xs font-mono bg-[#F4F6F8] text-slate-700 p-3 rounded-lg overflow-auto max-h-40">
              {this.state.message}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => window.location.assign('/')}
                className="px-4 py-2.5 text-sm font-medium bg-[#171C22] text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Zur Startseite
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 text-sm font-medium border border-slate-300 text-[#171C22] rounded-lg hover:bg-slate-50 transition-colors"
              >
                Neu laden
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
