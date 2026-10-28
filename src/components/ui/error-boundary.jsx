import { Component } from "react";

/**
 * Ловит ошибки рендера, чтобы вместо белого экрана показать запасной экран.
 * @extends {Component<{
 *   children: React.ReactNode,
 *   fallback?: React.ReactNode | ((ctx: { error: Error, reset: () => void }) => React.ReactNode),
 *   onError?: (error: Error, info: React.ErrorInfo) => void,
 * }, { error: Error | null }>}
 *   `fallback` — узел или функция запасного экрана (без него при ошибке не рисуется ничего); `onError` — свой обработчик вместо `console.error`.
 */
export class ErrorBoundary extends Component {
  state = { error: null };

  /**
   * @param {Error} error Пойманная ошибка.
   * @returns {{ error: Error }} Переводит границу в состояние ошибки.
   */
  static getDerivedStateFromError(error) {
    return { error };
  }

  /**
   * Передаёт ошибку обработчику или логирует её в консоль.
   * @param {Error} error Пойманная ошибка.
   * @param {React.ErrorInfo} info Стек компонентов.
   */
  componentDidCatch(error, info) {
    if (this.props.onError) return this.props.onError(error, info);
    // eslint-disable-next-line no-console
    console.error("UI error:", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;
    if (!error) return children;

    if (typeof fallback === "function") return fallback({ error, reset: this.reset });
    return fallback ?? null;
  }
}
