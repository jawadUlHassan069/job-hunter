// src/components/ErrorBoundary.jsx
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="text-red-400 text-sm p-4 border border-red-500/30 rounded-lg">
          Component error: {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}