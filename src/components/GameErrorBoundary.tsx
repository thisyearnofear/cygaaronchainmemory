import { Component, ReactNode } from "react";
import { GameError } from "@/lib/contract";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class GameErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: false }; // Don't show error UI, just reset
  }

  public componentDidCatch(error: Error) {
    // Only log non-user-rejected errors
    const gameError = error as unknown as GameError;
    if (gameError.type !== "user_rejected") {
      console.error("Game error:", error);
    }
  }

  public render() {
    if (this.state.hasError) {
      return this.props.children; // Continue game even after error
    }

    return this.props.children;
  }
}

export default GameErrorBoundary;
