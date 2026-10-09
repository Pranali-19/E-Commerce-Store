
const Badge = ({
  children,
  variant = "default",
}) => {
  const styles = {
    default:
      "bg-gray-100 text-gray-700",

    success:
      "bg-green-100 text-green-700",

    danger:
      "bg-red-100 text-red-700",

    warning:
      "bg-yellow-100 text-yellow-700",

    dark:
      "bg-black text-white",
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full
        px-3 py-1 text-xs font-semibold
        ${styles[variant]}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;