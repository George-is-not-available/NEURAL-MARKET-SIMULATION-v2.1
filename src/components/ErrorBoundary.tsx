import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 border-2 border-red-400 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-red-400 text-2xl">⚠</span>
              </div>
              <h2 className="text-xl font-bold text-red-300 mb-4">应用程序错误</h2>
              <p className="text-red-200 mb-4">
                抱歉，应用程序遇到了一个错误。请刷新页面重试。
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-300 px-4 py-2 rounded transition-all duration-300"
              >
                刷新页面
              </button>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left">
                  <summary className="text-red-300 cursor-pointer">错误详情</summary>
                  <pre className="mt-2 text-xs text-red-200 bg-red-900/20 p-2 rounded overflow-auto">
                    {this.state.error?.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}