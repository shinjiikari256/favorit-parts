import { CircleAlert } from "lucide-react";

import { Alert } from "./alert";
import { Button } from "./button";

/**
 * Сообщение об ошибке с необязательной кнопкой повтора.
 * @param {Omit<React.ComponentProps<typeof Alert>, "variant"> & {
 *   message?: React.ReactNode,
 *   hint?: React.ReactNode,
 *   onRetry?: () => void,
 *   retryLabel?: React.ReactNode,
 * }} props
 *   `message` — что случилось; `hint` — что исправить; `onRetry` — повторить (без него кнопки нет);
 *   `retryLabel` — подпись кнопки повтора (текст задаёт вызывающий код); `icon` по умолчанию `CircleAlert`; остальные пропсы уходят в {@link Alert}.
 * @returns {JSX.Element}
 */
export const ErrorAlert = ({
  icon = <CircleAlert />,
  message,
  hint,
  onRetry,
  retryLabel,
  action,
  children,
  ...props
}) => (
  <Alert
    variant="error"
    icon={icon}
    action={
      action ??
      (onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      ))
    }
    {...props}
  >
    {message && <p>{message}</p>}
    {hint && <p>{hint}</p>}
    {children}
  </Alert>
);
