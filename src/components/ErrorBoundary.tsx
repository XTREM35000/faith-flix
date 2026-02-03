import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: any, info: any) => void;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // report to console for now; could integrate Sentry/telemetry
    console.error('ErrorBoundary caught error:', error, errorInfo);
    try {
      if (typeof this.props.onError === 'function') this.props.onError(error, errorInfo);
    } catch (e) {
      console.error('ErrorBoundary.onError handler threw:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="p-3 bg-destructive/10 text-destructive rounded">Erreur lors du chargement du composant.</div>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
