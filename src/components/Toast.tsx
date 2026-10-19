type ToastProps = {
  message: string;
  type?: "success" | "error";
};

export default function Toast({
  message,
  type = "success",
}: ToastProps) {
  if (!message) {
    return null;
  }

  return <div className={`toast ${type}`}>{message}</div>;
}
